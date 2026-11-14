// Kiểm thử đồng bộ: hai "máy" (2 context trình duyệt riêng) + Firebase giả (máy chủ nằm trong Node).
const puppeteer = require('puppeteer-core');
const OUT = 'D:/教学教材/hsk/HSK3.0/game/prototype/screenshots/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const server = {}; let writes = 0;
const FAKE = {
  'firebase-app.js': `export const initializeApp = c => ({ c });`,
  'firebase-auth.js': `
    let user = JSON.parse(localStorage.getItem('fakeUser') || 'null'), cbs = [];
    const fire = () => cbs.forEach(f => f(user));
    export const getAuth = () => ({});
    export const onAuthStateChanged = (a, f) => { cbs.push(f); setTimeout(() => f(user), 50); };
    export const getRedirectResult = async () => null;
    export class GoogleAuthProvider { setCustomParameters() {} }
    export const signInWithPopup = async () => { user = { uid: 'u1', email: 'lan@example.com', displayName: 'Lan' }; localStorage.setItem('fakeUser', JSON.stringify(user)); fire(); };
    export const signInWithRedirect = signInWithPopup;
    export const signInWithEmailAndPassword = async (a, e) => { if (e !== 'lan@example.com') throw { code: 'auth/invalid-credential' }; return signInWithPopup(); };
    export const createUserWithEmailAndPassword = async () => { await signInWithPopup(); return { user }; };
    export const updateProfile = async () => {};
    export const sendPasswordResetEmail = async () => {};
    export const signOut = async () => { user = null; localStorage.removeItem('fakeUser'); fire(); };`,
  'firebase-firestore.js': `
    export const getFirestore = () => ({});
    export const doc = (db, ...p) => p.join('/');
    export const serverTimestamp = () => null;
    const snap = d => ({ exists: () => !!d, data: () => d, metadata: { hasPendingWrites: false } });
    export const getDoc = async r => snap(await window.srvGet(r));
    export const setDoc = async (r, d) => { await window.srvSet(r, JSON.stringify(d)); };
    export const onSnapshot = (r, cb) => { let last = ''; const t = setInterval(async () => { const d = await window.srvGet(r); const s = JSON.stringify(d); if (s !== last) { last = s; if (d) cb(snap(d)); } }, 300); return () => clearInterval(t); };`,
};
const CONFIG = `window.FIREBASE_CONFIG = { apiKey: 'test', projectId: 'test' };`;

async function device(b, name) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage(); await p.evaluateOnNewDocument(() => localStorage.setItem('hanyu-office-review', '{"on":false,"mock":false}')); // tắt chế độ kiểm tra để thử đúng luật mở khoá await p.setViewport({ width: 1100, height: 850 });
  p.errs = []; p.on('pageerror', e => p.errs.push(name + ': ' + e.message));
  await p.exposeFunction('srvGet', r => server[r] ? JSON.parse(server[r]) : null);
  await p.exposeFunction('srvSet', (r, d) => { server[r] = d; writes++; });
  await p.setRequestInterception(true);
  p.on('request', q => {
    const u = q.url();
    const f = Object.keys(FAKE).find(k => u.includes('gstatic.com') && u.endsWith(k));
    if (f) return q.respond({ status: 200, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: FAKE[f] });
    if (u.endsWith('/firebase-config.js')) return q.respond({ status: 200, contentType: 'text/javascript', body: CONFIG });
    q.continue();
  });
  await p.goto('http://localhost:5173/prototype/?mockai'); await sleep(600);
  return p;
}
const st = p => p.evaluate(() => { const S = window.GAME.get(); return { name: S.name, player: S.player, key: S.ai && S.ai.key, lessons: Object.keys(S.lessons), nb: Object.keys(S.notebook), best: S.best, t: S.t, screen: document.querySelector('#view h1, #view h2') && document.querySelector('#view h1, #view h2').textContent.slice(0, 30) }; });
const check = (ok, msg) => { console.log((ok ? '✓ ' : '✗ ') + msg); if (!ok) process.exitCode = 1; };

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new' });
  // Máy A: đăng nhập bằng email, có tiến độ
  const A = await device(b, 'A');
  await A.screenshot({ path: OUT + '60-dang-nhap.png' });
  await A.type('#em', 'sai@example.com'); await A.type('#pw', '123456'); await A.click('[data-act=eLogin]'); await sleep(300);
  check(/không đúng/.test(await A.$eval('#acctMsg', e => e.textContent)), 'Sai email → báo lỗi tiếng Việt');
  await A.$eval('#em', e => e.value = ''); await A.type('#em', 'lan@example.com'); await A.click('[data-act=eLogin]'); await sleep(700);
  check(await A.$eval('#name', e => e.value) === 'Lan', 'Đăng nhập xong: tên tự điền từ tài khoản');
  await A.screenshot({ path: OUT + '61-da-dang-nhap.png' });
  await A.evaluate(() => { const S = window.GAME.get(); Object.assign(S, { name: 'Lan', player: 'ga', mentor: 'tho', ai: { key: 'AIzaTEST1234', models: ['mock'], model: 'mock' }, lessons: { vocab: true }, best: 2 }); window.GAME.touch(); });
  await A.evaluate(() => document.querySelector('[data-act=home]').click()); await sleep(2200);
  check(!!server['users/u1/apps/hanyu-office'], 'Máy A đã gửi tiến độ lên tài khoản');

  // Máy B: chưa có gì, đăng nhập Google → nhận đủ tiến độ + key, vào thẳng trung tâm
  const B = await device(b, 'B');
  await B.click('[data-act=gLogin]'); await sleep(1200);
  let sb = await st(B);
  check(sb.name === 'Lan' && sb.player === 'ga' && sb.key === 'AIzaTEST1234' && sb.lessons.includes('vocab') && sb.best === 2, 'Máy B nhận tên, nhân vật, API Key, bài đã học: ' + JSON.stringify(sb));
  await B.screenshot({ path: OUT + '62-may-B-dong-bo.png' });

  // B học thêm → A (đang ở trung tâm) tự cập nhật
  await B.evaluate(() => { const S = window.GAME.get(); S.lessons.grammar = true; S.notebook['报价'] = { t: 1 }; window.GAME.touch(); }); await sleep(2500);
  let sa = await st(A);
  check(sa.lessons.includes('grammar') && sa.nb.includes('报价'), 'Máy A tự nhận bài 2 và sổ từ từ máy B');

  // A đang làm bài luyện tập: không bị thay giữa chừng; về trung tâm mới áp dụng
  await A.evaluate(() => { window.GAME.get(); });
  await A.evaluate(() => document.querySelector('[data-act=go][data-arg="lesson:vocab"]').click()); await sleep(300);
  await B.evaluate(() => { const S = window.GAME.get(); S.lessons.process = true; window.GAME.touch(); }); await sleep(2500);
  sa = await st(A);
  check(!sa.lessons.includes('process'), 'Máy A đang trong bài học: chưa thay dữ liệu giữa chừng');
  // trong lúc đó A cũng ghi sổ từ (thay đổi riêng của A)
  await A.evaluate(() => { const S = window.GAME.get(); S.notebook['合同'] = { t: 2 }; window.GAME.touch(); }); await sleep(2200);
  await A.evaluate(() => document.querySelector('[data-act=home]').click()); await sleep(2500);
  sa = await st(A); sb = await st(B);
  check(sa.lessons.includes('process') && sa.nb.includes('合同') && sa.nb.includes('报价'), 'Về trung tâm: A gộp bài 3 của B và giữ sổ từ của mình');
  check(sb.nb.includes('合同'), 'B nhận sổ từ 合同 mà A ghi lúc đang làm bài');

  // Không gửi qua lại mãi
  const w0 = writes; await sleep(4000);
  check(writes === w0, `Đứng yên 4 giây không có lần ghi nào (tổng ghi: ${writes})`);

  // Đăng xuất trên B: dữ liệu và key bị xoá khỏi máy B, tài khoản vẫn còn
  B.on('dialog', d => d.accept());
  await B.evaluate(() => document.querySelector('#cloudBtn').click()); await sleep(300);
  await B.screenshot({ path: OUT + '63-tai-khoan.png' });
  await B.click('[data-act=signOut]'); await sleep(800);
  const local = await B.evaluate(() => JSON.parse(localStorage.getItem('hanyu-office-v2')));
  check(!local.name && !local.ai && !!JSON.parse(server['users/u1/apps/hanyu-office'].replace(/^/, '')).state.includes('AIzaTEST1234'), 'Đăng xuất B: máy B sạch dữ liệu, key vẫn trong tài khoản');

  const errs = [...A.errs, ...B.errs];
  console.log(errs.length ? 'LỖI TRANG: ' + errs.join(' | ') : 'Không có lỗi trang.');
  await b.close();
})().catch(e => { console.error('THẤT BẠI', e.message); process.exit(1); });
