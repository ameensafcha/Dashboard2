import { PrismaClient } from '@prisma/client'
import { MODULES_CONFIG } from '../lib/permissions-config'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Safcha Database...')
    // 1. Create default Safcha business
    let business = await prisma.business.findUnique({ where: { slug: 'safcha' } })
    if (!business) {
        business = await prisma.business.create({
            data: { name: 'Safcha', slug: 'safcha', currency: 'SAR', timezone: 'Asia/Riyadh' }
        })
    }

    // 2. Create ADMIN role with isSystem=true
    let adminRole = await prisma.role.findUnique({
        where: { businessId_name: { businessId: business.id, name: 'ADMIN' } }
    })

    if (!adminRole) {
        adminRole = await prisma.role.create({
            data: { businessId: business.id, name: 'ADMIN', isSystem: true, color: '#C9A84C' }
        })
    }

    // 3. Create ALL permissions for OWNER
    console.log('Generating owner permissions...')
    const existingPermsCount = await prisma.rolePermission.count({ where: { roleId: adminRole.id } });
    if (existingPermsCount === 0) {
        const allPerms = []
        for (const mod of MODULES_CONFIG) {
            for (const action of mod.actions) {
                allPerms.push({ roleId: adminRole.id, module: mod.key, action })
            }
        }
        await prisma.rolePermission.createMany({ data: allPerms })
    }

    // 4. Create BusinessUser for Aziz
    const AZIZ_SUPABASE_USER_ID = process.env.OWNER_USER_ID || '1' // fallback if not provided yet
    const existingUser = await prisma.businessUser.findUnique({
        where: { businessId_userId: { businessId: business.id, userId: AZIZ_SUPABASE_USER_ID } }
    });

    if (!existingUser) {
        await prisma.businessUser.create({
            data: {
                businessId: business.id,
                userId: AZIZ_SUPABASE_USER_ID,
                email: 'aziz@safcha.com',
                name: 'Aziz',
                roleId: adminRole.id,
                isActive: true,
            }
        })
    }

    // 5. Update ALL existing records with businessId
    console.log('Updating existing records with businessId...')

    const modelsToUpdate = [
        'category', 'product', 'pricingTier', 'companyPricingTier', 'supplier',
        'productionBatch', 'batchItem', 'qualityCheck', 'rndProject', 'systemSettings',
        'company', 'client', 'deal', 'order', 'orderItem', 'invoice',
        'rawMaterial', 'finishedProduct', 'stockMovement',
        'transaction', 'expense'
    ] as const;

    for (const model of modelsToUpdate) {
        try {
            // @ts-ignore
            await prisma[model].updateMany({
                where: { businessId: null },
                data: { businessId: business.id }
            });
            console.log(`Updated ${model}`);
        } catch (e: any) {
            console.warn(`Skipping ${model} if an error occurred`);
        }
    }

    // AuditLog update removed as businessId is now strictly required

    console.log('Seeding Complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
