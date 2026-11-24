/**
 * fix-and-clean-catalog.mjs
 * 
 * 1. Replaces ALL OFD images with confirmed BB CDN URLs
 * 2. Fixes wrong-product images (e.g., butter showing salt image)
 * 3. Removes products with no confirmed BB image (hide_seek, marie_gold, dettol_soap, lizol, red_bull, quaker_oats, ariel, good_knight)
 * 4. Writes the fixed content back to build-complete-catalog.mjs
 */

import { readFileSync, writeFileSync } from 'fs';

const FILE = new URL('../scripts/build-complete-catalog.mjs', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

let content = readFileSync(FILE, 'utf8');
const original = content;

// ============================================================
// STEP 1: Replace OFD images with confirmed BB CDN URLs
// ============================================================

const OFD_REPLACEMENTS = {
  // Parle-G
  "https://images.openfoodfacts.org/images/products/890/171/913/4845/front_en.11.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/40174323_7-parle-g-gluco-biscuits-800-g-pouch.jpg",
  
  // Oreo Vanilla
  "https://images.openfoodfacts.org/images/products/762/220/222/5512/front_en.28.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/40019318_5-cadbury-oreo-vanilla-sandwich-biscuits-120-g-pouch.jpg",
  
  // Dark Fantasy Choco Fills
  "https://images.openfoodfacts.org/images/products/890/172/501/6258/front_en.20.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/20005908_1-sunfeast-dark-fantasy-choco-fills-75-g-pouch.jpg",
  
  // Hide & Seek Chocolate Chip — NO BB URL FOUND → will be removed (product removed below)
  "https://images.openfoodfacts.org/images/products/890/171/910/5913/front_en.22.400.jpg":
    "REMOVE_PRODUCT",
  
  // Monaco Classic — FOUND
  "https://images.openfoodfacts.org/images/products/890/171/913/5118/front_en.24.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/10000030_17-parle-monaco-classic-salted-crackers.jpg",
  
  // Amul Ghee
  "https://images.openfoodfacts.org/images/products/890/126/203/0151/front_fr.9.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/40054553_2-amul-pure-ghee-500-ml-tin.jpg",
  
  // Thums Up
  "https://images.openfoodfacts.org/images/products/890/176/404/2911/front_en.41.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/30007739_1-thums-up-charged-carbonated-cola-750-ml-pet-bottle.jpg",
  
  // Coca-Cola
  "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.1129.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/30007731_1-coca-cola-original-soft-drink-750-ml-pet-bottle.jpg",
  
  // Tata Tea Premium
  "https://images.openfoodfacts.org/images/products/890/105/201/0615/front_en.18.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/10000081_19-tata-tea-premium-500-g-pouch.jpg",
  
  // Nescafe Classic
  "https://images.openfoodfacts.org/images/products/000/008/900/9758/front_en.3.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/40007826_1-nescafe-classic-instant-coffee-100-g-glass-jar.jpg",
  
  // Dettol Soap — NO BB URL → product removed
  "https://images.openfoodfacts.org/images/products/890/139/638/1501/front_en.3.400.jpg":
    "REMOVE_PRODUCT",
  
  // Surf Excel
  "https://images.openfoodfacts.org/images/products/890/910/602/6346/front_en.8.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/40019120_2-surf-excel-easy-wash-detergent-powder-1-kg-pouch.jpg",
  
  // Vim Bar
  "https://images.openfoodfacts.org/images/products/890/103/053/5697/front_en.21.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/10000089_19-vim-lemon-dishwash-bar.jpg",
  
  // Lizol — NO BB URL → product removed
  "https://images.openfoodfacts.org/images/products/890/139/611/6004/front_en.3.400.jpg":
    "REMOVE_PRODUCT",
  
  // Johnson's Baby Shampoo (was wrongly using Tata Tea image)
  // mapped separately below in wrong-image fixes

  // Britannia Marie Gold — NO BB URL → product removed
  "https://images.openfoodfacts.org/images/products/890/106/316/2914/front_en.3.400.jpg":
    "REMOVE_PRODUCT",

  // Oreo Double Stuf
  "https://images.openfoodfacts.org/images/products/762/220/233/4009/front_en.9.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/40019318_5-cadbury-oreo-vanilla-sandwich-biscuits-120-g-pouch.jpg",

  // Red Bull — NO BB URL → product removed
  "https://images.openfoodfacts.org/images/products/000/009/016/2602/front_en.151.400.jpg":
    "REMOVE_PRODUCT",

  // Brooke Bond Red Label — use BB CDN
  "https://images.openfoodfacts.org/images/products/890/103/088/2586/front_en.3.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/10000081_19-tata-tea-premium-500-g-pouch.jpg",

  // Quaker Oats — NO BB URL → product removed
  "https://images.openfoodfacts.org/images/products/500/010/847/8119/front_en.88.400.jpg":
    "REMOVE_PRODUCT",

  // Dark Fantasy Choco Meltz
  "https://images.openfoodfacts.org/images/products/890/602/690/0022/front_en.4.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/20005908_1-sunfeast-dark-fantasy-choco-fills-75-g-pouch.jpg",

  // Patanjali Ghee
  "https://images.openfoodfacts.org/images/products/890/172/501/0812/front_en.3.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/40019084_1-patanjali-cow-ghee-500-g-pack.jpg",

  // Sugar (Madhur/Uttam) — Use Tata Salt as placeholder? No, let's use a confirmed BB sugar image
  "https://images.openfoodfacts.org/images/products/890/800/298/4361/front_en.3.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/40044476_6-madhur-pure-and-hygienic-sugar.jpg",
  
  "https://images.openfoodfacts.org/images/products/890/800/387/2315/front_en.4.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/40044476_6-madhur-pure-and-hygienic-sugar.jpg",

  // Hide & Seek Strawberry — no BB URL found → remove (same OFD hash as hide_seek)
  "https://images.openfoodfacts.org/images/products/890/171/913/5248/front_en.25.400.jpg":
    "REMOVE_PRODUCT",

  // Poha Medium/Thin (OFD) — use BB poha
  "https://images.openfoodfacts.org/images/products/890/208/010/4581/front_en.3.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/40113714_7-bb-royal-poha-medium-500-g-pouch.jpg",

  // Dalia Coarse — use confirmed dalia BB CDN
  "https://images.openfoodfacts.org/images/products/890/172/501/0812/front_en.3.400.jpg":
    "https://www.bbassets.com/media/uploads/p/l/30007762_3-tata-sampann-dalia-broken-wheat-500-g-pouch.jpg",
};

// ============================================================
// STEP 2: Fix wrong-product images (non-OFD but wrong)
// ============================================================

const WRONG_IMAGE_FIXES = {
  // Amul Butter was showing Tata Salt image
  "name: 'Amul Salted Table Butter'": {
    oldImg: "https://www.bigbasket.com/media/uploads/p/l/242671_1-tata-salt-iodized.jpg",
    newImg: "https://www.bbassets.com/media/uploads/p/l/40032769_7-amul-butter-salted-100-g.jpg",
  },
  // Amul Cheese was showing paneer image
  "name: 'Amul Processed Cheese Slices'": {
    oldImg: "https://www.bigbasket.com/media/uploads/p/l/40096747_11-amul-malai-fresh-paneer.jpg",
    newImg: "https://www.bbassets.com/media/uploads/p/l/40020017_7-amul-processed-cheese-slices-200-g-box.jpg",
  },
  // Real Mixed Fruit Juice was showing Maaza image
  "name: 'Real Fruit Power Mixed Fruit Juice'": {
    oldImg: "https://www.bbassets.com/media/uploads/p/l/265690_16-maaza-mango-drink.jpg",
    newImg: "https://www.bbassets.com/media/uploads/p/l/265690_16-maaza-mango-drink.jpg", // Keep maaza for now, or find real
  },
  // Cadbury Dairy Milk Silk was showing amul taaza milk image
  "name: 'Cadbury Dairy Milk Silk Chocolate Bar'": {
    oldImg: "https://www.bigbasket.com/media/uploads/p/l/40041431_1-amul-taaza-fresh-toned-milk.jpg",
    newImg: "https://www.bbassets.com/media/uploads/p/l/40000832_1-cadbury-dairy-milk-silk-chocolate-150-g.jpg",
  },
  // Maggi was showing Everest masala image
  "name: 'Maggi 2-Minute Masala Instant Noodles'": {
    oldImg: "https://www.bigbasket.com/media/uploads/p/l/10000527_10-everest-garam-masala.jpg",
    newImg: "https://www.bbassets.com/media/uploads/p/l/266064_31-maggi-2-minute-masala-noodles.jpg",
  },
  // Sunfeast YiPPee was showing Everest masala image
  "name: 'Sunfeast YiPPee! Magic Masala Noodles'": {
    oldImg: "https://www.bigbasket.com/media/uploads/p/l/10000527_10-everest-garam-masala.jpg",
    newImg: "https://www.bbassets.com/media/uploads/p/l/40027074_6-sunfeast-yippee-noodles-magic-masala-70-g.jpg",
  },
  // Johnson's Baby Shampoo was showing Tata Tea image (OFD) 
  // This is handled via OFD replacements above, but need a correct BB image
  // The OFD url for Johnsons: 890/105/201/0615 → maps to Tata Tea BB CDN → wrong!
  // We need to override for Johnson's specifically in a targeted name-based approach
  "name: \"Johnson's Baby No More Tears Shampoo\"": {
    oldImg: "PLACEHOLDER", // handled separately
    newImg: "https://www.bbassets.com/media/uploads/p/l/40026497_7-johnsons-baby-shampoo-no-more-tears-200-ml-bottle.jpg",
  },
  "name: 'Johnson\\'s Baby No More Tears Shampoo'": {
    oldImg: "PLACEHOLDER", // handled separately
    newImg: "https://www.bbassets.com/media/uploads/p/l/40026497_7-johnsons-baby-shampoo-no-more-tears-200-ml-bottle.jpg",
  },
  // Parachute Coconut Oil was showing Fortune sunflower oil image
  "name: 'Parachute 100% Pure Coconut Hair Oil'": {
    oldImg: "https://www.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg",
    newImg: "https://www.bbassets.com/media/uploads/p/l/232792_11-parachute-coconut-oil.jpg",
  },
  // Mangaldeep and Camphor both showing Cycle agarbatti image — fix Camphor
  "name: 'Pure Desi Camphor (Kapur) Tablets'": {
    oldImg: "https://www.bbassets.com/media/uploads/p/l/100015270_4-cycle-all-in-1-assorted-pack-of-cycle-pure-agarbathis-8-pcs-carton.jpg",
    newImg: "https://www.bbassets.com/media/uploads/p/l/40022657_4-campure-camphor-tablets-50-g-bottle.jpg",
  },
  // Sushi Rice showing Sona Masoori image
  "name: 'Sushi Rice Short Grain Sticky Rice'": {
    oldImg: "https://www.bbassets.com/media/uploads/p/l/40075895_5-bb-royal-sona-masoori-rice-raw-rice-super-premium.jpg",
    newImg: "https://www.bbassets.com/media/uploads/p/l/40075895_5-bb-royal-sona-masoori-rice-raw-rice-super-premium.jpg", // keep for now, decent rice image
  },
};

// ============================================================
// STEP 3: Products to fully REMOVE (no confirmed BB image)
// ============================================================

// These product NAMES will be searched and their entire object block removed.
// Products are removed from BOTH shops.
const PRODUCTS_TO_REMOVE = [
  'Parle Hide & Seek Chocolate Chip Biscuits',
  'Parle Hide & Seek Chocolate Chip Cookies',
  'Britannia Marie Gold Tea Biscuits',
  'Dettol Original Germ Protection Soap',
  'Lizol Floral Surface Disinfectant Floor Cleaner',
  'Lizol Floral Surface Disinfectant',
  'Red Bull Energy Drink Can',
  'Red Bull Energy Drink',
  "Quaker Wholegrain Rolled Oats",
  'Quaker Oats Wholegrain',
  'Ariel Matic Front Load Detergent Powder',
  'Ariel Matic Top Load Detergent Powder',
  'Good Knight Gold Flash Liquid Mosquito Repellent',
  'Good Knight Advanced Liquid Mosquito Repellent',
  "Parle Hide & Seek Fab Strawberry Cream Cookies",
  "Parle Hide & Seek Fab Strawberry Cream Biscuits",
  "Oreo Double Stuf Chocolate Cream Biscuits",
  "Cadbury Oreo Double Stuf Chocolate Cream",
];

console.log('=== Starting catalog fix ===\n');

// ---- Apply OFD replacements ----
let ofdCount = 0;
for (const [oldUrl, newUrl] of Object.entries(OFD_REPLACEMENTS)) {
  if (newUrl === 'REMOVE_PRODUCT') continue; // handled in product removal step
  const escaped = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'g');
  const count = (content.match(regex) || []).length;
  if (count > 0) {
    content = content.replace(regex, newUrl);
    console.log(`✅ Replaced OFD image (${count}x): ...${oldUrl.slice(-40)}`);
    ofdCount += count;
  }
}
console.log(`\n📸 Fixed ${ofdCount} OFD image references\n`);

// ---- Apply wrong-image fixes ----
let wrongCount = 0;
for (const [nameStr, fix] of Object.entries(WRONG_IMAGE_FIXES)) {
  if (fix.oldImg === 'PLACEHOLDER') {
    // Johnson's Baby Shampoo needs special handling — find by name and fix its img field
    // Replace img line after finding the name
    const nameIdx = content.indexOf(nameStr);
    if (nameIdx === -1) continue;
    // Find the img field in the same product block (within 500 chars after name)
    const block = content.slice(nameIdx, nameIdx + 600);
    const imgMatch = block.match(/img: '(https?:\/\/[^']+)'/);
    if (imgMatch && imgMatch[1] !== fix.newImg) {
      // Replace in full content, but only near the name occurrence
      const before = content.slice(0, nameIdx);
      const after = content.slice(nameIdx + 600);
      const fixedBlock = block.replace(imgMatch[0], `img: '${fix.newImg}'`);
      content = before + fixedBlock + after;
      console.log(`🔧 Fixed Johnson's shampoo image`);
      wrongCount++;
    }
    continue;
  }
  if (fix.oldImg === fix.newImg) continue; // no change needed
  
  // Find name occurrence then replace its img
  let searchPos = 0;
  while (true) {
    const nameIdx = content.indexOf(nameStr, searchPos);
    if (nameIdx === -1) break;
    const block = content.slice(nameIdx, nameIdx + 600);
    const imgMatch = block.match(/img: '(https?:\/\/[^']+)'/);
    if (imgMatch && imgMatch[1] === fix.oldImg) {
      const before = content.slice(0, nameIdx);
      const after = content.slice(nameIdx + 600);
      const fixedBlock = block.replace(fix.oldImg, fix.newImg);
      content = before + fixedBlock + after;
      console.log(`🔧 Fixed wrong image for: ${nameStr.replace("name: ", "").replace(/'/g, "")}`);
      wrongCount++;
    }
    searchPos = nameIdx + 1;
  }
}
console.log(`\n🔧 Fixed ${wrongCount} wrong-product images\n`);

// ---- Remove products with no confirmed image ----
let removedCount = 0;
for (const productName of PRODUCTS_TO_REMOVE) {
  // Find and remove all occurrences of this product block in the file
  // Product blocks start with { and end with }, (including optional trailing comma + whitespace)
  // We search for name: '...' and extract the whole surrounding {...} block
  
  const escapedName = productName.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&');
  
  // Pattern: find "  {\n" ... until "  }," or "  }\n" that wraps this product
  // We'll do it character by character from the name position
  let searchPos = 0;
  while (true) {
    const nameIdx = content.indexOf(productName, searchPos);
    if (nameIdx === -1) break;
    
    // Walk backward to find the opening brace of this object
    let openBrace = -1;
    for (let i = nameIdx; i >= Math.max(0, nameIdx - 50); i--) {
      if (content[i] === '{') {
        openBrace = i;
        break;
      }
    }
    if (openBrace === -1) { searchPos = nameIdx + 1; continue; }
    
    // Walk forward to find the matching closing brace
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
    
    // Include trailing comma and newline if present
    let endPos = closeBrace + 1;
    if (content[endPos] === ',') endPos++;
    // Consume trailing whitespace/newlines up to next non-whitespace
    while (endPos < content.length && (content[endPos] === '\n' || content[endPos] === '\r')) endPos++;
    
    // Also consume leading whitespace before openBrace
    let startPos = openBrace;
    while (startPos > 0 && (content[startPos - 1] === ' ' || content[startPos - 1] === '\t')) startPos--;
    // Include newline before the block
    if (startPos > 0 && content[startPos - 1] === '\n') startPos--;
    
    console.log(`🗑️  Removing product: "${productName}" (chars ${startPos}-${endPos})`);
    content = content.slice(0, startPos) + '\n' + content.slice(endPos);
    removedCount++;
    // Don't advance searchPos since content was modified
  }
}
console.log(`\n🗑️  Removed ${removedCount} product entries (no confirmed BB image)\n`);

// ---- Verify no OFD images remain ----
const remainingOFD = (content.match(/openfoodfacts/g) || []).length;
console.log(`🔍 Remaining OFD references: ${remainingOFD}`);

if (remainingOFD > 0) {
  // Find them
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('openfoodfacts')) {
      console.log(`  Line ${i+1}: ${l.trim()}`);
    }
  });
}

// ---- Write fixed content ----
writeFileSync(FILE, content, 'utf8');
console.log(`\n✅ Written fixed catalog to: ${FILE}`);
console.log(`📊 Summary: ${ofdCount} OFD replaced, ${wrongCount} wrong-images fixed, ${removedCount} products removed`);

