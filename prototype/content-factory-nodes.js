// Kịch bản chương 2 (chế độ Dễ), phần 1: giao việc, gọi hối hàng, báo cáo tiến độ, tra vận đơn.
(() => {
const F = window.CONTENT.factory.easy;
Object.assign(F.nodes, {
  // ================= GIAO VIỆC =================
  f1: { type: 'say', with: 'boss', who: 'boss', next: 'f2', guide: 'Chương 2 bắt đầu! Từ vựng chương này nằm ở <b>bài 4 · 跟单与收货</b>.',
    zh: '{me}，你上次买的五吨不锈钢板，合同写的是这周五交货。', py: '{mePy}, nǐ shàng cì mǎi de wǔ dūn bùxiùgāng bǎn, hétong xiě de shì zhè zhōuwǔ jiāohuò.', vi: '{me}, năm tấn thép inox em mua lần trước, hợp đồng ghi giao hàng thứ Sáu tuần này.' },
  f2: { type: 'say', with: 'boss', who: 'boss', next: 'f3',
    zh: '下周一工厂就要开始生产，钢板一定不能晚到。你去跟单，到货的时候亲自去仓库核对。', py: 'Xià zhōuyī gōngchǎng jiù yào kāishǐ shēngchǎn, gāngbǎn yídìng bù néng wǎn dào. Nǐ qù gēndān, dàohuò de shíhou qīnzì qù cāngkù héduì.', vi: 'Thứ Hai tuần sau nhà máy bắt đầu sản xuất, thép tuyệt đối không được tới trễ. Em theo dõi đơn hàng, hàng tới thì đích thân xuống kho đối chiếu.' },
  f3: { type: 'say', with: 'boss', who: 'me', me: 'vui-ve', next: 'card',
    zh: '好的！我先给胡经理打电话，问问进度。', py: 'Hǎo de! Wǒ xiān gěi Hú jīnglǐ dǎ diànhuà, wènwen jìndù.', vi: 'Vâng ạ! Em gọi cho anh Hồ trước để hỏi tiến độ.' },
  card: { type: 'card', next: 'c1', guide: 'Nhớ hai mốc: hàng phải tới <b>trước thứ Hai</b>, và <b>kiểm tra xong mới ký nhận</b>.' },

  // ================= GỌI HỐI HÀNG =================
  c1: { type: 'ask', with: 'supB', enter: s => { s.calledSup = true; },
    line: { face: 'happy', zh: '喂，{me}，你好！是钢板的事吧？', py: 'Wéi, {mePy}, nǐ hǎo! Shì gāngbǎn de shì ba?', vi: 'A lô, {me}, chào em! Chuyện thép tấm phải không?' },
    hint: 'Mở đầu bằng mẫu "……怎么样了？" để hỏi tiến độ, lịch sự và rõ ràng.',
    choices: [
      { zh: '胡经理，您好！我想问一下，我们的钢板生产进度怎么样了？', py: 'Hú jīnglǐ, nín hǎo! Wǒ xiǎng wèn yíxià, wǒmen de gāngbǎn shēngchǎn jìndù zěnmeyàng le?', vi: 'Chào anh Hồ! Em muốn hỏi tiến độ sản xuất thép của bên em thế nào rồi ạ?',
        grade: 'good', note: 'Chào hỏi và hỏi đúng tiến độ.', go: 'c2',
        reply: { face: 'doubt', zh: '已经生产好了。不过物流那边有点儿问题，可能要晚三天发货。', py: 'Yǐjīng shēngchǎn hǎo le. Búguò wùliú nàbiān yǒu diǎnr wèntí, kěnéng yào wǎn sān tiān fāhuò.', vi: 'Sản xuất xong rồi. Có điều bên vận chuyển hơi có vấn đề, có thể gửi hàng trễ ba ngày.' } },
      { zh: '钢板什么时候到？', py: 'Gāngbǎn shénme shíhou dào?', vi: 'Bao giờ thép tới?',
        grade: 'ok', note: 'Hỏi được việc nhưng cụt lủn, nên chào hỏi trước.', go: 'c2',
        reply: { face: 'doubt', zh: '嗯……物流那边有点儿问题，可能要晚三天发货。', py: 'Ńg…… wùliú nàbiān yǒu diǎnr wèntí, kěnéng yào wǎn sān tiān fāhuò.', vi: 'Ừm… bên vận chuyển có chút vấn đề, có thể gửi hàng trễ ba ngày.' } },
      { zh: '胡经理，你们是不是又要晚了？快点儿发货！', py: 'Hú jīnglǐ, nǐmen shì bu shì yòu yào wǎn le? Kuài diǎnr fāhuò!', vi: 'Anh Hồ, bên anh lại sắp trễ phải không? Gửi hàng nhanh lên!',
        grade: 'bad', me: 'de-biu', meAfter: 'kho-hieu', note: 'Chưa biết tình hình đã trách móc. Hỏi tiến độ trước đã.', go: 'c2', fx: s => { s.rapport -= 1; },
        reply: { face: 'annoyed', zh: '"又"？我们什么时候晚过？……物流有点儿问题，可能要晚三天发货。', py: '"Yòu"? Wǒmen shénme shíhou wǎn guo? …… Wùliú yǒu diǎnr wèntí, kěnéng yào wǎn sān tiān fāhuò.', vi: '"Lại"? Bên tôi trễ bao giờ? … Vận chuyển có chút vấn đề, có thể gửi trễ ba ngày.' } },
    ] },
  c2: { type: 'ask', with: 'supB',
    line: s => s.scolded
      ? { face: 'doubt', zh: '{me}，又是你啊。发货的事，还有什么问题？', py: '{mePy}, yòu shì nǐ a. Fāhuò de shì, hái yǒu shénme wèntí?', vi: '{me}, lại là em à. Chuyện gửi hàng còn vấn đề gì?' }
      : { face: 'doubt', zh: '晚三天的话，下周三能到。你看行吗？', py: 'Wǎn sān tiān dehuà, xià zhōusān néng dào. Nǐ kàn xíng ma?', vi: 'Trễ ba ngày thì thứ Tư tuần sau tới. Em thấy được không?' },
    hint: 'Thứ Tư tuần sau là quá trễ: thứ Hai đã sản xuất. Hối hàng theo mẫu "nêu lý do + 能不能……？".',
    choices: [
      { zh: '我理解。但是我们下周一就要开始生产，最晚这周五要到货。能不能请您帮忙安排一下？', py: 'Wǒ lǐjiě. Dànshì wǒmen xià zhōuyī jiù yào kāishǐ shēngchǎn, zuì wǎn zhè zhōuwǔ yào dàohuò. Néng bu néng qǐng nín bāngmáng ānpái yíxià?', vi: 'Em hiểu ạ. Nhưng thứ Hai tuần sau bên em bắt đầu sản xuất, chậm nhất thứ Sáu này phải có hàng. Anh sắp xếp giúp em được không ạ?',
        grade: 'good', me: 'nghi-ngo', meAfter: 'hoan-thanh', note: 'Thông cảm, nêu lý do cụ thể rồi mới đề nghị: hối hàng chuẩn.', go: 'c3', fx: s => { s.onTime = true; },
        reply: { face: 'happy', zh: '好吧，我换一家物流公司，周四发货，周五一定到。', py: 'Hǎo ba, wǒ huàn yì jiā wùliú gōngsī, zhōusì fāhuò, zhōuwǔ yídìng dào.', vi: 'Được rồi, tôi đổi công ty vận chuyển khác, thứ Năm gửi, thứ Sáu chắc chắn tới.' } },
      { zh: '那好吧，晚三天也没关系。', py: 'Nà hǎo ba, wǎn sān tiān yě méi guānxi.', vi: 'Thôi được, trễ ba ngày cũng không sao.',
        grade: 'bad', note: 'Thứ Hai đã sản xuất mà thứ Tư thép mới tới: dây chuyền sẽ phải dừng!', go: 'c3', show: s => !s.scolded, fx: s => { s.late = true; },
        reply: { face: 'happy', zh: '谢谢理解！', py: 'Xièxie lǐjiě!', vi: 'Cảm ơn em đã thông cảm!' } },
      { zh: '如果这周五不能到货，我们就取消合同！', py: 'Rúguǒ zhè zhōuwǔ bù néng dàohuò, wǒmen jiù qǔxiāo hétong!', vi: 'Nếu thứ Sáu này không có hàng, chúng tôi huỷ hợp đồng!',
        grade: 'ok', me: 'de-biu', meAfter: 'kho-chiu', note: 'Giữ được hạn giao, nhưng doạ huỷ hợp đồng làm mất lòng đối tác lâu dài.', go: 'c3', fx: s => { s.onTime = true; s.rapport -= 1; },
        reply: { face: 'annoyed', zh: '……好吧，我换一家物流公司，周五到。', py: '…… Hǎo ba, wǒ huàn yì jiā wùliú gōngsī, zhōuwǔ dào.', vi: '… Thôi được, tôi đổi công ty vận chuyển, thứ Sáu tới.' } },
    ] },
  c3: { type: 'ask', with: 'supB',
    line: { face: 'happy', zh: '还有别的事吗？', py: 'Hái yǒu bié de shì ma?', vi: 'Còn việc gì nữa không?' },
    hint: 'Có mã vận đơn (单号) thì tự tra được hàng đang ở đâu, không phải gọi hỏi mãi.',
    choices: [
      { zh: '发货以后，麻烦您把物流单号发给我，我可以随时查一下。', py: 'Fāhuò yǐhòu, máfan nín bǎ wùliú dānhào fā gěi wǒ, wǒ kěyǐ suíshí chá yíxià.', vi: 'Gửi hàng xong, phiền anh gửi em mã vận đơn, để em tra bất cứ lúc nào.',
        grade: 'good', note: 'Xin mã vận đơn để tự theo dõi.', go: 'menu1', fx: s => { s.gotNo = true; },
        reply: { face: 'done', zh: '没问题，发货以后马上发给你。', py: 'Méi wèntí, fāhuò yǐhòu mǎshàng fā gěi nǐ.', vi: 'Không vấn đề, gửi hàng xong tôi gửi ngay.' } },
      { zh: '没有了，谢谢，再见！', py: 'Méiyǒu le, xièxie, zàijiàn!', vi: 'Hết rồi ạ, cảm ơn, chào anh!',
        grade: 'ok', note: 'Quên xin mã vận đơn: lát nữa sẽ không biết hàng đang ở đâu.', go: 'menu1',
        reply: { face: 'happy', zh: '好，再见！', py: 'Hǎo, zàijiàn!', vi: 'Ừ, chào em!' } },
      { zh: '您每天给我打一个电话，告诉我货在哪儿。', py: 'Nín měi tiān gěi wǒ dǎ yí ge diànhuà, gàosu wǒ huò zài nǎr.', vi: 'Anh mỗi ngày gọi cho em một cuộc, báo hàng đang ở đâu.',
        grade: 'bad', meAfter: 'kho-hieu', note: 'Bắt đối tác gọi mỗi ngày là phiền họ. Xin mã vận đơn là đủ.', go: 'menu1', fx: s => { s.rapport -= 1; },
        reply: { face: 'annoyed', zh: '每天打电话？我很忙的……发了货我会通知你。', py: 'Měi tiān dǎ diànhuà? Wǒ hěn máng de…… Fā le huò wǒ huì tōngzhī nǐ.', vi: 'Mỗi ngày gọi điện? Tôi bận lắm… Gửi hàng rồi tôi báo.' } },
    ] },
  menu1: { type: 'menu', title: { zh: '接下来做什么？', py: 'jiē xiàlái zuò shénme?', vi: 'Tiếp theo làm gì?' },
    items: [
      { zh: '向{boss}汇报进度', py: 'xiàng {bossPy} huìbào jìndù', vi: 'Báo cáo tiến độ với sếp', icon: '📋', go: 'rep' },
    ] },

  // ================= BÁO CÁO TIẾN ĐỘ =================
  rep: { type: 'ask', with: 'boss',
    line: { face: 'doubt', zh: '{me}，钢板的进度怎么样？', py: '{mePy}, gāngbǎn de jìndù zěnmeyàng?', vi: '{me}, tiến độ thép thế nào rồi?' },
    hint: 'Báo cáo phải có thông tin cụ thể: tình hình, ngày tới. Đừng nói "chắc là".',
    choices: [
      { zh: '钢板已经生产好了。物流有点儿问题，但是胡经理答应换一家，周五一定到货。', py: 'Gāngbǎn yǐjīng shēngchǎn hǎo le. Wùliú yǒu diǎnr wèntí, dànshì Hú jīnglǐ dāying huàn yì jiā, zhōuwǔ yídìng dàohuò.', vi: 'Thép sản xuất xong rồi ạ. Vận chuyển có chút vấn đề, nhưng anh Hồ đã hứa đổi đơn vị khác, thứ Sáu chắc chắn tới.',
        grade: 'good', show: s => s.onTime, note: 'Báo cáo đủ: vấn đề, cách xử lý, ngày tới.', go: s => (s.gotNo ? 'track' : 'noNo'), fx: s => { s.reported1 = true; },
        reply: { face: 'approve', zh: '很好，处理得很快。周五你去仓库收货。', py: 'Hěn hǎo, chǔlǐ de hěn kuài. Zhōuwǔ nǐ qù cāngkù shōuhuò.', vi: 'Tốt lắm, xử lý nhanh đấy. Thứ Sáu em xuống kho nhận hàng.' } },
      { zh: '物流有点儿问题，钢板要晚三天，下周三到。', py: 'Wùliú yǒu diǎnr wèntí, gāngbǎn yào wǎn sān tiān, xià zhōusān dào.', vi: 'Vận chuyển có chút vấn đề, thép trễ ba ngày, thứ Tư tuần sau mới tới.',
        grade: 'bad', show: s => s.late && !s.scolded, me: 'nghi-ngo', meAfter: 'so-hai', note: 'Đồng ý cho trễ mà không nghĩ tới lịch sản xuất. Phải hối hàng ngay.', go: 'c2',
        fx: s => { s.scolded = true; s.late = false; },
        reply: { face: 'angry', zh: '下周三？生产线下周一就要用！你马上再打电话催货！', py: 'Xià zhōusān? Shēngchǎnxiàn xià zhōuyī jiù yào yòng! Nǐ mǎshàng zài dǎ diànhuà cuīhuò!', vi: 'Thứ Tư tuần sau? Thứ Hai dây chuyền đã cần dùng! Em gọi hối hàng ngay!' } },
      { zh: '应该没问题吧。', py: 'Yīnggāi méi wèntí ba.', vi: 'Chắc là không có vấn đề gì ạ.',
        grade: 'bad', show: s => !s.vague, me: 'kho-hieu', meAfter: 'buon-ba', note: 'Báo cáo mơ hồ. Sếp cần tình hình và ngày tới cụ thể.', go: 'rep', fx: s => { s.vague = true; },
        reply: { face: 'annoyed', zh: '"应该"？我要的是准确的情况：现在怎么样，哪天到货？', py: '"Yīnggāi"? Wǒ yào de shì zhǔnquè de qíngkuàng: xiànzài zěnmeyàng, nǎ tiān dàohuò?', vi: '"Chắc là"? Tôi cần tình hình chính xác: giờ thế nào, ngày nào hàng tới?' } },
    ] },
  noNo: { type: 'say', with: 'supB', who: 'me', me: 'kho-hieu', next: 'noNo2', guide: 'Không có mã vận đơn nên phải gọi lại hỏi. Lần sau nhớ xin luôn trong cuộc gọi đầu nhé.',
    fx: s => { s.calledTwice = true; },
    zh: '胡经理，不好意思，又打扰您了。货发了吗？能把物流单号发给我吗？', py: 'Hú jīnglǐ, bù hǎoyìsi, yòu dǎrǎo nín le. Huò fā le ma? Néng bǎ wùliú dānhào fā gěi wǒ ma?', vi: 'Anh Hồ, ngại quá, lại làm phiền anh. Hàng gửi chưa ạ? Anh gửi em mã vận đơn được không?' },
  noNo2: { type: 'say', with: 'supB', who: 'supB', face: 'doubt', next: 'track',
    zh: '发了发了。单号我现在发给你。', py: 'Fā le fā le. Dānhào wǒ xiànzài fā gěi nǐ.', vi: 'Gửi rồi, gửi rồi. Mã vận đơn tôi gửi em ngay đây.' },

  // ================= TRA VẬN ĐƠN =================
  track: { type: 'read', next: 'w0',
    intro: 'Thứ Năm. Em tra mã vận đơn trên trang của công ty vận chuyển.',
    guide: 'Đọc dòng mới nhất và dòng "dự kiến".',
    doc: { title: { zh: '物流信息', py: 'wùliú xìnxī' }, today: { zh: '今天：星期四', py: 'jīntiān: xīngqīsì' },
      rows: [
        [{ zh: '单号', py: 'dānhào' }, { zh: 'XD20261120' }],
        [{ zh: '发货', py: 'fāhuò' }, { zh: '星期四 10:00 · 鑫达钢材', py: 'xīngqīsì · Xīndá Gāngcái' }],
        [{ zh: '现在', py: 'xiànzài' }, { zh: '运输中', py: 'yùnshū zhōng' }],
        [{ zh: '预计到货', py: 'yùjì dàohuò' }, { zh: '星期五 14:00 · 星辰电器工厂仓库', py: 'xīngqīwǔ · Xīngchén Diànqì gōngchǎng cāngkù' }],
      ] },
    q: 'Hàng dự kiến tới khi nào?',
    options: [
      { zh: '星期四上午', py: 'xīngqīsì shàngwǔ', vi: 'Sáng thứ Năm' },
      { zh: '星期五下午两点', py: 'xīngqīwǔ xiàwǔ liǎng diǎn', vi: '2 giờ chiều thứ Sáu' },
      { zh: '下星期三', py: 'xià xīngqīsān', vi: 'Thứ Tư tuần sau' },
    ],
    answer: 1, explain: '预计到货：星期五 14:00. Kịp trước thứ Hai.' },
});
})();
