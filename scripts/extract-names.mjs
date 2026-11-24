import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('scripts/build-complete-catalog.mjs', 'utf8');
const names = [];
for (const line of content.split('\n')) {
  const m = line.match(/^\s*name:\s*(['"])(.*?)\1,/);
  if (m) {
    names.push(m[2].replace(/\\'/g, "'"));
  }
}

const unique = [...new Set(names)];
console.log('Total products:', names.length);
console.log('Unique products:', unique.length);

writeFileSync('scripts/all_product_names.json', JSON.stringify(unique, null, 2), 'utf8');
