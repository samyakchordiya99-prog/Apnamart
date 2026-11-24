const CANDIDATES = [
  // Masalas
  'https://www.bigbasket.com/media/uploads/p/l/268069_5-everest-garam-masala.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/268069_4-everest-garam-masala.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000527_10-everest-garam-masala.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000527_11-everest-garam-masala.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000527_12-everest-garam-masala.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000534_11-mdh-deggi-mirch-powder.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000534_15-mdh-deggi-mirch-powder.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/268012_8-catch-turmeric-powder.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/268012_6-catch-turmeric-powder.jpg',

  // Beverages
  'https://www.bigbasket.com/media/uploads/p/l/251006_10-sprite-soft-drink.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/251006_9-sprite-soft-drink.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/251014_10-fanta-orange-flavoured-soft-drink.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/251023_9-maaza-mango-drink.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/251023_8-maaza-mango-drink.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/271195_10-minute-maid-pulpy-orange.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/271195_8-minute-maid-pulpy-orange.jpg',

  // Personal Care & Cleaning
  'https://www.bigbasket.com/media/uploads/p/l/10000060_21-dove-cream-beauty-bathing-bar-75-g.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000052_17-head-shoulders-anti-dandruff-shampoo.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000052_16-head-shoulders-anti-dandruff-shampoo.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000056_15-nivea-soft-light-moisturiser.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000056_14-nivea-soft-light-moisturiser.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000062_15-pepsodent-germicheck-toothpaste.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000062_14-pepsodent-germicheck-toothpaste.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000080_15-ariel-matic-front-load-detergent.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000084_15-rin-advanced-detergent-powder.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000088_15-pril-lime-liquid-dishwash.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000092_15-scotch-brite-scrub-sponge.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000072_15-johnsons-baby-shampoo.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/40000100_15-pampers-all-round-protection-pants.jpg',

  // Tea
  'https://www.bigbasket.com/media/uploads/p/l/240065_10-wagh-bakri-premium-leaf-tea.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/266579_15-taj-mahal-tea.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/266580_15-bru-instant-coffee.jpg',

  // Sprouts
  'https://www.bigbasket.com/media/uploads/p/l/10000269_14-fresho-sprouted-moong.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000269_15-fresho-sprouted-moong.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000271_14-fresho-sprouted-mixed.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000271_15-fresho-sprouted-mixed.jpg',

  // Pooja
  'https://www.bigbasket.com/media/uploads/p/l/266610_8-mangaldeep-sandal-agarbatti.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/266612_8-cycle-pure-agarbatti.jpg',

  // Eggs
  'https://www.bigbasket.com/media/uploads/p/l/150502_6-fresho-farm-eggs-regular-medium-antibiotic-residue-free.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/150502_5-fresho-farm-eggs-regular-medium-antibiotic-residue-free.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/40072320_2-eggoz-farm-fresh-white-eggs.jpg'
];

async function check() {
  const verified = [];
  for (const u of CANDIDATES) {
    try {
      const res = await fetch(u, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.status === 200) {
        console.log(`200 OK: ${u}`);
        verified.push(u);
      }
    } catch {}
  }
  console.log(`\nVerified count: ${verified.length} / ${CANDIDATES.length}`);
}

check();

