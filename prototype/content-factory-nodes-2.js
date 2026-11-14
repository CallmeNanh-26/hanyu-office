// Kịch bản chương 2 (chế độ Dễ), phần 2: nhận hàng ở kho, đối chiếu, xử lý thiếu và hỏng, báo cáo.
(() => {
const F = window.CONTENT.factory.easy;
const WH = { zh: '仓库', py: 'cāngkù', vi: 'Kho nhà máy 星辰电器' };
const atWH = o => Object.assign({ bg: 'factory', place: WH }, o);

Object.assign(F.nodes, {
  // ================= Ở KHO =================
  w0: atWH({ type: 'say', with: 'prod', who: 'prod', face: 'doubt', next: 'w1', guide: 'Thứ Sáu, 2 giờ chiều. Em xuống kho nhà máy.',
    zh: '{me}，钢板到了吗？周一生产线就要用了！', py: '{mePy}, gāngbǎn dào le ma? Zhōuyī shēngchǎnxiàn jiù yào yòng le!', vi: '{me}, thép tới chưa? Thứ Hai dây chuyền cần dùng rồi đấy!' }),
  w1: atWH({ type: 'say', with: 'wh', who: 'wh', face: 'happy', next: 'w2',
    zh: '来了来了！鑫达的货车刚到，司机在等你签收呢。', py: 'Lái le lái le! Xīndá de huòchē gāng dào, sījī zài děng nǐ qiānshōu ne.', vi: 'Tới rồi, tới rồi! Xe tải của 鑫达 vừa tới, tài xế đang chờ em ký nhận đấy.' }),
  w2: atWH({ type: 'ask', with: 'driver',
    line: { face: 'happy', zh: '你好，这是送货单。你签个字吧，我还要去送下一家。', py: 'Nǐ hǎo, zhè shì sònghuòdān. Nǐ qiān ge zì ba, wǒ hái yào qù sòng xià yì jiā.', vi: 'Chào em, đây là phiếu giao hàng. Em ký đi, tôi còn phải giao nhà khác.' },
    hint: 'Nguyên tắc ở bài 4: kiểm tra không có vấn đề rồi mới 签收.',
    choices: [
      { zh: '师傅，请等一下。我先核对一下单据和数量，再签收。', py: 'Shīfu, qǐng děng yíxià. Wǒ xiān héduì yíxià dānjù hé shùliàng, zài qiānshōu.', vi: 'Bác ơi, chờ em một chút. Em đối chiếu giấy tờ và số lượng trước rồi mới ký nhận.',
        grade: 'good', me: 'nghi-ngo', note: 'Kiểm tra xong mới ký: đúng nguyên tắc.', go: 'docs',
        reply: { face: 'doubt', zh: '好吧好吧，快一点儿啊。', py: 'Hǎo ba hǎo ba, kuài yìdiǎnr a.', vi: 'Được rồi, nhanh lên chút nhé.' } },
      { zh: '好的，我马上签。', py: 'Hǎo de, wǒ mǎshàng qiān.', vi: 'Vâng, em ký ngay.',
        grade: 'bad', note: 'Ký nhận khi chưa kiểm tra: nếu thiếu hay hỏng sẽ rất khó đòi lại.', go: 'blind', fx: s => { s.signedBlind = true; s.signed = true; },
        reply: { face: 'happy', zh: '谢谢！', py: 'Xièxie!', vi: 'Cảm ơn em!' } },
      { zh: '单据放这儿吧，您先走，我有空再看。', py: 'Dānjù fàng zhèr ba, nín xiān zǒu, wǒ yǒu kòng zài kàn.', vi: 'Giấy tờ để đây, bác cứ đi, khi nào rảnh em xem.',
        grade: 'bad', note: 'Phải kiểm tra ngay khi tài xế còn ở đây, để có người cùng xác nhận.', go: 'w2b',
        reply: { face: 'doubt', zh: '那不行，你得先签字，我才能走。', py: 'Nà bù xíng, nǐ děi xiān qiānzì, wǒ cái néng zǒu.', vi: 'Không được, em phải ký thì tôi mới đi được.' } },
    ] }),
  w2b: atWH({ type: 'say', with: 'driver', who: 'me', me: 'nghi-ngo', next: 'docs',
    zh: '那请您等一下，我现在就核对。', py: 'Nà qǐng nín děng yíxià, wǒ xiànzài jiù héduì.', vi: 'Vậy bác chờ một chút, em đối chiếu ngay bây giờ.' }),
  blind: atWH({ type: 'say', with: 'wh', who: 'wh', face: 'shocked', next: 'docs', guide: 'Đã ký rồi thì sao? Vẫn phải kiểm tra ngay để có bằng chứng, nhưng sẽ khó đòi hơn.',
    zh: '你都没看就签了？要是少了或者坏了，怎么办？我们还是快核对一下吧。', py: 'Nǐ dōu méi kàn jiù qiān le? Yàoshi shǎo le huòzhě huài le, zěnme bàn? Wǒmen háishi kuài héduì yíxià ba.', vi: 'Em chưa xem gì đã ký à? Lỡ thiếu hay hỏng thì sao? Mình mau đối chiếu đi.' }),

  // ================= ĐỐI CHIẾU =================
  docs: { type: 'check', kind: 'docs', next: 'goods', onDone: s => { s.docsOk = true; },
    title: { zh: '核对单据', py: 'héduì dānjù', vi: 'Đối chiếu giấy tờ' },
    intro: 'Tài xế đưa một tập giấy tờ. So với đơn hàng, rồi bấm vào những mục CÓ VẤN ĐỀ (có thể nhiều mục, hoặc không mục nào).',
    guide: 'Nhớ bảng ở bài 4: khi hàng tới phải có <b>送货单, 装箱单, 发票, 合格证</b>.',
    ref: { zh: '订单：304不锈钢板 · 5吨 · 10件', py: 'dìngdān: sān líng sì bùxiùgāng bǎn · wǔ dūn · shí jiàn', vi: 'Đơn hàng: thép tấm inox 304 · 5 tấn · 10 kiện' },
    items: [
      { icon: '📄', zh: '送货单：304不锈钢板，5吨，收货：星辰电器', py: 'sònghuòdān: sān líng sì bùxiùgāng bǎn, wǔ dūn, shōuhuò: Xīngchén Diànqì', vi: 'Phiếu giao hàng: thép inox 304, 5 tấn, nơi nhận: 星辰电器' },
      { icon: '📄', zh: '装箱单：10件，每件0.5吨', py: 'zhuāngxiāngdān: shí jiàn, měi jiàn líng diǎn wǔ dūn', vi: 'Phiếu đóng gói: 10 kiện, mỗi kiện 0,5 tấn' },
      { icon: '📄', zh: '合格证：304不锈钢板，合格', py: 'hégézhèng: sān líng sì bùxiùgāng bǎn, hégé', vi: 'Giấy chứng nhận: thép inox 304, đạt chuẩn' },
      { icon: '📄', zh: '发票：没有', py: 'fāpiào: méiyǒu', vi: 'Hoá đơn: không có trong tập', bad: true, why: '没有发票，财务不能付款。' },
    ],
    explain: 'Thiếu 发票 (hoá đơn): không có hoá đơn thì phòng tài chính không thanh toán được. Ba giấy còn lại khớp với đơn hàng.' },
  goods: { type: 'check', kind: 'goods', next: 'w3', onDone: s => { s.checkedGoods = true; },
    title: { zh: '数一数，看一看', py: 'shǔ yi shǔ, kàn yi kàn', vi: 'Đếm và xem hàng' },
    intro: 'Công nhân dỡ hàng xuống. Mỗi 件 là một bó thép 0,5 tấn. Bấm vào kiện bị 破损 (hỏng).',
    guide: 'Nhìn kỹ từng kiện: kiện hỏng có vết móp và dây đai bị đứt.',
    items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({ zh: `第${i}件`, py: `dì-${['yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'][i - 1]} jiàn`, vi: `Kiện ${i}`, bad: i === 6, why: '包装破损' })),
    q: '装箱单上写的是10件。你数了几件？',
    options: [{ zh: '10件', py: 'shí jiàn' }, { zh: '9件', py: 'jiǔ jiàn' }, { zh: '8件', py: 'bā jiàn' }],
    answer: 1, explain: 'Chỉ có 9 件: thiếu 1 kiện, và kiện số 6 bị hỏng.' },

  // ================= XỬ LÝ =================
  w3: atWH({ type: 'ask', with: 'wh',
    line: { face: 'doubt', zh: '少了一件，一件破损，还没有发票。{me}，现在怎么办？', py: 'Shǎo le yí jiàn, yí jiàn pòsǔn, hái méiyǒu fāpiào. {mePy}, xiànzài zěnme bàn?', vi: 'Thiếu một kiện, một kiện hỏng, lại không có hoá đơn. {me}, giờ làm sao?' },
    hint: 'Bài 4: chụp ảnh, ghi rõ lên 送货单 rồi mới ký. Đừng trả cả lô: thứ Hai cần thép để sản xuất.',
    choices: [
      { zh: '我们先拍照片，在送货单上写清楚：少一件，一件破损，没有发票。然后再签收。', py: 'Wǒmen xiān pāi zhàopiàn, zài sònghuòdān shang xiě qīngchu: shǎo yí jiàn, yí jiàn pòsǔn, méiyǒu fāpiào. Ránhòu zài qiānshōu.', vi: 'Mình chụp ảnh trước, ghi rõ lên phiếu giao hàng: thiếu một kiện, một kiện hỏng, không có hoá đơn. Sau đó mới ký nhận.',
        grade: 'good', show: s => !s.signedBlind, note: 'Có ảnh và ghi chú trên phiếu thì sau này đòi bù được.', go: 'w4', fx: s => { s.noted = true; s.signed = true; },
        reply: { face: 'done', zh: '对！这样以后有证明。', py: 'Duì! Zhèyàng yǐhòu yǒu zhèngmíng.', vi: 'Đúng! Như vậy sau này có bằng chứng.' } },
      { zh: '我已经签了……那我们马上拍照片，请司机在送货单上写清楚：少一件，一件破损。', py: 'Wǒ yǐjīng qiān le…… Nà wǒmen mǎshàng pāi zhàopiàn, qǐng sījī zài sònghuòdān shang xiě qīngchu: shǎo yí jiàn, yí jiàn pòsǔn.', vi: 'Em lỡ ký rồi… Vậy mình chụp ảnh ngay, nhờ tài xế ghi rõ lên phiếu: thiếu một kiện, một kiện hỏng.',
        grade: 'good', show: s => s.signedBlind, note: 'Cứu vãn được: có ảnh và xác nhận của tài xế.', go: 'w4', fx: s => { s.noted = true; },
        reply: { face: 'doubt', zh: '好，还来得及，司机还没走。', py: 'Hǎo, hái lái de jí, sījī hái méi zǒu.', vi: 'Được, vẫn kịp, tài xế chưa đi.' } },
      { zh: '算了，差不多就行，签了吧。', py: 'Suàn le, chàbuduō jiù xíng, qiān le ba.', vi: 'Thôi, gần đủ là được, ký đi.',
        grade: 'bad', show: s => !s.signedBlind, note: 'Không ghi lại thì nhà cung cấp có thể không nhận thiếu, không đổi hàng hỏng.', go: 'cf1', fx: s => { s.signed = true; },
        reply: { face: 'doubt', zh: '真的？以后供应商不承认怎么办？', py: 'Zhēn de? Yǐhòu gōngyìngshāng bù chéngrèn zěnme bàn?', vi: 'Thật à? Sau này nhà cung cấp không nhận thì sao?' } },
      { zh: '这批货我们都不要了，让司机都拉回去！', py: 'Zhè pī huò wǒmen dōu bú yào le, ràng sījī dōu lā huíqu!', vi: 'Lô này mình không nhận nữa, bảo tài xế chở về hết!',
        grade: 'bad', show: s => !s.rejectTried, note: 'Trả cả lô thì thứ Hai không có thép để sản xuất. Chỉ cần nhận phần tốt và đòi bù phần thiếu, hỏng.', go: 'w3', fx: s => { s.rejectTried = true; },
        reply: { face: 'shocked', zh: '都拉回去？那下周一生产线就没有钢板了！', py: 'Dōu lā huíqu? Nà xià zhōuyī shēngchǎnxiàn jiù méiyǒu gāngbǎn le!', vi: 'Chở về hết? Vậy thứ Hai dây chuyền lấy đâu ra thép!' } },
    ] }),
  w4: atWH({ type: 'ask', with: 'driver',
    line: { face: 'doubt', zh: '少一件？不可能吧……', py: 'Shǎo yí jiàn? Bù kěnéng ba……', vi: 'Thiếu một kiện? Không thể nào…' },
    hint: 'Đưa bằng chứng (装箱单 ghi 10 kiện, đã đếm hai lần), nhờ lịch sự bằng 麻烦您……',
    choices: [
      { zh: '师傅，您看，装箱单上写的是十件，我们数了两次，只有九件。麻烦您在送货单上也签个字。', py: 'Shīfu, nín kàn, zhuāngxiāngdān shang xiě de shì shí jiàn, wǒmen shǔ le liǎng cì, zhǐ yǒu jiǔ jiàn. Máfan nín zài sònghuòdān shang yě qiān ge zì.', vi: 'Bác xem, phiếu đóng gói ghi mười kiện, bọn em đếm hai lần, chỉ có chín. Phiền bác cũng ký vào phiếu giao hàng.',
        grade: 'good', note: 'Có bằng chứng, lịch sự, và có chữ ký của tài xế.', go: 'cf1', fx: s => { s.driverOk = true; },
        reply: { face: 'done', zh: '……真的是九件。好吧，我签。', py: '…… Zhēn de shì jiǔ jiàn. Hǎo ba, wǒ qiān.', vi: '… Đúng là chín kiện thật. Được, tôi ký.' } },
      { zh: '你们公司怎么搞的？是不是你拿走了？', py: 'Nǐmen gōngsī zěnme gǎo de? Shì bu shì nǐ ná zǒu le?', vi: 'Công ty các anh làm ăn kiểu gì vậy? Có phải anh lấy mất không?',
        grade: 'bad', me: 'de-biu', meAfter: 'kho-chiu', note: 'Nghi ngờ người khác khi chưa có căn cứ. Tài xế chỉ là người chở hàng.', go: 'cf1', fx: s => { s.rapport -= 1; s.driverOk = true; },
        reply: { face: 'angry', zh: '你说什么？我只是送货的！……好吧，我签字，你去问胡经理吧。', py: 'Nǐ shuō shénme? Wǒ zhǐ shì sònghuò de! …… Hǎo ba, wǒ qiānzì, nǐ qù wèn Hú jīnglǐ ba.', vi: 'Em nói gì vậy? Tôi chỉ là người giao hàng! … Thôi được, tôi ký, em đi hỏi anh Hồ đi.' } },
    ] }),

  // ================= GỌI NHÀ CUNG CẤP =================
  cf1: { type: 'ask', with: 'supB', enter: s => { s.fixCalled = true; },
    line: { face: 'happy', zh: '{me}，货到了吧？都没问题吧？', py: '{mePy}, huò dào le ba? Dōu méi wèntí ba?', vi: '{me}, hàng tới rồi chứ? Không có vấn đề gì chứ?' },
    hint: 'Nói rõ vấn đề (thiếu bao nhiêu, hỏng bao nhiêu), có bằng chứng, rồi đề nghị gửi bù.',
    choices: [
      { zh: '货到了，但是少了一件，还有一件破损了。照片我已经发给您了。能不能尽快补发？', py: 'Huò dào le, dànshì shǎo le yí jiàn, hái yǒu yí jiàn pòsǔn le. Zhàopiàn wǒ yǐjīng fā gěi nín le. Néng bu néng jǐnkuài bǔfā?', vi: 'Hàng tới rồi ạ, nhưng thiếu một kiện, và một kiện bị hỏng. Ảnh em đã gửi anh. Anh gửi bù sớm được không ạ?',
        grade: 'good', show: s => s.noted, note: 'Rõ ràng, có bằng chứng, đề nghị cụ thể.', go: 'cf2', fx: s => { s.fixed = true; },
        reply: { face: 'doubt', zh: '真不好意思！我查一下……确实少装了一件。明天补发，破损的那件也一起换。', py: 'Zhēn bù hǎoyìsi! Wǒ chá yíxià…… Quèshí shǎo zhuāng le yí jiàn. Míngtiān bǔfā, pòsǔn de nà jiàn yě yìqǐ huàn.', vi: 'Thật ngại quá! Để tôi kiểm tra… Đúng là xếp thiếu một kiện. Mai gửi bù, kiện hỏng cũng đổi luôn.' } },
      { zh: '货到了，但是少了一件，还有一件破损了。能不能补发？', py: 'Huò dào le, dànshì shǎo le yí jiàn, hái yǒu yí jiàn pòsǔn le. Néng bu néng bǔfā?', vi: 'Hàng tới rồi, nhưng thiếu một kiện và một kiện hỏng. Gửi bù được không ạ?',
        grade: 'ok', show: s => !s.noted, note: 'Nói đúng vấn đề, nhưng không có ảnh hay ghi chú trên phiếu nên khó đòi.', go: 'cf2',
        reply: { face: 'sly', zh: '少了？司机让你签收的时候你没说啊，送货单上也没写……这个我们很难处理。', py: 'Shǎo le? Sījī ràng nǐ qiānshōu de shíhou nǐ méi shuō a, sònghuòdān shang yě méi xiě…… Zhège wǒmen hěn nán chǔlǐ.', vi: 'Thiếu à? Lúc ký nhận em đâu có nói, trên phiếu cũng không ghi… Chuyện này bên tôi khó xử lý lắm.' } },
      { zh: '你们骗人！少了一件！', py: 'Nǐmen piàn rén! Shǎo le yí jiàn!', vi: 'Các anh lừa người! Thiếu một kiện!',
        grade: 'bad', me: 'de-biu', meAfter: 'kho-chiu', note: 'Buộc tội lừa đảo làm hỏng quan hệ. Có thể chỉ là xếp nhầm.', go: 'cf2', fx: s => { s.rapport -= 1; s.fixed = !!s.noted; },
        reply: s => s.noted
          ? { face: 'annoyed', zh: '骗人？话不能这么说！……我看了照片，确实少了一件。明天补发吧。', py: 'Piàn rén? Huà bù néng zhème shuō! …… Wǒ kàn le zhàopiàn, quèshí shǎo le yí jiàn. Míngtiān bǔfā ba.', vi: 'Lừa người? Không thể nói vậy được! … Tôi xem ảnh rồi, đúng là thiếu một kiện. Mai gửi bù.' }
          : { face: 'annoyed', zh: '骗人？你有证明吗？送货单上什么都没写！', py: 'Piàn rén? Nǐ yǒu zhèngmíng ma? Sònghuòdān shang shénme dōu méi xiě!', vi: 'Lừa người? Em có bằng chứng không? Trên phiếu chẳng ghi gì cả!' } },
    ] },
  cf2: { type: 'ask', with: 'supB',
    line: { face: 'doubt', zh: '还有别的事吗？', py: 'Hái yǒu bié de shì ma?', vi: 'Còn chuyện gì nữa không?' },
    hint: 'Còn một giấy tờ chưa có. Không có nó thì phòng tài chính không trả tiền được.',
    choices: [
      { zh: '另外，发票还没收到。没有发票，财务不能付款，麻烦您寄一下。', py: 'Lìngwài, fāpiào hái méi shōudào. Méiyǒu fāpiào, cáiwù bù néng fùkuǎn, máfan nín jì yíxià.', vi: 'Ngoài ra, em chưa nhận được hoá đơn. Không có hoá đơn thì tài chính không thanh toán được, phiền anh gửi giúp.',
        grade: 'good', note: 'Nhớ đòi hoá đơn, kèm lý do.', go: 'fin', fx: s => { s.invoice = true; },
        reply: { face: 'done', zh: '好的，今天就寄。', py: 'Hǎo de, jīntiān jiù jì.', vi: 'Được, hôm nay gửi luôn.' } },
      { zh: '没有了，谢谢！', py: 'Méiyǒu le, xièxie!', vi: 'Hết rồi ạ, cảm ơn anh!',
        grade: 'bad', note: 'Quên đòi hoá đơn: phòng tài chính sẽ không trả tiền được.', go: 'fin',
        reply: { face: 'happy', zh: '好，再见！', py: 'Hǎo, zàijiàn!', vi: 'Ừ, chào em!' } },
      { zh: '发票不要了，没关系。', py: 'Fāpiào bú yào le, méi guānxi.', vi: 'Hoá đơn không cần đâu, không sao.',
        grade: 'bad', note: 'Không có hoá đơn thì không thể thanh toán, cũng không hạch toán được.', go: 'fin',
        reply: { face: 'shocked', zh: '不要发票？那……好吧。', py: 'Bú yào fāpiào? Nà…… hǎo ba.', vi: 'Không cần hoá đơn? Vậy… cũng được.' } },
    ] },

  // ================= BÁO CÁO CUỐI =================
  fin: { type: 'ask', with: 'boss', enter: s => { s.finalDone = true; },
    line: { face: 'doubt', zh: '{me}，钢板到了吗？', py: '{mePy}, gāngbǎn dào le ma?', vi: '{me}, thép tới chưa?' },
    hint: 'Báo cáo đủ: đã nhận bao nhiêu, vấn đề gì, xử lý thế nào, có ảnh hưởng sản xuất không.',
    choices: [
      { zh: '到了。九件没问题，已经签收了。少的一件和破损的一件，胡经理明天补发。发票今天寄。不会影响生产。', py: 'Dào le. Jiǔ jiàn méi wèntí, yǐjīng qiānshōu le. Shǎo de yí jiàn hé pòsǔn de yí jiàn, Hú jīnglǐ míngtiān bǔfā. Fāpiào jīntiān jì. Bú huì yǐngxiǎng shēngchǎn.', vi: 'Tới rồi ạ. Chín kiện đã ký nhận. Kiện thiếu và kiện hỏng, anh Hồ mai gửi bù. Hoá đơn hôm nay gửi. Không ảnh hưởng sản xuất ạ.',
        grade: 'good', show: s => s.fixed && s.invoice, note: 'Báo cáo đầy đủ, rõ ràng.', go: 'result',
        reply: { face: 'approve', zh: '很好！问题都处理好了。', py: 'Hěn hǎo! Wèntí dōu chǔlǐ hǎo le.', vi: 'Rất tốt! Vấn đề đều xử lý xong cả.' } },
      { zh: '到了。有一些小问题，我还在处理。', py: 'Dào le. Yǒu yìxiē xiǎo wèntí, wǒ hái zài chǔlǐ.', vi: 'Tới rồi ạ. Có vài vấn đề nhỏ, em vẫn đang xử lý.',
        grade: 'ok', show: s => !(s.fixed && s.invoice), note: 'Trung thực, nhưng nên nói rõ vấn đề gì và cần sếp giúp gì.', go: 'result',
        reply: { face: 'doubt', zh: '什么问题？下次汇报要具体。我跟胡经理沟通一下。', py: 'Shénme wèntí? Xià cì huìbào yào jùtǐ. Wǒ gēn Hú jīnglǐ gōutōng yíxià.', vi: 'Vấn đề gì? Lần sau báo cáo phải cụ thể. Để tôi trao đổi với anh Hồ.' } },
      { zh: '到了，都没问题。', py: 'Dào le, dōu méi wèntí.', vi: 'Tới rồi ạ, không có vấn đề gì.',
        grade: 'bad', me: 'vui-ve', meAfter: 'so-hai', note: 'Giấu vấn đề với sếp là điều tối kỵ.', go: 'result',
        reply: { face: 'angry', zh: '都没问题？龙主任刚才告诉我少了一件！有问题一定要说！', py: 'Dōu méi wèntí? Lóng zhǔrèn gāngcái gàosu wǒ shǎo le yí jiàn! Yǒu wèntí yídìng yào shuō!', vi: 'Không có vấn đề? Chủ nhiệm Long vừa báo tôi thiếu một kiện! Có vấn đề thì nhất định phải nói!' } },
    ] },
  result: { type: 'result' },
});

F.criteria = [
  { vi: 'Hối hàng có lý do, hàng tới đúng hạn (không để sếp phải nhắc)', ok: s => s.onTime && !s.scolded },
  { vi: 'Đối chiếu giấy tờ và đếm hàng trước khi ký nhận', ok: s => !s.signedBlind },
  { vi: 'Ghi rõ thiếu, hỏng lên phiếu giao hàng; nhà cung cấp đồng ý gửi bù', ok: s => s.noted && s.fixed },
  { vi: 'Đòi đủ hoá đơn cho phòng tài chính', ok: s => s.invoice },
];
F.resultNotes = s => [s.rapport < 0 ? '😠 Quan hệ với đối tác bị ảnh hưởng: lần sau lịch sự hơn nhé.' : '', !s.gotNo ? '📦 Nhớ xin mã vận đơn ngay trong cuộc gọi đầu tiên.' : ''];
F.results = {
  3: { me: 'hoan-thanh', face: 'approve', zh: '做得非常好！跟单、核对、补发、发票，每一步都很清楚。', py: 'Zuò de fēicháng hǎo! Gēndān, héduì, bǔfā, fāpiào, měi yí bù dōu hěn qīngchu.', vi: 'Làm rất tốt! Theo dõi đơn, đối chiếu, gửi bù, hoá đơn, bước nào cũng rõ ràng.' },
  2: { me: 'vui-ve', face: 'happy', zh: '不错，钢板到了。不过还有一个地方要注意。', py: 'Búcuò, gāngbǎn dào le. Búguò hái yǒu yí ge dìfang yào zhùyì.', vi: 'Khá lắm, thép đã tới. Nhưng còn một chỗ cần chú ý.' },
  1: { me: 'buon-ba', face: 'worried', zh: '收货不能马虎。我们一起看看哪里可以做得更好。', py: 'Shōuhuò bù néng mǎhu. Wǒmen yìqǐ kànkan nǎlǐ kěyǐ zuò de gèng hǎo.', vi: 'Nhận hàng không được qua loa. Cùng xem chỗ nào có thể làm tốt hơn nhé.' },
};
F.resultGuide = stars => (stars === 3
  ? 'Xuất sắc! Em đã hoàn thành <b>chương 2</b>. Chương tiếp theo đang được chuẩn bị.'
  : 'Xem nhật ký: những lựa chọn ❌ là chỗ có thể làm tốt hơn. Chơi lại để lấy 3 sao nhé!');
})();
