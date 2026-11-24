const CANDIDATES = [
  // Vegetables
  'https://www.bigbasket.com/media/uploads/p/l/10000200_17-fresho-tomato-hybrid.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000201_15-fresho-tomato-hybrid.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000148_30-fresho-onion.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000148_32-fresho-onion.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000159_27-fresho-potato.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000098_9-fresho-coriander-leaves.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000098_10-fresho-coriander-leaves.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000103_16-fresho-chilli-green.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000119_17-fresho-ginger.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000067_21-fresho-capsicum-green.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000071_14-fresho-carrot-orange.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000126_16-fresho-lemon.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000031_21-fresho-banana-robusta.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/40033819_29-fresho-apple-royal-gala.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000102_17-fresho-cucumber.jpg',

  // Spices & Masala
  'https://www.bigbasket.com/media/uploads/p/l/268069_6-everest-garam-masala.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000534_12-mdh-deggi-mirch.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000534_10-mdh-deggi-mirch-powder.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/268012_7-catch-turmeric-powder.jpg',

  // Drinks
  'https://www.bigbasket.com/media/uploads/p/l/251006_11-sprite-soft-drink.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/251006_12-sprite-soft-drink.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/251014_11-fanta-orange-flavoured-soft-drink.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/251023_10-maaza-mango-drink.jpg',

  // Tea & Coffee
  'https://www.bigbasket.com/media/uploads/p/l/240065_12-wagh-bakri-premium-leaf-tea.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/266579_16-taj-mahal-tea.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/266580_16-bru-instant-coffee.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000045_19-bournvita-health-drink.jpg',

  // Personal Care & Cleaning
  'https://www.bigbasket.com/media/uploads/p/l/266590_10-pepsodent-germicheck-toothpaste.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000052_18-head-shoulders-anti-dandruff-shampoo.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000056_16-nivea-soft-light-moisturiser.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/266595_10-ariel-matic-front-load-detergent.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/266597_10-rin-advanced-detergent-powder.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/266599_10-pril-lime-liquid-dishwash.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/266601_10-scotch-brite-scrub-sponge.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/40000100_10-pampers-all-round-protection-pants.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/10000072_10-johnsons-baby-shampoo.jpg',

  // Pooja
  'https://www.bigbasket.com/media/uploads/p/l/266610_10-mangaldeep-sandal-agarbatti.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/266612_10-cycle-pure-agarbatti.jpg',
  'https://www.bigbasket.com/media/uploads/p/l/40149021_5-campure-camphor-tablets.jpg'
];

async function check() {
  const verified = [];
  for (const u of CANDIDATES) {
    try {
      const res = await fetch(u, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.status === 200) {
        console.log(`200 OK: ${u.split('/').pop()}`);
        verified.push(u);
      }
    } catch {}
  }
  console.log(`\nVerified count: ${verified.length} / ${CANDIDATES.length}`);
}

check();

