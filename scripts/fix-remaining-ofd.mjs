/**
 * fix-remaining-ofd.mjs
 * Fix the 6 remaining OFD images and additional wrong images in Shop 2
 */

import { readFileSync, writeFileSync } from 'fs';

const FILE = new URL('../scripts/build-complete-catalog.mjs', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
let content = readFileSync(FILE, 'utf8');

console.log('=== Fixing remaining OFD images and wrong images ===\n');

// Products to remove (in Shop 2 that have no confirmed BB images)
const REMOVE_NAMES = [
  'Good Knight Gold Flash Liquid Mosquito Refill',
  'Good Knight Advanced Liquid Mosquito Repellent',
  'Britannia Marie Gold Wheat Biscuits',
  'Parle Hide & Seek Fab Strawberry Cream',
  'Lizol Citrus Floor Cleaner Disinfectant',
  'Dettol Original Germ Protection Bathing Soap',
];

// Image fixes for products that have wrong images but should be KEPT
const DIRECT_FIXES = [
  // Parle Krackjack was using Hide&Seek OFD image → use Krackjack BB image
  {
    name: 'Parle Krackjack Sweet & Salty Crackers',
    oldImg: 'https://images.openfoodfacts.org/images/products/890/171/913/5248/front_en.25.400.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/263524_28-parle-krackjack-crackers-sweet-salty.jpg',
  },
  // Parachute Coconut Oil in Shop 2 showing sunflower oil image
  {
    name: 'Parachute Pure Coconut Oil Bottle',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/232792_11-parachute-coconut-oil.jpg',
  },
  // Harpic (line 1294) showing sunflower oil image
  {
    name: 'Harpic Max Power',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/40032963_7-harpic-max-power-toilet-cleaner-original-500-ml-bottle.jpg',
  },
];

let removedCount = 0;
let fixedCount = 0;

// ---- Remove products ----
for (const productName of REMOVE_NAMES) {
  let searchPos = 0;
  while (true) {
    const nameIdx = content.indexOf(productName, searchPos);
    if (nameIdx === -1) break;
    
    let openBrace = -1;
    for (let i = nameIdx; i >= Math.max(0, nameIdx - 50); i--) {
      if (content[i] === '{') { openBrace = i; break; }
    }
    if (openBrace === -1) { searchPos = nameIdx + 1; continue; }
    
    let depth = 0;
    let closeBrace = -1;
    for (let i = openBrace; i < Math.min(content.length, openBrace + 2000); i++) {
      if (content[i] === '{') depth++;
      else if (content[i] === '}') {
        depth--;
        if (depth === 0) { closeBrace = i; break; }
      }
    }
    if (closeBrace === -1) { searchPos = nameIdx + 1; continue; }
    
    let endPos = closeBrace + 1;
    if (content[endPos] === ',') endPos++;
    while (endPos < content.length && (content[endPos] === '\n' || content[endPos] === '\r')) endPos++;
    
    let startPos = openBrace;
    while (startPos > 0 && (content[startPos - 1] === ' ' || content[startPos - 1] === '\t')) startPos--;
    if (startPos > 0 && content[startPos - 1] === '\n') startPos--;
    
    console.log(`🗑️  Removing: "${productName}"`);
    content = content.slice(0, startPos) + '\n' + content.slice(endPos);
    removedCount++;
  }
}

// ---- Fix wrong images ----
for (const fix of DIRECT_FIXES) {
  let searchPos = 0;
  let found = false;
  while (true) {
    const nameIdx = content.indexOf(fix.name, searchPos);
    if (nameIdx === -1) break;
    
    const block = content.slice(nameIdx, nameIdx + 700);
    if (block.includes(fix.oldImg)) {
      const before = content.slice(0, nameIdx);
      const after = content.slice(nameIdx + 700);
      const fixedBlock = block.replace(fix.oldImg, fix.newImg);
      content = before + fixedBlock + after;
      console.log(`🔧 Fixed image for: ${fix.name}`);
      fixedCount++;
      found = true;
    }
    searchPos = nameIdx + 1;
  }
  if (!found) {
    // Try searching for old image directly and check context
    const imgIdx = content.indexOf(fix.oldImg);
    if (imgIdx !== -1) {
      // Check if this occurrence is near the product name
      const surrounding = content.slice(Math.max(0, imgIdx - 400), imgIdx + 50);
      if (surrounding.includes(fix.name.substring(0, 15))) {
        content = content.slice(0, imgIdx) + fix.newImg + content.slice(imgIdx + fix.oldImg.length);
        console.log(`🔧 Fixed image (fallback) for: ${fix.name}`);
        fixedCount++;
      }
    }
  }
}

// Final check for remaining OFD
const remainingOFD = (content.match(/openfoodfacts/g) || []).length;
if (remainingOFD > 0) {
  console.log(`\n⚠️  ${remainingOFD} OFD references still remain:`);
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('openfoodfacts')) {
      console.log(`  Line ${i+1}: ${l.trim()}`);
    }
  });
} else {
  console.log('\n✅ Zero OFD references remain!');
}

writeFileSync(FILE, content, 'utf8');
console.log(`\n✅ Done. Removed ${removedCount} products, fixed ${fixedCount} images.`);

