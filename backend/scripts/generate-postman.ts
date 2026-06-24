import fs from 'fs';
import path from 'path';

const APP_TS_PATH = path.resolve('src/app.ts');
const BASE_URL = '{{baseUrl}}';

interface RouteDef {
  method: string;
  path: string;
  fullPath: string;
}

interface GroupDef {
  prefix: string;
  filePath: string;
  routes: RouteDef[];
}

function parseAppTs(): GroupDef[] {
  const content = fs.readFileSync(APP_TS_PATH, 'utf-8');
  
  // Find imports: import fooRoutes from "./path/to/foo.routes.js";
  const importRegex = /import\s+([a-zA-Z0-9_]+)\s+from\s+["'](\.\/.*?)["']/g;
  const imports: Record<string, string> = {};
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const varName = match[1];
    // Convert .js to .ts
    const filePath = path.resolve('src', match[2].replace('.js', '.ts'));
    imports[varName] = filePath;
  }

  // Find usages: app.use("/api/v1/foo", fooRoutes);
  const useRegex = /app\.use\(\s*["'](\/api\/v1\/.*?)["']\s*,\s*([a-zA-Z0-9_]+)\s*\)/g;
  const groups: GroupDef[] = [];
  
  while ((match = useRegex.exec(content)) !== null) {
    const prefix = match[1];
    const varName = match[2];
    
    if (imports[varName]) {
      groups.push({
        prefix,
        filePath: imports[varName],
        routes: []
      });
    }
  }
  
  return groups;
}

function parseRoutesFile(group: GroupDef) {
  if (!fs.existsSync(group.filePath)) {
    console.warn(`File not found: ${group.filePath}`);
    return;
  }
  
  const content = fs.readFileSync(group.filePath, 'utf-8');
  
  // Find route definitions: router.get("/path", ...)
  const routeRegex = /router\.(get|post|put|patch|delete)\(\s*["'](.*?)["']/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    let routePath = match[2];
    
    // Convert express params :id to Postman variables {{id}} or just keep as :id and Postman handles it?
    // Postman handles :id natively in path variables.
    
    // Normalize path
    if (routePath === '/') routePath = '';
    
    group.routes.push({
      method,
      path: routePath,
      fullPath: `${group.prefix}${routePath}`
    });
  }
}

function buildPostmanCollection(groups: GroupDef[]) {
  const collection = {
    info: {
      name: "ERP API Automation Collection",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    variable: [
      { key: "baseUrl", value: "http://localhost:5000", type: "string" },
      { key: "authToken", value: "", type: "string" }
    ],
    item: [] as any[]
  };

  for (const group of groups) {
    const folderName = group.prefix.replace('/api/v1/', '').toUpperCase();
    
    const folder = {
      name: folderName,
      item: [] as any[]
    };
    
    for (const route of group.routes) {
      const pathArray = route.fullPath.split('/').filter(Boolean);
      const url = {
        raw: `{{baseUrl}}${route.fullPath}`,
        host: ["{{baseUrl}}"],
        path: pathArray,
        variable: pathArray.filter(p => p.startsWith(':')).map(p => ({
          key: p.substring(1),
          value: "1" // Default mock id
        }))
      };
      
      // Clean up path variable in raw url to use standard format if needed, 
      // but Postman accepts :id in raw path and uses the variable array.
      
      const item = {
        name: `${route.method} ${route.fullPath}`,
        request: {
          method: route.method,
          header: [
            { key: "Authorization", value: "Bearer {{authToken}}" }
          ],
          url: url
        }
      };
      
      folder.item.push(item);
    }
    
    if (folder.item.length > 0) {
      collection.item.push(folder);
    }
  }
  
  return collection;
}

function run() {
  console.log('Parsing app.ts...');
  const groups = parseAppTs();
  
  console.log(`Found ${groups.length} route groups. parsing route files...`);
  for (const group of groups) {
    parseRoutesFile(group);
  }
  
  const totalRoutes = groups.reduce((sum, g) => sum + g.routes.length, 0);
  console.log(`Found ${totalRoutes} total routes.`);
  
  const collection = buildPostmanCollection(groups);
  fs.writeFileSync('erp-postman-collection.json', JSON.stringify(collection, null, 2));
  console.log('Generated erp-postman-collection.json');
}

run();
