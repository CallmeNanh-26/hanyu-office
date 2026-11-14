// Chơi tự động chương 2 (工厂): nhánh tốt nhất (3 sao) và nhánh nhiều lỗi, chụp ảnh các màn chính.
// Chạy: node tools/serve.js (cửa sổ khác), rồi node tools/factory-test.js
const puppeteer = require('puppeteer-core');
const OUT = 'D:/教学教材/hsk/HSK3.0/game/prototype/screenshots/';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new' });
  const p = await b.newPage(); await p.evaluateOnNewDocument(() => localStorage.setItem('hanyu-office-review', '{"on":false,"mock":false}')); // tắt chế độ kiểm tra để thử đúng luật mở khoá await p.setViewport({ width: 1200, height: 900 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  // không đăng nhập Firebase trong lúc thử
  await p.setRequestInterception(true);
  p.on('request', q => (q.url().endsWith('/firebase-config.js') ? q.respond({ status: 200, contentType: 'text/javascript', body: 'window.FIREBASE_CONFIG = null;' }) : q.continue()));
  const base = { name: 'Lan', player: 'ga', mentor: 'tho', ai: { key: 'x', models: ['mock'], model: 'mock' }, points: 300, lastDaily: new Date().toLocaleDateString('sv'), earned: { mission: true }, opts: { py: true, vi: true },
    lessons: { vocab: true, grammar: true, process: true }, test: { score: 10, passed: true }, best: 2, mapAt: 'mission' };
  const tap = sel => p.$eval(sel, e => e.click()); // bấm qua DOM: không bị thanh hướng dẫn che
  const setS = async extra => { await p.evaluate(s => localStorage.setItem('hanyu-office-v2', JSON.stringify(s)), Object.assign({}, base, extra)); await p.reload(); await sleep(500); };
  await p.goto('http://localhost:5173/prototype/'); await sleep(300);

  // 1. Chưa học bài 4: màn 工厂 nhắc học bài 4
  await setS({});
  await p.screenshot({ path: OUT + '64-ban-do-chuong-2.png' });
  await p.evaluate(() => document.querySelector('[data-act=mapGo][data-arg=factory]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await sleep(2500);
  const locked = await p.evaluate(() => !!document.querySelector('[data-arg="lesson:follow"]') && !document.querySelector('[data-arg="factory:easy"]'));
  console.log(locked ? '✓ Chưa học bài 4: phải học trước' : '✗ Màn 工厂 không yêu cầu bài 4');
  await p.screenshot({ path: OUT + '65-cong-xuong-khoa.png' });

  // Chơi một lượt. pick(kind) chọn lựa chọn theo chiến lược
  async function play(strategy, shots) {
    await setS({ lessons: { ...base.lessons, follow: true } });
    await p.evaluate(() => { location.hash = ''; });
    await p.evaluate(() => document.querySelector('[data-act=mapGo][data-arg=factory]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await sleep(2500);
    await tap('[data-arg="factory:easy"]'); await sleep(300);
    const seen = new Set();
    for (let step = 0; step < 250; step++) {
      const st = await p.evaluate(() => { const m = JSON.parse(localStorage.getItem('hanyu-office-v2')).mission; return { at: m.at, phase: m.phase, chkOk: m.chkOk, chk: m.chk, qOk: m.qOk }; });
      if (st.at === 'result') break;
      const n = await p.evaluate(at => { const n = window.CONTENT.factory.easy.nodes[at]; return { type: n.type, bad: (n.items || []).map(i => !!i.bad), answer: n.answer, choices: (n.choices || []).map(c => c.grade) }; }, st.at);
      if (shots[st.at] && !seen.has(st.at)) { seen.add(st.at); await p.screenshot({ path: OUT + shots[st.at] }); }
      if (n.type === 'say' || n.type === 'card') await tap('[data-act=next]');
      else if (n.type === 'menu') await tap('[data-act=menuGo]');
      else if (n.type === 'read') { await tap(`[data-act=readPick][data-arg="${n.answer}"]`); await sleep(150); await tap('#qfb [data-act=next]'); }
      else if (n.type === 'check') {
        if (!st.chkOk && st.chk < 2) {
          const flags = strategy === 'good' ? n.bad : n.bad.map(() => false); // nhánh xấu: không đánh dấu gì → sai 2 lần
          for (let k = 0; k < flags.length; k++) if (flags[k]) { await tap(`[data-act=chkFlag][data-arg="${k}"]`); await sleep(80); }
          await tap('[data-act=chkSubmit]'); await sleep(200);
          if (strategy !== 'good') { await tap('[data-act=chkSubmit]'); await sleep(200); }
          if (shots[st.at + ':done']) await p.screenshot({ path: OUT + shots[st.at + ':done'] });
        } else if (n.answer !== undefined && !st.qOk) { await tap(`[data-act=chkPick][data-arg="${n.answer}"]`); await sleep(200); }
        else await tap('[data-act=chkNext]');
      } else if (n.type === 'ask') {
        if (st.phase === 'reply') { await tap('[data-act=askNext]'); }
        else {
          const want = strategy === 'good' ? 'good' : 'bad';
          const args = await p.$$eval('[data-act=choose]', bs => bs.map(x => +x.dataset.arg));
          const k = args.find(a => n.choices[a] === want) ?? args.find(a => n.choices[a] === 'ok') ?? args[0];
          await tap(`[data-act=choose][data-arg="${k}"]`); await sleep(150);
          if (shots[st.at + ':reply'] && !seen.has(st.at + ':reply')) { seen.add(st.at + ':reply'); await p.screenshot({ path: OUT + shots[st.at + ':reply'] }); }
        }
      }
      await sleep(180);
    }
    await sleep(300);
    const r = await p.evaluate(() => { const S = JSON.parse(localStorage.getItem('hanyu-office-v2')); return { at: S.mission.at, fBest: S.fBest, score: S.mission.score, stars: document.querySelector('.stars') && document.querySelector('.stars').textContent }; });
    return r;
  }
  const good = await play('good', { f1: '66-chuong2-giao-viec.png', c2: '67-chuong2-hoi-hang.png', track: '68-chuong2-van-don.png', w2: '69-chuong2-kho.png', 'docs:done': '70-chuong2-giay-to.png', goods: '71-chuong2-dem-hang.png', 'goods:done': '72-chuong2-hang-hong.png', w4: '73-chuong2-tai-xe.png' });
  await p.screenshot({ path: OUT + '74-chuong2-ket-qua.png' });
  console.log((good.at === 'result' && good.fBest === 3 ? '✓' : '✗') + ' Nhánh tốt: ' + JSON.stringify(good));
  const bad = await play('bad', {});
  console.log((bad.at === 'result' && bad.score < 70 ? '✓' : '✗') + ' Nhánh nhiều lỗi về tới kết quả: ' + JSON.stringify(bad));
  await p.screenshot({ path: OUT + '75-chuong2-ket-qua-kem.png' });
  // về bản đồ: biển 工厂 có sao, không còn mũi tên
  await tap('[data-act=home]'); await sleep(500);
  await p.screenshot({ path: OUT + '76-ban-do-xong-chuong-2.png' });
  console.log(errs.length ? 'LỖI: ' + errs.join(' | ') : 'Không có lỗi trang.');
  await b.close();
})().catch(e => { console.error('THẤT BẠI', e.message); process.exit(1); });
