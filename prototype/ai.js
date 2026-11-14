// AI chấm bài cho chế độ Vừa, dùng API Key Google Gemini của chính học viên (gói miễn phí của Google AI Studio).
// Key chỉ lưu trên trình duyệt của học viên và gửi thẳng tới Google, không qua máy chủ nào khác.
// Thêm ?mockai vào địa chỉ trang để dùng bộ chấm giả lập (kiểm thử không cần key, không tốn lượt).
(() => {
const BASE = 'https://generativelanguage.googleapis.com/v1beta/';
// hoặc bật 'AI chấm giả lập' trong màn 🛠 Kiểm tra nội dung (chỉ khi chạy trên máy: localhost)
const LOCAL = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
const MOCK = new URLSearchParams(location.search).has('mockai') || (LOCAL && (() => { try { return !!JSON.parse(localStorage.getItem('hanyu-office-review') || '{}').mock; } catch { return false; } })());

// kind: 'key' (key sai/không có quyền), 'quota' (hết lượt miễn phí), 'network', 'model' (model không dùng được), 'parse', 'other'
class AIError extends Error { constructor(kind, msg, status) { super(msg); this.kind = kind; this.status = status; } }

async function call(key, path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method: body ? 'POST' : 'GET',
      headers: Object.assign({ 'x-goog-api-key': key }, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) { throw new AIError('network', 'Không kết nối được tới Google. Kiểm tra mạng rồi thử lại.'); }
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = (data && data.error) || {};
    const msg = err.message || res.statusText, st = err.status || '';
    if (res.status === 429 || st === 'RESOURCE_EXHAUSTED') throw new AIError('quota', msg, res.status);
    if (res.status === 404 || st === 'NOT_FOUND') throw new AIError('model', msg, res.status);
    if (res.status === 401 || res.status === 403 || /API[ _]?key/i.test(msg)) throw new AIError('key', msg, res.status);
    throw new AIError('other', msg, res.status);
  }
  return data;
}

// Ưu tiên dòng "flash" (có gói miễn phí): bản mới nhất trước, bản chính thức trước bản preview, bản thường trước bản lite
function rankModels(list) {
  const names = list
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''))
    .filter(n => /^gemini-[\d.]+-flash(-lite)?(-preview[\w-]*|-\d{3})?$/.test(n));
  const ver = n => parseFloat(n.match(/^gemini-([\d.]+)/)[1]);
  return names.sort((a, b) => (ver(b) - ver(a)) || (/lite/.test(a) - /lite/.test(b)) || (/preview/.test(a) - /preview/.test(b)) || a.length - b.length);
}

async function generate(key, model, prompt, system, props) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
  };
  if (props) body.generationConfig.responseSchema = { type: 'OBJECT', properties: props, required: Object.keys(props) };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const data = await call(key, `models/${model}:generateContent`, body);
  const cand = data.candidates && data.candidates[0];
  const text = ((cand && cand.content && cand.content.parts) || []).map(p => p.text || '').join('');
  try { return JSON.parse(text.replace(/^\s*```(json)?/, '').replace(/```\s*$/, '').trim()); }
  catch { throw new AIError('parse', 'AI trả về dữ liệu không đọc được. Bấm Gửi lại nhé.'); }
}

// Kiểm tra key và chọn model đang dùng được với key này
async function connect(key) {
  if (MOCK) return { key, models: ['mock'], model: 'mock' };
  const data = await call(key, 'models?pageSize=200');
  const models = rankModels(data.models || []);
  if (!models.length) throw new AIError('model', 'Key này chưa dùng được model Gemini Flash nào.');
  let last;
  for (const model of models.slice(0, 5)) {
    try { await generate(key, model, 'Return {"ok": true}', null, { ok: { type: 'BOOLEAN' } }); return { key, models, model }; }
    catch (e) { last = e; if (e.kind === 'key' || e.kind === 'network') throw e; }
  }
  throw last;
}

// Gọi model đang dùng; nếu model đó không còn hoặc hết lượt thì thử model kế tiếp
async function ask(cfg, prompt, system, props) {
  const order = [cfg.model, ...cfg.models.filter(m => m !== cfg.model)].slice(0, 4);
  let last;
  for (const model of order) {
    try { const out = await generate(cfg.key, model, prompt, system, props); cfg.model = model; return out; }
    catch (e) { last = e; if (e.kind !== 'model' && e.kind !== 'quota') throw e; }
  }
  throw last;
}

// ---------- Chấm một lượt hội thoại ----------
const TURN_SYSTEM = `You are a warm, encouraging Chinese teacher grading a Vietnamese learner (HSK 3-4) inside a business role-play game.
The learner answers the other character in Chinese (Hanzi, or pinyin; small speech-recognition typos are fine).
Return JSON only:
- off_topic: true if the reply is not Chinese (mostly Vietnamese or English) or has nothing to do with the situation. Then set matched to 0 and use feedback_vi to ask them to answer in Chinese.
- matched: index of the option whose intent, strategy and politeness are closest to the learner's reply. Compare meaning and tone, not wording.
- grade: start from that option's quality ("good", "ok", "bad"). Lower it one level if the Chinese has errors that hurt understanding, or the tone is too rude for business. Never raise it above the option's quality.
- corrected_zh: a natural, polite Chinese version of what the learner meant (keep their intent and numbers), simple HSK 3-4 words, at most two sentences.
- corrected_py: pinyin of corrected_zh with tone marks.
- feedback_vi: Vietnamese, at most two short friendly sentences. Address the learner as "em". Say what was good, then the single most important fix (grammar, word choice or politeness).`;
const TURN_PROPS = {
  off_topic: { type: 'BOOLEAN' }, matched: { type: 'INTEGER' }, grade: { type: 'STRING', enum: ['good', 'ok', 'bad'] },
  corrected_zh: { type: 'STRING' }, corrected_py: { type: 'STRING' }, feedback_vi: { type: 'STRING' },
};
async function gradeTurn(cfg, t) {
  if (MOCK) return mockTurn(t);
  const prompt = 'Grade this turn.\n' + JSON.stringify({
    situation: t.situation, other_character_said: t.npc, learner_goal: t.goal,
    options: t.options.map((o, i) => ({ index: i, chinese: o.zh, meaning_vi: o.vi, quality: o.quality })),
    learner_reply: t.answer,
  }, null, 1);
  const r = await ask(cfg, prompt, TURN_SYSTEM, TURN_PROPS);
  r.matched = Math.max(0, Math.min(t.options.length - 1, Number(r.matched) | 0));
  if (!['good', 'ok', 'bad'].includes(r.grade)) r.grade = t.options[r.matched].quality;
  return r;
}

// ---------- Chấm một câu tự soạn (bước chuẩn bị) ----------
const SENT_SYSTEM = `You are a warm Chinese teacher. A Vietnamese learner (HSK 3-4) must write one Chinese sentence with a given meaning.
Return JSON only:
- correct: true if the sentence is understandable, grammatical enough and carries the required meaning (other wordings are fine).
- grade: "good" (natural and correct), "ok" (understandable with small errors), "bad" (wrong meaning, not Chinese, or hard to understand).
- corrected_zh: a natural version of the learner's sentence with the required meaning. corrected_py: its pinyin with tone marks.
- feedback_vi: Vietnamese, at most two short friendly sentences, addressing the learner as "em".`;
const SENT_PROPS = {
  correct: { type: 'BOOLEAN' }, grade: { type: 'STRING', enum: ['good', 'ok', 'bad'] },
  corrected_zh: { type: 'STRING' }, corrected_py: { type: 'STRING' }, feedback_vi: { type: 'STRING' },
};
async function gradeSentence(cfg, t) {
  if (MOCK) return mockSentence(t);
  return ask(cfg, 'Grade this sentence.\n' + JSON.stringify({ required_meaning_vi: t.meaning, reference_chinese: t.reference, learner_sentence: t.answer }, null, 1), SENT_SYSTEM, SENT_PROPS);
}

// ---------- Bộ chấm giả lập (chỉ dùng khi kiểm thử với ?mockai) ----------
const han = s => [...new Set(String(s).match(/[一-鿿]/g) || [])];
const overlap = (a, b) => { const B = new Set(han(b)); return han(a).filter(c => B.has(c)).length / Math.max(1, han(b).length); };
const delay = () => new Promise(r => setTimeout(r, 120));
async function mockTurn(t) {
  await delay();
  if (!han(t.answer).length) return { off_topic: true, matched: 0, grade: 'bad', corrected_zh: '', corrected_py: '', feedback_vi: 'Em trả lời bằng tiếng Trung nhé.' };
  let best = 0;
  t.options.forEach((o, i) => { if (overlap(t.answer, o.zh) > overlap(t.answer, t.options[best].zh)) best = i; });
  const o = t.options[best];
  return { off_topic: false, matched: best, grade: o.quality, corrected_zh: o.zh, corrected_py: '(mock)', feedback_vi: '(Chấm thử) Câu của em gần với lựa chọn này.' };
}
async function mockSentence(t) {
  await delay();
  const ok = overlap(t.answer, t.reference) >= 0.7;
  return { correct: ok, grade: ok ? 'good' : 'bad', corrected_zh: t.reference, corrected_py: '(mock)', feedback_vi: ok ? '(Chấm thử) Đúng rồi!' : '(Chấm thử) Chưa đúng ý.' };
}

window.AI = { connect, gradeTurn, gradeSentence, AIError, mock: MOCK, reviewMock: MOCK && !new URLSearchParams(location.search).has('mockai') };
})();
