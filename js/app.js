/**
 * App: 主應用程式邏輯控制器 (升級：多師協同、個案管理刪除、A-B-C脈絡、正向行為、雲端程式碼)
 */
document.addEventListener('DOMContentLoaded', () => {
  // 核心行為代號 (還原附檔紙本，並配置專屬 GIF 微動畫圖示)
  const BEHAVIORS = [
    { code: '○', name: '玩文具、雜物、桌椅', icon: '✏️', animClass: 'gif-anim-pencil', desc: '玩筆、尺、橡皮擦屑、桌面雜物、搖晃桌椅', badgeColor: 'bg-blue-600', lightColor: 'text-blue-600' },
    { code: '+', name: '放空、發呆', icon: '💭', animClass: 'gif-anim-cloud', desc: '眼神渙散、無視線接觸課堂重點、未跟隨教學', badgeColor: 'bg-emerald-600', lightColor: 'text-emerald-600' },
    { code: '↑', name: '尋找東西、遺失物', icon: '🔍', animClass: 'gif-anim-search', desc: '低頭翻書包、找筆、掉文具、離開座位搜尋', badgeColor: 'bg-amber-600', lightColor: 'text-amber-600' },
    { code: '～', name: '扭、抖動身體', icon: '🦵', animClass: 'gif-anim-leg', desc: '頻繁抖腳、扭動扭曲身軀、坐立難安', badgeColor: 'bg-purple-600', lightColor: 'text-purple-600' },
    { code: '×', name: '以動作、講話干擾附近人', icon: '🗣️', animClass: 'gif-anim-talk', desc: '拍打同學、故意推擠、交談、發出聲響', badgeColor: 'bg-rose-600', lightColor: 'text-rose-600' },
    { code: '！', name: '未舉手發言、搶話', icon: '📢', animClass: 'gif-anim-speaker', desc: '老師或他人講話時插話、大聲自語、搶答', badgeColor: 'bg-pink-600', lightColor: 'text-pink-600' }
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

  // A 前事標籤與 C 後果標籤 (依據特教與 ADHD 指引)
  const ANTECEDENT_TAGS = [
    '教師單向講課', '學生獨立書寫', '分組討論合作',
    '課堂測驗小考', '收發作業聯絡簿', '上課轉銜鐘響',
    '同儕主動攀談', '疲憊飢餓/身體不適', '自由活動時間'
  ];

  const CONSEQUENCE_TAGS = [
    '教師口頭提醒', '手勢眼神示意', '肢體引導回座',
    '給予讚美/代幣', '同儕起鬨圍觀', '抽離至冷靜角',
    '課後個別談話', '刻意忽略/暫不處理'
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
    caseModalList: document.getElementById('caseModalList')
  };

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
        ? `<span class="text-[9px] opacity-75 truncate max-w-[80px]">(${pData.observer})</span>`
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
      { code: '+', label: '放空發呆', icon: '💭' },
      { code: '↑', label: '尋找遺失物', icon: '🔍' },
      { code: '～', label: '扭動身體', icon: '🦵' },
      { code: '×', label: '干擾他人', icon: '🗣️' },
      { code: '！', label: '未舉手搶話', icon: '📢' },
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
        period.behaviors.forEach(b => b.count = 0);
        period.antecedentTags = [];
        period.consequenceTags = [];
        period.contextNote = '';
        refreshPeriodUI();
      }
    });

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

  init();
});
