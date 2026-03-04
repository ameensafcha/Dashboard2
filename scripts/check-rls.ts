import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Row Level Security (RLS) status...');
    try {
        const result: any[] = await prisma.$queryRawUnsafe(`
            SELECT relname, relrowsecurity 
            FROM pg_class 
            WHERE relname IN ('clients', 'companies', 'orders');
        `);
        console.log('RLS Status:', result);
    } catch (e: any) {
        console.error('Failed to check RLS:', e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
