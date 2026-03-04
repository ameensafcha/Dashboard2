import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
// Env is loaded via next/tsx or injected

const prisma = new PrismaClient()

// Admin client to fetch user by email
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    const email = 'admin@mail.com'
    console.log(`Checking Supabase for user: ${email}`)

    // Find user in Supabase
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) {
        console.error('Error fetching Supabase users:', error)
        return
    }

    const user = users.find(u => u.email === email)
    if (!user) {
        console.error(`User ${email} not found in Supabase Auth! Please login or sign up first.`)
        return
    }

    console.log(`Found user in Supabase with ID: ${user.id}`)

    // 1. Get Safcha business
    const business = await prisma.business.findUnique({ where: { slug: 'safcha' } })
    if (!business) {
        console.error('Safcha business not found in DB! Seed the DB first.')
        return
    }

    // 2. Get OWNER role
    const ownerRole = await prisma.role.findUnique({
        where: { businessId_name: { businessId: business.id, name: 'OWNER' } }
    })
    if (!ownerRole) {
        console.error('OWNER role not found for Safcha business!')
        return
    }

    // 3. Upsert BusinessUser explicitly for THIS Supabase user ID
    const businessUser = await prisma.businessUser.upsert({
        where: {
            businessId_userId: { businessId: business.id, userId: user.id }
        },
        update: {
            roleId: ownerRole.id, // Ensure they are OWNER
            isActive: true,
            email: email,
            name: 'Admin'
        },
        create: {
            businessId: business.id,
            userId: user.id,
            email: email,
            name: 'Admin',
            roleId: ownerRole.id,
            isActive: true
        }
    })

    console.log(`Successfully linked ${email} to Safcha business as OWNER! ID: ${businessUser.id}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
