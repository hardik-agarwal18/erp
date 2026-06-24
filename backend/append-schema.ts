import fs from 'fs';
const append = fs.readFileSync('prisma/schema_append.txt', 'utf-8');
fs.appendFileSync('prisma/schema.prisma', append);
console.log('Appended successfully');
