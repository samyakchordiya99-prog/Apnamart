async function searchDuckDuckGo(q) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:bigbasket.com/pd ' + q)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const reg = /bigbasket\.com\/pd\/(\d+)\/([^/"'&]+)/g;
    const list = [];
    let m;
    while ((m = reg.exec(html)) !== null) {
      list.push({ id: m[1], slug: m[2] });
    }
    return list;
  } catch (e) {
    return [];
  }
}

async function probeImage(id, slug) {
  for (let v = 1; v <= 30; v++) {
    const u = `https://www.bbassets.com/media/uploads/p/l/${id}_${v}-${slug}.jpg`;
    try {
      const res = await fetch(u, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.status === 200) return u;
    } catch {}
  }
  return null;
}

const ITEMS = [
  // Chips Flavours
  { key: 'lays_classic_salted', q: 'lays potato chips classic salted' },
  { key: 'lays_cream_onion', q: 'lays potato chips american style cream onion' },
  { key: 'lays_spanish_tomato', q: 'lays potato chips spanish tomato tango' },
  { key: 'lays_magic_masala', q: 'lays potato chips indias magic masala' },
  { key: 'kurkure_masala_munch', q: 'kurkure masala munch' },
  { key: 'kurkure_solid_masti', q: 'kurkure solid masti' },
  { key: 'bingo_achaari_masti', q: 'bingo mad angles achaari masti' },
  { key: 'bingo_tedhe_medhe', q: 'bingo tedhe medhe masala tadka' },
  { key: 'uncle_chipps', q: 'uncle chipps spicy treat' },
  { key: 'pringles_original', q: 'pringles potato crisps original' },
  { key: 'pringles_sour_cream', q: 'pringles sour cream onion' },
  { key: 'doritos_nacho_cheese', q: 'doritos nacho cheese tortilla chips' },
  { key: 'doritos_sweet_chilli', q: 'doritos sweet chilli' },
  { key: 'haldiram_aloo_bhujia', q: 'haldirams aloo bhujia' },
  { key: 'haldiram_bhujia_sev', q: 'haldirams bhujia sev' },
  { key: 'haldiram_navratan', q: 'haldirams navratan mixture' },
  { key: 'haldiram_khatta_meetha', q: 'haldirams khatta meetha' },
  { key: 'haldiram_moong_dal', q: 'haldirams salted moong dal' },
  { key: 'haldiram_salted_peanuts', q: 'haldirams salted peanuts' },
  { key: 'balaji_simply_salted', q: 'balaji wafers simply salted' },
  { key: 'balaji_masala_wafers', q: 'balaji wafers masala' },

  // Rice Varieties
  { key: 'india_gate_basmati', q: 'india gate basmati rice feast rozana' },
  { key: 'fortune_biryani_rice', q: 'fortune special biryani basmati rice' },
  { key: 'daawat_rozana_gold', q: 'daawat rozana gold basmati rice' },
  { key: 'kohinoor_basmati', q: 'kohinoor super silver basmati rice' },
  { key: 'wada_kolam_rice', q: 'wada kolam rice steamed' },
  { key: 'sona_masoori_rice', q: 'sona masoori raw rice' },
  { key: 'brown_rice_tata', q: 'tata sampann organic brown rice' },
  { key: 'gobindobhog_rice', q: 'gobindobhog rice' },
  { key: 'idli_dosa_rice', q: 'idli dosa rice' },
  { key: 'ponni_boiled_rice', q: 'ponni boiled rice' },
  { key: 'matta_red_rice', q: 'kerala matta red rice' },

  // Dal Varieties
  { key: 'tata_toor_dal', q: 'tata sampann unpolished toor dal' },
  { key: 'tata_chana_dal', q: 'tata sampann unpolished chana dal' },
  { key: 'tata_moong_dal_dhuli', q: 'tata sampann moong dal dhuli yellow' },
  { key: 'tata_moong_dal_chilka', q: 'tata sampann moong dal chilka' },
  { key: 'tata_sabut_moong', q: 'tata sampann whole green moong' },
  { key: 'tata_masoor_dal_dhuli', q: 'tata sampann masoor dal dhuli red' },
  { key: 'tata_sabut_masoor', q: 'tata sampann whole brown masoor' },
  { key: 'tata_urad_dal_dhuli', q: 'tata sampann urad dal dhuli white' },
  { key: 'tata_urad_dal_chilka', q: 'tata sampann urad dal chilka black' },
  { key: 'tata_kali_urad_sabut', q: 'tata sampann whole black urad dal' },
  { key: 'tata_rajma_chitra', q: 'tata sampann rajma chitra' },
  { key: 'tata_rajma_red', q: 'tata sampann red rajma' },
  { key: 'tata_kabuli_chana', q: 'tata sampann kabuli chana' },
  { key: 'tata_desi_kala_chana', q: 'tata sampann desi kala chana' },

  // Biscuit Varieties
  { key: 'parle_g_original', q: 'parle g original glucose biscuits' },
  { key: 'parle_g_gold', q: 'parle g gold biscuits' },
  { key: 'marie_gold', q: 'britannia marie gold biscuits' },
  { key: 'good_day_cashew', q: 'britannia good day cashew cookies' },
  { key: 'good_day_butter', q: 'britannia good day butter cookies' },
  { key: 'bourbon', q: 'britannia bourbon chocolate cream biscuits' },
  { key: 'oreo_vanilla', q: 'cadbury oreo original vanilla sandwich biscuits' },
  { key: 'oreo_double_stuf', q: 'cadbury oreo double stuf choco cream' },
  { key: 'dark_fantasy_choco_fills', q: 'sunfeast dark fantasy choco fills' },
  { key: 'dark_fantasy_choco_meltz', q: 'sunfeast dark fantasy choco meltz' },
  { key: 'hide_seek_choco_chip', q: 'parle hide seek chocolate chip biscuits' },
  { key: 'hide_seek_strawberry', q: 'parle hide seek fab strawberry' },
  { key: 'monaco_salted', q: 'parle monaco classic salted crackers' },
  { key: 'krackjack_sweet_salty', q: 'parle krackjack sweet salty crackers' },
  { key: 'little_hearts', q: 'britannia little hearts biscuits' },
  { key: 'fifty_fifty_maska_chaska', q: 'britannia 50 50 maska chaska biscuits' },
  { key: 'nutrichoice_digestive', q: 'britannia nutrichoice digestive biscuits' },
  { key: 'milk_bikis', q: 'britannia milk bikis biscuits' },
  { key: 'jim_jam', q: 'britannia treat jim jam cream biscuits' },
  { key: 'bounce_choco', q: 'sunfeast bounce choco cream biscuits' },
  { key: 'parle_20_20_cashew', q: 'parle 20 20 cashew butter cookies' },
  { key: 'unibic_choco_chip', q: 'unibic choco chip cookies' },
  { key: 'priyagold_butter_bite', q: 'priyagold butter bite cashew' }
];

async function main() {
  const results = {};
  for (const item of ITEMS) {
    const list = await searchDuckDuckGo(item.q);
    let found = null;
    for (const m of list.slice(0, 3)) {
      found = await probeImage(m.id, m.slug);
      if (found) {
        console.log(`✓ [${item.key}]: ${found}`);
        results[item.key] = found;
        break;
      }
    }
    if (!found) {
      console.log(`✗ [${item.key}]: Not found`);
    }
    await new Promise(r => setTimeout(r, 700));
  }

  const { writeFileSync } = await import('fs');
  writeFileSync('scripts/specific_flavours_harvested.json', JSON.stringify(results, null, 2), 'utf8');
}

main();
