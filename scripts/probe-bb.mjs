async function probe(id, slug) {
  for (let v = 1; v <= 20; v++) {
    const u = `https://www.bbassets.com/media/uploads/p/l/${id}_${v}-${slug}.jpg`;
    try {
      const res = await fetch(u, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.status === 200) {
        console.log(`FOUND 200: ${u}`);
        return u;
      }
    } catch {}
  }
  // Try without slug
  for (let v = 1; v <= 10; v++) {
    const u = `https://www.bbassets.com/media/uploads/p/l/${id}_${v}.jpg`;
    try {
      const res = await fetch(u, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.status === 200) {
        console.log(`FOUND 200: ${u}`);
        return u;
      }
    } catch {}
  }
  console.log(`Not found for ${id} ${slug}`);
  return null;
}

async function test() {
  await probe('40174323', 'britannia-little-hearts-biscuits-75-g');
  await probe('270764', 'britannia-little-hearts-classic-biscuits-sugar-sprinkled-heart-shaped-155-g');
  await probe('40203380', 'britannia-50-50-maska-chaska-300-g');
  await probe('100012364', 'britannia-milk-bikis-milk-cream-biscuits-100-g');
}

test();

