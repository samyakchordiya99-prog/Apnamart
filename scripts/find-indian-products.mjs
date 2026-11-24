async function search(brand, query = '') {
  try {
    let url = `https://world.openfoodfacts.org/api/v2/search?countries_tags_en=india&fields=code,product_name,brands,image_front_url,image_url&page_size=5`;
    if (brand) url += `&brands_tags=${encodeURIComponent(brand)}`;
    if (query) url += `&search_terms=${encodeURIComponent(query)}`;

    await new Promise(r => setTimeout(r, 1200)); // wait 1.2s to prevent 503
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ApnaMart-Demo-App/2.0 (contact@apnamart.com)'
      }
    });
    if (!res.ok) {
      console.log(brand, query, 'HTTP', res.status);
      return;
    }
    const data = await res.json();
    console.log(`=== Brand: "${brand}", Query: "${query}" ===`);
    for (const p of (data.products || [])) {
      const img = p.image_front_url || p.image_url;
      if (img) {
        console.log(` - ${p.product_name} (${p.brands}): ${img}`);
      }
    }
  } catch (err) {
    console.error(err.message);
  }
}

await search('nestle', 'noodles');
await search('cadbury', 'oreo');
await search('parle', 'hide');
await search('parle', 'krackjack');
await search('britannia', 'hearts');
await search('tata', 'tea');
await search('amul', 'butter');
await search('amul', 'milk');
await search('aashirvaad', 'atta');
await search('fortune', 'oil');
await search('haldiram', 'bhujia');
await search('', 'sugar');
await search('', 'peanut');
await search('', 'jowar');
await search('', 'bajra');
await search('', 'basmati');
await search('', 'toor dal');
