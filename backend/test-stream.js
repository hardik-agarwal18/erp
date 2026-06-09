import { stringify } from "csv-stringify";

const stringifier = stringify({ header: true });
const chunks = [];

stringifier.on('data', (chunk) => {
  chunks.push(Buffer.from(chunk));
});

// NO DATA WRITTEN
stringifier.end();

const p = new Promise((resolve, reject) => {
  stringifier.on('end', () => { console.log("end event"); resolve(); });
  stringifier.on('finish', () => { console.log("finish event"); });
  stringifier.on('error', reject);
});

p.then(() => console.log("Done")).catch(console.error);
