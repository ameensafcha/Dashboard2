import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const business = await prisma.business.findUnique({ where: { slug: 'safcha' } });
    if (!business) {
        console.log('Business not found');
        return;
    }
    console.log(`Business ID: ${business.id}`);

    const clientCount = await prisma.client.count({ where: { businessId: business.id, deletedAt: null } });
    const companyCount = await prisma.company.count({ where: { businessId: business.id, deletedAt: null } });

    console.log(`Client count: ${clientCount}`);
    console.log(`Company count: ${companyCount}`);

    const clients = await prisma.client.findMany({ where: { businessId: business.id, deletedAt: null }, select: { name: true, createdAt: true } });
    console.log('Clients:', clients);

    const companies = await prisma.company.findMany({ where: { businessId: business.id, deletedAt: null }, select: { name: true, createdAt: true } });
    console.log('Companies:', companies);
}

main().catch(console.error).finally(() => prisma.$disconnect());
