import { readFileSync, writeFileSync } from 'fs';

const targeted = [
  { key: 'tata_tea_premium', query: 'tata tea premium' },
  { key: 'wagh_bakri_tea', query: 'wagh bakri' },
  { key: 'oreo_original', query: 'cadbury oreo' },
  { key: 'hide_seek_choco', query: 'hide seek' },
  { key: 'little_hearts', query: 'little hearts' },
  { key: 'milk_bikis', query: 'milk bikis' },
  { key: 'amul_butter', query: 'amul butter' },
  { key: 'amul_taaza_milk', query: 'amul taaza' },
  { key: 'amul_cheese_slices', query: 'amul cheese' },
  { key: 'amul_pure_ghee', query: 'amul ghee' },
  { key: 'aashirvaad_atta', query: 'aashirvaad' },
  { key: 'fortune_sunflower_oil', query: 'fortune sunflower' },
  { key: 'saffola_gold', query: 'saffola' },
  { key: 'india_gate_basmati', query: 'india gate' },
  { key: 'daawat_basmati', query: 'daawat' },
  { key: 'moong_dal', query: 'moong dal' },
  { key: 'masoor_dal', query: 'masoor dal' },
  { key: 'rajma_chitra', query: 'rajma' },
  { key: 'kabuli_chana', query: 'kabuli chana' },
  { key: 'kala_chana', query: 'kala chana' },
  { key: 'bajra_flour', query: 'bajra' },
  { key: 'sabudana', query: 'sabudana' },
  { key: 'peanuts_raw', query: 'peanut' },
  { key: 'surf_excel', query: 'surf excel' },
  { key: 'vim_bar', query: 'vim' },
  { key: 'colgate_toothpaste', query: 'colgate' },
  { key: 'dettol_soap', query: 'dettol' },
  { key: 'dove_soap', query: 'dove soap' },
  { key: 'sprite', query: 'sprite' },
  { key: 'maaza', query: 'maaza' },
  { key: 'pringles', query: 'pringles' },
  { key: 'cadbury_dairy_milk', query: 'dairy milk' },
  { key: 'kitkat', query: 'kitkat' },
  { key: 'nescafe_coffee', query: 'nescafe' },
  { key: 'bru_coffee', query: 'bru coffee' },
  { key: 'kelloggs_cornflakes', query: 'corn flakes' },
  { key: 'quaker_oats', query: 'quaker oats' },
  { key: 'everest_masala', query: 'everest' },
  { key: 'mdh_masala', query: 'mdh' },
];

let existing = {};
try { existing = JSON.parse(readFileSync('scripts/harvested_pack_images.json', 'utf8')); } catch {}

async function run() {
  for (const item of targeted) {
    if (existing[item.key]) {
      console.log(`Skipping already harvested: ${item.key}`);
      continue;
    }
    try {
      const url = `https://in.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(item.query)}&search_simple=1&action=process&json=1&page_size=5`;
      const res = await fetch(url, { headers: { 'User-Agent': 'ApnaMart-App-PackHarvester/2.0' } });
      if (res.ok) {
        const data = await res.json();
        const found = (data.products || []).find(p => p.image_front_url || p.image_url);
        if (found) {
          existing[item.key] = {
            productName: found.product_name,
            imageUrl: found.image_front_url || found.image_url,
          };
          console.log(`✓ [${item.key}] ${found.product_name} => ${found.image_front_url || found.image_url}`);
        } else {
          console.log(`✗ [${item.key}] No image`);
        }
      } else {
        console.log(`! [${item.key}] HTTP ${res.status}`);
      }
    } catch (e) {
      console.log(`ERR [${item.key}]`, e.message);
    }
    await new Promise(r => setTimeout(r, 1200));
  }

  writeFileSync('scripts/harvested_pack_images.json', JSON.stringify(existing, null, 2), 'utf-8');
  console.log('Finished updating harvested_pack_images.json!');
}

run();

