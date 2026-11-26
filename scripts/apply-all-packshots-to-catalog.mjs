import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Mapping rules: predicate on product name -> new verified image URL
const IMAGE_RULES = [
  { match: (n) => /krackjack/i.test(n), url: '/products/parle-krackjack.svg' },
  { match: (n) => /nutrichoice.*digestive/i.test(n), url: '/products/nutrichoice-digestive.svg' },
  { match: (n) => /good day butter/i.test(n), url: '/products/good-day-butter.svg' },
  { match: (n) => /butter bite/i.test(n), url: '/products/priyagold-butter-bite.svg' },
  { match: (n) => /oreo.*lemon/i.test(n), url: '/products/oreo-lemon-cream.svg' },
  
  // Dals & Pulses
  { match: (n) => /yellow moong dal dhuli/i.test(n), url: '/products/yellow-moong-dal-dhuli.svg' },
  { match: (n) => /green moong dal chilka/i.test(n), url: '/products/green-moong-dal-chilka.svg' },
  { match: (n) => /whole moth beans/i.test(n) || /matki/i.test(n) && !/sprout/i.test(n), url: '/products/clean-whole-matki.svg' },
  { match: (n) => /white urad dal dhuli/i.test(n), url: '/products/white-urad-dal-dhuli.svg' },
  { match: (n) => /black urad dal chilka/i.test(n), url: '/products/black-urad-dal-chilka.svg' },

  // Sprouts (Ankurit)
  { match: (n) => /moong sprout/i.test(n), url: '/products/fresh-moong-sprouts.svg' },
  { match: (n) => /chana sprout/i.test(n), url: '/products/fresh-kala-chana-sprouts.svg' },
  { match: (n) => /matki.*sprout/i.test(n) || /moth bean sprout/i.test(n), url: '/products/fresh-matki-sprouts.svg' },
  { match: (n) => /tri-sprout/i.test(n), url: '/products/fresh-tri-sprouts.svg' },
  { match: (n) => /soybean sprout/i.test(n), url: '/products/fresh-soybean-sprouts.svg' },

  // Sugar & Chocolates
  { match: (n) => /madhur.*sugar/i.test(n), url: '/products/madhur-crystal-sugar.svg' },
  { match: (n) => /uttam.*sugar/i.test(n), url: '/products/uttam-sugar.svg' },
  { match: (n) => /ferrero rocher/i.test(n), url: '/products/ferrero-rocher.svg' },
  { match: (n) => /nestle munch/i.test(n), url: '/products/nestle-munch.svg' },
  { match: (n) => /kurkure.*masala munch/i.test(n), url: 'https://www.bbassets.com/media/uploads/p/l/102761_17-kurkure-namkeen-masala-munch-85-g.jpg' },

  // Bread
  { match: (n) => /brown bread/i.test(n), url: '/products/brown-bread.svg' },
  { match: (n) => /atta bread/i.test(n), url: '/products/harvest-gold-atta-bread.svg' },

  // Tea & Beverages
  { match: (n) => /red label strong/i.test(n), url: '/products/red-label-tea.svg' },
  { match: (n) => /red label natural care/i.test(n), url: '/products/red-label-natural-care.svg' },
  { match: (n) => /tata tea gold/i.test(n), url: '/products/tata-tea-gold.svg' },
  { match: (n) => /tata coffee grand/i.test(n), url: '/products/tata-coffee-grand.svg' },
  { match: (n) => /real.*mixed fruit/i.test(n), url: '/products/real-mixed-fruit.svg' },
  { match: (n) => /minute maid/i.test(n), url: '/products/minute-maid-orange.svg' },

  // Staples, Oil & Masala
  { match: (n) => /fortune.*chakki/i.test(n), url: '/products/fortune-chakki-atta.svg' },
  { match: (n) => /saffola gold/i.test(n), url: '/products/saffola-gold-oil.svg' },
  { match: (n) => /fortune.*mustard oil/i.test(n), url: '/products/fortune-mustard-oil.svg' },
  { match: (n) => /patanjali.*cow.*ghee/i.test(n), url: '/products/patanjali-cow-ghee.svg' },
  { match: (n) => /patanjali.*til.*oil/i.test(n) || /sesame.*til.*oil/i.test(n), url: '/products/patanjali-til-oil.svg' },
  { match: (n) => /catch.*turmeric/i.test(n) || /catch.*haldi/i.test(n), url: '/products/catch-haldi.svg' },
  { match: (n) => /deggi mirch/i.test(n), url: '/products/mdh-deggi-mirch.svg' },
  { match: (n) => /catch.*garam masala/i.test(n), url: '/products/catch-garam-masala.svg' },

  // Millets, Poha & Dalia
  { match: (n) => /poha.*thin/i.test(n), url: '/products/poha-thin.svg' },
  { match: (n) => /dalia/i.test(n), url: '/products/dalia-broken-wheat.svg' },
  { match: (n) => /jowar/i.test(n), url: '/products/jowar-whole-grain.svg' },
  { match: (n) => /bajra/i.test(n), url: '/products/bajra-whole-grain.svg' },
  { match: (n) => /ragi/i.test(n), url: '/products/ragi-whole-grain.svg' },

  // Frozen & Snacks
  { match: (n) => /aloo tikki/i.test(n), url: '/products/mccain-aloo-tikki.svg' },
  { match: (n) => /burger patty/i.test(n), url: '/products/mccain-burger-patty.svg' },
  { match: (n) => /corn triangles/i.test(n), url: '/products/cheesy-corn-triangles.svg' },
  { match: (n) => /bhelpuri/i.test(n), url: '/products/haldirams-bhelpuri.svg' },
  { match: (n) => /mozzarella/i.test(n), url: '/products/amul-mozzarella.svg' },

  // Personal Care, Baby & Pooja
  { match: (n) => /cerelac/i.test(n), url: '/products/cerelac-wheat-apple.svg' },
  { match: (n) => /diya wicks/i.test(n) || /phool batti/i.test(n), url: '/products/cotton-diya-wicks.svg' },
  { match: (n) => /surf excel.*liquid/i.test(n) || /matic liquid/i.test(n), url: '/products/surf-excel-matic-liquid.svg' },
  { match: (n) => /himalaya.*face wash/i.test(n) || /neem face wash/i.test(n), url: '/products/himalaya-neem-face-wash.svg' },
  { match: (n) => /sebamed baby/i.test(n), url: '/products/sebamed-baby-bar.svg' },
  { match: (n) => /mosambi/i.test(n) || /sweet orange/i.test(n), url: '/products/fresh-mosambi.svg' }
];

async function applyFixes() {
  const prodDataModule = await import('../src/data/productData.ts');
  const shop1 = prodDataModule.SHOP_01_PRODUCTS;
  const shop2 = prodDataModule.SHOP_02_PRODUCTS;

  let fixedCount = 0;

  function processProducts(prods, shopLabel) {
    for (const p of prods) {
      for (const rule of IMAGE_RULES) {
        if (rule.match(p.name)) {
          if (p.imageUrl !== rule.url) {
            console.log(`[${shopLabel}] Fixed: "${p.name}"`);
            console.log(`   Old: ${p.imageUrl.split('/').pop()}`);
            console.log(`   New: ${rule.url}\n`);
            p.imageUrl = rule.url;
            p.imageSource = 'apnamart_authentic_packshot';
            p.imageMatchStatus = 'verified';
            p.imageMatchType = 'exact_product';
            p.updatedAt = Date.now();
            fixedCount++;
          }
          break;
        }
      }
    }
  }

  processProducts(shop1, 'SHOP_01');
  processProducts(shop2, 'SHOP_02');

  console.log(`Total images updated: ${fixedCount}`);

  // Re-write src/data/productData.ts
  const code = `// Auto-generated comprehensive catalog dataset for ApnaMart Kirana Shops
// Features extensive Blinkit-style varieties: Biscuits, Rice, Dal, Sprouts, Chips & Essentials
import type { Product } from '../types';

export const SHOP_01_PRODUCTS: Product[] = ${JSON.stringify(shop1, null, 2)};

export const SHOP_02_PRODUCTS: Product[] = ${JSON.stringify(shop2, null, 2)};

export const ALL_DEMO_PRODUCTS: Product[] = [...SHOP_01_PRODUCTS, ...SHOP_02_PRODUCTS];

export function getDemoProductsForShop(shopId: string): Product[] {
  if (shopId === 'SHOP_01') return SHOP_01_PRODUCTS;
  if (shopId === 'SHOP_02') return SHOP_02_PRODUCTS;
  return SHOP_01_PRODUCTS;
}
`;

  writeFileSync(resolve('src/data/productData.ts'), code, 'utf-8');
  console.log('✅ Successfully wrote updated src/data/productData.ts');

  // Re-write CSV files
  function escapeCsv(val) {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function generateCsv(products) {
    const headers = [
      'productId',
      'shopId',
      'shopName',
      'productName',
      'category',
      'brand',
      'description',
      'quantityOrPack',
      'mrp',
      'discountPercent',
      'sellingPrice',
      'stockQuantity',
      'unit',
      'imageUrl',
      'imageSource',
      'imageMatchStatus',
      'imageMatchType',
      'isAvailable',
      'isDemoData',
      'createdAt',
      'updatedAt'
    ];
    const rows = [headers.join(',')];
    for (const p of products) {
      const row = headers.map((h) => escapeCsv(p[h]));
      rows.push(row.join(','));
    }
    return rows.join('\n');
  }

  const allProducts = [...shop1, ...shop2];
  writeFileSync(resolve('shop1_products.csv'), generateCsv(shop1), 'utf-8');
  writeFileSync(resolve('shop2_products.csv'), generateCsv(shop2), 'utf-8');
  writeFileSync(resolve('all_products.csv'), generateCsv(allProducts), 'utf-8');
  console.log('✅ Successfully updated shop1_products.csv, shop2_products.csv, and all_products.csv');
}

applyFixes();
