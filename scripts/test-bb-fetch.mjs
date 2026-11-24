async function testJio() {
  const res = await fetch('https://www.jiomart.com/p/groceries/britannia-marie-gold-biscuits-250-g/490000039', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const regex = /https:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp)/g;
  const matches = [...new Set(Array.from(html.matchAll(regex), m => m[0]))];
  console.log('Matches:', matches.filter(u => u.includes('product') || u.includes('image')));
}
await testJio();
