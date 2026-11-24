// scripts/fast-find-bb.mjs
const candidates = {
  amul_butter: [
    'https://www.bbassets.com/media/uploads/p/l/104860_8-amul-butter-pasteurised.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40032769_1-amul-butter-pasteurised.jpg',
  ],
  amul_cheese: [
    'https://www.bbassets.com/media/uploads/p/l/104808_9-amul-cheese-slices.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40020017_1-amul-processed-cheese-slices.jpg',
    'https://www.bbassets.com/media/uploads/p/l/104808_10-amul-cheese-slices.jpg',
    'https://www.bbassets.com/media/uploads/p/l/104808_8-amul-cheese-slices.jpg',
  ],
  dairy_milk: [
    'https://www.bbassets.com/media/uploads/p/l/281026_9-cadbury-dairy-milk-chocolate.jpg',
    'https://www.bbassets.com/media/uploads/p/l/281026_10-cadbury-dairy-milk-chocolate.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40000832_2-cadbury-dairy-milk-silk-chocolate-bar.jpg',
    'https://www.bbassets.com/media/uploads/p/l/100022204_4-cadbury-dairy-milk-silk-chocolate-bar.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40000832_12-cadbury-dairy-milk-silk-chocolate-bar.jpg',
  ],
  real_juice: [
    'https://www.bbassets.com/media/uploads/p/l/231184_6-real-fruit-power-juice-mixed-fruit.jpg',
    'https://www.bbassets.com/media/uploads/p/l/231184_7-real-fruit-power-juice-mixed-fruit.jpg',
    'https://www.bbassets.com/media/uploads/p/l/231184_8-real-fruit-power-juice-mixed-fruit.jpg',
    'https://www.bbassets.com/media/uploads/p/l/231184_9-real-fruit-power-juice-mixed-fruit.jpg',
    'https://www.bbassets.com/media/uploads/p/l/231184_10-real-fruit-power-juice-mixed-fruit.jpg',
    'https://www.bbassets.com/media/uploads/p/l/231184_11-real-fruit-power-juice-mixed-fruit.jpg',
    'https://www.bbassets.com/media/uploads/p/l/231184_12-real-fruit-power-juice-mixed-fruit.jpg',
  ],
  yippee: [
    'https://www.bbassets.com/media/uploads/p/l/266160_13-sunfeast-yippee-noodles-magic-masala.jpg',
    'https://www.bbassets.com/media/uploads/p/l/266160_14-sunfeast-yippee-noodles-magic-masala.jpg',
    'https://www.bbassets.com/media/uploads/p/l/266160_15-sunfeast-yippee-noodles-magic-masala.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40027074_1-sunfeast-yippee-noodles-magic-masala.jpg',
  ],
  parachute: [
    'https://www.bbassets.com/media/uploads/p/l/10000204_18-parachute-100-pure-coconut-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000204_19-parachute-100-pure-coconut-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000204_20-parachute-100-pure-coconut-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000204_21-parachute-100-pure-coconut-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000204_22-parachute-100-pure-coconut-oil.jpg',
  ],
  maggi: [
    'https://www.bbassets.com/media/uploads/p/l/266064_1-maggi-2-minute-masala-noodles.jpg',
  ],
  johnsons: [
    'https://www.bbassets.com/media/uploads/p/l/10000109_18-johnsons-baby-shampoo.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000109_19-johnsons-baby-shampoo.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000109_20-johnsons-baby-shampoo.jpg',
  ],
  saffola: [
    'https://www.bbassets.com/media/uploads/p/l/258249_14-saffola-gold-pro-healthy-lifestyle-edible-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/258249_15-saffola-gold-pro-healthy-lifestyle-edible-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/258249_16-saffola-gold-pro-healthy-lifestyle-edible-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000554_11-fortune-sunlite-refined-sunflower-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg',
  ],
  capsicum: [
    'https://www.bbassets.com/media/uploads/p/l/10000067_23-fresho-capsicum-green.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000067_22-fresho-capsicum-green.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000067_21-fresho-capsicum-green.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000067_20-fresho-capsicum-green.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000068_22-fresho-capsicum-green.jpg',
    'https://www.bigbasket.com/media/uploads/p/l/10000067_20-fresho-capsicum-green.jpg',
  ],
  harpic: [
    'https://www.bbassets.com/media/uploads/p/l/266946_13-harpic-disinfectant-toilet-cleaner-liquid-original.jpg',
    'https://www.bbassets.com/media/uploads/p/l/266946_14-harpic-disinfectant-toilet-cleaner-liquid-original.jpg',
    'https://www.bbassets.com/media/uploads/p/l/266946_15-harpic-disinfectant-toilet-cleaner-liquid-original.jpg',
    'https://www.bbassets.com/media/uploads/p/l/266946_16-harpic-disinfectant-toilet-cleaner-liquid-original.jpg',
    'https://www.bbassets.com/media/uploads/p/l/266946_17-harpic-disinfectant-toilet-cleaner-liquid-original.jpg',
    'https://www.bbassets.com/media/uploads/p/l/266946_18-harpic-disinfectant-toilet-cleaner-liquid-original.jpg',
  ],
  krackjack: [
    'https://www.bbassets.com/media/uploads/p/l/102179_12-parle-krackjack-biscuits.jpg',
    'https://www.bbassets.com/media/uploads/p/l/102179_13-parle-krackjack-biscuits.jpg',
    'https://www.bbassets.com/media/uploads/p/l/102179_14-parle-krackjack-biscuits.jpg',
    'https://www.bbassets.com/media/uploads/p/l/102179_15-parle-krackjack-biscuits.jpg',
  ],
  mustard_oil: [
    'https://www.bbassets.com/media/uploads/p/l/274121_8-fortune-kachi-ghani-pure-mustard-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/274121_9-fortune-kachi-ghani-pure-mustard-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/274121_10-fortune-kachi-ghani-pure-mustard-oil.jpg',
  ],
  pepsi: [
    'https://www.bbassets.com/media/uploads/p/l/251023_11-pepsi-soft-drink.jpg',
    'https://www.bbassets.com/media/uploads/p/l/251023_12-pepsi-soft-drink.jpg',
    'https://www.bbassets.com/media/uploads/p/l/251023_13-pepsi-soft-drink.jpg',
    'https://www.bbassets.com/media/uploads/p/l/251023_14-pepsi-soft-drink.jpg',
  ],
  minute_maid: [
    'https://www.bbassets.com/media/uploads/p/l/265738_10-minute-maid-pulpy-orange-juice.jpg',
    'https://www.bbassets.com/media/uploads/p/l/265738_11-minute-maid-pulpy-orange-juice.jpg',
    'https://www.bbassets.com/media/uploads/p/l/265738_12-minute-maid-pulpy-orange-juice.jpg',
  ],
  turmeric: [
    'https://www.bbassets.com/media/uploads/p/l/268940_4-everest-turmeric-powder.jpg',
    'https://www.bbassets.com/media/uploads/p/l/268940_5-everest-turmeric-powder.jpg',
    'https://www.bbassets.com/media/uploads/p/l/268940_6-everest-turmeric-powder.jpg',
  ],
  deggi_mirch: [
    'https://www.bbassets.com/media/uploads/p/l/268936_5-mdh-deggi-mirch-powder.jpg',
    'https://www.bbassets.com/media/uploads/p/l/268936_6-mdh-deggi-mirch-powder.jpg',
    'https://www.bbassets.com/media/uploads/p/l/268936_7-mdh-deggi-mirch-powder.jpg',
  ],
  sabudana: [
    'https://www.bbassets.com/media/uploads/p/l/40044719_3-bb-royal-sabudana-medium.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40044719_4-bb-royal-sabudana-medium.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000442_16-bb-royal-sabudana-sago.jpg',
  ],
  ragi: [
    'https://www.bbassets.com/media/uploads/p/l/40044709_2-bb-royal-ragi-whole.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40044709_3-bb-royal-ragi-whole.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000451_16-bb-royal-ragi.jpg',
  ],
  poha: [
    'https://www.bbassets.com/media/uploads/p/l/10000438_15-bb-royal-poha-avalakki-thick.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000438_16-bb-royal-poha-avalakki-thick.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000438_17-bb-royal-poha-avalakki-thick.jpg',
  ],
  camphor: [
    'https://www.bbassets.com/media/uploads/p/l/40192806_2-cycle-pure-agarbathies-camphor-tablets.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40192806_3-cycle-pure-agarbathies-camphor-tablets.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40077180_2-mangaldeep-camphor-tablets.jpg',
  ]
};

async function testAll() {
  const verified = {};
  for (const [key, urls] of Object.entries(candidates)) {
    for (const u of urls) {
      try {
        const res = await fetch(u, { method: 'HEAD' });
        if (res.status === 200) {
          verified[key] = u;
          console.log(`[VERIFIED] ${key}: ${u}`);
          break;
        }
      } catch {}
    }
    if (!verified[key]) {
      console.log(`[FAIL] ${key}`);
    }
  }
}
testAll();

