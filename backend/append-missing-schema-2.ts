import fs from 'fs';
const append = fs.readFileSync('prisma/missing_schema_2.txt', 'utf-8');
fs.appendFileSync('prisma/schema.prisma', append);
console.log('Appended missing schema successfully');
