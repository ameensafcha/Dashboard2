// This is ONLY for the admin UI (checkboxes) — actual permissions are in DB
export const MODULES_CONFIG = [
    { key: 'dashboard', label: 'CEO Dashboard', actions: ['view', 'export'] },
    { key: 'products', label: 'Products & Catalog', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { key: 'pricing', label: 'Pricing Tiers', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'suppliers', label: 'Suppliers', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'crm', label: 'CRM (Contacts, Companies, Pipeline)', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { key: 'orders', label: 'Orders', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { key: 'inventory', label: 'Inventory', actions: ['view', 'create', 'edit', 'delete', 'log_movement', 'export'] },
    { key: 'production', label: 'Production & QC', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
    { key: 'finance', label: 'Finance & P&L', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { key: 'marketing', label: 'Marketing Campaigns', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'events', label: 'Events & Expos', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'tasks', label: 'Team & Tasks', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'documents', label: 'Document Vault', actions: ['view', 'upload', 'delete'] },
    { key: 'strategy', label: 'Strategy & OKRs', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'settings', label: 'Settings', actions: ['view', 'edit'] },
    { key: 'admin', label: 'Admin Panel', actions: ['view'] },
] as const;
