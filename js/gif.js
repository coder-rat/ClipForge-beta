// gif.js - Original GIF encoder (colour quantiser + LZW + file writer).
const BY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function quant(d, w, h) {
  const o = new Uint8Array(w * h);
  for (let y = 0, p = 0; y < h; y++)
    for (let x = 0; x < w; x++, p++) {
      const m = (BY[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5,
        q = p * 4,
        r = Math.max(0, Math.min(7, Math.round(((d[q] + m * 36) * 7) / 255))),
        g = Math.max(0, Math.min(7, Math.round(((d[q + 1] + m * 36) * 7) / 255))),
        b = Math.max(0, Math.min(3, Math.round(((d[q + 2] + m * 85) * 3) / 255)));
      o[p] = (r << 5) | (g << 2) | b;
    }
  return o;
}
function lzw(px) {
  const buf = [];
  let bits = 0,
    nb = 0,
    size = 9,
    next = 258,
    dict = new Map();
  const put = (c, n) => {
    bits |= c << nb;
    nb += n;
    while (nb >= 8) {
      buf.push(bits & 255);
      bits >>= 8;
      nb -= 8;
    }
  };
  put(256, size);
  let cur = px[0];
  for (let i = 1; i < px.length; i++) {
    const c = px[i],
      k = (cur << 8) | c,
      v = dict.get(k);
    if (v !== undefined) cur = v;
    else {
      put(cur, size);
      if (next < 4096) {
        dict.set(k, next++);
        if (next > 1 << size && size < 12) size++;
      } else {
        put(256, size);
        dict = new Map();
        size = 9;
        next = 258;
      }
      cur = c;
    }
  }
  put(cur, size);
  put(257, size);
  if (nb > 0) buf.push(bits & 255);
  return buf;
}
function gifBytes(fr, w, h, dl) {
  const o = [71, 73, 70, 56, 57, 97, w & 255, w >> 8, h & 255, h >> 8, 247, 0, 0];
  for (let i = 0; i < 256; i++)
    o.push((((i >> 5) * 255) / 7) | 0, ((((i >> 2) & 7) * 255) / 7) | 0, (i & 3) * 85);
  o.push(33, 255, 11, 78, 69, 84, 83, 67, 65, 80, 69, 50, 46, 48, 3, 1, 0, 0, 0);
  for (const f of fr) {
    o.push(33, 249, 4, 4, dl & 255, dl >> 8, 0, 0, 44, 0, 0, 0, 0, w & 255, w >> 8, h & 255, h >> 8, 0, 8);
    const b = lzw(f);
    for (let i = 0; i < b.length; i += 255) {
      const s = b.slice(i, i + 255);
      o.push(s.length, ...s);
    }
    o.push(0);
  }
  o.push(59);
  return new Uint8Array(o);
}
