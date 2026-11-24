import { readFileSync } from 'fs';

const content = readFileSync('scripts/build-complete-catalog.mjs', 'utf8');
const lines = content.split('\n');

let curName = '';
const unsplashProducts = [];
const realProducts = [];

for (const line of lines) {
  const mName = line.match(/name:\s*['"](.+?)['"]/);
  if (mName) curName = mName[1];
  const mImg = line.match(/img:\s*['"](.+?)['"]/);
  if (mImg && curName) {
    if (mImg[1].includes('unsplash.com')) {
      unsplashProducts.push({ name: curName, img: mImg[1] });
    } else {
      realProducts.push({ name: curName, img: mImg[1] });
    }
  }
}

console.log(`Products with Real Images: ${realProducts.length}`);
console.log(`Products with Unsplash Images: ${unsplashProducts.length}`);

// Unique unsplash product names
const uniqueUnsplash = [...new Set(unsplashProducts.map(p => p.name))];
console.log(`Unique Unsplash Product Names: ${uniqueUnsplash.length}`);
console.log('\nSample Unsplash products that need real images:');
console.log(uniqueUnsplash.slice(0, 30).join('\n'));

