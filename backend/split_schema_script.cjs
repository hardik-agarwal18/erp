const fs = require('fs');
const path = require('path');

const PRISMA_DIR = path.join(__dirname, 'prisma');

// Domain assignments
const domains = {
  core: [
    'User', 'Role', 'Permission', 'RolePermission', 'Organization', 'OrganizationMember',
    'Invitation', 'RefreshSession', 'JoinRequest', 'EmailVerificationToken', 'PasswordResetToken',
    'AuditLog', 'NumberSeries', 'WorkflowRule', 'WorkflowInstance', 'WorkflowHistory', 'WorkflowDelegation',
    'ApprovalTemplate', 'ApprovalStep', 'ApprovalInstance', 'ApprovalAction', 'OutboxEvent', 'EmailLog',
    'WorkflowEntityType', 'WorkflowStatus', 'WorkflowAction', 'NumberSeriesResetPolicy', 'JoinRequestStatus', 'ApproverType', 'ApprovalStatus'
  ],
  finance: [
    'Account', 'SystemAccountMapping', 'JournalEntry', 'JournalLine', 'FiscalYear', 'AccountingPeriod',
    'Tax', 'BankAccount', 'BankTransaction', 'PaymentBatch', 'PaymentBatchItem', 'PaymentBatchExecution',
    'Expense', 'Transaction', 'VendorPayment', 'VendorPaymentAllocation',
    'AccountType', 'BalanceType', 'PaymentMethod', 'TaxType', 'TransactionType', 'ExpenseCategory', 'VendorPaymentStatus', 'PaymentBatchStatus'
  ],
  procurement: [
    'Vendor', 'PurchaseOrder', 'PurchaseOrderItem', 'VendorInvoice', 'VendorInvoiceItem', 'VendorInvoiceMismatch',
    'RequestForQuotation', 'RequestForQuotationItem', 'RequestForQuotationVendor',
    'PurchaseRequisition', 'PurchaseRequisitionItem', 'VendorPerformance',
    'PurchaseOrderStatus', 'MatchStatus', 'VendorInvoiceStatus', 'RequestForQuotationStatus', 'PurchaseRequisitionStatus', 'PurchaseRequisitionItemStatus', 'RejectedItemDisposition'
  ],
  sales: [
    'Customer', 'Quotation', 'QuotationItem', 'QuotationRevision', 'QuotationRevisionItem',
    'Invoice', 'InvoiceItem', 'InvoiceSequence', 'InvoiceEmailLog',
    'DeliveryChallan', 'DeliveryChallanItem',
    'InvoiceStatus', 'InvoiceEmailStatus', 'QuotationStatus'
  ],
  inventory: [
    'ProductCategory', 'Product', 'InventoryItem', 'InventoryMovement', 'InventoryLot',
    'Batch', 'BatchInventoryItem', 'SerialNumber', 'Godown', 'GoodsReceiptNote', 'GoodsReceiptNoteItem',
    'StockGroup', 'StockJournal', 'StockJournalItem', 'StockVerification', 'StockVerificationItem',
    'ProductType', 'InventoryMovementType', 'SerialNumberStatus', 'GoodsReceiptNoteStatus'
  ],
  hrms: [
    'EmployeeSequence', 'Department', 'Designation', 'Employee', 'EmployeeDocument',
    'AttendanceRecord', 'AttendancePolicy', 'AttendanceAdjustment', 'AttendancePeriod', 'Shift', 'EmployeeShiftAssignment',
    'LeaveType', 'LeaveApplication', 'LeaveBalance', 'Holiday', 'ExpenseClaim',
    'PayrollPolicy', 'PayrollRun', 'PayrollRunEmployee', 'SalaryComponent', 'EmployeeSalaryStructure', 'SalaryStructureHistory', 'Payslip', 'PayslipLineItem',
    'EmployeeStatus', 'EmploymentType', 'Gender', 'AttendanceStatus', 'LeaveStatus', 'PayrollRunStatus', 'ComponentCalculationType', 'WorkingDayBasis', 'ExpenseClaimStatus'
  ],
  documents: [
    'Document'
  ],
  notifications: [
    'Notification'
  ],
  analytics: [
    'FinancialStatementSnapshot', 'InventoryValuationSnapshot'
  ]
};

const fileNames = [
  'schema.prisma',
  'missing_schema.txt',
  'missing_schema_2.txt',
  'schema_append.txt'
];

let allContent = '';
for (const file of fileNames) {
  const filePath = path.join(PRISMA_DIR, file);
  if (fs.existsSync(filePath)) {
    allContent += '\n' + fs.readFileSync(filePath, 'utf-8');
  }
}

// Ensure generator has prismaSchemaFolder
if (!allContent.includes('prismaSchemaFolder')) {
  allContent = allContent.replace(/generator client\s*\{[^}]+\}/g, (match) => {
    if (!match.includes('previewFeatures')) {
      return match.replace('}', '  previewFeatures = ["prismaSchemaFolder"]\n}');
    } else if (!match.includes('prismaSchemaFolder')) {
      return match.replace(/previewFeatures\s*=\s*\[(.*?)\]/, 'previewFeatures = [$1, "prismaSchemaFolder"]');
    }
    return match;
  });
}

// Extract generator and datasource
const generatorMatch = allContent.match(/generator client\s*\{[\s\S]*?\}/);
const datasourceMatch = allContent.match(/datasource db\s*\{[\s\S]*?\}/);
const mainSchemaContent = (generatorMatch ? generatorMatch[0] : '') + '\n\n' + (datasourceMatch ? datasourceMatch[0] : '') + '\n';

// Parse blocks (model or enum)
const blocks = [];
const blockRegex = /(?:model|enum)\s+(\w+)\s*\{[\s\S]*?\n\}/g;
let match;
while ((match = blockRegex.exec(allContent)) !== null) {
  blocks.push({
    type: match[0].trim().startsWith('model') ? 'model' : 'enum',
    name: match[1],
    content: match[0]
  });
}

const domainContents = {};

for (const block of blocks) {
  let assignedDomain = 'shared';
  for (const [domain, models] of Object.entries(domains)) {
    if (models.includes(block.name)) {
      assignedDomain = domain;
      break;
    }
  }

  if (!domainContents[assignedDomain]) {
    domainContents[assignedDomain] = '';
  }
  domainContents[assignedDomain] += block.content + '\n\n';
}

// Write the files
for (const [domain, content] of Object.entries(domainContents)) {
  const domainDir = path.join(PRISMA_DIR, domain);
  if (!fs.existsSync(domainDir)) {
    fs.mkdirSync(domainDir, { recursive: true });
  }
  fs.writeFileSync(path.join(domainDir, `${domain}.prisma`), content.trim() + '\n');
}

// Backup old schema
fs.renameSync(path.join(PRISMA_DIR, 'schema.prisma'), path.join(PRISMA_DIR, 'schema.prisma.bak'));

// Write new main schema
fs.writeFileSync(path.join(PRISMA_DIR, 'schema.prisma'), mainSchemaContent);

console.log('Schema successfully split into domains!');
