// Thử màn 🛠 Kiểm tra nội dung: từ trình duyệt trống (chưa có tên, chưa chọn nhân vật) vào thẳng mọi nơi.
const puppeteer = require('puppeteer-core');
const OUT = 'D:/教学教材/hsk/HSK3.0/game/prototype/screenshots/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const check = (ok, msg) => { console.log((ok ? '✓ ' : '✗ ') + msg); if (!ok) process.exitCode = 1; };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 1200, height: 900 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setRequestInterception(true);
  p.on('request', q => (q.url().endsWith('/firebase-config.js') ? q.respond({ status: 200, contentType: 'text/javascript', body: 'window.FIREBASE_CONFIG = null;' }) : q.continue()));
  await p.goto('http://localhost:5173/prototype/'); await p.evaluate(() => localStorage.clear()); await p.reload(); await sleep(500);
  const at = () => p.evaluate(() => { const S = JSON.parse(localStorage.getItem('hanyu-office-v2') || '{}'); return { at: S.mission && S.mission.at, ch: S.mission && S.mission.ch, mode: S.mission && S.mission.mode, h1: (document.querySelector('#view h1') || {}).textContent }; });
  const tool = async () => { await p.click('#devBtn'); await sleep(300); };

  check(await p.$eval('#devBtn', e => !e.hidden), 'Nút 🛠 hiện ngay ở màn đăng nhập (chạy trên máy)');
  await tool();
  await p.screenshot({ path: OUT + '77-kiem-tra-noi-dung.png', fullPage: true });

  // Bật AI giả lập (trang tải lại), rồi vào thẳng chương 2 · cảnh đếm hàng
  await p.click('[data-act=rvToggle][data-arg=mock]'); await sleep(800);
  await tool();
  await p.select('#rv-factory-easy', 'goods'); await p.click('[data-act=rvJump][data-arg="factory:easy"]'); await sleep(400);
  let r = await at(); check(r.at === 'goods' && r.ch === 'factory', 'Nhảy thẳng tới cảnh đếm hàng của chương 2: ' + JSON.stringify(r));
  await p.screenshot({ path: OUT + '78-nhay-toi-canh.png' });

  // Chương 1 · chế độ Khó, không cần API Key (AI giả lập)
  await tool(); await p.click('[data-act=rvStart][data-arg="buy:hard"]'); await sleep(400);
  r = await at(); check(r.mode === 'hard' && !!r.at, 'Vào thẳng chế độ Khó của 采购部 không cần key: ' + JSON.stringify(r));

  // Chương 1 · Vừa, nhảy tới lượt đàm phán giá
  await tool(); await p.select('#rv-buy-mid', 'd1'); await p.click('[data-act=rvJump][data-arg="buy:mid"]'); await sleep(400);
  r = await at(); check(r.at === 'd1' && r.mode === 'mid', 'Nhảy tới cảnh d1 (gọi 郎经理) ở chế độ Vừa');
  await p.screenshot({ path: OUT + '79-nhay-che-do-vua.png' });

  // Bài 4 luyện tập cấp 3, và bài đánh giá
  await tool(); await p.$eval('[data-act=rvPractice][data-arg="follow:3"]', e => e.click()); await sleep(400);
  check(/第四课/.test((await at()).h1 || ''), 'Mở thẳng luyện tập cấp 3 của bài 4: ' + (await at()).h1);
  await tool(); await p.click('[data-act=rvGo][data-arg=test]'); await sleep(300);
  check(/测评|评估|Đánh giá/.test((await at()).h1 || '') || !!(await p.$('.q')), 'Mở thẳng bài đánh giá');
  // Bản đồ: mọi toà nhà mở
  await tool(); await p.click('[data-act=rvGo][data-arg=hub]'); await sleep(400);
  check((await p.$$('.spot.locked')).length === 0, 'Bản đồ không còn toà nhà bị khoá');
  console.log(errs.length ? 'LỖI: ' + errs.join(' | ') : 'Không có lỗi trang.');
  await b.close();
})().catch(e => { console.error('THẤT BẠI', e.message); process.exit(1); });
