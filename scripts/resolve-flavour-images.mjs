import { writeFileSync, existsSync, readFileSync } from 'fs';

async function searchDuckDuckGo(query) {
  const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent('site:bigbasket.com/pd ' + query);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const html = await res.text();
    const regex = /bigbasket\.com\/pd\/(\d+)\/([a-zA-Z0-9\-_]+)/g;
    const items = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      if (!items.some(i => i.id === match[1])) {
        items.push({ id: match[1], slug: match[2] });
      }
    }
    return items;
  } catch (err) {
    return [];
  }
}

async function probeImage(id, slug) {
  // Try with slug
  for (let v = 1; v <= 25; v++) {
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

const TARGETS = [
  // Chips / Snacks
  { key: 'pringles_sour_cream', q: 'pringles potato crisps sour cream onion' },
  { key: 'doritos_nacho_cheese', q: 'doritos nacho cheese tortilla chips' },
  { key: 'doritos_sweet_chilli', q: 'doritos sweet chilli tortilla chips' },
  { key: 'kurkure_solid_masti', q: 'kurkure solid masti twisteez' },
  { key: 'haldiram_bhujia_sev', q: 'haldirams bhujia sev' },
  { key: 'haldiram_navratan', q: 'haldirams namkeen navratan mixture' },
  { key: 'haldiram_khatta_meetha', q: 'haldirams namkeen khatta meetha' },
  { key: 'haldiram_moong_dal', q: 'haldirams namkeen moong dal' },
  { key: 'haldiram_salted_peanuts', q: 'haldirams salted peanuts' },
  { key: 'balaji_wafers_salted', q: 'balaji wafers simply salted' },
  { key: 'balaji_masala_wafers', q: 'balaji masala wafers' },

  // Rice Varieties
  { key: 'kohinoor_basmati', q: 'kohinoor super silver basmati rice' },
  { key: 'sona_masoori_rice', q: 'bb royal sona masoori raw rice' },
  { key: 'wada_kolam_rice', q: 'bb royal kolam rice steamed' },
  { key: 'tata_brown_rice', q: 'tata sampann organic brown rice' },
  { key: 'gobindobhog_rice', q: 'bb royal gobindobhog rice' },
  { key: 'idli_dosa_rice', q: 'bb royal idli rice' },
  { key: 'ponni_boiled_rice', q: 'bb royal ponni boiled rice' },
  { key: 'kerala_matta_rice', q: 'double horse matta rice' },
  { key: 'jasmine_rice', q: 'bb royal jasmine rice' },
  { key: 'sushi_rice', q: 'urban platter sushi rice' },

  // Dal Varieties
  { key: 'tata_moong_dal_dhuli', q: 'tata sampann unpolished moong dal split' },
  { key: 'tata_moong_dal_chilka', q: 'tata sampann unpolished moong dal chilka' },
  { key: 'tata_sabut_moong', q: 'tata sampann unpolished green moong whole' },
  { key: 'tata_masoor_dal_dhuli', q: 'tata sampann unpolished masoor dal' },
  { key: 'tata_sabut_masoor', q: 'tata sampann unpolished whole masoor brown' },
  { key: 'tata_urad_dal_dhuli', q: 'tata sampann unpolished urad dal white' },
  { key: 'tata_urad_dal_chilka', q: 'tata sampann unpolished urad dal chilka' },
  { key: 'tata_kali_urad_sabut', q: 'tata sampann unpolished urad whole black' },
  { key: 'tata_rajma_chitra', q: 'tata sampann unpolished rajma chitra' },
  { key: 'tata_rajma_red', q: 'tata sampann unpolished red rajma' },
  { key: 'tata_kabuli_chana', q: 'tata sampann unpolished kabuli chana' },
  { key: 'tata_desi_kala_chana', q: 'tata sampann unpolished kala chana' },
  { key: 'moth_beans_matki', q: 'bb royal moth beans matki' },

  // Biscuits
  { key: 'parle_g_gold', q: 'parle g gold biscuits' },
  { key: 'oreo_double_stuf', q: 'oreo double stuf chocolate cream biscuits' },
  { key: 'dark_fantasy_meltz', q: 'sunfeast dark fantasy choco meltz' },
  { key: 'hide_seek_strawberry', q: 'parle hide seek fab strawberry cream' },
  { key: 'jim_jam', q: 'britannia treat jim jam cream biscuits' },
  { key: 'bounce_choco', q: 'sunfeast bounce choco cream biscuits' },
  { key: 'parle_20_20', q: 'parle 20 20 cashew cookies' },
  { key: 'priyagold_butter_bite', q: 'priyagold butter bite cashew' },
  { key: 'unibic_choco_chip', q: 'unibic choco chip cookies' }
];

async function main() {
  const harvested = {};
  console.log(`Starting probe for ${TARGETS.length} products...`);
  
  for (let i = 0; i < TARGETS.length; i++) {
    const item = TARGETS[i];
    console.log(`[${i + 1}/${TARGETS.length}] Searching: ${item.q}`);
    const ddgResults = await searchDuckDuckGo(item.q);
    let foundUrl = null;
    for (const cand of ddgResults.slice(0, 4)) {
      foundUrl = await probeImage(cand.id, cand.slug);
      if (foundUrl) {
        console.log(`  -> FOUND 200: ${foundUrl}`);
        harvested[item.key] = foundUrl;
        break;
      }
    }
    if (!foundUrl) {
      console.log(`  -> NOT FOUND for ${item.key}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }

  writeFileSync('scripts/resolved_flavour_images.json', JSON.stringify(harvested, null, 2), 'utf-8');
  console.log(`Done! Harvested ${Object.keys(harvested).length} images.`);
}

main();
