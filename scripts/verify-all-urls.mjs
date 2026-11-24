// scripts/verify-all-urls.mjs
import { readFileSync, writeFileSync } from 'fs';

const text = readFileSync('src/data/productData.ts', 'utf8');
const urls = [...new Set([...text.matchAll(/"imageUrl":\s*"([^"]+)"/g)].map(m => m[1]))];
console.log('Unique URLs in productData:', urls.length);

async function check() {
  let ok = 0;
  let broken = 0;
  const brokenList = [];
  for (let i = 0; i < urls.length; i += 15) {
    const batch = urls.slice(i, i + 15);
    await Promise.all(batch.map(async u => {
      try {
        const res = await fetch(u, { method: 'HEAD' });
        if (res.status === 200) {
          ok++;
        } else {
          broken++;
          brokenList.push({ status: res.status, url: u });
        }
      } catch (e) {
        broken++;
        brokenList.push({ status: 'ERR', url: u });
      }
    }));
  }
  console.log(`FINAL URL AUDIT: OK (200): ${ok}, Broken: ${broken}`);
  if (brokenList.length > 0) {
    console.log('Broken details:', brokenList);
  }
  writeFileSync('scripts/url-audit-result.json', JSON.stringify({ ok, broken, brokenList }, null, 2), 'utf-8');
}
check();

