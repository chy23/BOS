/**
 * App: 主應用程式邏輯控制器
 */
document.addEventListener('DOMContentLoaded', () => {
  // 核心常數
  const BEHAVIORS = [
    { code: '○', name: '玩文具、雜物、桌椅', desc: '玩筆、尺、橡皮擦屑、桌面雜物、搖晃桌椅', badgeColor: 'bg-blue-600' },
    { code: '+', name: '放空、發呆', desc: '眼神渙散、無視線接觸課堂重點、未跟隨教學', badgeColor: 'bg-emerald-600' },
    { code: '↑', name: '尋找東西、遺失物', desc: '低頭翻書包、找筆、掉文具、離開座位搜尋', badgeColor: 'bg-amber-600' },
    { code: '～', name: '扭、抖動身體', desc: '頻繁抖腳、扭動扭曲身軀、坐立難安', badgeColor: 'bg-purple-600' },
    { code: '×', name: '以動作、講話干擾附近人', desc: '拍打同學、故意推擠、交談、發出聲響', badgeColor: 'bg-rose-600' },
    { code: '！', name: '未舉手發言、搶話', desc: '老師或他人講話時插話、大聲自語、搶答', badgeColor: 'bg-pink-600' }
  ];

  // 依據學校課表作息時間配置
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

  const COMMON_CONTEXT_TAGS = [
    '教師單向講課', '學生個別書寫', '分組討論合作',
    '課堂測驗小考', '抄寫聯絡簿', '收發作業考卷',
    '上課轉銜鐘響', '同儕主動攀談', '電腦/藝能實作', '自由活動時間'
  ];

  // 狀態管理
  let currentCaseId = window.CaseManager.getActiveCaseId();
  let currentDate = new Date().toISOString().split('T')[0];
  let currentPeriodIndex = 0;
  let isEditMode = false;

  // 當前日期的 9 節次暫存資料結構
  let dayRecord = createEmptyDayRecord(currentCaseId, currentDate);

  // 初始化 DOM 參考
  const dom = {
    // 頂部與導航
    caseSelect: document.getElementById('caseSelect'),
    btnNewCase: document.getElementById('btnNewCase'),
    btnCopyCaseId: document.getElementById('btnCopyCaseId'),
    dateInput: document.getElementById('dateInput'),
    medTimeInput: document.getElementById('medTimeInput'),
    discomfortInput: document.getElementById('discomfortInput'),
    editModeBadge: document.getElementById('editModeBadge'),
    syncBadge: document.getElementById('syncBadge'),
    
    // 即時課表排程
    liveClockDisplay: document.getElementById('liveClockDisplay'),
    liveScheduleStatus: document.getElementById('liveScheduleStatus'),
    autoTimeJumpCheckbox: document.getElementById('autoTimeJumpCheckbox'),
    btnJumpToCurrentPeriod: document.getElementById('btnJumpToCurrentPeriod'),

    // 頁籤切換
    navTabs: document.querySelectorAll('.nav-tab'),
    viewSections: document.querySelectorAll('.view-section'),

    // 節次列
    periodTabsContainer: document.getElementById('periodTabsContainer'),
    currentPeriodTitle: document.getElementById('currentPeriodTitle'),

    // 速記按鈕卡片區
    behaviorCardsContainer: document.getElementById('behaviorCardsContainer'),
    btnMarkV: document.getElementById('btnMarkV'),
    
    // 情境脈絡區
    contextTagsContainer: document.getElementById('contextTagsContainer'),
    contextNoteInput: document.getElementById('contextNoteInput'),

    // 底部操作
    btnSaveDay: document.getElementById('btnSaveDay'),
    btnResetPeriod: document.getElementById('btnResetPeriod'),
    btnExportDailyWord: document.getElementById('btnExportDailyWord'),

    // 統計頁面
    analyticsCaseSelect: document.getElementById('analyticsCaseSelect'),
    analyticsRangeSelect: document.getElementById('analyticsRangeSelect'),
    summaryTotalDays: document.getElementById('summaryTotalDays'),
    summaryTotalBehaviors: document.getElementById('summaryTotalBehaviors'),
    summaryTopBehavior: document.getElementById('summaryTopBehavior'),
    summaryTopPeriod: document.getElementById('summaryTopPeriod'),
    insightTextBox: document.getElementById('insightTextBox'),
    heatmapContainer: document.getElementById('heatmapContainer'),
    btnExportWeeklyWord: document.getElementById('btnExportWeeklyWord'),

    // 歷史紀錄頁面
    historyTableBody: document.getElementById('historyTableBody'),
    btnSyncAll: document.getElementById('btnSyncAll'),

    // 設定頁面
    apiUrlInput: document.getElementById('apiUrlInput'),
    btnSaveApiUrl: document.getElementById('btnSaveApiUrl'),
    btnTestApi: document.getElementById('btnTestApi'),
    apiTestResult: document.getElementById('apiTestResult')
  };

  // ===================== 課表時間排程演算法 =====================
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

  // ===================== 初始化函式 =====================
  function init() {
    renderCaseOptions();
    dom.dateInput.value = currentDate;
    
    // 依據目前時間自動計算課堂節次
    const currentSched = getCurrentScheduleInfo();
    currentPeriodIndex = currentSched.index;

    renderPeriodTabs();
    renderBehaviorCards();
    renderContextTags();
    
    // 檢查是否有儲存過當日資料
    loadExistingRecordForDate(currentCaseId, currentDate);

    bindEvents();
    updateSyncStatusBadge();

    // 啟動課表即時時鐘與跳轉監聽
    startScheduleTimer();
  }

  function createEmptyDayRecord(caseId, date) {
    return {
      caseId: caseId,
      date: date,
      medTime: '',
      discomfort: '',
      periods: PERIODS.map(name => ({
        name: name,
        isV: false,
        behaviors: BEHAVIORS.map(b => ({ code: b.code, name: b.name, count: 0 })),
        contextTags: [],
        contextNote: ''
      }))
    };
  }

  // ===================== 個案選擇與產生 =====================
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

  // ===================== 載入與更新既有紀錄 =====================
  function loadExistingRecordForDate(caseId, date) {
    const existing = window.GoogleSync.getRecord(caseId, date);
    if (existing) {
      // 載入既有記錄
      dayRecord = JSON.parse(JSON.stringify(existing));
      isEditMode = true;
      dom.editModeBadge.classList.remove('hidden');
      dom.editModeBadge.textContent = '✏️ 編輯既有紀錄模式';
    } else {
      dayRecord = createEmptyDayRecord(caseId, date);
      isEditMode = false;
      dom.editModeBadge.classList.add('hidden');
    }

    // 填入基本欄位
    dom.medTimeInput.value = dayRecord.medTime || '';
    dom.discomfortInput.value = dayRecord.discomfort || '';

    // 更新介面
    refreshPeriodUI();
  }

  // ===================== 渲染節次與按鈕 =====================
  function renderPeriodTabs() {
    dom.periodTabsContainer.innerHTML = '';
    const currentSched = getCurrentScheduleInfo();
    const isToday = (dom.dateInput.value === new Date().toISOString().split('T')[0]);

    SCHEDULE.forEach((schedItem, idx) => {
      const isSelected = (idx === currentPeriodIndex);
      const isNowLive = (idx === currentSched.index && isToday);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `period-tab px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex flex-col items-start gap-1 border select-none ${
        isSelected
          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.03]'
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
             <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
             現在課堂
           </span>`
        : '';

      btn.innerHTML = `
        <div class="flex items-center justify-between w-full gap-2">
          <span class="text-xs font-black tracking-tight">${schedItem.name}</span>
          <div class="flex items-center gap-1">
            ${liveIndicator}
            <span id="tabBadge_${idx}" class="text-[11px] px-1.5 py-0.5 rounded-full font-bold ${badgeClass}">0</span>
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
      card.className = 'behavior-card bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-400 transition-all select-none active:scale-[0.99] flex flex-col justify-between';
      
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="inline-flex items-center justify-center w-11 h-11 rounded-xl text-2xl font-black ${b.badgeColor} text-white shadow-sm">
              ${b.code}
            </span>
            <div class="flex items-center gap-1.5">
              <span id="countDisplay_${b.code}" class="text-3xl font-black text-slate-800 tracking-tight">0</span>
              <span class="text-xs text-slate-600 font-semibold">次</span>
            </div>
          </div>
          <h3 class="font-bold text-slate-800 text-base leading-snug mb-1">${b.name}</h3>
          <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">${b.desc}</p>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button type="button" class="btn-minus flex-1 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold rounded-xl text-sm transition-colors" data-code="${b.code}">
            -1
          </button>
          <button type="button" class="btn-plus flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-base shadow-md shadow-blue-500/20 active:translate-y-0.5 transition-all" data-code="${b.code}">
            + 點擊記次
          </button>
        </div>
      `;

      // 點擊卡片上半部也可 +1
      card.querySelector('.btn-plus').addEventListener('click', (e) => {
        e.stopPropagation();
        handleBehaviorCountChange(b.code, 1);
      });

      card.querySelector('.btn-minus').addEventListener('click', (e) => {
        e.stopPropagation();
        handleBehaviorCountChange(b.code, -1);
      });

      dom.behaviorCardsContainer.appendChild(card);
    });
  }

  function renderContextTags() {
    dom.contextTagsContainer.innerHTML = '';
    COMMON_CONTEXT_TAGS.forEach(tag => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'context-tag-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors';
      btn.textContent = `+ ${tag}`;
      btn.addEventListener('click', () => {
        toggleContextTag(tag);
      });
      dom.contextTagsContainer.appendChild(btn);
    });
  }

  function toggleContextTag(tag) {
    const period = dayRecord.periods[currentPeriodIndex];
    if (!period.contextTags) period.contextTags = [];
    
    const idx = period.contextTags.indexOf(tag);
    if (idx >= 0) {
      period.contextTags.splice(idx, 1);
    } else {
      period.contextTags.push(tag);
    }
    refreshContextUI();
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

    // 更新各行為計數器數字
    BEHAVIORS.forEach(b => {
      const item = period.behaviors.find(x => x.code === b.code);
      const count = item ? item.count : 0;
      const countElem = document.getElementById(`countDisplay_${b.code}`);
      if (countElem) countElem.textContent = count;
    });

    // 更新 V 狀態
    if (period.isV) {
      dom.btnMarkV.classList.add('bg-emerald-600', 'text-white');
      dom.btnMarkV.classList.remove('bg-white', 'text-slate-700');
      dom.btnMarkV.textContent = '✓ 本節已標記為無干擾紀錄 (V)';
    } else {
      dom.btnMarkV.classList.remove('bg-emerald-600', 'text-white');
      dom.btnMarkV.classList.add('bg-white', 'text-slate-700');
      dom.btnMarkV.textContent = '標記本節為：V 無紀錄/常態穩定';
    }

    refreshContextUI();
    updateTabBadges();
  }

  function refreshContextUI() {
    const period = dayRecord.periods[currentPeriodIndex];
    dom.contextNoteInput.value = period.contextNote || '';

    // 更新情境標籤選取狀態
    const buttons = dom.contextTagsContainer.querySelectorAll('.context-tag-btn');
    buttons.forEach(btn => {
      const tagText = btn.textContent.replace('+ ', '').replace('✓ ', '');
      if (period.contextTags && period.contextTags.includes(tagText)) {
        btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
        btn.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-200');
        btn.textContent = `✓ ${tagText}`;
      } else {
        btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
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

    // 如果有了行為次數，自動取消 V
    if (item.count > 0 && period.isV) {
      period.isV = false;
    }

    refreshPeriodUI();
  }

  function saveCurrentPeriodInputs() {
    const period = dayRecord.periods[currentPeriodIndex];
    period.contextNote = dom.contextNoteInput.value.trim();
    dayRecord.medTime = dom.medTimeInput.value.trim();
    dayRecord.discomfort = dom.discomfortInput.value.trim();
  }

  function updateTabBadges() {
    dayRecord.periods.forEach((p, idx) => {
      const badge = document.getElementById(`tabBadge_${idx}`);
      if (badge) {
        const total = p.behaviors.reduce((acc, cur) => acc + (cur.count || 0), 0);
        badge.textContent = p.isV ? 'V' : total;
        if (total > 0) {
          badge.className = 'text-xs px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold';
        }
      }
    });
  }

  // ===================== 儲存與更新完整日紀錄 =====================
  async function handleSaveCompleteDay() {
    saveCurrentPeriodInputs();

    dayRecord.caseId = currentCaseId;
    dayRecord.date = dom.dateInput.value;
    dayRecord.medTime = dom.medTimeInput.value;
    dayRecord.discomfort = dom.discomfortInput.value;

    // 儲存至本地快取
    window.GoogleSync.saveLocalRecord(dayRecord);
    isEditMode = true;
    dom.editModeBadge.classList.remove('hidden');
    dom.editModeBadge.textContent = '✏️ 已更新儲存 (本地)';

    showToast('紀錄已成功儲存至本機！正在同步至雲端...', 'info');

    // 嘗試同步至 Google Apps Script
    const syncRes = await window.GoogleSync.syncRecordToGoogle(dayRecord);
    if (syncRes.success) {
      showToast('🎉 資料已成功同步更新至 Google 試算表！', 'success');
      dom.editModeBadge.textContent = '☁️ 雲端與本地已同步';
    } else {
      showToast(`⚠️ 本機已儲存，但雲端同步失敗 (${syncRes.reason || '離線'})，恢復網路可手動同步。`, 'warning');
    }

    updateSyncStatusBadge();
    renderHistoryTable();
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

    // 更新指標卡片
    dom.summaryTotalDays.textContent = summary.totalDays;
    dom.summaryTotalBehaviors.textContent = summary.totalBehaviors;
    dom.summaryTopBehavior.textContent = summary.topBehavior ? `${summary.topBehavior.code} (${summary.topBehavior.count}次)` : '無';
    dom.summaryTopPeriod.textContent = summary.topPeriod ? `${summary.topPeriod.period} (${summary.topPeriod.count}次)` : '無';
    dom.insightTextBox.innerHTML = `<p class="leading-relaxed font-medium text-blue-950">${summary.insightText}</p>`;

    // 繪製熱區表 (Heatmap)
    renderHeatmap(summary);

    // 繪製長條圖 (Chart.js)
    renderCharts(summary);
  }

  function renderHeatmap(summary) {
    const codes = ['○', '+', '↑', '～', '×', '！'];
    let html = `
      <table class="w-full text-xs text-center border-collapse">
        <thead>
          <tr class="bg-slate-100 text-slate-700">
            <th class="p-2 border border-slate-200">時段</th>
            ${codes.map(c => `<th class="p-2 border border-slate-200 font-bold">${c}</th>`).join('')}
            <th class="p-2 border border-slate-200 bg-slate-200">小計</th>
          </tr>
        </thead>
        <tbody>
    `;

    PERIODS.forEach(p => {
      const pTotal = summary.periodTotals[p] || 0;
      let cols = codes.map(c => {
        const val = (summary.heatmap[p] && summary.heatmap[p][c]) || 0;
        let bgClass = 'bg-white';
        let textClass = 'text-slate-400';
        if (val >= 6) {
          bgClass = 'bg-rose-500 text-white font-extrabold';
          textClass = 'text-white';
        } else if (val >= 3) {
          bgClass = 'bg-amber-300 text-amber-950 font-bold';
          textClass = 'text-amber-950';
        } else if (val >= 1) {
          bgClass = 'bg-yellow-100 text-yellow-900 font-semibold';
          textClass = 'text-yellow-900';
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

    // 1. 行為排行榜柱狀圖
    const barCtx = document.getElementById('behaviorRankingChart');
    if (barCtx) {
      if (barChartInstance) barChartInstance.destroy();
      barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: summary.ranking.map(r => `${r.code} ${r.name}`),
          datasets: [{
            label: '發生次數',
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

    // 2. 時段分佈折線圖
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
            pointRadius: 5,
            pointHoverRadius: 7
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

  // ===================== 歷史紀錄清單 =====================
  function renderHistoryTable() {
    const allRecords = window.GoogleSync.getAllLocalRecords();
    dom.historyTableBody.innerHTML = '';

    if (allRecords.length === 0) {
      dom.historyTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-600 font-medium">尚無任何歷史觀察紀錄</td></tr>';
      return;
    }

    allRecords.forEach(rec => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';

      let totalCount = 0;
      (rec.periods || []).forEach(p => {
        (p.behaviors || []).forEach(b => totalCount += (b.count || 0));
      });

      const syncStatusTag = rec.pendingSync
        ? '<span class="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 font-semibold">待同步</span>'
        : '<span class="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 font-semibold">已同步</span>';

      tr.innerHTML = `
        <td class="p-3 font-semibold text-slate-800">${rec.date}</td>
        <td class="p-3 font-black text-blue-600 tracking-wider">${rec.caseId}</td>
        <td class="p-3 text-slate-600">${rec.medTime || '無'}</td>
        <td class="p-3 font-bold">${totalCount} 次</td>
        <td class="p-3">${syncStatusTag}</td>
        <td class="p-3">
          <div class="flex items-center gap-1.5">
            <button class="btn-history-load px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors" data-case="${rec.caseId}" data-date="${rec.date}">
              ✏️ 載入更新
            </button>
            <button class="btn-history-word px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors" data-case="${rec.caseId}" data-date="${rec.date}">
              📄 匯出Word
            </button>
            <button class="btn-history-delete px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition-colors" data-case="${rec.caseId}" data-date="${rec.date}">
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
        showToast(`已載入 ${rec.date} (${rec.caseId}) 之紀錄，可直接修改並更新！`, 'info');
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

  // ===================== 狀態標籤與通知 =====================
  function updateSyncStatusBadge() {
    const all = window.GoogleSync.getAllLocalRecords();
    const pending = all.filter(r => r.pendingSync).length;
    if (pending > 0) {
      dom.syncBadge.textContent = `待同步: ${pending}`;
      dom.syncBadge.className = 'text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-700';
    } else {
      dom.syncBadge.textContent = '已同步至雲端';
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
    toast.className = `fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-xl font-semibold text-sm z-50 transition-all transform duration-300 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function switchTab(targetId) {
    dom.navTabs.forEach(t => {
      if (t.dataset.target === targetId) {
        t.classList.add('bg-blue-600', 'text-white');
        t.classList.remove('text-slate-600', 'hover:bg-slate-100');
      } else {
        t.classList.remove('bg-blue-600', 'text-white');
        t.classList.add('text-slate-600', 'hover:bg-slate-100');
      }
    });

    dom.viewSections.forEach(s => {
      if (s.id === targetId) {
        s.classList.remove('hidden');
      } else {
        s.classList.add('hidden');
      }
    });

    if (targetId === 'view-analytics') {
      loadAnalytics();
    } else if (targetId === 'view-history') {
      renderHistoryTable();
    }
  }

  // ===================== 事件綁定 =====================
  function bindEvents() {
    // 頁籤切換
    dom.navTabs.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.target));
    });

    // 個案切換與產生
    dom.caseSelect.addEventListener('change', (e) => {
      currentCaseId = e.target.value;
      window.CaseManager.setActiveCase(currentCaseId);
      loadExistingRecordForDate(currentCaseId, dom.dateInput.value);
    });

    dom.btnNewCase.addEventListener('click', handleCreateNewCase);

    dom.btnCopyCaseId.addEventListener('click', () => {
      navigator.clipboard.writeText(currentCaseId);
      showToast(`已複製個案代號：${currentCaseId}`, 'info');
    });

    // 日期變更
    dom.dateInput.addEventListener('change', (e) => {
      loadExistingRecordForDate(currentCaseId, e.target.value);
    });

    // 標記 V (無紀錄/常態)
    dom.btnMarkV.addEventListener('click', () => {
      const period = dayRecord.periods[currentPeriodIndex];
      period.isV = !period.isV;
      if (period.isV) {
        // 清空該節行為次數
        period.behaviors.forEach(b => b.count = 0);
      }
      refreshPeriodUI();
    });

    // 儲存日紀錄
    dom.btnSaveDay.addEventListener('click', handleSaveCompleteDay);

    // 重設本節
    dom.btnResetPeriod.addEventListener('click', () => {
      if (confirm(`確定要清空【${PERIODS[currentPeriodIndex]}】的紀錄嗎？`)) {
        const period = dayRecord.periods[currentPeriodIndex];
        period.isV = false;
        period.behaviors.forEach(b => b.count = 0);
        period.contextTags = [];
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
    if (dom.analyticsCaseSelect) {
      dom.analyticsCaseSelect.addEventListener('change', loadAnalytics);
    }
    if (dom.analyticsRangeSelect) {
      dom.analyticsRangeSelect.addEventListener('change', loadAnalytics);
    }

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

    // 批次同步所有待同步資料
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

    // 設定頁面 GAS URL
    dom.apiUrlInput.value = window.GoogleSync.getApiUrl();
    dom.btnSaveApiUrl.addEventListener('click', () => {
      window.GoogleSync.setApiUrl(dom.apiUrlInput.value);
      showToast('Google 試算表 Web App 網址已儲存！', 'success');
    });

    // 課表跳轉與定時器控制
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

    if (dom.autoTimeJumpCheckbox) {
      dom.autoTimeJumpCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          showToast('已開啟「自動依課表跳轉」', 'info');
          const sched = getCurrentScheduleInfo();
          if (dom.dateInput.value === new Date().toISOString().split('T')[0]) {
            currentPeriodIndex = sched.index;
            renderPeriodTabs();
            refreshPeriodUI();
          }
        } else {
          showToast('已暫停自動跳轉，可手動停留在任何節次', 'info');
        }
      });
    }
  }

  // ===================== 課表即時監聽與自動跳轉 =====================
  function startScheduleTimer() {
    function tick() {
      const sched = getCurrentScheduleInfo();
      if (dom.liveClockDisplay) {
        dom.liveClockDisplay.textContent = sched.timeString;
      }
      if (dom.liveScheduleStatus) {
        dom.liveScheduleStatus.textContent = sched.statusText;
        if (sched.isClassTime) {
          dom.liveScheduleStatus.className = 'text-xs font-black text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs';
        } else {
          dom.liveScheduleStatus.className = 'text-xs font-bold text-blue-900 bg-white/90 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs';
        }
      }

      // 若目前選擇的日期是「今天」，且使用者開啟了「自動依課表跳轉」
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

  // 啟動
  init();
});
