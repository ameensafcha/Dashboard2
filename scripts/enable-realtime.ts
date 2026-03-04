import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Attempting to enable Supabase Realtime for CRM tables...');
    try {
        // Try adding tables to the publication
        await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "clients";`);
        console.log('✅ Enabled Realtime for clients table');
    } catch (e: any) {
        console.error('Failed to enable clients:', e.message);
    }

    try {
        await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "companies";`);
        console.log('✅ Enabled Realtime for companies table');
    } catch (e: any) {
        console.error('Failed to enable companies:', e.message);
    }

    try {
        await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "orders";`);
        console.log('✅ Enabled Realtime for orders table');
    } catch (e: any) {
        console.error('Failed to enable orders:', e.message);
    }

    try {
        await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "transactions";`);
        console.log('✅ Enabled Realtime for transactions table');
    } catch (e: any) {
        console.error('Failed to enable transactions:', e.message);
    }

    console.log('Realtime configuration attempt complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
