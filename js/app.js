/**
 * App: 主應用程式邏輯控制器 (升級：多師協同、個案管理刪除、A-B-C脈絡、正向行為、雲端程式碼)
 */
document.addEventListener('DOMContentLoaded', () => {
  // 核心行為代號 (3×3 九宮格：原 6 大代號 + 進階模式導入之 3 項高頻臨床行為，並配置專屬 GIF 微動畫圖示)
  const BEHAVIORS = [
    { code: '○', name: '玩文具、雜物、桌椅', icon: '✏️', animClass: 'gif-anim-pencil', desc: '玩筆、尺、橡皮擦屑、桌面雜物、搖晃桌椅 (對應 FD)', badgeColor: 'bg-blue-600', lightColor: 'text-blue-600' },
    { code: '+', name: '放空發呆、啟動拖延', icon: '💭', animClass: 'gif-anim-cloud', desc: '眼神渙散、聽完指令忘記步驟、遲遲不動筆 (對應 OFF/TI/WM)', badgeColor: 'bg-emerald-600', lightColor: 'text-emerald-600' },
    { code: '↑', name: '尋找東西、遺失物', icon: '🔍', animClass: 'gif-anim-search', desc: '低頭翻書包、找筆、掉文具、物品管理混亂 (對應 LM)', badgeColor: 'bg-amber-600', lightColor: 'text-amber-600' },
    { code: '～', name: '扭、抖動身體', icon: '🦵', animClass: 'gif-anim-leg', desc: '在座位上頻繁抖腳、扭動身軀、坐立難安 (對應 MV)', badgeColor: 'bg-purple-600', lightColor: 'text-purple-600' },
    { code: '△', name: '擅自離開座位', icon: '🏃', animClass: 'gif-anim-walk', desc: '未經許可起立、在教室走動、跑去別組或走廊 (對應 OOS)', badgeColor: 'bg-indigo-600', lightColor: 'text-indigo-600' },
    { code: '×', name: '動作、講話干擾他人', icon: '🗣️', animClass: 'gif-anim-talk', desc: '拍打同學、推擠、私下交談、拿取他人物品 (對應 IN)', badgeColor: 'bg-rose-600', lightColor: 'text-rose-600' },
    { code: '！', name: '未舉手發言、搶話', icon: '📢', animClass: 'gif-anim-speaker', desc: '老師或同學講話時插話、未舉手搶答、打斷他人 (對應 CO/TB)', badgeColor: 'bg-pink-600', lightColor: 'text-pink-600' },
    { code: '＃', name: '情緒抗拒、發脾氣、拒寫', icon: '💢', animClass: 'gif-anim-anger', desc: '挫折哭鬧、撕紙摔筆、趴下拒寫、被糾正激烈頂撞 (對應 FR/RU/RSD)', badgeColor: 'bg-red-700', lightColor: 'text-red-700' },
    { code: '⚡', name: '發出怪聲、不自主抽動', icon: '⚡', animClass: 'gif-anim-zap', desc: '清喉嚨、哼聲、敲桌節奏、頻繁眨眼甩頭等抽動 (對應 NV/TIC)', badgeColor: 'bg-teal-600', lightColor: 'text-teal-600' }
  ];

  // 學校作息課表排程
  const SCHEDULE = [
    { id: 0, name: '早自習', timeStr: '08:00~08:35', desc: '晨間活動 (08:00~08:15) / 導師時間 (08:15~08:35)', startMin: 8 * 60, endMin: 8 * 60 + 35, spanMin: [0, 8 * 60 + 39] },
    { id: 1, name: '第一節', timeStr: '08:40~09:20', desc: '第 1 節課 (下課 09:20~09:30)', startMin: 8 * 60 + 40, endMin: 9 * 60 + 20, spanMin: [8 * 60 + 40, 9 * 60 + 25] },
    { id: 2, name: '第二節', timeStr: '09:30~10:10', desc: '第 2 節課 (大下課 10:10~10:30)', startMin: 9 * 60 + 30, endMin: 10 * 60 + 10, spanMin: [9 * 60 + 26, 10 * 60 + 20] },
    { id: 3, name: '第三節', timeStr: '10:30~11:10', desc: '第 3 節課 (下課 11:10~11:20)', startMin: 10 * 60 + 30, endMin: 11 * 60 + 10, spanMin: [10 * 60 + 21, 11 * 60 + 15] },
    { id: 4, name: '第四節', timeStr: '11:20~12:00', desc: '第 4 節課', startMin: 11 * 60 + 20, endMin: 12 * 60, spanMin: [11 * 60 + 16, 12 * 60] },
    { id: 5, name: '中午', timeStr: '12:00~13:10', desc: '午餐時間 (12:00~12:40) / 午休 (12:40~13:10)', startMin: 12 * 60, endMin: 13 * 60 + 10, spanMin: [12 * 60 + 1, 13 * 60 + 15] },
    { id: 6, name: '第五節', timeStr: '13:20~14:00', desc: '第 5 節課 (下課 14:00~14:10)', startMin: 13 * 60 + 20, endMin: 14 * 60, spanMin: [13 * 60 + 16, 14 * 60 + 5] },
    { id: 7, name: '第六節', timeStr: '14:10~14:50', desc: '第 6 節課 (下課 14:50~15:10)', startMin: 14 * 60 + 10, endMin: 14 * 60 + 50, spanMin: [14 * 60 + 6, 15 * 60 + 5] },
    { id: 8, name: '第七節', timeStr: '15:10~15:50', desc: '第 7 節課 / 放學 (15:50~16:00)', startMin: 15 * 60 + 10, endMin: 15 * 60 + 50, spanMin: [15 * 60 + 6, 24 * 60] }
  ];

  const PERIODS = SCHEDULE.map(s => s.name);

  // A 前事標籤與 C 後果標籤 (已融合進階模式之臨床高價值誘因與有效處置)
  const ANTECEDENT_TAGS = [
    '教師單向講課', '學生獨立書寫', '分組討論合作',
    '長篇閱讀/大量書寫(難度高)', '數學多步驟解題卡關',
    '廣播/走廊外界感官刺激', '未被點到發言/輪流等待',
    '突發流程變動/代課老師', '等待發卷/轉銜空檔', '疲憊飢餓/身體不適'
  ];

  const CONSEQUENCE_TAGS = [
    '非口語手勢/眼神示意', '個別口頭提示/點名', '調整難度/切分任務步驟',
    '即時正向回饋/集點讚美', '帶至冷靜角/暫離刺激源', '肢體引導回座',
    '同儕起鬨圍觀', '暫時忽視/未介入'
  ];

  // 狀態管理
  let currentCaseId = window.CaseManager.getActiveCaseId();
  let currentDate = new Date().toISOString().split('T')[0];
  let currentPeriodIndex = 0;
  let isEditMode = false;
  let dayRecord = createEmptyDayRecord(currentCaseId, currentDate);

  // DOM 參考快取
  const dom = {
    // 頂部
    observerRoleSelect: document.getElementById('observerRoleSelect'),
    customObserverInput: document.getElementById('customObserverInput'),
    caseSelect: document.getElementById('caseSelect'),
    btnNewCase: document.getElementById('btnNewCase'),
    btnManageCases: document.getElementById('btnManageCases'),
    btnFetchCloud: document.getElementById('btnFetchCloud'),
    syncBadge: document.getElementById('syncBadge'),
    editModeBadge: document.getElementById('editModeBadge'),

    // 導覽
    navTabs: document.querySelectorAll('.nav-tab'),
    viewSections: document.querySelectorAll('.view-section'),

    // 基本設定
    dateInput: document.getElementById('dateInput'),
    medTimeInput: document.getElementById('medTimeInput'),
    discomfortInput: document.getElementById('discomfortInput'),

    // 課表排程列
    liveClockDisplay: document.getElementById('liveClockDisplay'),
    liveScheduleStatus: document.getElementById('liveScheduleStatus'),
    autoTimeJumpCheckbox: document.getElementById('autoTimeJumpCheckbox'),
    btnJumpToCurrentPeriod: document.getElementById('btnJumpToCurrentPeriod'),

    // 節次列
    periodTabsContainer: document.getElementById('periodTabsContainer'),
    currentPeriodTitle: document.getElementById('currentPeriodTitle'),
    currentPeriodObserverTag: document.getElementById('currentPeriodObserverTag'),
    btnMarkV: document.getElementById('btnMarkV'),
    btnPositiveBehavior: document.getElementById('btnPositiveBehavior'),
    positiveCountBadge: document.getElementById('positiveCountBadge'),

    // 速記區與 A-B-C
    behaviorCardsContainer: document.getElementById('behaviorCardsContainer'),
    antecedentTagsContainer: document.getElementById('antecedentTagsContainer'),
    consequenceTagsContainer: document.getElementById('consequenceTagsContainer'),
    contextNoteInput: document.getElementById('contextNoteInput'),

    // 底部按鈕
    btnResetPeriod: document.getElementById('btnResetPeriod'),
    btnExportDailyWord: document.getElementById('btnExportDailyWord'),
    btnSaveSinglePeriod: document.getElementById('btnSaveSinglePeriod'),
    btnSaveDay: document.getElementById('btnSaveDay'),

    // 統計頁
    analyticsCaseSelect: document.getElementById('analyticsCaseSelect'),
    analyticsRangeSelect: document.getElementById('analyticsRangeSelect'),
    summaryTotalDays: document.getElementById('summaryTotalDays'),
    summaryTotalBehaviors: document.getElementById('summaryTotalBehaviors'),
    summaryTotalPositive: document.getElementById('summaryTotalPositive'),
    summaryTopPeriod: document.getElementById('summaryTopPeriod'),
    adhdInattentionCount: document.getElementById('adhdInattentionCount'),
    adhdHyperactivityCount: document.getElementById('adhdHyperactivityCount'),
    adhdImpulsivityCount: document.getElementById('adhdImpulsivityCount'),
    insightTextBox: document.getElementById('insightTextBox'),
    heatmapContainer: document.getElementById('heatmapContainer'),
    btnExportWeeklyWord: document.getElementById('btnExportWeeklyWord'),

    // 歷史紀錄
    historyTableBody: document.getElementById('historyTableBody'),
    btnSyncAll: document.getElementById('btnSyncAll'),

    // 設定頁
    apiUrlInput: document.getElementById('apiUrlInput'),
    btnSaveApiUrl: document.getElementById('btnSaveApiUrl'),
    btnTestApi: document.getElementById('btnTestApi'),
    apiTestResult: document.getElementById('apiTestResult'),
    btnCopyBackendCode: document.getElementById('btnCopyBackendCode'),
    backendCodeTextarea: document.getElementById('backendCodeTextarea'),

    // 個案管理彈窗
    caseManagerModal: document.getElementById('caseManagerModal'),
    btnCloseCaseModal: document.getElementById('btnCloseCaseModal'),
    btnModalClose: document.getElementById('btnModalClose'),
    btnModalAddNewCase: document.getElementById('btnModalAddNewCase'),
    caseModalList: document.getElementById('caseModalList'),

    // 系統版本與更新紀錄彈窗
    changelogModal: document.getElementById('changelogModal'),
    btnCloseChangelogModal: document.getElementById('btnCloseChangelogModal'),
    btnModalCloseChangelog: document.getElementById('btnModalCloseChangelog'),
    btnOpenChangelog: document.getElementById('btnOpenChangelog'),
    btnVersionBadge: document.getElementById('btnVersionBadge'),
    btnOpenChangelogModalFromSettings: document.getElementById('btnOpenChangelogModalFromSettings'),
    btnFooterChangelog: document.getElementById('btnFooterChangelog'),
    btnFooterSecurity: document.getElementById('btnFooterSecurity'),
    changelogNewDot: document.getElementById('changelogNewDot')
  };

  // ===================== 更新紀錄彈窗 (Changelog) =====================
  function openChangelogModal() {
    if (dom.changelogModal) {
      dom.changelogModal.classList.remove('hidden');
      localStorage.setItem('bos_viewed_v2_5', 'true');
      if (dom.changelogNewDot) {
        dom.changelogNewDot.classList.add('hidden');
      }
    }
  }

  function closeChangelogModal() {
    if (dom.changelogModal) {
      dom.changelogModal.classList.add('hidden');
    }
  }

  // ===================== 初始化 =====================
  function init() {
    renderCaseOptions();
    dom.dateInput.value = currentDate;

    // 老師稱謂初始化
    const savedRole = window.GoogleSync.getObserverRole();
    if (['導師', '英文科任', '自然科任', '體育科任', '音樂科任', '特教/資源班'].includes(savedRole)) {
      dom.observerRoleSelect.value = savedRole;
    } else {
      dom.observerRoleSelect.value = '自訂';
      dom.customObserverInput.classList.remove('hidden');
      dom.customObserverInput.value = savedRole;
    }

    // 自動匹配當前節次
    const currentSched = getCurrentScheduleInfo();
    currentPeriodIndex = currentSched.index;

    renderPeriodTabs();
    renderBehaviorCards();
    renderAbcTags();

    loadExistingRecordForDate(currentCaseId, currentDate);
    bindEvents();
    updateSyncStatusBadge();
    startScheduleTimer();

    // 載入設定頁中的後端程式碼預覽
    loadBackendCodeToPreview();

    // 初始化進階臨床量化模式 (ClassroomBehaviorRecord Schema & 疾病鑑別映射)
    initAdvancedMode();

    // 初始化設計者隱藏彩蛋 (Console 簽名 + 左上角 B 連點 5 下 + Konami Code)
    initCreatorEasterEgg();

    // 更新紀錄小紅點提示
    if (localStorage.getItem('bos_viewed_v3_0') && dom.changelogNewDot) {
      dom.changelogNewDot.classList.add('hidden');
    }
  }

  function getActiveObserver() {
    if (dom.observerRoleSelect.value === '自訂') {
      return dom.customObserverInput.value.trim() || '課堂教師';
    }
    return dom.observerRoleSelect.value;
  }

  function createEmptyDayRecord(caseId, date) {
    return {
      caseId: caseId,
      date: date,
      medTime: '',
      discomfort: '',
      periods: SCHEDULE.map(s => ({
        name: s.name,
        observer: '',
        subject: '',
        activityType: '',
        intensity: '',
        outcome: '',
        isV: false,
        positiveCount: 0,
        behaviors: BEHAVIORS.map(b => ({ code: b.code, name: b.name, count: 0 })),
        antecedentTags: [],
        consequenceTags: [],
        contextNote: ''
      }))
    };
  }

  // ===================== 課表排程 =====================
  function getCurrentScheduleInfo() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let matchedIndex = 0;
    for (let i = 0; i < SCHEDULE.length; i++) {
      const s = SCHEDULE[i];
      if (currentMinutes >= s.spanMin[0] && currentMinutes <= s.spanMin[1]) {
        matchedIndex = i;
        break;
      }
    }

    const curItem = SCHEDULE[matchedIndex];
    let statusText = '';
    let isClassTime = false;

    if (currentMinutes >= curItem.startMin && currentMinutes <= curItem.endMin) {
      statusText = `上課中：${curItem.name} (${curItem.timeStr})`;
      isClassTime = true;
    } else if (currentMinutes < 8 * 60) {
      statusText = `早自習預備中 (晨間活動 08:00 開始)`;
    } else if (currentMinutes > 15 * 60 + 50) {
      statusText = `已放學 (可進行課後彙整統計)`;
    } else {
      statusText = `下課/轉銜休息中 (所屬：${curItem.name})`;
    }

    return {
      index: matchedIndex,
      schedule: curItem,
      timeString: timeString,
      statusText: statusText,
      isClassTime: isClassTime
    };
  }

  // ===================== 個案選擇與管理 =====================
  function renderCaseOptions() {
    const cases = window.CaseManager.getAllCases();
    dom.caseSelect.innerHTML = '';
    if (dom.analyticsCaseSelect) dom.analyticsCaseSelect.innerHTML = '';

    cases.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `個案代號：${c.id} ${c.localNote ? `(${c.localNote})` : ''}`;
      if (c.id === currentCaseId) opt.selected = true;
      dom.caseSelect.appendChild(opt);

      if (dom.analyticsCaseSelect) {
        const opt2 = opt.cloneNode(true);
        dom.analyticsCaseSelect.appendChild(opt2);
      }
    });
  }

  function handleCreateNewCase() {
    const newCase = window.CaseManager.createCase();
    currentCaseId = newCase.id;
    renderCaseOptions();
    loadExistingRecordForDate(currentCaseId, dom.dateInput.value);
    showToast(`已生成新個案匿名代號：【${newCase.id}】`, 'success');
  }

  // ===================== 個案管理彈窗 (Modal) =====================
  function openCaseManagerModal() {
    renderCaseModalList();
    dom.caseManagerModal.classList.remove('hidden');
  }

  function closeCaseManagerModal() {
    dom.caseManagerModal.classList.add('hidden');
    renderCaseOptions();
  }

  function renderCaseModalList() {
    const cases = window.CaseManager.getAllCases();
    dom.caseModalList.innerHTML = '';

    if (cases.length === 0) {
      dom.caseModalList.innerHTML = '<p class="text-xs text-slate-500 text-center py-4">目前尚無任何個案</p>';
      return;
    }

    cases.forEach(c => {
      const stats = window.CaseManager.getCaseStats(c.id);
      const isCurrent = (c.id === currentCaseId);

      const div = document.createElement('div');
      div.className = `p-3 rounded-xl border transition-all ${
        isCurrent ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-slate-200'
      } flex items-center justify-between gap-3`;

      div.innerHTML = `
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-black text-blue-700 font-mono tracking-wider">${c.id}</span>
            ${isCurrent ? '<span class="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-md">作用中</span>' : ''}
          </div>
          <div class="flex items-center gap-2 mt-1">
            <input type="text" value="${c.localNote || ''}" placeholder="點擊填寫本機備忘(如：個案A)" class="note-input text-xs border border-slate-200 rounded-md px-2 py-0.5 w-44 text-slate-700 focus:ring-1 focus:ring-blue-500" data-id="${c.id}">
          </div>
          <p class="text-[10px] text-slate-500 mt-0.5">累計紀錄：${stats.recordDays} 天 ｜ ${stats.totalBehaviors} 次行為</p>
        </div>

        <div class="flex items-center gap-1.5">
          <button type="button" class="btn-select-case px-2.5 py-1 text-xs font-bold rounded-lg ${isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}" data-id="${c.id}">
            ${isCurrent ? '使用中' : '切換'}
          </button>
          <button type="button" class="btn-delete-case p-1 px-2 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors" data-id="${c.id}" title="刪除個案">
            🗑️ 刪除
          </button>
        </div>
      `;

      // 監聽備忘輸入
      const noteInput = div.querySelector('.note-input');
      noteInput.addEventListener('change', (e) => {
        window.CaseManager.updateLocalNote(c.id, e.target.value.trim());
        showToast(`已儲存個案 ${c.id} 之本機備忘`, 'info');
      });

      // 切換個案
      div.querySelector('.btn-select-case').addEventListener('click', () => {
        currentCaseId = c.id;
        window.CaseManager.setActiveCase(currentCaseId);
        loadExistingRecordForDate(currentCaseId, dom.dateInput.value);
        renderCaseModalList();
      });

      // 刪除個案
      div.querySelector('.btn-delete-case').addEventListener('click', () => {
        const confirmDelete = confirm(`⚠️ 警告：確定要刪除個案【${c.id}】嗎？\n\n點選「確定」將自個案清單移除。\n是否同時清除該個案的歷史觀察紀錄？`);
        if (confirmDelete) {
          const deleteRecordsToo = confirm(`是否確定同時【永久清除】個案【${c.id}】在本機的全部歷史紀錄？`);
          window.CaseManager.deleteCase(c.id, deleteRecordsToo);
          currentCaseId = window.CaseManager.getActiveCaseId();
          renderCaseModalList();
          renderCaseOptions();
          loadExistingRecordForDate(currentCaseId, dom.dateInput.value);
          showToast(`已刪除個案【${c.id}】`, 'warning');
        }
      });

      dom.caseModalList.appendChild(div);
    });
  }

  // ===================== 載入與更新既有紀錄 =====================
  function loadExistingRecordForDate(caseId, date) {
    const existing = window.GoogleSync.getRecord(caseId, date);
    if (existing) {
      dayRecord = JSON.parse(JSON.stringify(existing));
      isEditMode = true;
      dom.editModeBadge.classList.remove('hidden');
      dom.editModeBadge.textContent = '✏️ 編輯既有紀錄模式';
    } else {
      dayRecord = createEmptyDayRecord(caseId, date);
      isEditMode = false;
      dom.editModeBadge.classList.add('hidden');
    }

    dom.medTimeInput.value = dayRecord.medTime || '';
    dom.discomfortInput.value = dayRecord.discomfort || '';
    refreshPeriodUI();
  }

  // ===================== 渲染節次 =====================
  function renderPeriodTabs() {
    dom.periodTabsContainer.innerHTML = '';
    const currentSched = getCurrentScheduleInfo();
    const isToday = (dom.dateInput.value === new Date().toISOString().split('T')[0]);

    SCHEDULE.forEach((schedItem, idx) => {
      const isSelected = (idx === currentPeriodIndex);
      const isNowLive = (idx === currentSched.index && isToday);
      const pData = dayRecord.periods ? dayRecord.periods[idx] : null;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `period-tab px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex flex-col items-start gap-0.5 border select-none ${
        isSelected
          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
          : isNowLive
          ? 'bg-emerald-50 text-emerald-950 border-emerald-400 hover:bg-emerald-100 ring-2 ring-emerald-300'
          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
      }`;
      
      const badgeClass = isSelected
        ? 'bg-blue-800 text-white'
        : isNowLive
        ? 'bg-emerald-600 text-white'
        : 'bg-slate-300 text-slate-700';

      const liveIndicator = isNowLive
        ? `<span class="inline-flex items-center gap-1 text-[10px] font-black ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}">
             <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>現在
           </span>`
        : '';

      const observerLabel = (pData && pData.observer)
        ? `<span class="text-[9px] opacity-75 truncate max-w-[80px]">(${pData.observer}${pData.subject ? '·' + pData.subject : ''})</span>`
        : (pData && pData.subject)
        ? `<span class="text-[9px] opacity-75 truncate max-w-[80px]">(${pData.subject})</span>`
        : '';

      btn.innerHTML = `
        <div class="flex items-center justify-between w-full gap-2">
          <span class="text-xs font-black tracking-tight">${schedItem.name} ${observerLabel}</span>
          <div class="flex items-center gap-1">
            ${liveIndicator}
            <span id="tabBadge_${idx}" class="text-[10px] px-1.5 py-0.2 rounded-full font-bold ${badgeClass}">0</span>
          </div>
        </div>
        <span class="text-[10px] font-medium opacity-80">${schedItem.timeStr}</span>
      `;

      btn.addEventListener('click', () => {
        saveCurrentPeriodInputs();
        currentPeriodIndex = idx;
        renderPeriodTabs();
        refreshPeriodUI();
      });

      dom.periodTabsContainer.appendChild(btn);
    });
  }

  function renderBehaviorCards() {
    dom.behaviorCardsContainer.innerHTML = '';
    BEHAVIORS.forEach(b => {
      const card = document.createElement('div');
      card.className = 'behavior-card relative bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-4 shadow-xs transition-all select-none cursor-pointer flex flex-col justify-between overflow-hidden group';
      
      card.innerHTML = `
        <!-- 右側空白處大圖示 (GIF微動畫：生動輔助快速辨識) -->
        <div class="absolute right-4 bottom-11 text-6xl opacity-25 pointer-events-none select-none transition-transform group-hover:scale-105 watermark-anim ${b.animClass}">
          ${b.icon}
        </div>

        <div>
          <!-- 上方：代號 + 次數 (依使用者需求已移除重複的小圖示，保留右側空白處動態圖示) -->
          <div class="flex items-center justify-between mb-2.5 relative z-10">
            <span class="inline-flex items-center justify-center w-11 h-11 rounded-2xl text-2xl font-black ${b.badgeColor} text-white shadow-xs">
              ${b.code}
            </span>
            <div class="flex items-center gap-1.5 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <span id="countDisplay_${b.code}" class="text-3xl font-black text-slate-900 tracking-tight transition-transform tabular-numbers">0</span>
              <span class="text-xs text-slate-500 font-bold">次</span>
            </div>
          </div>

          <!-- 中間文字區域 (點擊此處任何空白均立即 +1) -->
          <div class="relative z-10 pr-10">
            <h3 class="font-black text-slate-900 text-sm leading-snug mb-1 flex items-center gap-1.5">
              <span>${b.name}</span>
            </h3>
            <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">${b.desc}</p>
          </div>
        </div>

        <!-- 下方操作區：-1 按鈕 與 快速點擊提示條 (符合 Apple HIG 觸控目標) -->
        <div class="flex items-center gap-2 pt-2.5 border-t border-slate-100 relative z-10">
          <button type="button" class="btn-minus px-3.5 py-2.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1 active:scale-90 touch-target-44" data-code="${b.code}" title="扣除 1 次">
            <span>-1</span>
          </button>
          <div class="flex-1 py-2.5 px-3 bg-blue-50/90 group-hover:bg-[#0071e3] text-[#0071e3] group-hover:text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-blue-200/80 group-hover:border-[#0071e3] shadow-2xs touch-target-44">
            <span>👆 點擊卡片空白處直接 +1</span>
          </div>
        </div>
      `;

      // 點擊卡片任何空白處（除了 -1 按鈕外），均視為加一次
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-minus')) {
          handleBehaviorCountChange(b.code, 1);
        }
      });

      // -1 按鈕
      const minusBtn = card.querySelector('.btn-minus');
      minusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleBehaviorCountChange(b.code, -1);
      });

      dom.behaviorCardsContainer.appendChild(card);
    });
  }

  function renderAbcTags() {
    // 渲染 A 標籤
    dom.antecedentTagsContainer.innerHTML = '';
    ANTECEDENT_TAGS.forEach(tag => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'a-tag-btn px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-blue-50 transition-colors';
      btn.textContent = `+ ${tag}`;
      btn.addEventListener('click', () => toggleAbcTag('antecedentTags', tag));
      dom.antecedentTagsContainer.appendChild(btn);
    });

    // 渲染 C 標籤
    dom.consequenceTagsContainer.innerHTML = '';
    CONSEQUENCE_TAGS.forEach(tag => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'c-tag-btn px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-amber-50 transition-colors';
      btn.textContent = `+ ${tag}`;
      btn.addEventListener('click', () => toggleAbcTag('consequenceTags', tag));
      dom.consequenceTagsContainer.appendChild(btn);
    });
  }

  function toggleAbcTag(field, tag) {
    const period = dayRecord.periods[currentPeriodIndex];
    if (!period[field]) period[field] = [];
    const idx = period[field].indexOf(tag);
    if (idx >= 0) {
      period[field].splice(idx, 1);
    } else {
      period[field].push(tag);
    }
    refreshAbcUI();
  }

  function refreshPeriodUI() {
    const period = dayRecord.periods[currentPeriodIndex];
    const schedItem = SCHEDULE[currentPeriodIndex];

    dom.currentPeriodTitle.innerHTML = `
      <span>${period.name} 行為觀察</span>
      <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
        🕒 ${schedItem.timeStr}（${schedItem.desc}）
      </span>
    `;

    // 顯示記錄老師標籤
    const currentObserver = period.observer || getActiveObserver();
    dom.currentPeriodObserverTag.textContent = `記錄者：${currentObserver}`;

    // 更新各行為計數器數字
    BEHAVIORS.forEach(b => {
      const item = period.behaviors.find(x => x.code === b.code);
      const count = item ? item.count : 0;
      const countElem = document.getElementById(`countDisplay_${b.code}`);
      if (countElem) countElem.textContent = count;
    });

    // 更新正向行為按鈕與徽章
    const posCount = period.positiveCount || 0;
    dom.positiveCountBadge.textContent = `${posCount} 次`;

    // 更新 V 狀態
    if (period.isV) {
      dom.btnMarkV.classList.add('bg-emerald-600', 'text-white');
      dom.btnMarkV.classList.remove('bg-white', 'text-slate-700');
      dom.btnMarkV.textContent = '✓ 本節已標記為無干擾紀錄 (V)';
    } else {
      dom.btnMarkV.classList.remove('bg-emerald-600', 'text-white');
      dom.btnMarkV.classList.add('bg-white', 'text-slate-700');
      dom.btnMarkV.textContent = '標記本節為：V 常態穩定';
    }

    refreshAbcUI();
    updateTabBadges();
  }

  function refreshAbcUI() {
    const period = dayRecord.periods[currentPeriodIndex];
    dom.contextNoteInput.value = period.contextNote || '';

    // 同步基礎模式當下快選（📚 課堂科目、🎯 活動型態）與課後選填欄位（⚡ 強度、🎯 成效）
    const basicSubj = document.getElementById('basicSubjectSelect');
    const basicAct = document.getElementById('basicActivitySelect');
    const basicInt = document.getElementById('basicIntensitySelect');
    const basicOut = document.getElementById('basicOutcomeSelect');
    if (basicSubj) basicSubj.value = period.subject || '';
    if (basicAct) basicAct.value = period.activityType || '';
    if (basicInt) basicInt.value = period.intensity ? String(period.intensity) : '';
    if (basicOut) basicOut.value = period.outcome || '';

    // 更新課後補充抽屜狀態徽章（沒紀錄也完全沒問題）
    const postBadge = document.getElementById('basicPostClassStatusBadge');
    if (postBadge) {
      const hasPostData =
        (period.antecedentTags && period.antecedentTags.length > 0) ||
        (period.consequenceTags && period.consequenceTags.length > 0) ||
        Boolean(period.intensity) ||
        Boolean(period.outcome) ||
        Boolean(period.contextNote && period.contextNote.trim());
      if (hasPostData) {
        postBadge.textContent = '✅ 已補充課後脈絡';
        postBadge.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
      } else {
        postBadge.textContent = '選填 · 尚未補充';
        postBadge.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-200/80 text-slate-600';
      }
    }

    // 更新 A 標籤選取外觀
    const aButtons = dom.antecedentTagsContainer.querySelectorAll('.a-tag-btn');
    aButtons.forEach(btn => {
      const tagText = btn.textContent.replace('+ ', '').replace('✓ ', '');
      if (period.antecedentTags && period.antecedentTags.includes(tagText)) {
        btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
        btn.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-200');
        btn.textContent = `✓ ${tagText}`;
      } else {
        btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
        btn.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-200');
        btn.textContent = `+ ${tagText}`;
      }
    });

    // 更新 C 標籤選取外觀
    const cButtons = dom.consequenceTagsContainer.querySelectorAll('.c-tag-btn');
    cButtons.forEach(btn => {
      const tagText = btn.textContent.replace('+ ', '').replace('✓ ', '');
      if (period.consequenceTags && period.consequenceTags.includes(tagText)) {
        btn.classList.add('bg-amber-600', 'text-white', 'border-amber-600');
        btn.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-200');
        btn.textContent = `✓ ${tagText}`;
      } else {
        btn.classList.remove('bg-amber-600', 'text-white', 'border-amber-600');
        btn.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-200');
        btn.textContent = `+ ${tagText}`;
      }
    });
  }

  function handleBehaviorCountChange(code, delta) {
    const period = dayRecord.periods[currentPeriodIndex];
    let item = period.behaviors.find(x => x.code === code);
    if (!item) {
      const bObj = BEHAVIORS.find(x => x.code === code);
      item = { code: code, name: bObj.name, count: 0 };
      period.behaviors.push(item);
    }

    item.count = Math.max(0, item.count + delta);
    if (item.count > 0 && period.isV) {
      period.isV = false;
    }
    period.observer = getActiveObserver();
    refreshPeriodUI();

    // 觸發數字跳動動畫
    const countElem = document.getElementById(`countDisplay_${code}`);
    if (countElem) {
      countElem.classList.remove('number-pop');
      void countElem.offsetWidth; // 強制重繪
      countElem.classList.add('number-pop');
    }
  }

  function saveCurrentPeriodInputs() {
    const period = dayRecord.periods[currentPeriodIndex];
    period.contextNote = dom.contextNoteInput.value.trim();
    const basicSubj = document.getElementById('basicSubjectSelect');
    const basicAct = document.getElementById('basicActivitySelect');
    const basicInt = document.getElementById('basicIntensitySelect');
    const basicOut = document.getElementById('basicOutcomeSelect');
    if (basicSubj) period.subject = basicSubj.value;
    if (basicAct) period.activityType = basicAct.value;
    if (basicInt) period.intensity = basicInt.value ? Number(basicInt.value) : '';
    if (basicOut) period.outcome = basicOut.value;
    period.observer = getActiveObserver();
    dayRecord.medTime = dom.medTimeInput.value.trim();
    dayRecord.discomfort = dom.discomfortInput.value.trim();
  }

  function updateTabBadges() {
    dayRecord.periods.forEach((p, idx) => {
      const badge = document.getElementById(`tabBadge_${idx}`);
      if (badge) {
        const total = p.behaviors.reduce((acc, cur) => acc + (cur.count || 0), 0);
        badge.textContent = p.isV ? 'V' : (total + (p.positiveCount > 0 ? `+${p.positiveCount}` : ''));
        if (total > 0) {
          badge.className = 'text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold';
        }
      }
    });
  }

  // ===================== 多師協同：單節儲存與全日儲存 =====================
  async function handleSaveSinglePeriod() {
    saveCurrentPeriodInputs();
    const period = dayRecord.periods[currentPeriodIndex];
    period.observer = getActiveObserver();

    window.GoogleSync.saveLocalRecord(dayRecord);
    showToast(`正在上傳【${period.name}】(${period.observer}) 紀錄至 Google 試算表...`, 'info');

    const res = await window.GoogleSync.syncSinglePeriodToGoogle(
      currentCaseId,
      dom.dateInput.value,
      period,
      dom.medTimeInput.value,
      dom.discomfortInput.value
    );

    if (res.success) {
      showToast(`🎉 【${period.name}】已成功獨立同步至雲端，不覆蓋其他科任老師紀錄！`, 'success');
      renderPeriodTabs();
    } else {
      showToast(`本機已暫存，但雲端同步失敗 (${res.error || '離線'})`, 'warning');
    }
    updateSyncStatusBadge();
  }

  async function handleSaveCompleteDay() {
    saveCurrentPeriodInputs();
    dayRecord.caseId = currentCaseId;
    dayRecord.date = dom.dateInput.value;
    dayRecord.medTime = dom.medTimeInput.value;
    dayRecord.discomfort = dom.discomfortInput.value;

    window.GoogleSync.saveLocalRecord(dayRecord);
    showToast('已儲存全天紀錄至本機！正在同步至雲端...', 'info');

    const syncRes = await window.GoogleSync.syncRecordToGoogle(dayRecord);
    if (syncRes.success) {
      showToast('🎉 全日紀錄已成功合併更新至 Google 試算表！', 'success');
      dom.editModeBadge.textContent = '☁️ 雲端與本地已同步';
    } else {
      showToast(`⚠️ 本機已儲存，但雲端同步失敗 (${syncRes.reason || '離線'})`, 'warning');
    }

    updateSyncStatusBadge();
    renderHistoryTable();
  }

  async function handleFetchCloud() {
    showToast('正在向 Google 試算表拉取最新全校/科任整合資料...', 'info');
    const res = await window.GoogleSync.fetchCloudRecord(currentCaseId, dom.dateInput.value);
    if (res.success && res.record) {
      dayRecord = JSON.parse(JSON.stringify(res.record));
      refreshPeriodUI();
      renderPeriodTabs();
      showToast('🎉 已成功載入雲端跨科任最新同步資料！', 'success');
    } else {
      showToast(res.reason || '雲端尚無此日資料', 'info');
    }
  }

  // ===================== 統計與分析面板 =====================
  let barChartInstance = null;
  let periodChartInstance = null;

  function loadAnalytics() {
    const caseId = dom.analyticsCaseSelect.value || currentCaseId;
    const range = dom.analyticsRangeSelect.value;
    const allRecords = window.GoogleSync.getAllLocalRecords();

    const filtered = window.Analytics.filterRecords(allRecords, caseId, range);
    const summary = window.Analytics.computeSummary(filtered);

    dom.summaryTotalDays.textContent = summary.totalDays;
    dom.summaryTotalBehaviors.textContent = summary.totalBehaviors;
    dom.summaryTotalPositive.textContent = `${summary.totalPositive} 次`;
    dom.summaryTopPeriod.textContent = summary.topPeriod ? `${summary.topPeriod.period} (${summary.topPeriod.count}次)` : '無';

    // ADHD 三大維度數值
    dom.adhdInattentionCount.textContent = `${summary.adhdCategories.inattention} 次`;
    dom.adhdHyperactivityCount.textContent = `${summary.adhdCategories.hyperactivity} 次`;
    dom.adhdImpulsivityCount.textContent = `${summary.adhdCategories.impulsivity} 次`;

    dom.insightTextBox.innerHTML = `<p class="leading-relaxed font-medium text-blue-950">${summary.insightText}</p>`;

    renderHeatmap(summary);
    renderCharts(summary);
  }

  function renderHeatmap(summary) {
    const columns = [
      { code: '○', label: '玩文具雜物', icon: '✏️' },
      { code: '+', label: '放空/拖延', icon: '💭' },
      { code: '↑', label: '尋找遺失物', icon: '🔍' },
      { code: '～', label: '扭動身體', icon: '🦵' },
      { code: '△', label: '擅自離座', icon: '🏃' },
      { code: '×', label: '干擾他人', icon: '🗣️' },
      { code: '！', label: '未舉手搶話', icon: '📢' },
      { code: '＃', label: '情緒抗拒/拒寫', icon: '💢' },
      { code: '⚡', label: '怪聲/抽動', icon: '⚡' },
      { code: '★', label: '正向好行為', icon: '★' }
    ];

    let html = `
      <table class="w-full text-xs text-center border-collapse">
        <thead>
          <tr class="bg-slate-100 text-slate-800">
            <th class="p-2.5 border border-slate-200 font-bold whitespace-nowrap">時段</th>
            ${columns.map(c => `
              <th class="p-2.5 border border-slate-200 font-black whitespace-nowrap ${c.code === '★' ? 'text-amber-800 bg-amber-50/70' : 'text-slate-800'}">
                <div class="flex items-center justify-center gap-1">
                  <span>${c.icon}</span>
                  <span>${c.label}</span>
                </div>
              </th>
            `).join('')}
            <th class="p-2.5 border border-slate-200 font-black bg-slate-200 whitespace-nowrap">干擾小計</th>
          </tr>
        </thead>
        <tbody>
    `;

    PERIODS.forEach(p => {
      const pTotal = summary.periodTotals[p] || 0;
      let cols = columns.map(col => {
        const c = col.code;
        const val = (summary.heatmap[p] && summary.heatmap[p][c]) || 0;
        let bgClass = 'bg-white';
        let textClass = 'text-slate-400';

        if (c === '★') {
          if (val > 0) {
            bgClass = 'bg-amber-100 text-amber-900 font-bold';
            textClass = 'text-amber-950 font-black';
          }
        } else {
          if (val >= 6) {
            bgClass = 'bg-rose-500 text-white font-extrabold';
            textClass = 'text-white';
          } else if (val >= 3) {
            bgClass = 'bg-amber-300 text-amber-950 font-bold';
            textClass = 'text-amber-950 font-bold';
          } else if (val >= 1) {
            bgClass = 'bg-yellow-100 text-yellow-900 font-semibold';
            textClass = 'text-yellow-900';
          }
        }
        return `<td class="p-2.5 border border-slate-200 ${bgClass}"><span class="${textClass}">${val}</span></td>`;
      }).join('');

      html += `
        <tr>
          <td class="p-2 border border-slate-200 font-semibold bg-slate-50">${p}</td>
          ${cols}
          <td class="p-2 border border-slate-200 font-bold bg-slate-100">${pTotal}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    dom.heatmapContainer.innerHTML = html;
  }

  function renderCharts(summary) {
    if (typeof Chart === 'undefined') return;

    const barCtx = document.getElementById('behaviorRankingChart');
    if (barCtx) {
      if (barChartInstance) barChartInstance.destroy();
      barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: summary.ranking.map(r => `${r.code} ${r.name}`),
          datasets: [{
            label: '次數',
            data: summary.ranking.map(r => r.count),
            backgroundColor: summary.ranking.map(r => r.color),
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }

    const periodCtx = document.getElementById('periodTrendChart');
    if (periodCtx) {
      if (periodChartInstance) periodChartInstance.destroy();
      periodChartInstance = new Chart(periodCtx, {
        type: 'line',
        data: {
          labels: PERIODS,
          datasets: [{
            label: '時段行為總次數',
            data: PERIODS.map(p => summary.periodTotals[p] || 0),
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }
  }

  // ===================== 歷史紀錄 =====================
  function renderHistoryTable() {
    const allRecords = window.GoogleSync.getAllLocalRecords();
    dom.historyTableBody.innerHTML = '';

    if (allRecords.length === 0) {
      dom.historyTableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-500 font-medium">尚無任何歷史觀察紀錄</td></tr>';
      return;
    }

    allRecords.forEach(rec => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';

      let totalCount = 0;
      let totalPos = 0;
      (rec.periods || []).forEach(p => {
        (p.behaviors || []).forEach(b => totalCount += (b.count || 0));
        totalPos += (p.positiveCount || 0);
      });

      const syncStatusTag = rec.pendingSync
        ? '<span class="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 font-semibold">待同步</span>'
        : '<span class="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 font-semibold">已同步</span>';

      tr.innerHTML = `
        <td class="p-3 font-semibold text-slate-800">${rec.date}</td>
        <td class="p-3 font-black text-blue-600 tracking-wider font-mono">${rec.caseId}</td>
        <td class="p-3 text-slate-500">${rec.medTime || '無'}</td>
        <td class="p-3 font-bold text-rose-600">${totalCount} 次</td>
        <td class="p-3 font-bold text-amber-600">${totalPos} 次</td>
        <td class="p-3">${syncStatusTag}</td>
        <td class="p-3">
          <div class="flex items-center gap-1.5">
            <button class="btn-history-load px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors" data-case="${rec.caseId}" data-date="${rec.date}">
              ✏️ 載入
            </button>
            <button class="btn-history-word px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors" data-case="${rec.caseId}" data-date="${rec.date}">
              📄 Word
            </button>
            <button class="btn-history-delete px-1.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition-colors" data-case="${rec.caseId}" data-date="${rec.date}">
              🗑️
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-history-load').addEventListener('click', () => {
        currentCaseId = rec.caseId;
        dom.caseSelect.value = rec.caseId;
        dom.dateInput.value = rec.date;
        loadExistingRecordForDate(rec.caseId, rec.date);
        switchTab('view-record');
        showToast(`已載入 ${rec.date} (${rec.caseId}) 之紀錄`, 'info');
      });

      tr.querySelector('.btn-history-word').addEventListener('click', () => {
        const summary = window.Analytics.computeSummary([rec]);
        window.DocxExport.exportDailyWord(rec, summary);
      });

      tr.querySelector('.btn-history-delete').addEventListener('click', () => {
        if (confirm(`確定要刪除 ${rec.date} (${rec.caseId}) 的這筆紀錄嗎？`)) {
          window.GoogleSync.deleteLocalRecord(rec.caseId, rec.date);
          renderHistoryTable();
          showToast('紀錄已刪除', 'info');
        }
      });

      dom.historyTableBody.appendChild(tr);
    });
  }

  // ===================== 課表排程定時器 =====================
  function startScheduleTimer() {
    function tick() {
      const sched = getCurrentScheduleInfo();
      if (dom.liveClockDisplay) dom.liveClockDisplay.textContent = sched.timeString;
      if (dom.liveScheduleStatus) {
        dom.liveScheduleStatus.textContent = sched.statusText;
        if (sched.isClassTime) {
          dom.liveScheduleStatus.className = 'text-xs font-black text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs';
        } else {
          dom.liveScheduleStatus.className = 'text-xs font-bold text-blue-900 bg-white/90 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs';
        }
      }

      const isToday = (dom.dateInput.value === new Date().toISOString().split('T')[0]);
      if (isToday && dom.autoTimeJumpCheckbox && dom.autoTimeJumpCheckbox.checked) {
        if (currentPeriodIndex !== sched.index) {
          saveCurrentPeriodInputs();
          currentPeriodIndex = sched.index;
          renderPeriodTabs();
          refreshPeriodUI();
          showToast(`⏰ 課表時間進入【${sched.schedule.name}】(${sched.schedule.timeStr})，已自動切換！`, 'info');
        }
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  function updateSyncStatusBadge() {
    const all = window.GoogleSync.getAllLocalRecords();
    const pending = all.filter(r => r.pendingSync).length;
    if (pending > 0) {
      dom.syncBadge.textContent = `待同步: ${pending}`;
      dom.syncBadge.className = 'text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-700';
    } else {
      dom.syncBadge.textContent = '已同步';
      dom.syncBadge.className = 'text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700';
    }
  }

  function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      warning: 'bg-amber-600 text-white',
      info: 'bg-slate-900 text-white'
    };
    toast.className = `fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-xl font-semibold text-xs z-50 transition-all transform duration-300 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.remove('translate-y-2', 'opacity-0'));
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function switchTab(targetId) {
    dom.navTabs.forEach(t => {
      if (t.dataset.target === targetId) {
        t.classList.add('bg-white', 'text-slate-900', 'shadow-xs', 'font-black');
        t.classList.remove('text-slate-600', 'hover:text-slate-900');
      } else {
        t.classList.remove('bg-white', 'text-slate-900', 'shadow-xs', 'font-black');
        t.classList.add('text-slate-600', 'hover:text-slate-900');
      }
    });

    dom.viewSections.forEach(s => {
      if (s.id === targetId) s.classList.remove('hidden');
      else s.classList.add('hidden');
    });

    if (targetId === 'view-analytics') loadAnalytics();
    else if (targetId === 'view-history') renderHistoryTable();
    else if (targetId === 'view-advanced') refreshAdvancedModeUI();
  }

  // ===================== 🔬 進階模式 (ClassroomBehaviorRecord) =====================
  const advState = {
    record_id: '',
    student_id: '',
    timestamp: '',
    schedule_index: 0,
    period: 1,
    period_label: '早自習 (08:00~08:35)',
    subject: '國語',
    activity_type: '全班聽講',
    environment_notes: '',
    antecedent_category: 'NONE_OBSERVED',
    antecedent_details: '無明顯外部前因',
    behavior_cat_filter: 'ALL',
    behavior_category: 'INATTENTION',
    behavior_target_code: 'OFF',
    behavior_target_label: '脫離任務/發呆 (OFF)',
    related_conditions: ['ADHD_INATTENTION', 'ANXIETY_RSD', 'SLD_READING_WRITING'],
    frequency: 1,
    duration_minutes: 0,
    intensity: 1,
    strategy: 'NONE_IGNORE',
    strategy_label: '暫時忽視/未介入',
    outcome: 'IMMEDIATE_IMPROVEMENT',
    outcome_label: '立即改善（重回任務並持續 > 5分鐘）',
    qualitative_notes: '',
    stopwatchRunning: false,
    stopwatchSeconds: 0,
    stopwatchInterval: null
  };

  function mapScheduleIndexToPeriodInt(idx) {
    // 將 0~8 節次索引映射至 Schema 規範之 1~8 節
    const map = [1, 1, 2, 3, 4, 4, 5, 6, 7];
    return map[idx] || 1;
  }

  function mapPeriodIntToScheduleIndex(periodInt) {
    const map = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 7, 7: 8, 8: 8 };
    return map[periodInt] !== undefined ? map[periodInt] : 1;
  }

  function initAdvancedMode() {
    if (!window.ClinicalAdvanced) return;

    advState.student_id = currentCaseId || 'S105';
    advState.record_id = window.ClinicalAdvanced.generateRecordId(currentDate);
    advState.schedule_index = currentPeriodIndex;
    advState.period = mapScheduleIndexToPeriodInt(currentPeriodIndex);
    const curSched = SCHEDULE[currentPeriodIndex] || SCHEDULE[2];
    advState.period_label = `${curSched.name} (${curSched.timeStr})`;

    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const tsInput = document.getElementById('advTimestampInput');
    if (tsInput) tsInput.value = localIso;

    renderClinicalMappingTables();
    refreshAdvancedModeUI();
    bindAdvancedModeEvents();
  }

  function refreshAdvancedModeUI() {
    if (!window.ClinicalAdvanced) return;

    const recIdInput = document.getElementById('advRecordIdInput');
    const stuIdInput = document.getElementById('advStudentIdInput');
    const envInput = document.getElementById('advEnvNotesInput');
    const freqInput = document.getElementById('advFrequencyInput');
    const durInput = document.getElementById('advDurationInput');
    const qualInput = document.getElementById('advQualitativeNotesInput');
    const studentBadge = document.getElementById('advCurrentStudentBadge');

    if (recIdInput && !recIdInput.value) {
      recIdInput.value = advState.record_id;
    } else if (recIdInput) {
      recIdInput.value = advState.record_id;
    }
    if (stuIdInput) stuIdInput.value = advState.student_id || currentCaseId;
    if (envInput) envInput.value = advState.environment_notes;
    if (freqInput) freqInput.value = advState.frequency;
    if (durInput) durInput.value = advState.duration_minutes;
    if (qualInput) qualInput.value = advState.qualitative_notes;
    if (studentBadge) studentBadge.textContent = `學生代碼：${advState.student_id || currentCaseId}`;

    renderAdvContextPills();
    renderAdvAntecedentPills();
    renderAdvBehaviorSection();
    renderAdvIntensityCards();
    renderAdvInterventionSection();
    updateAdvJsonPreview();
    renderAdvDashboardAndRecords();
  }

  function renderAdvContextPills() {
    const CA = window.ClinicalAdvanced;
    // 比照基礎模式課堂排程：早自習、第一節～第七節、中午（含時間與即時「現在」指示燈）
    const periodContainer = document.getElementById('advPeriodPills');
    if (periodContainer) {
      const currentSched = getCurrentScheduleInfo();
      const isToday = (dom.dateInput.value === new Date().toISOString().split('T')[0]);

      periodContainer.innerHTML = SCHEDULE.map((schedItem, idx) => {
        const isSelected = advState.schedule_index === idx;
        const isNowLive = (idx === currentSched.index && isToday);

        const btnClass = isSelected
          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
          : isNowLive
          ? 'bg-emerald-50 text-emerald-950 border-emerald-400 hover:bg-emerald-100 ring-2 ring-emerald-300'
          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';

        const liveIndicator = isNowLive
          ? `<span class="inline-flex items-center gap-1 text-[10px] font-black ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}">
               <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>現在
             </span>`
          : '';

        return `
          <button type="button" data-sched-idx="${idx}" class="adv-period-btn px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex flex-col items-start gap-0.5 border select-none cursor-pointer ${btnClass}">
            <div class="flex items-center justify-between w-full gap-2">
              <span class="text-xs font-black tracking-tight">${schedItem.name}</span>
              ${liveIndicator}
            </div>
            <span class="text-[10px] font-medium opacity-80">${schedItem.timeStr}</span>
          </button>
        `;
      }).join('');

      periodContainer.querySelectorAll('.adv-period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.schedIdx);
          const schedItem = SCHEDULE[idx] || SCHEDULE[0];
          advState.schedule_index = idx;
          advState.period = mapScheduleIndexToPeriodInt(idx);
          advState.period_label = `${schedItem.name} (${schedItem.timeStr})`;

          // 若基礎模式該節已選科目或活動型態，自動同步帶入
          const basicP = dayRecord && dayRecord.periods ? dayRecord.periods[idx] : null;
          if (basicP && basicP.subject) advState.subject = basicP.subject;
          if (basicP && basicP.activityType) advState.activity_type = basicP.activityType;

          renderAdvContextPills();
          updateAdvJsonPreview();
        });
      });
    }

    // 科目
    const subjContainer = document.getElementById('advSubjectPills');
    if (subjContainer) {
      subjContainer.innerHTML = CA.SUBJECTS.map(s => {
        const active = advState.subject === s;
        return `<button type="button" data-subj="${s}" class="adv-subj-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
          active ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-black' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }">${s}</button>`;
      }).join('');
      subjContainer.querySelectorAll('.adv-subj-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          advState.subject = btn.dataset.subj;
          renderAdvContextPills();
          updateAdvJsonPreview();
        });
      });
    }

    // 教學活動型態
    const actContainer = document.getElementById('advActivityPills');
    if (actContainer) {
      actContainer.innerHTML = CA.ACTIVITY_TYPES.map(a => {
        const active = advState.activity_type === a;
        return `<button type="button" data-act="${a}" class="adv-act-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
          active ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-black' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }">${a}</button>`;
      }).join('');
      actContainer.querySelectorAll('.adv-act-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          advState.activity_type = btn.dataset.act;
          renderAdvContextPills();
          updateAdvJsonPreview();
        });
      });
    }

    // 物理環境預設標籤
    const envPresetContainer = document.getElementById('advEnvPresets');
    if (envPresetContainer) {
      envPresetContainer.innerHTML = CA.ENVIRONMENT_PRESETS.map(p => `
        <button type="button" data-env="${p}" class="adv-env-preset px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer">
          + ${p}
        </button>
      `).join('');
      envPresetContainer.querySelectorAll('.adv-env-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          advState.environment_notes = btn.dataset.env;
          const envInput = document.getElementById('advEnvNotesInput');
          if (envInput) envInput.value = advState.environment_notes;
          updateAdvJsonPreview();
        });
      });
    }
  }

  function renderAdvAntecedentPills() {
    const CA = window.ClinicalAdvanced;
    const catContainer = document.getElementById('advAntecedentCatPills');
    if (catContainer) {
      catContainer.innerHTML = CA.ANTECEDENT_CATEGORIES.map(c => {
        const active = advState.antecedent_category === c.code;
        return `
          <button type="button" data-cat="${c.code}" class="adv-ant-cat-btn p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
            active ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-slate-50 hover:bg-amber-50/50 text-slate-800 border-slate-200'
          }">
            <div class="font-mono text-[10px] ${active ? 'text-amber-100' : 'text-slate-500'} font-bold">${c.code}</div>
            <div class="text-xs font-black mt-0.5">${c.name}</div>
          </button>
        `;
      }).join('');

      catContainer.querySelectorAll('.adv-ant-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          advState.antecedent_category = btn.dataset.cat;
          const catMeta = CA.getAntecedentCategory(advState.antecedent_category);
          if (catMeta && catMeta.defaultDetails && catMeta.defaultDetails.length > 0) {
            advState.antecedent_details = catMeta.defaultDetails[0];
          }
          syncAutoRelatedConditions();
          renderAdvAntecedentPills();
          renderAdvBehaviorSection();
          updateAdvJsonPreview();
        });
      });
    }

    const detailContainer = document.getElementById('advAntecedentDetailPills');
    if (detailContainer) {
      detailContainer.innerHTML = CA.ANTECEDENT_DETAILS_ENUM.map(item => {
        const active = advState.antecedent_details === item.detail;
        const catMeta = CA.getAntecedentCategory(item.category);
        return `
          <button type="button" data-detail="${item.detail}" data-cat="${item.category}" class="adv-ant-det-btn px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            active ? 'bg-amber-600 text-white border-amber-700 font-black shadow-xs' : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-300'
          }">
            <span class="text-[10px] px-1.5 py-0.2 rounded font-black ${active ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-900'}">${catMeta ? catMeta.name : item.category}</span>
            <span>${item.detail}</span>
          </button>
        `;
      }).join('');

      detailContainer.querySelectorAll('.adv-ant-det-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          advState.antecedent_details = btn.dataset.detail;
          advState.antecedent_category = btn.dataset.cat;
          syncAutoRelatedConditions();
          renderAdvAntecedentPills();
          renderAdvBehaviorSection();
          updateAdvJsonPreview();
        });
      });
    }

    // 更新誘發因子疾病機制提示
    const mechText = document.getElementById('advAntecedentMechanismText');
    if (mechText) {
      const catMeta = CA.getAntecedentCategory(advState.antecedent_category);
      mechText.innerHTML = `
        <b>誘發分類【${catMeta.name} (${catMeta.code})】</b> ➔ 最可能關聯的疾病機制：<b class="text-rose-700 underline">${catMeta.mechanism}</b>
        <span class="block text-[11px] text-amber-800 mt-0.5">常見觸發情境範例：${catMeta.examples}</span>
      `;
    }
  }

  function syncAutoRelatedConditions() {
    const CA = window.ClinicalAdvanced;
    const behMeta = CA.getBehaviorByCode(advState.behavior_target_code);
    const detItem = CA.ANTECEDENT_DETAILS_ENUM.find(d => d.detail === advState.antecedent_details);
    const set = new Set(behMeta ? behMeta.relatedConditions : []);
    if (detItem && detItem.extraCondition) {
      set.add(detItem.extraCondition);
    }
    advState.related_conditions = Array.from(set);
  }

  function renderAdvBehaviorSection() {
    const CA = window.ClinicalAdvanced;

    // 1. 向度篩選 Tabs
    const catTabs = document.getElementById('advBehaviorCategoryTabs');
    if (catTabs) {
      const allTabs = [{ code: 'ALL', name: '全部向度 (17項)', icon: '📋' }, ...CA.BEHAVIOR_CATEGORIES];
      catTabs.innerHTML = allTabs.map(c => {
        const active = advState.behavior_cat_filter === c.code;
        return `
          <button type="button" data-bcat="${c.code}" class="adv-bcat-tab px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            active ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }">
            <span>${c.icon}</span> <span>${c.name}</span>
          </button>
        `;
      }).join('');

      catTabs.querySelectorAll('.adv-bcat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          advState.behavior_cat_filter = btn.dataset.bcat;
          renderAdvBehaviorSection();
        });
      });
    }

    // 2. 17 項具體行為代碼卡片
    const grid = document.getElementById('advBehaviorTargetGrid');
    if (grid) {
      const filteredTargets = advState.behavior_cat_filter === 'ALL'
        ? CA.BEHAVIOR_TARGETS
        : CA.BEHAVIOR_TARGETS.filter(b => b.category === advState.behavior_cat_filter);

      grid.innerHTML = filteredTargets.map(b => {
        const active = advState.behavior_target_code === b.code;
        return `
          <div data-code="${b.code}" class="adv-beh-card p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            active ? 'border-indigo-600 bg-indigo-50/70 shadow-xs' : 'border-slate-200 bg-white hover:border-indigo-300'
          }">
            <div class="flex items-center justify-between gap-2">
              <span class="font-black text-xs ${active ? 'text-indigo-950' : 'text-slate-900'}">${b.label}</span>
              <span class="px-2 py-0.5 rounded-md font-mono text-[11px] font-black ${
                active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
              }">${b.code}</span>
            </div>
            <div class="mt-1.5 text-[11px] text-slate-600 flex items-center justify-between">
              <span class="truncate">首要指向：<b class="text-indigo-800">${b.primary}</b></span>
              <span class="text-[10px] text-slate-400 font-mono ml-1">對應基礎: ${b.basicCodeMap}</span>
            </div>
          </div>
        `;
      }).join('');

      grid.querySelectorAll('.adv-beh-card').forEach(card => {
        card.addEventListener('click', () => {
          const meta = CA.getBehaviorByCode(card.dataset.code);
          advState.behavior_target_code = meta.code;
          advState.behavior_target_label = meta.label;
          advState.behavior_category = meta.category;
          syncAutoRelatedConditions();
          renderAdvBehaviorSection();
          updateAdvJsonPreview();
        });
      });
    }

    // 3. 更新右側即時臨床鑑別診斷提示卡
    const activeMeta = CA.getBehaviorByCode(advState.behavior_target_code);
    const codeBadge = document.getElementById('advDiagCodeBadge');
    const primaryEl = document.getElementById('advDiagPrimary');
    const diffEl = document.getElementById('advDiagDifferential');
    const keyEl = document.getElementById('advDiagClinicalKey');

    if (codeBadge) codeBadge.textContent = `${activeMeta.code} (${activeMeta.category})`;
    if (primaryEl) primaryEl.textContent = activeMeta.primary;
    if (diffEl) diffEl.textContent = activeMeta.differential;
    if (keyEl) keyEl.textContent = activeMeta.clinicalKey;

    // 4. 擴充 Schema 屬性 related_conditions 標籤選擇器
    const relContainer = document.getElementById('advRelatedConditionsPills');
    if (relContainer) {
      relContainer.innerHTML = Object.values(CA.RELATED_CONDITIONS_META).map(cond => {
        const checked = advState.related_conditions.includes(cond.code);
        return `
          <button type="button" data-cond="${cond.code}" class="adv-rel-cond-btn px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
            checked ? cond.badgeClass + ' font-black ring-2 ring-offset-1 ring-indigo-400' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
          }">
            ${checked ? '✓ ' : '+ '}${cond.label} (${cond.code})
          </button>
        `;
      }).join('');

      relContainer.querySelectorAll('.adv-rel-cond-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const c = btn.dataset.cond;
          if (advState.related_conditions.includes(c)) {
            advState.related_conditions = advState.related_conditions.filter(x => x !== c);
          } else {
            advState.related_conditions.push(c);
          }
          renderAdvBehaviorSection();
          updateAdvJsonPreview();
        });
      });
    }
  }

  function renderAdvIntensityCards() {
    const CA = window.ClinicalAdvanced;
    const container = document.getElementById('advIntensityCards');
    if (!container) return;

    container.innerHTML = CA.INTENSITY_LEVELS.map(lv => {
      const active = advState.intensity === lv.value;
      return `
        <div data-val="${lv.value}" class="adv-intensity-card p-3 rounded-xl border-2 transition-all cursor-pointer ${
          active ? lv.colorClass + ' border-current shadow-xs ring-2 ring-offset-1 ring-blue-400' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
        }">
          <div class="font-black text-xs">${lv.label}</div>
          <div class="text-[11px] opacity-80 mt-1">${lv.desc}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.adv-intensity-card').forEach(card => {
      card.addEventListener('click', () => {
        advState.intensity = Number(card.dataset.val);
        renderAdvIntensityCards();
        updateAdvJsonPreview();
      });
    });
  }

  function renderAdvInterventionSection() {
    const CA = window.ClinicalAdvanced;
    const stratContainer = document.getElementById('advStrategyPills');
    if (stratContainer) {
      stratContainer.innerHTML = CA.INTERVENTION_STRATEGIES.map(s => {
        const active = advState.strategy === s.code;
        return `
          <button type="button" data-code="${s.code}" data-label="${s.label}" class="adv-strat-btn px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            active ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs' : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-300'
          }">
            ${s.label}
          </button>
        `;
      }).join('');

      stratContainer.querySelectorAll('.adv-strat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          advState.strategy = btn.dataset.code;
          advState.strategy_label = btn.dataset.label;
          renderAdvInterventionSection();
          updateAdvJsonPreview();
        });
      });
    }

    const outContainer = document.getElementById('advOutcomeCards');
    if (outContainer) {
      outContainer.innerHTML = CA.INTERVENTION_OUTCOMES.map(o => {
        const active = advState.outcome === o.code;
        return `
          <button type="button" data-code="${o.code}" data-label="${o.label}" class="adv-outcome-btn p-2.5 rounded-xl text-left border-2 transition-all cursor-pointer ${
            active ? o.badgeClass + ' font-black ring-2 ring-offset-1 ring-emerald-500' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }">
            <div class="font-mono text-[10px] opacity-75">${o.code}</div>
            <div class="text-xs font-bold mt-0.5">${o.label}</div>
          </button>
        `;
      }).join('');

      outContainer.querySelectorAll('.adv-outcome-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          advState.outcome = btn.dataset.code;
          advState.outcome_label = btn.dataset.label;
          renderAdvInterventionSection();
          updateAdvJsonPreview();
        });
      });
    }
  }

  function buildCurrentAdvRecordObject() {
    const recIdInput = document.getElementById('advRecordIdInput');
    const stuIdInput = document.getElementById('advStudentIdInput');
    const tsInput = document.getElementById('advTimestampInput');
    const envInput = document.getElementById('advEnvNotesInput');
    const freqInput = document.getElementById('advFrequencyInput');
    const durInput = document.getElementById('advDurationInput');
    const qualInput = document.getElementById('advQualitativeNotesInput');

    const rawTs = tsInput && tsInput.value ? tsInput.value : new Date().toISOString().slice(0, 16);
    const isoTs = rawTs.includes('+08:00') ? rawTs : `${rawTs.length === 16 ? rawTs + ':00' : rawTs}+08:00`;

    return {
      record_id: (recIdInput && recIdInput.value.trim()) || advState.record_id,
      student_id: (stuIdInput && stuIdInput.value.trim()) || advState.student_id || currentCaseId,
      timestamp: isoTs,
      context: {
        period: Number(advState.period || 1),
        period_label: advState.period_label || (SCHEDULE[advState.schedule_index || 0] ? `${SCHEDULE[advState.schedule_index || 0].name} (${SCHEDULE[advState.schedule_index || 0].timeStr})` : `第 ${advState.period || 1} 節`),
        subject: advState.subject,
        activity_type: advState.activity_type,
        environment_notes: envInput ? envInput.value.trim() : advState.environment_notes
      },
      antecedent: {
        category: advState.antecedent_category,
        details: advState.antecedent_details
      },
      behavior: {
        category: advState.behavior_category,
        target_code: advState.behavior_target_code,
        target_label: advState.behavior_target_label,
        related_conditions: [...advState.related_conditions]
      },
      metrics: {
        frequency: Number(freqInput ? freqInput.value : advState.frequency),
        duration_minutes: Number(durInput ? durInput.value : advState.duration_minutes),
        intensity: Number(advState.intensity)
      },
      intervention: {
        strategy: advState.strategy,
        strategy_label: advState.strategy_label,
        outcome: advState.outcome,
        outcome_label: advState.outcome_label
      },
      qualitative_notes: qualInput ? qualInput.value.trim() : advState.qualitative_notes
    };
  }

  function updateAdvJsonPreview() {
    if (!window.ClinicalAdvanced) return;
    const rec = buildCurrentAdvRecordObject();
    const validation = window.ClinicalAdvanced.validateRecord(rec);

    const previewBox = document.getElementById('advJsonPreviewBox');
    const badge = document.getElementById('advSchemaValidBadge');

    if (previewBox) {
      previewBox.textContent = JSON.stringify(rec, null, 2);
    }
    if (badge) {
      if (validation.valid) {
        badge.textContent = '✓ Schema 驗證通過';
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
      } else {
        badge.textContent = `⚠ 欄位待修正 (${validation.errors[0]})`;
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40';
      }
    }
  }

  function renderClinicalMappingTables() {
    const CA = window.ClinicalAdvanced;
    if (!CA) return;

    const behTbody = document.getElementById('clinicalBehaviorMappingTableBody');
    if (behTbody) {
      behTbody.innerHTML = CA.BEHAVIOR_TARGETS.map(b => {
        const condPills = (b.relatedConditions || []).map(c => {
          const meta = CA.RELATED_CONDITIONS_META[c];
          return `<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mr-1 mb-1 ${meta ? meta.badgeClass : ''}">${c}</span>`;
        }).join('');
        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="p-2.5 font-mono font-black text-indigo-700">${b.code}</td>
            <td class="p-2.5 font-bold text-slate-900">${b.shortName}</td>
            <td class="p-2.5 font-black text-blue-800">${b.primary}</td>
            <td class="p-2.5 text-slate-700">${b.differential}</td>
            <td class="p-2.5 text-slate-600 leading-relaxed">${b.clinicalKey}</td>
            <td class="p-2.5">${condPills}</td>
          </tr>
        `;
      }).join('');
    }

    const antTbody = document.getElementById('clinicalAntecedentMappingTableBody');
    if (antTbody) {
      antTbody.innerHTML = CA.ANTECEDENT_CATEGORIES.filter(a => a.code !== 'NONE_OBSERVED').map(a => `
        <tr class="border-b border-slate-100 hover:bg-amber-50/40">
          <td class="p-2.5 font-mono font-black text-amber-800"><code>${a.code}</code></td>
          <td class="p-2.5 font-bold text-slate-900">${a.name}</td>
          <td class="p-2.5 text-slate-700">${a.examples}</td>
          <td class="p-2.5 font-black text-rose-800">${a.mechanism}</td>
        </tr>
      `).join('');
    }
  }

  function renderAdvDashboardAndRecords() {
    const CA = window.ClinicalAdvanced;
    if (!CA) return;

    const targetStudent = advState.student_id || currentCaseId;
    let records = CA.getRecordsByFilter(targetStudent, null, 'all');
    // 若該個案尚無進階紀錄，顯示全部進階紀錄供檢視
    if (records.length === 0) {
      records = CA.getAllRecords();
    }

    const analysis = CA.analyzeClinicalRecords(records);

    // 1. 相關疾病標籤分佈
    const condList = document.getElementById('advConditionsSummaryList');
    if (condList) {
      if (analysis.rankedConditions.length === 0) {
        condList.innerHTML = '<p class="text-xs text-slate-400 py-3 text-center">尚無進階紀錄，請於上方選擇課堂行為並點擊「💾 儲存進階臨床紀錄」</p>';
      } else {
        const maxScore = Math.max(...analysis.rankedConditions.map(c => c.weightedScore), 1);
        condList.innerHTML = analysis.rankedConditions.map(c => {
          const pct = Math.min(100, Math.round((c.weightedScore / maxScore) * 100));
          return `
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-800">${c.label} <code class="text-[10px] text-slate-500">(${c.code})</code></span>
                <span class="font-mono font-black text-slate-700">${c.count} 次 · 加權 ${c.weightedScore}</span>
              </div>
              <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" style="width:${pct}%; background-color:${c.barColor}"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 2. 介入策略成效
    const intvList = document.getElementById('advInterventionSummaryList');
    if (intvList) {
      if (analysis.strategyEffectiveness.length === 0) {
        intvList.innerHTML = '<p class="text-xs text-slate-400 py-3 text-center">尚無介入處置數據</p>';
      } else {
        intvList.innerHTML = analysis.strategyEffectiveness.map(s => {
          const rate = s.total > 0 ? Math.round(((s.immediate + s.transient * 0.5) / s.total) * 100) : 0;
          return `
            <div class="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
              <div>
                <div class="font-black text-slate-800">${s.label}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">
                  立即改善: <b class="text-emerald-700">${s.immediate}</b> ｜ 短暫: <b class="text-blue-700">${s.transient}</b> ｜ 無效: ${s.noEffect} ｜ 加劇: <b class="text-rose-600">${s.escalation}</b>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-lg font-black ${rate >= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                有效率 ${rate}%
              </span>
            </div>
          `;
        }).join('');
      }
    }

    // 3. 已存進階事件表格
    const tableContainer = document.getElementById('advRecordsTableContainer');
    if (tableContainer) {
      if (records.length === 0) {
        tableContainer.innerHTML = '<div class="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">目前尚無進階模式事件紀錄。</div>';
      } else {
        const rows = records.map(r => {
          const behMeta = CA.getBehaviorByCode(r.behavior?.target_code);
          const periodDisplay = r.context?.period_label || `第 ${r.context?.period} 節`;
          return `
            <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
              <td class="p-2.5 font-mono font-bold text-slate-800">
                ${r.record_id}<br>
                <span class="text-[11px] text-blue-600 font-black">學生：${r.student_id}</span>
              </td>
              <td class="p-2.5">
                <b>${periodDisplay} · ${r.context?.subject}</b><br>
                <span class="text-[11px] text-slate-500">${r.context?.activity_type}</span>
              </td>
              <td class="p-2.5">
                <span class="font-mono text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">${r.antecedent?.category}</span><br>
                <span class="text-[11px] text-slate-700">${r.antecedent?.details || ''}</span>
              </td>
              <td class="p-2.5">
                <b class="text-indigo-900">${r.behavior?.target_label}</b><br>
                <span class="text-[11px] text-rose-700 font-bold">指向：${behMeta?.primary || ''}</span>
              </td>
              <td class="p-2.5 text-center font-mono">
                ${r.metrics?.frequency}次 / ${r.metrics?.duration_minutes}分<br>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  r.metrics?.intensity === 3 ? 'bg-rose-100 text-rose-800' : r.metrics?.intensity === 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }">強度 ${r.metrics?.intensity}</span>
              </td>
              <td class="p-2.5">
                <b>${r.intervention?.strategy_label}</b><br>
                <span class="text-[11px] text-emerald-700 font-semibold">${r.intervention?.outcome_label}</span>
              </td>
              <td class="p-2.5 text-right space-x-1">
                <button type="button" data-loadid="${r.record_id}" class="btn-adv-load px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold cursor-pointer">載入</button>
                <button type="button" data-delid="${r.record_id}" class="btn-adv-del px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold cursor-pointer">刪除</button>
              </td>
            </tr>
          `;
        }).join('');

        tableContainer.innerHTML = `
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-700 text-[11px] font-black border-b border-slate-200">
                <th class="p-2.5">紀錄編號 / 學生</th>
                <th class="p-2.5">節次與課堂情境</th>
                <th class="p-2.5">誘發前因 (A)</th>
                <th class="p-2.5">外顯行為與臨床指向 (B)</th>
                <th class="p-2.5 text-center">量化指標</th>
                <th class="p-2.5">介入與成效 (C)</th>
                <th class="p-2.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;

        tableContainer.querySelectorAll('.btn-adv-load').forEach(btn => {
          btn.addEventListener('click', () => {
            const target = CA.getAllRecords().find(x => x.record_id === btn.dataset.loadid);
            if (target) populateAdvFormFromRecord(target);
          });
        });

        tableContainer.querySelectorAll('.btn-adv-del').forEach(btn => {
          btn.addEventListener('click', () => {
            if (confirm(`確定要刪除進階紀錄【${btn.dataset.delid}】嗎？`)) {
              CA.deleteRecord(btn.dataset.delid);
              renderAdvDashboardAndRecords();
              showToast('已刪除該筆進階臨床紀錄', 'info');
            }
          });
        });
      }
    }
  }

  function populateAdvFormFromRecord(rec) {
    advState.record_id = rec.record_id;
    advState.student_id = rec.student_id;
    advState.timestamp = rec.timestamp;
    advState.period = rec.context?.period || 1;
    const matchedSchedIdx = SCHEDULE.findIndex(s => rec.context?.period_label && rec.context.period_label.startsWith(s.name));
    advState.schedule_index = matchedSchedIdx >= 0 ? matchedSchedIdx : mapPeriodIntToScheduleIndex(advState.period);
    const schedObj = SCHEDULE[advState.schedule_index] || SCHEDULE[0];
    advState.period_label = rec.context?.period_label || `${schedObj.name} (${schedObj.timeStr})`;
    advState.subject = rec.context?.subject || '國語';
    advState.activity_type = rec.context?.activity_type || '全班聽講';
    advState.environment_notes = rec.context?.environment_notes || '';
    advState.antecedent_category = rec.antecedent?.category || 'NONE_OBSERVED';
    advState.antecedent_details = rec.antecedent?.details || '無明顯外部前因';
    advState.behavior_category = rec.behavior?.category || 'INATTENTION';
    advState.behavior_target_code = rec.behavior?.target_code || 'OFF';
    advState.behavior_target_label = rec.behavior?.target_label || '脫離任務/發呆 (OFF)';
    advState.related_conditions = rec.behavior?.related_conditions
      ? [...rec.behavior.related_conditions]
      : [...(window.ClinicalAdvanced.getBehaviorByCode(advState.behavior_target_code)?.relatedConditions || [])];
    advState.frequency = rec.metrics?.frequency ?? 1;
    advState.duration_minutes = rec.metrics?.duration_minutes ?? 0;
    advState.intensity = rec.metrics?.intensity ?? 1;
    advState.strategy = rec.intervention?.strategy || 'NONE_IGNORE';
    advState.strategy_label = rec.intervention?.strategy_label || '暫時忽視/未介入';
    advState.outcome = rec.intervention?.outcome || 'IMMEDIATE_IMPROVEMENT';
    advState.outcome_label = rec.intervention?.outcome_label || '立即改善（重回任務並持續 > 5分鐘）';
    advState.qualitative_notes = rec.qualitative_notes || '';

    const tsInput = document.getElementById('advTimestampInput');
    if (tsInput && rec.timestamp) {
      tsInput.value = rec.timestamp.slice(0, 16);
    }

    refreshAdvancedModeUI();
  }

  function bindAdvancedModeEvents() {
    const CA = window.ClinicalAdvanced;
    if (!CA) return;

    // 雙模式切換按鈕
    const btnToAdv = document.getElementById('btnSwitchToAdvancedMode');
    if (btnToAdv) {
      btnToAdv.addEventListener('click', () => {
        advState.student_id = currentCaseId;
        advState.schedule_index = currentPeriodIndex;
        advState.period = mapScheduleIndexToPeriodInt(currentPeriodIndex);
        const curSched = SCHEDULE[currentPeriodIndex] || SCHEDULE[0];
        advState.period_label = `${curSched.name} (${curSched.timeStr})`;
        const basicP = dayRecord && dayRecord.periods ? dayRecord.periods[currentPeriodIndex] : null;
        if (basicP && basicP.subject) advState.subject = basicP.subject;
        if (basicP && basicP.activityType) advState.activity_type = basicP.activityType;
        switchTab('view-advanced');
      });
    }

    const btnToBasic = document.getElementById('btnSwitchToBasicMode');
    if (btnToBasic) {
      btnToBasic.addEventListener('click', () => switchTab('view-record'));
    }

    // 捲動至臨床映射表
    const btnScrollMap = document.getElementById('btnScrollToMappingTable');
    if (btnScrollMap) {
      btnScrollMap.addEventListener('click', () => {
        const sec = document.getElementById('clinicalMappingReferenceSection');
        if (sec) {
          sec.open = true;
          sec.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // 表單輸入即時連動 JSON 預覽
    ['advRecordIdInput', 'advStudentIdInput', 'advTimestampInput', 'advEnvNotesInput', 'advFrequencyInput', 'advDurationInput', 'advQualitativeNotesInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          if (id === 'advStudentIdInput') advState.student_id = el.value.trim();
          if (id === 'advEnvNotesInput') advState.environment_notes = el.value;
          if (id === 'advFrequencyInput') advState.frequency = Math.max(1, Number(el.value || 1));
          if (id === 'advDurationInput') advState.duration_minutes = Math.max(0, Number(el.value || 0));
          if (id === 'advQualitativeNotesInput') advState.qualitative_notes = el.value;
          updateAdvJsonPreview();
        });
      }
    });

    // 頻率加減
    const btnMinus = document.getElementById('btnAdvFreqMinus');
    const btnPlus = document.getElementById('btnAdvFreqPlus');
    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        advState.frequency = Math.max(1, Number(advState.frequency) - 1);
        document.getElementById('advFrequencyInput').value = advState.frequency;
        updateAdvJsonPreview();
      });
    }
    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        advState.frequency = Number(advState.frequency) + 1;
        document.getElementById('advFrequencyInput').value = advState.frequency;
        updateAdvJsonPreview();
      });
    }

    // 持續時間預設按鈕
    document.querySelectorAll('.adv-dur-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        advState.duration_minutes = Number(btn.dataset.min);
        document.getElementById('advDurationInput').value = advState.duration_minutes;
        updateAdvJsonPreview();
      });
    });

    // 課堂即時碼錶
    const btnStopwatch = document.getElementById('btnAdvStopwatch');
    const stopwatchLabel = document.getElementById('advStopwatchLabel');
    if (btnStopwatch && stopwatchLabel) {
      btnStopwatch.addEventListener('click', () => {
        if (!advState.stopwatchRunning) {
          advState.stopwatchRunning = true;
          advState.stopwatchSeconds = 0;
          btnStopwatch.className = 'px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black transition-all flex items-center gap-1 animate-pulse';
          advState.stopwatchInterval = setInterval(() => {
            advState.stopwatchSeconds += 1;
            const m = Math.floor(advState.stopwatchSeconds / 60);
            const s = String(advState.stopwatchSeconds % 60).padStart(2, '0');
            stopwatchLabel.textContent = `計時中 ${m}:${s} (點擊停止填入)`;
          }, 1000);
        } else {
          advState.stopwatchRunning = false;
          clearInterval(advState.stopwatchInterval);
          const mins = Math.max(0.5, Math.round((advState.stopwatchSeconds / 60) * 10) / 10);
          advState.duration_minutes = mins;
          document.getElementById('advDurationInput').value = mins;
          btnStopwatch.className = 'px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[11px] font-black transition-all flex items-center gap-1';
          stopwatchLabel.textContent = '啟動計時碼錶';
          updateAdvJsonPreview();
          showToast(`⏱️ 碼錶已停止，自動填入持續時間：${mins} 分鐘`, 'info');
        }
      });
    }

    // 複製 JSON
    const btnCopyJson = document.getElementById('btnCopyAdvJson');
    if (btnCopyJson) {
      btnCopyJson.addEventListener('click', () => {
        const rec = buildCurrentAdvRecordObject();
        navigator.clipboard.writeText(JSON.stringify(rec, null, 2));
        showToast('📋 已複製標準 ClassroomBehaviorRecord JSON！', 'success');
      });
    }

    // 儲存進階臨床紀錄
    const btnSaveAdv = document.getElementById('btnSaveAdvRecord');
    if (btnSaveAdv) {
      btnSaveAdv.addEventListener('click', async () => {
        const rec = buildCurrentAdvRecordObject();
        const check = CA.validateRecord(rec);
        if (!check.valid) {
          showToast(`❌ 欄位驗證未通過：${check.errors.join(', ')}`, 'error');
          return;
        }

        CA.saveRecord(rec, getActiveObserver());

        // 若勾選同步累加至基礎速記表
        const syncToBasic = document.getElementById('advSyncToBasicCheckbox');
        if (syncToBasic && syncToBasic.checked) {
          const schedIdx = (advState.schedule_index !== undefined) ? advState.schedule_index : mapPeriodIntToScheduleIndex(rec.context.period);
          const targetPeriod = dayRecord.periods[schedIdx];
          if (targetPeriod) {
            const behMeta = CA.getBehaviorByCode(rec.behavior.target_code);
            const basicCode = behMeta?.basicCodeMap || '+';
            let bItem = targetPeriod.behaviors.find(x => x.code === basicCode);
            if (!bItem) {
              const bObj = BEHAVIORS.find(x => x.code === basicCode);
              bItem = { code: basicCode, name: bObj ? bObj.name : basicCode, count: 0 };
              targetPeriod.behaviors.push(bItem);
            }
            bItem.count += Number(rec.metrics.frequency || 1);
            if (!targetPeriod.subject && rec.context.subject) targetPeriod.subject = rec.context.subject;
            if (!targetPeriod.activityType && rec.context.activity_type) targetPeriod.activityType = rec.context.activity_type;
            const notePiece = `[進階 ${rec.behavior.target_code} ${rec.context.subject}] 前因:${rec.antecedent.details} | 處置:${rec.intervention.strategy_label}(${rec.intervention.outcome_label}) ${rec.qualitative_notes}`;
            targetPeriod.contextNote = targetPeriod.contextNote
              ? `${targetPeriod.contextNote}；${notePiece}`
              : notePiece;
            window.GoogleSync.saveLocalRecord(dayRecord);
            renderPeriodTabs();
            refreshPeriodUI();
          }
        }

        // 同步至雲端 Google Sheets
        const syncRes = await window.GoogleSync.syncAdvancedRecordToGoogle(rec);
        if (syncRes.success) {
          showToast(`🎉 進階紀錄【${rec.record_id}】已儲存並同步至 Google 試算表！`, 'success');
        } else {
          showToast(`💾 進階紀錄【${rec.record_id}】已儲存於本機（可匯出 Word 或 JSON）！`, 'success');
        }

        // 自動產生下一筆流水號
        const recDate = (rec.timestamp || '').split('T')[0] || currentDate;
        advState.record_id = CA.generateRecordId(recDate);
        const recIdInput = document.getElementById('advRecordIdInput');
        if (recIdInput) recIdInput.value = advState.record_id;

        updateAdvJsonPreview();
        renderAdvDashboardAndRecords();
      });
    }

    // 匯出進階臨床 Word 報表
    const btnExportAdvWord = document.getElementById('btnExportAdvWord');
    if (btnExportAdvWord) {
      btnExportAdvWord.addEventListener('click', () => {
        const stuId = advState.student_id || currentCaseId;
        let recs = CA.getRecordsByFilter(stuId, null, 'all');
        if (recs.length === 0) recs = CA.getAllRecords();
        if (recs.length === 0) {
          // 若尚未儲存任何紀錄，直接匯出當前表單預覽中的紀錄
          recs = [buildCurrentAdvRecordObject()];
        }
        window.DocxExport.exportAdvancedClinicalWord(stuId, recs, '進階臨床行為量化與鑑別評估');
      });
    }

    // 匯出標準 JSON
    const btnExportAdvJson = document.getElementById('btnExportAdvJson');
    if (btnExportAdvJson) {
      btnExportAdvJson.addEventListener('click', () => {
        const stuId = advState.student_id || currentCaseId;
        let recs = CA.getRecordsByFilter(stuId, null, 'all');
        if (recs.length === 0) recs = CA.getAllRecords();
        if (recs.length === 0) {
          recs = [buildCurrentAdvRecordObject()];
        }
        window.DocxExport.exportAdvancedJson(stuId, recs);
      });
    }
  }

  // 載入後端程式碼至設定頁預覽
  function loadBackendCodeToPreview() {
    fetch('google-apps-script/Code.gs')
      .then(res => res.text())
      .then(text => {
        if (dom.backendCodeTextarea) dom.backendCodeTextarea.value = text;
      })
      .catch(err => {
        if (dom.backendCodeTextarea) {
          dom.backendCodeTextarea.value = '// 請至專案目錄 google-apps-script/Code.gs 複製完整程式碼';
        }
      });
  }

  // ===================== 事件綁定 =====================
  function bindEvents() {
    dom.navTabs.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.target));
    });

    // 老師稱謂切換
    dom.observerRoleSelect.addEventListener('change', (e) => {
      if (e.target.value === '自訂') {
        dom.customObserverInput.classList.remove('hidden');
        dom.customObserverInput.focus();
      } else {
        dom.customObserverInput.classList.add('hidden');
        window.GoogleSync.setObserverRole(e.target.value);
        showToast(`已設定目前記錄者身分：【${e.target.value}】`, 'info');
      }
      refreshPeriodUI();
    });

    dom.customObserverInput.addEventListener('change', (e) => {
      window.GoogleSync.setObserverRole(e.target.value.trim());
      showToast(`已儲存自訂記錄身分：【${e.target.value}】`, 'info');
      refreshPeriodUI();
    });

    // 個案切換與彈窗
    dom.caseSelect.addEventListener('change', (e) => {
      currentCaseId = e.target.value;
      window.CaseManager.setActiveCase(currentCaseId);
      loadExistingRecordForDate(currentCaseId, dom.dateInput.value);
    });

    dom.btnNewCase.addEventListener('click', handleCreateNewCase);
    dom.btnManageCases.addEventListener('click', openCaseManagerModal);
    dom.btnCloseCaseModal.addEventListener('click', closeCaseManagerModal);
    dom.btnModalClose.addEventListener('click', closeCaseManagerModal);
    dom.btnModalAddNewCase.addEventListener('click', handleCreateNewCase);

    // 系統版本更新紀錄彈窗事件
    if (dom.btnOpenChangelog) dom.btnOpenChangelog.addEventListener('click', openChangelogModal);
    if (dom.btnVersionBadge) dom.btnVersionBadge.addEventListener('click', openChangelogModal);
    if (dom.btnOpenChangelogModalFromSettings) dom.btnOpenChangelogModalFromSettings.addEventListener('click', openChangelogModal);
    if (dom.btnFooterChangelog) dom.btnFooterChangelog.addEventListener('click', openChangelogModal);
    if (dom.btnCloseChangelogModal) dom.btnCloseChangelogModal.addEventListener('click', closeChangelogModal);
    if (dom.btnModalCloseChangelog) dom.btnModalCloseChangelog.addEventListener('click', closeChangelogModal);

    // 點擊彈窗外陰影關閉
    if (dom.changelogModal) {
      dom.changelogModal.addEventListener('click', (e) => {
        if (e.target === dom.changelogModal) closeChangelogModal();
      });
    }

    // 頁尾資安標籤點擊：快速切換至設定頁查看資安詳情
    if (dom.btnFooterSecurity) {
      dom.btnFooterSecurity.addEventListener('click', () => {
        switchTab('view-settings');
        showToast('🛡️ BOS 系統已通過全項特教個資去識別化與資安防護稽核！', 'success');
      });
    }

    // 雲端拉取
    dom.btnFetchCloud.addEventListener('click', handleFetchCloud);

    // 日期變更
    dom.dateInput.addEventListener('change', (e) => {
      loadExistingRecordForDate(currentCaseId, e.target.value);
    });

    // 正向良好行為加分按鈕
    dom.btnPositiveBehavior.addEventListener('click', () => {
      const period = dayRecord.periods[currentPeriodIndex];
      period.positiveCount = (period.positiveCount || 0) + 1;
      period.observer = getActiveObserver();
      refreshPeriodUI();
      showToast(`★ 正向良好適應行為 +1 (本節累計 ${period.positiveCount} 次)`, 'success');
    });

    // 標記 V (無紀錄/常態)
    dom.btnMarkV.addEventListener('click', () => {
      const period = dayRecord.periods[currentPeriodIndex];
      period.isV = !period.isV;
      if (period.isV) {
        period.behaviors.forEach(b => b.count = 0);
      }
      period.observer = getActiveObserver();
      refreshPeriodUI();
    });

    // 儲存操作
    dom.btnSaveSinglePeriod.addEventListener('click', handleSaveSinglePeriod);
    dom.btnSaveDay.addEventListener('click', handleSaveCompleteDay);

    // 清空本節
    dom.btnResetPeriod.addEventListener('click', () => {
      if (confirm(`確定要清空【${PERIODS[currentPeriodIndex]}】的紀錄嗎？`)) {
        const period = dayRecord.periods[currentPeriodIndex];
        period.isV = false;
        period.positiveCount = 0;
        period.subject = '';
        period.activityType = '';
        period.intensity = '';
        period.outcome = '';
        period.behaviors.forEach(b => b.count = 0);
        period.antecedentTags = [];
        period.consequenceTags = [];
        period.contextNote = '';
        renderPeriodTabs();
        refreshPeriodUI();
      }
    });

    // 基礎模式引進之進階輕量選單即時保存
    ['basicSubjectSelect', 'basicActivitySelect', 'basicIntensitySelect', 'basicOutcomeSelect'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          saveCurrentPeriodInputs();
          renderPeriodTabs();
          refreshAbcUI();
        });
      }
    });

    if (dom.contextNoteInput) {
      dom.contextNoteInput.addEventListener('input', () => {
        saveCurrentPeriodInputs();
        refreshAbcUI();
      });
    }

    // 匯出當日 Word
    dom.btnExportDailyWord.addEventListener('click', () => {
      saveCurrentPeriodInputs();
      const summary = window.Analytics.computeSummary([dayRecord]);
      window.DocxExport.exportDailyWord(dayRecord, summary);
    });

    // 統計頁篩選切換
    if (dom.analyticsCaseSelect) dom.analyticsCaseSelect.addEventListener('change', loadAnalytics);
    if (dom.analyticsRangeSelect) dom.analyticsRangeSelect.addEventListener('change', loadAnalytics);

    // 匯出累計 Word
    dom.btnExportWeeklyWord.addEventListener('click', () => {
      const caseId = dom.analyticsCaseSelect.value || currentCaseId;
      const range = dom.analyticsRangeSelect.value;
      const allRecords = window.GoogleSync.getAllLocalRecords();
      const filtered = window.Analytics.filterRecords(allRecords, caseId, range);
      const summary = window.Analytics.computeSummary(filtered);

      const rangeLabels = { today: '當日觀察', week: '當週累計', all: '長期全部累計' };
      window.DocxExport.exportWeeklyOrCumulativeWord(caseId, rangeLabels[range] || range, summary);
    });

    // 批次同步
    dom.btnSyncAll.addEventListener('click', async () => {
      dom.btnSyncAll.disabled = true;
      dom.btnSyncAll.textContent = '⏳ 同步處理中...';
      const res = await window.GoogleSync.syncAllPending();
      dom.btnSyncAll.disabled = false;
      dom.btnSyncAll.textContent = '☁️ 立即同步全部至 Google 試算表';
      showToast(`同步完成！成功同步 ${res.syncedCount} 筆`, 'success');
      updateSyncStatusBadge();
      renderHistoryTable();
    });

    // 課表跳轉控制
    if (dom.btnJumpToCurrentPeriod) {
      dom.btnJumpToCurrentPeriod.addEventListener('click', () => {
        const sched = getCurrentScheduleInfo();
        saveCurrentPeriodInputs();
        currentPeriodIndex = sched.index;
        renderPeriodTabs();
        refreshPeriodUI();
        showToast(`⚡️ 已切換至當前課堂：【${sched.schedule.name}】(${sched.schedule.timeStr})`, 'info');
      });
    }

    // 設定頁面 GAS URL
    dom.apiUrlInput.value = window.GoogleSync.getApiUrl();
    dom.btnSaveApiUrl.addEventListener('click', () => {
      window.GoogleSync.setApiUrl(dom.apiUrlInput.value);
      showToast('Google 試算表 Web App 網址已儲存！', 'success');
    });

    dom.btnTestApi.addEventListener('click', async () => {
      dom.apiTestResult.textContent = '連線測試中...';
      try {
        const res = await window.GoogleSync.testConnection(dom.apiUrlInput.value);
        dom.apiTestResult.textContent = `✅ 連線成功！伺服器回應：${JSON.stringify(res)}`;
        dom.apiTestResult.className = 'text-xs text-emerald-600 font-semibold mt-2';
      } catch (err) {
        dom.apiTestResult.textContent = `❌ 連線失敗：${err.message}`;
        dom.apiTestResult.className = 'text-xs text-rose-600 font-semibold mt-2';
      }
    });

    // 一鍵複製後端 Code.gs
    if (dom.btnCopyBackendCode && dom.backendCodeTextarea) {
      dom.btnCopyBackendCode.addEventListener('click', () => {
        navigator.clipboard.writeText(dom.backendCodeTextarea.value);
        showToast('📋 已複製後端 Code.gs 完整程式碼！可直接到 Google Apps Script 貼上', 'success');
      });
    }
  }

  // ===================== 🥚 設計者隱藏彩蛋 (Creator Easter Egg) =====================
  function initCreatorEasterEgg() {
    const creatorMeta = {
      system: 'BOS 課堂行為觀察速記與臨床鑑別評估系統',
      version: 'v3.1.0 PRO',
      architect: 'Chiahua (chy23)',
      mission: '讓特教與普教老師在忙碌課堂中一指完成專業行為量化觀察，守護每位孩子的成長與隱私。',
      triggers: [
        '1. 連續點擊左上角藍色「B」圖示 5 下',
        '2. 鍵盤輸入經典指令：↑ ↑ ↓ ↓ ← → ← → B A',
        '3. 開發者工具 Console 呼叫：BOS_CREATOR()'
      ]
    };

    // 1. 開發者控制台 (DevTools Console) 專屬彩蛋簽名
    console.log(
      '%c BOS %c 課堂行為觀察與臨床鑑別系統 v3.1.0 ',
      'background:#0071e3; color:#ffffff; font-weight:900; padding:4px 8px; border-radius:6px 0 0 6px; font-size:12px;',
      'background:#1e293b; color:#38bdf8; font-weight:700; padding:4px 10px; border-radius:0 6px 6px 0; font-size:12px;'
    );
    console.log(
      `%c🌟 Designed & Architected by ${creatorMeta.architect}\n💡 "${creatorMeta.mission}"\n🥚 隱藏彩蛋提示：連點左上角「B」圖示 5 下，或在 Console 輸入 BOS_CREATOR()`,
      'color:#64748b; font-size:11px; line-height:1.6;'
    );

    function showEasterEggModal() {
      let existing = document.getElementById('bosCreatorEasterEggModal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'bosCreatorEasterEggModal';
      modal.className = 'fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in';
      modal.innerHTML = `
        <div class="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-indigo-400/30 space-y-4 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
              🥚 HIDDEN EASTER EGG UNLOCKED
            </span>
            <button type="button" id="btnCloseEasterEgg" class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold flex items-center justify-center cursor-pointer">
              ✕
            </button>
          </div>

          <div class="flex items-center gap-3.5">
            <div class="w-14 h-14 rounded-2xl bg-[#0071e3] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/30 border border-blue-400/40">
              B
            </div>
            <div>
              <h3 class="text-base font-black tracking-tight text-white">BOS 課堂行為觀察系統</h3>
              <p class="text-xs text-indigo-300 font-semibold mt-0.5">System Architect &amp; Domain Designer</p>
            </div>
          </div>

          <div class="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-300 font-bold">✨ 系統原創設計者</span>
              <span class="font-mono font-black text-amber-300 text-sm">${creatorMeta.architect}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-300 font-bold">🔬 核心架構版本</span>
              <span class="font-mono font-bold text-emerald-300">${creatorMeta.version} (Dual-Engine)</span>
            </div>
            <p class="text-slate-200 leading-relaxed pt-2 border-t border-white/10 italic">
              「${creatorMeta.mission}」
            </p>
          </div>

          <div class="flex items-center justify-between pt-1">
            <span class="text-[11px] text-slate-400 font-mono">Crafted with care for Educators &amp; Kids ❤️</span>
            <button type="button" id="btnConfirmEasterEgg" class="px-4 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-black shadow-sm cursor-pointer active:scale-95 transition-all">
              致敬收下 ✨
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      modal.querySelector('#btnCloseEasterEgg').addEventListener('click', () => modal.remove());
      modal.querySelector('#btnConfirmEasterEgg').addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    }

    // 暴露全域 Console 函數
    window.BOS_CREATOR = () => {
      showEasterEggModal();
      return creatorMeta;
    };

    // 2. 左上角藍色「B」Logo 連續點擊 5 下觸發
    const logo = document.getElementById('bosBrandLogo');
    let clickCount = 0;
    let clickTimer = null;
    if (logo) {
      logo.addEventListener('click', () => {
        clickCount += 1;
        clearTimeout(clickTimer);
        if (clickCount >= 5) {
          clickCount = 0;
          showEasterEggModal();
        } else {
          clickTimer = setTimeout(() => {
            clickCount = 0;
          }, 1200);
        }
      });
    }

    // 3. 鍵盤 Konami Code (↑ ↑ ↓ ↓ ← → ← → B A) 觸發
    const konamiSeq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIdx = 0;
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === konamiSeq[konamiIdx]) {
        konamiIdx += 1;
        if (konamiIdx === konamiSeq.length) {
          konamiIdx = 0;
          showEasterEggModal();
        }
      } else {
        konamiIdx = (key === konamiSeq[0]) ? 1 : 0;
      }
    });
  }

  init();
});
