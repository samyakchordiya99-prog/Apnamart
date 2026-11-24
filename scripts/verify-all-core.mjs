async function findWorkingUrl(slugs) {
  for (const s of slugs) {
    try {
      const res = await fetch(s, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.status === 200) {
        return s;
      }
    } catch {}
  }
  return null;
}

const CANDIDATES = {
  // Chips / Snacks
  doritos: [
    'https://images.openfoodfacts.org/images/products/890/149/199/0219/front_fr.3.400.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40149021_5-doritos-nacho-cheese.jpg',
    'https://www.bbassets.com/media/uploads/p/l/40092305_4-doritos-nacho-cheese.jpg'
  ],
  bingo: [
    'https://images.openfoodfacts.org/images/products/890/172/501/3684/front_en.24.400.jpg',
    'https://www.bbassets.com/media/uploads/p/l/294294_11-bingo-mad-angles-achaari-masti.jpg'
  ],
  pringles: [
    'https://images.openfoodfacts.org/images/products/888/646/712/2408/front_en.10.400.jpg'
  ],
  haldiram_bhujia: [
    'https://images.openfoodfacts.org/images/products/890/400/440/0731/front_en.28.400.jpg'
  ],
  // Dairy
  amul_butter: [
    'https://www.bigbasket.com/media/uploads/p/l/104808_9-amul-butter-pasteurised.jpg'
  ],
  amul_taaza: [
    'https://www.bigbasket.com/media/uploads/p/l/40041431_1-amul-taaza-fresh-toned-milk.jpg'
  ],
  amul_paneer: [
    'https://www.bigbasket.com/media/uploads/p/l/40096747_11-amul-malai-fresh-paneer.jpg'
  ],
  amul_ghee: [
    'https://images.openfoodfacts.org/images/products/890/126/203/0151/front_fr.9.400.jpg'
  ],
  mother_dairy_curd: [
    'https://www.bigbasket.com/media/uploads/p/l/40181061_7-mother-dairy-classic-dahi.jpg'
  ],
  harvest_gold_bread: [
    'https://www.bigbasket.com/media/uploads/p/l/40026515_4-harvest-gold-bread-white.jpg'
  ],
  // Atta / Oil / Rice / Salt / Sugar
  aashirvaad_atta: [
    'https://www.bigbasket.com/media/uploads/p/l/126906_10-aashirvaad-atta-whole-wheat.jpg'
  ],
  fortune_oil: [
    'https://www.bigbasket.com/media/uploads/p/l/274145_14-fortune-sunlite-refined-sunflower-oil.jpg'
  ],
  india_gate_rice: [
    'https://www.bigbasket.com/media/uploads/p/l/190594_9-india-gate-basmati-rice-super.jpg'
  ],
  tata_salt: [
    'https://www.bigbasket.com/media/uploads/p/l/242671_1-tata-salt-iodized.jpg'
  ],
  madhur_sugar: [
    'https://images.openfoodfacts.org/images/products/890/602/690/0022/front_en.4.400.jpg'
  ],
  // Dals
  tata_toor_dal: [
    'https://images.openfoodfacts.org/images/products/890/404/392/6216/front_en.5.400.jpg'
  ],
  tata_chana_dal: [
    'https://images.openfoodfacts.org/images/products/890/601/050/0702/front_en.5.400.jpg'
  ],
  tata_urad_dal: [
    'https://images.openfoodfacts.org/images/products/890/290/102/7280/front_en.5.400.jpg'
  ],
  tata_moong_dal: [
    'https://images.openfoodfacts.org/images/products/890/404/392/6315/front_en.23.400.jpg'
  ],
  tata_kabuli_chana: [
    'https://images.openfoodfacts.org/images/products/890/404/392/6704/front_en.3.400.jpg'
  ],
  jowar: [
    'https://images.openfoodfacts.org/images/products/890/172/501/0812/front_en.3.400.jpg'
  ],
  ragi: [
    'https://images.openfoodfacts.org/images/products/890/800/298/4361/front_en.3.400.jpg'
  ],
  poha: [
    'https://images.openfoodfacts.org/images/products/890/800/387/2315/front_en.4.400.jpg'
  ],
  // Biscuits
  parle_g: [
    'https://images.openfoodfacts.org/images/products/890/171/913/4845/front_en.11.400.jpg'
  ],
  marie_gold: [
    'https://images.openfoodfacts.org/images/products/890/106/316/2914/front_en.3.400.jpg',
    'https://www.bigbasket.com/media/uploads/p/l/102102_4-britannia-marie-gold-biscuits.jpg'
  ],
  good_day: [
    'https://www.bbassets.com/media/uploads/p/l/263526_24-britannia-good-day-cashew-cookies.jpg'
  ],
  bourbon: [
    'https://www.bbassets.com/media/uploads/p/l/263593_34-britannia-bourbon-chocolate-cream-biscuits.jpg'
  ],
  little_hearts: [
    'https://www.bbassets.com/media/uploads/p/l/40174323_7-britannia-little-hearts-biscuits-75-g.jpg'
  ],
  fifty_fifty: [
    'https://www.bbassets.com/media/uploads/p/l/40203380_1-britannia-50-50-maska-chaska-300-g.jpg'
  ],
  milk_bikis: [
    'https://www.bbassets.com/media/uploads/p/l/100012364_7-britannia-milk-bikis-milk-cream-biscuits-100-g.jpg'
  ],
  dark_fantasy: [
    'https://images.openfoodfacts.org/images/products/890/172/501/6258/front_en.20.400.jpg'
  ],
  krackjack: [
    'https://images.openfoodfacts.org/images/products/890/171/913/5248/front_en.25.400.jpg'
  ],
  monaco: [
    'https://images.openfoodfacts.org/images/products/890/171/913/5118/front_en.24.400.jpg'
  ],
  hide_seek: [
    'https://images.openfoodfacts.org/images/products/890/171/910/5913/front_en.22.400.jpg'
  ],
  oreo: [
    'https://images.openfoodfacts.org/images/products/762/220/222/5512/front_en.28.400.jpg'
  ],
  // Personal Care & Cleaning
  colgate: [
    'https://www.bbassets.com/media/uploads/p/l/10000067_23-colgate-strong-teeth-anticavity-toothpaste-with-amino-shakti-50-g.jpg'
  ],
  kitkat: [
    'https://www.bbassets.com/media/uploads/p/l/40001427_1-nestle-kitkat-4-finger-373-g.jpg'
  ],
  dettol: [
    'https://images.openfoodfacts.org/images/products/890/139/638/1501/front_en.3.400.jpg'
  ],
  parachute: [
    'https://images.openfoodfacts.org/images/products/000/008/900/2940/front_en.7.400.jpg'
  ],
  surf_excel: [
    'https://images.openfoodfacts.org/images/products/890/910/602/6346/front_en.8.400.jpg'
  ],
  vim: [
    'https://images.openfoodfacts.org/images/products/890/103/053/5697/front_en.21.400.jpg'
  ],
  harpic: [
    'https://images.openfoodfacts.org/images/products/890/139/615/2002/front_en.21.400.jpg'
  ],
  lizol: [
    'https://images.openfoodfacts.org/images/products/890/139/611/6004/front_en.3.400.jpg'
  ],
  // Drinks
  thums_up: [
    'https://images.openfoodfacts.org/images/products/890/176/404/2911/front_en.41.400.jpg'
  ],
  coca_cola: [
    'https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.1129.400.jpg'
  ],
  pepsi: [
    'https://images.openfoodfacts.org/images/products/890/208/010/4581/front_en.3.400.jpg'
  ],
  red_bull: [
    'https://images.openfoodfacts.org/images/products/000/009/016/2602/front_en.151.400.jpg'
  ],
  maggi: [
    'https://images.openfoodfacts.org/images/products/890/105/801/7687/front_en.13.400.jpg'
  ],
  tata_tea: [
    'https://images.openfoodfacts.org/images/products/890/105/201/0615/front_en.18.400.jpg'
  ],
  red_label: [
    'https://images.openfoodfacts.org/images/products/890/103/088/2586/front_en.3.400.jpg'
  ],
  nescafe: [
    'https://images.openfoodfacts.org/images/products/000/008/900/9758/front_en.3.400.jpg'
  ]
};

async function main() {
  const verified = {};
  for (const [k, urls] of Object.entries(CANDIDATES)) {
    const found = await findWorkingUrl(urls);
    if (found) {
      verified[k] = found;
      console.log(`✓ ${k}: ${found}`);
    } else {
      console.log(`✗ ${k}: Not found`);
    }
  }
}

main();

