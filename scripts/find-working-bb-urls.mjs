// scripts/find-working-bb-urls.mjs
const targets = [
  { id: '104860', slug: 'amul-butter-pasteurised' },
  { id: '40032769', slug: 'amul-butter-pasteurised' },
  { id: '10000081', slug: 'tata-tea-premium' },
  { id: '266064', slug: 'maggi-2-minute-masala-noodles' },
  { id: '232792', slug: 'parachute-100-pure-coconut-oil' },
  { id: '232792', slug: 'parachute-coconut-oil' },
  { id: '10000554', slug: 'fortune-sunlite-refined-sunflower-oil' },
  { id: '10000431', slug: 'bb-royal-moong-dal' },
  { id: '40000832', slug: 'cadbury-dairy-milk-silk-chocolate-bar' },
  { id: '281026', slug: 'cadbury-dairy-milk-chocolate' },
  { id: '40020017', slug: 'amul-processed-cheese-slices' },
  { id: '241600', slug: 'tata-sampann-unpolished-toor-dal' },
  { id: '40067704', slug: 'real-fruit-power-mixed-fruit-juice' },
  { id: '231184', slug: 'real-fruit-power-juice-mixed-fruit' },
  { id: '40027074', slug: 'sunfeast-yippee-noodles-magic-masala' },
  { id: '263524', slug: 'parle-krackjack-sweet-salty-crackers' },
  { id: '40044476', slug: 'madhur-pure-hygienic-sugar' },
  { id: '40044476', slug: 'madhur-sugar-pure-hygienic' },
  { id: '10000407', slug: 'bb-royal-sugar' },
  { id: '228983', slug: 'fortune-kachi-ghani-pure-mustard-oil' },
  { id: '40032963', slug: 'harpic-power-plus-toilet-cleaner-original' },
  { id: '266946', slug: 'harpic-toilet-cleaner-original' },
  { id: '40014553', slug: 'catch-turmeric-powder' },
  { id: '10000456', slug: 'bb-royal-turmeric-powder' },
  { id: '40113714', slug: 'bb-royal-poha-medium' },
  { id: '10000438', slug: 'bb-royal-poha-thick' },
  { id: '10000437', slug: 'bb-royal-poha-thin' },
  { id: '10000067', slug: 'fresho-capsicum-green' },
  { id: '40136543', slug: 'himalaya-purifying-neem-face-wash' },
  { id: '10000190', slug: 'surf-excel-matic-liquid-detergent-front-load' },
  { id: '40000285', slug: 'tata-tea-gold' },
  { id: '10001261', slug: 'mdh-deggi-mirch' },
  { id: '266533', slug: 'nescafe-classic-instant-coffee' },
  { id: '10000085', slug: 'bru-instant-coffee' },
  { id: '240065', slug: 'aashirvaad-shudh-chakki-atta' },
];

async function probe() {
  const results = {};
  for (const t of targets) {
    let found = false;
    for (let v = 1; v <= 30; v++) {
      const url = `https://www.bbassets.com/media/uploads/p/l/${t.id}_${v}-${t.slug}.jpg`;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.status === 200) {
          console.log(`[FOUND] ${t.id} ${t.slug} -> v=${v}`);
          results[`${t.id}_${t.slug}`] = url;
          found = true;
          break;
        }
      } catch {}
    }
    if (!found) {
      // try www.bigbasket.com
      for (let v = 1; v <= 30; v++) {
        const url = `https://www.bigbasket.com/media/uploads/p/l/${t.id}_${v}-${t.slug}.jpg`;
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (res.status === 200) {
            console.log(`[FOUND BB] ${t.id} ${t.slug} -> v=${v}`);
            results[`${t.id}_${t.slug}`] = url;
            found = true;
            break;
          }
        } catch {}
      }
    }
    if (!found) {
      console.log(`[MISS] ${t.id} ${t.slug}`);
    }
  }
  return results;
}

probe().then(r => console.log('Done, found:', Object.keys(r).length));

