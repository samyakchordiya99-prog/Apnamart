const fs = require('fs');

const files = ['all_products.csv', 'shop1_products.csv', 'shop2_products.csv'];
files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let lines = fs.readFileSync(file, 'utf8').split('\n');
  let updated = lines.map(line => {
    if (line.includes('SHOP_01_PROD_004') || line.includes('SHOP_02_PROD_086')) {
      return line.replace(/https:\/\/www\.bbassets\.com\/media\/uploads\/p\/l\/40019318_5-cadbury-oreo[^\",]+/, '/products/cadbury-oreo-vanilla.svg')
                 .replace(/bigbasket_cdn/, 'apnamart_authentic_packshot');
    }
    if (line.includes('SHOP_01_PROD_007') || line.includes('SHOP_02_PROD_083')) {
      return line.replace(/https:\/\/www\.bbassets\.com\/media\/uploads\/p\/l\/40174323_7-britannia-little-hearts[^\",]+/, '/products/britannia-little-hearts.svg')
                 .replace(/bigbasket_cdn/, 'apnamart_authentic_packshot');
    }
    return line;
  });
  fs.writeFileSync(file, updated.join('\n'));
  console.log('Updated ' + file);
});

if (fs.existsSync('src/data/productData.ts')) {
  let pData = fs.readFileSync('src/data/productData.ts', 'utf8');
  pData = pData.replace(/("id":\s*"SHOP_01_PROD_004"[\s\S]*?"imageUrl":\s*")[^"]+(")/, '$1/products/cadbury-oreo-vanilla.svg$2');
  pData = pData.replace(/("id":\s*"SHOP_01_PROD_007"[\s\S]*?"imageUrl":\s*")[^"]+(")/, '$1/products/britannia-little-hearts.svg$2');
  pData = pData.replace(/("id":\s*"SHOP_02_PROD_083"[\s\S]*?"imageUrl":\s*")[^"]+(")/, '$1/products/britannia-little-hearts.svg$2');
  pData = pData.replace(/("id":\s*"SHOP_02_PROD_086"[\s\S]*?"imageUrl":\s*")[^"]+(")/, '$1/products/cadbury-oreo-vanilla.svg$2');
  fs.writeFileSync('src/data/productData.ts', pData);
  console.log('Updated productData.ts');
}
