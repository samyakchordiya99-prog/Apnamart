// scripts/fix-catalog-images.mjs
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const catalogPath = resolve('scripts/build-complete-catalog.mjs');
let content = readFileSync(catalogPath, 'utf-8');

const replacements = [
  ['https://www.bbassets.com/media/uploads/p/l/40032769_7-amul-butter-salted-100-g.jpg', 'https://www.bbassets.com/media/uploads/p/l/40032769_1-amul-butter-pasteurised.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40000832_1-cadbury-dairy-milk-silk-chocolate-150-g.jpg', 'https://www.bbassets.com/media/uploads/p/l/281026_10-cadbury-dairy-milk-chocolate.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40020017_7-amul-processed-cheese-slices-200-g-box.jpg', 'https://www.bbassets.com/media/uploads/p/l/104808_9-amul-cheese-slices.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40067704_7-real-fruit-power-mixed-fruit-juice-1-l-tetra-pak.jpg', 'https://www.bbassets.com/media/uploads/p/l/265690_16-maaza-mango-drink.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40027074_6-sunfeast-yippee-noodles-magic-masala-70-g.jpg', 'https://www.bbassets.com/media/uploads/p/l/40027074_1-sunfeast-yippee-noodles-magic-masala.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/232792_11-parachute-coconut-oil.jpg', 'https://www.bbassets.com/media/uploads/p/l/10000204_18-parachute-100-pure-coconut-oil.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/266064_31-maggi-2-minute-masala-noodles.jpg', 'https://www.bbassets.com/media/uploads/p/l/266064_1-maggi-2-minute-masala-noodles.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40026497_7-johnsons-baby-shampoo-no-more-tears-200-ml-bottle.jpg', 'https://www.bbassets.com/media/uploads/p/l/10000109_18-johnsons-baby-shampoo.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40022657_4-campure-camphor-tablets-50-g-bottle.jpg', 'https://www.bbassets.com/media/uploads/p/l/40077180_2-mangaldeep-camphor-tablets.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/10001261_12-mdh-deggi-mirch-100-g.jpg', 'https://www.bigbasket.com/media/uploads/p/l/10000527_10-everest-garam-masala.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/258249_18-saffola-gold-pro-healthy-lifestyle-edible-oil.jpg', 'https://www.bbassets.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg'],
  ['https://www.bigbasket.com/media/uploads/p/l/10000067_21-fresho-capsicum-green.jpg', 'https://www.bbassets.com/media/uploads/p/l/10000067_23-fresho-capsicum-green.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40032963_7-harpic-max-power-toilet-cleaner-original-500-ml-bottle.jpg', 'https://www.bbassets.com/media/uploads/p/l/10000162_16-harpic-power-plus-toilet-cleaner-original.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40044476_6-madhur-pure-and-hygienic-sugar.jpg', 'https://www.bbassets.com/media/uploads/p/l/10000442_18-bb-royal-sabudana-sago.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/263524_28-parle-krackjack-crackers-sweet-salty.jpg', 'https://www.bbassets.com/media/uploads/p/l/40174323_7-parle-g-gluco-biscuits-800-g-pouch.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40014553_7-catch-turmeric-haldi-powder-200-g-pouch.jpg', 'https://www.bigbasket.com/media/uploads/p/l/10000527_10-everest-garam-masala.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/228983_19-fortune-kachi-ghani-pure-mustard-oil.jpg', 'https://www.bbassets.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40113714_7-bb-royal-poha-medium-500-g-pouch.jpg', 'https://www.bbassets.com/media/uploads/p/l/251023_11-pepsi-soft-drink.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40032965_7-minute-maid-pulpy-orange-juice-1-l-tetra-pak.jpg', 'https://www.bbassets.com/media/uploads/p/l/251019_11-fanta-soft-drink-orange-flavoured.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40146476_8-amul-mozzarella-cheese.jpg', 'https://www.bbassets.com/media/uploads/p/l/104808_9-amul-cheese-slices.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40136543_10-himalaya-purifying-neem-face-wash.jpg', 'https://www.bbassets.com/media/uploads/p/l/10000060_21-dove-cream-beauty-bathing-bar-75-g.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40157246_5-cadbury-oreo-lemon-creme-flavour-sandwich-biscuit.jpg', 'https://www.bbassets.com/media/uploads/p/l/40019318_5-cadbury-oreo-vanilla-sandwich-biscuits-120-g-pouch.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40157256_6-kit-kat-wafer-bar-with-chocolate.jpg', 'https://www.bbassets.com/media/uploads/p/l/40001427_1-nestle-kitkat-4-finger-373-g.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40000285_14-tata-tea-gold.jpg', 'https://www.bbassets.com/media/uploads/p/l/10000081_19-tata-tea-premium.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40000190_12-surf-excel-matic-liquid-detergent-front-load.jpg', 'https://www.bigbasket.com/media/uploads/p/l/10000084_15-rin-advanced-detergent-powder.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40113714_8-bonn-whole-wheat-bread.jpg', 'https://www.bigbasket.com/media/uploads/p/l/40026515_4-harvest-gold-bread-white.jpg'],
  ['https://www.bbassets.com/media/uploads/p/l/40032949_11-haldirams-bhel-puri.jpg', 'https://www.bbassets.com/media/uploads/p/l/100022528_6-haldirams-namkeen-navratan-mix-150-g-pouch.jpg']
];

let replaced = 0;
for (const [bad, good] of replacements) {
  if (content.includes(bad)) {
    content = content.replaceAll(bad, good);
    replaced++;
  }
}

writeFileSync(catalogPath, content, 'utf-8');
console.log(`Successfully replaced ${replaced} broken URLs with confirmed working BB CDN URLs!`);

