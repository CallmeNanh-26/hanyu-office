// Hình vẽ bằng code (SVG), cùng phong cách sticker ấm áp:
//   ART.campus(opts)  : bản đồ khu công ty dạng isometric (sơ đồ nhìn chéo từ trên xuống)
//   ART.scene(kind)   : nền phía sau các cảnh hội thoại (văn phòng sếp, cuộc gọi với từng nhà cung cấp)
(() => {
const INK = '#6F442B';
const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0')).join('');
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// =====================================================================
//  BẢN ĐỒ ISOMETRIC
// =====================================================================
const U = 30, V = 15, Z = 27; // nửa bề ngang ô, nửa bề cao ô, chiều cao 1 đơn vị
const P = (x, y, z = 0) => [(x - y) * U, (x + y) * V - z * Z];
const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const poly = (a, fill, sw = 1.6, extra = '') => `<polygon points="${pts(a)}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" ${extra}/>`;
// Khối hộp: vẽ 3 mặt nhìn thấy (trên, mặt +y, mặt +x)
function box(x, y, z, w, d, h, c, o = {}) {
  let s = '';
  if (h > 0) {
    s += poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], o.fy || shade(c, .9), o.sw);
    s += poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], o.fx || shade(c, .78), o.sw);
  }
  return s + poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], c, o.sw);
}
// Mảng phẳng dán lên tường sau (mặt phẳng y = yw) và tường bên (mặt phẳng x = xw)
const onWallA = (yw, x0, x1, z0, z1, fill, sw) => poly([P(x0, yw, z0), P(x1, yw, z0), P(x1, yw, z1), P(x0, yw, z1)], fill, sw);
const onWallB = (xw, y0, y1, z0, z1, fill, sw) => poly([P(xw, y0, z0), P(xw, y1, z0), P(xw, y1, z1), P(xw, y0, z1)], fill, sw);
// Chữ nằm trên tường (nghiêng theo mặt tường)
const textA = (yw, x, z, str, size, fill, weight = 700) => { const [sx, sy] = P(x, yw, z); return `<text transform="matrix(1 .5 0 1 ${sx.toFixed(1)} ${sy.toFixed(1)})" text-anchor="middle" font-size="${size}" font-weight="${weight}" fill="${fill}" font-family="Microsoft YaHei, PingFang SC, sans-serif">${esc(str)}</text>`; };
const textB = (xw, y, z, str, size, fill, weight = 700) => { const [sx, sy] = P(xw, y, z); return `<text transform="matrix(1 -.5 0 1 ${sx.toFixed(1)} ${sy.toFixed(1)})" text-anchor="middle" font-size="${size}" font-weight="${weight}" fill="${fill}" font-family="Microsoft YaHei, PingFang SC, sans-serif">${esc(str)}</text>`; };
const circle = (x, y, z, r, fill, sw = 1.6) => { const [sx, sy] = P(x, y, z); return `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`; };

// ---------- Đồ đạc (toạ độ thế giới) ----------
const F = {
  desk: (x, y, z, w = 1.5, d = .75, c = '#E3B27A') => box(x, y, z, w, d, .7, c),
  // Màn hình quay mặt về phía +y (người ngồi phía trước)
  monitor: (x, y, z) => box(x, y, z, .6, .08, .42, '#59606E') + poly([P(x + .06, y + .08, z + .06), P(x + .54, y + .08, z + .06), P(x + .54, y + .08, z + .36), P(x + .06, y + .08, z + .36)], '#A9D6F0', 1),
  chair: (x, y, z, c = '#6FAE86') => box(x, y, z, .5, .5, .36, c) + box(x, y + .42, z + .36, .5, .08, .5, c),
  plant: (x, y, z) => box(x, y, z, .45, .45, .4, '#E9926A') + circle(x + .22, y + .22, z + 1.05, 13, '#7DBA6A') + circle(x + .05, y + .3, z + .75, 10, '#8FCB76') + circle(x + .4, y + .15, z + .8, 10, '#6DAA5C'),
  books: (x, y, z) => box(x, y, z, .35, .25, .12, '#E66F5C') + box(x + .05, y, z + .12, .3, .25, .1, '#5B8FD6'),
  paper: (x, y, z) => box(x, y, z, .4, .3, .06, '#FFFFFF'),
  mug: (x, y, z) => box(x, y, z, .14, .14, .16, '#F2F2F2'),
  // Cây tán tròn nhiều lớp: lớp tối phía dưới, lớp sáng phía trên, chấm sáng như nắng
  tree: (x, y, k = 1) => {
    const [sx, sy] = P(x + .15, y + .15, 0);
    const blob = (dx, dy, r, c) => `<circle cx="${(sx + dx * k).toFixed(1)}" cy="${(sy + dy * k).toFixed(1)}" r="${(r * k).toFixed(1)}" fill="${c}" stroke="${INK}" stroke-width="1.6"/>`;
    const dot = (dx, dy, r) => `<circle cx="${(sx + dx * k).toFixed(1)}" cy="${(sy + dy * k).toFixed(1)}" r="${(r * k).toFixed(1)}" fill="#C6E89A" opacity=".9"/>`;
    return `<ellipse cx="${sx.toFixed(1)}" cy="${(sy + 4).toFixed(1)}" rx="${(26 * k).toFixed(1)}" ry="${(9 * k).toFixed(1)}" fill="#9CC27A" opacity=".55"/>` +
      `<path d="M ${(sx - 5 * k).toFixed(1)} ${sy.toFixed(1)} L ${(sx - 3 * k).toFixed(1)} ${(sy - 34 * k).toFixed(1)} L ${(sx + 3 * k).toFixed(1)} ${(sy - 34 * k).toFixed(1)} L ${(sx + 5 * k).toFixed(1)} ${sy.toFixed(1)} Z" fill="#A87449" stroke="${INK}" stroke-width="1.6"/>` +
      blob(-20, -38, 18, '#6DAA5C') + blob(20, -38, 18, '#6DAA5C') + blob(0, -36, 20, '#74B05E') +
      blob(-14, -56, 19, '#86C26E') + blob(15, -56, 19, '#86C26E') + blob(0, -72, 20, '#96CF7B') +
      dot(-10, -64, 4) + dot(8, -78, 3.5) + dot(16, -58, 3) + dot(-18, -46, 2.5);
  },
  bush: (x, y) => circle(x, y, .25, 9, '#74B05E') + circle(x + .35, y - .1, .3, 11, '#86C26E') + circle(x + .15, y + .25, .2, 8, '#6DAA5C'),
  // Bồn hoa chạy dọc mép toà nhà
  flowers: (x, y, w) => {
    let o = box(x, y, 0, w, .45, .32, '#C98B54');
    const cols = ['#F28AA0', '#FFD25E', '#FFFFFF', '#F2A57E', '#C89BE8'];
    for (let i = 0; i < w * 3; i++) {
      const fx = x + .15 + i / 3, fy = y + .12 + (i % 2) * .2;
      o += circle(fx, fy, .45, 5, '#7DBA6A', 1) + circle(fx + .05, fy, .62, 3.6, cols[i % cols.length], 1);
    }
    return o;
  },
  potFlower: (x, y, z) => box(x, y, z, .4, .4, .35, '#7FB3D5') + circle(x + .2, y + .2, z + .75, 9, '#7DBA6A') + circle(x + .1, y + .15, z + .9, 4, '#F28AA0', 1) + circle(x + .3, y + .25, z + .85, 4, '#FFD25E', 1),
  lamp: (x, y) => box(x, y, 0, .12, .12, 2.4, '#5B6170') + circle(x + .06, y + .06, 2.55, 9, '#FFE7A3'),
  bench: (x, y) => box(x, y, 0, 1.2, .45, .35, '#D9A066') + box(x, y, .35, 1.2, .1, .4, '#D9A066'),
  water: (x, y, z) => box(x, y, z, .45, .45, .8, '#E9EEF2') + box(x + .05, y + .05, z + .8, .35, .35, .45, '#9FD3F0'),
  printer: (x, y, z) => box(x, y, z, .8, .6, .55, '#C9CDD3') + box(x + .1, y + .1, z + .55, .6, .4, .18, '#E9ECEF'),
};

// Phòng cắt mở (chỉ có 2 bức tường phía sau) như nhà búp bê
function room(r) {
  const t = .25, H = r.h || 2.7, z0 = .3;
  let s = box(r.x, r.y, 0, r.w, r.d, z0, r.floor, { fy: r.out, fx: shade(r.out, .85) });
  // vân sàn
  for (let k = 1; k < r.d; k += 1) s += `<line x1="${P(r.x + t, r.y + k, z0)[0]}" y1="${P(r.x + t, r.y + k, z0)[1]}" x2="${P(r.x + r.w, r.y + k, z0)[0]}" y2="${P(r.x + r.w, r.y + k, z0)[1]}" stroke="${shade(r.floor, .88)}" stroke-width="1.2"/>`;
  // tường bên (dọc trục y) rồi tường sau (dọc trục x)
  s += box(r.x, r.y, z0, t, r.d, H, r.cap, { fy: r.out, fx: r.inner });
  s += box(r.x + t, r.y, z0, r.w - t, t, H, r.cap, { fy: r.inner, fx: r.out });
  // chân tường
  s += onWallA(r.y + t, r.x + t, r.x + r.w, z0, z0 + .18, shade(r.inner, .85), 1);
  s += onWallB(r.x + t, r.y + t, r.y + r.d, z0, z0 + .18, shade(r.inner, .85), 1);
  const ctx = { xa: r.x + t, ya: r.y + t, z: z0, x: r.x, y: r.y };
  if (r.walls) s += r.walls(ctx);
  // đồ đạc: sắp theo độ sâu (x + y lớn hơn thì gần người xem hơn)
  const items = r.items(ctx).sort((a, b) => a[0] - b[0]);
  return s + items.map(i => i[1]).join('');
}
// Cửa sổ trên tường sau / tường bên
const winA = (yw, x0, x1, z0, z1) => onWallA(yw, x0, x1, z0, z1, '#FFFFFF') + onWallA(yw, x0 + .08, x1 - .08, z0 + .08, z1 - .08, '#BFE3F2', 1) + onWallA(yw, (x0 + x1) / 2 - .03, (x0 + x1) / 2 + .03, z0 + .08, z1 - .08, '#FFFFFF', 0);
const winB = (xw, y0, y1, z0, z1) => onWallB(xw, y0, y1, z0, z1, '#FFFFFF') + onWallB(xw, y0 + .08, y1 - .08, z0 + .08, z1 - .08, '#BFE3F2', 1) + onWallB(xw, (y0 + y1) / 2 - .03, (y0 + y1) / 2 + .03, z0 + .08, z1 - .08, '#FFFFFF', 0);
// Nhân vật (ảnh PNG) đứng tại điểm (x, y, z)
const sprite = (x, y, z, href, h = 74) => { const [sx, sy] = P(x, y, z); return `<image href="${href}" x="${(sx - h * .45).toFixed(1)}" y="${(sy - h).toFixed(1)}" width="${(h * .9).toFixed(1)}" height="${h}" preserveAspectRatio="xMidYMax meet"/>`; };

function campus(o) {
  const out = [];
  // Nền đất và cỏ
  out.push(box(0, 0, -.7, 26, 21, .7, '#CFE7A8', { fy: '#C9A06E', fx: '#B08356' }));
  // Đường: một trục dọc x, một trục dọc y
  const road = (a) => poly(a, '#EADFCB', 1.4);
  out.push(road([P(0, 9.2), P(26, 9.2), P(26, 10.8), P(0, 10.8)]));
  out.push(road([P(12.2, 0), P(13.8, 0), P(13.8, 21), P(12.2, 21)]));
  const dash = (a, b) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="10 9" stroke-linecap="round"/>`;
  out.push(dash(P(0, 10), P(12, 10)), dash(P(14, 10), P(26, 10)), dash(P(13, 0), P(13, 9)), dash(P(13, 11), P(13, 21)));
  for (let k = 0; k < 5; k++) out.push(poly([P(11.4, 9.35 + k * .3), P(12.1, 9.35 + k * .3), P(12.1, 9.5 + k * .3), P(11.4, 9.5 + k * .3)], '#FFFFFF', 0));

  const objs = []; // [độ sâu, svg]
  const lock = id => !o.open[id];
  const wrap = (id, svg) => `<g class="bldg ${lock(id) ? 'locked' : ''} ${o.next === id ? 'next' : ''}" data-act="mapGo" data-arg="${id}">${svg}</g>`;

  // ---------- 1. 培训中心 (lớp đào tạo) ----------
  objs.push([9, wrap('train', room({ x: 1, y: 1, w: 8, d: 7, h: 2.7, floor: '#EBC896', out: '#D9774B', cap: '#E9926A', inner: '#FFF1D6',
    walls: c => winB(c.xa, c.y + 1.2, c.y + 3.2, c.z + 1.1, c.z + 2.2) +
      onWallA(c.ya, c.x + 1.9, c.x + 6.5, c.z + .8, c.z + 2.4, '#B98A5A') + onWallA(c.ya, c.x + 2, c.x + 6.4, c.z + .9, c.z + 2.3, '#3F6B57') +
      textA(c.ya, c.x + 4.2, c.z + 1.75, '汉语培训', 22, '#FFFFFF') + textA(c.ya, c.x + 4.2, c.z + 1.2, '采购 cǎigòu', 13, '#FFE7A3', 600) +
      circle(c.x + 7.2, c.ya, c.z + 2, 10, '#FFFFFF'),
    items: c => {
      const it = [[c.x + 1.5, F.plant(c.x + 7.2, c.y + .5, c.z)], [c.x + 4, box(c.x + 3.7, c.y + 1.1, c.z, .9, .55, .95, '#C98B54')]];
      it.push([c.x + c.y + 5.8, box(c.xa, c.y + 4.3, c.z, .4, 1.6, 2, '#B97A4A') + onWallB(c.xa + .4, c.y + 4.4, c.y + 5.8, c.z + 1.3, c.z + 1.6, '#5B8FD6', 1) + onWallB(c.xa + .4, c.y + 4.4, c.y + 5.8, c.z + .7, c.z + 1, '#E66F5C', 1)]);
      for (const dx of [1.4, 3.6, 5.8]) for (const dy of [2.8, 4.8]) {
        it.push([c.x + dx + c.y + dy, F.desk(c.x + dx, c.y + dy, c.z, 1.3, .6, '#F0C890') + F.books(c.x + dx + .4, c.y + dy + .15, c.z + .7)]);
        it.push([c.x + dx + c.y + dy + 1, F.chair(c.x + dx + .4, c.y + dy + .75, c.z)]);
      }
      // học viên ngồi học
      (o.students || []).forEach((img, i) => { const [dx, dy] = [[1.4, 2.8], [5.8, 2.8], [3.6, 4.8], [5.8, 4.8]][i] || [1.4, 4.8]; it.push([c.x + dx + c.y + dy + 1.2, sprite(c.x + dx + .65, c.y + dy + 1.15, c.z, img, 46)]); });
      it.push([c.x + c.y + 9.5, F.potFlower(c.x + .5, c.y + 6.4, c.z)]);
      if (o.mentor) it.push([c.x + c.y + 3, sprite(c.x + 5.7, c.y + 1.7, c.z, o.mentor, 72)]);
      return it;
    } }))]);

  // ---------- 2. 测评室 (phòng đánh giá) ----------
  objs.push([23, wrap('test', room({ x: 15, y: 2, w: 6.5, d: 6, h: 2.7, floor: '#F2E6D2', out: '#5E9F8A', cap: '#7FBFA8', inner: '#E7F4EC',
    walls: c => winA(c.ya, c.x + 4.4, c.x + 6, c.z + 1.1, c.z + 2.1) + onWallA(c.ya, c.x + 1, c.x + 3.4, c.z + 1.5, c.z + 2.2, '#FFFFFF') +
      textA(c.ya, c.x + 2.2, c.z + 1.68, '安静 · 考试中', 15, '#5E9F8A') + circle(c.x + 2.2, c.ya, c.z + 2.45, 9, '#FFFFFF') + winB(c.xa, c.y + 2, c.y + 4, c.z + 1.1, c.z + 2.1),
    items: c => {
      const it = [[c.x + c.y + 11, F.plant(c.x + 5.8, c.y + 5.2, c.z)]];
      for (const dx of [.9, 3.5]) for (const dy of [1.2, 3.4]) {
        it.push([c.x + dx + c.y + dy, F.desk(c.x + dx, c.y + dy, c.z, 1.6, .7, '#D7E9F0') + F.monitor(c.x + dx + .5, c.y + dy + .1, c.z + .7) + F.paper(c.x + dx + .1, c.y + dy + .35, c.z + .7)]);
        it.push([c.x + dx + c.y + dy + 1, F.chair(c.x + dx + .55, c.y + dy + .85, c.z, '#8BB7D9')]);
      }
      (o.examinees || []).forEach((img, i) => { const [dx, dy] = [[.9, 1.2], [3.5, 3.4]][i] || [3.5, 1.2]; it.push([c.x + dx + c.y + dy + 1.2, sprite(c.x + dx + .8, c.y + dy + 1.25, c.z, img, 46)]); });
      it.push([c.x + c.y + 4, F.water(c.xa + .05, c.y + 4.9, c.z)]);
      return it;
    } }))]);

  // ---------- 3. 星辰电器 · 采购部 (văn phòng làm nhiệm vụ) ----------
  objs.push([22, wrap('mission', room({ x: 1, y: 12, w: 10.2, d: 7.4, h: 2.8, floor: '#E8C496', out: '#C86C45', cap: '#E08A5F', inner: '#FDE7D7',
    walls: c => winA(c.ya, c.x + 1, c.x + 3.4, c.z + 1.1, c.z + 2.3) + winA(c.ya, c.x + 4, c.x + 6.2, c.z + 1.1, c.z + 2.3) +
      onWallA(c.ya, c.x + 6.9, c.x + 9.8, c.z + 1.9, c.z + 2.5, '#3F7D5C') + textA(c.ya, c.x + 8.35, c.z + 2.07, '星辰电器 · 采购部', 13, '#FFFFFF') +
      onWallA(c.ya, c.x + 7.3, c.x + 8.5, c.z + .95, c.z + 1.7, '#FFFFFF') + `<polyline points="${pts([P(c.x + 7.45, c.ya, c.z + 1.1), P(c.x + 7.8, c.ya, c.z + 1.35), P(c.x + 8.05, c.ya, c.z + 1.2), P(c.x + 8.35, c.ya, c.z + 1.55)])}" fill="none" stroke="#D9534F" stroke-width="2"/>` +
      onWallB(c.xa, c.y + 4.6, c.y + 6.4, c.z + 1.2, c.z + 2.2, '#F4D06F') + textB(c.xa, c.y + 5.5, c.z + 1.6, '优秀部门', 12, '#B5432F'),
    items: c => {
      const it = [];
      it.push([c.x + c.y + 1, box(c.xa, c.y + .9, c.z, .45, 2.6, 2.1, '#B97A4A') + onWallB(c.xa + .45, c.y + 1, c.y + 3.4, c.z + 1.5, c.z + 1.85, '#5B8FD6', 1) + onWallB(c.xa + .45, c.y + 1, c.y + 3.4, c.z + .9, c.z + 1.25, '#F2A93B', 1) + onWallB(c.xa + .45, c.y + 1, c.y + 3.4, c.z + .3, c.z + .65, '#E66F5C', 1)]);
      it.push([c.x + c.y + 5, F.printer(c.xa + .05, c.y + 3.9, c.z)]);
      it.push([c.x + c.y + 7, F.water(c.xa + .05, c.y + 6.6, c.z)]);
      // khu sếp: vách kính + bàn lớn
      it.push([c.x + c.y + 8, box(c.x + 6.6, c.ya, c.z, .06, 2.6, 1.7, '#CDE9F5', { fy: '#CDE9F5', fx: '#BFE0EF' }) + F.desk(c.x + 7.4, c.y + 1.1, c.z, 2, .8, '#C98B54') + F.monitor(c.x + 8.4, c.y + 1.15, c.z + .7) + F.mug(c.x + 7.7, c.y + 1.4, c.z + .7)]);
      if (o.boss) it.push([c.x + c.y + 9.5, sprite(c.x + 8.2, c.y + 2.3, c.z, o.boss, 78)]);
      it.push([c.x + c.y + 9.8, F.plant(c.x + 9.5, c.y + 2.6, c.z)]);
      // bàn làm việc chung
      for (const [dx, dy] of [[1.4, 3], [3.4, 3], [1.4, 5.3], [3.4, 5.3]]) {
        it.push([c.x + dx + c.y + dy, F.desk(c.x + dx, c.y + dy, c.z, 1.7, .75, '#F0C890') + F.monitor(c.x + dx + .6, c.y + dy + .08, c.z + .7) + F.paper(c.x + dx + .15, c.y + dy + .35, c.z + .7)]);
        it.push([c.x + dx + c.y + dy + 1, F.chair(c.x + dx + .6, c.y + dy + .9, c.z)]);
      }
      if (o.coworker) it.push([c.x + c.y + 9.6, sprite(c.x + 2.1, c.y + 5.1, c.z, o.coworker, 62)]);
      (o.staff || []).forEach((img, i) => { const [dx, dy] = [[4.1, 3.85], [4.1, 6.15]][i] || [2, 3.8]; it.push([c.x + dx + c.y + dy + 1.1, sprite(c.x + dx, c.y + dy, c.z, img, 54)]); });
      it.push([c.x + c.y + 4.4, F.potFlower(c.x + 5.6, c.y + .5, c.z)]);
      // bàn họp
      it.push([c.x + c.y + 11.5, F.chair(c.x + 6.6, c.y + 4.3, c.z, '#4F8F6E') + F.chair(c.x + 7.6, c.y + 4.3, c.z, '#4F8F6E')]);
      it.push([c.x + c.y + 12.5, box(c.x + 6.3, c.y + 4.9, c.z, 2.4, 1.2, .62, '#FFFFFF') + F.paper(c.x + 6.9, c.y + 5.2, c.z + .62) + F.mug(c.x + 7.9, c.y + 5.3, c.z + .62)]);
      it.push([c.x + c.y + 14, F.chair(c.x + 6.6, c.y + 6.2, c.z, '#4F8F6E') + F.chair(c.x + 7.6, c.y + 6.2, c.z, '#4F8F6E')]);
      it.push([c.x + c.y + 16.5, F.plant(c.x + 9.6, c.y + 6.8, c.z)]);
      if (o.player) it.push([c.x + c.y + 15, sprite(c.x + 5.3, c.y + 6.6, c.z, o.player, 76)]);
      return it;
    } }))]);

  // ---------- 4. 工厂 (sắp mở) ----------
  const fx = 15.6, fy = 12.6, fw = 7, fd = 6, fh = 2.6;
  let fac = box(fx, fy, 0, fw, fd, fh, '#B9C3CC', { fy: '#D5DCE2', fx: '#C2CBD3' });
  // mái răng cưa kiểu nhà xưởng
  for (let k = 0; k < 4; k++) {
    const a = fx + k * 1.75, b = a + 1.75;
    fac += poly([P(a, fy, fh), P(b, fy, fh + .9), P(b, fy + fd, fh + .9), P(a, fy + fd, fh)], '#9AA7B3');
    fac += poly([P(b, fy, fh), P(b, fy + fd, fh), P(b, fy + fd, fh + .9), P(b, fy, fh + .9)], '#BFE3F2');
    fac += poly([P(a, fy + fd, fh), P(b, fy + fd, fh), P(b, fy + fd, fh + .9)], '#C2CBD3');
  }
  fac += box(fx + 5.4, fy + .6, fh, .6, .6, 1.8, '#A66A4E');
  fac += onWallA(fy + fd, fx + 2.6, fx + 4.6, 0, 1.7, '#8E99A4') + onWallA(fy + fd, fx + .6, fx + 2, 1.1, 1.9, '#BFE3F2') + onWallA(fy + fd, fx + 5.1, fx + 6.5, 1.1, 1.9, '#BFE3F2');
  fac += textA(fy + fd, fx + 3.6, 2.15, '工厂', 18, '#5B6170');
  fac += box(fx + fw + .2, fy + 3.2, 0, .9, 1.4, 1, '#8E99A4') + box(fx + fw + .35, fy + 3.5, 1, .6, .6, .5, '#A66A4E') + box(fx + fw + .05, fy + 2.4, .6, .15, .9, .15, '#B9C3CC');
  objs.push([36, wrap('factory', fac)]);

  // Cây, đèn đường, ghế
  for (const [x, y, k] of [[10.4, 1.4, 1], [10.6, 6.8, .9], [23.2, 2.4, 1], [23.6, 7.6, .95], [11.6, 13.6, .9], [14.6, 19.6, 1.05], [24.6, 19.8, 1.15],
    [1, 20.4, 1.2], [6.2, 20.4, 1], [0.4, 11.6, 1.1], [24.7, 12.2, 1.1], [24.8, 16, 1], [11.4, 20.2, .95], [0.5, 0.5, 1.15], [24.6, .5, 1.1]]) objs.push([x + y + .3, F.tree(x, y, k)]);
  objs.push([10.5, F.flowers(2, 8.15, 5.5)], [24.5, F.flowers(16, 8.15, 4.5)], [22, F.flowers(2.2, 19.6, 6)]);
  for (const [x, y] of [[9.4, 8.4], [21.8, 8.5], [11.4, 19.4], [15.2, 11.9], [23.4, 19.6], [0.6, 8.6]]) objs.push([x + y, F.bush(x, y)]);
  for (const [x, y] of [[11.6, 8.5], [14.3, 11.3], [4, 8.6], [20, 11.3]]) objs.push([x + y, F.lamp(x, y)]);
  objs.push([25.5, F.bench(14.4, 8.2)]);
  objs.sort((a, b) => a[0] - b[0]);
  out.push(...objs.map(x => x[1]));

  // Biển tên nổi phía trên mỗi toà nhà
  const pin = (id, x, y, z, b) => {
    const [sx, sy] = P(x, y, z);
    const l = lock(id), w = b.w || 176;
    return `<g class="pin ${l ? 'locked' : ''} ${o.next === id ? 'next' : ''}" data-act="mapGo" data-arg="${id}" transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})">
      <path d="M -10 30 L 0 44 L 10 30 Z" fill="${l ? '#B9B2AA' : '#8B5A3C'}"/>
      <rect x="${-w / 2}" y="-34" width="${w}" height="66" rx="14" fill="${l ? '#F1ECE6' : '#FFF8EC'}" stroke="${l ? '#B9B2AA' : '#8B5A3C'}" stroke-width="3"/>
      <text x="0" y="-11" text-anchor="middle" font-size="18" font-weight="800" fill="${l ? '#9A8F85' : '#5B3A26'}" font-family="Baloo 2, Microsoft YaHei, sans-serif">${l ? '🔒 ' : b.icon + ' '}${esc(b.zh)}</text>
      <text class="py" x="0" y="6" text-anchor="middle" font-size="11" font-weight="700" fill="#F0883A" font-family="Nunito, sans-serif">${esc(b.py)}</text>
      <text class="vi" x="0" y="22" text-anchor="middle" font-size="11.5" fill="#A07E63" font-family="Nunito, sans-serif">${esc(b.vi)}</text>
    </g>`;
  };
  const L = o.labels;
  out.push(pin('train', 5, 4.5, 6.4, L.train), pin('test', 18.2, 5, 6.2, L.test), pin('mission', 6, 15.7, 6.6, L.mission), pin('factory', 19, 15.6, 6.4, L.factory));
  // Mũi tên "đi tới đây"
  const tgt = { train: [5, 4.5, 8.1], test: [18.2, 5, 7.9], mission: [6, 15.7, 8.3] }[o.next];
  if (tgt) { const [sx, sy] = P(...tgt); out.push(`<g class="here" transform="translate(${sx.toFixed(1)} ${(sy - 10).toFixed(1)})"><g class="bob"><path d="M -14 -16 L 14 -16 L 0 4 Z" fill="#F0883A" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></g></g>`); }

  const [minX, maxX, minY, maxY] = [P(0, 21)[0] - 30, P(26, 0)[0] + 30, P(5, 4.5, 6.4)[1] - 120, P(26, 21, -.7)[1] + 10];
  return `<svg class="campus" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bản đồ khu công ty">${out.join('')}</svg>`;
}

// =====================================================================
//  NỀN CẢNH HỘI THOẠI (nhìn thẳng)
// =====================================================================
const R = (x, y, w, h, fill, rx = 0, sw = 3) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const T = (x, y, str, size, fill, weight = 800, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}" font-family="Microsoft YaHei, PingFang SC, sans-serif">${esc(str)}</text>`;
const floor = (x0, x1, c = '#E2B98A') => {
  let s = R(x0, 300, x1 - x0, 130, c, 0, 0) + `<rect x="${x0}" y="292" width="${x1 - x0}" height="10" fill="${shade(c, .8)}"/>`;
  for (const y of [335, 372, 410]) s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${shade(c, .86)}" stroke-width="2"/>`;
  for (let x = x0 + 60; x < x1; x += 140) s += `<line x1="${x}" y1="302" x2="${x}" y2="335" stroke="${shade(c, .86)}" stroke-width="2"/><line x1="${x + 70}" y1="335" x2="${x + 70}" y2="372" stroke="${shade(c, .86)}" stroke-width="2"/>`;
  return s;
};
const plantFront = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse cx="0" cy="-70" rx="30" ry="40" fill="#7DBA6A" stroke="${INK}" stroke-width="3"/><ellipse cx="-26" cy="-46" rx="20" ry="26" fill="#6DAA5C" stroke="${INK}" stroke-width="3"/><ellipse cx="26" cy="-48" rx="20" ry="26" fill="#8FCB76" stroke="${INK}" stroke-width="3"/>
  <path d="M -26 -24 L 26 -24 L 20 20 L -20 20 Z" fill="#E9926A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>`;
const monitorFront = (x, y, w = 120, h = 76, screen = '#BFE3F2', content = '') => R(x, y, w, h, '#59606E', 8) + R(x + 7, y + 7, w - 14, h - 18, screen, 4, 2) + content + R(x + w / 2 - 10, y + h, 20, 14, '#59606E', 0, 2) + R(x + w / 2 - 28, y + h + 12, 56, 8, '#59606E', 4, 2);
const deskFront = (x, w, top = 250, c = '#D9A86C') => R(x - 8, top, w + 16, 16, shade(c, 1.08), 6) + R(x, top + 16, w, 70, c, 0) + `<line x1="${x + w * .62}" y1="${top + 16}" x2="${x + w * .62}" y2="${top + 86}" stroke="${INK}" stroke-width="2"/>` + R(x + w * .62 + 16, top + 36, w * .38 - 32, 8, shade(c, .8), 4, 2);
const sky = (x, y, w, h) => {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#CFE8F5"/>`;
  const blds = [[.02, .55, .16], [.2, .35, .14], [.36, .6, .12], [.5, .28, .16], [.68, .5, .13], [.83, .4, .15]];
  for (const [bx, bt, bw] of blds) { s += `<rect x="${x + bx * w}" y="${y + bt * h}" width="${bw * w}" height="${h * (1 - bt)}" fill="#A9CDE3"/>`; for (let wy = y + bt * h + 8; wy < y + h - 8; wy += 14) s += `<rect x="${x + bx * w + 5}" y="${wy}" width="${bw * w - 10}" height="5" fill="#DDEFF8"/>`; }
  return s + `<circle cx="${x + w * .82}" cy="${y + h * .2}" r="${h * .1}" fill="#FFF3C4"/>`;
};
const windowFront = (x, y, w, h, inside) => R(x - 6, y - 6, w + 12, h + 12, '#FFFFFF', 6) + `<g>${inside || sky(x, y, w, h)}</g>` + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="3"/><line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="#FFFFFF" stroke-width="6"/><line x1="${x}" y1="${y + h * .45}" x2="${x + w}" y2="${y + h * .45}" stroke="#FFFFFF" stroke-width="6"/>`;
const curtain = (x, y, h, c = '#F2A57E', dir = 1) => `<path d="M ${x} ${y} q ${14 * dir} ${h * .5} ${4 * dir} ${h} l ${30 * dir} 0 q ${-6 * dir} ${-h * .5} ${18 * dir} ${-h} Z" fill="${c}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
const binders = (x, y, w, cols) => cols.map((c, i) => R(x + i * (w / cols.length), y, w / cols.length - 3, 46, c, 3, 2)).join('');
const shelf = (x, y, w, h, rows) => {
  let s = R(x, y, w, h, '#B97A4A', 6);
  const step = (h - 12) / rows.length;
  rows.forEach((r, i) => { const sy = y + 8 + i * step; s += R(x + 8, sy, w - 16, step - 8, '#8E5A35', 3, 2) + r(x + 14, sy + step - 62, w - 28); });
  return s;
};
const clock = (x, y, r = 24) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y - r * .6}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><line x1="${x}" y1="${y}" x2="${x + r * .45}" y2="${y + 4}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
const frame = (x, y, w, h, inner) => R(x, y, w, h, '#E9B666', 4) + R(x + 6, y + 6, w - 12, h - 12, '#FFFDF5', 2, 2) + (inner || '');
const phoneDesk = (x, y) => R(x, y, 70, 30, '#4F5560', 8) + R(x + 6, y - 14, 58, 16, '#4F5560', 8) + R(x + 38, y + 6, 24, 16, '#A9D6F0', 3, 2) + `<path d="M ${x + 6} ${y + 26} q -20 20 4 34 q 22 10 6 26" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
const papers = (x, y) => R(x, y, 70, 14, '#FFFFFF', 2, 2) + R(x + 4, y - 8, 66, 10, '#FFFFFF', 2, 2) + R(x - 2, y - 16, 64, 10, '#FFF4D6', 2, 2);
const mug = (x, y, c = '#FFFFFF') => R(x, y, 26, 30, c, 5, 2.5) + `<path d="M ${x + 26} ${y + 8} q 12 0 12 10 q 0 10 -12 10" fill="none" stroke="${INK}" stroke-width="2.5"/>`;

// Văn phòng sếp
function bossOffice() {
  let s = R(0, 0, 1000, 300, '#FBEBD2', 0, 0) + `<rect x="0" y="232" width="1000" height="60" fill="#F3D9B5"/><line x1="0" y1="232" x2="1000" y2="232" stroke="#D9B48A" stroke-width="3"/>`;
  s += floor(0, 1000);
  s += `<ellipse cx="560" cy="385" rx="330" ry="26" fill="#E99B6E" opacity=".45"/>`;
  s += shelf(28, 58, 200, 234, [ (x, y, w) => binders(x, y + 6, w, ['#5B8FD6', '#E66F5C', '#F2A93B', '#7DBA6A', '#5B8FD6']),
    (x, y, w) => binders(x, y + 6, w * .6, ['#B97ACB', '#E66F5C', '#F2A93B']) + `<path d="M ${x + w * .72} ${y + 52} l 10 -36 l 10 36 Z" fill="#F2C94C" stroke="${INK}" stroke-width="2"/>`,
    (x, y, w) => R(x, y + 18, w * .45, 34, '#E9DFCF', 3, 2) + R(x + w * .5, y + 22, w * .45, 30, '#C9CDD3', 3, 2) ]);
  // trên nóc tủ: chậu cây, cúp, huy chương
  s += `<path d="M 104 58 l 6 -26 h 24 l 6 26 Z" fill="#F2C94C" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M 104 34 q -14 0 -12 12 q 2 8 14 6 M 140 34 q 14 0 12 12 q -2 8 -14 6" fill="none" stroke="${INK}" stroke-width="3"/>` + R(110, 18, 24, 12, '#F2C94C', 3, 2);
  s += `<path d="M 170 26 l 10 18 l 10 -18" fill="none" stroke="#D9534F" stroke-width="6"/><circle cx="180" cy="48" r="11" fill="#F2C94C" stroke="${INK}" stroke-width="3"/>`;
  s += `<path d="M 46 58 l 4 -18 h 30 l 4 18 Z" fill="#E9926A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="65" cy="30" rx="18" ry="14" fill="#7DBA6A" stroke="${INK}" stroke-width="3"/>`;
  // xương rồng nhỏ trên kệ
  s += `<path d="M 196 236 h 22 l -3 18 h -16 Z" fill="#E9926A" stroke="${INK}" stroke-width="2.5"/><rect x="200" y="210" width="14" height="28" rx="7" fill="#6DAA5C" stroke="${INK}" stroke-width="2.5"/>`;
  // tranh biểu đồ và bản đồ thế giới giữa tủ và cửa sổ
  s += frame(238, 54, 64, 58, `<rect x="250" y="88" width="8" height="16" fill="#5B8FD6"/><rect x="262" y="78" width="8" height="26" fill="#F2A93B"/><rect x="274" y="70" width="8" height="34" fill="#E66F5C"/><circle cx="292" cy="72" r="6" fill="#7DBA6A"/>`);
  s += frame(238, 124, 64, 52, `<rect x="246" y="132" width="48" height="36" fill="#BFE3F2"/><path d="M 252 146 q 6 -8 14 -2 q 2 8 -6 10 Z M 272 140 q 10 -2 14 6 q -4 10 -12 8 Z" fill="#7DBA6A"/>`);
  s += windowFront(318, 40, 250, 170) + `<rect x="300" y="26" width="286" height="8" rx="4" fill="#8B5A3C"/>` + curtain(304, 30, 196, '#F2A57E', 1) + curtain(582, 30, 196, '#F2A57E', -1);
  s += R(630, 22, 160, 44, '#FFFFFF', 10) + [0, 1, 2, 3].map(i => `<line x1="${648}" y1="${50 + i * 4}" x2="${772}" y2="${50 + i * 4}" stroke="#C9CDD3" stroke-width="2"/>`).join('');
  s += clock(668, 112);
  s += frame(712, 88, 64, 78, `<circle cx="744" cy="140" r="9" fill="#E66F5C"/><line x1="726" y1="108" x2="762" y2="108" stroke="#A07E63" stroke-width="3"/><line x1="726" y1="120" x2="756" y2="120" stroke="#A07E63" stroke-width="3"/>`);
  s += frame(790, 88, 64, 78, `<path d="M 806 150 l 16 -22 l 10 12 l 12 -26" fill="none" stroke="#5E9F4E" stroke-width="3"/>`);
  s += `<path d="M 880 80 h 70 v 96 l -35 -18 l -35 18 Z" fill="#D9534F" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` + T(915, 116, '优秀', 22, '#FFE7A3') + T(915, 142, '部门', 22, '#FFE7A3');
  // ghế sếp sau bàn
  s += R(488, 150, 112, 120, '#5B6B7A', 26) + R(504, 166, 80, 70, '#6E7F8F', 18, 2);
  s += deskFront(360, 420, 250, '#C98B54');
  // laptop, kệ hồ sơ, ống bút, cà phê, sổ
  s += `<path d="M 640 246 l 12 -70 h 112 l 12 70 Z" fill="#C9CDD3" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M 656 238 l 9 -54 h 90 l 9 54 Z" fill="#E9F3F8" stroke="${INK}" stroke-width="2"/><circle cx="710" cy="212" r="7" fill="#C9CDD3"/>` + R(626, 244, 166, 10, '#B9C0C8', 4, 2.5);
  s += R(410, 196, 74, 52, '#8E5A35', 4) + R(416, 184, 14, 60, '#5B8FD6', 2, 2) + R(432, 180, 14, 64, '#E66F5C', 2, 2) + R(448, 186, 14, 58, '#F2A93B', 2, 2) + R(464, 182, 14, 62, '#7DBA6A', 2, 2);
  s += papers(500, 248) + R(806, 214, 26, 34, '#5B8FD6', 4, 2.5) + `<line x1="812" y1="214" x2="806" y2="194" stroke="${INK}" stroke-width="3"/><line x1="820" y1="214" x2="824" y2="190" stroke="#E66F5C" stroke-width="3"/><line x1="826" y1="214" x2="836" y2="198" stroke="#F2A93B" stroke-width="3"/>`;
  s += mug(586, 218, '#FFFFFF') + `<path d="M 592 212 q 4 -10 0 -18 M 602 212 q 4 -10 0 -18" fill="none" stroke="#C9CDD3" stroke-width="2.5"/>` + R(548, 238, 70, 20, '#3F7D5C', 4, 2) + T(583, 253, '经理', 13, '#FFFFFF');
  s += plantFront(940, 300, 1.05);
  // chậu hoa góc phải phía trước
  s += `<g transform="translate(965 430)"><path d="M -30 -40 h 60 l -6 40 h -48 Z" fill="#7FB3D5" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    [[-18, -52], [0, -60], [18, -50], [-8, -72], [12, -74]].map(([x, y], i) => `<circle cx="${x}" cy="${y + 10}" r="12" fill="#7DBA6A" stroke="${INK}" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="7" fill="${['#F28AA0', '#FFD25E', '#F2A57E', '#F28AA0', '#FFFFFF'][i]}" stroke="${INK}" stroke-width="2"/>`).join('') + '</g>';
  return s;
}

// Một nửa cảnh: bàn làm việc của mình trong phòng thu mua (khi gọi điện)
function myDesk() {
  let s = R(0, 0, 500, 300, '#EAF3E3', 0, 0) + `<rect x="0" y="232" width="500" height="60" fill="#DCEBD3"/><line x1="0" y1="232" x2="500" y2="232" stroke="#B9D3AE" stroke-width="3"/>`;
  s += floor(0, 500, '#E8C496');
  s += windowFront(36, 46, 150, 130);
  s += R(228, 54, 150, 104, '#D9A066', 6) + R(238, 64, 130, 84, '#EAC08D', 3, 2);
  s += R(250, 74, 34, 30, '#FFF3A8', 2, 2) + R(292, 78, 34, 30, '#FFC9D6', 2, 2) + R(334, 72, 26, 26, '#C9E8FF', 2, 2) + R(256, 110, 62, 32, '#FFFFFF', 2, 2) + T(287, 131, '报价单', 12, '#5B3A26');
  s += `<circle cx="267" cy="76" r="4" fill="#D9534F"/><circle cx="309" cy="80" r="4" fill="#5B8FD6"/>`;
  s += clock(430, 90, 22);
  s += R(140, 168, 96, 102, '#5E9F78', 22) + R(152, 180, 72, 60, '#78B892', 14, 2);
  s += deskFront(60, 400, 252, '#E3B27A');
  s += monitorFront(250, 166, 132, 82, '#FFFFFF', `<rect x="264" y="180" width="104" height="10" fill="#F6DDB8"/>` + [0, 1, 2].map(i => `<line x1="264" y1="${200 + i * 11}" x2="368" y2="${200 + i * 11}" stroke="#DCCDB9" stroke-width="2"/>`).join(''));
  s += phoneDesk(96, 232) + papers(390, 248) + mug(196, 222, '#F6C453');
  return s;
}

// Nửa cảnh của từng nhà cung cấp
const suppliers = {
  // 鑫达钢材: văn phòng gọn gàng, nhìn ra kho thép
  // o = npc.scene: { name, slogan / banner / calendar / en, steel }
  tidy: (o = {}) => {
    let s = R(500, 0, 500, 300, '#E6EEF5', 0, 0) + `<rect x="500" y="232" width="500" height="60" fill="#D6E2EC"/>`;
    s += floor(500, 1000, '#CFC3B4');
    const yard = `<rect x="560" y="50" width="200" height="140" fill="#DCE6EE"/><rect x="560" y="150" width="200" height="40" fill="#B9C3CC"/>` +
      [0, 1, 2].map(i => `<circle cx="${600 + i * 54}" cy="150" r="24" fill="#AEB8C2" stroke="${INK}" stroke-width="2"/><circle cx="${600 + i * 54}" cy="150" r="9" fill="#DCE6EE" stroke="${INK}" stroke-width="2"/>`).join('') +
      `<rect x="560" y="70" width="200" height="8" fill="#E9A84A"/>`;
    s += windowFront(560, 50, 200, 140, o.steel === false ? undefined : yard);
    s += R(792, 46, 176, 64, '#C8553D', 10) + T(880, 82, o.name || '鑫达钢材', 26, '#FFFFFF') + T(880, 102, o.slogan || '质量第一', 13, '#FFE7A3', 700);
    s += shelf(800, 128, 168, 164, [(x, y, w) => [0, 1, 2, 3].map(i => R(x, y + 34 - i * 8, w, 7, i % 2 ? '#C9CDD3' : '#E3E7EB', 2, 1.5)).join(''),
      (x, y, w) => `<path d="M ${x + 20} ${y + 52} q 0 -36 34 -36 q 34 0 34 36 Z" fill="#F6C453" stroke="${INK}" stroke-width="2.5"/>` + R(x + w - 60, y + 20, 50, 32, '#FFFFFF', 3, 2)]);
    s += deskFront(560, 210, 256, '#C9CDD3') + R(600, 214, 90, 40, '#59606E', 6) + R(606, 220, 78, 28, '#A9D6F0', 3, 2) + papers(700, 252);
    return s;
  },
  // 宏发金属: kho bừa bộn, lịch cũ năm 2024 (một gợi ý nhỏ)
  warehouse: (o = {}) => {
    let s = R(500, 0, 500, 300, '#EFE2C8', 0, 0) + `<ellipse cx="640" cy="80" rx="40" ry="18" fill="#E2D0AE"/><ellipse cx="930" cy="200" rx="30" ry="14" fill="#E2D0AE"/>`;
    s += floor(500, 1000, '#B9A588');
    s += `<g transform="rotate(-4 700 60)">` + R(560, 34, 250, 54, '#F6D24A', 6) + T(685, 72, o.banner || '价格最低！', 22, '#C8352E') + `</g>`;
    s += R(560, 112, 92, 104, '#FFFFFF', 4) + R(560, 112, 92, 24, '#D9534F', 4) + T(606, 130, o.calendar || '11月', 16, '#FFFFFF') + [0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c => `<rect x="${570 + c * 20}" y="${146 + r * 16}" width="12" height="9" fill="#E9DFCF"/>`).join('')).join('');
    s += `<line x1="700" y1="0" x2="700" y2="40" stroke="${INK}" stroke-width="2"/><path d="M 684 40 h 32 l -8 16 h -16 Z" fill="#8E99A4" stroke="${INK}" stroke-width="2"/>`;
    // thùng các-tông chồng lên nhau
    for (const [x, y, w, h] of [[820, 216, 90, 76], [910, 226, 80, 66], [840, 150, 76, 66], [925, 168, 58, 58], [860, 96, 60, 54]]) s += R(x, y, w, h, '#D9A066', 4) + `<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h * .3}" stroke="${INK}" stroke-width="2"/>`;
    s += deskFront(560, 220, 258, '#B9875A') + papers(590, 252) + R(630, 236, 60, 20, '#FFFFFF', 3, 2) + R(700, 220, 30, 36, '#F2F2F2', 4, 2) + `<path d="M 700 230 h 30" stroke="#E66F5C" stroke-width="4"/>`;
    s += R(520, 250, 30, 46, '#8E99A4', 4) + `<path d="M 650 252 l 30 -10 l 20 14" fill="none" stroke="#FFFFFF" stroke-width="3"/>`;
    return s;
  },
  // 华美钢业: phòng trưng bày sang trọng
  showroom: (o = {}) => {
    let s = R(500, 0, 500, 300, '#F8F4EC', 0, 0) + `<rect x="500" y="228" width="500" height="6" fill="#E3C27A"/><rect x="500" y="40" width="500" height="4" fill="#E3C27A"/>`;
    s += floor(500, 1000, '#E8DCCB');
    s += R(570, 60, 220, 70, '#2F3A48', 10) + T(680, 104, o.name || '华美钢业', 30, '#E9C46A') + T(680, 122, o.en || '', 11, '#E9C46A', 700);
    s += R(820, 54, 150, 238, '#E9F3F8', 6) + [0, 1, 2].map(i => `<line x1="820" y1="${120 + i * 60}" x2="970" y2="${120 + i * 60}" stroke="${INK}" stroke-width="2"/>`).join('') +
      [[845, 112], [905, 112], [870, 172], [930, 172], [850, 232]].map(([x, y]) => `<path d="M ${x} ${y} h 24 l -4 -10 q 8 -2 8 -12 h -6 v -14 h -20 v 14 h -6 q 0 10 8 12 Z" fill="#F2C94C" stroke="${INK}" stroke-width="2"/>`).join('');
    s += `<defs><linearGradient id="steel" x1="0" x2="1"><stop offset="0" stop-color="#C9D2DA"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#B9C3CC"/></linearGradient></defs>`;
    s += R(590, 170, 170, 70, 'url(#steel)', 4) + R(640, 240, 70, 54, '#2F3A48', 4) + T(675, 210, '304', 22, '#8E99A4');
    s += plantFront(560, 296, .8);
    return s;
  },
};
const callDivider = () => `<rect x="492" y="0" width="16" height="300" fill="#FFFFFF"/><line x1="492" y1="0" x2="492" y2="300" stroke="${INK}" stroke-width="2"/><line x1="508" y1="0" x2="508" y2="300" stroke="${INK}" stroke-width="2"/>
  <circle cx="500" cy="150" r="34" fill="#F0883A" stroke="#FFFFFF" stroke-width="6"/><circle cx="500" cy="150" r="34" fill="none" stroke="${INK}" stroke-width="2"/>
  <path d="M 486 136 q -4 8 4 20 q 8 12 20 14 l 6 -8 l -8 -6 l -5 4 q -8 -4 -11 -11 l 4 -5 l -6 -8 Z" fill="#FFFFFF"/>
  ${R(452, 190, 96, 30, '#FFFFFF', 15, 2)}${T(500, 211, '通话中', 15, '#8B5A3C')}`;

// Kho nhà máy (chương 2): cửa cuốn mở, đuôi xe tải 鑫达, kệ bó thép, vạch vàng dưới sàn
function factoryWarehouse() {
  let s = R(0, 0, 1000, 300, '#DCE3E8', 0, 0) + `<rect x="0" y="0" width="1000" height="26" fill="#B9C3CC"/>`;
  for (let x = 40; x < 1000; x += 120) s += `<line x1="${x}" y1="0" x2="${x + 30}" y2="26" stroke="#9AA6B0" stroke-width="3"/>`;
  s += floor(0, 1000, '#C7CDD2');
  s += `<path d="M 0 360 H 1000" stroke="#F2C94C" stroke-width="8" stroke-dasharray="40 24"/>`;
  // cửa cuốn mở và đuôi xe tải
  s += R(600, 50, 300, 244, '#8E99A4', 4) + R(612, 62, 276, 232, '#F4F1EA', 0, 2);
  s += [0, 1, 2].map(i => `<rect x="612" y="${62 + i * 10}" width="276" height="8" fill="#B9C3CC" stroke="${INK}" stroke-width="1.5"/>`).join('');
  s += R(640, 112, 220, 170, '#F0883A', 8) + R(656, 128, 188, 120, '#FFB27A', 4, 2) + `<circle cx="750" cy="170" r="20" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/><path d="M 738 172 l 8 8 l 16 -18" fill="none" stroke="#F0883A" stroke-width="4"/>`;
  s += `<line x1="750" y1="128" x2="750" y2="248" stroke="${INK}" stroke-width="2"/>` + R(640, 270, 220, 14, '#59606E', 3, 2);
  s += R(560, 30, 380, 18, '#5B6170', 4, 2) + T(750, 44, '收货区 · 卸货请小心', 13, '#FFE7A3', 700);
  // kệ bó thép bên trái
  s += R(30, 70, 250, 222, '#5B8FD6', 4) + R(42, 82, 226, 200, '#E9EEF2', 0, 2);
  for (const y of [150, 220]) s += R(30, y, 250, 10, '#F2A93B', 2, 2);
  for (const [y, n] of [[100, 3], [170, 3], [238, 2]]) for (let i = 0; i < n; i++) {
    const x = 52 + i * 72;
    s += [0, 1, 2, 3].map(j => R(x + j, y + 34 - j * 9, 60 - j * 2, 9, j % 2 ? '#C9D2DA' : '#E3E8EC', 2, 1.5)).join('') + `<rect x="${x + 18}" y="${y + 6}" width="5" height="37" fill="#E9A84A"/>`;
  }
  // biển an toàn và bảng ghi chép
  // biển "安全第一" treo giữa, cao hơn đầu nhân vật; bảng ghi chép không có chữ (để nhân vật đứng trước không đè lên chữ)
  s += `<line x1="455" y1="26" x2="455" y2="44" stroke="${INK}" stroke-width="2"/><line x1="545" y1="26" x2="545" y2="44" stroke="${INK}" stroke-width="2"/>` + R(430, 44, 140, 40, '#2F7D5C', 8) + T(500, 72, '安全第一', 22, '#FFFFFF');
  s += R(330, 150, 100, 90, '#FFFFFF', 4) + R(356, 142, 48, 16, '#8E99A4', 4, 2) + [0, 1, 2, 3, 4].map(i => `<line x1="344" y1="${170 + i * 13}" x2="416" y2="${170 + i * 13}" stroke="#C9CDD3" stroke-width="2"/>`).join('');
  // xe nâng nhỏ và pallet
  s += R(470, 214, 90, 56, '#F2C94C', 8) + R(480, 168, 46, 50, '#F2C94C', 6) + R(486, 176, 34, 30, '#BFE3F2', 3, 2) + `<line x1="560" y1="170" x2="560" y2="282" stroke="${INK}" stroke-width="5"/><line x1="560" y1="278" x2="596" y2="278" stroke="${INK}" stroke-width="5"/>`;
  s += `<circle cx="490" cy="276" r="14" fill="#3E4450" stroke="${INK}" stroke-width="3"/><circle cx="542" cy="276" r="14" fill="#3E4450" stroke="${INK}" stroke-width="3"/>`;
  s += R(900, 262, 90, 30, '#B97A4A', 3) + [0, 1, 2].map(j => R(906 + j, 236 - j * 9, 78 - j * 2, 9, j % 2 ? '#C9D2DA' : '#E3E8EC', 2, 1.5)).join('');
  return s;
}

// sup = npc.scene của nhân vật bên phải (kiểu nền + tên công ty)
function scene(kind, sup) {
  let body;
  if (kind === 'factory') body = factoryWarehouse();
  else if (kind === 'boss') body = bossOffice();
  else if (kind && kind.startsWith('call-')) body = myDesk() + (suppliers[(sup || {}).style] || suppliers.tidy)(sup || {}) + callDivider();
  else body = bossOffice();
  return `<svg class="scene-art" viewBox="0 0 1000 430" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
}

// =====================================================================
//  BẢN ĐỒ DÙNG TRANH VẼ SẴN (assets/campus.webp, người dùng tạo bằng Gemini từ gamesource art/đồ họa game.png)
//  Toạ độ đo trên khung 1024 x 572 (cùng tỉ lệ với tranh). Đổi tranh khác thì đo lại poly / pin / player.
// =====================================================================
const MAP = {
  img: 'assets/campus.webp', w: 1024, h: 572,
  spots: {
    // door = chỗ nhân vật đứng trước cửa (trên đường)
    train:   { poly: [[372, 95], [515, 18], [655, 95], [652, 152], [515, 222], [372, 152]], pin: [515, 40], door: [470, 242] },
    mission: { poly: [[105, 240], [240, 168], [410, 245], [410, 300], [268, 378], [105, 300]], pin: [200, 160], door: [432, 314] },
    test:    { poly: [[628, 245], [775, 168], [945, 240], [945, 300], [800, 382], [628, 300]], pin: [850, 160], door: [606, 314] },
    factory: { poly: [[420, 355], [505, 318], [640, 368], [640, 450], [540, 500], [420, 450]], pin: [610, 318], door: [452, 342] },
  },
  player: [575, 268],
  center: [515, 270], // ngã tư: mọi đường đi đều qua đây
};
const centroid = p => p.reduce((a, q) => [a[0] + q[0] / p.length, a[1] + q[1] / p.length], [0, 0]);
function campusImage(o) {
  const lock = id => !o.open[id];
  let svg = '';
  for (const [id, sp] of Object.entries(MAP.spots)) {
    const [cx, cy] = centroid(sp.poly);
    svg += `<g class="spot ${lock(id) ? 'locked' : ''} ${o.next === id ? 'next' : ''}" data-act="mapGo" data-arg="${id}">
      <polygon points="${sp.poly.map(q => q.join(',')).join(' ')}"/>
      ${lock(id) ? `<circle cx="${cx}" cy="${cy}" r="22" fill="#FFF8EC" stroke="#8B5A3C" stroke-width="3"/><text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="22">🔒</text>` : ''}
    </g>`;
  }
  const p0 = (MAP.spots[o.at] || {}).door || MAP.player;
  svg += '<g id="steps"></g>';
  if (o.player) svg += `<image id="meOnMap" href="${o.player}" x="${p0[0] - 26}" y="${p0[1] - 64}" width="52" height="64" preserveAspectRatio="xMidYMax meet" class="me-on-map"/>`;
  // Biển tên nổi phía trên mỗi toà nhà (che luôn chữ vẽ sẵn nếu có)
  for (const [id, sp] of Object.entries(MAP.spots)) {
    const b = o.labels[id], l = lock(id), w = b.w || 150, [x, y] = sp.pin;
    svg += `<g class="pin ${l ? 'locked' : ''} ${o.next === id ? 'next' : ''}" data-act="mapGo" data-arg="${id}" transform="translate(${x} ${y})">
      <path d="M -8 26 L 0 37 L 8 26 Z" fill="${l ? '#B9B2AA' : '#8B5A3C'}"/>
      <rect x="${-w / 2}" y="-28" width="${w}" height="56" rx="12" fill="${l ? '#F1ECE6' : '#FFF8EC'}" stroke="${l ? '#B9B2AA' : '#8B5A3C'}" stroke-width="2.5"/>
      <text x="0" y="-9" text-anchor="middle" font-size="15" font-weight="800" fill="${l ? '#9A8F85' : '#5B3A26'}" font-family="Baloo 2, Microsoft YaHei, sans-serif">${l ? '🔒 ' : b.icon + ' '}${esc(b.zh)}</text>
      <text class="py" x="0" y="6" text-anchor="middle" font-size="9.5" font-weight="700" fill="#F0883A" font-family="Nunito, sans-serif">${esc(b.py)}</text>
      <text class="vi" x="0" y="19" text-anchor="middle" font-size="9.5" fill="#A07E63" font-family="Nunito, sans-serif">${esc(b.vi)}</text>
    </g>`;
  }
  const nx = MAP.spots[o.next];
  // mũi tên nằm bên trái biển tên, chỉ sang phải (tránh bị cắt ở mép trên tranh)
  if (nx) svg += `<g transform="translate(${nx.pin[0] - ((o.labels[o.next] || {}).w || 150) / 2 - 18} ${nx.pin[1]})"><g class="bob-x"><path d="M -14 -12 L -14 12 L 4 0 Z" fill="#F0883A" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></g></g>`;
  return `<div class="campus-img"><img src="${MAP.img}" alt="Bản đồ khu công ty 星辰电器" width="${MAP.w}" height="${MAP.h}">
    <svg viewBox="0 0 ${MAP.w} ${MAP.h}" xmlns="http://www.w3.org/2000/svg">${svg}</svg></div>`;
}

// Nhân vật đi bộ: từ cửa toà nhà đang đứng → ngã tư → cửa toà nhà đích. Nhún nhảy, quay mặt theo hướng đi, để lại dấu chân.
function walkTo(fromId, toId, done) {
  const img = document.getElementById('meOnMap'), steps = document.getElementById('steps');
  const to = MAP.spots[toId];
  if (!img || !to) return done();
  const start = (MAP.spots[fromId] || {}).door || MAP.player;
  if (fromId === toId) { setTimeout(done, 120); return; }
  const path = [start, MAP.center, to.door];
  const seg = path.slice(1).map((p, i) => { const q = path[i]; return { a: q, b: p, len: Math.hypot(p[0] - q[0], p[1] - q[1]) }; });
  const total = seg.reduce((t, x) => t + x.len, 0), speed = 150; // đơn vị bản đồ mỗi giây
  const t0 = performance.now(); let lastStep = 0, foot = 1;
  const frame = now => {
    const d = Math.min(total, (now - t0) / 1000 * speed);
    let rest = d, sg = seg[0];
    for (const x of seg) { sg = x; if (rest <= x.len) break; rest -= x.len; }
    const k = sg.len ? Math.min(1, rest / sg.len) : 1;
    const x = sg.a[0] + (sg.b[0] - sg.a[0]) * k, y = sg.a[1] + (sg.b[1] - sg.a[1]) * k;
    const hop = Math.abs(Math.sin(d / 7)) * 5;
    img.setAttribute('x', (x - 26).toFixed(1)); img.setAttribute('y', (y - 64 - hop).toFixed(1));
    img.setAttribute('transform', sg.b[0] < sg.a[0] ? `translate(${(2 * x).toFixed(1)} 0) scale(-1 1)` : '');
    if (d - lastStep > 13) {
      lastStep = d; foot = -foot;
      const nx = -(sg.b[1] - sg.a[1]) / (sg.len || 1), ny = (sg.b[0] - sg.a[0]) / (sg.len || 1);
      steps.insertAdjacentHTML('beforeend', `<ellipse class="step" cx="${(x + nx * 4 * foot).toFixed(1)}" cy="${(y + ny * 4 * foot).toFixed(1)}" rx="3.2" ry="2"/>`);
    }
    if (d < total) requestAnimationFrame(frame);
    else setTimeout(done, 280);
  };
  requestAnimationFrame(frame);
}

window.ART = { campus, campusImage, scene, walkTo };
})();
