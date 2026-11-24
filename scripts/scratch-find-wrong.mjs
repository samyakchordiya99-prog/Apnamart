import { readFileSync } from 'fs';
const c = readFileSync('scripts/build-complete-catalog.mjs', 'utf8');
const lines = c.split('\n');
const badUrls = [
  '274145_14-fortune-sunlite',
  '10000527_10-everest-garam-masala',
  '40041431_1-amul-taaza-fresh-toned-milk',
  '242671_1-tata-salt-iodized',
  '265690_16-maaza-mango-drink',
];
badUrls.forEach(bad => {
  lines.forEach((l, i) => {
    if (l.includes(bad)) {
      const ctx = lines.slice(Math.max(0, i - 15), i).reverse().find(ll => ll.includes("name:"));
      console.log(`Line ${i+1} [${bad.slice(-20)}]: ${(ctx || '?').trim()}`);
    }
  });
});

