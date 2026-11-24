import { writeFileSync } from 'fs';

const searches = [
  { key: 'sugar', query: 'sugar' },
  { key: 'madhur_sugar', query: 'madhur sugar' },
  { key: 'peanuts', query: 'peanuts' },
  { key: 'tea_powder', query: 'tata tea' },
  { key: 'red_label', query: 'red label' },
  { key: 'wagh_bakri', query: 'wagh bakri' },
  { key: 'jowar', query: 'jowar' },
  { key: 'bajra', query: 'bajra' },
  { key: 'ragi', query: 'ragi' },
  { key: 'poha', query: 'poha' },
  { key: 'sabudana', query: 'sabudana' },
  { key: 'basmati', query: 'india gate basmati' },
  { key: 'daawat', query: 'daawat basmati' },
  { key: 'toor_dal', query: 'toor dal' },
  { key: 'chana_dal', query: 'chana dal' },
  { key: 'moong_dal', query: 'moong dal' },
  { key: 'masoor_dal', query: 'masoor dal' },
  { key: 'rajma', query: 'rajma' },
  { key: 'urad_dal', query: 'urad dal' },
  { key: 'kabuli_chana', query: 'kabuli chana' },
  { key: 'kala_chana', query: 'kala chana' },
  { key: 'marie_gold', query: 'marie gold' },
  { key: 'parle_g', query: 'parle-g' },
  { key: 'good_day', query: 'good day' },
  { key: 'bourbon', query: 'bourbon' },
  { key: 'oreo', query: 'oreo' },
  { key: 'hide_seek', query: 'hide seek' },
  { key: 'dark_fantasy', query: 'dark fantasy' },
  { key: 'little_hearts', query: 'little hearts' },
  { key: 'krackjack', query: 'krackjack' },
  { key: 'monaco', query: 'monaco' },
  { key: 'milk_bikis', query: 'milk bikis' },
  { key: 'fifty_fifty', query: '50-50 maska' },
  { key: 'maggi', query: 'maggi noodles' },
  { key: 'yippee', query: 'yippee' },
  { key: 'lays_magic', query: 'lays magic masala' },
  { key: 'lays_salted', query: 'lays salted' },
  { key: 'lays_cream', query: 'lays cream onion' },
  { key: 'lays_tomato', query: 'lays tomato' },
  { key: 'kurkure', query: 'kurkure masala' },
  { key: 'uncle_chipps', query: 'uncle chipps' },
  { key: 'bingo', query: 'bingo mad angles' },
  { key: 'pringles', query: 'pringles' },
  { key: 'doritos', query: 'doritos' },
  { key: 'aloo_bhujia', query: 'haldiram aloo bhujia' },
  { key: 'bhujia_sev', query: 'haldiram bhujia' },
  { key: 'amul_butter', query: 'amul butter' },
  { key: 'amul_milk', query: 'amul taaza' },
  { key: 'amul_cheese', query: 'amul cheese' },
  { key: 'amul_paneer', query: 'amul paneer' },
  { key: 'amul_ghee', query: 'amul ghee' },
  { key: 'fortune_oil', query: 'fortune sunflower' },
  { key: 'saffola', query: 'saffola gold' },
  { key: 'aashirvaad_atta', query: 'aashirvaad atta' },
  { key: 'tata_salt', query: 'tata salt' },
  { key: 'surf_excel', query: 'surf excel' },
  { key: 'vim_bar', query: 'vim bar' },
  { key: 'colgate', query: 'colgate strong' },
  { key: 'dettol_soap', query: 'dettol soap' },
  { key: 'dove_soap', query: 'dove soap' },
  { key: 'parachue_oil', query: 'parachute coconut' },
  { key: 'thums_up', query: 'thums up' },
  { key: 'coca_cola', query: 'coca-cola' },
  { key: 'sprite', query: 'sprite' },
  { key: 'pepsi', query: 'pepsi' },
  { key: 'maaza', query: 'maaza' },
];

async function harvest() {
  const results = {};
  for (const item of searches) {
    try {
      const url = `https://in.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(item.query)}&search_simple=1&action=process&json=1&page_size=5`;
      const res = await fetch(url, { headers: { 'User-Agent': 'ApnaMart-Demo-App/3.0' } });
      if (res.ok) {
        const data = await res.json();
        const found = (data.products || []).find(p => p.image_front_url || p.image_url);
        if (found) {
          results[item.key] = {
            productName: found.product_name,
            imageUrl: found.image_front_url || found.image_url,
          };
          console.log(`✓ [${item.key}] ${found.product_name} => ${found.image_front_url || found.image_url}`);
        } else {
          console.log(`✗ [${item.key}] No image found`);
        }
      } else {
        console.log(`! [${item.key}] HTTP ${res.status}`);
      }
    } catch (e) {
      console.log(`ERR [${item.key}]`, e.message);
    }
    await new Promise(r => setTimeout(r, 600)); // small delay to respect rate limit
  }

  writeFileSync('scripts/harvested_pack_images.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Done! Saved ${Object.keys(results).length} pack images.`);
  process.exit(0);
}

harvest();

