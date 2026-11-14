// Nhân vật và kịch bản nhiệm vụ "Thu mua nguyên vật liệu" (chế độ Dễ).
// Kịch bản là một mạng các "nút" (nodes). Mỗi nút có type:
//   say   : một câu thoại rồi sang nút `next`
//   ask   : người chơi chọn 1 trong các câu trả lời (choices), mỗi câu có hậu quả riêng
//   menu  : bảng chọn việc làm tiếp (gọi cho ai, báo cáo sếp...)
//   quotes, build, read, card, email, result : các màn bài tập / thông tin
// Trong câu chữ dùng được: {me} {mePy} (tên người chơi), {boss} {bossPy} {bossSelf} {bossSelfPy},
//   {price} {days} {deposit} (điều khoản hiện tại với 鑫达钢材).
// s = trạng thái nhiệm vụ. fx: s => {...} thay đổi trạng thái; go / next / show / reply có thể là hàm của s.
(() => {
const IMG = '../characters/';
const ALL6 = ['vui-ve', 'hoan-thanh', 'hoang-hot', 'kinh-ngac', 'nghi-ngo', 'de-biu'];
const ALL8 = [...ALL6, 'kho-chiu', 'kho-hieu'];
const SAD8 = ['vui-ve', 'hoan-thanh', 'hoang-hot', 'kinh-ngac', 'nghi-ngo', 'kho-chiu', 'so-hai', 'buon-ba'];

window.CONTENT.cast = {
  // Vai chính: 12 con giáp (kiểu Việt Nam) + thỏ. faces = các biểu cảm đã có hình; thiếu thì app chọn nét gần nghĩa, không có nữa thì dùng dáng đứng img.
  // Kịch bản đặt nét mặt người chơi bằng me (lúc nói câu đó) và meAfter (phản ứng sau khi nghe đối phương đáp):
  //   so-hai = bị mắng, buon-ba = bị phê bình nhẹ, kho-hieu = bối rối, kho-chiu = bực mình.
  players: [
    { id: 'chuot', nick: '小鼠', nickPy: 'Xiǎo Shǔ', vi: 'Chuột', img: IMG + 'nhom-12-con-giap/chuot.png', dir: IMG + 'bieu-cam/chuot/', faces: [...ALL6, 'kho-chiu', 'lem-linh'] },
    { id: 'trau', nick: '小牛', nickPy: 'Xiǎo Niú', vi: 'Trâu', img: IMG + 'nhom-12-con-giap/trau.png', dir: IMG + 'bieu-cam/trau/', faces: ['hoan-thanh', 'nghi-ngo', 'de-biu', 'ap-luc'] },
    { id: 'ho', nick: '小虎', nickPy: 'Xiǎo Hǔ', vi: 'Hổ', img: IMG + 'nhom-12-con-giap/ho.png', dir: IMG + 'bieu-cam/ho/', faces: ['vui-ve', 'hoang-hot', 'kinh-ngac'] },
    { id: 'meo', nick: '小猫', nickPy: 'Xiǎo Māo', vi: 'Mèo', img: IMG + 'nhom-12-con-giap/meo.png', dir: IMG + 'bieu-cam/meo/', faces: ALL8 },
    { id: 'rong', nick: '小龙', nickPy: 'Xiǎo Lóng', vi: 'Rồng', img: IMG + 'nhom-12-con-giap/rong.png', faces: [] },
    { id: 'ran', nick: '小蛇', nickPy: 'Xiǎo Shé', vi: 'Rắn', img: IMG + 'nhom-12-con-giap/ran.png', dir: IMG + 'bieu-cam/ran/', faces: ALL6 },
    { id: 'ngua', nick: '小马', nickPy: 'Xiǎo Mǎ', vi: 'Ngựa', img: IMG + 'nhom-12-con-giap/ngua.png', dir: IMG + 'bieu-cam/ngua/', faces: SAD8 },
    { id: 'de', nick: '小羊', nickPy: 'Xiǎo Yáng', vi: 'Dê', img: IMG + 'nhom-12-con-giap/de.png', dir: IMG + 'bieu-cam/de/', faces: SAD8 },
    { id: 'khi', nick: '小猴', nickPy: 'Xiǎo Hóu', vi: 'Khỉ', img: IMG + 'nhom-12-con-giap/khi.png', faces: [] },
    { id: 'ga', nick: '小鸡', nickPy: 'Xiǎo Jī', vi: 'Gà', img: IMG + 'nhom-12-con-giap/ga.png', dir: IMG + 'bieu-cam/ga/', faces: ALL8 },
    { id: 'cho', nick: '小狗', nickPy: 'Xiǎo Gǒu', vi: 'Chó', img: IMG + 'nhom-12-con-giap/cho.png', dir: IMG + 'bieu-cam/cho/', faces: ALL8 },
    { id: 'lon', nick: '小猪', nickPy: 'Xiǎo Zhū', vi: 'Lợn', img: IMG + 'nhom-12-con-giap/lon.png', faces: [] },
    { id: 'tho', nick: '小兔', nickPy: 'Xiǎo Tù', vi: 'Thỏ', img: IMG + 'tho-bieu-cam/vui-ve.png', dir: IMG + 'tho-bieu-cam/', faces: ALL6 },
  ],
  // Hướng dẫn viên: faces = các nét mặt đang có (thiếu nét nào thì app tự chọn nét gần nghĩa nhất)
  mentors: [
    { id: 'meo', name: '苗老师', py: 'Miáo lǎoshī', vi: 'Cô Mèo', dir: IMG + 'bieu-cam/meo/', faces: ALL8 },
    { id: 'tho', name: '兔老师', py: 'Tù lǎoshī', vi: 'Cô Thỏ', dir: IMG + 'tho-bieu-cam/', faces: ALL6 },
    { id: 'cho', name: '汪老师', py: 'Wāng lǎoshī', vi: 'Thầy Cún', dir: IMG + 'bieu-cam/cho/', faces: ALL8 },
    { id: 'chuot', name: '舒老师', py: 'Shū lǎoshī', vi: 'Thầy Chuột', dir: IMG + 'bieu-cam/chuot/', faces: [...ALL6, 'kho-chiu'] },
    { id: 'de', name: '杨老师', py: 'Yáng lǎoshī', vi: 'Cô Dê', dir: IMG + 'bieu-cam/de/', faces: SAD8 },
  ],
  // Sếp: mặc định là trâu; nếu người chơi chọn trâu thì sếp là hổ
  bosses: [
    { id: 'trau', name: '牛经理', py: 'Niú jīnglǐ', self: '老牛', selfPy: 'Lǎo Niú', role: 'Trưởng phòng thu mua', img: IMG + 'nhom-12-con-giap/trau.png', dir: IMG + 'bieu-cam/trau/',
      faces: { happy: 'hoan-thanh', approve: 'duyet', doubt: 'nghi-ngo', annoyed: 'de-biu', worried: 'ap-luc', angry: 'gian-du' } },
    { id: 'ho', name: '虎经理', py: 'Hǔ jīnglǐ', self: '老虎', selfPy: 'Lǎo Hǔ', role: 'Trưởng phòng thu mua', img: IMG + 'nhom-12-con-giap/ho.png', dir: IMG + 'bieu-cam/ho/',
      faces: { happy: 'vui-ve', approve: 'vui-ve', worried: 'hoang-hot', annoyed: 'kinh-ngac', angry: 'gian-du' } },
  ],
  npcs: {
    supA: { name: '鄂经理', py: 'È jīnglǐ', role: '宏发金属 · rẻ nhất', img: IMG + 'nhom-2/ca-sau.png', dir: IMG + 'bieu-cam/ca-sau/',
      faces: { happy: 'lem-linh', sly: 'lem-linh', done: 'hoan-thanh', shocked: 'kinh-ngac', doubt: 'nghi-ngo', annoyed: 'de-biu', angry: 'gian-du' } },
    supB: { name: '胡经理', py: 'Hú jīnglǐ', role: '鑫达钢材', img: IMG + 'nhom-2/cao.png', dir: IMG + 'bieu-cam/cao/',
      faces: { neutral: 'vui-ve', happy: 'vui-ve', done: 'hoan-thanh', doubt: 'nghi-ngo', annoyed: 'de-biu', shocked: 'kinh-ngac', sly: 'gian-xao', panic: 'hoang-hot' } },
    supC: { name: '鲍经理', py: 'Bào jīnglǐ', role: '华美钢业 · giao nhanh nhất', img: IMG + 'nhom-2/bao.png', dir: IMG + 'bieu-cam/bao/',
      faces: { happy: 'hoan-thanh', done: 'hoan-thanh', shocked: 'kinh-ngac', doubt: 'nghi-ngo', annoyed: 'de-biu', sly: 'lem-linh', angry: 'gian-du' } },
  },
};

// ---------- Hàm phụ cho kịch bản ----------
const T = { price: 18000, days: 30, deposit: 30 };
const allMet = s => s.price <= T.price && s.days <= T.days && s.deposit <= T.deposit;
// Khi đàm phán lại: nhảy tới điều khoản đầu tiên còn chưa đạt
const unmet = (s, from) => {
  const order = ['price', 'days', 'deposit'], node = { price: 'b_price_r', days: 'b_delivery', deposit: 'b_payment' };
  for (const k of order.slice(order.indexOf(from))) if (s[k] > T[k]) return node[k];
  return 'b_close_r';
};

window.CONTENT.mission = {
  title: '新项目原材料采购', py: 'xīn xiàngmù yuáncáiliào cǎigòu',
  vi: 'Thu mua nguyên vật liệu cho dự án mới',
  targets: { qty: 5, maxPrice: T.price, maxDays: T.days, maxDeposit: T.deposit },
  init: { price: 19200, days: 35, deposit: 100, rapport: 0 },
  start: 'brief1',

  // ===== Chế độ Vừa: người học tự gõ hoặc nói câu trả lời, AI chấm =====
  // Bối cảnh gửi kèm cho AI để chấm cho đúng tình huống
  situation: 'Người học đóng vai nhân viên phòng thu mua công ty 星辰电器, cần mua 5 tấn thép tấm inox 304: giá tối đa 18.000 tệ/tấn, giao hàng chậm nhất 30 ngày, đặt cọc tối đa 30%. Nhà cung cấp: 宏发金属 (rẻ nhưng báo cáo kiểm định đã hết hạn), 鑫达钢材 (đàm phán chính), 华美钢业 (đắt, giao nhanh). Sếp là trưởng phòng thu mua.',
  // Với mỗi lượt hỏi đáp: mục tiêu của lượt, mẫu câu và từ vựng gợi ý (gợi ý này miễn phí).
  // Câu mẫu (tốn 🪙) lấy tự động từ lựa chọn "good" của lượt đó.
  mid: {
    a1: { goal: 'Chào hỏi, rồi hỏi xem thép của họ có báo cáo kiểm định không.',
      pattern: { zh: '请问……有……吗？', py: 'qǐngwèn …… yǒu …… ma?', vi: 'Xin hỏi … có … không?' },
      vocab: [{ zh: '质检报告', py: 'zhìjiǎn bàogào', vi: 'báo cáo kiểm định' }, { zh: '钢板', py: 'gāngbǎn', vi: 'thép tấm' }, { zh: '您好', py: 'nín hǎo', vi: 'chào ông/bà' }] },
    a3: { goal: 'Báo cáo kiểm định đã hết hạn. Nói cho đối tác biết và lịch sự yêu cầu báo cáo mới.',
      pattern: { zh: '这份报告已经……了。请……', py: 'zhè fèn bàogào yǐjīng …… le. qǐng ……', vi: 'Báo cáo này đã … rồi. Xin hãy …' },
      vocab: [{ zh: '过期', py: 'guòqī', vi: 'hết hạn' }, { zh: '提供', py: 'tígōng', vi: 'cung cấp' }, { zh: '新的', py: 'xīn de', vi: 'mới' }] },
    c1: { goal: 'Giới thiệu bản thân, nói giá bên họ cao hơn nơi khác và hỏi có ưu đãi được không.',
      pattern: { zh: 'A 比 B 贵，能不能……？', py: 'A bǐ B guì, néng bu néng ……?', vi: 'A đắt hơn B, có thể … không?' },
      vocab: [{ zh: '价格', py: 'jiàgé', vi: 'giá' }, { zh: '优惠', py: 'yōuhuì', vi: 'ưu đãi' }, { zh: '星辰电器', py: 'Xīngchén Diànqì', vi: 'công ty Tinh Thần' }] },
    b_open: { goal: 'Chào, giới thiệu mình (tên, công ty, phòng ban) và nói mục đích: bàn về giá thép inox 304.',
      pattern: { zh: '我是……的……，想跟您谈谈……', py: 'wǒ shì …… de ……, xiǎng gēn nín tántan ……', vi: 'Tôi là … của …, muốn bàn với ông/bà về …' },
      vocab: [{ zh: '采购部', py: 'cǎigòubù', vi: 'phòng thu mua' }, { zh: '不锈钢板', py: 'bùxiùgāng bǎn', vi: 'thép tấm inox' }, { zh: '价格', py: 'jiàgé', vi: 'giá' }] },
    b_price1: { goal: 'Đừng nhận giá 19.200. Dùng số lượng 5 tấn để xin giảm, ra giá thấp hơn mục tiêu một chút (ví dụ 17.500).',
      pattern: { zh: '如果……的话，能不能……？', py: 'rúguǒ …… dehuà, néng bu néng ……?', vi: 'Nếu … thì có thể … không?' },
      vocab: [{ zh: '订', py: 'dìng', vi: 'đặt hàng' }, { zh: '便宜一点', py: 'piányi yìdiǎn', vi: 'rẻ hơn một chút' }, { zh: '比如', py: 'bǐrú', vi: 'ví dụ' }] },
    b_price2: { goal: 'Giá mới vẫn trên 18.000. Nêu ngân sách có hạn và nhắc hợp tác lâu dài để xin đúng 18.000.',
      pattern: { zh: '如果以后……，……可以吗？', py: 'rúguǒ yǐhòu ……, …… kěyǐ ma?', vi: 'Nếu sau này …, … được không?' },
      vocab: [{ zh: '预算有限', py: 'yùsuàn yǒuxiàn', vi: 'ngân sách có hạn' }, { zh: '长期合作', py: 'chángqī hézuò', vi: 'hợp tác lâu dài' }, { zh: '一万八千', py: 'yíwàn bāqiān', vi: '18.000' }] },
    b_delivery: { goal: 'Đối tác nói giao trong 35 ngày. Nêu lý do (dự án bắt đầu sản xuất) và yêu cầu giao chậm nhất trong 30 ngày.',
      pattern: { zh: '最晚……之前……，能不能安排一下？', py: 'zuì wǎn …… zhīqián ……, néng bu néng ānpái yíxià?', vi: 'Chậm nhất trước … phải …, có thể sắp xếp không?' },
      vocab: [{ zh: '项目', py: 'xiàngmù', vi: 'dự án' }, { zh: '开始生产', py: 'kāishǐ shēngchǎn', vi: 'bắt đầu sản xuất' }, { zh: '交货', py: 'jiāohuò', vi: 'giao hàng' }] },
    b_payment: { goal: 'Đối tác muốn trả trước toàn bộ. Đề nghị cọc 30%, giao hàng xong trả 70%, kèm lý do nhẹ nhàng.',
      pattern: { zh: '先付……，……以后再付……', py: 'xiān fù ……, …… yǐhòu zài fù ……', vi: 'Trả trước …, sau khi … thì trả …' },
      vocab: [{ zh: '定金', py: 'dìngjīn', vi: 'tiền cọc' }, { zh: '百分之三十', py: 'bǎi fēn zhī sānshí', vi: '30%' }, { zh: '压力', py: 'yālì', vi: 'áp lực' }] },
    b_close: { goal: 'Kết thúc lịch sự: cảm ơn, và nói sẽ báo cáo trưởng phòng rồi trả lời sau (chưa được tự ký).',
      pattern: { zh: '谢谢……，我……以后，尽快……', py: 'xièxie ……, wǒ …… yǐhòu, jǐnkuài ……', vi: 'Cảm ơn …, sau khi tôi … sẽ sớm …' },
      vocab: [{ zh: '汇报', py: 'huìbào', vi: 'báo cáo' }, { zh: '回复', py: 'huífù', vi: 'trả lời' }, { zh: '经理', py: 'jīnglǐ', vi: 'trưởng phòng' }] },
    b_price_r: { goal: 'Đàm phán lại giá: đề nghị 18.000, đổi lại hôm nay sẽ ký hợp đồng ngay.',
      pattern: { zh: '如果……，今天就可以……', py: 'rúguǒ ……, jīntiān jiù kěyǐ ……', vi: 'Nếu …, hôm nay có thể … ngay' },
      vocab: [{ zh: '签合同', py: 'qiān hétong', vi: 'ký hợp đồng' }, { zh: '今天', py: 'jīntiān', vi: 'hôm nay' }, { zh: '一万八千', py: 'yíwàn bāqiān', vi: '18.000' }] },
    r1: { goal: 'Báo cáo sếp: đề xuất nhà cung cấp nào, kèm đủ 3 con số giá, thời hạn giao, tiền cọc.',
      pattern: { zh: '我推荐……。价格是……，……天交货，先付……', py: 'wǒ tuījiàn ……. jiàgé shì ……, …… tiān jiāohuò, xiān fù ……', vi: 'Em đề xuất … Giá …, giao trong … ngày, cọc …' },
      vocab: [{ zh: '推荐', py: 'tuījiàn', vi: 'đề xuất' }, { zh: '每吨', py: 'měi dūn', vi: 'mỗi tấn' }, { zh: '定金', py: 'dìngjīn', vi: 'tiền cọc' }] },
    r_gap: { goal: 'Có điều kiện chưa đạt. Nói em sẽ tự đàm phán lại, hoặc lịch sự nhờ sếp giúp, hoặc xin sếp duyệt.',
      pattern: { zh: '我再……一次。/ 能不能请您……？', py: 'wǒ zài …… yí cì. / néng bu néng qǐng nín ……?', vi: 'Em sẽ … thêm một lần. / Có thể nhờ anh … không ạ?' },
      vocab: [{ zh: '再谈', py: 'zài tán', vi: 'bàn lại' }, { zh: '沟通', py: 'gōutōng', vi: 'trao đổi' }, { zh: '批准', py: 'pīzhǔn', vi: 'phê duyệt' }] },
    ev1: { goal: 'Dự án bị đẩy sớm nhưng chỉ cần 2 tấn trong 20 ngày. Đề nghị giao theo đợt.',
      pattern: { zh: '能不能分批交货？先……，剩下的……', py: 'néng bu néng fēnpī jiāohuò? xiān ……, shèngxià de ……', vi: 'Có thể giao theo đợt không? Trước …, phần còn lại …' },
      vocab: [{ zh: '分批', py: 'fēnpī', vi: 'chia đợt' }, { zh: '提前', py: 'tíqián', vi: 'đẩy sớm' }, { zh: '剩下的', py: 'shèngxià de', vi: 'phần còn lại' }] },
  },

  // Bảng 任务: đánh dấu tích khi done(s) đúng
  tasks: [
    { zh: '比价', py: 'bǐjià', vi: 'So sánh', done: s => s.seenQuotes },
    { zh: '谈判', py: 'tánpàn', vi: 'Đàm phán', done: s => s.doneB },
    { zh: '汇报', py: 'huìbào', vi: 'Báo cáo', done: s => s.approved },
    { zh: '应变', py: 'yìngbiàn', vi: 'Phát sinh', done: s => s.rushDone },
    { zh: '确认', py: 'quèrèn', vi: 'Xác nhận', done: s => s.emailSent },
  ],

  nodes: {
    // ================= GIAO VIỆC =================
    brief1: { type: 'say', with: 'boss', who: 'boss', next: 'brief2', guide: 'Nghe kỹ yêu cầu của sếp nhé. Bấm 🔊 để nghe lại, tắt Tiếng Việt hoặc 拼音 ở góc trên nếu muốn thử sức.',
      zh: '{me}，公司下个月要开始生产新产品——智能电水壶。', py: '{mePy}, gōngsī xià ge yuè yào kāishǐ shēngchǎn xīn chǎnpǐn —— zhìnéng diànshuǐhú.', vi: '{me}, tháng sau công ty bắt đầu sản xuất sản phẩm mới: ấm siêu tốc thông minh.' },
    brief2: { type: 'say', with: 'boss', who: 'boss', next: 'brief3',
      zh: '你负责采购原材料：304不锈钢板，五吨。', py: 'Nǐ fùzé cǎigòu yuáncáiliào: sān líng sì bùxiùgāng bǎn, wǔ dūn.', vi: 'Em phụ trách mua nguyên liệu: thép tấm inox 304, năm tấn.' },
    brief3: { type: 'say', with: 'boss', who: 'boss', next: 'brief4', guide: 'Ghi nhớ các con số: <b>5 tấn · ≤18.000 tệ/tấn · ≤30 ngày · cọc 30%</b>.',
      zh: '预算是每吨一万八千元以内，最晚三十天之前交货。', py: 'Yùsuàn shì měi dūn yíwàn bāqiān yuán yǐnèi, zuì wǎn sānshí tiān zhīqián jiāohuò.', vi: 'Ngân sách tối đa 18.000 tệ/tấn, giao hàng chậm nhất trong 30 ngày.' },
    brief4: { type: 'say', with: 'boss', who: 'boss', next: 'brief5',
      zh: '付款方式最好是先付百分之三十定金，交货以后再付百分之七十。多问几家，谈好了向我汇报。', py: 'Fùkuǎn fāngshì zuìhǎo shì xiān fù bǎi fēn zhī sānshí dìngjīn, jiāohuò yǐhòu zài fù bǎi fēn zhī qīshí. Duō wèn jǐ jiā, tán hǎo le xiàng wǒ huìbào.', vi: 'Thanh toán tốt nhất là cọc 30%, giao hàng xong trả 70%. Hỏi nhiều nhà vào, đàm phán xong thì báo cáo tôi.' },
    brief5: { type: 'say', with: 'boss', who: 'me', me: 'vui-ve', next: 'card',
      zh: '明白了！我马上去询价。', py: 'Míngbai le! Wǒ mǎshàng qù xúnjià.', vi: 'Em hiểu rồi! Em đi hỏi giá ngay ạ.' },
    card: { type: 'card', next: 'quotes', guide: 'Ở chế độ Dễ, gợi ý của cô là miễn phí. Chọn sai vẫn bị trừ điểm, nên cứ hỏi cô khi cần nhé!' },

    // ================= SO SÁNH BÁO GIÁ =================
    quotes: { type: 'quotes', next: 'build', fx: s => { s.seenQuotes = true; },
      intro: 'Ba nhà cung cấp đã gửi 报价单 (bảng báo giá). Đọc kỹ rồi chuẩn bị gọi điện.',
      guide: 'Đối chiếu từng cột với thẻ nhiệm vụ. <b>Rẻ nhất chưa chắc tốt nhất</b>, và đừng chỉ hỏi một nhà!',
      cols: [{ zh: '供应商', py: 'gōngyìngshāng' }, { zh: '单价（元/吨）', py: 'dānjià (yuán/dūn)' }, { zh: '交货期', py: 'jiāohuòqī' }, { zh: '质检报告', py: 'zhìjiǎn bàogào' }, { zh: '付款方式', py: 'fùkuǎn fāngshì' }],
      rows: [
        [{ zh: 'A 宏发金属', py: 'Hóngfā Jīnshǔ' }, { zh: '17,500' }, { zh: '60天', py: 'liùshí tiān' }, { zh: '无', py: 'wú' }, { zh: '全款预付', py: 'quánkuǎn yùfù' }],
        [{ zh: 'B 鑫达钢材', py: 'Xīndá Gāngcái' }, { zh: '19,200' }, { zh: '35天', py: 'sānshíwǔ tiān' }, { zh: '有', py: 'yǒu' }, { zh: '全款预付', py: 'quánkuǎn yùfù' }],
        [{ zh: 'C 华美钢业', py: 'Huáměi Gāngyè' }, { zh: '21,000' }, { zh: '25天', py: 'èrshíwǔ tiān' }, { zh: '有', py: 'yǒu' }, { zh: '30%定金', py: 'bǎi fēn zhī sānshí dìngjīn' }],
      ],
      legend: '无 = không có · 有 = có · 全款预付 = trả trước toàn bộ · 定金 = đặt cọc' },

    build: { type: 'build', next: 'hub',
      intro: 'Trước khi gọi điện, em soạn sẵn 2 câu then chốt. Bấm các ô theo đúng thứ tự.',
      guides: ['Câu hỏi giá: "请问 + cái gì + 的单价是多少？"', 'Nhớ mẫu "如果……的话，能不能……？" ở bài 2.'],
      items: [
        { tiles: [{ zh: '单价', py: 'dānjià' }, { zh: '请问', py: 'qǐngwèn' }, { zh: '是多少', py: 'shì duōshao' }, { zh: '304不锈钢板的', py: 'sān líng sì bùxiùgāng bǎn de' }],
          answer: '请问304不锈钢板的单价是多少', answerPy: 'Qǐngwèn sān líng sì bùxiùgāng bǎn de dānjià shì duōshao?', vi: 'Xin hỏi đơn giá thép tấm inox 304 là bao nhiêu?' },
        { tiles: [{ zh: '能不能', py: 'néng bu néng' }, { zh: '如果我们', py: 'rúguǒ wǒmen' }, { zh: '便宜一点', py: 'piányi yìdiǎn' }, { zh: '订五吨的话', py: 'dìng wǔ dūn dehuà' }],
          answer: '如果我们订五吨的话能不能便宜一点', answerPy: 'Rúguǒ wǒmen dìng wǔ dūn dehuà, néng bu néng piányi yìdiǎn?', vi: 'Nếu chúng tôi đặt năm tấn thì có thể rẻ hơn một chút không?' },
      ] },

    // ================= BẢNG CHỌN VIỆC =================
    hub: { type: 'menu', title: { zh: '下一步做什么？', py: 'Xià yí bù zuò shénme?', vi: 'Bước tiếp theo làm gì?' },
      guide: s => !s.calledA && !s.calledB && !s.calledC ? 'Em có thể gọi theo thứ tự tuỳ ý. Mẹo: biết điều kiện của nhà khác trước sẽ giúp em có "đòn bẩy" khi đàm phán.'
        : !s.calledB ? 'Tốt! Thông tin vừa rồi sẽ hữu ích khi nói chuyện với nhà khác.'
        : !s.approved ? 'Đàm phán xong thì nhớ <b>汇报</b> (báo cáo) với sếp nhé.' : '',
      items: [
        { zh: '给宏发金属的鄂经理打电话', py: 'gěi Hóngfā Jīnshǔ de È jīnglǐ dǎ diànhuà', vi: 'Gọi 鄂经理 (A · rẻ nhất, không có kiểm định)', icon: '📞', go: 'a1', done: s => s.calledA },
        { zh: '给鑫达钢材的胡经理打电话', py: 'gěi Xīndá Gāngcái de Hú jīnglǐ dǎ diànhuà', vi: 'Gọi 胡经理 (B · giá vừa, có kiểm định)', icon: '📞', go: 'b_open', done: s => s.calledB },
        { zh: '给华美钢业的鲍经理打电话', py: 'gěi Huáměi Gāngyè de Bào jīnglǐ dǎ diànhuà', vi: 'Gọi 鲍经理 (C · đắt nhất, giao nhanh)', icon: '📞', go: 'c1', done: s => s.calledC },
        { zh: '向{boss}汇报', py: 'xiàng {bossPy} huìbào', vi: 'Báo cáo với sếp', icon: '📋', go: 'r1', show: s => s.calledA || s.calledB || s.calledC },
      ] },

    // ================= A · 宏发金属 (cá sấu) =================
    a1: { type: 'ask', with: 'supA', enter: s => { s.calledA = true; },
      line: { face: 'happy', zh: '喂，宏发金属，我姓鄂。你要多少钢板？我们最便宜！', py: 'Wéi, Hóngfā Jīnshǔ, wǒ xìng È. Nǐ yào duōshao gāngbǎn? Wǒmen zuì piányi!', vi: 'A lô, Hồng Phát đây, tôi họ Ngạc. Cần bao nhiêu thép tấm? Bên tôi rẻ nhất!' },
      hint: 'Bảng báo giá ghi nhà này 无质检报告 (không có báo cáo kiểm định). Hãy hỏi về nó trước khi bàn chuyện khác.',
      choices: [
        { zh: '鄂经理您好。请问你们的钢板有质检报告吗？', py: 'È jīnglǐ nín hǎo. Qǐngwèn nǐmen de gāngbǎn yǒu zhìjiǎn bàogào ma?', vi: 'Chào anh Ngạc. Xin hỏi thép bên anh có báo cáo kiểm định không?',
          grade: 'good', me: 'nghi-ngo', note: 'Hỏi đúng điểm yếu nhất của nhà này.', go: 'a_doc',
          reply: { face: 'sly', zh: '报告？有有有！我马上发给你。', py: 'Bàogào? Yǒu yǒu yǒu! Wǒ mǎshàng fā gěi nǐ.', vi: 'Báo cáo à? Có có có! Tôi gửi ngay cho.' } },
        { zh: '太好了，我们订五吨！', py: 'Tài hǎo le, wǒmen dìng wǔ dūn!', vi: 'Tuyệt quá, chúng tôi đặt năm tấn!',
          grade: 'bad', me: 'vui-ve', note: 'Chưa kiểm tra chất lượng và thời hạn mà đã đặt hàng!', go: 'a_wait',
          reply: { face: 'done', zh: '好好好！先付全款，六十天以后交货！', py: 'Hǎo hǎo hǎo! Xiān fù quánkuǎn, liùshí tiān yǐhòu jiāohuò!', vi: 'Tốt tốt tốt! Trả trước toàn bộ, sáu mươi ngày sau giao hàng!' } },
        { zh: '六十天太长了，能不能三十天交货？', py: 'Liùshí tiān tài cháng le, néng bu néng sānshí tiān jiāohuò?', vi: 'Sáu mươi ngày lâu quá, có thể giao trong ba mươi ngày không?',
          grade: 'ok', me: 'nghi-ngo', note: 'Hỏi thời hạn là đúng, nhưng với nhà này việc đầu tiên nên là báo cáo kiểm định.', go: 'a_askdoc',
          reply: { face: 'annoyed', zh: '三十天？不可能！最快五十天。', py: 'Sānshí tiān? Bù kěnéng! Zuì kuài wǔshí tiān.', vi: 'Ba mươi ngày? Không thể! Nhanh nhất năm mươi ngày.' } },
      ] },
    a_wait: { type: 'say', with: 'supA', who: 'me', me: 'hoang-hot', next: 'a_askdoc',
      zh: '等一下……六十天？我们最晚三十天之前要交货！', py: 'Děng yíxià…… liùshí tiān? Wǒmen zuì wǎn sānshí tiān zhīqián yào jiāohuò!', vi: 'Khoan đã… sáu mươi ngày? Chúng tôi cần hàng chậm nhất trong ba mươi ngày!' },
    a_askdoc: { type: 'say', with: 'supA', who: 'me', me: 'nghi-ngo', next: 'a_doc',
      zh: '请先把质检报告发给我看看。', py: 'Qǐng xiān bǎ zhìjiǎn bàogào fā gěi wǒ kànkan.', vi: 'Anh gửi báo cáo kiểm định cho tôi xem trước đã.' },
    a_doc: { type: 'read', with: 'supA', next: 'a3',
      intro: '鄂经理 vừa gửi báo cáo kiểm định. Đọc kỹ rồi trả lời.',
      guide: 'Xem kỹ các dòng có ngày tháng và so với "hôm nay".',
      doc: { title: { zh: '质量检验报告', py: 'zhìliàng jiǎnyàn bàogào' }, today: { zh: '今天：2026年11月12日', py: 'jīntiān' },
        rows: [
          [{ zh: '产品', py: 'chǎnpǐn' }, { zh: '304不锈钢板', py: 'sān líng sì bùxiùgāng bǎn' }],
          [{ zh: '检验单位', py: 'jiǎnyàn dānwèi' }, { zh: '宏发金属质检部', py: 'Hóngfā Jīnshǔ zhìjiǎnbù' }],
          [{ zh: '检验日期', py: 'jiǎnyàn rìqī' }, { zh: '2024年3月15日' }],
          [{ zh: '有效期至', py: 'yǒuxiàoqī zhì' }, { zh: '2025年3月14日' }],
          [{ zh: '结论', py: 'jiélùn' }, { zh: '合格', py: 'hégé' }],
        ] },
      q: 'Báo cáo này có vấn đề gì?',
      options: [
        { zh: '产品不是304不锈钢板', py: 'chǎnpǐn bú shì sān líng sì bùxiùgāng bǎn', vi: 'Sản phẩm không phải thép tấm inox 304' },
        { zh: '报告已经过期了', py: 'bàogào yǐjīng guòqī le', vi: 'Báo cáo đã hết hạn' },
        { zh: '结论是不合格', py: 'jiélùn shì bù hégé', vi: 'Kết luận là không đạt' },
      ], answer: 1,
      explain: '有效期至 2025年3月14日, tức là đã hết hạn hơn một năm. Ngoài ra đơn vị kiểm định lại chính là phòng của họ, không phải bên thứ ba.' },
    a3: { type: 'ask', with: 'supA',
      line: { face: 'sly', zh: '怎么样？报告没问题吧？', py: 'Zěnmeyàng? Bàogào méi wèntí ba?', vi: 'Thế nào? Báo cáo không có vấn đề gì chứ?' },
      hint: 'Nêu sự thật (báo cáo đã 过期) và đưa ra yêu cầu cụ thể. Không cần nặng lời.',
      choices: [
        { zh: '鄂经理，这份报告去年就过期了。请提供新的报告。', py: 'È jīnglǐ, zhè fèn bàogào qùnián jiù guòqī le. Qǐng tígōng xīn de bàogào.', vi: 'Anh Ngạc, báo cáo này hết hạn từ năm ngoái rồi. Anh vui lòng cung cấp báo cáo mới.',
          grade: 'good', me: 'de-biu', note: 'Nói thẳng sự thật kèm yêu cầu rõ ràng, rất chuyên nghiệp.', go: 'a_end', fx: s => { s.aExposed = true; },
          reply: { face: 'shocked', zh: '啊……这个……新的报告要等两个月。', py: 'À…… zhège…… xīn de bàogào yào děng liǎng ge yuè.', vi: 'À… cái này… báo cáo mới phải chờ hai tháng.' } },
        { zh: '好的，没问题。', py: 'Hǎo de, méi wèntí.', vi: 'Vâng, không vấn đề gì.',
          grade: 'bad', me: 'vui-ve', note: 'Em vừa bỏ qua một báo cáo đã hết hạn! Nếu hàng lỗi, người chịu trách nhiệm là em.', go: 'a_end', fx: s => { s.trustA = true; },
          reply: { face: 'done', zh: '嘿嘿，那我们什么时候签合同？', py: 'Hēihēi, nà wǒmen shénme shíhou qiān hétong?', vi: 'Hề hề, vậy khi nào mình ký hợp đồng?' } },
        { zh: '你骗人！', py: 'Nǐ piàn rén!', vi: 'Anh lừa người ta!',
          grade: 'ok', me: 'de-biu', note: 'Em phát hiện đúng vấn đề, nhưng nói vậy quá gay gắt. Nêu sự thật và yêu cầu là đủ.', go: 'a_end', fx: s => { s.aExposed = true; },
          meAfter: 'so-hai',
          reply: { face: 'angry', zh: '你怎么说话呢！', py: 'Nǐ zěnme shuōhuà ne!', vi: 'Cô cậu ăn nói kiểu gì thế!' } },
      ] },
    a_end: { type: 'say', with: 'supA', who: 'me', me: 'nghi-ngo', next: 'hub',
      zh: '我先跟经理汇报，以后再联系您。', py: 'Wǒ xiān gēn jīnglǐ huìbào, yǐhòu zài liánxì nín.', vi: 'Tôi báo cáo trưởng phòng trước, sẽ liên hệ lại anh sau.' },

    // ================= C · 华美钢业 (báo) =================
    c1: { type: 'ask', with: 'supC', enter: s => { s.calledC = true; },
      line: { zh: '您好，华美钢业，我是鲍经理。我们的钢板质量最好，交货也最快。', py: 'Nín hǎo, Huáměi Gāngyè, wǒ shì Bào jīnglǐ. Wǒmen de gāngbǎn zhìliàng zuì hǎo, jiāohuò yě zuì kuài.', vi: 'Xin chào, Hoa Mỹ đây, tôi là Bào. Thép bên tôi chất lượng tốt nhất, giao cũng nhanh nhất.' },
      hint: 'Giá nhà này vượt ngân sách nhiều, nhưng cứ lịch sự hỏi ưu đãi và xác nhận lại thời hạn, cách thanh toán. Thông tin đó sẽ rất có ích về sau.',
      choices: [
        { zh: '鲍经理您好，我是星辰电器的{me}。你们的价格比别的公司贵，能不能优惠一点？', py: 'Bào jīnglǐ nín hǎo, wǒ shì Xīngchén Diànqì de {mePy}. Nǐmen de jiàgé bǐ bié de gōngsī guì, néng bu néng yōuhuì yìdiǎn?', vi: 'Chào anh Bào, tôi là {me} bên Tinh Thần. Giá bên anh cao hơn các công ty khác, có thể ưu đãi một chút không?',
          grade: 'good', me: 'vui-ve', note: 'Giới thiệu đầy đủ, dùng mẫu 比 và 能不能. Em còn xác nhận được điều kiện tốt nhất thị trường.', go: 'c_end', fx: s => { s.knowC = true; },
          reply: { face: 'happy', zh: '我们是贵一点，但是二十五天就能交货，只要百分之三十定金。价格最低两万元。', py: 'Wǒmen shì guì yìdiǎn, dànshì èrshíwǔ tiān jiù néng jiāohuò, zhǐ yào bǎi fēn zhī sānshí dìngjīn. Jiàgé zuì dī liǎngwàn yuán.', vi: 'Bên tôi có đắt hơn chút, nhưng 25 ngày là giao được, chỉ cần cọc 30%. Giá thấp nhất là 20.000.' } },
        { zh: '请问交货期和付款方式是什么？', py: 'Qǐngwèn jiāohuòqī hé fùkuǎn fāngshì shì shénme?', vi: 'Xin hỏi thời hạn giao hàng và cách thanh toán thế nào?',
          grade: 'ok', me: 'nghi-ngo', note: 'Lấy được thông tin cần thiết, nhưng em chưa giới thiệu mình và chưa thử hỏi ưu đãi.', go: 'c_end', fx: s => { s.knowC = true; },
          reply: { zh: '二十五天交货，先付百分之三十定金。价格是每吨两万一千元。', py: 'Èrshíwǔ tiān jiāohuò, xiān fù bǎi fēn zhī sānshí dìngjīn. Jiàgé shì měi dūn liǎngwàn yìqiān yuán.', vi: 'Giao trong 25 ngày, cọc trước 30%. Giá 21.000 tệ/tấn.' } },
        { zh: '你们太贵了，我不买。', py: 'Nǐmen tài guì le, wǒ bù mǎi.', vi: 'Bên anh đắt quá, tôi không mua.',
          grade: 'bad', me: 'de-biu', note: 'Cúp máy sớm nên mất cơ hội xác nhận điều kiện của họ để làm đòn bẩy với nhà khác.', go: 'hub',
          reply: { face: 'annoyed', zh: '那很遗憾。再见。', py: 'Nà hěn yíhàn. Zàijiàn.', vi: 'Vậy thì tiếc quá. Tạm biệt.' } },
      ] },
    c_end: { type: 'say', with: 'supC', who: 'me', me: 'vui-ve', next: 'hub',
      zh: '好的，我跟经理汇报以后再联系您。谢谢！', py: 'Hǎo de, wǒ gēn jīnglǐ huìbào yǐhòu zài liánxì nín. Xièxie!', vi: 'Vâng, tôi báo cáo trưởng phòng rồi liên hệ lại anh. Cảm ơn anh!' },

    // ================= B · 鑫达钢材 (cáo) =================
    b_open: { type: 'ask', with: 'supB', enter: s => { s.calledB = true; },
      line: { zh: '你好，我是鑫达钢材的胡经理。请问有什么可以帮您？', py: 'Nǐ hǎo, wǒ shì Xīndá Gāngcái de Hú jīnglǐ. Qǐngwèn yǒu shénme kěyǐ bāng nín?', vi: 'Xin chào, tôi là Hồ bên thép Hâm Đạt. Tôi có thể giúp gì?' },
      hint: 'Mở đầu nên có đủ 3 phần: chào hỏi (dùng 您), giới thiệu mình và công ty, nói rõ mục đích cuộc gọi.',
      choices: [
        { zh: '胡经理您好！我是星辰电器采购部的{me}，想跟您谈谈304不锈钢板的价格。', py: 'Hú jīnglǐ nín hǎo! Wǒ shì Xīngchén Diànqì cǎigòubù de {mePy}, xiǎng gēn nín tántan sān líng sì bùxiùgāng bǎn de jiàgé.', vi: 'Chào anh Hồ! Tôi là {me} phòng thu mua Tinh Thần, muốn bàn với anh về giá thép inox 304.',
          grade: 'good', me: 'vui-ve', note: 'Rất chuyên nghiệp: chào, giới thiệu, nêu mục đích.', go: 'b_price1', fx: s => { s.rapport += 1; },
          reply: { face: 'happy', zh: '{me}你好！欢迎欢迎，我们好好谈谈。', py: '{mePy} nǐ hǎo! Huānyíng huānyíng, wǒmen hǎohāo tántan.', vi: 'Chào {me}! Hoan nghênh, chúng ta cùng bàn nhé.' } },
        { zh: '你们的钢板太贵了，便宜点吧！', py: 'Nǐmen de gāngbǎn tài guì le, piányi diǎn ba!', vi: 'Thép bên anh đắt quá, rẻ chút đi!',
          grade: 'bad', me: 'de-biu', note: 'Chưa giới thiệu đã chê đắt, đối tác sẽ phòng thủ ngay.', go: 'b_price1', fx: s => { s.rapport -= 1; },
          meAfter: 'kho-hieu',
          reply: { face: 'shocked', zh: '呃……请问您是哪家公司的？', py: 'È…… qǐngwèn nín shì nǎ jiā gōngsī de?', vi: 'Ơ… xin hỏi anh/chị ở công ty nào vậy?' } },
        { zh: '你好，我要买钢板。', py: 'Nǐ hǎo, wǒ yào mǎi gāngbǎn.', vi: 'Chào anh, tôi muốn mua thép tấm.',
          grade: 'ok', me: 'nghi-ngo', note: 'Không sai, nhưng thiếu giới thiệu công ty và mục đích cụ thể.', go: 'b_price1',
          reply: { face: 'doubt', zh: '好的，请问您是哪家公司的？', py: 'Hǎo de, qǐngwèn nín shì nǎ jiā gōngsī de?', vi: 'Vâng, xin hỏi anh/chị ở công ty nào?' } },
      ] },
    b_price1: { type: 'ask', with: 'supB',
      line: { zh: '我们的报价是每吨一万九千二百元，这已经很优惠了。', py: 'Wǒmen de bàojià shì měi dūn yíwàn jiǔqiān èrbǎi yuán, zhè yǐjīng hěn yōuhuì le.', vi: 'Báo giá của chúng tôi là 19.200 tệ/tấn, mức này đã rất ưu đãi rồi.' },
      hint: 'Đừng nhận giá đầu tiên! Dùng "如果……的话，能不能……？" và ra giá thấp hơn mục tiêu (18.000) một chút để còn chỗ thương lượng.',
      choices: [
        { zh: '如果我们订五吨的话，能不能便宜一点？比如每吨一万七千五。', py: 'Rúguǒ wǒmen dìng wǔ dūn dehuà, néng bu néng piányi yìdiǎn? Bǐrú měi dūn yíwàn qīqiān wǔ.', vi: 'Nếu chúng tôi đặt 5 tấn thì có thể rẻ hơn không? Ví dụ 17.500/tấn.',
          grade: 'good', me: 'vui-ve', note: 'Ra giá thấp hơn mục tiêu nên đối tác đã phải nhượng bộ.', go: 'b_price2', fx: s => { s.price = 18500; },
          reply: { face: 'doubt', zh: '一万七千五太低了。这样吧，一万八千五，怎么样？', py: 'Yíwàn qīqiān wǔ tài dī le. Zhèyàng ba, yíwàn bāqiān wǔ, zěnmeyàng?', vi: '17.500 thấp quá. Thế này nhé, 18.500, được không?' } },
        { zh: '好的，就按这个价格吧。', py: 'Hǎo de, jiù àn zhège jiàgé ba.', vi: 'Được, cứ theo giá này đi.',
          grade: 'bad', me: 'vui-ve', note: 'Chấp nhận ngay giá đầu tiên thì vượt ngân sách 1.200 tệ/tấn.', go: 'b_delivery',
          reply: { face: 'sly', zh: '好！{me}真爽快！', py: 'Hǎo! {mePy} zhēn shuǎngkuai!', vi: 'Tốt! {me} thật dứt khoát!' } },
        { zh: '一万七千五，不行的话我们就找别的供应商。', py: 'Yíwàn qīqiān wǔ, bù xíng dehuà wǒmen jiù zhǎo bié de gōngyìngshāng.', vi: '17.500, không được thì chúng tôi tìm nhà cung cấp khác.',
          grade: 'ok', me: 'de-biu', note: 'Đe doạ khiến đối tác "cứng" lại, giảm ít hơn.', go: 'b_price2', fx: s => { s.price = 18800; s.rapport -= 1; },
          reply: { face: 'annoyed', zh: '这么说就没意思了。最低一万八千八。', py: 'Zhème shuō jiù méi yìsi le. Zuì dī yíwàn bāqiān bā.', vi: 'Nói vậy thì mất vui rồi. Thấp nhất 18.800.' } },
      ] },
    b_price2: { type: 'ask', with: 'supB', line: null, // dùng câu đáp của lượt trước
      hint: 'Nhắc tới ngân sách và 长期合作 (hợp tác lâu dài). Tuyệt đối không bịa giá của nhà khác: 胡经理 rất rành thị trường.',
      choices: [
        { zh: '我们的预算有限。如果以后长期合作，每吨一万八千元可以吗？', py: 'Wǒmen de yùsuàn yǒuxiàn. Rúguǒ yǐhòu chángqī hézuò, měi dūn yíwàn bāqiān yuán kěyǐ ma?', vi: 'Ngân sách của chúng tôi có hạn. Nếu sau này hợp tác lâu dài, 18.000/tấn được không?',
          grade: 'good', me: 'vui-ve', note: 'Lý do hợp lý cộng với lợi ích lâu dài là cách thuyết phục tốt nhất.', go: 'b_delivery', fx: s => { s.price = s.rapport >= 0 ? 18000 : 18300; },
          reply: s => s.rapport >= 0
            ? { face: 'done', zh: '好吧，看在长期合作的份上，一万八千元！', py: 'Hǎo ba, kàn zài chángqī hézuò de fèn shang, yíwàn bāqiān yuán!', vi: 'Thôi được, vì hợp tác lâu dài, 18.000!' }
            : { face: 'annoyed', zh: '一万八千三，不能再低了。', py: 'Yíwàn bāqiān sān, bù néng zài dī le.', vi: '18.300, không thể thấp hơn nữa.' } },
        { zh: '那就这个价格吧。', py: 'Nà jiù zhège jiàgé ba.', vi: 'Vậy lấy giá này đi.',
          grade: 'bad', me: 'nghi-ngo', note: 'Dừng quá sớm, giá vẫn vượt ngân sách.', go: 'b_delivery',
          reply: { face: 'sly', zh: '好的，没问题。', py: 'Hǎo de, méi wèntí.', vi: 'Vâng, không vấn đề.' } },
        { zh: '你们比宏发金属贵多了！', py: 'Nǐmen bǐ Hóngfā Jīnshǔ guì duō le!', vi: 'Bên anh đắt hơn Hồng Phát nhiều!',
          grade: 'bad', me: 'kinh-ngac', note: 'So với một nhà yếu hơn hẳn về chất lượng thì bị phản đòn ngay.', go: 'b_delivery', fx: s => { s.rapport -= 1; },
          meAfter: 'kho-hieu',
          reply: { face: 'annoyed', zh: '但是宏发没有质检报告啊。质量比价格更重要，对吧？', py: 'Dànshì Hóngfā méiyǒu zhìjiǎn bàogào a. Zhìliàng bǐ jiàgé gèng zhòngyào, duì ba?', vi: 'Nhưng Hồng Phát không có báo cáo kiểm định mà. Chất lượng quan trọng hơn giá, đúng không?' } },
        { zh: '别的公司只要一万六千元。', py: 'Bié de gōngsī zhǐ yào yíwàn liùqiān yuán.', vi: 'Công ty khác chỉ lấy 16.000 thôi.',
          grade: 'bad', me: 'hoang-hot', note: 'Bịa giá là mất uy tín ngay: đối tác biết rõ giá thị trường. Từ giờ anh ấy sẽ khó nhượng bộ hơn.', go: 'b_delivery', fx: s => { s.rapport -= 2; s.lied = true; },
          meAfter: 'so-hai',
          reply: { face: 'sly', zh: '一万六？现在304钢板的市场价我很清楚。您是在开玩笑吧？', py: 'Yíwàn liù? Xiànzài sān líng sì gāngbǎn de shìchǎng jià wǒ hěn qīngchu. Nín shì zài kāi wánxiào ba?', vi: '16.000? Giá thị trường thép 304 hiện nay tôi nắm rất rõ. Anh/chị đang đùa phải không?' } },
      ] },
    b_delivery: { type: 'ask', with: 'supB',
      line: s => s.retry
        ? { zh: '交货期方面，我们现在是{days}天。', py: 'Jiāohuòqī fāngmiàn, wǒmen xiànzài shì {days} tiān.', vi: 'Về thời hạn giao hàng, hiện giờ là {days} ngày.' }
        : { zh: '价格就这样定了。我们的交货期是三十五天。', py: 'Jiàgé jiù zhèyàng dìng le. Wǒmen de jiāohuòqī shì sānshíwǔ tiān.', vi: 'Giá chốt vậy nhé. Thời hạn giao hàng của chúng tôi là 35 ngày.' },
      hint: s => 'Sếp yêu cầu giao trong 30 ngày. Nêu lý do (dự án bắt đầu sản xuất) và dùng "最晚……之前".' + (s.knowC ? ' Em cũng có thể nhắc tới điều kiện đã xác nhận được với 华美钢业.' : ''),
      choices: [
        { zh: '我们的项目下个月开始生产，最晚三十天之前必须交货，能不能安排一下？', py: 'Wǒmen de xiàngmù xià ge yuè kāishǐ shēngchǎn, zuì wǎn sānshí tiān zhīqián bìxū jiāohuò, néng bu néng ānpái yíxià?', vi: 'Dự án của chúng tôi tháng sau bắt đầu sản xuất, chậm nhất 30 ngày phải giao, anh sắp xếp được không?',
          grade: 'good', me: 'vui-ve', note: 'Có lý do rõ ràng nên yêu cầu rất thuyết phục.', go: s => s.retry ? unmet(s, 'deposit') : 'b_payment', fx: s => { s.days = s.rapport >= 1 ? 28 : 30; },
          reply: s => s.rapport >= 1
            ? { face: 'happy', zh: '我跟工厂商量一下……没问题，二十八天交货！', py: 'Wǒ gēn gōngchǎng shāngliang yíxià…… méi wèntí, èrshíbā tiān jiāohuò!', vi: 'Để tôi bàn với nhà máy… Được, 28 ngày giao hàng!' }
            : { face: 'doubt', zh: '我跟工厂商量一下……好吧，三十天交货。', py: 'Wǒ gēn gōngchǎng shāngliang yíxià…… hǎo ba, sānshí tiān jiāohuò.', vi: 'Để tôi bàn với nhà máy… Thôi được, 30 ngày.' } },
        { show: s => s.knowC,
          zh: '华美钢业二十五天就能交货。你们三十天之前交货，可以吗？', py: 'Huáměi Gāngyè èrshíwǔ tiān jiù néng jiāohuò. Nǐmen sānshí tiān zhīqián jiāohuò, kěyǐ ma?', vi: 'Hoa Mỹ 25 ngày là giao được. Bên anh giao trước 30 ngày được không?',
          grade: 'good', me: 'vui-ve', note: 'Dùng thông tin thật từ nhà khác làm đòn bẩy. Đây là lợi ích của việc hỏi nhiều nhà!', go: s => s.retry ? unmet(s, 'deposit') : 'b_payment', fx: s => { s.days = 28; s.leverage = true; },
          reply: { face: 'shocked', zh: '华美？……好吧，我们二十八天交货！', py: 'Huáměi? …… Hǎo ba, wǒmen èrshíbā tiān jiāohuò!', vi: 'Hoa Mỹ à? … Thôi được, bên tôi giao trong 28 ngày!' } },
        { zh: '这个时间也可以。', py: 'Zhège shíjiān yě kěyǐ.', vi: 'Thời gian này cũng được.',
          grade: 'bad', me: 'nghi-ngo', note: 'Quá hạn 30 ngày sếp yêu cầu, nhà máy sẽ phải chờ nguyên liệu.', go: s => s.retry ? unmet(s, 'deposit') : 'b_payment',
          reply: { face: 'sly', zh: '好的。', py: 'Hǎo de.', vi: 'Vâng.' } },
        { zh: '太慢了！你们怎么这么慢？', py: 'Tài màn le! Nǐmen zěnme zhème màn?', vi: 'Chậm quá! Sao các anh chậm vậy?',
          grade: 'bad', me: 'de-biu', note: 'Phàn nàn mà không đưa ra lý do nên đối tác không có động lực giúp.', go: s => s.retry ? unmet(s, 'deposit') : 'b_payment', fx: s => { s.days = Math.min(s.days, 32); s.rapport -= 1; },
          meAfter: 'kho-chiu',
          reply: { face: 'annoyed', zh: '我们也有很多订单。最快也要三十二天。', py: "Wǒmen yě yǒu hěn duō dìngdān. Zuì kuài yě yào sānshí'èr tiān.", vi: 'Chúng tôi cũng nhiều đơn lắm. Nhanh nhất cũng 32 ngày.' } },
      ] },
    b_payment: { type: 'ask', with: 'supB',
      line: s => s.retry
        ? { zh: '付款方面，现在是先付百分之{deposit}。', py: 'Fùkuǎn fāngmiàn, xiànzài shì xiān fù bǎi fēn zhī {deposit}.', vi: 'Về thanh toán, hiện giờ là trả trước {deposit}%.' }
        : { zh: '付款方式呢，我们一般要求全款预付。', py: 'Fùkuǎn fāngshì ne, wǒmen yìbān yāoqiú quánkuǎn yùfù.', vi: 'Về thanh toán, chúng tôi thường yêu cầu trả trước toàn bộ.' },
      hint: 'Mục tiêu là cọc 30%, giao hàng trả 70%. Dùng mẫu "先……，再……" và giải thích nhẹ nhàng.',
      choices: [
        { zh: '全款预付对我们压力比较大。能不能先付百分之三十定金，交货以后再付百分之七十？', py: 'Quánkuǎn yùfù duì wǒmen yālì bǐjiào dà. Néng bu néng xiān fù bǎi fēn zhī sānshí dìngjīn, jiāohuò yǐhòu zài fù bǎi fēn zhī qīshí?', vi: 'Trả trước toàn bộ khá áp lực với chúng tôi. Có thể cọc 30%, giao hàng xong trả 70% không?',
          grade: 'good', me: 'vui-ve', note: 'Đề xuất cụ thể kèm lý do, dùng đúng mẫu 先……再…….', go: s => s.retry ? 'b_close_r' : 'b_close', fx: s => { s.deposit = Math.min(s.deposit, s.rapport >= 0 ? 30 : 50); },
          reply: s => s.rapport >= 0
            ? { face: 'done', zh: '可以，就按你说的办。', py: 'Kěyǐ, jiù àn nǐ shuō de bàn.', vi: 'Được, làm theo ý anh/chị.' }
            : { face: 'doubt', zh: '那至少先付百分之五十。', py: 'Nà zhìshǎo xiān fù bǎi fēn zhī wǔshí.', vi: 'Vậy ít nhất phải cọc trước 50%.' } },
        { show: s => s.knowC,
          zh: '华美钢业只要百分之三十定金。如果你们也可以，我们就订你们的。', py: 'Huáměi Gāngyè zhǐ yào bǎi fēn zhī sānshí dìngjīn. Rúguǒ nǐmen yě kěyǐ, wǒmen jiù dìng nǐmen de.', vi: 'Hoa Mỹ chỉ cần cọc 30%. Nếu bên anh cũng được thì chúng tôi đặt bên anh.',
          grade: 'good', me: 'vui-ve', note: 'Đòn bẩy bằng thông tin thật, kèm lời hứa đặt hàng. Rất khéo!', go: s => s.retry ? 'b_close_r' : 'b_close', fx: s => { s.deposit = 30; s.leverage = true; },
          reply: { face: 'doubt', zh: '……行，那就百分之三十。', py: '…… Xíng, nà jiù bǎi fēn zhī sānshí.', vi: '… Được, vậy 30%.' } },
        { zh: '好的，就按你们的要求。', py: 'Hǎo de, jiù àn nǐmen de yāoqiú.', vi: 'Được, cứ theo yêu cầu của bên anh.',
          grade: 'bad', me: 'nghi-ngo', note: 'Trả trước nhiều là rủi ro lớn: nếu hàng lỗi, công ty khó đòi lại tiền.', go: s => s.retry ? 'b_close_r' : 'b_close',
          reply: { face: 'sly', zh: '好，合作愉快！', py: 'Hǎo, hézuò yúkuài!', vi: 'Tốt, hợp tác vui vẻ!' } },
        { zh: '我们不付定金，交货以后再付款。', py: 'Wǒmen bú fù dìngjīn, jiāohuò yǐhòu zài fùkuǎn.', vi: 'Chúng tôi không cọc, giao hàng xong mới trả.',
          grade: 'bad', me: 'de-biu', note: 'Đòi hỏi một phía nên bị từ chối, kết quả còn tệ hơn.', go: s => s.retry ? 'b_close_r' : 'b_close', fx: s => { s.deposit = Math.min(s.deposit, 50); s.rapport -= 1; },
          meAfter: 'kho-chiu',
          reply: { face: 'annoyed', zh: '这不行。至少先付百分之五十。', py: 'Zhè bù xíng. Zhìshǎo xiān fù bǎi fēn zhī wǔshí.', vi: 'Không được. Ít nhất phải trả trước 50%.' } },
      ] },
    b_close: { type: 'ask', with: 'supB',
      line: { zh: '那我们今天就谈到这里？', py: 'Nà wǒmen jīntiān jiù tán dào zhèlǐ?', vi: 'Vậy hôm nay chúng ta bàn đến đây nhé?' },
      hint: 'Kết thúc lịch sự: cảm ơn và nói rõ bước tiếp theo. Nhớ là em còn phải 汇报 với sếp rồi mới chốt được.',
      choices: [
        { zh: '好的，谢谢胡经理！我向经理汇报以后，尽快给您回复。', py: 'Hǎo de, xièxie Hú jīnglǐ! Wǒ xiàng jīnglǐ huìbào yǐhòu, jǐnkuài gěi nín huífù.', vi: 'Vâng, cảm ơn anh Hồ! Tôi báo cáo trưởng phòng xong sẽ sớm trả lời anh.',
          grade: 'good', me: 'hoan-thanh', note: 'Kết thúc chuyên nghiệp, không tự ý chốt khi chưa báo cáo sếp.', go: 'hub', fx: s => { s.rapport += 1; s.doneB = true; },
          reply: { face: 'done', zh: '不客气，等您的好消息！', py: 'Bú kèqi, děng nín de hǎo xiāoxi!', vi: 'Không có gì, chờ tin tốt của anh/chị!' } },
        { zh: '行，拜拜。', py: 'Xíng, bàibai.', vi: 'Ừ, bye bye.',
          grade: 'ok', me: 'vui-ve', note: 'Hơi suồng sã cho một cuộc đàm phán, và chưa nói bước tiếp theo.', go: 'hub', fx: s => { s.doneB = true; },
          reply: { face: 'doubt', zh: '嗯……再见。', py: 'Ǹg…… zàijiàn.', vi: 'Ừm… tạm biệt.' } },
        { zh: '好，我们现在就签合同！', py: 'Hǎo, wǒmen xiànzài jiù qiān hétong!', vi: 'Được, chúng ta ký hợp đồng ngay bây giờ!',
          grade: 'bad', me: 'vui-ve', note: 'Em chưa báo cáo và chưa được sếp duyệt, không được tự ý ký!', go: 'hub', fx: s => { s.doneB = true; s.hasty = true; },
          meAfter: 'kho-hieu',
          reply: { face: 'sly', zh: '这么快？您不用先问问经理吗？', py: 'Zhème kuài? Nín búyòng xiān wènwen jīnglǐ ma?', vi: 'Nhanh vậy? Anh/chị không cần hỏi trưởng phòng trước à?' } },
      ] },

    // ----- Đàm phán lại lần hai (sau khi sếp chưa hài lòng) -----
    b_retry: { type: 'say', with: 'supB', who: 'supB', face: 'doubt', me: 'kho-chiu', next: s => unmet(s, 'price'), enter: s => { s.retry = true; s.retried = true; },
      zh: '{me}，又是您啊。还有什么问题吗？', py: '{mePy}, yòu shì nín a. Hái yǒu shénme wèntí ma?', vi: '{me}, lại là anh/chị à. Còn vấn đề gì nữa không?' },
    b_price_r: { type: 'ask', with: 'supB',
      line: { zh: '价格方面，现在是每吨{price}元。您还想谈？', py: 'Jiàgé fāngmiàn, xiànzài shì měi dūn {price} yuán. Nín hái xiǎng tán?', vi: 'Về giá, hiện giờ là {price} tệ/tấn. Anh/chị vẫn muốn bàn tiếp?' },
      hint: 'Đưa ra một lợi ích cụ thể cho đối tác: ký ngay hôm nay nếu được giá mục tiêu.',
      choices: [
        { zh: '我们经理说，如果每吨一万八千元，今天就可以签合同。', py: 'Wǒmen jīnglǐ shuō, rúguǒ měi dūn yíwàn bāqiān yuán, jīntiān jiù kěyǐ qiān hétong.', vi: 'Trưởng phòng chúng tôi nói, nếu 18.000 tệ/tấn thì hôm nay ký hợp đồng được ngay.',
          grade: 'good', me: 'vui-ve', note: 'Có "ký ngay hôm nay" làm mồi nên đề nghị hấp dẫn hơn hẳn.', go: s => unmet(s, 'days'), fx: s => { s.price = s.rapport >= -1 ? 18000 : 18200; },
          reply: s => s.rapport >= -1
            ? { face: 'done', zh: '今天就签？好，一万八千元！', py: 'Jīntiān jiù qiān? Hǎo, yíwàn bāqiān yuán!', vi: 'Ký ngay hôm nay? Được, 18.000!' }
            : { face: 'annoyed', zh: '一万八千二，这是最后的价格。', py: 'Yíwàn bāqiān èr, zhè shì zuìhòu de jiàgé.', vi: '18.200, đây là giá cuối cùng.' } },
        { zh: '再便宜一点吧，拜托您了。', py: 'Zài piányi yìdiǎn ba, bàituō nín le.', vi: 'Rẻ thêm chút nữa đi, nhờ anh đấy.',
          grade: 'ok', me: 'nghi-ngo', note: 'Nài nỉ mà không có lý do thì chỉ được nhượng bộ rất ít.', go: s => unmet(s, 'days'), fx: s => { s.price -= 100; },
          reply: { face: 'doubt', zh: '好吧好吧，再便宜一百元。', py: 'Hǎo ba hǎo ba, zài piányi yìbǎi yuán.', vi: 'Thôi được rồi, bớt thêm 100 tệ.' } },
        { zh: '价格就不谈了。', py: 'Jiàgé jiù bù tán le.', vi: 'Giá thì thôi không bàn nữa.',
          grade: 'bad', me: 'nghi-ngo', note: 'Giá vẫn vượt ngân sách mà em bỏ qua cơ hội thương lượng lại.', go: s => unmet(s, 'days'),
          reply: { face: 'sly', zh: '好的。', py: 'Hǎo de.', vi: 'Vâng.' } },
      ] },
    b_close_r: { type: 'say', with: 'supB', who: 'me', me: 'vui-ve', next: 'r1', fx: s => { s.retry = false; },
      zh: '谢谢胡经理，我再向经理汇报一下。', py: 'Xièxie Hú jīnglǐ, wǒ zài xiàng jīnglǐ huìbào yíxià.', vi: 'Cảm ơn anh Hồ, tôi sẽ báo cáo lại với trưởng phòng.' },

    // ================= BÁO CÁO SẾP (汇报) =================
    r1: { type: 'ask', with: 'boss', bg: 'office',
      line: { zh: '{me}，询价的情况怎么样？你推荐哪家？', py: '{mePy}, xúnjià de qíngkuàng zěnmeyàng? Nǐ tuījiàn nǎ jiā?', vi: '{me}, tình hình hỏi giá thế nào? Em đề xuất nhà nào?' },
      hint: 'Báo cáo tốt phải có số liệu: giá, thời hạn giao, cách thanh toán. Đừng đề xuất nhà không có kiểm định hoặc vượt xa ngân sách.',
      choices: [
        { show: s => s.calledB,
          zh: '我推荐鑫达钢材。价格是每吨{price}元，{days}天交货，先付百分之{deposit}定金。', py: 'Wǒ tuījiàn Xīndá Gāngcái. Jiàgé shì měi dūn {price} yuán, {days} tiān jiāohuò, xiān fù bǎi fēn zhī {deposit} dìngjīn.', vi: 'Em đề xuất Hâm Đạt. Giá {price} tệ/tấn, giao trong {days} ngày, cọc trước {deposit}%.',
          grade: 'good', me: 'vui-ve', note: 'Báo cáo gọn và đủ ba con số sếp cần.', go: s => allMet(s) ? 'r_ok' : 'r_gap',
          reply: s => allMet(s)
            ? { face: 'happy', zh: '嗯，数字很清楚。', py: 'Ǹg, shùzì hěn qīngchu.', vi: 'Ừ, số liệu rất rõ ràng.' }
            : { face: 'doubt', zh: '嗯……我看看这些数字。', py: 'Ǹg…… wǒ kànkan zhèxiē shùzì.', vi: 'Ừm… để tôi xem mấy con số này.' } },
        { show: s => s.calledB,
          zh: '鑫达钢材不错，胡经理人很好。', py: 'Xīndá Gāngcái búcuò, Hú jīnglǐ rén hěn hǎo.', vi: 'Hâm Đạt khá ổn, anh Hồ rất dễ mến.',
          grade: 'ok', me: 'vui-ve', note: 'Báo cáo công việc cần số liệu, không phải cảm nhận.', go: s => allMet(s) ? 'r_ok' : 'r_gap',
          meAfter: 'kho-hieu',
          reply: { face: 'doubt', zh: '人很好？我要的是数字：价格、交货期、付款方式。', py: 'Rén hěn hǎo? Wǒ yào de shì shùzì: jiàgé, jiāohuòqī, fùkuǎn fāngshì.', vi: 'Dễ mến? Tôi cần số liệu: giá, thời hạn giao, cách thanh toán.' } },
        { show: s => s.calledA,
          zh: '我推荐宏发金属，他们最便宜。', py: 'Wǒ tuījiàn Hóngfā Jīnshǔ, tāmen zuì piányi.', vi: 'Em đề xuất Hồng Phát, họ rẻ nhất.',
          grade: 'bad', me: 'vui-ve', note: 'Báo cáo kiểm định của họ đã hết hạn và giao hàng 50–60 ngày. Rẻ nhất chưa chắc tốt nhất!', go: 'r_A',
          meAfter: 'hoang-hot',
          reply: { face: 'doubt', zh: '宏发？他们的质检报告呢？交货期呢？', py: 'Hóngfā? Tāmen de zhìjiǎn bàogào ne? Jiāohuòqī ne?', vi: 'Hồng Phát? Báo cáo kiểm định của họ đâu? Thời hạn giao thì sao?' } },
        { show: s => s.calledC,
          zh: '我推荐华美钢业，他们交货最快。', py: 'Wǒ tuījiàn Huáměi Gāngyè, tāmen jiāohuò zuì kuài.', vi: 'Em đề xuất Hoa Mỹ, họ giao nhanh nhất.',
          grade: 'ok', me: 'nghi-ngo', note: 'Giá của Hoa Mỹ vượt ngân sách quá xa. Nhưng điều kiện của họ là đòn bẩy tốt.', go: 'hub',
          meAfter: 'buon-ba',
          reply: { face: 'worried', zh: '华美超过预算两千多元，不行。不过，你可以用华美的条件去跟别的公司谈。', py: 'Huáměi chāoguò yùsuàn liǎngqiān duō yuán, bù xíng. Búguò, nǐ kěyǐ yòng Huáměi de tiáojiàn qù gēn bié de gōngsī tán.', vi: 'Hoa Mỹ vượt ngân sách hơn 2.000 tệ, không được. Nhưng em có thể dùng điều kiện của Hoa Mỹ để đàm phán với nhà khác.' } },
      ] },
    r_A: { type: 'say', with: 'boss', who: 'boss', face: 'angry', me: 'so-hai', next: 'hub', bg: 'office',
      zh: '质量出了问题，谁负责？再去问问别的供应商！', py: 'Zhìliàng chū le wèntí, shéi fùzé? Zài qù wènwen bié de gōngyìngshāng!', vi: 'Chất lượng có vấn đề thì ai chịu trách nhiệm? Đi hỏi nhà cung cấp khác đi!' },
    r_ok: { type: 'say', with: 'boss', who: 'boss', face: 'approve', next: 'ev0', bg: 'office', fx: s => { s.approved = true; },
      zh: '很好！条件都达到了目标。就订鑫达钢材。', py: 'Hěn hǎo! Tiáojiàn dōu dádào le mùbiāo. Jiù dìng Xīndá Gāngcái.', vi: 'Rất tốt! Các điều kiện đều đạt mục tiêu. Chốt Hâm Đạt.' },
    r_gap: { type: 'ask', with: 'boss', bg: 'office',
      line: { face: 'worried', zh: '有的条件还没达到目标。你打算怎么办？', py: 'Yǒude tiáojiàn hái méi dádào mùbiāo. Nǐ dǎsuàn zěnme bàn?', vi: 'Có điều kiện còn chưa đạt mục tiêu. Em định làm thế nào?' },
      hint: 'Em có thể tự đàm phán lại (tốt nhất), hoặc lịch sự nhờ sếp ra mặt (được việc nhưng bị trừ điểm). Việc vượt quyền thì phải 请示, không được "差不多".',
      choices: [
        { show: s => !s.retried,
          zh: '我再跟胡经理谈一次。', py: 'Wǒ zài gēn Hú jīnglǐ tán yí cì.', vi: 'Em sẽ đàm phán với anh Hồ thêm một lần nữa.',
          grade: 'good', me: 'vui-ve', note: 'Chủ động tự giải quyết trước khi nhờ sếp. Tinh thần rất tốt!', go: 'b_retry',
          reply: { face: 'happy', zh: '好，去吧。', py: 'Hǎo, qù ba.', vi: 'Tốt, đi đi.' } },
        { show: s => !s.bossHelp,
          zh: '{boss}，能不能请您帮我跟胡经理沟通一下？', py: '{bossPy}, néng bu néng qǐng nín bāng wǒ gēn Hú jīnglǐ gōutōng yíxià?', vi: '{boss}, có thể nhờ anh trao đổi giúp em với anh Hồ được không ạ?',
          grade: 'ok', me: 'nghi-ngo', score: -15, note: 'Nhờ đúng cách: dùng 请您 và nói rõ việc cần giúp. Sếp ra mặt thì được việc, nhưng em bị trừ 15 điểm.', go: 'bh1', fx: s => { s.bossHelp = true; },
          reply: { face: 'doubt', zh: '好吧，我给他打个电话。', py: 'Hǎo ba, wǒ gěi tā dǎ ge diànhuà.', vi: 'Thôi được, để tôi gọi cho anh ta.' } },
        { show: s => !s.rudeAsk && !s.bossHelp,
          zh: '经理，你去跟他说吧。', py: 'Jīnglǐ, nǐ qù gēn tā shuō ba.', vi: 'Sếp ơi, sếp nói với anh ta đi.',
          grade: 'bad', me: 'de-biu', note: 'Nhờ cấp trên mà dùng 你 và giọng ra lệnh là rất thất lễ.', go: 'r_gap', fx: s => { s.rudeAsk = true; },
          meAfter: 'buon-ba',
          reply: { face: 'annoyed', zh: '这是你的工作。想好了再来找我。', py: 'Zhè shì nǐ de gōngzuò. Xiǎng hǎo le zài lái zhǎo wǒ.', vi: 'Đây là việc của em. Nghĩ kỹ rồi hẵng tìm tôi.' } },
        { show: s => !s.sloppy,
          zh: '差不多就行了吧。', py: 'Chàbuduō jiù xíng le ba.', vi: 'Gần đạt là được rồi mà.',
          grade: 'bad', me: 'vui-ve', note: 'Ngân sách là quy định của công ty. Vượt thì phải xin ý kiến, không thể "gần đạt".', go: 'r_gap', fx: s => { s.sloppy = true; },
          meAfter: 'so-hai',
          reply: { face: 'angry', zh: '"差不多"不行！公司的预算是有规定的。', py: '"Chàbuduō" bù xíng! Gōngsī de yùsuàn shì yǒu guīdìng de.', vi: '"Gần đạt" là không được! Ngân sách công ty có quy định hẳn hoi.' } },
        { show: s => s.retried,
          zh: '{boss}，我已经尽力了。这个条件可以批准吗？', py: '{bossPy}, wǒ yǐjīng jìnlì le. Zhège tiáojiàn kěyǐ pīzhǔn ma?', vi: '{boss}, em đã cố hết sức rồi. Điều kiện này anh có thể duyệt không ạ?',
          grade: 'ok', me: 'nghi-ngo', note: 'Đây là 请示 đúng cách: nêu rõ đã cố gắng và xin phê duyệt. Tuy vậy kết quả chưa đạt hết mục tiêu.', go: 'ev0', fx: s => { s.approved = true; },
          reply: { face: 'worried', zh: '好吧，这次特别批准。下次要做得更好。', py: 'Hǎo ba, zhè cì tèbié pīzhǔn. Xià cì yào zuò de gèng hǎo.', vi: 'Thôi được, lần này duyệt đặc biệt. Lần sau phải làm tốt hơn.' } },
      ] },

    // ----- Sếp ra mặt -----
    bh1: { type: 'say', with: 'boss', who: 'boss', next: 'bh2', bg: 'office',
      zh: '喂，胡经理吗？我是星辰电器的{bossSelf}。我们以后每个月都有订单，这次请给我们最好的条件。', py: 'Wéi, Hú jīnglǐ ma? Wǒ shì Xīngchén Diànqì de {bossSelfPy}. Wǒmen yǐhòu měi ge yuè dōu yǒu dìngdān, zhè cì qǐng gěi wǒmen zuì hǎo de tiáojiàn.', vi: 'A lô, anh Hồ à? Tôi là {bossSelf} bên Tinh Thần. Sau này tháng nào chúng tôi cũng có đơn, lần này anh cho điều kiện tốt nhất nhé.' },
    bh2: { type: 'say', with: 'supB', who: 'supB', face: 'done', next: 'bh3', bg: 'meeting',
      fx: s => { s.price = Math.min(s.price, T.price); s.days = Math.min(s.days, T.days); s.deposit = Math.min(s.deposit, T.deposit); },
      zh: '{boss}亲自打电话，当然没问题！每吨一万八千元，三十天交货，百分之三十定金。', py: '{bossPy} qīnzì dǎ diànhuà, dāngrán méi wèntí! Měi dūn yíwàn bāqiān yuán, sānshí tiān jiāohuò, bǎi fēn zhī sānshí dìngjīn.', vi: '{boss} đích thân gọi thì tất nhiên không vấn đề! 18.000 tệ/tấn, giao trong 30 ngày, cọc 30%.' },
    bh3: { type: 'say', with: 'boss', who: 'boss', face: 'doubt', me: 'buon-ba', next: 'ev0', bg: 'office', fx: s => { s.approved = true; },
      zh: '这次我帮你，下次你要自己解决。', py: 'Zhè cì wǒ bāng nǐ, xià cì nǐ yào zìjǐ jiějué.', vi: 'Lần này tôi giúp, lần sau em phải tự giải quyết.' },

    // ================= TÌNH HUỐNG PHÁT SINH =================
    ev0: { type: 'say', with: 'boss', who: 'boss', face: 'worried', me: 'kho-hieu', next: 'ev1', bg: 'office',
      guide: '⚡ Tình huống phát sinh! Nghĩ xem: có cần cả 5 tấn về sớm không? Nhớ từ <b>分批</b> (chia đợt) ở bài 1.',
      zh: '等一下！刚接到通知：项目提前了，第一批两吨钢板二十天之内就要到！', py: 'Děng yíxià! Gāng jiēdào tōngzhī: xiàngmù tíqián le, dì-yī pī liǎng dūn gāngbǎn èrshí tiān zhīnèi jiù yào dào!', vi: 'Khoan đã! Vừa có thông báo: dự án bị đẩy sớm, đợt đầu hai tấn thép phải về trong vòng 20 ngày!' },
    ev1: { type: 'ask', with: 'supB',
      line: { zh: '{me}，合同我正在准备。还有事吗？', py: '{mePy}, hétong wǒ zhèngzài zhǔnbèi. Hái yǒu shì ma?', vi: '{me}, tôi đang soạn hợp đồng. Còn việc gì nữa không?' },
      hint: 'Chỉ 2 tấn cần về sớm. Đề nghị 分批交货 (giao theo đợt): 2 tấn trước, 3 tấn còn lại theo thời hạn cũ.',
      choices: [
        { zh: '胡经理，我们的项目提前了。能不能分批交货？先交两吨，二十天之内到，剩下的三吨按原来的时间。', py: 'Hú jīnglǐ, wǒmen de xiàngmù tíqián le. Néng bu néng fēnpī jiāohuò? Xiān jiāo liǎng dūn, èrshí tiān zhīnèi dào, shèngxià de sān dūn àn yuánlái de shíjiān.', vi: 'Anh Hồ, dự án của chúng tôi bị đẩy sớm. Có thể giao theo đợt không? Giao trước 2 tấn trong 20 ngày, 3 tấn còn lại theo thời gian cũ.',
          grade: 'good', me: 'vui-ve', note: 'Giải pháp thông minh: chỉ yêu cầu đúng phần thật sự cần gấp.', go: 'email', fx: s => { s.partial = true; s.rushDone = true; if (s.rapport < 1) s.price += 100; },
          reply: s => s.rapport >= 1
            ? { face: 'happy', zh: '分批交货？可以，两吨不多，我来安排。', py: 'Fēnpī jiāohuò? Kěyǐ, liǎng dūn bù duō, wǒ lái ānpái.', vi: 'Giao theo đợt à? Được, hai tấn không nhiều, để tôi sắp xếp.' }
            : { face: 'doubt', zh: '分批的话要多送一次，每吨要加一百元运费。', py: 'Fēnpī dehuà yào duō sòng yí cì, měi dūn yào jiā yìbǎi yuán yùnfèi.', vi: 'Giao theo đợt thì phải chở thêm một chuyến, mỗi tấn cộng 100 tệ phí vận chuyển.' } },
        { zh: '五吨都要二十天之内到，多少钱都可以！', py: 'Wǔ dūn dōu yào èrshí tiān zhīnèi dào, duōshao qián dōu kěyǐ!', vi: 'Cả năm tấn phải về trong 20 ngày, bao nhiêu tiền cũng được!',
          grade: 'bad', me: 'hoang-hot', note: '"Bao nhiêu tiền cũng được" là câu cấm kỵ khi mua hàng. Mà thật ra chỉ 2 tấn cần gấp thôi.', go: 'email', fx: s => { s.price += 500; s.days = 20; s.rushDone = true; },
          meAfter: 'so-hai',
          reply: { face: 'sly', zh: '多少钱都可以？那每吨加五百元加急费！', py: 'Duōshao qián dōu kěyǐ? Nà měi dūn jiā wǔbǎi yuán jiājífèi!', vi: 'Bao nhiêu cũng được? Vậy mỗi tấn cộng 500 tệ phí làm gấp!' } },
        { zh: '没事了，我告诉经理做不到。', py: 'Méi shì le, wǒ gàosu jīnglǐ zuò bu dào.', vi: 'Không có gì, tôi sẽ báo trưởng phòng là không làm được.',
          grade: 'bad', me: 'de-biu', note: 'Bỏ cuộc trước khi thử. Lẽ ra có thể đề nghị 分批交货.', go: 'email', fx: s => { s.rushFail = true; },
          reply: { face: 'doubt', zh: '好的，那就按原来的条件。', py: 'Hǎo de, nà jiù àn yuánlái de tiáojiàn.', vi: 'Vâng, vậy cứ theo điều kiện cũ.' } },
      ] },

    // ================= EMAIL XÁC NHẬN =================
    // [key] là ô trống. Câu partial chỉ hiện khi đã thoả thuận giao theo đợt.
    email: { type: 'email', next: 'result',
      intro: 'Viết email xác nhận gửi 胡经理. Điền đúng các con số cuối cùng đã thống nhất.',
      guide: 'Nhìn bảng điều khoản phía trên để điền. Ô cuối cùng: 100% trừ tiền cọc.',
      head: { zh: '胡经理您好：', py: 'Hú jīnglǐ nín hǎo:' },
      body: { zh: '根据今天的电话，我们确认订购304不锈钢板 [qty] 吨，单价每吨 [price] 元，交货期 [days] 天。付款方式：先付 [deposit]% 定金，交货以后再付 [rest]%。',
        py: 'Gēnjù jīntiān de diànhuà, wǒmen quèrèn dìnggòu sān líng sì bùxiùgāng bǎn ___ dūn, dānjià měi dūn ___ yuán, jiāohuòqī ___ tiān. Fùkuǎn fāngshì: xiān fù ___% dìngjīn, jiāohuò yǐhòu zài fù ___%.',
        vi: 'Theo cuộc gọi hôm nay, chúng tôi xác nhận đặt mua ___ tấn thép tấm inox 304, đơn giá ___ tệ/tấn, giao hàng trong ___ ngày. Thanh toán: cọc trước ___%, giao hàng xong trả ___%.' },
      partial: { zh: '其中第一批 [p1] 吨 [p2] 天之内交货。', py: 'Qízhōng dì-yī pī ___ dūn ___ tiān zhīnèi jiāohuò.', vi: 'Trong đó đợt đầu ___ tấn giao trong vòng ___ ngày.' },
      foot: { zh: '谢谢！\n星辰电器采购部 {me}', py: 'Xièxie! Xīngchén Diànqì cǎigòubù {mePy}' } },

    result: { type: 'result' },
  },

  // Tiêu chí chấm sao
  criteria: [
    { vi: 'Giá ≤ 18.000 tệ/tấn', ok: s => s.price <= T.price },
    { vi: 'Giao hàng ≤ 30 ngày', ok: s => s.days <= T.days },
    { vi: 'Đặt cọc ≤ 30%', ok: s => s.deposit <= T.deposit },
    { vi: 'Xử lý được việc dự án bị đẩy sớm', ok: s => s.rushDone },
  ],
  results: {
    3: { me: 'hoan-thanh', face: 'approve', zh: '太棒了！所有目标都达到了，连项目提前的问题也解决了。你可以转正了！', py: 'Tài bàng le! Suǒyǒu mùbiāo dōu dádào le, lián xiàngmù tíqián de wèntí yě jiějué le. Nǐ kěyǐ zhuǎnzhèng le!', vi: 'Tuyệt vời! Mọi mục tiêu đều đạt, cả việc dự án bị đẩy sớm cũng giải quyết xong. Em có thể lên nhân viên chính thức rồi!' },
    2: { me: 'vui-ve', face: 'happy', zh: '不错！大部分目标都达到了，下次再注意一下细节。', py: 'Búcuò! Dà bùfen mùbiāo dōu dádào le, xià cì zài zhùyì yíxià xìjié.', vi: 'Khá lắm! Đạt phần lớn mục tiêu, lần sau chú ý chi tiết hơn nhé.' },
    1: { me: 'buon-ba', face: 'worried', zh: '这次的条件不太好……我们一起看看哪里可以改进。', py: 'Zhè cì de tiáojiàn bú tài hǎo…… wǒmen yìqǐ kànkan nǎlǐ kěyǐ gǎijìn.', vi: 'Điều kiện lần này chưa tốt… Cùng xem có thể cải thiện ở đâu nhé.' },
  },
};
})();
