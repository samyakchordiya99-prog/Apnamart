// scripts/test-candidates.mjs
const testUrls = [
  'https://www.bbassets.com/media/uploads/p/l/40174323_7-parle-g-gluco-biscuits-800-g-pouch.jpg',
  'https://www.bbassets.com/media/uploads/p/l/263531_24-britannia-marie-gold-biscuits.jpg',
  'https://www.bbassets.com/media/uploads/p/l/20005908_1-sunfeast-dark-fantasy-choco-fills-75-g-pouch.jpg',
  'https://www.bbassets.com/media/uploads/p/l/281026_10-cadbury-dairy-milk-chocolate.jpg',
  'https://www.bbassets.com/media/uploads/p/l/266064_1-maggi-2-minute-masala-noodles.jpg',
  'https://www.bbassets.com/media/uploads/p/l/10000081_19-tata-tea-premium.jpg',
  'https://www.bbassets.com/media/uploads/p/l/10000204_18-parachute-100-pure-coconut-oil.jpg',
  'https://www.bbassets.com/media/uploads/p/l/10000162_16-harpic-power-plus-toilet-cleaner-original.jpg',
  'https://www.bbassets.com/media/uploads/p/l/10000442_18-bb-royal-sabudana-sago.jpg',
  'https://www.bbassets.com/media/uploads/p/l/10000438_16-bb-royal-poha-avalakki-thick.jpg',
  'https://www.bbassets.com/media/uploads/p/l/251023_11-pepsi-soft-drink.jpg',
  'https://www.bbassets.com/media/uploads/p/l/10000109_18-johnsons-baby-shampoo.jpg',
  'https://www.bbassets.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg',
  'https://www.bbassets.com/media/uploads/p/l/10000067_23-fresho-capsicum-green.jpg',
  'https://www.bbassets.com/media/uploads/p/l/40032769_1-amul-butter-pasteurised.jpg',
  'https://www.bbassets.com/media/uploads/p/l/104808_9-amul-cheese-slices.jpg',
  'https://www.bbassets.com/media/uploads/p/l/40027074_1-sunfeast-yippee-noodles-magic-masala.jpg'
];

async function run() {
  for (const u of testUrls) {
    try {
      const res = await fetch(u, { method: 'HEAD' });
      console.log(res.status, u.split('/').pop());
    } catch (e) {
      console.log('ERR', u.split('/').pop());
    }
  }
}
run();

