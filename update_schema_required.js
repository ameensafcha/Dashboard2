const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const modelsToUpdate = [
    'Category', 'Product', 'PricingTier', 'CompanyPricingTier', 'Supplier',
    'ProductionBatch', 'BatchItem', 'QualityCheck', 'RndProject', 'SystemSettings',
    'Company', 'Client', 'Deal', 'Order', 'OrderItem', 'Invoice',
    'RawMaterial', 'FinishedProduct', 'StockMovement',
    'Transaction', 'Expense', 'AuditLog'
];

for (const model of modelsToUpdate) {
    // Replace `businessId String?` with `businessId String`
    const regex = new RegExp(`(model \\b${model}\\b\\s*\\{[\\s\\S]*?businessId\\s+)String\\?(\\s*@map\\("business_id"\\))`, 'g');
    schema = schema.replace(regex, (match, prefix, suffix) => {
        return prefix + 'String' + suffix;
    });

    // Replace `business Business?` with `business Business`
    const relationRegex = new RegExp(`(model \\b${model}\\b\\s*\\{[\\s\\S]*?business\\s+)Business\\?(\\s*@relation)`, 'g');
    schema = schema.replace(relationRegex, (match, prefix, suffix) => {
        return prefix + 'Business' + suffix;
    });
}

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Successfully updated schema, businessId is now required!');
