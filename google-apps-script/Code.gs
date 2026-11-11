/**
 * 行為觀察紀錄系統 (Behavior Observation System - BOS)
 * Google Apps Script 後端處理程式 (支援多科任老師跨載具共同記錄)
 * 
 * 特色：
 * 1. 支援多位老師（導師、科任老師）協同記錄：依 [個案 + 日期 + 節次] 智慧合併，不覆蓋其他老師的節次。
 * 2. 嚴格個資去識別化：僅儲存 3 碼亂碼代號，不記錄任何真實姓名或身分個資。
 * 3. 支援 A-B-C 行為脈絡 (前置前事、行為代號、後續後果) 與正向良好行為紀錄。
 */

const SHEET_NAME_RAW = "行為原始紀錄";
const SHEET_NAME_ADVANCED = "進階臨床行為紀錄";
const SHEET_NAME_CASES = "個案代號清單";

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action;
  
  if (action === "listCases") {
    return handleListCases();
  } else if (action === "getRecord") {
    return handleGetRecord(params.caseId, params.date);
  } else if (action === "ping") {
    return jsonResponse({ status: "success", message: "BOS 雲端服務正常連線中", timestamp: new Date().toISOString() });
  }
  
  return jsonResponse({ status: "success", message: "BOS Google Apps Script API 正常運作中" });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || "upsert";

    if (action === "upsert") {
      return handleUpsertRecord(data);
    } else if (action === "upsertAdvanced") {
      return handleUpsertAdvancedRecord(data);
    } else if (action === "deleteCase") {
      return handleDeleteCase(data.caseId);
    } else if (action === "deleteRecord") {
      return handleDeleteRecord(data.caseId, data.date);
    }

    return jsonResponse({ status: "error", message: "未知的操作指令" }, 400);
  } catch (error) {
    return jsonResponse({ status: "error", message: error.toString() }, 500);
  }
}

/**
 * 新增或更新紀錄 (支援單節更新或全日合併，避免多位老師相互覆蓋)
 */
function handleUpsertRecord(payload) {
  // 資安檢查 1：嚴格驗證個案代號與日期格式
  const caseId = String(payload.caseId || '').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
  const date = String(payload.date || '').trim();

  if (caseId.length !== 3) {
    return jsonResponse({ status: "error", message: "無效的個案代號 (必須為3碼英數)" }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonResponse({ status: "error", message: "無效的日期格式" }, 400);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = getOrCreateSheet(ss, SHEET_NAME_RAW, [
    "更新時間戳記", "個案代號", "日期", "用藥時間", "身體不適紀錄",
    "節次", "記錄老師/角色", "行為代號", "行為名稱", "次數",
    "前事脈絡(A)", "後果反應(C)", "詳細情境備註", "正向行為次數"
  ]);

  const medTime = sanitizeCell(payload.medTime || "未記錄");
  const discomfort = sanitizeCell(payload.discomfort || "無特殊狀況");
  const observer = sanitizeCell(payload.observer || "課堂教師");
  const periods = payload.periods || [];
  const timestamp = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

  const targetPeriodNames = periods.map(p => p.name);

  // 1. 僅刪除「同個案 + 同日期 + 本次有更新的節次」之舊紀錄，保留其他科任老師的節次紀錄
  deleteTargetPeriodRows(rawSheet, caseId, date, targetPeriodNames);

  // 2. 插入新的列資料 (經防公式注入清理)
  const rowsToInsert = [];
  periods.forEach(function(period) {
    const periodName = sanitizeCell(period.name);
    const periodObserver = sanitizeCell(period.observer || observer);
    const antecedentTags = sanitizeCell((period.antecedentTags || []).join(", "));
    const consequenceTags = sanitizeCell((period.consequenceTags || []).join(", "));
    const contextNote = sanitizeCell(period.contextNote || "");
    const positiveCount = Number(period.positiveCount || 0);
    const behaviors = period.behaviors || [];

    if (behaviors.length === 0 || period.isV) {
      rowsToInsert.push([
        timestamp, caseId, date, medTime, discomfort,
        periodName, periodObserver, "V", "常態穩定/無干擾", 0,
        antecedentTags, consequenceTags, contextNote, positiveCount
      ]);
    } else {
      behaviors.forEach(function(b) {
        if (b.count > 0 || behaviors.length === 1) {
          rowsToInsert.push([
            timestamp, caseId, date, medTime, discomfort,
            periodName, periodObserver, sanitizeCell(b.code), sanitizeCell(b.name), Number(b.count || 0),
            antecedentTags, consequenceTags, contextNote, positiveCount
          ]);
        }
      });
    }
  });

  if (rowsToInsert.length > 0) {
    rawSheet.getRange(rawSheet.getLastRow() + 1, 1, rowsToInsert.length, rowsToInsert[0].length)
            .setValues(rowsToInsert);
  }

  // 3. 確保個案清單有此代號
  recordCaseId(ss, caseId);

  return jsonResponse({
    status: "success",
    message: "紀錄已成功合併儲存至雲端試算表",
    caseId: caseId,
    date: date,
    updatedPeriods: targetPeriodNames,
    rowsCount: rowsToInsert.length,
    updatedAt: timestamp
  });
}

/**
 * 新增或更新進階臨床行為紀錄 (ClassroomBehaviorRecord Schema)
 */
function handleUpsertAdvancedRecord(payload) {
  const rec = payload.record || {};
  const recordId = sanitizeCell(String(rec.record_id || ""));
  const studentId = sanitizeCell(String(rec.student_id || "").toUpperCase());
  const timestamp = sanitizeCell(String(rec.timestamp || ""));
  const observer = sanitizeCell(String(payload.observer || "課堂教師"));

  if (!/^rec_[0-9]{8}_[0-9A-Za-z]+$/.test(recordId)) {
    return jsonResponse({ status: "error", message: "無效的進階紀錄編號 (record_id)" }, 400);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const advSheet = getOrCreateSheet(ss, SHEET_NAME_ADVANCED, [
    "紀錄編號(record_id)", "學生代碼(student_id)", "發生時間(timestamp)", "記錄老師",
    "節次(period)", "科目(subject)", "活動型態(activity_type)", "物理環境備註(environment_notes)",
    "前因分類(antecedent.category)", "前因詳述(antecedent.details)",
    "行為向度(behavior.category)", "行為代碼(target_code)", "行為標籤(target_label)", "關聯疾病標籤(related_conditions)",
    "頻率(frequency)", "持續分鐘(duration_minutes)", "干擾強度(intensity)",
    "介入策略(strategy)", "介入處置標籤(strategy_label)", "介入成效代碼(outcome)", "介入成效標籤(outcome_label)",
    "質性觀察備註(qualitative_notes)", "完整標準JSON"
  ]);

  // 若已有相同 record_id 則先移除舊列
  const data = advSheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(rec.record_id)) {
      advSheet.deleteRow(i + 1);
    }
  }

  const ctx = rec.context || {};
  const ant = rec.antecedent || {};
  const beh = rec.behavior || {};
  const met = rec.metrics || {};
  const intv = rec.intervention || {};

  const row = [
    recordId,
    studentId,
    timestamp,
    observer,
    Number(ctx.period || 1),
    sanitizeCell(ctx.subject || ""),
    sanitizeCell(ctx.activity_type || ""),
    sanitizeCell(ctx.environment_notes || ""),
    sanitizeCell(ant.category || ""),
    sanitizeCell(ant.details || ""),
    sanitizeCell(beh.category || ""),
    sanitizeCell(beh.target_code || ""),
    sanitizeCell(beh.target_label || ""),
    sanitizeCell((beh.related_conditions || []).join(", ")),
    Number(met.frequency || 1),
    Number(met.duration_minutes || 0),
    Number(met.intensity || 1),
    sanitizeCell(intv.strategy || ""),
    sanitizeCell(intv.strategy_label || ""),
    sanitizeCell(intv.outcome || ""),
    sanitizeCell(intv.outcome_label || ""),
    sanitizeCell(rec.qualitative_notes || ""),
    sanitizeCell(JSON.stringify(rec))
  ];

  advSheet.appendRow(row);
  return jsonResponse({
    status: "success",
    message: "進階臨床紀錄已寫入雲端試算表",
    record_id: rec.record_id
  });
}

/**
 * 資安防護：防試算表公式注入 (Spreadsheet Formula Injection / CWE-1236)
 * 若字串以 '=', '+', '-', '@' 開頭，強制加上單引號轉義
 */
function sanitizeCell(val) {
  if (typeof val === 'string') {
    val = val.trim();
    if (/^[=+\-@]/.test(val)) {
      return "'" + val;
    }
  }
  return val;
}

/**
 * 讀取特定個案特定日期的合併全天紀錄 (供跨老師即時同步載入)
 */
function handleGetRecord(caseId, date) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName(SHEET_NAME_RAW);
  if (!rawSheet) {
    return jsonResponse({ status: "success", record: null });
  }

  const data = rawSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse({ status: "success", record: null });
  }

  const periodMap = {};
  let medTime = "";
  let discomfort = "";

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[1]) === String(caseId) && String(row[2]) === String(date)) {
      if (row[3] && row[3] !== "未記錄") medTime = row[3];
      if (row[4] && row[4] !== "無特殊狀況") discomfort = row[4];

      const periodName = String(row[5]);
      if (!periodMap[periodName]) {
        periodMap[periodName] = {
          name: periodName,
          observer: String(row[6] || ""),
          isV: String(row[7]) === "V",
          behaviors: [],
          antecedentTags: row[10] ? String(row[10]).split(", ") : [],
          consequenceTags: row[11] ? String(row[11]).split(", ") : [],
          contextNote: String(row[12] || ""),
          positiveCount: Number(row[13] || 0)
        };
      }

      if (row[7] && row[7] !== "V") {
        periodMap[periodName].behaviors.push({
          code: String(row[7]),
          name: String(row[8]),
          count: Number(row[9])
        });
      }
    }
  }

  const periodNames = [
    "早自習", "第一節", "第二節", "第三節", "第四節",
    "中午", "第五節", "第六節", "第七節"
  ];

  const periodsArray = periodNames.map(function(pName) {
    return periodMap[pName] || {
      name: pName,
      observer: "",
      isV: false,
      behaviors: [],
      antecedentTags: [],
      consequenceTags: [],
      contextNote: "",
      positiveCount: 0
    };
  });

  return jsonResponse({
    status: "success",
    record: {
      caseId: caseId,
      date: date,
      medTime: medTime,
      discomfort: discomfort,
      periods: periodsArray
    }
  });
}

/**
 * 刪除指定節次的舊紀錄 (支援特定節次更新)
 */
function deleteTargetPeriodRows(sheet, caseId, date, targetPeriodNames) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  for (let i = data.length - 1; i >= 1; i--) {
    const rCase = String(data[i][1]);
    const rDate = String(data[i][2]);
    const rPeriod = String(data[i][5]);

    if (rCase === String(caseId) && rDate === String(date) && targetPeriodNames.includes(rPeriod)) {
      sheet.deleteRow(i + 1);
    }
  }
}

/**
 * 刪除個案
 */
function handleDeleteCase(caseId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const caseSheet = ss.getSheetByName(SHEET_NAME_CASES);
  if (caseSheet) {
    const data = caseSheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][0]) === String(caseId)) {
        caseSheet.deleteRow(i + 1);
      }
    }
  }
  return jsonResponse({ status: "success", message: "個案已從雲端清單中移除" });
}

/**
 * 取得個案列表
 */
function handleListCases() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const caseSheet = ss.getSheetByName(SHEET_NAME_CASES);
  if (!caseSheet) return jsonResponse({ status: "success", cases: [] });

  const data = caseSheet.getDataRange().getValues();
  const cases = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) cases.push(String(data[i][0]));
  }
  return jsonResponse({ status: "success", cases: cases });
}

/**
 * 紀錄個案代號
 */
function recordCaseId(ss, caseId) {
  const sheet = getOrCreateSheet(ss, SHEET_NAME_CASES, ["個案代號 (3碼亂碼)", "首次建立時間"]);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(caseId)) return;
  }
  const timestamp = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
  sheet.appendRow([caseId, timestamp]);
}

/**
 * 工具：取得或建立工作表
 */
function getOrCreateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#EEF2F6");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * 工具：產出 JSON 格式回傳
 */
function jsonResponse(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
