/**
 * 行為觀察紀錄系統 (Behavior Observation System - BOS)
 * Google Apps Script 後端處理程式
 * 
 * 部署說明：
 * 1. 在 Google 試算表中，點擊「擴充功能」 -> 「Apps Script」
 * 2. 將此程式碼完整貼上取代原有內容
 * 3. 點選「部署」 -> 「新建部署」 -> 選擇類型「網頁應用程式 (Web App)」
 * 4. 存取權限設定為「所有人 (Anyone)」
 * 5. 複製生成的 Web 應用程式網址，填入 BOS 網頁系統的設定中
 */

const SHEET_NAME_RAW = "行為原始紀錄";
const SHEET_NAME_DAILY = "當日統計彙整";
const SHEET_NAME_CASES = "個案代號清單";

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action;
  
  if (action === "listCases") {
    return handleListCases();
  } else if (action === "getRecord") {
    return handleGetRecord(params.caseId, params.date);
  }
  
  return jsonResponse({ status: "success", message: "BOS Google Apps Script API 正常運作中" });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || "upsert";

    if (action === "upsert") {
      return handleUpsertRecord(data);
    } else if (action === "delete") {
      return handleDeleteRecord(data.caseId, data.date);
    }

    return jsonResponse({ status: "error", message: "未知的操作指令" }, 400);
  } catch (error) {
    return jsonResponse({ status: "error", message: error.toString() }, 500);
  }
}

/**
 * 新增或更新紀錄 (Upsert: 若已有該個案該日期的資料則更新，無則新增)
 */
function handleUpsertRecord(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = getOrCreateSheet(ss, SHEET_NAME_RAW, [
    "更新時間戳記", "個案代號", "日期", "用藥時間", "身體不適紀錄",
    "節次", "行為代號", "行為名稱", "次數", "情境標籤", "情境細節備註"
  ]);

  const caseId = payload.caseId;
  const date = payload.date;
  const medTime = payload.medTime || "未填寫/無用藥";
  const discomfort = payload.discomfort || "無特殊狀況";
  const periods = payload.periods || []; // 9 個節次陣列
  const timestamp = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

  // 1. 先刪除舊有的同個案、同日期記錄（若存在）
  deleteExistingRows(rawSheet, caseId, date);

  // 2. 插入新的列資料
  const rowsToInsert = [];
  periods.forEach(function(period) {
    const periodName = period.name;
    const contextTags = (period.contextTags || []).join(", ");
    const contextNote = period.contextNote || "";
    const behaviors = period.behaviors || [];

    if (behaviors.length === 0) {
      // 若該節無特定行為或標記為 V
      rowsToInsert.push([
        timestamp, caseId, date, medTime, discomfort,
        periodName, "V", "無紀錄/常態", 0, contextTags, contextNote
      ]);
    } else {
      behaviors.forEach(function(b) {
        rowsToInsert.push([
          timestamp, caseId, date, medTime, discomfort,
          periodName, b.code, b.name, b.count, contextTags, contextNote
        ]);
      });
    }
  });

  if (rowsToInsert.length > 0) {
    rawSheet.getRange(rawSheet.getLastRow() + 1, 1, rowsToInsert.length, rowsToInsert[0].length)
            .setValues(rowsToInsert);
  }

  // 3. 確保個案清單有此代號（純匿名代號）
  recordCaseId(ss, caseId);

  return jsonResponse({
    status: "success",
    message: "紀錄已成功儲存/更新至雲端試算表",
    caseId: caseId,
    date: date,
    rowsCount: rowsToInsert.length,
    updatedAt: timestamp
  });
}

/**
 * 讀取特定個案特定日期的紀錄
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

  const resultRows = [];
  let medTime = "";
  let discomfort = "";

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[1]) === String(caseId) && String(row[2]) === String(date)) {
      medTime = row[3];
      discomfort = row[4];
      resultRows.push({
        periodName: row[5],
        code: row[6],
        name: row[7],
        count: Number(row[8]),
        contextTags: row[9] ? String(row[9]).split(", ") : [],
        contextNote: row[10] || ""
      });
    }
  }

  if (resultRows.length === 0) {
    return jsonResponse({ status: "success", record: null });
  }

  return jsonResponse({
    status: "success",
    record: {
      caseId: caseId,
      date: date,
      medTime: medTime,
      discomfort: discomfort,
      items: resultRows
    }
  });
}

/**
 * 取得個案列表
 */
function handleListCases() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const caseSheet = ss.getSheetByName(SHEET_NAME_CASES);
  if (!caseSheet) {
    return jsonResponse({ status: "success", cases: [] });
  }

  const data = caseSheet.getDataRange().getValues();
  const cases = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) cases.push(String(data[i][0]));
  }

  return jsonResponse({ status: "success", cases: cases });
}

/**
 * 刪除現有紀錄
 */
function deleteExistingRows(sheet, caseId, date) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  // 從後往前刪除，避免 index 錯位
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]) === String(caseId) && String(data[i][2]) === String(date)) {
      sheet.deleteRow(i + 1);
    }
  }
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
