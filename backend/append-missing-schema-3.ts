import fs from 'fs';

let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// 1. WorkflowRule
content = content.replace(
  /model WorkflowRule \{[\s\S]*?isActive\s+Boolean\s+@default\(true\)/g,
  `model WorkflowRule {
  id             String       @id @default(uuid())
  organizationId String
  entityType     WorkflowEntityType
  name           String
  conditions     Json?
  steps          Json
  isActive       Boolean      @default(true)
  effectiveFrom  DateTime     @default(now())
  priority       Int          @default(1)`
);

// 2. WorkflowStatus
content = content.replace(
  /enum WorkflowStatus \{[\s\S]*?CANCELLED\n\}/g,
  `enum WorkflowStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  CHANGES_REQUESTED
  ESCALATED
}`
);

// 3. WorkflowAction
content = content.replace(
  /enum WorkflowAction \{[\s\S]*?RETURN\n\}/g,
  `enum WorkflowAction {
  APPROVE
  REJECT
  DELEGATE
  RETURN
  REQUEST_CHANGES
  ESCALATE
}`
);

// 4. QuotationRevision
content = content.replace(
  /model QuotationRevision \{[\s\S]*?totalAmount\s+Decimal/g,
  `model QuotationRevision {
  id             String       @id @default(uuid())
  quotationId    String
  revisionNumber Int
  status         String
  validUntil     DateTime?
  totalAmount    Decimal`
);

// 5. WorkflowInstance
content = content.replace(
  /currentStepIndex Int\s+@default\(0\)/g,
  `currentStepIndex Int        @default(0)
  dueAt          DateTime?`
);

// 6. Notification entity
content = content.replace(
  /entityType\s+String\n\s*entityId\s+String/g,
  `entityType     String?
  entityId       String?`
);

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Appended missing schema 3 successfully');
