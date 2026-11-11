/**
 * ============================================================================
 * 檔案名稱：js/clinical-advanced.js
 * 模組職責：進階行為觀察、JSON Schema 驗證與疾病鑑別推論引擎
 * 系統設計者 (System Architect & Designer)：Chiahua (chy23)
 * 設計說明：
 *   支援 Draft 2020-12 ClassroomBehaviorRecord 資料結構、17 項核心外顯行為、
 *   誘發因子歸因、介入成效評估及 9 大臨床鑑別診斷指標 (related_conditions) 映射。
 * ============================================================================
 */
class ClinicalAdvancedManager {
  constructor() {
    this.STORAGE_KEY = 'bos_advanced_clinical_records_v1';

    // 1. 課堂科目枚舉
    this.SUBJECTS = [
      '國語', '數學', '英語', '社會', '自然',
      '健體', '藝文', '綜合', '彈性/自習', '下課轉銜'
    ];

    // 2. 教學活動型態枚舉
    this.ACTIVITY_TYPES = [
      '全班聽講',
      '個別書寫作答',
      '小組討論合作',
      '多媒體/平板操作',
      '動態操作/體育競賽',
      '收拾轉銜/移動'
    ];

    // 3. 常見物理環境快速標籤
    this.ENVIRONMENT_PRESETS = [
      '第 1 排講台前',
      '第 2 排靠窗，周圍有同學在小聲討論',
      '靠走廊側，易受班外走動影響',
      '教室後排角落',
      '小組併桌座位（4人一組）',
      '獨立單人座位（鄰座間距拉開）'
    ];

    // 4. 臨床關聯障礙與疾病標籤定義 (related_conditions enum)
    this.RELATED_CONDITIONS_META = {
      ADHD_INATTENTION: {
        code: 'ADHD_INATTENTION',
        label: 'ADHD 注意力不足型',
        short: 'ADHD-I (不專注)',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        barColor: '#2563eb'
      },
      ADHD_HYPER_IMPULSIVE: {
        code: 'ADHD_HYPER_IMPULSIVE',
        label: 'ADHD 過動/衝動型',
        short: 'ADHD-HI (過動衝動)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        barColor: '#d97706'
      },
      ASD: {
        code: 'ASD',
        label: '自閉症類群障礙 (ASD)',
        short: 'ASD (自閉類群)',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
        barColor: '#7c3aed'
      },
      SLD_READING_WRITING: {
        code: 'SLD_READING_WRITING',
        label: '特定學習障礙（閱讀/書寫）',
        short: 'SLD-讀寫障礙',
        badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        barColor: '#0891b2'
      },
      SLD_MATH: {
        code: 'SLD_MATH',
        label: '特定學習障礙（數學）',
        short: 'SLD-數學障礙',
        badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
        barColor: '#0d9488'
      },
      TIC_TOURETTE: {
        code: 'TIC_TOURETTE',
        label: '抽動症 / 妥瑞氏症',
        short: 'Tic/妥瑞氏症',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        barColor: '#059669'
      },
      ODD: {
        code: 'ODD',
        label: '對立反抗症 (ODD)',
        short: 'ODD (對立反抗)',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        barColor: '#e11d48'
      },
      ANXIETY_RSD: {
        code: 'ANXIETY_RSD',
        label: '焦慮症 / 拒絕敏感度高 (RSD)',
        short: '焦慮 / RSD',
        badgeClass: 'bg-pink-100 text-pink-800 border-pink-300',
        barColor: '#db2777'
      },
      SPD: {
        code: 'SPD',
        label: '感官處理障礙 (SPD)',
        short: 'SPD (感官處理)',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        barColor: '#4f46e5'
      }
    };

    // 5. 二、前因與誘發因子 (A) 完整映射表
    this.ANTECEDENT_CATEGORIES = [
      {
        code: 'TASK_DIFFICULTY',
        name: '任務難度與認知負荷',
        examples: '長篇文字閱讀、多步驟數學應用題、大篇幅生字書寫',
        mechanism: '特定學習障礙（SLD）、ADHD 執行功能不足',
        relatedConditions: ['SLD_READING_WRITING', 'SLD_MATH', 'ADHD_INATTENTION'],
        defaultDetails: [
          '面對長篇閱讀/大量文字書寫',
          '數學難題/多步驟解題卡關'
        ]
      },
      {
        code: 'SENSORY_STIMULUS',
        name: '感官與環境刺激',
        examples: '廣播、日光燈嗡嗡聲、走廊腳步聲、制服標籤刺癢',
        mechanism: '自閉症（感官過載）、感官處理障礙（SPD）',
        relatedConditions: ['ASD', 'SPD', 'ADHD_INATTENTION'],
        defaultDetails: [
          '同儕發出聲音或視覺干擾',
          '廣播/走廊騷動/外界感官刺激'
        ]
      },
      {
        code: 'SOCIAL_INTERACTION',
        name: '人際與社交互動',
        examples: '小組分組、輪流排隊、同儕口語開玩笑、被糾正',
        mechanism: '自閉症（社交理解弱）、ODD / RSD（情緒衝動與敏感）',
        relatedConditions: ['ASD', 'ODD', 'ANXIETY_RSD', 'ADHD_HYPER_IMPULSIVE'],
        defaultDetails: [
          '未被點到發言/輪流等待中',
          '同儕言語觸碰或分組被拒'
        ]
      },
      {
        code: 'ROUTINE_CHANGE',
        name: '常規或流程變動',
        examples: '換代課老師、更換課堂流程、臨時換教室',
        mechanism: '自閉症（固著性抗拒變動）',
        relatedConditions: ['ASD', 'ANXIETY_RSD'],
        defaultDetails: [
          '突發流程變動/更換代課老師'
        ]
      },
      {
        code: 'UNSTRUCTURED_TIME',
        name: '非結構化/等待空檔',
        examples: '下課轉銜、等待老師發考卷空檔、體育自由活動',
        mechanism: 'ADHD（缺乏外在結構引導時的動態失控）',
        relatedConditions: ['ADHD_HYPER_IMPULSIVE', 'ADHD_INATTENTION'],
        defaultDetails: [
          '等待發卷或切換活動之空檔'
        ]
      },
      {
        code: 'NONE_OBSERVED',
        name: '無明顯外部誘因',
        examples: '安靜自習或常規進行中突發',
        mechanism: '內發性神經傳導波動（如抽動症、內在失神或生理疲勞）',
        relatedConditions: [],
        defaultDetails: [
          '無明顯外部前因'
        ]
      }
    ];

    this.ANTECEDENT_DETAILS_ENUM = [
      { detail: '面對長篇閱讀/大量文字書寫', category: 'TASK_DIFFICULTY', extraCondition: 'SLD_READING_WRITING' },
      { detail: '數學難題/多步驟解題卡關', category: 'TASK_DIFFICULTY', extraCondition: 'SLD_MATH' },
      { detail: '同儕發出聲音或視覺干擾', category: 'SENSORY_STIMULUS', extraCondition: 'ADHD_INATTENTION' },
      { detail: '廣播/走廊騷動/外界感官刺激', category: 'SENSORY_STIMULUS', extraCondition: 'SPD' },
      { detail: '未被點到發言/輪流等待中', category: 'SOCIAL_INTERACTION', extraCondition: 'ADHD_HYPER_IMPULSIVE' },
      { detail: '同儕言語觸碰或分組被拒', category: 'SOCIAL_INTERACTION', extraCondition: 'ASD' },
      { detail: '突發流程變動/更換代課老師', category: 'ROUTINE_CHANGE', extraCondition: 'ASD' },
      { detail: '等待發卷或切換活動之空檔', category: 'UNSTRUCTURED_TIME', extraCondition: 'ADHD_HYPER_IMPULSIVE' },
      { detail: '無明顯外部前因', category: 'NONE_OBSERVED', extraCondition: null }
    ];

    // 6. 三、核心外顯行為向度主分類 (B - category)
    this.BEHAVIOR_CATEGORIES = [
      { code: 'INATTENTION', name: '注意力與執行功能', icon: '💭', color: 'blue' },
      { code: 'HYPERACTIVITY', name: '過動與動作調節', icon: '🦵', color: 'purple' },
      { code: 'IMPULSIVITY_DISRUPTION', name: '衝動與人際干擾', icon: '📢', color: 'amber' },
      { code: 'EMOTION_OPPOSITION', name: '情緒與對立抗拒', icon: '🌋', color: 'rose' },
      { code: 'TIC_SENSORY', name: '抽動與感官動作', icon: '⚡', color: 'emerald' },
      { code: 'HYPERFOCUS', name: '特殊過度專注', icon: '🎯', color: 'indigo' }
    ];

    // 7. 17 項具體行為代碼與臨床疾病診斷映射表 (B - target_code)
    this.BEHAVIOR_TARGETS = [
      {
        code: 'OFF',
        label: '脫離任務/發呆 (OFF)',
        shortName: '脫離任務/發呆',
        category: 'INATTENTION',
        basicCodeMap: '+', // 對應基礎版：+ 放空、發呆
        primary: 'ADHD（注意力不足型）',
        differential: '廣泛性焦慮症、學習障礙、失神性癲癇',
        clinicalKey: 'ADHD 常因外在微小刺激拉走；焦慮症多為沉浸於內心擔憂；癲癇則為數秒突發意識中斷且叫不應。',
        relatedConditions: ['ADHD_INATTENTION', 'ANXIETY_RSD', 'SLD_READING_WRITING']
      },
      {
        code: 'FD',
        label: '把玩文具/分心物 (FD)',
        shortName: '把玩文具/分心物',
        category: 'INATTENTION',
        basicCodeMap: '○', // 對應基礎版：○ 玩文具、雜物
        primary: 'ADHD（混合型/注意力不足）',
        differential: '感官處理障礙（SPD）',
        clinicalKey: '透過微小手部動作刺激大腦多巴胺以維持覺醒；若合併極度觸覺質地偏好則考慮 SPD。',
        relatedConditions: ['ADHD_INATTENTION', 'ADHD_HYPER_IMPULSIVE', 'SPD']
      },
      {
        code: 'TI',
        label: '啟動困難/拖延 (TI)',
        shortName: '啟動困難/拖延',
        category: 'INATTENTION',
        basicCodeMap: '+',
        primary: 'ADHD（執行功能缺損）',
        differential: '學習障礙、完美主義/表現焦慮',
        clinicalKey: 'ADHD 是「大腦缺乏啟動動機/多巴胺」；學習障礙是「完全看不懂題目」；焦慮則是「害怕寫錯不敢下筆」。',
        relatedConditions: ['ADHD_INATTENTION', 'SLD_READING_WRITING', 'SLD_MATH', 'ANXIETY_RSD']
      },
      {
        code: 'WM',
        label: '指令遺忘/工作記憶弱 (WM)',
        shortName: '指令遺忘/工作記憶弱',
        category: 'INATTENTION',
        basicCodeMap: '+',
        primary: 'ADHD（工作記憶缺損）',
        differential: '特定學習障礙（語文理解型）、聽知覺處理障礙（APD）',
        clinicalKey: '聽完多步驟指令只能做第一步。若單純口語指令聽不懂但看圖像符號可理解，偏向 APD 或語言障礙。',
        relatedConditions: ['ADHD_INATTENTION', 'SLD_READING_WRITING']
      },
      {
        code: 'LM',
        label: '物品遺漏/用具混亂 (LM)',
        shortName: '物品遺漏/用具混亂',
        category: 'INATTENTION',
        basicCodeMap: '↑', // 對應基礎版：↑ 尋找東西、遺失物
        primary: 'ADHD（空間與組織障礙）',
        differential: '發展協調障礙（DCD）',
        clinicalKey: '個人物品管理極度混亂，反映大腦背側前額葉皮質（DLPFC）的組織規劃障礙。',
        relatedConditions: ['ADHD_INATTENTION']
      },
      {
        code: 'OOS',
        label: '未經許可擅自離座 (OOS)',
        shortName: '未經許可擅自離座',
        category: 'HYPERACTIVITY',
        basicCodeMap: '△', // 對應基礎版：△ 擅自離開座位
        primary: 'ADHD（過動/衝動型）',
        differential: '對立反抗症（ODD）、自閉症（逃避情境）',
        clinicalKey: 'ADHD 離座常無特定目的（晃一晃動一動）；ODD 多為挑戰規則；自閉症常為逃離感官負荷過重環境。',
        relatedConditions: ['ADHD_HYPER_IMPULSIVE', 'ODD', 'ASD']
      },
      {
        code: 'MV',
        label: '身體躁動/晃椅/抖腳 (MV)',
        shortName: '身體躁動/晃椅/抖腳',
        category: 'HYPERACTIVITY',
        basicCodeMap: '～', // 對應基礎版：～ 扭、抖動身體
        primary: 'ADHD（過動型）',
        differential: '感官尋求（自閉症）、動作型抽動症',
        clinicalKey: '持續性的粗大肢體釋放能量；抽動症則呈突發、無節奏、短暫的單一部位抽搐。',
        relatedConditions: ['ADHD_HYPER_IMPULSIVE', 'SPD', 'TIC_TOURETTE']
      },
      {
        code: 'NV',
        label: '製造無關聲響/怪聲 (NV)',
        shortName: '製造無關聲響/怪聲',
        category: 'HYPERACTIVITY',
        basicCodeMap: '⚡', // 對應基礎版：⚡ 發出怪聲、不自主抽動
        primary: 'ADHD（衝動抑制不足）',
        differential: '抽動症/妥瑞氏症、自閉症自我刺激（Stimming）',
        clinicalKey: 'ADHD 常是哼歌、敲桌等節奏性聲響；妥瑞氏症為喉音、清喉嚨、不自主抽發怪聲。',
        relatedConditions: ['ADHD_HYPER_IMPULSIVE', 'TIC_TOURETTE', 'ASD']
      },
      {
        code: 'CO',
        label: '未舉手搶答 (CO)',
        shortName: '未舉手搶答',
        category: 'IMPULSIVITY_DISRUPTION',
        basicCodeMap: '！', // 對應基礎版：！ 未舉手發言、搶話
        primary: 'ADHD（衝動型）',
        differential: '—',
        clinicalKey: '抑制控制（Inhibitory Control）不足，大腦想到的答案無法透過煞車系統延遲發言。',
        relatedConditions: ['ADHD_HYPER_IMPULSIVE']
      },
      {
        code: 'TB',
        label: '插話/打斷他人 (TB)',
        shortName: '插話/打斷他人',
        category: 'IMPULSIVITY_DISRUPTION',
        basicCodeMap: '！',
        primary: 'ADHD（衝動型）',
        differential: '自閉症（ASD，社交線索解讀障礙）',
        clinicalKey: 'ADHD 是「知道該等但忍不住」；自閉症是「無法理解兩人對話的輪替潛規則（Turn-taking）」。',
        relatedConditions: ['ADHD_HYPER_IMPULSIVE', 'ASD']
      },
      {
        code: 'IN',
        label: '侵犯空間/拿取他人物品 (IN)',
        shortName: '侵犯空間/拿他人物品',
        category: 'IMPULSIVITY_DISRUPTION',
        basicCodeMap: '×',
        primary: 'ADHD（本體感覺與抑制不足）',
        differential: '自閉症（ASD，人際界線缺失）',
        clinicalKey: 'ADHD 常因動作大不慎碰撞或衝動順手拿；自閉症則是缺乏「物權與個人心理界線」概念。',
        relatedConditions: ['ADHD_HYPER_IMPULSIVE', 'ASD', 'SPD']
      },
      {
        code: 'RU',
        label: '破壞規則/堅持己見 (RU)',
        shortName: '破壞規則/堅持己見',
        category: 'EMOTION_OPPOSITION',
        basicCodeMap: '＃', // 對應基礎版：＃ 情緒抗拒、發脾氣、拒寫
        primary: '自閉症（固著性行為）',
        differential: '對立反抗症（ODD）、ADHD（挫折耐受差）',
        clinicalKey: '自閉症堅持「規則必須照我的標準流程」；ODD 則是「專門對抗權威與師長指令」。',
        relatedConditions: ['ASD', 'ODD', 'ADHD_HYPER_IMPULSIVE']
      },
      {
        code: 'FR',
        label: '挫折抗拒/發脾氣/撕紙 (FR)',
        shortName: '挫折抗拒/發脾氣/撕紙',
        category: 'EMOTION_OPPOSITION',
        basicCodeMap: '＃', // 對應基礎版：＃ 情緒抗拒、發脾氣、拒寫
        primary: '對立反抗症（ODD） / 情緒調節障礙',
        differential: '學習障礙、自閉症感官崩潰（Meltdown）',
        clinicalKey: '面對學習卡關時的情緒爆發。若伴隨極端仇視權威屬 ODD；若伴隨文字解碼障礙則多源自學習障礙引發的次發性情緒問題。',
        relatedConditions: ['ODD', 'SLD_READING_WRITING', 'SLD_MATH', 'ASD']
      },
      {
        code: 'RSD',
        label: '被糾正激烈防禦 (RSD)',
        shortName: '被糾正激烈防禦',
        category: 'EMOTION_OPPOSITION',
        basicCodeMap: '＃', // 對應基礎版：＃ 情緒抗拒、發脾氣、拒寫
        primary: '拒絕敏感焦慮（RSD / ADHD共病）',
        differential: '社交焦慮症、創傷後壓力特質',
        clinicalKey: '接收到善意修正卻解讀為毀滅性批判，產生極度羞愧感與攻擊性防衛。',
        relatedConditions: ['ANXIETY_RSD', 'ADHD_INATTENTION', 'ADHD_HYPER_IMPULSIVE']
      },
      {
        code: 'TIC_M',
        label: '動作型抽動/眨眼/甩頭 (TIC_M)',
        shortName: '動作型抽動（眨眼/甩頭）',
        category: 'TIC_SENSORY',
        basicCodeMap: '⚡', // 對應基礎版：⚡ 發出怪聲、不自主抽動
        primary: '抽動症 / 妥瑞氏症',
        differential: '兒童焦慮症、過敏性結膜炎（需生理鑑別）',
        clinicalKey: '不自主肌肉抽搐，在壓力大、疲勞、專注抑制解除時顯著增加。',
        relatedConditions: ['TIC_TOURETTE', 'ANXIETY_RSD']
      },
      {
        code: 'TIC_V',
        label: '聲語型抽動/清喉嚨/哼聲 (TIC_V)',
        shortName: '聲語型抽動（清喉嚨/哼聲）',
        category: 'TIC_SENSORY',
        basicCodeMap: '⚡', // 對應基礎版：⚡ 發出怪聲、不自主抽動
        primary: '抽動症 / 妥瑞氏症',
        differential: '慢性咽喉炎/過敏性鼻炎（倒流）',
        clinicalKey: '需先排除過敏等生理器質病變。妥瑞抽語通常伴隨動作抽動，具突發性與強迫感。',
        relatedConditions: ['TIC_TOURETTE']
      },
      {
        code: 'HF',
        label: '特定項目過度專注 (HF)',
        shortName: '特定項目過度專注',
        category: 'HYPERFOCUS',
        basicCodeMap: '+',
        primary: 'ADHD（多巴胺調節失衡）',
        differential: '自閉症類群（特殊狹隘興趣）',
        clinicalKey: 'ADHD 對高多巴胺反饋活動（平板、遊戲）廢寢忘食但切換困難；自閉症則針對特定領域知識（如火車時刻表、昆蟲分類）展現重複鑽研。',
        relatedConditions: ['ADHD_INATTENTION', 'ASD']
      }
    ];

    // 8. 四、嚴重/干擾強度定義
    this.INTENSITY_LEVELS = [
      { value: 1, label: '1 = 輕度（自我干擾）', short: '輕度 (1)', desc: '僅影響自身學習效率，未干擾鄰座或課堂進行', colorClass: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
      { value: 2, label: '2 = 中度（干擾鄰近他人）', short: '中度 (2)', desc: '影響周遭同儕視線、專注或引發局部騷動', colorClass: 'border-amber-300 bg-amber-50 text-amber-900' },
      { value: 3, label: '3 = 重度（中斷全班或具破壞性）', short: '重度 (3)', desc: '迫使教師中斷講課處理，或具安全/情緒破壞風險', colorClass: 'border-rose-300 bg-rose-50 text-rose-900' }
    ];

    // 9. 五、介入處置策略與成效 (C)
    this.INTERVENTION_STRATEGIES = [
      { code: 'NONE_IGNORE', label: '暫時忽視/未介入' },
      { code: 'NON_VERBAL_PROMPT', label: '非口語手勢/眼神/輕敲桌面' },
      { code: 'VERBAL_REMINDER', label: '個別口頭提示/點名' },
      { code: 'TASK_ADAPTATION', label: '調整難度/切分任務步驟' },
      { code: 'POSITIVE_REINFORCEMENT', label: '即時正向回饋/集點讚美' },
      { code: 'CALM_DOWN_AREA', label: '帶至冷靜角/暫離刺激源' },
      { code: 'PHYSICAL_GUIDANCE', label: '肢體引導回座' }
    ];

    this.INTERVENTION_OUTCOMES = [
      { code: 'IMMEDIATE_IMPROVEMENT', label: '立即改善（重回任務並持續 > 5分鐘）', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300', score: 3 },
      { code: 'TRANSIENT_IMPROVEMENT', label: '短暫改善（短暫回神但 < 1分鐘後復發）', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300', score: 2 },
      { code: 'NO_EFFECT', label: '毫無反應（維持原狀）', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300', score: 1 },
      { code: 'ESCALATION', label: '抗拒加劇（情緒升級、頂撞抗拒）', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300', score: 0 }
    ];
  }

  /**
   * 取得行為代碼完整定義
   */
  getBehaviorByCode(code) {
    return this.BEHAVIOR_TARGETS.find(b => b.code === code) || this.BEHAVIOR_TARGETS[0];
  }

  /**
   * 取得前因分類定義
   */
  getAntecedentCategory(code) {
    return this.ANTECEDENT_CATEGORIES.find(a => a.code === code) || this.ANTECEDENT_CATEGORIES[0];
  }

  /**
   * 產生符合 ^rec_[0-9]{8}_[0-9A-Za-z]+$ 規範的唯一識別碼
   */
  generateRecordId(dateStr) {
    const cleanDate = (dateStr || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const all = this.getAllRecords();
    const prefix = `rec_${cleanDate}_`;
    const todayRecords = all.filter(r => r.record_id && r.record_id.startsWith(prefix));
    const nextSeq = String(todayRecords.length + 1).padStart(3, '0');
    // 若序號重複則加上隨機尾碼
    const candidate = `${prefix}${nextSeq}`;
    if (all.some(r => r.record_id === candidate)) {
      const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `${prefix}${nextSeq}${rand}`;
    }
    return candidate;
  }

  /**
   * 產生帶有 +08:00 時區的 ISO 8601 時間戳記
   */
  generateIsoTimestamp(dateStr, timeStr) {
    const now = new Date();
    const d = dateStr || now.toISOString().split('T')[0];
    const t = timeStr || now.toTimeString().split(' ')[0];
    return `${d}T${t.length === 5 ? t + ':00' : t}+08:00`;
  }

  /**
   * 取得使用者提供的標準範例紀錄 (rec_20261111_001)
   */
  getSampleRecord(studentId) {
    return {
      record_id: 'rec_20261111_001',
      student_id: studentId || 'S105',
      timestamp: '2026-11-11T10:15:00+08:00',
      context: {
        period: 2,
        subject: '數學',
        activity_type: '個別書寫作答',
        environment_notes: '第 2 排靠窗，周圍有同學在小聲討論'
      },
      antecedent: {
        category: 'TASK_DIFFICULTY',
        details: '數學難題/多步驟解題卡關'
      },
      behavior: {
        category: 'INATTENTION',
        target_code: 'OFF',
        target_label: '脫離任務/發呆 (OFF)',
        related_conditions: ['ADHD_INATTENTION', 'SLD_MATH', 'ANXIETY_RSD']
      },
      metrics: {
        frequency: 1,
        duration_minutes: 8,
        intensity: 2
      },
      intervention: {
        strategy: 'TASK_ADAPTATION',
        strategy_label: '調整難度/切分任務步驟',
        outcome: 'IMMEDIATE_IMPROVEMENT',
        outcome_label: '立即改善（重回任務並持續 > 5分鐘）'
      },
      qualitative_notes: '卡在多步驟應用題第二小題，協助將題目拆成兩階段算式後，能順利完成後續運算。'
    };
  }

  /**
   * JSON Schema Draft 2020-12 驗證器
   */
  validateRecord(rec) {
    const errors = [];
    if (!rec || typeof rec !== 'object') {
      return { valid: false, errors: ['紀錄必須為 JSON 物件'] };
    }

    const requiredFields = ['record_id', 'student_id', 'timestamp', 'context', 'behavior', 'metrics', 'intervention'];
    requiredFields.forEach(f => {
      if (rec[f] === undefined || rec[f] === null) {
        errors.push(`缺少必要欄位: ${f}`);
      }
    });

    if (rec.record_id && !/^rec_[0-9]{8}_[0-9A-Za-z]+$/.test(rec.record_id)) {
      errors.push(`record_id 格式不符 (^rec_[0-9]{8}_[0-9A-Za-z]+$): ${rec.record_id}`);
    }

    if (rec.context) {
      const p = Number(rec.context.period);
      if (!Number.isInteger(p) || p < 1 || p > 8) {
        errors.push('context.period 必須為 1~8 的整數');
      }
      if (!this.SUBJECTS.includes(rec.context.subject)) {
        errors.push(`context.subject 不在允許範圍內: ${rec.context.subject}`);
      }
      if (!this.ACTIVITY_TYPES.includes(rec.context.activity_type)) {
        errors.push(`context.activity_type 不在允許範圍內: ${rec.context.activity_type}`);
      }
    }

    if (rec.behavior) {
      const validCats = this.BEHAVIOR_CATEGORIES.map(c => c.code);
      if (!validCats.includes(rec.behavior.category)) {
        errors.push(`behavior.category 無效: ${rec.behavior.category}`);
      }
      const validCodes = this.BEHAVIOR_TARGETS.map(b => b.code);
      if (!validCodes.includes(rec.behavior.target_code)) {
        errors.push(`behavior.target_code 無效: ${rec.behavior.target_code}`);
      }
    }

    if (rec.metrics) {
      const intensity = Number(rec.metrics.intensity);
      if (!Number.isInteger(intensity) || intensity < 1 || intensity > 3) {
        errors.push('metrics.intensity 必須為 1~3 的整數');
      }
      if (rec.metrics.frequency !== undefined && Number(rec.metrics.frequency) < 1) {
        errors.push('metrics.frequency 必須 >= 1');
      }
      if (rec.metrics.duration_minutes !== undefined && Number(rec.metrics.duration_minutes) < 0) {
        errors.push('metrics.duration_minutes 必須 >= 0');
      }
    }

    if (rec.intervention) {
      const validStrats = this.INTERVENTION_STRATEGIES.map(s => s.code);
      if (!validStrats.includes(rec.intervention.strategy)) {
        errors.push(`intervention.strategy 無效: ${rec.intervention.strategy}`);
      }
      const validOutcomes = this.INTERVENTION_OUTCOMES.map(o => o.code);
      if (!validOutcomes.includes(rec.intervention.outcome)) {
        errors.push(`intervention.outcome 無效: ${rec.intervention.outcome}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 讀取全部本地進階紀錄
   */
  getAllRecords() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to read advanced records:', e);
      return [];
    }
  }

  /**
   * 依個案與日期篩選進階紀錄
   */
  getRecordsByFilter(studentId, dateStr, rangeMode = 'all') {
    const all = this.getAllRecords();
    return all.filter(r => {
      if (studentId && studentId !== 'ALL' && r.student_id !== studentId) return false;
      const recDate = (r.timestamp || '').split('T')[0];
      if (rangeMode === 'today' && dateStr) {
        return recDate === dateStr;
      }
      if (rangeMode === 'week') {
        const ref = dateStr ? new Date(dateStr) : new Date();
        const d = new Date(recDate);
        const diffDays = (ref - d) / (1000 * 3600 * 24);
        return diffDays >= -1 && diffDays <= 7;
      }
      return true;
    });
  }

  /**
   * 新增或覆寫單筆進階紀錄
   */
  saveRecord(record, observerRole = '導師') {
    const all = this.getAllRecords();
    const recordWithMeta = {
      ...record,
      _meta: {
        observer: observerRole,
        synced: false,
        updatedAt: new Date().toISOString()
      }
    };
    const idx = all.findIndex(r => r.record_id === record.record_id);
    if (idx >= 0) {
      all[idx] = recordWithMeta;
    } else {
      all.unshift(recordWithMeta);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    return recordWithMeta;
  }

  /**
   * 刪除單筆進階紀錄
   */
  deleteRecord(recordId) {
    const all = this.getAllRecords().filter(r => r.record_id !== recordId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  }

  /**
   * 刪除特定個案的所有進階紀錄
   */
  deleteRecordsByStudent(studentId) {
    const all = this.getAllRecords().filter(r => r.student_id !== studentId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  }

  /**
   * 標記紀錄已同步至雲端
   */
  markSynced(recordId) {
    const all = this.getAllRecords();
    const rec = all.find(r => r.record_id === recordId);
    if (rec) {
      rec._meta = rec._meta || {};
      rec._meta.synced = true;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    }
  }

  /**
   * 臨床推論規則與指標映射分析引擎
   * 根據多筆 ClassroomBehaviorRecord 自動推算：
   * 1. 相關疾病標籤 (related_conditions) 加權指標分佈
   * 2. 行為代碼臨床鑑別重點清單
   * 3. 誘發因子 (Antecedent) 病因機制歸因
   * 4. 介入處置 (Intervention) 有效率排行
   */
  analyzeClinicalRecords(records) {
    const totalEvents = records.length;
    let totalFrequency = 0;
    let totalDuration = 0;
    let intensitySum = 0;

    const conditionCounts = {};
    Object.keys(this.RELATED_CONDITIONS_META).forEach(k => {
      conditionCounts[k] = { count: 0, weightedScore: 0 };
    });

    const behaviorCodeCounts = {};
    const antecedentCounts = {};
    const strategyEffectiveness = {};
    const subjectCounts = {};

    records.forEach(r => {
      const freq = Number(r.metrics?.frequency || 1);
      const dur = Number(r.metrics?.duration_minutes || 0);
      const inten = Number(r.metrics?.intensity || 1);

      totalFrequency += freq;
      totalDuration += dur;
      intensitySum += inten;

      // 科目統計
      const subj = r.context?.subject || '未分類';
      subjectCounts[subj] = (subjectCounts[subj] || 0) + freq;

      // 行為代碼統計
      const tCode = r.behavior?.target_code;
      if (tCode) {
        if (!behaviorCodeCounts[tCode]) {
          behaviorCodeCounts[tCode] = { count: 0, duration: 0, maxIntensity: 0, notes: [] };
        }
        behaviorCodeCounts[tCode].count += freq;
        behaviorCodeCounts[tCode].duration += dur;
        behaviorCodeCounts[tCode].maxIntensity = Math.max(behaviorCodeCounts[tCode].maxIntensity, inten);
        if (r.qualitative_notes) {
          behaviorCodeCounts[tCode].notes.push(r.qualitative_notes);
        }
      }

      // 前因統計
      const aCat = r.antecedent?.category;
      if (aCat) {
        if (!antecedentCounts[aCat]) {
          antecedentCounts[aCat] = { count: 0, details: {} };
        }
        antecedentCounts[aCat].count += freq;
        const det = r.antecedent?.details || '未詳述';
        antecedentCounts[aCat].details[det] = (antecedentCounts[aCat].details[det] || 0) + freq;
      }

      // 相關疾病指標加權 (頻率 × 強度權重)
      const relConds = (r.behavior?.related_conditions && r.behavior.related_conditions.length > 0)
        ? r.behavior.related_conditions
        : (this.getBehaviorByCode(tCode)?.relatedConditions || []);

      relConds.forEach((cond, idx) => {
        if (conditionCounts[cond]) {
          conditionCounts[cond].count += freq;
          // 首要關聯權重較高
          const rankWeight = idx === 0 ? 1.5 : 1.0;
          conditionCounts[cond].weightedScore += Math.round(freq * inten * rankWeight * 10) / 10;
        }
      });

      // 介入策略成效統計
      const strat = r.intervention?.strategy;
      const out = r.intervention?.outcome;
      if (strat) {
        if (!strategyEffectiveness[strat]) {
          strategyEffectiveness[strat] = {
            strategy: strat,
            label: r.intervention?.strategy_label || strat,
            total: 0,
            immediate: 0,
            transient: 0,
            noEffect: 0,
            escalation: 0
          };
        }
        strategyEffectiveness[strat].total += 1;
        if (out === 'IMMEDIATE_IMPROVEMENT') strategyEffectiveness[strat].immediate += 1;
        else if (out === 'TRANSIENT_IMPROVEMENT') strategyEffectiveness[strat].transient += 1;
        else if (out === 'NO_EFFECT') strategyEffectiveness[strat].noEffect += 1;
        else if (out === 'ESCALATION') strategyEffectiveness[strat].escalation += 1;
      }
    });

    const avgIntensity = totalEvents > 0 ? (intensitySum / totalEvents).toFixed(1) : '0.0';

    // 排序最顯著的相關疾病指標
    const rankedConditions = Object.keys(conditionCounts)
      .map(code => ({
        ...this.RELATED_CONDITIONS_META[code],
        count: conditionCounts[code].count,
        weightedScore: conditionCounts[code].weightedScore
      }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.weightedScore - a.weightedScore);

    // 排序最常出現的行為代碼並附帶臨床鑑別資訊
    const rankedBehaviors = Object.keys(behaviorCodeCounts)
      .map(code => {
        const meta = this.getBehaviorByCode(code);
        return {
          ...meta,
          count: behaviorCodeCounts[code].count,
          duration: behaviorCodeCounts[code].duration,
          maxIntensity: behaviorCodeCounts[code].maxIntensity,
          notes: behaviorCodeCounts[code].notes
        };
      })
      .sort((a, b) => b.count - a.count);

    // 排序前因誘發因子
    const rankedAntecedents = Object.keys(antecedentCounts)
      .map(code => {
        const meta = this.getAntecedentCategory(code);
        return {
          ...meta,
          count: antecedentCounts[code].count,
          details: antecedentCounts[code].details
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      totalEvents,
      totalFrequency,
      totalDuration,
      avgIntensity,
      rankedConditions,
      rankedBehaviors,
      rankedAntecedents,
      strategyEffectiveness: Object.values(strategyEffectiveness),
      subjectCounts
    };
  }
}

window.ClinicalAdvanced = new ClinicalAdvancedManager();
