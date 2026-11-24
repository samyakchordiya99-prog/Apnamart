async function searchDuckDuckGo(q) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:bigbasket.com/pd ' + q)}`;
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
}

async function test() {
  const items = [
    'britannia little hearts',
    'britannia 50 50 maska chaska',
    'britannia milk bikis',
    'aashirvaad superior mp atta',
    'india gate basmati rice',
    'colgate strong teeth',
    'dove deeply nourishing soap',
    'kelloggs corn flakes',
    'nestle kitkat'
  ];

  for (const item of items) {
    const list = await searchDuckDuckGo(item);
    console.log(`Query: ${item} -> Found ${list.length} matches:`);
    for (const m of list.slice(0, 2)) {
      console.log(`   ID: ${m.id}, Slug: ${m.slug}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

test();

