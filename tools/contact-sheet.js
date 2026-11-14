// Ghép mọi nhân vật trong characters/ thành ảnh tổng hợp để kiểm tra bằng mắt.
// Chạy: node tools/contact-sheet.js [thư-mục-con] [file-xuất]
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'characters');
const sub = process.argv[2] || '';
const out = process.argv[3] || path.join(ROOT, sub ? `tong-hop-${sub.replace(/[\\/]/g, '-')}.png` : 'tong-hop.png');

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.png') && dir !== ROOT) files.push(p);
  }
})(path.join(ROOT, sub));

(async () => {
  const cw = 200, ch = 260, cols = 8, rows = Math.ceil(files.length / cols);
  const comps = []; let txt = '';
  for (let i = 0; i < files.length; i++) {
    const img = await sharp(files[i]).resize(cw - 16, ch - 46, { fit: 'inside' }).toBuffer();
    const m = await sharp(img).metadata();
    const cx = (i % cols) * cw, cy = ((i / cols) | 0) * ch;
    comps.push({ input: img, left: cx + ((cw - m.width) >> 1), top: cy + 8 + ((ch - 46 - m.height) >> 1) });
    const label = path.relative(ROOT, files[i]).replace(/\\/g, '/').replace('.png', '').replace('bieu-cam/', '');
    txt += `<text x="${cx + cw / 2}" y="${cy + ch - 14}" text-anchor="middle" font-family="Segoe UI" font-size="14" fill="#5a4030">${label}</text>`;
  }
  const W = cols * cw, H = rows * ch;
  comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${txt}</svg>`), left: 0, top: 0 });
  await sharp({ create: { width: W, height: H, channels: 3, background: '#E6F0F7' } }).composite(comps).png().toFile(out);
  console.log(files.length, 'hình ->', out);
})();
