// Bản chạy thử: Chọn nhân vật → Đào tạo → Đánh giá → Nhiệm vụ thu mua (chế độ Dễ).
// Nội dung nằm trong content.js và content-mission.js; file này chỉ lo luồng chơi và hiển thị.
(() => {
const C = window.CONTENT;
// M = kịch bản của chế độ đang chơi (Dễ / Vừa / Khó), đổi khi bắt đầu hoặc tiếp tục nhiệm vụ
let M = C.mission;
const MODES = { easy: 'Dễ', mid: 'Vừa', hard: 'Khó' };
// Mỗi chương có bộ kịch bản riêng: 'buy' = 采购部 (C.missions), 'factory' = 工厂 (C.factory)
const missionSet = ch => (ch === 'factory' ? C.factory : C.missions) || {};
const useM = () => { M = (S.mission && missionSet(S.mission.ch)[S.mission.mode]) || C.mission; };
const CH = { buy: { best: { easy: 'best', mid: 'bestMid', hard: 'bestHard' }, earn: { easy: 'mission', mid: 'missionMid', hard: 'missionHard' } },
  factory: { best: { easy: 'fBest', mid: 'fBestMid', hard: 'fBestHard' }, earn: { easy: 'factory', mid: 'factoryMid', hard: 'factoryHard' } } };
const chOf = m => (m && m.ch) || 'buy';
const runningIn = ch => S.mission && S.mission.at && S.mission.at !== 'result' && chOf(S.mission) === ch;
const CAST = C.cast;
// Chế độ kiểm tra nội dung: chỉ có khi chạy trên máy (localhost) hoặc thêm ?dev. Lưu riêng, không đồng bộ lên tài khoản.
const LOCAL = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) || new URLSearchParams(location.search).has('dev');
const RV_KEY = 'hanyu-office-review';
const RV = (() => { try { return Object.assign({ on: true, mock: false }, JSON.parse(localStorage.getItem(RV_KEY) || '{}')); } catch { return { on: true, mock: false }; } })();
const DEV = new URLSearchParams(location.search).has('dev') || (LOCAL && RV.on); // mở khoá mọi chặng
const KEY = 'hanyu-office-v2';

// ---------- Lưu tiến độ ----------
// Luôn lưu trên trình duyệt này; nếu học viên đăng nhập (cloud.js) thì tự gửi lên tài khoản để học tiếp trên máy khác.
// S.t = lúc thay đổi gần nhất, dùng để biết bản nào mới hơn khi đồng bộ.
const fresh = () => ({ name: '', player: '', mentor: '', lessons: {}, test: null, mission: null, best: 0, bestMid: 0, bestHard: 0, fBest: 0, ai: null, notebook: {}, mistakes: [], practice: {}, mapAt: '',
  points: 0, lastDaily: '', earned: {}, opts: { py: true, vi: true }, t: 0 });
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = fresh(); }
const store = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
const save = (bump = true) => {
  if (bump) S.t = Date.now();
  store();
  if (bump && window.CLOUD) window.CLOUD.changed();
};
const cloud = () => window.CLOUD;
const cloudOn = () => !!window.FIREBASE_CONFIG;

// Điểm tích luỹ (积分): mỗi ngày vào game được tặng 1 điểm
const today = new Date().toLocaleDateString('sv');
let dailyGift = false;
// Mỗi ngày vào học được tặng 20 🪙
// (không đóng dấu thời gian, để một máy lâu không mở không bị coi là "bản mới hơn" khi đồng bộ)
const dailyCheck = () => { if (S.lastDaily !== today) { S.points += 20; S.lastDaily = today; dailyGift = true; save(false); } };
dailyCheck();
const award = (key, n) => { // thưởng một lần cho mỗi mốc
  if (S.earned[key]) return 0;
  S.earned[key] = true; S.points += n; save(); return n;
};

// ---------- Nhân vật ----------
const me = () => CAST.players.find(p => p.id === S.player) || CAST.players[CAST.players.length - 1];
const mentor = () => CAST.mentors.find(x => x.id === S.mentor) || CAST.mentors.find(x => x.id !== S.player);
const boss = () => (S.player === CAST.bosses[0].id ? CAST.bosses[1] : CAST.bosses[0]);
const char = key => (key === 'boss' ? boss() : CAST.npcs[key]);
const charImg = (key, face) => { const c = char(key), f = c.faces[face]; return f ? c.dir + f + '.png' : c.img; };
// Nét mặt gần nghĩa nhất khi nhân vật chưa có đúng nét đó
const NEAR = {
  'so-hai': ['so-hai', 'hoang-hot', 'ap-luc', 'kinh-ngac'], 'buon-ba': ['buon-ba', 'ap-luc', 'so-hai', 'hoang-hot', 'nghi-ngo'],
  'kho-hieu': ['kho-hieu', 'nghi-ngo', 'kinh-ngac'], 'kho-chiu': ['kho-chiu', 'de-biu', 'nghi-ngo'], 'de-biu': ['de-biu', 'kho-chiu', 'nghi-ngo'],
  'hoang-hot': ['hoang-hot', 'so-hai', 'kinh-ngac'], 'kinh-ngac': ['kinh-ngac', 'hoang-hot'], 'nghi-ngo': ['nghi-ngo', 'kho-hieu', 'de-biu'],
  'hoan-thanh': ['hoan-thanh', 'vui-ve'], 'vui-ve': ['vui-ve', 'hoan-thanh'],
};
const nearFace = (faces, face) => (NEAR[face] || [face]).find(f => faces.includes(f));
const meImg = face => { const p = me(), f = nearFace(p.faces, face); return f ? p.dir + f + '.png' : p.img; };

// ---------- Tiện ích ----------
const $ = sel => document.querySelector(sel);
const view = $('#view');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('en-US');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Thay {me}, {boss}, {price}... trong câu chữ
const tpl = str => String(str).replace(/\{(\w+)\}/g, (all, k) => {
  const p = me(), b = boss(), s = S.mission ? S.mission.s : null;
  const map = { me: p.nick, mePy: p.nickPy, boss: b.name, bossPy: b.py, bossSelf: b.self, bossSelfPy: b.selfPy, mentor: mentor().name };
  if (k in map) return map[k];
  if (s && k in s) return k === 'price' ? fmt(s[k]) : s[k];
  return all;
});
const say = zh => `<button class="say" data-say="${esc(tpl(zh))}" title="Nghe">🔊</button>`;
// ---------- Từ điển tra cứu (glossary.js + từ trong bài học + từ gợi ý của nhiệm vụ) ----------
const DICT = {};
(window.GLOSSARY_RAW || '').trim().split('\n').forEach(l => { if (l.startsWith('//')) return; const [zh, py, vi, ext] = l.split('|').map(x => (x || '').trim()); if (zh) DICT[zh] = { zh, py, vi, ext: ext === '+' }; });
const LESSON_WORDS = new Set(C.lessons.flatMap(L => (L.words || []).map(w => w.zh)));
C.lessons.forEach(L => (L.words || []).forEach(w => { DICT[w.zh] = { zh: w.zh, py: w.py, vi: w.vi, ex: { zh: w.ex, py: w.exPy, vi: w.exVi } }; }));
Object.values(C.missions || {}).forEach(Mi => Object.values(Mi.mid || {}).forEach(h => (h.vocab || []).forEach(v => { if (!DICT[v.zh]) DICT[v.zh] = { zh: v.zh, py: v.py, vi: v.vi }; })));
const MAXW = Math.max(1, ...Object.keys(DICT).map(k => k.length));
// Các câu có sẵn trong game, dùng làm câu ví dụ cho từ chưa có ví dụ riêng
const SENT = [];
const addS = o => { if (o && typeof o === 'object' && typeof o.zh === 'string' && o.py && /[\u4e00-\u9fff]{4}/.test(o.zh) && !/_/.test(o.zh)) SENT.push({ zh: o.zh, py: o.py, vi: o.vi }); };
C.lessons.forEach(L => { (L.words || []).forEach(w => addS({ zh: w.ex, py: w.exPy, vi: w.exVi })); (L.patterns || []).forEach(p => addS({ zh: p.ex, py: p.exPy, vi: p.exVi })); });
Object.values(C.missions || {}).forEach(Mi => Object.values(Mi.nodes).forEach(n => {
  addS(n); if (n.line && typeof n.line === 'object') addS(n.line);
  (n.choices || []).forEach(c => { addS(c); if (c.reply && typeof c.reply === 'object') addS(c.reply); });
}));
// Các từ mở rộng (dấu + trong glossary.js, không thuộc từ vựng bài học) có trong câu → ghi chú ngay dưới câu
function extWords(text) {
  const t = tpl(text), out = [];
  for (let i = 0; i < t.length;) {
    let hit = '';
    for (let L = Math.min(MAXW, t.length - i); L >= 1; L--) { const w = t.substr(i, L); if (DICT[w]) { hit = w; break; } }
    if (hit) { if (DICT[hit].ext && !LESSON_WORDS.has(hit) && !out.includes(hit)) out.push(hit); i += hit.length; } else i++;
  }
  return out;
}
const notes = text => { const ws = extWords(text); return ws.length ? `<div class="newwords">📌 ${ws.map(w => `<span class="w" data-w="${esc(w)}">${esc(w)}</span> <span class="py">${esc(DICT[w].py)}</span> <span class="nv">${esc(DICT[w].vi)}</span>`).join(' · ')}</div>` : ''; };
// Bọc từ có trong từ điển (khớp dài nhất) bằng <span class="w"> để bấm tra nghĩa
function hz(text) {
  const t = tpl(text); let out = '', i = 0;
  while (i < t.length) {
    let hit = '';
    if (/[\u4e00-\u9fff]/.test(t[i])) for (let L = Math.min(MAXW, t.length - i); L >= 1; L--) { const w = t.substr(i, L); if (DICT[w]) { hit = w; break; } }
    if (hit) { out += `<span class="w" data-w="${esc(hit)}">${esc(hit)}</span>`; i += hit.length; }
    else { out += esc(t[i]); i++; }
  }
  return out;
}
// Câu thoại đầy đủ: chữ Hán + pinyin + tiếng Việt
const line = (o, big = true) => `<div class="${big ? 'zh' : ''}">${hz(o.zh)}${say(o.zh)}</div>${o.py ? `<div class="py">${esc(tpl(o.py))}</div>` : ''}${o.vi ? `<div class="vi">${esc(tpl(o.vi))}</div>` : ''}${notes(o.zh)}`;
// Cụm ngắn có pinyin ngay bên dưới (đáp án, ô chữ, ô bảng). Nhận chuỗi tiếng Việt hoặc { zh, py, vi }.
const zp = o => (typeof o === 'string' ? `<span>${esc(tpl(o))}</span>`
  : `<span class="zp"><span class="hz">${hz(o.zh)}</span>${o.py ? `<span class="py">${esc(tpl(o.py))}</span>` : ''}${o.vi ? `<span class="vi">${esc(tpl(o.vi))}</span>` : ''}</span>`);
const zhOf = o => (typeof o === 'string' ? o : o.zh);
// Cuộn phần vừa hiện ra (nút Tiếp, nhận xét) lên trên thanh hướng dẫn ở đáy
const reveal = sel => requestAnimationFrame(() => { const el = typeof sel === 'string' ? $(sel) : sel; if (el) el.scrollIntoView({ block: 'nearest' }); });
const val = (x, s) => (typeof x === 'function' ? x(s) : x);
// Bài lõi bắt buộc trước bài đánh giá; bài có `after: 'mission'` mở sau khi xong nhiệm vụ 采购部
const CORE = C.lessons.filter(l => !l.after);
const lessonOpen = l => DEV || !l.after || S.best > 0;
const allLessonsDone = () => DEV || CORE.every(l => S.lessons[l.id]);
const testPassed = () => DEV || (S.test && S.test.passed);

// Đọc tiếng Trung bằng giọng có sẵn của trình duyệt (miễn phí)
let zhVoice = null;
const pickVoice = () => {
  const vs = speechSynthesis.getVoices().filter(v => /^zh(-|_)?(CN|Hans)?/i.test(v.lang));
  zhVoice = vs.find(v => /Xiaoxiao|Natural|Online/i.test(v.name)) || vs[0] || null;
};
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/_+|\[\w+\]/g, ' '));
  u.lang = 'zh-CN'; u.rate = 0.85;
  if (zhVoice) u.voice = zhVoice;
  speechSynthesis.speak(u);
}

// ---------- Hướng dẫn viên ----------
// mood: vui-ve (bình thường), hoan-thanh (khen), hoang-hot (sai), nghi-ngo (gợi ý), de-biu
function guide(html, mood = 'vui-ve') {
  const g = mentor();
  $('#guideBubble').innerHTML = html ? `<b>${g.name}:</b> ${html}` : '';
  $('#guideImg').src = g.dir + (nearFace(g.faces, mood) || 'vui-ve') + '.png';
  $('#guideImg').alt = g.name;
  $('#guide').classList.toggle('hidden', !S.player);
  $('#guide').classList.remove('closed');
}

// ---------- Thanh trên ----------
function applyOpts() {
  document.body.classList.toggle('hide-py', !S.opts.py);
  document.body.classList.toggle('hide-vi', !S.opts.vi);
  $('#optPy').checked = S.opts.py; $('#optVi').checked = S.opts.vi;
  $('#who').innerHTML = S.player ? `<img src="${me().img}" alt=""> ${esc(S.name)}` : '';
  $('#coins').innerHTML = S.player ? `🪙 ${S.points}` : '';
  $('#keyBtn').hidden = !S.name;
  $('#nbBtn').hidden = $('#mkBtn').hidden = !S.player;
  $('#nbBtn span').textContent = Object.keys(S.notebook).length;
  $('#mkBtn span').textContent = S.mistakes.length;
  $('#keyBtn').classList.toggle('off', !S.ai);
  $('#devBtn').hidden = !LOCAL;
  const cb = $('#cloudBtn'), st = cloud() && cloud().status();
  cb.hidden = !cloudOn() || !S.name && !(st && st.user);
  if (st) {
    cb.textContent = !st.user ? '☁️' : st.error ? '⚠️' : st.syncing ? '🔄' : '✅';
    cb.title = !st.user ? 'Chưa đăng nhập: tiến độ chỉ lưu trên máy này' : st.error ? st.error : 'Đã đồng bộ với tài khoản ' + (st.user.email || '');
    cb.classList.toggle('off', !st.user || !!st.error);
  }
}
$('#optPy').onchange = e => { S.opts.py = e.target.checked; save(); applyOpts(); };
$('#optVi').onchange = e => { S.opts.vi = e.target.checked; save(); applyOpts(); };

// ---------- Điều hướng ----------
let curScreen = '', inGo = false;
function go(name, arg) {
  curScreen = name;
  if (name === 'hub' && cloud()) { inGo = true; cloud().idle(); inGo = false; } // áp dụng bản mới từ máy khác (nếu có) khi về trung tâm
  if (typeof ACT !== 'undefined' && ACT.closePop) ACT.closePop();
  if (window.speechSynthesis) speechSynthesis.cancel();
  SCREENS[name](arg);
  applyOpts();
  window.scrollTo(0, 0);
  // Màn có khung thoại: cuộn để khung thoại và nút bấm nằm trên thanh hướng dẫn ở đáy
  requestAnimationFrame(() => {
    const d = $('.dialog');
    if (d && d.getBoundingClientRect().bottom > innerHeight - 130) d.scrollIntoView({ block: 'end' });
  });
}
const ACT = {}; // các hành động gắn qua data-act
// Bảng tra nghĩa sổ xuống ngay dưới từ được bấm
const pop = document.createElement('div');
pop.id = 'wordPop'; pop.className = 'wordpop'; pop.hidden = true;
document.body.appendChild(pop);
function showWord(el) {
  const w = el.dataset.w, d = DICT[w];
  if (!d) return;
  const ex = d.ex || SENT.find(x => x.zh.includes(w) && x.zh !== w);
  const saved = !!S.notebook[w];
  pop.innerHTML = `<div class="wp-head"><span class="wp-zh">${esc(w)}</span>${say(w)}<span class="wp-py">${esc(d.py)}</span>
      <button class="wp-add ${saved ? 'on' : ''}" data-act="addWord" data-arg="${esc(w)}" title="Thêm vào sổ từ ôn tập">${saved ? '✓' : '＋'}</button>
      <button class="wp-x" data-act="closePop" title="Đóng">×</button></div>
    <div class="wp-vi">${esc(d.vi)}</div>
    ${ex ? `<div class="wp-ex"><div class="lbl">Ví dụ</div>${esc(tpl(ex.zh))}${say(ex.zh)}<div class="py">${esc(tpl(ex.py || ''))}</div><div class="vi">${esc(tpl(ex.vi || ''))}</div></div>` : ''}`;
  pop.dataset.ex = ex ? JSON.stringify(ex) : '';
  pop.hidden = false;
  const r = el.getBoundingClientRect(), pw = Math.min(330, innerWidth - 24);
  const left = Math.max(12, Math.min(r.left + scrollX + r.width / 2 - pw / 2, scrollX + innerWidth - pw - 12));
  Object.assign(pop.style, { width: pw + 'px', left: left + 'px', top: (r.bottom + scrollY + 10) + 'px' });
  pop.style.setProperty('--ax', (r.left + scrollX + r.width / 2 - left) + 'px');
  document.querySelectorAll('.w.on').forEach(x => x.classList.remove('on'));
  el.classList.add('on');
  speak(w);
}
ACT.closePop = () => { pop.hidden = true; document.querySelectorAll('.w.on').forEach(x => x.classList.remove('on')); };
ACT.addWord = w => {
  const d = DICT[w];
  if (!d) return;
  if (S.notebook[w]) delete S.notebook[w];
  else S.notebook[w] = { zh: w, py: d.py, vi: d.vi, ex: d.ex || (pop.dataset.ex ? JSON.parse(pop.dataset.ex) : null), at: Date.now() };
  save(); applyOpts();
  const b = pop.querySelector('.wp-add');
  if (b) { b.classList.toggle('on', !!S.notebook[w]); b.textContent = S.notebook[w] ? '✓' : '＋'; }
  if (curScreen === 'notebook' && pop.hidden) go('notebook');
};
document.addEventListener('click', e => {
  // Bấm vào từ (trừ trong ô chữ và đáp án trắc nghiệm, nơi bấm là để chọn): mở bảng tra, không chọn đáp án
  const wEl = e.target.closest('.w');
  if (wEl && !e.target.closest('.tile, .opt, .chk-item')) { showWord(wEl); return; }
  if (!e.target.closest('#wordPop')) ACT.closePop();
  const s = e.target.closest('[data-say]');
  if (s) { speak(s.dataset.say); return; }
  const a = e.target.closest('[data-act]');
  if (a && !a.disabled && ACT[a.dataset.act]) ACT[a.dataset.act](a.dataset.arg, a);
});
// Thứ tự vào game: tên → API Key → chọn nhân vật → trung tâm
const home = () => (!S.name ? 'login' : !S.ai && !AI.reviewMock ? 'apikey' : !S.player ? 'pick' : 'hub');
ACT.home = () => go(home());
ACT.toggleGuide = () => $('#guide').classList.toggle('closed');
ACT.go = arg => go(...arg.split(':'));

// ================= MÀN HÌNH =================
const SCREENS = {};

SCREENS.login = () => {
  view.innerHTML = `
  <div class="login">
    <img src="${CAST.players[CAST.players.length - 1].img}" alt="">
    <div class="card">
      <h1>欢迎加入${C.company.zh}！</h1>
      <p class="py">Huānyíng jiārù ${C.company.py}!</p>
      <p class="vi">Chào mừng bạn gia nhập ${C.company.vi}! Bạn sẽ vào vai một thực tập sinh phòng thu mua.</p>
      ${acctBox(true)}
      <input id="name" placeholder="Nhập tên học viên" value="${esc(S.name || (cloudUser() ? cloudUser().name : ''))}" maxlength="30">
      <button class="btn" data-act="login">下一步 · Tiếp →</button>
    </div>
  </div>`;
  $('#guide').classList.add('hidden');
  $('#name').addEventListener('keydown', e => { if (e.key === 'Enter') ACT.login(); });
};
ACT.login = () => {
  const n = $('#name').value.trim();
  if (!n) { $('#name').focus(); return; }
  S.name = n; save(); go(home());
};

// ---------- Tài khoản và đồng bộ (cloud.js + Firebase) ----------
const cloudUser = () => (cloud() && cloud().status().user) || null;
function acctBox(onLogin) {
  if (!cloudOn()) return '';
  const st = cloud() && cloud().status();
  if (!st || !st.ready) return '<div class="acct"><p class="muted">⏳ Đang tải phần đăng nhập…</p></div>';
  if (st.user) return `<div class="acct ok">☁️ Đã đăng nhập <b>${esc(st.user.email || st.user.name)}</b>. Tiến độ và API Key tự lưu vào tài khoản này.</div>`;
  return `<div class="acct">
    <p class="vi"><b>Đăng nhập</b> để lưu tiến độ và API Key vào tài khoản, học tiếp trên cả điện thoại và máy tính.</p>
    <button class="btn ghost gbtn" data-act="gLogin"><b>G</b> Đăng nhập bằng Google</button>
    <div class="or">hoặc dùng email</div>
    <input id="em" type="email" placeholder="Email" autocomplete="email">
    <input id="pw" type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" autocomplete="current-password">
    <div class="row"><button class="btn small" data-act="eLogin">Đăng nhập</button><button class="btn ghost small" data-act="eSignup">Tạo tài khoản</button>
      <button class="linkbtn" data-act="eReset">Quên mật khẩu?</button></div>
    <div id="acctMsg">${st.error ? `<div class="feedback bad">${esc(st.error)}</div>` : ''}</div>
    ${onLogin ? '<p class="muted">Hoặc chỉ nhập tên bên dưới để chơi không cần tài khoản (tiến độ chỉ lưu trên máy này).</p>' : ''}
  </div>`;
}
const acctMsg = (html, ok) => { const m = $('#acctMsg'); if (m) m.innerHTML = `<div class="feedback ${ok ? 'good' : 'bad'}">${html}</div>`; };
const acctRun = async (fn, okText) => {
  view.querySelectorAll('.acct button').forEach(b => b.disabled = true);
  try { await fn(); if (okText) acctMsg(okText, true); }
  catch (e) { acctMsg(esc(e.message || e)); }
  finally { view.querySelectorAll('.acct button').forEach(b => b.disabled = false); }
};
const emPw = () => [($('#em') || {}).value || '', ($('#pw') || {}).value || ''];
ACT.gLogin = () => acctRun(() => cloud().signInGoogle());
ACT.eLogin = () => { const [e, p] = emPw(); if (!e || !p) return acctMsg('Nhập email và mật khẩu nhé.'); acctRun(() => cloud().signInEmail(e, p)); };
ACT.eSignup = () => {
  const [e, p] = emPw(); if (!e || !p) return acctMsg('Nhập email và mật khẩu (ít nhất 6 ký tự) để tạo tài khoản.');
  acctRun(() => cloud().signUpEmail((($('#name') || {}).value || S.name || ''), e, p));
};
ACT.eReset = () => { const [e] = emPw(); if (!e) return acctMsg('Nhập email trước, rồi bấm "Quên mật khẩu?".'); acctRun(() => cloud().resetPassword(e), '📧 Đã gửi email đặt lại mật khẩu. Kiểm tra cả hộp thư rác nhé.'); };
ACT.syncNow = () => cloud() && cloud().syncNow();
ACT.signOut = async () => {
  if (!confirm('Đăng xuất? Tiến độ và API Key vẫn nằm trong tài khoản, nhưng sẽ bị xoá khỏi máy này.')) return;
  await cloud().signOut();
};
SCREENS.account = () => {
  const st = cloud() && cloud().status(), u = st && st.user;
  const ago = st && st.lastSync ? new Date(st.lastSync).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
  view.innerHTML = `
  <div class="keypage">
    <h1>☁️ 我的账号 <small class="py">Wǒ de zhànghào</small></h1>
    <p class="sub">Tài khoản và đồng bộ giữa các máy</p>
    <div class="card">
      ${u ? `<p>Đã đăng nhập: <b>${esc(u.email || u.name)}</b></p>
        <p>${st.error ? `<span class="feedback bad">⚠️ ${esc(st.error)}</span>` : st.syncing ? '🔄 Đang đồng bộ…' : `✅ Đã đồng bộ${ago ? ' lúc ' + ago : ''}`}</p>
        <p class="vi">Tiến độ, sổ từ, sổ lỗi và API Key tự lưu vào tài khoản. Mở game trên điện thoại hoặc máy tính khác, đăng nhập cùng tài khoản là học tiếp được.</p>
        <div class="row"><button class="btn ghost" data-act="syncNow">🔄 Đồng bộ ngay</button><button class="btn ghost" data-act="home">← Về trung tâm</button>
          <button class="btn ghost small right" data-act="signOut">Đăng xuất</button></div>
        <p class="muted">Dùng máy chung (máy ở trường, máy bạn bè) thì đăng xuất khi học xong: dữ liệu và key sẽ được xoá khỏi máy đó.</p>`
      : `${acctBox(false)}<div class="row" style="margin-top:12px"><button class="btn ghost" data-act="home">← Quay lại</button></div>`}
    </div>
  </div>`;
  $('#guide').classList.add('hidden');
};

// Cầu nối cho cloud.js
let cloudSeen = '';
window.GAME = {
  get: () => S,
  // Áp dụng bản đã gộp từ tài khoản. Đang làm bài thì chờ (trả về false), trừ lúc vừa đăng nhập.
  replace(next, force) {
    const safe = ['', 'login', 'hub', 'apikey', 'pick', 'account', 'notebook', 'mistakes'];
    if (!force && !safe.includes(curScreen)) return false;
    S = Object.assign(fresh(), next);
    store(); dailyCheck();
    if (!inGo) go(['', 'login', 'apikey', 'pick'].includes(curScreen) ? home() : curScreen);
    return true;
  },
  touch: () => save(),
  clear() { S = fresh(); S.lastDaily = today; store(); go('login'); },
  cloudChanged() {
    if (!$('#view')) return;
    applyOpts();
    const st = cloud().status(), k = `${st.ready}|${st.user ? st.user.uid : ''}`;
    if (k !== cloudSeen) {
      cloudSeen = k;
      if (curScreen === 'login') go(st.user && S.name ? home() : 'login');
      else if (curScreen === 'account') go('account');
    } else if (curScreen === 'account' && st.user) go('account');
  },
};

// ---------- Kết nối AI bằng API Key của học viên ----------
const AI_ERR = {
  key: 'Key không đúng, đã bị xoá, hoặc chưa được phép dùng Gemini API. Em kiểm tra lại bước 3, copy đủ cả chuỗi nhé.',
  quota: 'Key đúng nhưng đang hết lượt miễn phí (Google giới hạn số lượt mỗi phút và mỗi ngày). Đợi khoảng 1 phút rồi thử lại.',
  network: 'Không kết nối được tới Google. Kiểm tra mạng rồi thử lại.',
  model: 'Key này hiện chưa dùng được model Gemini miễn phí nào. Thử tạo key mới trong một dự án mới ở Google AI Studio.',
  parse: 'AI trả về dữ liệu không đọc được. Thử lại nhé.',
};
const aiErrText = e => (e && AI_ERR[e.kind]) || ('Lỗi: ' + esc((e && e.message) || e));
SCREENS.apikey = () => {
  const has = !!S.ai;
  view.innerHTML = `
  <div class="keypage">
    <h1>🔑 连接 AI 老师 <small class="py">Liánjiē AI lǎoshī</small></h1>
    <p class="sub">Kết nối "thầy giáo AI" để chấm câu em tự viết hoặc tự nói</p>
    <div class="card">
      <p>Ở <b>chế độ Vừa</b>, em không chọn đáp án có sẵn nữa mà <b>tự gõ hoặc nói</b> câu tiếng Trung. AI của Google (Gemini) sẽ chấm, sửa câu và nhận xét cho em.
      Mỗi học viên dùng <b>API Key miễn phí của riêng mình</b>, không cần thẻ thanh toán.</p>
      <ol class="steps-list">
        <li>Mở <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> và đăng nhập bằng tài khoản Google.</li>
        <li>Bấm <b>Create API key</b> (Tạo khoá API). Nếu được hỏi chọn dự án, chọn dự án có sẵn hoặc tạo dự án mới.</li>
        <li>Bấm biểu tượng sao chép để copy key, là một chuỗi dài thường bắt đầu bằng <code>AIza</code>.</li>
        <li>Dán vào ô bên dưới rồi bấm <b>Kiểm tra và lưu</b>.</li>
      </ol>
      <div class="keyrow"><input id="key" type="password" autocomplete="off" spellcheck="false" placeholder="Dán API Key vào đây" value="">
        <button class="btn ghost small" id="showKey" type="button">👁</button></div>
      <div class="row" style="margin-top:12px">
        <button class="btn" data-act="saveKey">Kiểm tra và lưu</button>
        ${has ? '<button class="btn ghost" data-act="home">Tiếp tục với key đang dùng →</button><button class="btn ghost small right" data-act="removeKey">Xoá key khỏi máy này</button>' : ''}
      </div>
      <div id="keyStatus">${has ? `<div class="feedback good">✓ Đã kết nối · model <b>${esc(S.ai.model)}</b> · key …${esc(S.ai.key.slice(-4))}</div>` : ''}</div>
      <div class="key-notes vi">
        ${cloudUser()
    ? '<p>🔒 Key được lưu vào tài khoản của em (chỉ em đọc được) và tự có trên máy khác khi em đăng nhập. Khi chấm bài, key được gửi thẳng tới Google. Dùng máy chung thì bấm ☁️ → Đăng xuất khi học xong.</p>'
    : `<p>🔒 Key chỉ lưu trên trình duyệt này và được gửi thẳng tới Google, không qua máy chủ nào khác. Không chia sẻ key cho người khác. Dùng máy chung thì bấm "Xoá key khỏi máy này" khi học xong.${cloudOn() ? ' Muốn dùng key trên cả điện thoại và máy tính thì bấm ☁️ để đăng nhập.' : ''}</p>`}
        <p>⏳ Gói miễn phí giới hạn số lượt mỗi phút và mỗi ngày. Khi hết lượt, game sẽ báo để em đợi một chút hoặc chuyển sang chọn đáp án.</p>
      </div>
    </div>
  </div>`;
  $('#guide').classList.add('hidden');
  $('#showKey').onclick = () => { const k = $('#key'); k.type = k.type === 'password' ? 'text' : 'password'; };
  $('#key').addEventListener('keydown', e => { if (e.key === 'Enter') ACT.saveKey(); });
};
ACT.saveKey = async () => {
  const key = $('#key').value.trim().replace(/\s+/g, '');
  const st = $('#keyStatus');
  if (key.length < 20) { st.innerHTML = '<div class="feedback bad">Key quá ngắn. Em copy đủ cả chuỗi nhé.</div>'; return; }
  st.innerHTML = '<div class="feedback">⏳ Đang kiểm tra key với Google…</div>';
  view.querySelectorAll('button').forEach(b => b.disabled = true);
  try {
    S.ai = await AI.connect(key); save();
    st.innerHTML = `<div class="feedback good">✓ Kết nối thành công · model <b>${esc(S.ai.model)}</b></div>`;
    setTimeout(() => go(home()), 900);
  } catch (e) {
    st.innerHTML = `<div class="feedback bad">✗ ${aiErrText(e)}</div>`;
    view.querySelectorAll('button').forEach(b => b.disabled = false);
  }
};
ACT.removeKey = () => { if (confirm('Xoá API Key khỏi máy này?')) { S.ai = null; save(); go('apikey'); } };

// ---------- Chọn nhân vật và hướng dẫn viên ----------
let pickP = '', pickM = '';
SCREENS.pick = () => {
  pickP = pickP || S.player; pickM = pickM || S.mentor;
  if (pickM === pickP) pickM = '';
  const mentors = CAST.mentors.filter(x => x.id !== pickP);
  view.innerHTML = `
  <h1>选择你的角色</h1>
  <p class="sub"><span class="py">Xuǎnzé nǐ de juésè · </span>Chọn nhân vật của bạn. Con nào có dấu ✨ sẽ đổi nét mặt theo tình huống.</p>
  <div class="picker">${CAST.players.map(p => `
    <button class="pick ${pickP === p.id ? 'on' : ''}" data-act="pickP" data-arg="${p.id}">
      <img src="${p.img}" alt=""><b>${p.nick}</b><span class="py">${p.nickPy}</span><span class="vi">${p.vi}${p.faces.length >= 6 ? ' ✨' : ''}</span>
    </button>`).join('')}</div>
  <h2>选择你的老师 <small class="py">Xuǎnzé nǐ de lǎoshī</small></h2>
  <p class="sub">Hướng dẫn viên sẽ đi cùng và gợi ý cho bạn suốt các nhiệm vụ.</p>
  <div class="picker mentors">${mentors.map(g => `
    <button class="pick ${pickM === g.id ? 'on' : ''}" data-act="pickM" data-arg="${g.id}">
      <img src="${g.dir}vui-ve.png" alt=""><b>${g.name}</b><span class="py">${g.py}</span><span class="vi">${g.vi}</span>
    </button>`).join('')}</div>
  <div class="row" style="margin-top:22px"><button class="btn right" data-act="pickDone" ${pickP && pickM ? '' : 'disabled'}>进入公司 · Vào công ty →</button></div>`;
  $('#guide').classList.add('hidden');
};
ACT.pickP = id => { pickP = id; const y = scrollY; go('pick'); scrollTo(0, y); };
ACT.pickM = id => { pickM = id; const y = scrollY; go('pick'); scrollTo(0, y); };
ACT.pickDone = () => {
  if (S.player && S.player !== pickP) S.mission = null; // đổi vai thì bắt đầu lại nhiệm vụ đang dở
  S.player = pickP; S.mentor = pickM; pickP = pickM = ''; save(); go('hub');
};

SCREENS.hub = () => {
  const lessonsDone = CORE.filter(l => S.lessons[l.id]).length;
  const testOpen = allLessonsDone(), missionOpen = testPassed();
  const running = runningIn('buy');
  // Chế độ Vừa và Khó của 采购部 để dành cho chương sau (khi học viên đã đủ vốn từ); bản thử ?dev vẫn mở được
  const midOpen = DEV, hardOpen = DEV;
  const factoryOpen = DEV || S.best > 0;
  const MS = C.missions || { easy: C.mission };
  const next = !allLessonsDone() ? 'train' : !testPassed() ? 'test' : !S.best ? 'mission' : !S.fBest ? 'factory' : '';
  const coworker = CAST.players.find(p => !['chuot', S.player, boss().id].includes(p.id) && p.id === 'cho') || CAST.players.find(p => ![S.player, boss().id].includes(p.id));
  // Bản đồ: dùng tranh vẽ sẵn nếu có, không thì dùng bản vẽ bằng code
  const map = window.ART ? (ART.campusImage || ART.campus)({
    open: { train: true, test: testOpen, mission: missionOpen, factory: DEV || S.best > 0 }, next,
    player: me().img, at: S.mapAt, mentor: mentor().dir + 'vui-ve.png', boss: boss().img, coworker: coworker.img,
    // các bạn thú khác làm 'người qua đường' trong phòng: học viên, người đang thi, đồng nghiệp
    ...(() => { const pool = CAST.players.filter(p => ![S.player, boss().id, coworker.id, S.mentor].includes(p.id)).map(p => p.img);
      return { students: pool.slice(0, 4), examinees: pool.slice(4, 6), staff: pool.slice(6, 8) }; })(),
    labels: {
      train: { icon: '📚', zh: '培训中心', py: 'péixùn zhōngxīn', vi: `Lớp đào tạo · ${lessonsDone}/${CORE.length}` },
      test: { icon: '📝', zh: '能力测评', py: 'nénglì cèpíng', vi: S.test ? `Đánh giá · ${S.test.score}/${C.test.questions.length}` : 'Đánh giá năng lực', w: 160 },
      mission: { icon: '💼', zh: '采购部', py: 'cǎigòubù', vi: S.best ? `Nhiệm vụ · ${'★'.repeat(S.best)}` : 'Phòng thu mua · Nhiệm vụ', w: 178 },
      factory: { icon: '🏭', zh: '工厂', py: 'gōngchǎng', vi: S.fBest ? `Chương 2 · ${'★'.repeat(S.fBest)}` : S.best ? 'Nhà máy · Chương 2' : 'Qua 采购部 để mở', w: 160 },
    },
  }) : '';
  view.innerHTML = `
  <div class="row"><div><h1>新员工培训中心</h1>
  <p class="sub"><span class="py">Xīn yuángōng péixùn zhōngxīn · </span>Trung tâm đào tạo nhân viên mới · Hoàn thành từng chặng để mở chặng tiếp theo</p></div>
  <button class="btn ghost small right" data-act="go" data-arg="pick">Đổi nhân vật</button></div>
  <div class="map-wrap">${map}</div>
  <p class="map-tip vi">Bấm vào một toà nhà để vào học. Mũi tên cam chỉ nơi em cần tới tiếp theo.</p>
  <div class="stages">
    <div class="card stage">
      <div class="row"><span class="num">1</span><div><div class="zh">培训课程</div><div class="py">péixùn kèchéng</div><div class="vi">Lớp đào tạo · ${lessonsDone}/${CORE.length}</div></div></div>
      ${C.lessons.map(l => `
        <div class="item ${lessonOpen(l) ? '' : 'mode off'}"><span class="grow"><b>${esc(l.title)}</b><div class="vi">${esc(l.vi)}${l.after ? ' · bài mở rộng' : ''}</div></span>
        ${S.lessons[l.id] ? '<span class="ok">✓</span>' : ''}
        ${lessonOpen(l) ? `<button class="btn small ${S.lessons[l.id] ? 'ghost' : ''}" data-act="go" data-arg="lesson:${l.id}">${S.lessons[l.id] ? 'Ôn lại' : 'Học'}</button>` : '<span class="vi">🔒 Sau nhiệm vụ 采购部</span>'}</div>`).join('')}
    </div>
    <div class="card stage ${testOpen ? '' : 'locked'}">
      <div class="row"><span class="num">2</span><div><div class="zh">能力测评</div><div class="py">nénglì cèpíng</div><div class="vi">Đánh giá năng lực</div></div></div>
      <p class="vi">${C.test.questions.length} câu: từ vựng, nghe, mẫu câu, nghiệp vụ. Cần đúng ${C.test.pass}/${C.test.questions.length} để nhận nhiệm vụ.</p>
      ${S.test ? `<div class="item"><span class="grow">Lần gần nhất: <b>${S.test.score}/${C.test.questions.length}</b></span>${S.test.passed ? '<span class="ok">✓</span>' : '<span style="color:var(--bad)">Chưa đạt</span>'}</div>` : ''}
      <button class="btn" data-act="go" data-arg="test" ${testOpen ? '' : 'disabled'}>${S.test ? 'Làm lại' : 'Bắt đầu'}</button>
    </div>
    <div class="card stage ${missionOpen ? '' : 'locked'}">
      <div class="row"><span class="num">3</span><div><div class="zh">任务 · 采购部</div><div class="py">rènwu · cǎigòubù</div><div class="vi">Nhiệm vụ phòng thu mua · mỗi chế độ một tình huống</div></div></div>
      ${running ? `<div class="row"><button class="btn ghost small" data-act="go" data-arg="mission">▶ Tiếp tục nhiệm vụ đang làm (${MODES[S.mission.mode] || 'Dễ'})</button></div>` : ''}
      <div class="item mode"><span class="grow"><b>易 · Dễ</b> · ${esc(MS.easy.title)}<div class="vi">${esc(MS.easy.vi)} · chọn câu trả lời</div></span>
        ${S.best ? `<span class="stars">${'★'.repeat(S.best)}${'☆'.repeat(3 - S.best)}</span>` : ''}
        <button class="btn small" data-act="startMission" ${missionOpen ? '' : 'disabled'}>${S.best ? 'Chơi lại' : 'Bắt đầu'}</button></div>
      <div class="item mode ${midOpen ? '' : 'off'}"><span class="grow"><b>中 · Vừa</b> · ${esc(MS.mid.title)}<div class="vi">${esc(MS.mid.vi)} · tự gõ hoặc nói, AI chấm</div></span>
        ${S.bestMid ? `<span class="stars">${'★'.repeat(S.bestMid)}${'☆'.repeat(3 - S.bestMid)}</span>` : ''}
        ${midOpen ? `<button class="btn small" data-act="startMission" data-arg="mid">${S.bestMid ? 'Chơi lại' : 'Bắt đầu'}</button>` : '<span class="vi">🔒 Chương sau</span>'}</div>
      <div class="item mode ${hardOpen ? '' : 'off'}"><span class="grow"><b>难 · Khó</b> · ${esc(MS.hard.title)}<div class="vi">${esc(MS.hard.vi)} · tình huống éo le, gợi ý tốn 🪙</div></span>
        ${S.bestHard ? `<span class="stars">${'★'.repeat(S.bestHard)}${'☆'.repeat(3 - S.bestHard)}</span>` : ''}
        ${hardOpen ? `<button class="btn small" data-act="startMission" data-arg="hard">${S.bestHard ? 'Chơi lại' : 'Bắt đầu'}</button>` : '<span class="vi">🔒 Chương sau</span>'}</div>
    </div>
  </div>
  <button class="reset" data-act="reset">Xoá tiến độ và chơi lại từ đầu</button>`;
  const gift = dailyGift ? ' 🎁 Hôm nay em được tặng <b>20 🪙</b> vì đã vào học.' : '';
  dailyGift = false;
  if (!allLessonsDone()) guide(`Chào ${esc(S.name)}! Trước khi được giao việc, em phải học xong <b>3 bài</b> ở lớp đào tạo nhé.${gift}`);
  else if (!testPassed()) guide(`Học xong rồi! Giờ làm <b>bài đánh giá năng lực</b>. Đạt thì ${boss().name} mới giao nhiệm vụ.${gift}`, 'hoan-thanh');
  else if (!S.best) guide(`Em đã đủ năng lực rồi! <b>${boss().name}</b> đang có việc gấp cần giao đấy.${gift}`, 'hoan-thanh');
  else if (!S.fBest) guide(`Em đã hoàn thành nhiệm vụ ở 采购部! <b>🏭 工厂</b> đã mở trên bản đồ: học <b>bài 4</b> rồi xuống nhà máy nhận hàng nhé.${gift}`, 'hoan-thanh');
  else guide(`Em đã hoàn thành <b>chương 2 · 工厂</b>! Chương tiếp theo đang được chuẩn bị. Trong lúc chờ, luyện tập và ôn sổ từ để kiếm thêm 🪙 nhé.${gift}`, 'hoan-thanh');
};
// Bấm vào toà nhà trên bản đồ
// Bấm toà nhà: nhân vật đi bộ theo đường tới cửa rồi mới vào
let walking = false;
ACT.mapGo = id => {
  if (walking) return;
  if (!window.ART || !ART.walkTo || !document.getElementById('meOnMap')) return enterPlace(id);
  walking = true;
  ART.walkTo(S.mapAt, id, () => { walking = false; S.mapAt = id; save(); enterPlace(id); });
};
function enterPlace(id) {
  const lessonsOk = allLessonsDone(), testOk = testPassed();
  if (id === 'train') return go('lesson', (C.lessons.find(l => lessonOpen(l) && !S.lessons[l.id]) || C.lessons[0]).id);
  if (id === 'test') return lessonsOk ? go('test') : guide('Phòng đánh giá còn khoá. Em học xong <b>3 bài</b> ở 培训中心 trước nhé.', 'nghi-ngo');
  if (id === 'mission') {
    if (!testOk) return guide('Phòng thu mua còn khoá. Em phải qua <b>bài đánh giá năng lực</b> trước.', 'nghi-ngo');
    return runningIn('buy') ? go('mission') : ACT.startMission();
  }
  if (id === 'factory') {
    if (!(DEV || S.best > 0)) return guide('<b>工厂</b> còn khoá. Em hoàn thành nhiệm vụ ở <b>采购部</b> (chế độ Dễ) trước nhé.', 'nghi-ngo');
    return go('factory');
  }
};
// Chương 2 · 工厂: 跟单与收货. Cần học xong bài 4 trước. Chế độ Vừa / Khó để dành cho sau.
SCREENS.factory = () => {
  const F = (C.factory || {}).easy, ready = DEV || S.lessons.follow;
  const running = runningIn('factory');
  view.innerHTML = `
  <div class="row"><div><h1>第二章 · 工厂 <small class="py">dì-èr zhāng · gōngchǎng</small></h1>
    <p class="sub">Chương 2 · Nhà máy: theo dõi đơn hàng và nhận hàng</p></div>
    <button class="btn ghost small right" data-act="home">← Bản đồ</button></div>
  <div class="scene factory">${window.ART ? ART.scene('factory') : ''}
    <img class="actor left" src="${me().img}" alt=""><img class="actor right" src="${boss().img}" alt="">
    <span class="nametag left">${me().nick}</span><span class="nametag right">${boss().name}<small> · ${esc(boss().role)}</small></span></div>
  <div class="dialog"><div class="who">${boss().name}</div>${line({ zh: '{me}，钢板快到了。这次你去跟单，到货的时候去仓库核对。', py: '{mePy}, gāngbǎn kuài dào le. Zhè cì nǐ qù gēndān, dàohuò de shíhou qù cāngkù héduì.', vi: '{me}, thép sắp tới rồi. Lần này em theo dõi đơn hàng, hàng tới thì xuống kho đối chiếu.' })}</div>
  <div class="card stage chapter">
    ${ready ? '' : '<p class="need">📚 Trước khi xuống nhà máy, em cần học <b>bài 4 · 跟单与收货</b> ở 培训中心 (từ vựng hối hàng, giấy tờ khi nhận hàng).</p>'}
    <div class="item mode"><span class="grow"><b>易 · Dễ</b> · ${esc(F.title)}<div class="vi">${esc(F.vi)} · chọn câu trả lời</div></span>
      ${S.fBest ? `<span class="stars">${'★'.repeat(S.fBest)}${'☆'.repeat(3 - S.fBest)}</span>` : ''}
      ${ready ? `<button class="btn small" data-act="${running ? 'go' : 'startMission'}" data-arg="${running ? 'mission' : 'factory:easy'}">${running ? '▶ Tiếp tục' : S.fBest ? 'Chơi lại' : 'Bắt đầu'}</button>` : '<button class="btn small" data-act="go" data-arg="lesson:follow">📚 Học bài 4</button>'}</div>
    <div class="item mode off"><span class="grow"><b>中 · Vừa</b> và <b>难 · Khó</b><div class="vi">Tình huống riêng, tự gõ hoặc nói</div></span><span class="vi">🔒 Chương sau</span></div>
  </div>`;
  guide(ready ? (S.fBest ? 'Muốn lấy thêm sao thì chơi lại nhé.' : 'Chương này dùng từ vựng của <b>bài 4</b>. Nhớ: <b>kiểm tra xong mới ký nhận!</b>') : 'Học xong <b>bài 4</b> rồi quay lại đây nhé.', ready ? 'vui-ve' : 'nghi-ngo');
};
// ---------- 🛠 Kiểm tra nội dung (chỉ khi chạy trên máy): vào thẳng mọi bài, mọi chế độ, mọi cảnh ----------
const CHAPTERS = () => [
  { ch: 'buy', zh: '采购部', vi: 'Chương 1 · Phòng thu mua', set: C.missions || { easy: C.mission } },
  { ch: 'factory', zh: '工厂', vi: 'Chương 2 · Nhà máy', set: C.factory || {} },
];
const nodeLabel = (id, n) => {
  const l = typeof n.line === 'object' && n.line ? n.line : null;
  const t = n.zh || (l && l.zh) || (n.title && n.title.zh) || n.intro || n.q || '';
  const who = n.with ? (n.with === 'boss' ? boss().name : (char(n.with) || {}).name || n.with) : '';
  return `${id} · ${n.type}${who ? ' · ' + who : ''}${t ? ' · ' + String(tpl(t)).slice(0, 26) : ''}`;
};
SCREENS.review = () => {
  if (!LOCAL) return go(home());
  const btn = (act, arg, text, ghost = true) => `<button class="btn small ${ghost ? 'ghost' : ''}" data-act="${act}" ${arg !== undefined ? `data-arg="${esc(arg)}"` : ''}>${text}</button>`;
  view.innerHTML = `
  <div class="row"><div><h1>🛠 Kiểm tra nội dung</h1>
    <p class="sub">Chỉ hiện khi chạy trên máy (localhost). Học viên dùng bản trên mạng sẽ không thấy màn này.</p></div>
    ${btn('home', undefined, '← Về bản đồ')}</div>
  <div class="card rv">
    <h2>Cài đặt</h2>
    <div class="rv-row"><span class="grow"><b>Mở khoá mọi chặng</b><div class="vi">Bản đồ, bài học, chế độ Vừa/Khó, chương 2 đều vào được, không cần qua ải.</div></span>
      ${btn('rvToggle', 'on', RV.on ? '✅ Đang bật' : '⬜ Đang tắt', !RV.on)}</div>
    <div class="rv-row"><span class="grow"><b>AI chấm giả lập</b><div class="vi">Chế độ Vừa/Khó và bài dịch không cần API Key, không tốn lượt Gemini. Tắt đi để thử AI thật.</div></span>
      ${btn('rvToggle', 'mock', RV.mock ? '✅ Đang bật' : '⬜ Đang tắt', !RV.mock)}</div>
    <div class="rv-row"><span class="grow"><b>Điểm 🪙</b><div class="vi">Hiện có ${S.points} 🪙. Thêm để thử nút gợi ý.</div></span>${btn('rvCoins', undefined, '+500 🪙')}</div>
  </div>
  <div class="card rv">
    <h2>📚 Bài học và luyện tập</h2>
    ${C.lessons.map(l => `<div class="rv-row"><span class="grow"><b>${esc(l.title)}</b><div class="vi">${esc(l.vi)}</div></span>
      <span class="rv-btns">${btn('rvGo', 'lesson:' + l.id, 'Học', false)}${[1, 2, 3].map(lv => btn('rvPractice', `${l.id}:${lv}`, ['', 'Luyện cấp 1', 'Cấp 2', 'Cấp 3'][lv])).join('')}</span></div>`).join('')}
    <div class="rv-row"><span class="grow"><b>能力测评</b><div class="vi">Bài đánh giá năng lực</div></span>${btn('rvGo', 'test', 'Làm bài', false)}</div>
  </div>
  ${CHAPTERS().map(c => `<div class="card rv">
    <h2>💼 ${c.zh} <small class="vi">${c.vi}</small></h2>
    ${['easy', 'mid', 'hard'].filter(md => c.set[md]).map(md => { const MM = c.set[md], ids = Object.keys(MM.nodes);
      return `<div class="rv-row wrap"><span class="grow"><b>${MODES[md]}</b> · ${esc(MM.title)}<div class="vi">${esc(MM.vi)} · ${ids.length} cảnh</div></span>
        ${btn('rvStart', `${c.ch}:${md}`, '▶ Từ đầu', false)}
        <span class="rv-jump"><select id="rv-${c.ch}-${md}">${ids.map(id => `<option value="${esc(id)}">${esc(nodeLabel(id, MM.nodes[id]))}</option>`).join('')}</select>${btn('rvJump', `${c.ch}:${md}`, 'Nhảy tới cảnh')}</span></div>`;
    }).join('')}
  </div>`).join('')}
  <div class="card rv">
    <h2>🗂 Các màn khác</h2>
    <div class="row" style="flex-wrap:wrap;gap:8px">
      ${[['hub', '🗺 Bản đồ'], ['factory', '🏭 Màn 工厂'], ['notebook', '📒 Sổ từ'], ['mistakes', '📕 Sổ lỗi'], ['apikey', '🔑 API Key'], ['pick', '🐾 Chọn nhân vật'], ['login', '👋 Màn đăng nhập'], ...(cloudOn() ? [['account', '☁️ Tài khoản']] : [])].map(([k, t]) => btn('rvGo', k, t)).join('')}
    </div>
  </div>`;
  guide('Chọn bất kỳ bài nào, chế độ nào, hoặc nhảy thẳng tới một cảnh trong nhiệm vụ. Trong lúc chơi, bấm <b>🛠</b> trên thanh trên cùng để quay lại đây.', 'vui-ve');
};
// Nhảy thẳng vào màn cần nhân vật: nếu chưa chọn thì dùng tạm thỏ
const ensureProfile = () => { let ch = false; if (!S.name) { S.name = 'Học viên thử'; ch = true; } if (!S.player) { S.player = 'tho'; ch = true; } if (!S.mentor) { S.mentor = 'tho'; ch = true; } if (ch) save(); };
ACT.rvToggle = k => { RV[k] = !RV[k]; try { localStorage.setItem(RV_KEY, JSON.stringify(RV)); } catch {} location.reload(); };
ACT.rvCoins = () => { S.points += 500; save(); go('review'); };
ACT.rvGo = arg => { ensureProfile(); go(...arg.split(':')); };
ACT.rvPractice = arg => { ensureProfile(); ACT.practice(arg); };
ACT.rvStart = arg => { ensureProfile(); ACT.startMission(arg); };
ACT.rvJump = arg => {
  const [ch, mode] = arg.split(':'), id = $(`#rv-${ch}-${mode}`).value;
  ensureProfile();
  S.mission = newMission(mode, ch); useM(); goto(id);
};

ACT.reset = () => { if (confirm('Xoá toàn bộ tiến độ? (API Key vẫn được giữ lại)')) { const ai = S.ai; S = fresh(); S.ai = ai; S.lastDaily = today; save(); go('login'); } };

// ---------- Trình chạy bài trắc nghiệm dùng chung ----------
// Ô chữ sắp xếp: dùng chung cho bài trắc nghiệm và bước soạn câu trong nhiệm vụ
function tileBoard(tiles, onCheck) {
  const order = shuffle(tiles.map((_, i) => i)), picked = [];
  $('#qbody').innerHTML = `<div class="tiles answer" id="ans"></div><div class="tiles" id="pool"></div>
    <div class="row"><button class="btn ghost small" id="clr">Xoá</button><button class="btn small right" id="chk" disabled>Kiểm tra</button></div>`;
  const draw = () => {
    $('#ans').innerHTML = picked.map((t, j) => `<button class="tile" data-j="${j}">${zp(tiles[t])}</button>`).join('');
    $('#pool').innerHTML = order.map(t => `<button class="tile ${picked.includes(t) ? 'used' : ''}" data-t="${t}">${zp(tiles[t])}</button>`).join('');
    $('#chk').disabled = picked.length !== tiles.length;
    if (picked.length === tiles.length) reveal('#chk'); // ghép xong thì cuộn để nút Kiểm tra không bị thanh hướng dẫn che
    $('#pool').querySelectorAll('.tile').forEach(b => b.onclick = () => { picked.push(+b.dataset.t); draw(); });
    $('#ans').querySelectorAll('.tile').forEach(b => b.onclick = () => { picked.splice(+b.dataset.j, 1); draw(); });
  };
  draw();
  $('#clr').onclick = () => { picked.length = 0; draw(); };
  $('#chk').onclick = () => onCheck(picked.map(t => zhOf(tiles[t])).join(''), () => { picked.length = 0; draw(); });
}
const answerLine = q => `<b>${esc(q.answer)}</b> ${say(q.answer)}${q.answerPy ? `<div class="py">${esc(q.answerPy)}</div>` : ''}`;

// track: ghi câu sai vào sổ lỗi sai; onAnswer(i, ok): gọi sau mỗi câu (dùng khi ôn lại lỗi sai)
function runQuiz({ title, sub, questions, onDone, track = true, onAnswer }) {
  let i = 0, correct = 0, timer = null;
  const render = () => {
    const q = questions[i];
    view.innerHTML = `
    <div class="quiz">
      <div class="row"><h1>${esc(title)}</h1><span class="right vi">Câu ${i + 1}/${questions.length}</span></div>
      ${sub ? `<p class="sub">${esc(sub)}</p>` : ''}
      <div class="progress"><div style="width:${i / questions.length * 100}%"></div></div>
      <div class="card" id="qcard">
        ${q.q ? `<div class="q">${esc(q.q)} ${q.audio ? say(q.audio) : ''}</div>` : ''}
        ${q.zh ? `<div class="q qzh">${hz(q.zh)}${/_/.test(q.zh) ? '' : say(q.zh)}</div>${q.py ? `<div class="py">${esc(tpl(q.py))}</div>` : ''}` : ''}
        ${q.vi ? `<div class="vi">${esc(q.vi)}</div>` : ''}
        ${q.time ? '<div class="timer"><div id="tbar"></div></div>' : ''}
        <div id="qbody"></div>
        <div id="qfb"></div>
      </div>
    </div>`;
    if (q.audio) setTimeout(() => speak(q.audio), 300);
    ({ order: orderQ, type: typeQ }[q.type] || mcQ)(q);
  };
  const finish = (ok, given) => {
    clearInterval(timer);
    if (ok) correct++;
    if (!ok && track) addMistake({ kind: 'quiz', src: title, q: Object.assign({}, questions[i], { time: undefined }), given });
    if (onAnswer) onAnswer(i, ok);
    $('#qfb').innerHTML += `<div class="row" style="margin-top:12px"><button class="btn right" id="next">${i + 1 < questions.length ? 'Câu tiếp →' : 'Xem kết quả'}</button></div>`;
    reveal('#next');
    $('#next').onclick = () => { i++; i < questions.length ? render() : onDone(correct, questions.length); };
  };
  // Đồng hồ cho câu phản xạ: hết giờ là tính sai
  const startTimer = (q, onTimeout) => {
    if (!q.time) return;
    const t0 = Date.now();
    timer = setInterval(() => {
      const left = 1 - (Date.now() - t0) / (q.time * 1000);
      const bar = $('#tbar'); if (bar) bar.style.width = Math.max(0, left * 100) + '%';
      if (left <= 0) { clearInterval(timer); onTimeout(); }
    }, 50);
  };
  const mcQ = q => {
    $('#qbody').innerHTML = `<div class="opts">${q.options.map((o, k) => `<button class="opt" data-k="${k}">${zp(o)}</button>`).join('')}</div>`;
    $('#qbody').querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === q.answer;
      $('#qbody').querySelectorAll('.opt').forEach((x, j) => { x.disabled = true; if (j === q.answer) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      $('#qfb').innerHTML = `<div class="feedback ${ok ? 'good' : 'bad'}">${ok ? '✓ Chính xác!' : '✗ Chưa đúng. Đáp án: <b>' + esc(tpl(zhOf(q.options[q.answer]))) + '</b>'}${q.explain ? '<br>' + esc(q.explain) : ''}</div>`;
      finish(ok, zhOf(q.options[k]));
    });
    startTimer(q, () => {
      $('#qbody').querySelectorAll('.opt').forEach((x, j) => { x.disabled = true; if (j === q.answer) x.classList.add('right'); });
      $('#qfb').innerHTML = `<div class="feedback bad">⏰ Hết giờ! Đáp án: <b>${esc(tpl(zhOf(q.options[q.answer])))}</b></div>`;
      finish(false, '(hết giờ)');
    });
  };
  // Câu tự gõ: nghe viết (so khớp chữ) hoặc dịch (AI chấm nếu có key)
  const norm = x => String(x).replace(/[\s，。？！、,.?!“”"'：:；;…]/g, '');
  const typeQ = q => {
    $('#qbody').innerHTML = `<div class="compose"><textarea id="tans" rows="2" placeholder="用中文写… Gõ tiếng Trung"></textarea>
      <div class="row compose-btns"><button class="btn small right" id="tchk">Kiểm tra</button></div><div id="aiStatus"></div></div>`;
    const ta = $('#tans'); ta.focus();
    ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#tchk').click(); } };
    $('#tchk').onclick = async () => {
      const ans = ta.value.trim();
      if (!ans) return;
      ta.disabled = $('#tchk').disabled = true;
      let ok = norm(ans) === norm(q.answer) || (q.alts || []).some(x => norm(x) === norm(ans)), extra = '';
      if (!ok && q.check === 'ai' && S.ai) {
        $('#aiStatus').innerHTML = `<div class="feedback">⏳ ${mentor().name} đang chấm…</div>`;
        try { const r = await AI.gradeSentence(S.ai, { meaning: q.meaning || q.vi, reference: q.answer, answer: ans }); save(); ok = !!r.correct; extra = `<div class="mine"><div class="lbl">Câu tự nhiên hơn</div>${line({ zh: r.corrected_zh, py: r.corrected_py }, false)}<div class="fb">🧑‍🏫 ${esc(r.feedback_vi)}</div></div>`; }
        catch (e) { extra = `<div class="vi">(Không chấm được bằng AI: ${aiErrText(e)} — đã so với đáp án mẫu.)</div>`; }
      }
      $('#aiStatus').innerHTML = '';
      $('#qfb').innerHTML = `<div class="feedback ${ok ? 'good' : 'bad'}">${ok ? '✓ Đạt!' : '✗ Chưa đúng.'} Đáp án mẫu: ${answerLine(q)}</div>${extra}`;
      finish(ok, ans);
    };
  };
  const orderQ = q => tileBoard(q.tiles, got => {
    const ok = got === q.answer;
    $('#qbody').querySelectorAll('button').forEach(b => b.disabled = true);
    $('#qfb').innerHTML = `<div class="feedback ${ok ? 'good' : 'bad'}">${ok ? '✓ Chính xác!' : '✗ Chưa đúng.'} Câu đúng: ${answerLine(q)}</div>`;
    finish(ok);
  });
  render();
}

// ---------- Sổ lỗi sai ----------
function addMistake(x) {
  const key = JSON.stringify(x.kind === 'quiz' ? [x.q.q, x.q.zh, x.q.audio, x.q.vi] : [x.said, x.node]);
  S.mistakes = S.mistakes.filter(m => m.key !== key);
  S.mistakes.unshift(Object.assign(x, { key, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: Date.now() }));
  S.mistakes = S.mistakes.slice(0, 200);
  save(); applyOpts();
}

// Bảng kết quả sau mỗi bài học / bài đánh giá
function resultCard(title, correct, total, passed, msgOk, msgNo, retryAct, retryArg, gained) {
  view.innerHTML = `
  <div class="quiz"><div class="card" style="text-align:center">
    <img src="${meImg(passed ? 'hoan-thanh' : 'hoang-hot')}" style="height:200px">
    <h1>${esc(title)}</h1>
    <p style="font-size:22px"><b>${correct}/${total}</b> câu đúng</p>
    <p>${passed ? msgOk : msgNo}${gained ? ` <b>+${gained} 🪙</b>` : ''}</p>
    <div class="row" style="justify-content:center">
      <button class="btn ghost" data-act="${retryAct}" data-arg="${retryArg}">Làm lại</button>
      <button class="btn" data-act="home">Về trung tâm đào tạo</button>
    </div>
  </div></div>`;
}

// ---------- Bài học ----------
SCREENS.lesson = id => {
  const L = C.lessons.find(l => l.id === id);
  if (!lessonOpen(L)) return go('hub');
  let body = '';
  if (L.words) body = `<div class="words">${L.words.map(w => `
    <div class="card word"><div class="big">${esc(w.zh)}${say(w.zh)}</div><div class="py">${esc(w.py)}</div><div class="vi"><b>${esc(w.vi)}</b></div>
    <div class="ex">${hz(w.ex)}${say(w.ex)}<div class="py">${esc(w.exPy)}</div><div class="vi">${esc(w.exVi)}</div></div></div>`).join('')}</div>`;
  if (L.patterns) body += `${L.words ? '<h2>Mẫu câu</h2>' : ''}<div class="words">${L.patterns.map(p => `
    <div class="card pattern"><div class="form">${esc(p.form)}</div><div class="vi"><b>${esc(p.use)}</b></div>
    <div class="ex" style="margin-top:10px">${line({ zh: p.ex, py: p.exPy, vi: p.exVi }, false)}</div></div>`).join('')}</div>`;
  if (L.steps) body = `<h2>Quy trình 6 bước</h2><div class="steps">${L.steps.map(s => `
    <div class="card"><div class="zh">${hz(s.zh)}${say(s.zh)}</div><div class="py">${esc(s.py)}</div><div class="vi">${esc(s.vi)}</div></div>`).join('')}</div>
    <h2>Nguyên tắc vàng</h2><div class="tips">${L.tips.map(t => `<div class="card"><b>${esc(t.t)}</b><div>${hz(t.d)}</div></div>`).join('')}</div>`;
  if (L.checklist) body += `<h2>✅ Bảng kiểm tra từng giai đoạn <small class="vi">· ⚠️ = phải kiểm tra thật kỹ · bấm vào ô để đánh dấu</small></h2>
    <div class="checklist">${L.checklist.map((g, gi) => `<div class="card stage-ck"><div class="ck-head">${zp({ zh: g.zh, py: g.py })}<span class="vi">${esc(g.vi)}</span></div>
      ${g.items.map((it, ii) => { const k = `${L.id}:${gi}:${ii}`; return `<label class="ck ${it.key ? 'key' : ''}"><input type="checkbox" data-ck="${k}" ${(S.checks || {})[k] ? 'checked' : ''}><span>${it.key ? '⚠️ ' : ''}${hz(it.d)}</span></label>`; }).join('')}</div>`).join('')}</div>`;
  view.innerHTML = `
    <div class="row"><div><h1>${esc(L.title)}</h1><p class="sub">${esc(L.vi)}</p></div>
    </div>
    <div class="levels">${levelButtons(id)}</div>
    ${body}
    <h2>Luyện tập <small class="vi">· qua cấp trước (≥ 60%) để mở cấp sau</small></h2>
    <div class="levels">${levelButtons(id)}</div>
    <div class="row" style="margin-top:20px"><button class="btn ghost" data-act="home">← Trung tâm</button></div>`;
  view.querySelectorAll('[data-ck]').forEach(x => x.onchange = () => { S.checks = S.checks || {}; S.checks[x.dataset.ck] = x.checked; save(); });
  guide(esc(L.intro));
};

// Câu hỏi về bảng kiểm tra (bài 3)
const checklistQuestions = () => shuffle([
  { type: 'mc', q: 'Trước khi ký hợp đồng, việc nào BẮT BUỘC phải làm?', options: ['Ký ngay cho kịp tiến độ', 'Đối chiếu từng con số trong hợp đồng với email xác nhận, rồi 汇报 sếp', 'Chỉ cần xem tổng tiền'], answer: 1 },
  { type: 'mc', q: 'Hàng tới có 2 thùng bị rách. Em nên làm gì trước khi ký nhận?', options: ['Ký trước, nói sau', 'Chụp ảnh, ghi rõ lên phiếu giao hàng rồi mới ký', 'Trả lại toàn bộ lô hàng'], answer: 1 },
  { type: 'mc', q: 'Khi nhận nhiệm vụ, thông tin nào KHÔNG cần hỏi?', options: ['Số lượng và ngân sách', 'Thời hạn cần hàng', 'Màu áo của nhà cung cấp'], answer: 2 },
]).slice(0, 2);
function lessonQuestions(L) {
  if (L.quiz) return L.quiz;
  if (L.words) {
    // Tự sinh: xen kẽ câu chọn nghĩa và câu chọn chữ Hán
    return shuffle(L.words).slice(0, 6).map((w, k) => {
      const others = shuffle(L.words.filter(x => x !== w)).slice(0, 3);
      const opts = shuffle([w, ...others]);
      return k % 2 === 0
        ? { type: 'mc', q: 'Từ này nghĩa là gì?', zh: w.zh, py: w.py, audio: w.zh, options: opts.map(o => o.vi), answer: opts.indexOf(w) }
        : { type: 'mc', q: `Từ nào nghĩa là "${w.vi}"?`, options: opts.map(o => ({ zh: o.zh, py: o.py })), answer: opts.indexOf(w) };
    });
  }
  if (L.steps) return [...checklistQuestions(), { type: 'order', q: 'Sắp xếp 6 bước của quy trình thu mua theo đúng thứ tự:', tiles: L.steps.map(s => ({ zh: s.zh, py: s.py })), answer: L.steps.map(s => s.zh).join('') },
    { type: 'mc', q: 'Báo giá A rẻ nhất nhưng không có 质检报告. Em nên làm gì?', options: ['Chọn A ngay vì rẻ nhất', 'Cân nhắc cả chất lượng và thời hạn, không chỉ nhìn giá', 'Bỏ qua bước so sánh'], answer: 1 },
    { type: 'mc', q: 'Em biết nhà C giao hàng nhanh hơn nhà B. Dùng thông tin đó thế nào khi đàm phán với B?', options: ['Bịa thêm là C còn rẻ hơn B', 'Nói đúng sự thật về điều kiện của C để đề nghị B cải thiện', 'Không nhắc tới, sợ B phật ý'], answer: 1 },
    { type: 'mc', q: 'Giá cuối cùng vẫn cao hơn ngân sách. Việc đúng là gì?', options: ['Tự quyết cho nhanh', 'Báo cáo số liệu và 请示 sếp', 'Giấu sếp'], answer: 1 }];
}
// ---------- Luyện tập 3 cấp: 初级 trắc nghiệm + nghe · 中级 nghe chọn chữ, dịch chọn câu, điền từ, phản xạ · 高级 phản xạ nhanh, nghe viết, tự dịch ----------
const LV = { 1: ['初级', 'Cơ bản', 'Trắc nghiệm và nghe'], 2: ['中级', 'Trung bình', 'Nghe chọn chữ, dịch, điền từ, phản xạ 8 giây'], 3: ['高级', 'Nâng cao', 'Phản xạ 5 giây, nghe viết, tự dịch (AI chấm)'] };
const levelOpen = (id, lv) => DEV || lv === 1 || ((S.practice[id] || {})[lv - 1] || 0) >= 60;
function levelButtons(id) {
  return [1, 2, 3].map(lv => {
    const sc = (S.practice[id] || {})[lv], open = levelOpen(id, lv);
    return `<button class="lvl ${sc >= 60 ? 'done' : ''}" data-act="practice" data-arg="${id}:${lv}" ${open ? '' : 'disabled'}>
      <b>${LV[lv][0]}</b> <span class="py">${['', 'chūjí', 'zhōngjí', 'gāojí'][lv]}</span><span class="vi">${LV[lv][1]} · ${LV[lv][2]}</span>
      <i>${open ? (sc !== undefined ? sc + '%' : '▶') : '🔒'}</i></button>`;
  }).join('');
}
// Mỗi bài cung cấp một "kho" mục để sinh câu hỏi
function poolOf(L) {
  if (L.words) return L.words.map(w => ({ zh: w.zh, py: w.py, vi: w.vi, ex: { zh: w.ex, py: w.exPy, vi: w.exVi }, word: true }));
  if (L.patterns) return L.patterns.map(p => ({ zh: p.ex, py: p.exPy, vi: p.exVi, sentence: true }));
  return L.steps.map(s => ({ zh: s.zh, py: s.py, vi: s.vi.split(':')[0] }));
}
function practiceQuestions(L, lv) {
  const P = poolOf(L), take = n => shuffle(P).slice(0, n);
  const opts = it => { const o = shuffle([it, ...shuffle(P.filter(x => x !== it)).slice(0, 3)]); return { o, ans: o.indexOf(it) }; };
  const unit = P[0].sentence ? 'Câu' : 'Từ';
  if (lv === 1) {
    const base = lessonQuestions(L).slice(0, 6);
    const listen = take(2).map(it => { const { o, ans } = opts(it); return { type: 'mc', q: '🔊 Nghe và chọn nghĩa đúng:', audio: it.zh, options: o.map(x => x.vi), answer: ans }; });
    return [...base, ...listen];
  }
  if (lv === 2) {
    const qs = [];
    take(3).forEach(it => { const { o, ans } = opts(it); qs.push({ type: 'mc', q: '🔊 Nghe và chọn chữ Hán đúng:', audio: it.zh, options: o.map(x => ({ zh: x.zh })), answer: ans }); });
    take(2).forEach(it => { const { o, ans } = opts(it); qs.push({ type: 'mc', q: `${unit} nào có nghĩa: "${it.vi}"?`, options: o.map(x => ({ zh: x.zh })), answer: ans }); });
    if (P[0].word) take(2).forEach(it => {
      const { o, ans } = opts(it);
      if (it.ex.zh.includes(it.zh)) qs.push({ type: 'mc', q: '✏️ Điền từ còn thiếu:', zh: it.ex.zh.replace(it.zh, '______'), vi: it.ex.vi, options: o.map(x => ({ zh: x.zh, py: x.py })), answer: ans });
    });
    else take(2).forEach(it => { const { o, ans } = opts(it); qs.push({ type: 'mc', q: '🔁 Dịch sang tiếng Việt:', zh: it.zh, py: it.py, options: o.map(x => x.vi), answer: ans }); });
    take(2).forEach(it => { const { o, ans } = opts(it); qs.push({ type: 'mc', time: 8, q: '⚡ Phản xạ (8 giây): nghĩa là gì?', zh: it.zh, options: o.map(x => x.vi), answer: ans }); });
    return shuffle(qs);
  }
  const qs = [];
  take(2).forEach(it => { const { o, ans } = opts(it); qs.push({ type: 'mc', time: 5, q: '⚡ Nghe và chọn nghĩa thật nhanh (5 giây):', audio: it.zh, options: o.map(x => x.vi), answer: ans }); });
  if (!P[0].sentence) take(2).forEach(it => qs.push({ type: 'type', q: '✍️ Nghe và viết chữ Hán:', audio: it.zh, answer: it.zh, answerPy: it.py, check: 'exact' }));
  take(2).forEach(it => { const src = it.ex || it; qs.push({ type: 'type', q: '🔁 Dịch sang tiếng Trung:', vi: src.vi, answer: src.zh, answerPy: src.py, meaning: src.vi, check: 'ai' }); });
  take(1).forEach(it => { const { o, ans } = opts(it); qs.push({ type: 'mc', time: 4, q: '⚡ Phản xạ (4 giây):', zh: it.zh, options: o.map(x => x.vi), answer: ans }); });
  return qs;
}
ACT.practice = arg => {
  const [id, lvs] = arg.split(':'), lv = +lvs || 1, L = C.lessons.find(l => l.id === id);
  runQuiz({ title: `${L.title} · ${LV[lv][0]}`, sub: `Luyện tập ${LV[lv][1]} · ${LV[lv][2]}`, questions: practiceQuestions(L, lv), onDone: (c, t) => {
    const pct = Math.round(c / t * 100), ok = pct >= 60;
    S.practice[id] = S.practice[id] || {};
    S.practice[id][lv] = Math.max(S.practice[id][lv] || 0, pct);
    let gained = 0;
    if (ok) { if (lv === 1) S.lessons[id] = true; gained = award(`practice:${id}:${lv}`, lv * 40 + 20); }
    save();
    resultCard(`${L.title} · ${LV[lv][0]}`, c, t, ok, lv < 3 ? `Qua cấp ${LV[lv][1]}! Cấp tiếp theo đã mở. 🎉` : 'Xuất sắc! Em đã qua cấp Nâng cao. 🎉', 'Cần đúng ít nhất 60%. Câu sai đã được ghi vào 📕 sổ lỗi sai.', 'practice', arg, gained);
    applyOpts();
    guide(ok ? (lv === 1 && allLessonsDone() ? 'Xong cả 3 bài rồi! Giờ em có thể làm <b>bài đánh giá năng lực</b>.' : 'Giỏi lắm! Thử cấp khó hơn hoặc học bài tiếp theo nhé.') : 'Không sao, mở 📕 sổ lỗi sai trên thanh trên cùng để ôn lại các câu sai nhé.', ok ? 'hoan-thanh' : 'nghi-ngo');
  } });
  guide(lv === 1 ? 'Bình tĩnh làm từng câu. Câu nào có 🔊 thì bấm để nghe lại.' : lv === 2 ? 'Cấp Trung bình: có câu nghe không có chữ, và câu phản xạ tính giờ.' : 'Cấp Nâng cao: phản xạ nhanh, nghe viết và tự dịch. Gõ tiếng Trung bằng bộ gõ pinyin của máy.');
};
// Giữ tên cũ: "Luyện tập" của mỗi bài = cấp Cơ bản
ACT.lessonQuiz = id => ACT.practice(id + ':1');
// ---------- Sổ từ ôn tập ----------
SCREENS.notebook = () => {
  const W = Object.values(S.notebook).sort((x, y) => y.at - x.at);
  view.innerHTML = `
  <div class="row"><div><h1>📒 生词本 <small class="py">shēngcí běn</small></h1><p class="sub">Sổ từ ôn tập · ${W.length} từ · Bấm vào bất kỳ chữ Hán nào trong game rồi bấm <b>＋</b> để thêm từ</p></div>
    <button class="btn right" data-act="reviewWords" ${W.length ? '' : 'disabled'}>Ôn tập sổ từ ▶</button></div>
  ${W.length ? `<div class="words">${W.map(w => `<div class="card word">
      <div class="row"><div class="big">${esc(w.zh)}${say(w.zh)}</div><button class="btn ghost small right" data-act="addWord" data-arg="${esc(w.zh)}" title="Bỏ khỏi sổ">✕</button></div>
      <div class="py">${esc(w.py)}</div><div class="vi"><b>${esc(w.vi)}</b></div>
      ${w.ex ? `<div class="ex">${hz(w.ex.zh)}${say(w.ex.zh)}<div class="py">${esc(tpl(w.ex.py || ''))}</div><div class="vi">${esc(tpl(w.ex.vi || ''))}</div></div>` : ''}</div>`).join('')}</div>`
    : '<div class="card empty">Sổ từ đang trống. Trong bài học hay hội thoại, bấm vào một từ tiếng Trung để xem nghĩa, rồi bấm <b>＋</b> để lưu lại ôn tập.</div>'}
  <div class="row" style="margin-top:20px"><button class="btn ghost" data-act="home">← Trung tâm</button></div>`;
  guide(W.length ? 'Ôn tập đều đặn mỗi ngày một chút sẽ nhớ lâu hơn học dồn đấy!' : 'Em thử bấm vào một từ trong bài học xem nhé.');
};
ACT.reviewWords = () => {
  const W = shuffle(Object.values(S.notebook)).slice(0, 10);
  const extra = Object.values(DICT);
  const qs = W.map((w, k) => {
    const others = shuffle([...Object.values(S.notebook), ...extra].filter(x => x.zh !== w.zh && x.vi !== w.vi)).slice(0, 3);
    const o = shuffle([w, ...others]);
    return k % 3 === 0 ? { type: 'mc', q: '🔊 Nghe và chọn nghĩa đúng:', audio: w.zh, options: o.map(x => x.vi), answer: o.indexOf(w) }
      : k % 3 === 1 ? { type: 'mc', q: `Từ nào nghĩa là "${w.vi}"?`, options: o.map(x => ({ zh: x.zh })), answer: o.indexOf(w) }
      : { type: 'mc', q: 'Từ này nghĩa là gì?', zh: w.zh, py: w.py, options: o.map(x => x.vi), answer: o.indexOf(w) };
  });
  runQuiz({ title: '📒 Ôn tập sổ từ', sub: `${qs.length} câu`, questions: qs, onDone: (c, t) => {
    const gained = c / t >= .8 ? award('review:' + today, 20) : 0;
    resultCard('📒 Ôn tập sổ từ', c, t, c / t >= .6, 'Nhớ tốt lắm!', 'Ôn thêm vài lần nữa nhé.', 'reviewWords', '', gained); applyOpts();
  } });
};

// ---------- Sổ lỗi sai ----------
SCREENS.mistakes = () => {
  const Q = S.mistakes.filter(x => x.kind === 'quiz'), Mi = S.mistakes.filter(x => x.kind === 'mission');
  const fmtQ = x => x.q.zh ? hz(x.q.zh) : esc(x.q.q || '');
  const right = q => q.type === 'type' || q.type === 'order' ? q.answer : zhOf(q.options[q.answer]);
  view.innerHTML = `
  <div class="row"><div><h1>📕 错题本 <small class="py">cuòtí běn</small></h1><p class="sub">Sổ lỗi sai · câu nào làm lại đúng sẽ tự xoá khỏi sổ</p></div>
    <button class="btn right" data-act="reviewMistakes" ${Q.length ? '' : 'disabled'}>Làm lại các câu sai (${Q.length}) ▶</button></div>
  <h2>Bài tập <small class="vi">· ${Q.length} câu</small></h2>
  ${Q.length ? `<div class="mk-list">${Q.map(x => `<div class="card mk"><div class="vi">${esc(x.src)}</div>
      <div class="mk-q">${esc(x.q.q || '')} ${x.q.audio ? say(x.q.audio) : ''}</div>${x.q.zh ? `<div class="zh">${fmtQ(x)}</div>` : ''}${x.q.vi ? `<div class="vi">${esc(x.q.vi)}</div>` : ''}
      <div class="mk-a">❌ <span>${esc(x.given || '—')}</span> → ✅ <b>${esc(tpl(right(x.q)))}</b></div></div>`).join('')}</div>` : '<div class="card empty">Chưa có câu sai nào. Giỏi lắm!</div>'}
  <h2>Hội thoại trong nhiệm vụ <small class="vi">· ${Mi.length} lượt chưa tốt</small></h2>
  ${Mi.length ? `<div class="mk-list">${Mi.map(x => `<div class="card mk"><div class="row"><span class="vi">${esc(x.src)}</span><button class="btn ghost small right" data-act="dropMistake" data-arg="${x.id}">✓ Đã hiểu</button></div>
      <div class="mk-a">❌ Em đã nói: <span>${esc(x.said)}</span></div>
      ${x.fix ? `<div class="vi">Câu sửa: ${esc(x.fix)}</div>` : ''}
      <div class="mk-better">✅ Nên nói: ${line(x.better, false)}</div>
      <div class="vi">💡 ${esc(x.note)}</div></div>`).join('')}</div>` : '<div class="card empty">Chưa có lượt hội thoại nào cần xem lại.</div>'}
  <div class="row" style="margin-top:20px"><button class="btn ghost" data-act="home">← Trung tâm</button></div>`;
  guide(S.mistakes.length ? 'Sai là cách học nhanh nhất! Làm lại cho tới khi sổ trống nhé.' : 'Sổ lỗi sai trống trơn. Tuyệt vời!', S.mistakes.length ? 'nghi-ngo' : 'hoan-thanh');
};
ACT.dropMistake = id => { S.mistakes = S.mistakes.filter(x => x.id !== id); save(); go('mistakes'); };
ACT.reviewMistakes = () => {
  const list = S.mistakes.filter(x => x.kind === 'quiz').slice(0, 10);
  runQuiz({ title: '📕 Làm lại câu sai', sub: `${list.length} câu`, questions: list.map(x => x.q), track: false,
    onAnswer: (i, ok) => { if (ok) { S.mistakes = S.mistakes.filter(x => x.id !== list[i].id); save(); applyOpts(); } },
    onDone: (c, t) => { resultCard('📕 Làm lại câu sai', c, t, c === t, 'Đã sửa hết các câu sai!', 'Câu còn sai vẫn nằm trong sổ, ôn tiếp nhé.', 'go', 'mistakes', 0); applyOpts(); } });
};

// ---------- Bài đánh giá ----------
SCREENS.test = () => {
  runQuiz({ title: '能力测评', sub: 'Bài đánh giá năng lực', questions: C.test.questions, onDone: (c, t) => {
    const passed = c >= C.test.pass;
    S.test = { score: c, passed: passed || !!(S.test && S.test.passed) }; save();
    const gained = passed ? award('test', 100) : 0;
    resultCard('能力测评', c, t, passed, 'Chúc mừng! Em đã đủ điều kiện nhận nhiệm vụ.', `Cần ${C.test.pass}/${t}. Ôn lại bài học rồi thử lại nhé.`, 'go', 'test', gained);
    applyOpts();
    guide(passed ? `<b>${boss().name}</b> đang chờ em ở phòng họp. Về trung tâm và nhận nhiệm vụ nhé!` : 'Chưa đạt cũng không sao. Cô gợi ý ôn lại <b>Bài 2 · Mẫu câu</b> trước.', passed ? 'hoan-thanh' : 'nghi-ngo');
  } });
  guide('Đây là bài kiểm tra thật, không có gợi ý đâu nhé. Cố lên!');
};

// ================= NHIỆM VỤ =================
const newMission = (mode = 'easy', ch = 'buy') => ({ ch, mode, at: null, phase: 'line', s: { ...(missionSet(ch)[mode] || C.mission).init }, score: 100, me: 'vui-ve', faces: {},
  reply: null, note: null, goNext: null, hinted: {}, sampled: {}, log: [], i: 0 });
const node = () => M.nodes[S.mission.at];
// Sang nút khác: chạy enter/fx của nút mới đúng một lần
function goto(target) {
  useM();
  const m = S.mission;
  const id = val(target, m.s);
  const n = M.nodes[id];
  if (!n) { console.error('Không có nút:', id); return; }
  Object.assign(m, { at: id, phase: 'line', i: 0, ord: null, mine: null, draft: '', fallback: false, busy: false, tries: 0, flags: {}, chk: 0, chkOk: false, qOk: false });
  if (n.enter) n.enter(m.s);
  if (n.fx && n.type !== 'ask') n.fx(m.s);
  if (n.me) m.me = n.me;
  if (n.type === 'say' && n.face) m.faces[n.with] = n.face;
  if (n.type === 'say' && n.who !== 'me' && !n.face) delete m.faces[n.with];
  if (n.type === 'ask') { const l = val(n.line, m.s); if (l) { if (l.face) m.faces[n.with] = l.face; else delete m.faces[n.with]; } }
  save(); go('mission');
}
ACT.startMission = arg => {
  let [ch, mode] = String(arg || '').includes(':') ? arg.split(':') : ['buy', arg];
  mode = MODES[mode] ? mode : 'easy';
  if (mode !== 'easy' && !S.ai && !AI.mock) { guide('Chế độ này cần API Key để AI chấm bài. Em nhập key trước nhé.', 'nghi-ngo'); return go('apikey'); }
  S.mission = newMission(mode, ch); useM(); goto(M.start);
};
ACT.next = () => goto(node().next);
// Thoát nhiệm vụ về bản đồ: tiến độ đã lưu, vào lại toà nhà là chơi tiếp
ACT.exitMission = () => { const done = S.mission && S.mission.at === 'result'; go('hub'); guide(done ? 'Về bản đồ rồi! Chọn toà nhà tiếp theo nhé.' : 'Nhiệm vụ đang làm dở đã được lưu. Vào lại toà nhà đó là chơi tiếp từ chỗ cũ.', 'vui-ve'); };
const penalty = n => { S.mission.score = Math.max(0, S.mission.score - n); save(); };

const scene = ({ bg, rightKey, speaker }) => {
  const m = S.mission, c = char(rightKey);
  return `<div class="scene ${bg}">${window.ART ? ART.scene(bg, c.scene) : ''}
    <img class="actor left ${speaker === 'right' ? 'dim' : ''}" src="${meImg(m.me)}" alt="">
    <img class="actor right ${speaker === 'left' ? 'dim' : ''}" src="${charImg(rightKey, m.faces[rightKey])}" alt="">
    <span class="nametag left">${me().nick}</span><span class="nametag right">${c.name}<small> · ${esc(c.role)}</small></span>
  </div>`;
};
// Nền cảnh: văn phòng sếp, hoặc cảnh gọi điện chia đôi (bàn mình | chỗ nhà cung cấp)
// nhân vật trong công ty (sếp, xưởng, tài chính) đứng ở văn phòng; nhà cung cấp thì cảnh gọi điện chia đôi
const bgOf = n => n.bg || (n.with === 'boss' || (char(n.with).scene || {}).style === 'office' ? 'boss' : 'call-' + n.with);

// Bảng điều khoản: mỗi kịch bản tự khai báo các ô trong mission.terms
function terms(s) {
  const mood = s.rapport > 0 ? '😊'.repeat(Math.min(3, s.rapport)) : s.rapport < 0 ? '😠'.repeat(Math.min(3, -s.rapport)) : '😐';
  return `<div class="terms">${(M.terms || []).map(t => t.rapport
    ? `<div class="term">好感 · Thiện cảm<b>${mood}</b></div>`
    : `<div class="term ${t.ok(s) ? 'ok' : 'no'}">${t.label}<b>${t.value(s)}</b></div>`).join('')}</div>`;
}

SCREENS.mission = () => {
  useM();
  const m = S.mission;
  if (!m || !m.at) return go('hub');
  const n = node(), s = m.s;
  let firstOpen = true;
  const tasks = `<div class="tasks"><span class="tasks-title">任务</span>${M.tasks.map((t, k) => {
    const done = !!t.done(s), now = !done && firstOpen; if (!done) firstOpen = false;
    return `<span class="task ${done ? 'done' : now ? 'now' : ''}"><i>${done ? '✓' : k + 1}</i><span class="zp"><span class="hz">${t.zh}</span><span class="py">${t.py}</span></span><small class="vi">${t.vi}</small></span>`;
  }).join('')}</div>`;
  const head = (zh, py, vi) => `<div class="row"><div><h1>${zh} <small class="py">${py}</small></h1><p class="sub">${vi}</p></div><span class="right head-tools"><button class="btn ghost small" data-act="exitMission" title="Tiến độ được lưu, quay lại lúc nào cũng được">← Bản đồ</button><span class="score">⭐ ${m.score}</span></span></div>${tasks}${(M.showTerms ? M.showTerms(s) : s.calledB) ? terms(s) : ''}`;
  const g = (fallback, mood) => guide(val(n.guide, s) || fallback || '', mood);
  ({ say: viewSay, ask: viewAsk, check: viewCheck, menu: viewMenu, quotes: viewQuotes, build: viewBuild, read: viewRead, card: viewCard, email: viewEmail, result: viewResult })[n.type](n, m, s, head, g);
};

function viewSay(n, m, s, head, g) {
  const mine = n.who === 'me';
  view.innerHTML = (n.place ? head(n.place.zh, n.place.py, n.place.vi + ' · ' + char(n.with).name) : head(n.with === 'boss' ? '办公室' : '电话', n.with === 'boss' ? 'bàngōngshì' : 'diànhuà', n.with === 'boss' ? `Văn phòng · ${boss().name}` : `Cuộc gọi · ${char(n.with).name}`)) +
    scene({ bg: bgOf(n), rightKey: n.with, speaker: mine ? 'left' : 'right' }) +
    `<div class="dialog"><div class="who">${mine ? me().nick : char(n.who).name}</div>${line(n)}
     <div class="row" style="margin-top:10px"><button class="btn right" data-act="next">Tiếp →</button></div></div>`;
  setTimeout(() => speak(tpl(n.zh)), 250);
  g('');
}

function viewAsk(n, m, s, head, g) {
  const c = char(n.with);
  const shown = m.phase === 'reply' ? m.reply : (val(n.line, s) || m.reply);
  // Xáo thứ tự lựa chọn một lần cho mỗi lượt, để câu tốt nhất không luôn nằm đầu
  if (!m.ord) { m.ord = shuffle(n.choices.map((_, k) => k)); save(); }
  const choices = m.ord.map(k => ({ ch: n.choices[k], k })).filter(x => !x.ch.show || x.ch.show(s));
  view.innerHTML = (n.place ? head(n.place.zh, n.place.py, `${n.place.vi} · nói chuyện với ${c.name} · ${c.role}`) : head(n.with === 'boss' ? '汇报' : '谈判', n.with === 'boss' ? 'huìbào' : 'tánpàn', n.with === 'boss' ? `Báo cáo với ${c.name}` : `Gọi điện cho ${c.name} · ${c.role}`)) +
    scene({ bg: bgOf(n), rightKey: n.with, speaker: 'right' }) +
    `<div class="dialog"><div class="who">${c.name}</div>${line(shown)}
     ${m.phase === 'line' && m.mode !== 'easy' && !m.fallback ? composeBox(n, m, s)
      : m.phase === 'line' ? `<div class="choices">${choices.map(({ ch, k }) => `
        <button class="choice" data-act="choose" data-arg="${k}"><div class="zh">${hz(ch.zh)}</div><div class="py">${esc(tpl(ch.py))}</div><div class="vi">${esc(tpl(ch.vi))}</div>${notes(ch.zh)}</button>`).join('')}</div>
        <div class="row" style="margin-top:10px"><button class="btn ghost small" data-act="hint" ${m.hinted[m.at] ? 'disabled' : ''}>💡 问${mentor().name} · ${hintCost()} 🪙</button></div>`
      : `${m.mine ? mineCard(m.mine) : ''}<div class="row" style="margin-top:10px"><button class="btn right" data-act="askNext">Tiếp →</button></div>`}
    </div>`;
  setTimeout(() => speak(tpl(shown.zh)), 250);
  if (m.phase === 'line' && m.mode !== 'easy' && !m.fallback) { setupCompose(); guide(m.hinted[m.at] ? '💡 ' + esc(val(n.hint, s)) : m.mode === 'hard' ? 'Tự xử lý tình huống bằng tiếng Trung. Mỗi gợi ý ở chế độ Khó tốn <b>120 🪙</b>.' : 'Tự viết câu trả lời bằng tiếng Trung để đạt <b>mục tiêu</b>. Bí thì bấm <b>💡 Gợi ý</b> hoặc <b>💬 Câu mẫu</b> (70 🪙 mỗi lần).', m.hinted[m.at] ? 'nghi-ngo' : 'vui-ve'); }
  else if (m.phase === 'line') {
    if (m.hinted[m.at]) guide('💡 ' + esc(val(n.hint, s)), 'nghi-ngo');
    else g('Đọc kỹ các lựa chọn. Cần gợi ý thì bấm <b>💡</b> (20 🪙). Hãy tự suy nghĩ trước đã nhé!');
  } else guide(`${m.note.grade === 'good' ? '✅' : m.note.grade === 'ok' ? '🟡' : '❌'} ${esc(m.note.text)}`, m.note.grade === 'good' ? 'hoan-thanh' : m.note.grade === 'ok' ? 'nghi-ngo' : 'hoang-hot');
}
ACT.hint = () => {
  const c = hintCost();
  if (S.points < c) { guide(`Em chưa đủ ${c} 🪙 để xin gợi ý. Luyện tập ở 培训中心 hoặc ôn sổ từ để kiếm thêm nhé.`, 'nghi-ngo'); return; }
  S.points -= c; S.mission.hinted[S.mission.at] = true; save(); go('mission');
};
// ---------- Chế độ Vừa: khung tự trả lời ----------
const bestChoice = (n, s) => n.choices.find(c => c.grade === 'good' && (!c.show || c.show(s))) || n.choices[0];
function composeBox(n, m, s) {
  const H = (M.mid || {})[m.at] || { goal: 'Trả lời phù hợp với tình huống.', vocab: [] };
  const sample = m.sampled[m.at] && bestChoice(n, s);
  return `<div class="compose">
    ${m.mode === 'hard' && !m.hinted[m.at] ? '<div class="goal">🧩 <b>Tự xử lý:</b> nghĩ xem nên nói gì để vừa đúng quy định công ty, vừa giữ quan hệ. Cần định hướng thì mở 💡 Gợi ý.</div>' : `<div class="goal">🎯 <b>Mục tiêu:</b> ${esc(tpl(H.goal))}</div>`}
    ${m.hinted[m.at] ? `<div class="hintbox">${H.pattern ? `<div>📐 <b>Mẫu câu:</b> ${zp(H.pattern)}</div>` : ''}
      <div class="chips">📚 ${(H.vocab || []).map(v => `<span class="chip">${zp(v)}</span>`).join('')}</div></div>` : ''}
    ${sample ? `<div class="hintbox sample">💬 <b>Câu mẫu:</b> ${line({ zh: sample.zh, py: sample.py, vi: sample.vi }, false)}</div>` : ''}
    <textarea id="ans" rows="2" placeholder="用中文回答…  Gõ tiếng Trung, hoặc bấm 🎤 để nói">${esc(m.draft || '')}</textarea>
    <div class="row compose-btns">
      <button class="btn ghost small" id="mic" type="button">🎤 Nói</button>
      <button class="btn ghost small" data-act="midHint" ${m.hinted[m.at] ? 'disabled' : ''}>💡 Gợi ý · ${hintCost()} 🪙</button>
      <button class="btn ghost small" data-act="midSample" ${m.sampled[m.at] ? 'disabled' : ''}>💬 Câu mẫu · ${hintCost()} 🪙</button>
      <button class="btn right" data-act="submitAnswer">Gửi ➤</button>
    </div>
    <div id="aiStatus"></div>
  </div>`;
}
const mineCard = x => `<div class="mine">
  <div class="lbl">Em đã nói</div><div class="said">${esc(x.answer)}</div>
  ${x.zh ? `<div class="lbl">Câu tự nhiên hơn</div>${line({ zh: x.zh, py: x.py }, false)}` : ''}
  ${x.fb ? `<div class="fb">🧑‍🏫 ${esc(x.fb)}</div>` : ''}</div>`;
// Ô nhập + nút ghi âm (Web Speech API, chạy trên Chrome và Edge)
function setupCompose() {
  const ta = $('#ans'), btn = $('#mic');
  if (!ta) return;
  ta.oninput = () => { S.mission.draft = ta.value; };
  ta.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ACT.submitAnswer(); };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { btn.disabled = true; btn.title = 'Trình duyệt này không hỗ trợ ghi âm. Hãy dùng Chrome hoặc Edge.'; return; }
  let rec = null;
  btn.onclick = () => {
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = 'zh-CN'; rec.interimResults = true;
    const base = ta.value.trim();
    rec.onresult = e => { let t = ''; for (const r of e.results) t += r[0].transcript; ta.value = (base ? base + ' ' : '') + t; S.mission.draft = ta.value; };
    rec.onerror = e => guide(e.error === 'not-allowed' ? 'Trình duyệt chưa cho dùng micro. Em bấm vào biểu tượng 🔒 cạnh địa chỉ trang để cho phép nhé.' : 'Không nghe rõ (' + esc(e.error) + '). Em thử nói lại nhé.', 'nghi-ngo');
    rec.onend = () => { rec = null; btn.classList.remove('rec'); btn.textContent = '🎤 Nói'; save(); };
    rec.start(); btn.classList.add('rec'); btn.textContent = '⏹ Dừng';
  };
}
// Giá gợi ý: Vừa = 💡 miễn phí, 💬 2 🪙; Khó = 💡 2 🪙, 💬 4 🪙
// Mỗi lần dùng gợi ý (💡 hoặc 💬): Dễ 20, Vừa 70, Khó 120 🪙, để học viên không ỷ lại vào gợi ý
const HINT_COST = { easy: 20, mid: 70, hard: 120 };
const hintCost = () => HINT_COST[S.mission.mode] || 20;
ACT.midHint = () => {
  const c = hintCost('hint');
  if (S.points < c) { guide(`Em chưa đủ ${c} 🪙. Kiếm thêm ở bài học, bài luyện tập hoặc chế độ Dễ/Vừa nhé.`, 'nghi-ngo'); return; }
  S.points -= c; S.mission.hinted[S.mission.at] = true; save(); go('mission');
};
ACT.midSample = () => {
  const cost = hintCost('sample');
  if (S.points < cost) { guide(`Em chưa đủ ${cost} 🪙. Làm bài học, bài luyện tập hoặc nhiệm vụ để kiếm thêm.`, 'nghi-ngo'); return; }
  S.points -= cost; S.mission.sampled[S.mission.at] = true; save(); go('mission');
};
const busy = (on, text) => {
  view.querySelectorAll('.compose button, .compose textarea').forEach(b => b.disabled = on);
  if (on) $('#aiStatus').innerHTML = `<div class="feedback">⏳ ${text || mentor().name + ' đang chấm bài…'}</div>`;
};
function showAIError(e) {
  busy(false);
  const m = S.mission;
  $('#aiStatus').innerHTML = `<div class="feedback bad">✗ ${aiErrText(e)}
    <div class="row" style="margin-top:8px">${e && e.kind === 'key' ? '<button class="btn ghost small" data-act="go" data-arg="apikey">Nhập lại key</button>' : ''}
    ${m && node().type === 'ask' ? '<button class="btn ghost small" data-act="useChoices">Chọn đáp án cho lượt này</button>' : ''}</div></div>`;
  reveal('#aiStatus');
}
ACT.useChoices = () => { S.mission.fallback = true; save(); go('mission'); };
ACT.submitAnswer = async () => {
  const m = S.mission, n = node(), s = m.s;
  const answer = ($('#ans').value || '').trim();
  if (answer.length < 2) { guide('Em viết câu trả lời bằng tiếng Trung trước đã nhé.', 'nghi-ngo'); return; }
  if (m.busy) return;
  m.busy = true; m.draft = answer; busy(true);
  const shown = val(n.line, s) || m.reply;
  const visible = n.choices.map((ch, k) => ({ ch, k })).filter(x => !x.ch.show || x.ch.show(s));
  const H = (M.mid || {})[m.at] || {};
  try {
    const r = await AI.gradeTurn(S.ai, {
      situation: M.situation, npc: { zh: tpl(shown.zh), vi: tpl(shown.vi || '') }, goal: tpl(H.goal || ''),
      options: visible.map(x => ({ zh: tpl(x.ch.zh), vi: tpl(x.ch.vi), quality: x.ch.grade })), answer,
    });
    save();
    if (r.off_topic) {
      m.busy = false; busy(false);
      $('#aiStatus').innerHTML = `<div class="feedback bad">🧑‍🏫 ${esc(r.feedback_vi || 'Em trả lời bằng tiếng Trung và bám sát tình huống nhé.')}</div>`;
      reveal('#aiStatus'); return;
    }
    applyChoice(visible[r.matched].k, { grade: r.grade, mine: { answer, zh: r.corrected_zh, py: r.corrected_py, fb: r.feedback_vi } });
  } catch (e) { m.busy = false; save(); showAIError(e); }
};

ACT.choose = k => applyChoice(k);
// Áp dụng một lựa chọn (chế độ Dễ: người học bấm; chế độ Vừa: AI xếp câu tự viết vào lựa chọn gần nhất)
function applyChoice(k, ai) {
  const m = S.mission, n = node(), ch = n.choices[+k], s = m.s;
  if (ch.fx) ch.fx(s);
  m.reply = val(ch.reply, s);
  if (m.reply.face) m.faces[n.with] = m.reply.face; else delete m.faces[n.with];
  m.me = ch.meAfter || ch.me || m.me;
  const grade = ai ? ai.grade : ch.grade;
  m.note = { grade, text: ch.note };
  const delta = ch.score !== undefined ? -ch.score : grade === 'bad' ? 10 : grade === 'ok' ? 3 : 0;
  if (delta) penalty(delta);
  m.mine = ai ? ai.mine : null;
  m.log.push(ai ? { zh: ai.mine.answer, grade, note: ch.note, fix: ai.mine.zh, fb: ai.mine.fb } : { zh: tpl(ch.zh), grade, note: ch.note });
  if (grade !== 'good') {
    const b = bestChoice(n, s);
    addMistake({ kind: 'mission', src: `${M.title} · ${MODES[m.mode]}`, node: m.at, said: ai ? ai.mine.answer : tpl(ch.zh), fix: ai ? ai.mine.zh : '', note: ch.note, better: { zh: tpl(b.zh), py: tpl(b.py), vi: tpl(b.vi) } });
  }
  m.goNext = val(ch.go, s);
  m.phase = 'reply'; m.busy = false; m.draft = ''; save(); go('mission');
}
ACT.askNext = () => goto(S.mission.goNext);

function viewMenu(n, m, s, head, g) {
  const items = n.items.filter(it => !it.show || it.show(s));
  view.innerHTML = head(n.title.zh, n.title.py, n.title.vi) + `
    <div class="menu">${items.map(it => {
      const done = it.done && it.done(s);
      return `<button class="choice menu-item ${done ? 'done' : ''}" data-act="menuGo" data-arg="${n.items.indexOf(it)}" ${done ? 'disabled' : ''}>
        <span class="ico">${done ? '✅' : it.icon || '▶'}</span><span><div class="zh">${esc(tpl(it.zh))}</div><div class="py">${esc(tpl(it.py))}</div><div class="vi">${esc(tpl(it.vi))}${done ? ' · đã gọi' : ''}</div></span></button>`;
    }).join('')}</div>`;
  g('');
}
ACT.menuGo = k => goto(node().items[+k].go);

function viewQuotes(n, m, s, head, g) {
  view.innerHTML = head('比价', 'bǐjià', 'So sánh báo giá') + `
    <p>${esc(n.intro)}</p>
    <div class="table-scroll"><table class="quotes"><tr>${n.cols.map(c => `<th>${zp(c)}</th>`).join('')}</tr>
    ${n.rows.map(r => `<tr>${r.map((c, k) => `<td>${k === 0 ? '<b>' + zp(c) + '</b>' : zp(c)}</td>`).join('')}</tr>`).join('')}</table></div>
    <p class="vi legend">${esc(n.legend)}</p>
    <div class="row" style="margin-top:12px"><button class="btn right" data-act="next">Tiếp: chuẩn bị gọi điện →</button></div>`;
  g('');
}

function viewBuild(n, m, s, head) {
  const item = n.items[m.i];
  if (m.mode === 'mid') return viewBuildMid(n, m, s, head, item);
  view.innerHTML = head('准备', 'zhǔnbèi', `Soạn câu · ${m.i + 1}/${n.items.length}`) + `
    <p>${esc(n.intro)}</p>
    <div class="card"><div class="vi" style="font-size:16px">🎯 ${esc(item.vi)}</div><div id="qbody"></div><div id="qfb"></div></div>`;
  tileBoard(item.tiles, (got, resetBoard) => {
    if (got !== item.answer) { penalty(5); $('#qfb').innerHTML = '<div class="feedback bad">✗ Chưa đúng thứ tự, thử lại nhé (-5 điểm).</div>'; resetBoard(); reveal('#qfb'); return; }
    $('#qbody').querySelectorAll('button').forEach(b => b.disabled = true);
    const last = m.i + 1 >= n.items.length;
    $('#qfb').innerHTML = `<div class="feedback good">✓ ${answerLine(item)}</div>
      <div class="row" style="margin-top:12px"><button class="btn right" id="nx">${last ? 'Xong, bắt đầu gọi điện 📞' : 'Câu tiếp →'}</button></div>`;
    speak(item.answer); reveal('#nx');
    $('#nx').onclick = () => { if (last) goto(n.next); else { m.i++; save(); go('mission'); } };
  });
  guide(esc(n.guides[m.i] || ''), 'nghi-ngo');
}

function viewBuildMid(n, m, s, head, item) {
  const last = m.i + 1 >= n.items.length;
  view.innerHTML = head('准备', 'zhǔnbèi', `Soạn câu · ${m.i + 1}/${n.items.length}`) + `
    <p>Trước khi gọi điện, em tự viết 2 câu then chốt bằng tiếng Trung.</p>
    <div class="card compose">
      <div class="goal">🎯 <b>Viết câu:</b> ${esc(item.vi)}</div>
      ${m.hinted['build' + m.i] ? `<div class="hintbox"><div class="chips">📚 ${shuffle(item.tiles).map(t => `<span class="chip">${zp(t)}</span>`).join('')}</div></div>` : ''}
      ${m.sampled['build' + m.i] ? `<div class="hintbox sample">💬 <b>Câu mẫu:</b> ${answerLine(item)}</div>` : ''}
      ${m.mine ? mineCard(m.mine) + `<div class="row" style="margin-top:12px"><button class="btn right" id="nx">${last ? 'Xong, bắt đầu gọi điện 📞' : 'Câu tiếp →'}</button></div>` : `
      <textarea id="ans" rows="2" placeholder="用中文写…  Gõ tiếng Trung, hoặc bấm 🎤 để nói">${esc(m.draft || '')}</textarea>
      <div class="row compose-btns">
        <button class="btn ghost small" id="mic" type="button">🎤 Nói</button>
        <button class="btn ghost small" data-act="buildHint" ${m.hinted['build' + m.i] ? 'disabled' : ''}>💡 Gợi ý từ · ${hintCost()} 🪙</button>
        <button class="btn ghost small" data-act="buildSample" ${m.sampled['build' + m.i] ? 'disabled' : ''}>💬 Câu mẫu · ${hintCost()} 🪙</button>
        <button class="btn right" data-act="submitBuild">Gửi ➤</button>
      </div>`}
      <div id="aiStatus"></div>
    </div>`;
  if (m.mine) {
    $('#nx').onclick = () => { m.mine = null; if (last) goto(n.next); else { m.i++; save(); go('mission'); } };
    guide(m.mine.ok ? 'Tốt lắm! Câu này sẽ dùng khi gọi điện.' : 'Chưa đạt, nhưng không sao: đọc câu sửa rồi đi tiếp nhé.', m.mine.ok ? 'hoan-thanh' : 'nghi-ngo');
  } else { setupCompose(); guide(m.i === 0 ? 'Gợi ý: câu hỏi giá thường có dạng "请问 + món hàng + 的单价是多少？"' : 'Nhớ mẫu "如果……的话，能不能……？" ở bài 2.', 'nghi-ngo'); }
}
ACT.buildHint = () => {
  const m = S.mission, c = hintCost();
  if (S.points < c) { guide(`Em chưa đủ ${c} 🪙.`, 'nghi-ngo'); return; }
  S.points -= c; m.hinted['build' + m.i] = true; save(); go('mission');
};
ACT.buildSample = () => {
  const m = S.mission;
  const c = hintCost();
  if (S.points < c) { guide(`Em chưa đủ ${c} 🪙.`, 'nghi-ngo'); return; }
  S.points -= c; m.sampled['build' + m.i] = true; save(); go('mission');
};
ACT.submitBuild = async () => {
  const m = S.mission, item = node().items[m.i];
  const answer = ($('#ans').value || '').trim();
  if (answer.length < 2) { guide('Em viết câu bằng tiếng Trung trước đã nhé.', 'nghi-ngo'); return; }
  if (m.busy) return;
  m.busy = true; m.draft = answer; busy(true);
  try {
    const r = await AI.gradeSentence(S.ai, { meaning: item.vi, reference: item.answer, answer });
    m.busy = false; m.tries = (m.tries || 0) + 1;
    if (!r.correct && m.tries < 2) {
      penalty(5); save(); busy(false);
      $('#aiStatus').innerHTML = `<div class="feedback bad">✗ ${esc(r.feedback_vi)} Thử lại nhé (-5 điểm).</div>`;
      reveal('#aiStatus'); return;
    }
    if (!r.correct) penalty(5);
    m.mine = { answer, zh: r.corrected_zh, py: r.corrected_py, fb: r.feedback_vi, ok: r.correct };
    m.tries = 0; m.draft = ''; save(); go('mission');
  } catch (e) { m.busy = false; save(); showAIError(e); }
};

function viewRead(n, m, s, head, g) {
  const d = n.doc;
  view.innerHTML = head('阅读', 'yuèdú', 'Đọc tài liệu') + `
    <p>${esc(n.intro)}</p>
    <div class="doc"><div class="doc-title">${zp(d.title)}</div>
      <table>${d.rows.map(r => `<tr><th>${zp(r[0])}</th>${r.slice(1).map(c => `<td>${zp(c)}</td>`).join('')}</tr>`).join('')}</table>
      <div class="doc-today">📅 ${esc(d.today.zh)}</div></div>
    <div class="card" style="margin-top:16px"><div class="q">${esc(n.q)}</div>
      <div class="opts">${n.options.map((o, k) => `<button class="opt" data-act="readPick" data-arg="${k}">${zp(o)}</button>`).join('')}</div>
      <div id="qfb"></div></div>`;
  g('');
}
ACT.readPick = (k, btn) => {
  const n = node(), ok = +k === n.answer;
  if (!ok) { penalty(5); btn.classList.add('wrong'); btn.disabled = true; $('#qfb').innerHTML = '<div class="feedback bad">✗ Chưa đúng, đọc lại tài liệu nhé (-5 điểm).</div>'; reveal('#qfb'); guide(n.wrongHint || 'Đọc lại từng dòng và so với tiêu chuẩn nhé.', 'nghi-ngo'); return; }
  view.querySelectorAll('.opt').forEach((x, j) => { x.disabled = true; if (j === n.answer) x.classList.add('right'); });
  $('#qfb').innerHTML = `<div class="feedback good">✓ ${esc(n.explain)}</div><div class="row" style="margin-top:12px"><button class="btn right" data-act="next">Tiếp →</button></div>`;
  reveal('#qfb [data-act=next]');
  guide('Tinh mắt lắm! Giờ hãy nói chuyện này với đối tác.', 'hoan-thanh');
};

// ---------- Nút 'check': bấm chọn những mục có vấn đề (giấy tờ / kiện hàng), rồi trả lời câu hỏi ----------
// Bó thép vẽ bằng SVG; bó hỏng có vết móp và dây đai đứt
const bundleArt = bad => `<svg viewBox="0 0 120 80" class="bundle" aria-hidden="true">
  ${[0, 1, 2, 3, 4].map(i => `<rect x="${8 + i * 2}" y="${50 - i * 9}" width="${100 - i * 4}" height="9" rx="2" fill="${i % 2 ? '#C9D2DA' : '#E3E8EC'}" stroke="#5B3A26" stroke-width="2"/>`).join('')}
  <rect x="34" y="12" width="7" height="48" fill="${bad ? '#E9A84A' : '#E9A84A'}" stroke="#5B3A26" stroke-width="1.5"/>
  ${bad ? `<rect x="78" y="12" width="7" height="20" fill="#E9A84A" stroke="#5B3A26" stroke-width="1.5"/><path d="M 78 34 l 4 6 l 4 -4" fill="none" stroke="#5B3A26" stroke-width="2"/>
    <path d="M 92 22 q 8 10 0 22 q -6 -10 0 -22 Z" fill="#8E99A4" stroke="#C8352E" stroke-width="2.5"/><path d="M 20 52 l 8 4 l 6 -6 l 6 5" fill="none" stroke="#C8352E" stroke-width="2.5"/>`
    : '<rect x="78" y="12" width="7" height="48" fill="#E9A84A" stroke="#5B3A26" stroke-width="1.5"/>'}
  <rect x="4" y="66" width="112" height="10" rx="2" fill="#B97A4A" stroke="#5B3A26" stroke-width="2"/></svg>`;
function viewCheck(n, m, s, head, g) {
  const bad = new Set(n.items.map((it, k) => (it.bad ? k : -1)).filter(k => k >= 0));
  const reveal2 = m.chkOk || m.chk >= 2; // sai 2 lần thì hiện đáp án để đi tiếp
  view.innerHTML = head(n.title.zh, n.title.py, n.title.vi) + `
    <p>${esc(n.intro)}</p>
    ${n.ref ? `<div class="chk-ref">📋 ${line(n.ref, false)}</div>` : ''}
    <div class="chk-grid ${n.kind}">${n.items.map((it, k) => {
      const f = !!m.flags[k], show = reveal2 && bad.has(k);
      return `<button class="chk-item ${f ? 'flag' : ''} ${show ? 'bad' : ''}" data-act="chkFlag" data-arg="${k}" ${reveal2 ? 'disabled' : ''}>
        ${n.kind === 'goods' ? bundleArt(it.bad) : `<span class="ico">${it.icon || '📄'}</span>`}
        <span class="txt"><span class="zh">${esc(it.zh)}</span><span class="py">${esc(it.py)}</span><span class="vi">${esc(it.vi)}</span>
        ${show && it.why ? `<span class="why">⚠️ ${esc(it.why)}</span>` : ''}</span>
        ${f ? '<span class="mark">⚠️</span>' : ''}</button>`;
    }).join('')}</div>
    <div id="qfb">${reveal2 ? '' : `<div class="row" style="margin-top:12px"><span class="vi">Đã đánh dấu: <b>${Object.values(m.flags).filter(Boolean).length}</b> mục</span><button class="btn right" data-act="chkSubmit">Xong, kiểm tra ✓</button></div>`}</div>
    ${reveal2 ? `<div class="feedback ${m.chkOk ? 'good' : 'bad'}">${m.chkOk ? '✓' : 'Đáp án:'} ${esc(n.explain || '')}</div>
      ${n.q ? `<div class="card" style="margin-top:14px"><div class="q">${zp({ zh: n.q })}</div>
        <div class="opts">${n.options.map((o, k) => `<button class="opt ${m.qOk && k === n.answer ? 'right' : ''}" data-act="chkPick" data-arg="${k}" ${m.qOk ? 'disabled' : ''}>${zp(o)}</button>`).join('')}</div>
        <div id="qfb2"></div></div>` : ''}
      ${!n.q || m.qOk ? '<div class="row" style="margin-top:12px"><button class="btn right" data-act="chkNext">Tiếp →</button></div>' : ''}` : ''}`;
  g(reveal2 ? (n.q && !m.qOk ? 'Giờ trả lời câu hỏi bên dưới.' : '') : '');
}
ACT.chkFlag = k => { const m = S.mission; m.flags[k] = !m.flags[k]; save(); const y = scrollY; go('mission'); scrollTo(0, y); };
ACT.chkSubmit = () => {
  const m = S.mission, n = node();
  const wrongFlag = n.items.filter((it, k) => !!m.flags[k] !== !!it.bad).length;
  const y = scrollY;
  if (!wrongFlag) { m.chkOk = true; save(); go('mission'); scrollTo(0, y); guide('Tinh mắt lắm!', 'hoan-thanh'); return reveal('#qfb2, [data-act=chkNext]'); }
  penalty(5); m.chk++; save();
  if (m.chk >= 2) { go('mission'); scrollTo(0, y); guide('Chưa đúng. Cô đánh dấu đỏ những mục có vấn đề, em xem kỹ nhé (-5 điểm).', 'nghi-ngo'); return; }
  $('#qfb').insertAdjacentHTML('beforeend', `<div class="feedback bad">✗ Chưa đúng: còn mục có vấn đề chưa đánh dấu, hoặc đánh dấu nhầm mục không có vấn đề (-5 điểm). Xem lại nhé.</div>`);
  reveal('#qfb .feedback'); guide(val(n.wrongHint, m.s) || 'Đối chiếu từng mục với đơn hàng và danh sách giấy tờ ở bài 4.', 'nghi-ngo');
};
ACT.chkPick = (k, btn) => {
  const m = S.mission, n = node();
  if (+k !== n.answer) { penalty(5); btn.classList.add('wrong'); btn.disabled = true; $('#qfb2').innerHTML = '<div class="feedback bad">✗ Chưa đúng, đếm lại nhé (-5 điểm).</div>'; return; }
  m.qOk = true; save(); const y = scrollY; go('mission'); scrollTo(0, y); reveal('[data-act=chkNext]');
};
ACT.chkNext = () => { const n = node(); if (n.onDone) n.onDone(S.mission.s); goto(n.next); };

function viewCard(n, m, s, head, g) {
  view.innerHTML = head('任务卡', 'rènwukǎ', 'Thẻ nhiệm vụ') + `
    <div class="card"><div class="zh">${esc(M.title)}</div><div class="py">${esc(M.py)}</div><div class="vi">${esc(M.vi)}</div>
    <div class="mission-card">${M.card.items.map(([k, v]) => `<div class="term">${esc(k)}<b>${esc(v)}</b></div>`).join('')}</div>
    <p>${tpl(M.card.text)}</p>
    <button class="btn" data-act="next">Bắt đầu →</button></div>`;
  g('');
}

const emailValues = s => M.emailValues(s);
// ---------- Viết email trên "máy tính" ----------
// Dễ: vòng tròn cam chỉ chỗ cần bấm từng bước, chọn người nhận / tiêu đề có sẵn, điền số vào mẫu thư.
// Vừa: không có vòng chỉ dẫn, tự gõ tiêu đề và nội dung, có khung gợi ý nội dung.
// Khó: tự gõ, không có gợi ý.
const PC_LEVEL = { easy: 'guided', mid: 'hint', hard: 'free' };
const pcOf = m => (m.pc = m.pc || { stage: 'desktop', to: null, subj: '', open: '' });
function viewEmail(n, m, s, head, g) {
  const pc = pcOf(m), lv = PC_LEVEL[m.mode] || 'guided', guided = lv === 'guided';
  const ring = cond => (guided && cond ? ' ring' : '');
  const contacts = n.contacts || [{ name: n.to, addr: n.toAddr || '' }];
  const parts = [n.body, ...(s.partial ? [n.partial] : [])];
  const blanks = str => esc(tpl(str)).replace(/\[(\w+)\]/g, (_, k) => `<input data-k="${k}" inputmode="numeric" autocomplete="off">`);
  const now = new Date().toTimeString().slice(0, 5);
  let screen;
  if (pc.stage === 'desktop') {
    screen = `<div class="desk">
      ${[['mail', '📧', '邮箱', 'yóuxiāng'], ['files', '📁', '文件', 'wénjiàn'], ['calc', '🧮', '计算器', 'jìsuànqì'], ['web', '🌐', '浏览器', 'liúlǎnqì'], ['sheet', '📊', '表格', 'biǎogé']].map(([id, ic, zh, py]) =>
        `<button class="app${ring(id === 'mail')}" data-act="pcOpen" data-arg="${id}"><span class="ic">${ic}</span><span class="zp"><span class="hz">${zh}</span><span class="py">${py}</span></span></button>`).join('')}
    </div>`;
  } else {
    const compose = pc.stage === 'compose';
    const step = !pc.to ? 'to' : guided && !pc.subj ? 'subj' : guided && !pc.bodyOpen ? 'body' : 'send';
    const inbox = (n.inbox || []).map(x => `<div class="mrow"><b>${esc(tpl(x.from))}</b><span>${hz(x.subj)}</span><i>${esc(x.time)}</i></div>`).join('');
    const toField = pc.to ? `<span class="chip">${esc(pc.to.name)} &lt;${esc(pc.to.addr)}&gt;</span>`
      : `<button class="fld-btn${ring(step === 'to')}" data-act="pcPick" data-arg="to">${guided ? 'Bấm để chọn người nhận' : 'Chọn người nhận…'}</button>`;
    const subjField = guided
      ? (pc.subj ? `<span>${hz(pc.subj)}</span>` : `<button class="fld-btn${ring(step === 'subj')}" data-act="pcPick" data-arg="subj" ${pc.to ? '' : 'disabled'}>Bấm để chọn tiêu đề</button>`)
      : `<input id="mSubj" placeholder="主题 · Tiêu đề thư" value="${esc(pc.subj)}">`;
    const picker = pc.open === 'to' ? `<div class="picker-list">${contacts.map((c, k) => `<button data-act="pcSet" data-arg="to:${k}"><span><b>${esc(c.name)}</b> · ${esc(c.org || '')}</span><small>${esc(c.addr)}</small></button>`).join('')}</div>`
      : pc.open === 'subj' ? `<div class="picker-list">${(n.subjects || []).map((x, k) => `<button data-act="pcSet" data-arg="subj:${k}">${zp(x)}</button>`).join('')}</div>` : '';
    const body = guided
      ? (pc.bodyOpen ? `<div class="email">${esc(tpl(n.head.zh))}\n${parts.map(p => blanks(p.zh)).join('')}\n${esc(tpl(n.foot.zh))}</div>
          <div class="py">${esc(tpl(n.head.py))} ${parts.map(p => esc(p.py)).join(' ')}</div><div class="vi">${parts.map(p => esc(p.vi)).join(' ')}</div>`
        : `<button class="fld-btn body-btn${ring(step === 'body')}" data-act="pcBody" ${pc.subj ? '' : 'disabled'}>Bấm để viết nội dung thư</button>`)
      : `<textarea id="mBody" rows="7" placeholder="正文 · Nội dung thư (gõ tiếng Trung)">${esc(pc.body || '')}</textarea>`;
    const hintBox = lv === 'hint' ? `<div class="mail-hint"><b>💡 Gợi ý nội dung</b>
        <div>${hz(n.head.zh)}</div>${(n.frames || []).map(f => `<div>${zp(f)}</div>`).join('')}
        <div class="vi">Nhớ ghi đủ các con số: ${mailFacts(n, s).map(f => '<b>' + esc(String(f.value)) + '</b>').join(' · ')}</div></div>` : '';
    screen = `<div class="mailapp">
      <div class="mail-side">
        <button class="compose-btn${ring(!compose)}" data-act="pcCompose">✏️ 写邮件 <small class="py">xiě yóujiàn</small></button>
        <div class="side-item on">📥 收件箱 <b>${(n.inbox || []).length}</b></div><div class="side-item">📤 已发送</div><div class="side-item">📝 草稿</div>
      </div>
      <div class="mail-list"><div class="mail-search">🔍 搜索邮件</div>${inbox}</div>
      ${compose ? `<div class="compose-win">
        <div class="cw-head"><span>新邮件 <small class="py">xīn yóujiàn</small> · <span class="vi-in">Thư mới</span></span><button data-act="pcClose">×</button></div>
        <div class="cw-row"><label>发件人</label><span>${esc(me().nick)} &lt;caigou@xingchen.com&gt;</span></div>
        <div class="cw-row"><label>收件人</label>${toField}</div>
        <div class="cw-row"><label>主题</label>${subjField}</div>
        ${picker}
        <div class="cw-body">${body}</div>
        ${hintBox}
        <div class="cw-foot"><button class="btn send-btn${ring(step === 'send')}" data-act="pcSend">发送 · Gửi ➤</button></div>
      </div>` : ''}
    </div>`;
  }
  view.innerHTML = head('确认', 'quèrèn', 'Email xác nhận') + `
    <p>${esc(n.intro)}</p>
    <div class="pc"><div class="pc-screen">${screen}<div class="taskbar"><span>⭐ 星辰电器 OS</span><span>${now}</span></div></div><div class="pc-stand"></div></div>
    <div id="qfb"></div>`;
  const tip = pc.stage === 'desktop' ? 'Đây là máy tính của em. Mở ứng dụng <b>📧 邮箱</b> (hộp thư) nhé.'
    : pc.stage === 'inbox' ? 'Bấm <b>✏️ 写邮件</b> để viết thư mới.'
    : !pc.to ? 'Chọn <b>收件人</b> (người nhận): gửi cho ai?' : guided && !pc.subj ? 'Chọn <b>主题</b> (tiêu đề) phù hợp.'
    : guided && !pc.bodyOpen ? 'Giờ viết <b>正文</b> (nội dung thư).' : guided ? 'Điền đúng các con số rồi bấm <b>发送</b> (gửi).'
    : lv === 'hint' ? 'Tự viết tiêu đề và nội dung. Khung 💡 bên dưới gợi ý các ý cần có.' : 'Tự viết tiêu đề và nội dung thư xác nhận, nhớ ghi đủ số liệu đã thống nhất.';
  guide(tip, 'vui-ve');
  // giữ lại phần đã gõ khi giao diện vẽ lại
  const sj = $('#mSubj'), bd = $('#mBody');
  if (sj) sj.oninput = () => { pc.subj = sj.value; };
  if (bd) bd.oninput = () => { pc.body = bd.value; };
}
// Các số liệu phải có trong thư: lấy từ các ô [k] của mẫu thư
const mailFacts = (n, s) => {
  const v = emailValues(s), keys = [];
  [n.body, ...(s.partial && n.partial ? [n.partial] : [])].forEach(p => p.zh.replace(/\[(\w+)\]/g, (_, k) => { if (!keys.includes(k)) keys.push(k); }));
  return keys.map(k => ({ key: k, value: v[k] }));
};
ACT.pcOpen = id => {
  const m = S.mission;
  if (id !== 'mail') { guide('Ứng dụng này chưa cần dùng. Thư điện tử nằm trong <b>📧 邮箱</b> nhé.', 'nghi-ngo'); return; }
  pcOf(m).stage = 'inbox'; save(); go('mission');
};
ACT.pcCompose = () => { const pc = pcOf(S.mission); pc.stage = 'compose'; save(); go('mission'); };
ACT.pcClose = () => { const pc = pcOf(S.mission); pc.stage = 'inbox'; pc.open = ''; save(); go('mission'); };
ACT.pcPick = what => { const pc = pcOf(S.mission); pc.open = pc.open === what ? '' : what; go('mission'); };
ACT.pcSet = arg => {
  const m = S.mission, n = node(), pc = pcOf(m), [what, k] = arg.split(':');
  if (what === 'to') {
    const c = (n.contacts || [])[+k];
    if (c.name !== n.to) { penalty(5); pc.open = ''; save(); go('mission'); $('#qfb').innerHTML = `<div class="feedback bad">✗ Thư xác nhận phải gửi cho người đã đàm phán với em: <b>${esc(n.to)}</b> (-5 điểm).</div>`; reveal('#qfb'); return; }
    pc.to = c;
  } else {
    const x = n.subjects[+k];
    if (+k !== (n.subjectAnswer || 0)) { penalty(5); pc.open = ''; save(); go('mission'); $('#qfb').innerHTML = `<div class="feedback bad">✗ Tiêu đề chưa phù hợp với thư xác nhận đơn hàng (-5 điểm).</div>`; reveal('#qfb'); return; }
    pc.subj = x.zh;
  }
  pc.open = ''; save(); go('mission');
};
ACT.pcBody = () => { const pc = pcOf(S.mission); pc.bodyOpen = true; save(); go('mission'); };
ACT.pcSend = () => {
  const m = S.mission, n = node(), s = m.s, pc = pcOf(m), lv = PC_LEVEL[m.mode] || 'guided';
  if (!pc.to) { $('#qfb').innerHTML = '<div class="feedback bad">Chưa có người nhận.</div>'; reveal('#qfb'); return; }
  if (lv === 'guided') {
    if (!pc.subj || !pc.bodyOpen) { $('#qfb').innerHTML = '<div class="feedback bad">Thư chưa có tiêu đề hoặc nội dung.</div>'; reveal('#qfb'); return; }
    const vals = emailValues(s);
    let allOk = true;
    view.querySelectorAll('.email input').forEach(inp => {
      const v = inp.value.replace(/[,，.\s%]/g, '');
      const ok = v !== '' && Number(v) === Number(vals[inp.dataset.k]);
      inp.classList.toggle('right', ok); inp.classList.toggle('wrong', !ok);
      if (!ok) allOk = false;
    });
    if (!allOk) { penalty(5); $('#qfb').innerHTML = '<div class="feedback bad">Có ô chưa đúng (viền đỏ). Đối chiếu lại với bảng điều khoản nhé (-5 điểm).</div>'; reveal('#qfb'); return; }
  } else {
    const subj = ($('#mSubj').value || '').trim(), body = ($('#mBody').value || '').trim();
    pc.subj = subj; pc.body = body;
    const miss = [];
    if (!subj || !(n.subjectKeys || ['确认']).some(k => subj.includes(k))) miss.push('tiêu đề nên có chữ ' + (n.subjectKeys || ['确认']).join(' / '));
    if (!/[\u4e00-\u9fff]/.test(body)) miss.push('nội dung phải viết bằng tiếng Trung');
    const plain = body.replace(/[,，\s]/g, '');
    mailFacts(n, s).forEach(f => { if (!plain.includes(String(f.value))) miss.push('thiếu số ' + f.value); });
    if (miss.length) { penalty(5); save(); $('#qfb').innerHTML = `<div class="feedback bad">✗ Thư chưa đủ: ${esc(miss.join('; '))} (-5 điểm).</div>`; reveal('#qfb'); return; }
  }
  view.querySelector('.pc-screen').insertAdjacentHTML('beforeend', '<div class="sent-toast">✓ 已发送 · Đã gửi</div>');
  s.emailSent = true; m.me = 'hoan-thanh'; save();
  setTimeout(() => goto(n.next), 1100);
};

function viewResult(n, m, s, head) {
  const crit = M.criteria.map(c => ({ vi: c.vi, ok: !!c.ok(s) }));
  const met = crit.filter(c => c.ok).length;
  const stars = met === crit.length ? 3 : met === crit.length - 1 ? 2 : 1;
  const R = M.results[stars];
  if (!m.awarded) {
    const full = m.score + stars * 50;
    const ek = CH[chOf(m)].earn[m.mode], bonus = { easy: 1, mid: 2, hard: 3 }[m.mode];
    m.gained = (S.earned[ek] ? Math.ceil(full / 3) : full) * bonus; // chơi lại vẫn được điểm nhưng ít hơn; chế độ Vừa được gấp đôi
    S.earned[ek] = true; S.points += m.gained; m.awarded = true;
    const bk = CH[chOf(m)].best[m.mode];
    if (stars > (S[bk] || 0)) S[bk] = stars;
    m.me = R.me; m.faces.boss = R.face; save(); applyOpts();
  }
  view.innerHTML = head('任务结果', 'rènwu jiéguǒ', 'Kết quả nhiệm vụ · chế độ ' + MODES[m.mode] + ' · ' + M.title) +
    scene({ bg: 'boss', rightKey: 'boss', speaker: 'right' }) +
    `<div class="dialog"><div class="who">${boss().name}</div>${line(R)}</div>
    <div class="card" style="margin-top:14px">
      <div class="row"><span class="stars" style="font-size:30px">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
        <span class="right score" style="font-size:20px">Điểm: ${m.score}/100 · +${m.gained} 🪙</span></div>
      <div class="crit">${crit.map(c => `<div>${c.ok ? '✅' : '❌'} ${esc(c.vi)}</div>`).join('')}
        ${(M.resultNotes ? M.resultNotes(s) : []).filter(Boolean).map(x => `<div>${esc(x)}</div>`).join('')}</div>
      <h2>Nhật ký lựa chọn</h2>
      ${m.log.map(l => `<div class="logline">${l.grade === 'good' ? '✅' : l.grade === 'ok' ? '🟡' : '❌'} <b>${esc(l.zh)}</b>${l.fix ? `<div class="fix">→ ${esc(l.fix)}</div>` : ''}${l.fb ? `<div class="vi">🧑‍🏫 ${esc(l.fb)}</div>` : ''}<div class="vi">${esc(l.note)}</div></div>`).join('')}
      <div class="row" style="margin-top:14px"><button class="btn ghost" data-act="startMission" data-arg="${chOf(m)}:${m.mode}">Chơi lại nhiệm vụ</button><button class="btn right" data-act="home">Về trung tâm</button></div>
    </div>`;
  setTimeout(() => speak(tpl(R.zh)), 300);
  if (M.resultGuide) return guide(M.resultGuide(stars), stars === 3 ? 'hoan-thanh' : 'nghi-ngo');
  guide(m.mode === 'easy' ? (stars === 3 ? 'Xuất sắc! <b>🏭 工厂</b> đã mở trên bản đồ. Về bản đồ và đi tới nhà máy nhé!' : 'Em đã hoàn thành nhiệm vụ, <b>🏭 工厂</b> đã mở! Xem nhật ký: những lựa chọn ❌ là chỗ có thể làm tốt hơn, em có thể chơi lại để lấy 3 sao.') : stars === 3 ? ({ easy: '', mid: 'Xuất sắc! Chế độ <b>Khó</b> đã mở: một loạt rắc rối đang chờ em.', hard: 'Tuyệt vời! Em đã vượt qua cả ba chế độ của ải thu mua!' }[m.mode]) : 'Xem nhật ký: những lựa chọn ❌ là chỗ có thể làm tốt hơn. Thử gọi các nhà cung cấp theo thứ tự khác xem sao!', stars === 3 ? 'hoan-thanh' : 'nghi-ngo');
}

// ---------- Khởi động ----------
applyOpts();
go(home());
})();
