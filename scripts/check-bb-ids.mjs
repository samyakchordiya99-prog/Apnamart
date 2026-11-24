const testUrls = [
  // Colgate
  'https://www.bigbasket.com/pd/10000067/colgate-strong-teeth-anticavity-toothpaste-with-amino-shakti-50-g/',
  'https://www.bigbasket.com/pd/10000068/colgate-strong-teeth-anticavity-toothpaste-with-amino-shakti-100-g/',
  // KitKat
  'https://www.bigbasket.com/pd/100001004/nestle-kitkat-share-bag-2-finger-pack-128-g/',
  'https://www.bigbasket.com/pd/40001427/nestle-kitkat-4-finger-373-g/',
  // Dove
  'https://www.bigbasket.com/pd/263595/dove-cream-beauty-bathing-bar-100-g/',
  'https://www.bigbasket.com/pd/10000060/dove-cream-beauty-bathing-bar-75-g/',
  // Kelloggs
  'https://www.bigbasket.com/pd/266549/kelloggs-corn-flakes-original-875-g/',
  'https://www.bigbasket.com/pd/100001402/kelloggs-chocos-375-g/',
  // Maggi
  'https://www.bigbasket.com/pd/266109/maggi-2-minute-instant-noodles-masala-70-g/',
  // Knorr
  'https://www.bigbasket.com/pd/266551/knorr-classic-thick-tomato-soup-53-g/',
  // McCain
  'https://www.bigbasket.com/pd/266560/mccain-french-fries-crispy-420-g/',
  'https://www.bigbasket.com/pd/266561/mccain-aloo-tikki-400-g/',
  // Safal
  'https://www.bigbasket.com/pd/266562/safal-frozen-green-peas-1-kg/'
];

async function check() {
  for (const u of testUrls) {
    const m = u.match(/pd\/(\d+)\/([^/]+)/);
    if (!m) continue;
    const [_, id, slug] = m;
    let found = false;
    for (let v = 1; v <= 30; v++) {
      const imgUrl = `https://www.bbassets.com/media/uploads/p/l/${id}_${v}-${slug}.jpg`;
      try {
        const res = await fetch(imgUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.status === 200) {
          console.log(`200 OK: ${id} -> ${imgUrl}`);
          found = true;
          break;
        }
      } catch {}
    }
    if (!found) {
      console.log(`Not found for ${id} ${slug}`);
    }
  }
}

check();

