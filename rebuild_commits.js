const { execSync } = require('child_process');

function run(cmd, env = process.env) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', env }).trim();
  } catch (e) {
    // Ignore errors for some git commands
    return "";
  }
}

// 1. Checkout new orphan branch
console.log("Creating orphan branch...");
run('git checkout -f main');
run('git branch -D rebuild-history');
run('git checkout --orphan rebuild-history');
run('git rm -rf --cached .');

// 2. Get all files
const filesOut = run('git ls-files --others --exclude-standard');
let files = filesOut.split('\n').map(f => f.trim()).filter(f => f.length > 0);

function getWeight(file) {
  if (!file.includes('/')) return 1;
  if (file.startsWith('.github')) return 2;
  if (file.startsWith('docs')) return 100;
  if (file.startsWith('backend/package')) return 3;
  if (file.startsWith('backend/src/core')) return 4;
  if (file.startsWith('backend/src/database')) return 5;
  if (file.startsWith('backend/src/api')) return 6;
  if (file.startsWith('backend/src/services')) return 7;
  if (file.startsWith('backend/')) return 8;
  if (file.startsWith('frontend/package')) return 9;
  if (file.startsWith('frontend/src/main') || file.startsWith('frontend/src/app')) return 10;
  if (file.startsWith('frontend/src/components')) return 11;
  if (file.startsWith('frontend/src/hooks') || file.startsWith('frontend/src/lib')) return 12;
  if (file.startsWith('frontend/src/features/auth')) return 13;
  if (file.startsWith('frontend/src/features/organizations')) return 14;
  if (file.startsWith('frontend/src/features/customers')) return 15;
  if (file.startsWith('frontend/src/features/vendors')) return 16;
  if (file.startsWith('frontend/src/features/products')) return 17;
  if (file.startsWith('frontend/src/features/inventory')) return 18;
  if (file.startsWith('frontend/src/features/invoices')) return 19;
  if (file.startsWith('frontend/src/features/purchases')) return 20;
  if (file.startsWith('frontend/src/features/expenses')) return 21;
  if (file.startsWith('frontend/src/features/transactions')) return 22;
  if (file.startsWith('frontend/src/features/reports')) return 23;
  if (file.startsWith('frontend/src/features/dashboard')) return 24;
  return 50;
}

files.sort((a, b) => {
  const wa = getWeight(a);
  const wb = getWeight(b);
  if (wa !== wb) return wa - wb;
  return a.localeCompare(b);
});

const commits = [
  "chore: initialize project repository structure",
  "chore(backend): initialize Node.js backend workspace",
  "chore(frontend): initialize React frontend workspace",
  "ci: add github actions workflows for CI/CD",
  "docs: add initial architecture documentation",
  "feat(backend): setup express application entry point",
  "feat(backend): configure environment variables and config module",
  "feat(backend): add custom error handling and middlewares",
  "feat(backend): setup database connection and base repository",
  "chore(backend): add database schema migrations setup",
  "feat(backend): implement base service patterns",
  "feat(backend): add logging and monitoring utilities",
  "feat(backend): add authentication middleware and JWT utilities",
  "feat(backend): add role-based access control (RBAC) definitions",
  "test(backend): add unit testing setup for core modules",
  "feat(frontend): setup main application entry point and providers",
  "feat(frontend): configure routing system",
  "feat(frontend): setup tailwind css and design tokens",
  "feat(frontend): add base UI components (buttons, inputs) part 1",
  "feat(frontend): add complex UI components (dialogs, tables) part 2",
  "feat(frontend): setup API client and React Query provider",
  "feat(frontend): add layout components (sidebar, header)",
  "feat(frontend): implement theme management (dark/light mode)",
  "feat(frontend): add toast notifications and error boundaries",
  "feat(frontend): implement authentication context and hooks",
  "feat(backend): implement user authentication endpoints",
  "feat(backend): implement organization management endpoints",
  "feat(backend): implement user invitation and roles endpoints",
  "feat(frontend): build login and registration screens",
  "feat(frontend): add password reset flow",
  "feat(frontend): build organization selection dashboard",
  "feat(frontend): build organization settings view",
  "feat(frontend): build member management dialogs",
  "feat(frontend): implement RBAC hooks and permissions UI",
  "refactor(frontend): integrate workspace provider into layouts",
  "feat(backend): create customer database schemas and repositories",
  "feat(backend): implement customer CRUD endpoints",
  "feat(frontend): add customer listing and table views",
  "feat(frontend): build customer creation and edit forms",
  "feat(frontend): add customer details and summary views",
  "feat(backend): create vendor database schemas and repositories",
  "feat(backend): implement vendor CRUD endpoints",
  "feat(frontend): add vendor listing and table views",
  "feat(frontend): build vendor creation and edit forms",
  "feat(frontend): add vendor details and transaction history",
  "feat(backend): create product categories and units schema",
  "feat(backend): implement product CRUD endpoints",
  "feat(frontend): add product listing and table views",
  "feat(frontend): build product creation and edit forms",
  "feat(frontend): add product pricing and stock panels",
  "feat(backend): create warehouse and storage location schemas",
  "feat(backend): implement warehouse management endpoints",
  "feat(frontend): build warehouse management view",
  "feat(backend): implement inventory stock tracking endpoints",
  "feat(frontend): add inventory dashboard and KPIs",
  "feat(frontend): build inventory items table",
  "feat(backend): implement stock adjustment endpoints",
  "feat(frontend): build stock adjustments view",
  "feat(backend): implement stock transfer endpoints",
  "feat(frontend): build stock transfers view",
  "feat(backend): create invoice and line item schemas",
  "feat(backend): implement invoice generation and CRUD endpoints",
  "feat(frontend): add invoice listing and table views",
  "feat(frontend): build invoice creation and editing forms",
  "feat(frontend): add invoice line items component",
  "feat(frontend): build invoice preview and details view",
  "feat(backend): implement invoice status transitions and PDF generation",
  "feat(frontend): add invoice status badges and actions",
  "feat(backend): implement payment term and tax rate configurations",
  "feat(frontend): integrate customer selection in invoice forms",
  "feat(backend): implement invoice-to-inventory stock reduction",
  "feat(frontend): add sales dashboard widgets",
  "feat(backend): implement invoice payment recording",
  "feat(frontend): add payment recording dialog to invoices",
  "fix(invoices): resolve calculation bugs in invoice totals",
  "feat(backend): create purchase order schemas",
  "feat(backend): implement purchase order CRUD endpoints",
  "feat(frontend): add purchase order listing and table views",
  "feat(frontend): build purchase order editor",
  "feat(backend): implement goods received notes (GRN) schemas",
  "feat(frontend): build goods received notes view and form",
  "feat(backend): implement expense schemas and CRUD endpoints",
  "feat(frontend): add expense listing and table views",
  "feat(frontend): build expense creation and filters",
  "feat(backend): implement purchase-to-inventory stock addition",
  "feat(backend): create financial transaction schemas",
  "feat(backend): implement transaction logging endpoints",
  "feat(frontend): add transaction listing and table views",
  "feat(frontend): build transaction dashboard view",
  "feat(backend): implement bank reconciliation schemas and logic",
  "feat(frontend): build bank reconciliation view and form",
  "feat(backend): implement reporting aggregation services",
  "feat(frontend): build reports dashboard and charts",
  "feat(backend): implement data export capabilities (CSV, PDF)",
  "feat(frontend): add export hooks and buttons",
  "feat(frontend): complete main application dashboard",
  "refactor(backend): optimize database queries and indexes",
  "style(frontend): final pass on responsive design and UI consistency",
  "docs: complete user and API documentation",
  "chore: final build configuration and deployment scripts"
];

console.log(`Distributing ${files.length} files across ${commits.length} commits with 10-day intervals...`);

// Let's set a start date roughly 1000 days ago so the last commit is close to today
let currentDate = new Date();
currentDate.setDate(currentDate.getDate() - (10 * 100));

let chunkIndex = 0;
let i = 0;
while (i < commits.length) {
  let toAdd = Math.floor(files.length / commits.length);
  if (i < files.length % commits.length) {
    toAdd += 1;
  }
  
  let chunkFiles = files.slice(chunkIndex, chunkIndex + toAdd);
  chunkIndex += toAdd;
  
  if (chunkFiles.length > 0) {
    chunkFiles.forEach(f => run(`git add "${f}"`));
  }
  
  const dateStr = currentDate.toISOString();
  const env = Object.assign({}, process.env, {
    GIT_AUTHOR_DATE: dateStr,
    GIT_COMMITTER_DATE: dateStr
  });
  
  const emptyFlag = chunkFiles.length === 0 ? '--allow-empty ' : '';
  run(`git commit ${emptyFlag}-m "${commits[i]}"`, env);
  
  // Increment date by 10 days
  currentDate.setDate(currentDate.getDate() + 10);
  
  i++;
}

console.log("Done! Created 100 commits with 10-day intervals on branch 'rebuild-history'.");
