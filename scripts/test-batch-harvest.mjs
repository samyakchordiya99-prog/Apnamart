import { writeFileSync } from 'fs';

const testItems = [
  { key: 'good_day_cashew', query: 'Britannia Good Day Cashew' },
  { key: 'bourbon', query: 'Britannia Bourbon' },
  { key: 'little_hearts', query: 'Britannia Little Hearts' },
  { key: 'fifty_fifty', query: 'Britannia 50-50' },
  { key: 'milk_bikis', query: 'Britannia Milk Bikis' },
  { key: 'nutrichoice', query: 'Britannia NutriChoice' },
  { key: 'aashirvaad_atta', query: 'Aashirvaad Superior MP Whole Wheat Atta' },
  { key: 'fortune_oil', query: 'Fortune Sunflower Oil' },
  { key: 'amul_butter', query: 'Amul Butter' },
  { key: 'amul_taaza', query: 'Amul Taaza Milk' },
  { key: 'tata_salt', query: 'Tata Salt' },
  { key: 'everest_garam_masala', query: 'Everest Garam Masala' },
  { key: 'dairy_milk', query: 'Cadbury Dairy Milk' },
  { key: 'kitkat', query: 'Nestle KitKat' },
  { key: 'colgate_strong', query: 'Colgate Strong Teeth' },
  { key: 'harpic', query: 'Harpic Power Plus' },
  { key: 'lizol', query: 'Lizol Floral' },
  { key: 'red_bull', query: 'Red Bull Energy Drink' },
  { key: 'pampers', query: 'Pampers All Round' },
  { key: 'nescafe_classic', query: 'Nescafe Classic' },
  { key: 'india_gate_basmati', query: 'India Gate Basmati Rice' },
  { key: 'yellow_moong_dal', query: 'Tata Sampann Moong Dal' },
  { key: 'rajma', query: 'Tata Sampann Rajma' },
  { key: 'chana_dal', query: 'Tata Sampann Chana Dal' },
  { key: 'kabuli_chana', query: 'Tata Sampann Kabuli Chana' },
];

async function harvest() {
  const results = {};
  for (const item of testItems) {
    try {
      const url = `https://in.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(item.query)}&search_simple=1&action=process&json=1&page_size=5`;
      const res = await fetch(url, { headers: { 'User-Agent': 'ApnaMartBlinkitSync/1.0 (dev@apnamart.in)' } });
      if (!res.ok) {
        console.log(`Failed ${item.key}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const p = (data.products || []).find(prod => prod.image_front_url || prod.image_url);
      if (p) {
        const img = p.image_front_url || p.image_url;
        results[item.key] = {
          name: p.product_name,
          img: img
        };
        console.log(`✓ ${item.key}: ${p.product_name} -> ${img}`);
      } else {
        console.log(`✗ ${item.key}: Not found`);
      }
    } catch (e) {
      console.log(`Error ${item.key}:`, e.message);
    }
    // Respectful delay to avoid rate limits
    await new Promise(r => setTimeout(r, 600));
  }

  writeFileSync('scripts/test_harvested.json', JSON.stringify(results, null, 2), 'utf8');
}

harvest();

