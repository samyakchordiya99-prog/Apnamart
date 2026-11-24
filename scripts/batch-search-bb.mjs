import { writeFileSync, existsSync, readFileSync } from 'fs';

async function searchDuckDuckGo(q) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:bigbasket.com/pd ' + q)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const reg = /bigbasket\.com\/pd\/(\d+)\/([^/"'&]+)/g;
    const list = [];
    let match;
    while ((match = reg.exec(html)) !== null) {
      list.push({ id: match[1], slug: match[2] });
    }
    return list;
  } catch (e) {
    return [];
  }
}

async function probeImage(id, slug) {
  // Try with slug
  for (let v = 1; v <= 30; v++) {
    const u = `https://www.bbassets.com/media/uploads/p/l/${id}_${v}-${slug}.jpg`;
    try {
      const res = await fetch(u, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.status === 200) return u;
    } catch {}
  }
  // Try without slug
  for (let v = 1; v <= 10; v++) {
    const u = `https://www.bbassets.com/media/uploads/p/l/${id}_${v}.jpg`;
    try {
      const res = await fetch(u, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.status === 200) return u;
    } catch {}
  }
  return null;
}

const QUERIES = [
  { key: 'nutrichoice', q: 'britannia nutrichoice digestive biscuits' },
  { key: 'jim_jam', q: 'britannia treat jim jam biscuits' },
  { key: 'unibic_choco_chip', q: 'unibic choco chip cookies' },
  { key: 'parle_20_20', q: 'parle 20 20 cashew cookies' },
  { key: 'sunfeast_bounce', q: 'sunfeast bounce choco cream' },
  { key: 'aashirvaad_atta', q: 'aashirvaad whole wheat atta' },
  { key: 'fortune_atta', q: 'fortune chakki fresh whole wheat atta' },
  { key: 'fortune_sunflower', q: 'fortune sunlite refined sunflower oil' },
  { key: 'fortune_mustard', q: 'fortune kachi ghani mustard oil' },
  { key: 'saffola_gold', q: 'saffola gold blended oil' },
  { key: 'patanjali_ghee', q: 'patanjali cow ghee' },
  { key: 'amul_butter', q: 'amul butter pasteurised' },
  { key: 'amul_taaza', q: 'amul taaza toned milk' },
  { key: 'amul_gold', q: 'amul gold full cream milk' },
  { key: 'amul_paneer', q: 'amul fresh paneer' },
  { key: 'amul_cheese', q: 'amul processed cheese slices' },
  { key: 'mother_dairy_curd', q: 'mother dairy classic dahi' },
  { key: 'harvest_gold_white', q: 'harvest gold white bread' },
  { key: 'harvest_gold_atta', q: 'harvest gold 100 atta bread' },
  { key: 'india_gate_basmati', q: 'india gate basmati rice feast rozana' },
  { key: 'fortune_biryani_rice', q: 'fortune special biryani basmati rice' },
  { key: 'daawat_rozana', q: 'daawat rozana gold basmati rice' },
  { key: 'tata_sampann_brown_rice', q: 'tata sampann organic brown rice' },
  { key: 'tata_sampann_toor_dal', q: 'tata sampann unpolished toor dal' },
  { key: 'tata_sampann_moong_dal', q: 'tata sampann yellow moong dal' },
  { key: 'tata_sampann_chana_dal', q: 'tata sampann unpolished chana dal' },
  { key: 'tata_sampann_masoor_dal', q: 'tata sampann masoor dal' },
  { key: 'tata_sampann_urad_dal', q: 'tata sampann urad dal' },
  { key: 'tata_sampann_rajma', q: 'tata sampann rajma' },
  { key: 'tata_sampann_kabuli_chana', q: 'tata sampann kabuli chana' },
  { key: 'tata_sampann_kala_chana', q: 'tata sampann kala chana' },
  { key: 'tata_salt', q: 'tata salt vacuum evaporated' },
  { key: 'everest_garam_masala', q: 'everest garam masala' },
  { key: 'mdh_deggi_mirch', q: 'mdh deggi mirch' },
  { key: 'catch_turmeric', q: 'catch turmeric powder' },
  { key: 'sprite', q: 'sprite lemon lime can bottle' },
  { key: 'fanta', q: 'fanta orange soft drink' },
  { key: 'maaza', q: 'maaza mango drink' },
  { key: 'minute_maid', q: 'minute maid pulpy orange' },
  { key: 'cadbury_dairy_milk_silk', q: 'cadbury dairy milk silk' },
  { key: 'cadbury_5_star', q: 'cadbury 5 star chocolate' },
  { key: 'kitkat', q: 'nestle kitkat 4 finger' },
  { key: 'nestle_munch', q: 'nestle munch chocolate' },
  { key: 'ferrero_rocher', q: 'ferrero rocher chocolates' },
  { key: 'yippee_noodles', q: 'sunfeast yippee noodles' },
  { key: 'kelloggs_corn_flakes', q: 'kelloggs corn flakes' },
  { key: 'kelloggs_chocos', q: 'kelloggs chocos' },
  { key: 'wagh_bakri_tea', q: 'wagh bakri premium leaf tea' },
  { key: 'taj_mahal_tea', q: 'brooke bond taj mahal tea' },
  { key: 'bru_instant_coffee', q: 'bru instant coffee' },
  { key: 'bournvita', q: 'cadbury bournvita' },
  { key: 'colgate_strong_teeth', q: 'colgate strong teeth toothpaste' },
  { key: 'pepsodent', q: 'pepsodent germicheck toothpaste' },
  { key: 'dove_soap', q: 'dove deeply nourishing beauty bathing bar' },
  { key: 'head_shoulders', q: 'head shoulders anti dandruff shampoo' },
  { key: 'nivea_soft', q: 'nivea soft light moisturising cream' },
  { key: 'surf_excel_easy_wash', q: 'surf excel easy wash detergent powder' },
  { key: 'ariel_matic', q: 'ariel matic front load detergent' },
  { key: 'rin_powder', q: 'rin advanced detergent powder' },
  { key: 'pril_dishwash', q: 'pril lime dishwash liquid' },
  { key: 'scotch_brite', q: 'scotch brite scrub sponge' },
  { key: 'good_knight_flash', q: 'good knight gold flash mosquito refill' },
  { key: 'pampers_pants', q: 'pampers all round protection pants' },
  { key: 'huggies_pants', q: 'huggies wonder pants' },
  { key: 'johnsons_baby_shampoo', q: 'johnsons baby shampoo no more tears' },
  { key: 'cerelac', q: 'nestle cerelac wheat apple' },
  { key: 'mccain_french_fries', q: 'mccain french fries crispy' },
  { key: 'mccain_aloo_tikki', q: 'mccain aloo tikki' },
  { key: 'mccain_veggie_burger', q: 'mccain veggie burger patty' },
  { key: 'safal_green_peas', q: 'safal frozen green peas' },
  { key: 'mangaldeep_agarbatti', q: 'mangaldeep agarbatti' },
  { key: 'cycle_pure_agarbatti', q: 'cycle pure agarbatti' },
  { key: 'campure_camphor', q: 'campure camphor tablets' },
];

async function main() {
  let cache = {};
  if (existsSync('scripts/bb_harvested.json')) {
    try { cache = JSON.parse(readFileSync('scripts/bb_harvested.json', 'utf8')); } catch {}
  }

  for (const item of QUERIES) {
    if (cache[item.key]) {
      console.log(`[CACHED] ${item.key}: ${cache[item.key]}`);
      continue;
    }

    console.log(`Searching: ${item.q}...`);
    const list = await searchDuckDuckGo(item.q);
    let foundUrl = null;

    for (const match of list.slice(0, 3)) {
      foundUrl = await probeImage(match.id, match.slug);
      if (foundUrl) {
        console.log(`✓ [FOUND] ${item.key}: ${foundUrl}`);
        break;
      }
    }

    if (foundUrl) {
      cache[item.key] = foundUrl;
      writeFileSync('scripts/bb_harvested.json', JSON.stringify(cache, null, 2), 'utf8');
    } else {
      console.log(`✗ [MISSED] ${item.key}`);
    }

    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\nDone! Total harvested: ${Object.keys(cache).length} / ${QUERIES.length}`);
}

main();

