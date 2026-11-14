// Chơi tự động qua nhiều nhánh của nhiệm vụ, kiểm tra kết quả và chụp ảnh vào prototype/screenshots/.
// Cần: máy chủ đang chạy (node tools/serve.js) và `npm install puppeteer-core`.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'prototype', 'screenshots') + path.sep;
const URL = 'http://localhost:5173/prototype/';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const KEY = 'hanyu-office-v2';
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
  const p = await b.newPage(); await p.evaluateOnNewDocument(() => localStorage.setItem('hanyu-office-review', '{"on":false,"mock":false}')); // tắt chế độ kiểm tra để thử đúng luật mở khoá
  const errors = [];
  p.on('pageerror', e => { errors.push(e.message); console.log('LỖI TRANG:', e.message); });
  p.on('console', m => { if (m.type() === 'error') { errors.push(m.text()); console.log('LỖI CONSOLE:', m.text()); } });
  await p.setViewport({ width: 1200, height: 900 });
  // cuộn phần tử vào giữa màn hình trước khi bấm, để không bị thanh hướng dẫn cố định ở đáy che
  const click = async sel => { await p.$eval(sel, el => el.scrollIntoView({ block: 'center' })).catch(() => {}); await p.click(sel); await sleep(180); };
  const shot = async name => { await sleep(300); await p.screenshot({ path: OUT + name + '.png' }); };
  const nxt = () => click('[data-act=next]');
  const choose = async k => { await click(`[data-act=choose][data-arg="${k}"]`); await click('[data-act=askNext]'); };
  const menu = k => click(`[data-act=menuGo][data-arg="${k}"]`);
  const state = () => p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  const at = async () => (await state()).mission.at;
  const expectAt = async id => { const a = await at(); if (a !== id) throw new Error(`Đang ở nút "${a}", lẽ ra phải là "${id}" · ${JSON.stringify((await state()).mission.s)} · ${JSON.stringify((await state()).mission.log.map(l => l.grade))}`); };
  // Ghép ô chữ theo đúng đáp án
  const buildAll = async () => {
    for (let i = 0; i < 2; i++) {
      const order = await p.evaluate(i => { const it = CONTENT.mission.nodes.build.items[i]; return it.tiles.map(t => t.zh).sort((a, b) => it.answer.indexOf(a) - it.answer.indexOf(b)); }, i);
      for (const zh of order) { await p.evaluate(zh => [...document.querySelectorAll('#pool .tile:not(.used)')].find(x => x.querySelector('.hz').textContent === zh).click(), zh); await sleep(60); }
      await click('#chk'); await click('#nx');
    }
  };
  // Viết email trên máy tính: mở 邮箱 → 写邮件 → chọn người nhận → (Dễ) chọn tiêu đề, điền số / (Vừa, Khó) tự gõ → 发送
  let pcShots = false;
  const fillEmail = async () => {
    const info = await p.evaluate(k => { const S = JSON.parse(localStorage.getItem(k)), s = S.mission.s, n = CONTENT.missions[S.mission.mode].nodes[S.mission.at];
      return { mode: S.mission.mode, to: n.contacts.findIndex(c => c.name === n.to), subj: n.subjectAnswer || 0,
        v: { qty: s.qty || 5, price: s.price, days: s.days, deposit: s.deposit, rest: 100 - s.deposit, p1: 2, p2: 20 } }; }, KEY);
    if (!pcShots) await shot('50-may-tinh');
    await click('[data-act=pcOpen][data-arg=mail]'); if (!pcShots) await shot('51-hop-thu');
    await click('[data-act=pcCompose]'); await click('[data-act=pcPick][data-arg=to]'); if (!pcShots) await shot('52-chon-nguoi-nhan');
    await click(`[data-act=pcSet][data-arg="to:${info.to}"]`);
    if (info.mode === 'easy') {
      await click('[data-act=pcPick][data-arg=subj]'); await click(`[data-act=pcSet][data-arg="subj:${info.subj}"]`);
      await click('[data-act=pcBody]');
      await p.evaluate(v => document.querySelectorAll('.email input').forEach(i => i.value = v[i.dataset.k]), info.v);
      if (!pcShots) await shot('53-viet-noi-dung');
    } else {
      await p.type('#mSubj', '订单确认');
      await p.type('#mBody', `吴经理您好：确认订购温控器${info.v.qty}个，单价${info.v.price}元，${info.v.days}天之内到货。谢谢！`);
      await shot('54-email-che-do-vua');
    }
    pcShots = true;
    await click('[data-act=pcSend]'); await sleep(1400);
  };
  const startMission = async () => { await p.goto(URL + '?dev&mockai'); await sleep(400); await click('[data-act=startMission]'); };
  const toHub = async () => { for (let i = 0; i < 5; i++) await nxt(); await nxt(); await nxt(); await buildAll(); await expectAt('hub'); };
  const summary = async label => { const S = await state(), s = S.mission.s; console.log(label, { stars: await p.$eval('.stars', e => (e.textContent.match(/★/g) || []).length), score: S.mission.score, price: s.price, days: s.days, deposit: s.deposit, points: S.points }); };

  // ---------- Đăng nhập, chọn nhân vật, bài học ----------
  await p.goto(URL + '?mockai');
  await p.evaluate(() => localStorage.clear()); await p.reload(); await sleep(600);
  await shot('01-dang-nhap');
  await p.type('#name', 'Lan'); await click('[data-act=login]');
  await shot('02a-nhap-api-key');
  await p.type('#key', 'AIzaMockKeyForTesting1234567890'); await click('[data-act=saveKey]'); await sleep(1300);
  await click('[data-act=pickP][data-arg=ga]'); await click('[data-act=pickM][data-arg=tho]');
  await shot('02-chon-nhan-vat');
  await click('[data-act=pickDone]'); await shot('03-trung-tam');
  await click('[data-arg="lesson:grammar"]'); await click('[data-act=practice][data-arg="grammar:1"]'); await shot('04-bai-tap-co-pinyin');
  await p.click('#optPy'); await shot('05-tat-pinyin'); await p.click('#optPy');
  await p.goto(URL + '?dev&mockai'); await sleep(300); await click('[data-act=go][data-arg=test]');
  for (let i = 0; i < 11; i++) { await click('.opt'); await click('#next'); }
  await shot('06-bai-danh-gia-sap-xep');

  // ---------- Nhánh 1: hỏi đủ 3 nhà, dùng đòn bẩy, mọi thứ suôn sẻ ----------
  await startMission(); await shot('07-giao-viec');
  for (let i = 0; i < 5; i++) await nxt();
  await shot('08-the-nhiem-vu'); await nxt();
  await shot('09-bao-gia'); await nxt();
  await shot('10-soan-cau'); await buildAll();
  await shot('11-bang-chon-viec');
  await menu(2); await shot('12-goi-C'); await choose(0); await nxt(); await expectAt('hub');
  await menu(0); await choose(0); await shot('13-doc-bao-cao-kiem-dinh');
  await click('[data-act=readPick][data-arg="1"]'); await nxt(); await shot('14-chat-van-A'); await choose(0); await nxt(); await expectAt('hub');
  await menu(1); await choose(0); await choose(0); await choose(0);
  await shot('15-don-bay-voi-B'); await choose(1); await choose(1); await choose(0); await expectAt('hub');
  await shot('16-da-goi-ca-ba'); await menu(3); await shot('17-bao-cao-sep');
  await choose(0); await expectAt('r_ok'); await nxt(); await shot('18-tinh-huong-phat-sinh'); await nxt();
  await shot('19-xu-ly-phat-sinh'); await choose(0); await shot('20-email'); await fillEmail(); await shot('21-ket-qua-3-sao');
  await summary('Nhánh 1 (tốt nhất):');

  // ---------- Nhánh 2: chỉ gọi B, nhận hết điều kiện xấu, nhờ sếp ra mặt ----------
  await startMission(); await toHub();
  await menu(1); await choose(1); await choose(1); await choose(2); await choose(2); await choose(2); await expectAt('hub');
  await menu(3); await choose(1); await expectAt('r_gap'); await shot('22-sep-chua-hai-long');
  await choose(2); await expectAt('r_gap'); await choose(3); await expectAt('r_gap');
  await choose(1); await shot('23-sep-ra-mat'); await nxt(); await shot('24-cao-nhuong-bo'); await nxt(); await nxt(); await nxt();
  await choose(1); await fillEmail(); await shot('25-ket-qua-nho-sep');
  await summary('Nhánh 2 (nhờ sếp, trả phí gấp):');

  // ---------- Nhánh 3: nói dối, gắt gỏng, đàm phán lại, xin duyệt đặc biệt ----------
  await startMission(); await toHub();
  await menu(1); await choose(0); await choose(2); await choose(3); await shot('26-bi-phat-hien-noi-doi');
  await choose(3); await choose(3); await choose(1); await expectAt('hub');
  await menu(3); await choose(0); await expectAt('r_gap'); await choose(0); await expectAt('b_retry'); await nxt();
  await expectAt('b_price_r'); await shot('27-dam-phan-lai'); await choose(0); await expectAt('b_delivery'); await choose(0);
  await expectAt('b_payment'); await choose(0); await expectAt('b_close_r'); await nxt(); await expectAt('r1');
  await choose(0); await expectAt('r_gap'); await choose(4); await nxt(); await choose(0); await shot('28-email-giao-theo-dot'); await fillEmail();
  await summary('Nhánh 3 (nói dối, đàm phán lại):');

  // ---------- Chế độ Vừa và Khó (bộ chấm giả lập ?mockai: câu giống lựa chọn nào nhất thì được xếp vào lựa chọn đó) ----------
  const typeAnswer = text => p.$eval('#ans', (el, t) => { el.value = t; el.dispatchEvent(new Event('input')); }, text);
  const midTurn = async () => {
    const zh = await p.evaluate(k => { const S = JSON.parse(localStorage.getItem(k)); const n = CONTENT.missions[S.mission.mode].nodes[S.mission.at];
      const c = n.choices.find(c => c.grade === 'good' && !c.show) || n.choices.find(c => c.grade === 'good'); return c.zh.replace(/\{\w+\}/g, ''); }, KEY);
    await typeAnswer(zh); await click('[data-act=submitAnswer]'); await sleep(400);
  };
  const turn = async () => { await midTurn(); await click('[data-act=askNext]'); };
  // Vừa: mua bộ điều chỉnh nhiệt
  await p.goto(URL + '?dev&mockai'); await sleep(400);
  await click('[data-act=startMission][data-arg=mid]'); await shot('31-vua-giao-viec');
  for (let i = 0; i < 5; i++) await nxt();
  await expectAt('sample'); await shot('32-vua-doc-bao-cao-thu-mau');
  await click('[data-act=readPick][data-arg="1"]'); await nxt(); await expectAt('quotes'); await nxt(); await expectAt('hub');
  await menu(0);
  await typeAnswer('Xin chào anh'); await click('[data-act=submitAnswer]'); await sleep(400); await shot('33-vua-khong-phai-tieng-trung');
  await click('[data-act=midHint]'); await shot('34-vua-goi-y');
  await midTurn(); await shot('35-vua-ai-cham'); await click('[data-act=askNext]');
  await turn(); await turn(); await expectAt('hub');
  await menu(1); await turn(); await turn(); await turn(); await turn(); await expectAt('hub');
  await menu(2); await turn(); await expectAt('r_ok'); await nxt(); await nxt(); await expectAt('storm'); await shot('36-vua-bao');
  await turn(); await expectAt('email'); await fillEmail(); await shot('37-vua-ket-qua');
  await summary('Chế độ Vừa (AI giả lập):');
  // Khó: khủng hoảng nhà cung cấp
  await p.goto(URL + '?dev&mockai'); await sleep(400);
  await click('[data-act=startMission][data-arg=hard]');
  for (let i = 0; i < 4; i++) await nxt();
  await shot('38-kho-the-nhiem-vu'); await nxt(); await expectAt('hub');
  await menu(0); await shot('39-kho-xuong-san-xuat'); await turn();
  await menu(1); await turn(); await turn(); await nxt(); await expectAt('hub');
  await menu(2); await shot('40-kho-phong-bi'); await turn();
  await menu(3); await turn(); await expectAt('hub');
  await menu(4); await turn(); await nxt(); await expectAt('result'); await shot('41-kho-ket-qua');
  await summary('Chế độ Khó (AI giả lập):');

  // ---------- Luyện tập 3 cấp, tra từ, sổ từ, sổ lỗi sai, đi bộ trên bản đồ ----------
  await p.goto(URL + '?dev&mockai'); await sleep(400);
  await click('[data-arg="lesson:vocab"]'); await shot('42-bai-hoc-3-cap');
  await p.evaluate(() => document.querySelector('.ex .w').click()); await sleep(300); await shot('43-tra-tu');
  await click('.wp-add'); await click('.wp-x');
  await click('[data-act=practice][data-arg="vocab:2"]');
  for (let i = 0; i < 9 && await p.$('.opt'); i++) {
    if (i === 0) await shot('44-luyen-tap-trung-binh');
    const timed = await p.$('.timer');
    if (timed) { await sleep(8600); await shot('45-phan-xa-het-gio'); } else await click('.opt:last-child');
    await click('#next');
  }
  await click('[data-act=practice][data-arg="vocab:3"]').catch(() => {});
  await p.goto(URL + '?dev&mockai'); await sleep(400); await click('[data-arg="lesson:vocab"]'); await click('[data-act=practice][data-arg="vocab:3"]');
  for (let i = 0; i < 8; i++) {
    if (await p.$('#tans')) { await p.type('#tans', '我不知道'); if (i < 3) await shot('46-nang-cao-tu-go'); await click('#tchk'); await sleep(300); }
    else if (await p.$('.opt')) await click('.opt');
    if (!(await p.$('#next'))) break;
    await click('#next');
  }
  await click('#nbBtn'); await shot('47-so-tu');
  await click('#mkBtn'); await shot('48-so-loi-sai');
  await p.goto(URL + '?dev&mockai'); await sleep(500);
  await p.evaluate(() => { document.querySelector('.campus-img').scrollIntoView(); });
  await p.evaluate(() => document.querySelector('.spot[data-arg=factory]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(900); await shot('49-di-bo-tren-ban-do'); await sleep(1500);

  // ---------- Người chơi là trâu thì sếp là hổ; xem trên điện thoại ----------
  await p.goto(URL + '?dev&mockai'); await sleep(300); await click('[data-arg=pick]');
  await click('[data-act=pickP][data-arg=trau]'); await click('[data-act=pickM][data-arg=cho]'); await click('[data-act=pickDone]');
  await click('[data-act=startMission]'); await shot('29-nguoi-choi-trau-sep-ho');
  await p.setViewport({ width: 390, height: 844 }); await p.reload(); await sleep(500); await click('[data-act=go][data-arg=mission]');
  await toHub(); await menu(1); await shot('30-dien-thoai');
  console.log(errors.length ? `CÓ ${errors.length} LỖI` : 'Không có lỗi trang nào.');
  await b.close();
})().catch(e => { console.error('THẤT BẠI:', e.message); process.exit(1); });
