// scripts/fast-find-bb-2.mjs
const candidates = {
  harpic: [
    'https://www.bbassets.com/media/uploads/p/l/10000162_15-harpic-power-plus-toilet-cleaner-original.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000162_16-harpic-power-plus-toilet-cleaner-original.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000162_17-harpic-power-plus-toilet-cleaner-original.jpg',
    'https://www.bbassets.com/media/uploads/p/l/266946_19-harpic-disinfectant-toilet-cleaner-liquid-original.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40032963_1-harpic-power-plus-toilet-cleaner.jpg',
  ],
  krackjack: [
    'https://www.bbassets.com/media/uploads/p/l/102179_16-parle-krackjack-biscuits.jpg',
    'https://www.bbassets.com/media/uploads/p/l/102179_17-parle-krackjack-biscuits.jpg',
    'https://www.bbassets.com/media/uploads/p/l/263524_20-parle-krackjack-sweet-salty-crackers.jpg',
    'https://www.bbassets.com/media/uploads/p/l/263524_25-parle-krackjack-sweet-salty-crackers.jpg',
    'https://www.bbassets.com/media/uploads/p/l/263524_22-parle-krackjack-sweet-salty-crackers.jpg',
    'https://www.bbassets.com/media/uploads/p/l/263524_19-parle-krackjack-sweet-salty-crackers.jpg',
  ],
  mustard_oil: [
    'https://www.bbassets.com/media/uploads/p/l/274121_12-fortune-kachi-ghani-pure-mustard-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/274121_14-fortune-kachi-ghani-pure-mustard-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/274121_15-fortune-kachi-ghani-pure-mustard-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000547_11-fortune-kachi-ghani-mustard-oil.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000547_12-fortune-kachi-ghani-mustard-oil.jpg',
  ],
  real_juice: [
    'https://www.bbassets.com/media/uploads/p/l/231184_15-real-fruit-power-juice-mixed-fruit.jpg',
    'https://www.bbassets.com/media/uploads/p/l/231184_16-real-fruit-power-juice-mixed-fruit.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000288_12-real-fruit-power-mixed-fruit-juice.jpg',
    'https://www.bbassets.com/media/uploads/p/l/231184_5-real-fruit-power-juice-mixed-fruit.jpg',
  ],
  minute_maid: [
    'https://www.bbassets.com/media/uploads/p/l/265738_15-minute-maid-pulpy-orange-juice.jpg',
    'https://www.bbassets.com/media/uploads/p/l/265738_14-minute-maid-pulpy-orange-juice.jpg',
    'https://www.bbassets.com/media/uploads/p/l/265738_13-minute-maid-pulpy-orange-juice.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40032965_1-minute-maid-pulpy-orange.jpg',
  ],
  turmeric: [
    'https://www.bbassets.com/media/uploads/p/l/268940_7-everest-turmeric-powder.jpg',
    'https://www.bbassets.com/media/uploads/p/l/268940_8-everest-turmeric-powder.jpg',
    'https://www.bbassets.com/media/uploads/p/l/268940_9-everest-turmeric-powder.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000456_15-bb-royal-turmeric-powder.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000456_16-bb-royal-turmeric-powder.jpg',
  ],
  deggi_mirch: [
    'https://www.bbassets.com/media/uploads/p/l/268936_8-mdh-deggi-mirch-powder.jpg',
    'https://www.bbassets.com/media/uploads/p/l/268936_9-mdh-deggi-mirch-powder.jpg',
    'https://www.bbassets.com/media/uploads/p/l/268936_10-mdh-deggi-mirch-powder.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10001261_1-mdh-deggi-mirch.jpg',
  ],
  sabudana: [
    'https://www.bbassets.com/media/uploads/p/l/10000442_17-bb-royal-sabudana-sago.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000442_18-bb-royal-sabudana-sago.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000442_19-bb-royal-sabudana-sago.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000442_20-bb-royal-sabudana-sago.jpg',
  ],
  ragi: [
    'https://www.bbassets.com/media/uploads/p/l/10000451_17-bb-royal-ragi.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000451_18-bb-royal-ragi.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000451_19-bb-royal-ragi.jpg',
    'https://www.bbassets.com/media/uploads/p/l/10000451_20-bb-royal-ragi.jpg',
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

