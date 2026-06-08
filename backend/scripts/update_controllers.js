import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src', 'modules');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('.controller.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (!content.includes('sendSuccess')) {
      content = `import { sendSuccess } from "../../utils/apiResponse.js";\n` + content;
    }

    content = content.replace(/res\.status\((\d+)\)\.json\(\{\s*success:\s*true\s*,?\s*([\s\S]*?)\}\);/g, (match, status, rest) => {
      let optionsStr = `statusCode: ${status}`;
      if (rest.trim()) {
        optionsStr += `, ${rest.trim()}`;
      }
      return `sendSuccess(res, { ${optionsStr} });`;
    });
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
});
