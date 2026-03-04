const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const newModels = `
model Business {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique   // "safcha" - URL safe
  logo        String?
  industry    String?
  country     String   @default("SA")
  currency    String   @default("SAR")
  timezone    String   @default("Asia/Riyadh")
  vatNumber   String?
  address     String?
  phone       String?
  email       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  users        BusinessUser[]
  roles        Role[]
  
  categories Category[]
  products Product[]
  pricingTiers PricingTier[]
  companyPricingTiers CompanyPricingTier[]
  suppliers Supplier[]
  productionBatches ProductionBatch[]
  batchItems BatchItem[]
  qualityChecks QualityCheck[]
  rndProjects RndProject[]
  systemSettings SystemSettings[]
  companies Company[]
  clients Client[]
  deals Deal[]
  orders Order[]
  orderItems OrderItem[]
  invoices Invoice[]
  rawMaterials RawMaterial[]
  finishedProducts FinishedProduct[]
  stockMovements StockMovement[]
  transactions Transaction[]
  expenses Expense[]
  auditLogs AuditLog[]

  @@map("businesses")
}

model Role {
  id          String   @id @default(uuid())
  businessId  String   @map("business_id")
  name        String   // "Sales Manager", "Accountant" - admin sets this
  description String?
  isSystem    Boolean  @default(false) @map("is_system")
  color       String?  // Badge color: "#8B5CF6" etc.
  createdAt   DateTime @default(now()) @map("created_at")

  permissions RolePermission[]
  users       BusinessUser[]
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([businessId, name])
  @@index([businessId])
  @@map("roles")
}

model RolePermission {
  id       String @id @default(uuid())
  roleId   String @map("role_id")
  module   String // "orders", "finance", "admin", "production" etc.
  action   String // "view", "create", "edit", "delete", "approve", "export", "log_movement", "upload"

  role     Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, module, action])
  @@index([roleId])
  @@map("role_permissions")
}

model BusinessUser {
  id          String    @id @default(uuid())
  businessId  String    @map("business_id")
  userId      String    @map("user_id")   // Supabase auth.users UUID
  email       String
  name        String
  avatarUrl   String?   @map("avatar_url")
  roleId      String    @map("role_id")
  isActive    Boolean   @default(true) @map("is_active")
  joinedAt    DateTime  @default(now()) @map("joined_at")
  lastSeenAt  DateTime? @map("last_seen_at")
  invitedBy   String?   @map("invited_by")  // userId who invited

  role        Role      @relation(fields: [roleId], references: [id])
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  overrides   UserPermissionOverride[]

  @@unique([businessId, userId])
  @@index([businessId])
  @@index([userId])
  @@map("business_users")
}

model UserPermissionOverride {
  id         String   @id @default(uuid())
  businessId String   @map("business_id")
  userId     String   @map("user_id")
  module     String
  action     String
  granted    Boolean  // true = give access, false = take away access
  grantedBy  String   @map("granted_by")  // Admin userId who set this
  reason     String?
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([businessId, userId, module, action])
  @@index([businessId, userId])
  @@map("user_permission_overrides")
}
`;

const modelsToUpdate = [
    'Category', 'Product', 'PricingTier', 'CompanyPricingTier', 'Supplier',
    'ProductionBatch', 'BatchItem', 'QualityCheck', 'RndProject', 'SystemSettings',
    'Company', 'Client', 'Deal', 'Order', 'OrderItem', 'Invoice',
    'RawMaterial', 'FinishedProduct', 'StockMovement',
    'Transaction', 'Expense'
];

for (const model of modelsToUpdate) {
    const regex = new RegExp(`(model ${model} \\{[\\s\\S]*?)(\\n\\s*(?:@@|\\}))`);
    schema = schema.replace(regex, (match, body, end) => {
        return `${body}\n  businessId String? @map("business_id")\n  business   Business? @relation(fields: [businessId], references: [id], onDelete: Cascade)${end}`;
    });
}

const newAuditLog = `model AuditLog {
  id          String   @id @default(uuid())
  action      String // e.g., "CREATE", "UPDATE", "SOFT_DELETE", "RESTORE"
  entity      String // e.g., "Order", "Product", "Expense"
  entityId    String   @map("entity_id")
  details     Json? // Stores { before: ..., after: ... } or relevant metadata
  userId      String?  @map("user_id") // Placeholder for current implementation
  createdAt   DateTime @default(now()) @map("created_at")

  businessId  String?  @map("business_id")
  userName    String?  @map("user_name")
  module      String?
  entityName  String?  @map("entity_name")
  description String?

  business    Business? @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([entity, entityId])
  @@index([createdAt])
  @@index([businessId, createdAt])
  @@index([businessId, userId])
  @@map("audit_logs")
}`;

schema = schema.replace(/model AuditLog \{[\s\S]*?\}/, newAuditLog);

schema += '\n' + newModels;

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated successfully!');
