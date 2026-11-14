// Cắt từng nhân vật từ ảnh lưới, bỏ nhãn chữ, tách nền trắng thành trong suốt.
// Chạy: node tools/crop-characters.js (từ thư mục game, cần `npm install sharp`)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'gamesource art') + '/';
const OUT = path.join(__dirname, '..', 'characters') + '/';
const G = 'Gemini_Generated_Image_';

// Mọi toạ độ đo trên ảnh thu về rộng 1024px; ảnh lớn hơn tự nhân theo tỉ lệ.
// Mỗi hàng: y = dải chứa hình (không gồm nhãn chữ), n = số nhân vật, dir = thư mục xuất, names = tên file.
// Ranh giới giữa các nhân vật trong hàng được dò tự động (cột ít nét vẽ nhất gần vị trí chia đều).
// erase = các ô chữ nhật cần xoá trắng trước khi cắt (tiêu đề, chữ thoại).
const BASE_W = 1024;
const EXPR6 = ['hoan-thanh', 'kinh-ngac', 'nghi-ngo', 'de-biu', 'lem-linh', 'gian-du'];
const EXPR6V = ['vui-ve', 'hoan-thanh', 'hoang-hot', 'kinh-ngac', 'nghi-ngo', 'de-biu'];
const EXPR8 = [...EXPR6V, 'kho-chiu', 'kho-hieu'];
const EXPR_SAD = ['vui-ve', 'hoan-thanh', 'hoang-hot', 'kinh-ngac', 'nghi-ngo', 'kho-chiu', 'so-hai', 'buon-ba'];
const jobs = [
  { file: G + 'yucd0ayucd0ayucd.png', x: [50, 1024], rows: [
    { y: [68, 361], n: 3, dir: 'tho-bieu-cam', names: ['vui-ve', 'hoan-thanh', 'hoang-hot'] },
    { y: [398, 665], n: 3, dir: 'tho-bieu-cam', names: ['kinh-ngac', 'nghi-ngo', 'de-biu'] } ] },
  { file: G + 'icshubicshubicsh.png', rows: [
    { y: [20, 250], n: 4, dir: 'nhom-12-con-giap', names: ['chuot', 'trau', 'ho', 'meo'] },
    { y: [287, 496], n: 4, dir: 'nhom-12-con-giap', names: ['rong', 'ran', 'ngua', 'de'] },
    { y: [528, 723], n: 4, dir: 'nhom-12-con-giap', names: ['khi', 'ga', 'cho', 'lon'] } ] },
  { file: G + 'shd2hmshd2hmshd2.png', rows: [
    { y: [20, 252], n: 4, dir: 'nhom-2', names: ['khung-long', 'ran-ho-mang', 'ret', 'ca-sau'] },
    { y: [298, 497], n: 4, dir: 'nhom-2', names: ['nhim', 'qua', 'qua-2', 'nhim-2'] },
    { y: [528, 727], n: 4, dir: 'nhom-2', names: ['cao', 'soi', 'bao', 'chon'] } ] },

  // ---- Bảng biểu cảm ----
  { file: G + '1qs4p51qs4p51qs4.png', rows: [
    { y: [21, 183], n: 7, dir: 'bieu-cam/cao', names: [...EXPR6V, 'gian-xao'] },
    { y: [225, 369], n: 7, dir: 'bieu-cam/ran', names: [...EXPR6V, 'muu-meo'] },
    { y: [407, 540], n: 7, dir: 'bieu-cam/chon', names: [...EXPR6V, 'lem-linh'] } ] },
  { file: G + 'nthj29nthj29nthj.png', rows: [
    { y: [22, 255], n: 4, dir: 'bieu-cam/chuot', names: ['vui-ve', 'hoan-thanh', 'hoang-hot', 'kinh-ngac'] },
    { y: [290, 494], n: 4, dir: 'bieu-cam/chuot', names: ['ghi-chep', 'suy-nghi', 'kho-chiu', 'nhay-mat'] },
    { y: [519, 722], n: 4, dir: 'bieu-cam/chuot', names: ['binh-thuong', 'nghi-ngo', 'de-biu', 'lem-linh'] } ] },
  { file: G + 'okjje8okjje8okjj.png',
    erase: [[8, 6, 105, 50], [8, 528, 80, 576], [700, 108, 785, 168], [935, 108, 1024, 192]],
    rows: [
    { y: [17, 249], n: 4, dir: 'bieu-cam/trau', names: ['gian-du', 'hoan-thanh', 'nghi-ngo', 'de-biu'] },
    { y: [299, 496], n: 4, dirs: ['bieu-cam/trau', 'bieu-cam/trau', 'bieu-cam/ho', 'bieu-cam/ho'], names: ['ap-luc', 'duyet', 'hoang-hot', 'kinh-ngac'] },
    { y: [542, 724], n: 4, dir: 'bieu-cam/ho', names: ['vui-ve', 'hoang-hot-2', 'kinh-ngac-2', 'gian-du'] } ] },
  { file: G + 'cmgowxcmgowxcmgo.png', rows: [
    { y: [29, 217], n: 6, dir: 'bieu-cam/soi', names: EXPR6 },
    { y: [319, 510], n: 6, dir: 'bieu-cam/qua', names: EXPR6 } ] },
  { file: G + 'dldrdhdldrdhdldr.png', rows: [
    { y: [40, 238], n: 6, dir: 'bieu-cam/khung-long', names: EXPR6 },
    { y: [323, 527], n: 6, dir: 'bieu-cam/ca-sau', names: EXPR6 } ] },
  { file: G + 'dnhru4dnhru4dnhr.png', rows: [
    { y: [49, 323], n: 4, dir: 'bieu-cam/ran-ho-mang', names: ['vui-ve', 'hoan-thanh', 'hoang-hot', 'kinh-ngac'] },
    { y: [393, 692], n: 4, dir: 'bieu-cam/ran-ho-mang', names: ['nghi-ngo', 'de-biu', 'muu-meo', 'gian-du'] } ] },
  { file: G + 'f2ipjdf2ipjdf2ip.png', erase: [[5, 270, 76, 312], [5, 466, 76, 508]], rows: [
    { y: [20, 174], n: 6, dir: 'bieu-cam/ret', names: EXPR6 },
    { y: [209, 360], n: 6, dir: 'bieu-cam/nhim', names: EXPR6 },
    { y: [396, 544], n: 6, dir: 'bieu-cam/bao', names: EXPR6 } ] },
  { file: G + 'ha0r3lha0r3lha0r.png', rows: [
    { y: [26, 163], n: 8, cuts: [186, 336, 476, 591, 684, 783, 893], dir: 'bieu-cam/ga', names: EXPR8 },
    { y: [227, 371], n: 8, dir: 'bieu-cam/cho', names: EXPR8 },
    { y: [416, 544], n: 8, dir: 'bieu-cam/meo', names: EXPR8 } ] },
  { file: G + 'i8hkc7i8hkc7i8hk.png', rows: [
    { y: [31, 200], n: 8, cuts: [152, 296, 414, 535, 650, 762, 878], exact: true, steps: { 2: [112, 314] }, dir: 'bieu-cam/de', names: EXPR_SAD },
    { y: [369, 539], n: 8, dir: 'bieu-cam/ngua', names: EXPR_SAD } ] },
];

const WHITE = 232;
const only = process.argv[2]; // tuỳ chọn: chỉ chạy file có tên chứa chuỗi này

(async () => {
  for (const job of jobs) {
    if (only && !job.file.includes(only)) continue;
    if (!fs.existsSync(SRC + job.file)) { console.log('Bỏ qua (không thấy file):', job.file); continue; }
    const { data, info } = await sharp(SRC + job.file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const S = W / BASE_W;
    const sc = v => Math.round(v * S);
    const px = (x, y) => (y * W + x) * 4;
    for (const [ex0, ey0, ex1, ey1] of job.erase || []) {
      for (let y = sc(ey0); y < Math.min(H, sc(ey1)); y++) data.fill(255, px(sc(ex0), y), px(Math.min(W, sc(ex1)), y));
    }
    const ink = (x, y) => { const i = px(x, y); return Math.min(data[i], data[i + 1], data[i + 2]) < WHITE; };
    const ax0 = sc((job.x || [0, BASE_W])[0]), ax1 = Math.min(W, sc((job.x || [0, BASE_W])[1]));
    console.log(job.file);

    for (const row of job.rows) {
      const sy0 = sc(row.y[0]), sy1 = Math.min(H - 1, sc(row.y[1]));
      // Dò ranh giới cột: quanh mỗi vị trí chia đều, lấy cột ít nét vẽ nhất
      const colInk = new Int32Array(W);
      for (let x = ax0; x < ax1; x++) { let n = 0; for (let y = sy0; y <= sy1; y++) if (ink(x, y)) n++; colInk[x] = n; }
      const cellW = (ax1 - ax0) / row.n, win = Math.round(cellW * 0.3);
      const edges = [ax0];
      for (let k = 1; k < row.n; k++) {
        // row.cuts = vị trí cắt khai báo tay (khi các hình không cách đều), chỉ dò lại trong phạm vi hẹp
        const guess = row.cuts ? sc(row.cuts[k - 1]) : Math.round(ax0 + k * cellW);
        const w2 = row.exact ? 0 : row.cuts ? sc(10) : win; // exact: cắt đúng vị trí khai báo
        let best = guess, bestScore = Infinity;
        for (let x = guess - w2; x <= guess + w2; x++) {
          // tổng mực trong cửa sổ nhỏ quanh x, ưu tiên gần vị trí dự đoán khi hoà
          let t = 0; for (let d = -2; d <= 2; d++) t += colInk[x + d];
          const score = t * 1000 + Math.abs(x - guess);
          if (score < bestScore) { bestScore = score; best = x; }
        }
        // row.steps[k] = [yGãy, xDưới]: đường cắt thứ k gãy khúc, phía dưới yGãy thì cắt ở xDưới (khi đồ vật của hai hình chồng lên nhau)
        const st = row.steps && row.steps[k];
        edges.push(st ? { x: best, y: sc(st[0]), xb: sc(st[1]) } : best);
      }
      edges.push(ax1);
      const ex = (e, y) => (typeof e === 'number' ? e : y < e.y ? e.x : e.xb);
      const emin = e => (typeof e === 'number' ? e : Math.min(e.x, e.xb));
      const emax = e => (typeof e === 'number' ? e : Math.max(e.x, e.xb));

      for (let c = 0; c < row.n; c++) {
        const L = edges[c], R = edges[c + 1];
        const cx0 = emin(L), cx1 = emax(R);
        const inside = (x, y) => x >= ex(L, y) && x < ex(R, y);
        let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
        for (let y = sy0; y <= sy1; y++) for (let x = cx0; x < cx1; x++) if (inside(x, y) && ink(x, y)) {
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        if (x1 < 0) { console.log('   (ô trống)', row.names[c]); continue; }
        const pad = sc(6);
        x0 = Math.max(cx0, x0 - pad); y0 = Math.max(sy0, y0 - pad);
        x1 = Math.min(cx1 - 1, x1 + pad); y1 = Math.min(sy1, y1 + pad);
        const w = x1 - x0 + 1, h = y1 - y0 + 1;
        const buf = Buffer.alloc(w * h * 4);
        for (let y = 0; y < h; y++) data.copy(buf, y * w * 4, px(x0, y0 + y), px(x0, y0 + y) + w * 4);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!inside(x0 + x, y0 + y)) buf.fill(255, (y * w + x) * 4, (y * w + x) * 4 + 3);

        // Loang từ mép vào: pixel trắng nối với mép = nền -> trong suốt (giữ trắng bên trong như mắt, áo sơ mi)
        const bg = new Uint8Array(w * h);
        const light = i => Math.min(buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]) >= WHITE;
        const stack = [];
        for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
        for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
        while (stack.length) {
          const i = stack.pop();
          if (bg[i] || !light(i)) continue;
          bg[i] = 1;
          const x = i % w, y = (i / w) | 0;
          if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1);
          if (y > 0) stack.push(i - w); if (y < h - 1) stack.push(i + w);
        }
        for (let i = 0; i < w * h; i++) {
          if (bg[i]) { buf[i * 4 + 3] = 0; continue; }
          // Làm mềm viền răng cưa: pixel sáng sát nền thì giảm độ đục
          const x = i % w, y = (i / w) | 0;
          const nearBg = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
          if (nearBg) {
            const m = Math.min(buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]);
            buf[i * 4 + 3] = Math.max(0, Math.min(255, (255 - m) * 3));
          }
        }

        // Bỏ mẩu chữ nhãn / vụn sót ở mép: cụm nhỏ chạm mép khung cắt
        const comp = new Int32Array(w * h).fill(-1);
        const comps = [];
        for (let s = 0; s < w * h; s++) {
          if (comp[s] >= 0 || buf[s * 4 + 3] === 0) continue;
          let minx = w, miny = h, maxx = 0, maxy = 0, area = 0;
          const st = [s], members = [];
          comp[s] = comps.length;
          while (st.length) {
            const i = st.pop(); members.push(i); area++;
            const x = i % w, y = (i / w) | 0;
            if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
            for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
              if (j >= 0 && comp[j] < 0 && buf[j * 4 + 3] > 0) { comp[j] = comps.length; st.push(j); }
            }
          }
          const edge = sc(12);
          // Chạm mép dưới: có thể là mẩu chữ nhãn (nhãn luôn nằm dưới hình; mép trên để yên vì hay có dấu "?")
          const touchesTB = maxy > h - 1 - edge;
          // Bị đường ranh cột cắt ngang: mảnh của nhân vật bên cạnh
          const cutByGrid = (x0 === cx0 && minx === 0) || (x1 === cx1 - 1 && maxx === w - 1);
          comps.push({ touchesTB, cutByGrid, hgt: maxy - miny, area, members });
        }
        const total = comps.reduce((a, c) => a + c.area, 0);
        for (const c of comps) {
          if ((c.touchesTB && c.hgt < sc(24)) || (c.cutByGrid && c.area < 0.05 * total)) for (const i of c.members) buf[i * 4 + 3] = 0;
        }
        // Thu khung về vừa phần còn lại
        let tx0 = w, ty0 = h, tx1 = -1, ty1 = -1;
        for (let i = 0; i < w * h; i++) if (buf[i * 4 + 3] > 0) {
          const x = i % w, y = (i / w) | 0;
          if (x < tx0) tx0 = x; if (x > tx1) tx1 = x; if (y < ty0) ty0 = y; if (y > ty1) ty1 = y;
        }
        tx0 = Math.max(0, tx0 - sc(4)); ty0 = Math.max(0, ty0 - sc(4)); tx1 = Math.min(w - 1, tx1 + sc(4)); ty1 = Math.min(h - 1, ty1 + sc(4));

        const dir = OUT + (row.dirs ? row.dirs[c] : row.dir);
        fs.mkdirSync(dir, { recursive: true });
        await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
          .extract({ left: tx0, top: ty0, width: tx1 - tx0 + 1, height: ty1 - ty0 + 1 })
          .png().toFile(path.join(dir, row.names[c] + '.png'));
        console.log('  ', (row.dirs ? row.dirs[c] : row.dir) + '/' + row.names[c] + '.png', (tx1 - tx0 + 1) + 'x' + (ty1 - ty0 + 1));
      }
    }
  }
})();
