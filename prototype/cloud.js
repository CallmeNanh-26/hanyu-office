// Tài khoản học viên (Firebase Auth: Google hoặc email + mật khẩu) và tự đồng bộ toàn bộ tiến độ (Firestore).
// Toàn bộ dữ liệu game của một học viên (kể cả API Key) là một tài liệu users/{uid}/apps/hanyu-office;
// Firestore Rules chỉ cho chính học viên đó đọc và ghi.
// Mỗi lần lưu, game đóng dấu thời gian S.t; khi hai máy khác nhau, bản mới hơn làm gốc và gộp thêm những gì
// chỉ tăng chứ không giảm (bài đã học, sổ từ, mốc thưởng, điểm cao nhất…), nên không mất tiến độ.
const cfg = window.FIREBASE_CONFIG;
const V = '10.12.2';
const LIB = `https://www.gstatic.com/firebasejs/${V}/`;
const OWNER = 'hanyu-office-owner'; // uid đang sở hữu dữ liệu trên máy này
const PUSH_DELAY = 1500;
const G = () => window.GAME;

let fb = null;
let status = { enabled: !!cfg, ready: !cfg, user: null, syncing: false, error: '', lastSync: 0 };
const setStatus = p => { status = { ...status, ...p }; G()?.cloudChanged(); };

let syncedT = 0; // dấu thời gian của bản đã có trên máy chủ
let pending = null; // bản mới từ máy khác, chờ lúc học viên không đang làm bài để áp dụng
let unlisten = null;
let timer = null;
let pushing = null;

// ---------- gộp hai bản ----------
const max = (a, b) => Math.max(a || 0, b || 0);
function merge(a, b) { // a: bản mới hơn (làm gốc), b: bản cũ hơn
  if (!b) return a;
  const out = { ...a };
  for (const k of ['lessons', 'earned', 'notebook', 'checks']) out[k] = { ...(b[k] || {}), ...(a[k] || {}) };
  for (const k of ['best', 'bestMid', 'bestHard', 'fBest']) out[k] = max(a[k], b[k]);
  if (!(a.test && a.test.passed) && b.test && b.test.passed) out.test = b.test;
  out.ai = a.ai || b.ai || null;
  out.name = a.name || b.name || '';
  out.player = a.player || b.player || '';
  out.mentor = a.mentor || b.mentor || '';
  return out;
}

// ---------- bắt đầu ----------
async function start() {
  if (!cfg) return;
  try {
    const [app, auth, store] = await Promise.all([
      import(LIB + 'firebase-app.js'), import(LIB + 'firebase-auth.js'), import(LIB + 'firebase-firestore.js')]);
    const a = app.initializeApp(cfg);
    fb = { auth, store, a: auth.getAuth(a), db: store.getFirestore(a) };
    fb.a.languageCode = 'vi';
  } catch (e) {
    setStatus({ ready: true, error: 'Không tải được phần đăng nhập (kiểm tra mạng).' });
    return;
  }
  document.addEventListener('visibilitychange', () => {
    if (!status.user) return;
    if (document.visibilityState === 'hidden') pushNow(); else tryApply();
  });
  fb.auth.getRedirectResult(fb.a).catch(e => setStatus({ error: authMessage(e) }));
  fb.auth.onAuthStateChanged(fb.a, user => {
    stopListening();
    if (!user) { setStatus({ ready: true, user: null, syncing: false }); return; }
    beginSession(user);
  });
}

const ref = uid => fb.store.doc(fb.db, 'users', uid, 'apps', 'hanyu-office');
const metaKey = uid => 'hanyu-office-synced-' + uid;

async function beginSession(user) {
  const owner = localStorage.getItem(OWNER);
  if (owner && owner !== user.uid) G().clear(); // dữ liệu trên máy là của người khác
  if (owner !== user.uid) localStorage.removeItem(metaKey(user.uid));
  localStorage.setItem(OWNER, user.uid);
  syncedT = +localStorage.getItem(metaKey(user.uid)) || 0;
  setStatus({ ready: true, error: '', syncing: true,
    user: { uid: user.uid, email: user.email, name: user.displayName || (user.email || '').split('@')[0] || 'Học viên' } });
  try {
    const snap = await fb.store.getDoc(ref(user.uid));
    if (snap.exists()) receive(snap.data(), true);
    if ((G().get().t || 0) > syncedT) await pushNow(); else setStatus({ syncing: false, lastSync: Date.now() });
  } catch (e) { setStatus({ syncing: false, error: dataMessage(e) }); }
  listen(user.uid);
}

function listen(uid) {
  unlisten = fb.store.onSnapshot(ref(uid), snap => {
    if (!snap.exists() || snap.metadata.hasPendingWrites) return;
    receive(snap.data(), false);
  }, e => setStatus({ error: dataMessage(e) }));
}
function stopListening() { if (unlisten) unlisten(); unlisten = null; }

// Nhận bản từ máy chủ: nếu mới hơn bản trên máy thì gộp và áp dụng (hoặc để chờ nếu đang làm bài)
function receive(d, first) {
  let remote;
  try { remote = JSON.parse(d.state); } catch { return; }
  const rt = d.t || 0;
  if (rt <= syncedT && !first) return;
  saveSynced(Math.max(syncedT, rt));
  const local = G().get();
  const lt = local.t || 0;
  if (rt > lt || !hasProgress(local)) { pending = remote; tryApply(first); }
  else if (rt < lt) schedulePush();
}
const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(i => [i, x[i]])) : x));
const hasProgress = s => !!(s.name || s.player || Object.keys(s.lessons || {}).length);

function tryApply(force) {
  if (!pending) return;
  // Gộp lúc áp dụng (không phải lúc nhận), để giữ cả những gì học viên vừa làm trong lúc chờ
  const remote = pending, local = G().get();
  const merged = hasProgress(local) && (local.t || 0) > (remote.t || 0) ? merge(local, remote) : merge(remote, local);
  if (G().replace(merged, force)) {
    pending = null;
    // bản gộp có thêm phần của máy này: đóng dấu mới để gửi lên (so sánh không phụ thuộc thứ tự khoá, tránh gửi qua lại mãi)
    if (canon(merged) !== canon(remote)) G().touch();
  }
}

function saveSynced(t) { syncedT = t; if (status.user) localStorage.setItem(metaKey(status.user.uid), String(t)); }

// ---------- gửi thay đổi lên ----------
function schedulePush() { clearTimeout(timer); timer = setTimeout(pushNow, PUSH_DELAY); }
async function pushNow() {
  clearTimeout(timer);
  if (!status.user || !fb) return;
  if (pushing) return pushing.then(schedulePush);
  if (pending) return; // còn bản mới hơn từ máy khác chưa gộp: gộp xong mới gửi
  const s = G().get();
  const t = s.t || 0;
  if (t <= syncedT) return;
  const uid = status.user.uid;
  pushing = (async () => {
    setStatus({ syncing: true });
    try {
      await fb.store.setDoc(ref(uid), { state: JSON.stringify(s), t, u: fb.store.serverTimestamp() });
      saveSynced(t);
      setStatus({ syncing: false, lastSync: Date.now(), error: '' });
    } catch (e) {
      setStatus({ syncing: false, error: dataMessage(e) });
    } finally { pushing = null; }
  })();
  return pushing;
}

// ---------- đăng nhập / đăng xuất ----------
async function signInGoogle() {
  const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = fb.auth;
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  try { await signInWithPopup(fb.a, p); }
  catch (e) {
    // Trình duyệt trong Zalo, Facebook… hay chặn cửa sổ bật lên: chuyển sang đăng nhập cả trang
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') return signInWithRedirect(fb.a, p);
    throw new Error(authMessage(e));
  }
}
async function signInEmail(email, pw) {
  try { await fb.auth.signInWithEmailAndPassword(fb.a, email.trim(), pw); } catch (e) { throw new Error(authMessage(e)); }
}
async function signUpEmail(name, email, pw) {
  try {
    const cred = await fb.auth.createUserWithEmailAndPassword(fb.a, email.trim(), pw);
    if (name.trim()) { await fb.auth.updateProfile(cred.user, { displayName: name.trim() }); setStatus({ user: { ...status.user, name: name.trim() } }); }
  } catch (e) { throw new Error(authMessage(e)); }
}
async function resetPassword(email) {
  try { await fb.auth.sendPasswordResetEmail(fb.a, email.trim()); } catch (e) { throw new Error(authMessage(e)); }
}
// Đăng xuất: gửi nốt thay đổi, rồi xoá dữ liệu của học viên khỏi máy này (vẫn còn trong tài khoản)
async function signOut() {
  const uid = status.user && status.user.uid;
  await pushNow();
  stopListening();
  await fb.auth.signOut(fb.a);
  pending = null;
  localStorage.removeItem(OWNER);
  if (uid) localStorage.removeItem(metaKey(uid));
  G().clear();
}

function authMessage(e) {
  const m = {
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
    'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
    'auth/user-not-found': 'Chưa có tài khoản với email này.',
    'auth/email-already-in-use': 'Email này đã có tài khoản, hãy bấm "Đăng nhập".',
    'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
    'auth/invalid-email': 'Email không hợp lệ.',
    'auth/missing-password': 'Hãy nhập mật khẩu.',
    'auth/too-many-requests': 'Thử quá nhiều lần. Hãy đợi vài phút rồi thử lại.',
    'auth/network-request-failed': 'Không kết nối được. Kiểm tra mạng rồi thử lại.',
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập.',
    'auth/cancelled-popup-request': 'Bạn đã đóng cửa sổ đăng nhập.',
    'auth/unauthorized-domain': 'Địa chỉ web này chưa được phép đăng nhập (Firebase → Authentication → Settings → Authorized domains).',
    'auth/operation-not-allowed': 'Cách đăng nhập này chưa được bật (Firebase → Authentication → Sign-in method).',
    'auth/configuration-not-found': 'Đăng nhập chưa được bật trong Firebase (Authentication → Get started).',
  };
  return m[e && e.code] || (e && e.message) || 'Không đăng nhập được.';
}
function dataMessage(e) {
  if (e && e.code === 'permission-denied')
    return /has not been used|disabled/i.test(e.message || '')
      ? 'Chưa tạo cơ sở dữ liệu Firestore (Firebase → Firestore Database → Create database).'
      : 'Máy chủ từ chối lưu dữ liệu (kiểm tra Firestore Rules).';
  if (e && e.code === 'unavailable') return 'Đang ngoại tuyến, dữ liệu sẽ tự đồng bộ khi có mạng.';
  return (e && e.message) || 'Không đồng bộ được.';
}

window.CLOUD = {
  status: () => status,
  changed: () => { if (status.user) schedulePush(); },
  idle: () => tryApply(),
  syncNow: () => pushNow(),
  signInGoogle, signInEmail, signUpEmail, resetPassword, signOut,
  _merge: merge, // để kiểm thử
};
G()?.cloudChanged();
start();
