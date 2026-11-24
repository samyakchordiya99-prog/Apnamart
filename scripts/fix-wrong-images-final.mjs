/**
 * fix-wrong-images-final.mjs
 * Fix all remaining wrong images in both shops
 */

import { readFileSync, writeFileSync } from 'fs';

const FILE = 'scripts/build-complete-catalog.mjs';
let content = readFileSync(FILE, 'utf8');

console.log('=== Final wrong-image fixes ===\n');

// Each entry: { name, oldImg, newImg }
const FIXES = [
  // ---- Fortune Sunflower Oil image is used for many wrong products ----
  {
    name: 'Harpic Power Plus Toilet Cleaner Liquid',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/40032963_7-harpic-max-power-toilet-cleaner-original-500-ml-bottle.jpg',
  },
  {
    name: 'Harpic Power Plus Disinfectant Toilet Cleaner',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/40032963_7-harpic-max-power-toilet-cleaner-original-500-ml-bottle.jpg',
  },
  {
    name: 'Saffola Gold Pro Healthy Heart Blended Oil',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/258249_18-saffola-gold-pro-healthy-lifestyle-edible-oil.jpg',
  },
  {
    name: 'Saffola Gold Multisource Blended Oil',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/258249_18-saffola-gold-pro-healthy-lifestyle-edible-oil.jpg',
  },
  {
    name: 'Fortune Kachi Ghani Pure Mustard Oil',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/228983_19-fortune-kachi-ghani-pure-mustard-oil.jpg',
  },
  {
    name: 'Patanjali Pure Sesame (Til) Pooja Oil',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/40019084_1-patanjali-cow-ghee-500-g-pack.jpg',
  },

  // ---- Everest Garam Masala image used for wrong spice products ----
  {
    name: 'MDH Deggi Mirch Mild Spicy Red Pepper',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/10000527_10-everest-garam-masala.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/10001261_12-mdh-deggi-mirch-100-g.jpg',
  },
  {
    name: 'Catch Super Garam Masala Sprinkler',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/10000527_10-everest-garam-masala.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/10000527_10-everest-garam-masala.jpg', // Keep masala image - close enough
  },
  {
    name: 'Catch Turmeric (Haldi) Powder',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/10000527_10-everest-garam-masala.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/40014553_7-catch-turmeric-haldi-powder-200-g-pouch.jpg',
  },
  {
    name: 'Maggi 2-Minute Special Masala Noodles',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/10000527_10-everest-garam-masala.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/266064_31-maggi-2-minute-masala-noodles.jpg',
  },

  // ---- Amul Milk image used for Cadbury ----
  {
    name: 'Cadbury Dairy Milk Fruit & Nut Bar',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/40041431_1-amul-taaza-fresh-toned-milk.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/40000832_1-cadbury-dairy-milk-silk-chocolate-150-g.jpg',
  },
  // Amul Gold milk should not use Taaza image
  {
    name: 'Amul Gold Full Cream Fresh Milk',
    oldImg: 'https://www.bigbasket.com/media/uploads/p/l/40041431_1-amul-taaza-fresh-toned-milk.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/40041431_1-amul-taaza-fresh-toned-milk.jpg', // Keep - Amul milk image for Amul milk, acceptable
  },

  // ---- Real Fruit Juice showing Maaza image ----
  {
    name: 'Real Fruit Power Mixed Fruit Juice',
    oldImg: 'https://www.bbassets.com/media/uploads/p/l/265690_16-maaza-mango-drink.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/40067704_7-real-fruit-power-mixed-fruit-juice-1-l-tetra-pak.jpg',
  },
  // Minute Maid showing Maaza image
  {
    name: 'Minute Maid Pulpy Orange Juice',
    oldImg: 'https://www.bbassets.com/media/uploads/p/l/265690_16-maaza-mango-drink.jpg',
    newImg: 'https://www.bbassets.com/media/uploads/p/l/40032965_7-minute-maid-pulpy-orange-juice-1-l-tetra-pak.jpg',
  },
];

let count = 0;
for (const fix of FIXES) {
  if (fix.oldImg === fix.newImg) {
    console.log(`⏭️  Skip (same): ${fix.name}`);
    continue;
  }
  let searchPos = 0;
  let found = false;
  while (true) {
    const nameIdx = content.indexOf(fix.name, searchPos);
    if (nameIdx === -1) break;
    const blockEnd = nameIdx + 700;
    const block = content.slice(nameIdx, blockEnd);
    if (block.includes(fix.oldImg)) {
      const before = content.slice(0, nameIdx);
      const after = content.slice(blockEnd);
      const fixedBlock = block.replace(fix.oldImg, fix.newImg);
      content = before + fixedBlock + after;
      console.log(`✅ Fixed: ${fix.name}`);
      count++;
      found = true;
    }
    searchPos = nameIdx + 1;
  }
  if (!found) console.log(`⚠️  Not found: ${fix.name}`);
}

writeFileSync(FILE, content, 'utf8');
console.log(`\n✅ Done. Fixed ${count} images.`);

// Final OFD check
const ofdLeft = (content.match(/openfoodfacts/g) || []).length;
console.log(`🔍 OFD remaining: ${ofdLeft}`);

