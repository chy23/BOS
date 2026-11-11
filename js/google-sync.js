/**
 * GoogleSync: 負責本地資料管理與 Google Apps Script 雲端試算表雙向同步
 */
class GoogleSync {
  constructor() {
    this.storageKey = 'bos_daily_records';
    this.apiUrlKey = 'bos_gas_api_url';
    this.syncStatusKey = 'bos_sync_status';
  }

  getApiUrl() {
    return localStorage.getItem(this.apiUrlKey) || '';
  }

  setApiUrl(url) {
    localStorage.setItem(this.apiUrlKey, (url || '').trim());
  }

  /**
   * 取得所有本地儲存之紀錄
   */
  getAllLocalRecords() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading records', e);
      return [];
    }
  }

  /**
   * 取得特定個案特定日期的紀錄
   */
  getRecord(caseId, date) {
    const all = this.getAllLocalRecords();
    return all.find(r => r.caseId === caseId && r.date === date) || null;
  }

  /**
   * 本地儲存或更新紀錄 (Upsert)
   */
  saveLocalRecord(record) {
    let all = this.getAllLocalRecords();
    const existingIndex = all.findIndex(r => r.caseId === record.caseId && r.date === record.date);

    record.updatedAt = new Date().toISOString();
    record.pendingSync = true; // 標記為待同步至 Google

    if (existingIndex >= 0) {
      all[existingIndex] = record;
    } else {
      all.unshift(record);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(all));
    return record;
  }

  /**
   * 刪除特定日紀錄
   */
  deleteLocalRecord(caseId, date) {
    let all = this.getAllLocalRecords();
    all = all.filter(r => !(r.caseId === caseId && r.date === date));
    localStorage.setItem(this.storageKey, JSON.stringify(all));
  }

  /**
   * 同步單筆紀錄至 Google Apps Script 試算表
   */
  async syncRecordToGoogle(record) {
    const apiUrl = this.getApiUrl();
    if (!apiUrl) {
      return { success: false, reason: '未設定 Google 試算表 Web App 網址' };
    }

    try {
      const payload = {
        action: 'upsert',
        caseId: record.caseId,
        date: record.date,
        medTime: record.medTime,
        discomfort: record.discomfort,
        periods: record.periods
      };

      // 使用 fetch 送出 POST 請求
      // 由於 GAS Web App 重定向，使用 no-cors 或標準 text response
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const resText = await response.text();
      let resJson;
      try {
        resJson = JSON.parse(resText);
      } catch (err) {
        resJson = { status: 'success' };
      }

      // 同步成功，解除待同步標記
      record.pendingSync = false;
      this.updateSyncFlag(record.caseId, record.date, false);

      return { success: true, response: resJson };
    } catch (e) {
      console.warn('Sync to Google failed (will keep offline copy):', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * 一鍵批次同步所有待上傳資料
   */
  async syncAllPending() {
    const all = this.getAllLocalRecords();
    const pendingList = all.filter(r => r.pendingSync === true);
    
    if (pendingList.length === 0) {
      return { syncedCount: 0, message: '所有資料皆已是最新狀態' };
    }

    let successCount = 0;
    for (const rec of pendingList) {
      const result = await this.syncRecordToGoogle(rec);
      if (result.success) successCount++;
    }

    return {
      syncedCount: successCount,
      totalPending: pendingList.length
    };
  }

  /**
   * 測試 GAS 網址連線狀態
   */
  async testConnection(url) {
    const targetUrl = url || this.getApiUrl();
    if (!targetUrl) throw new Error('網址不得為空');

    const testUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=ping&t=' + Date.now();
    const response = await fetch(testUrl, { method: 'GET' });
    const text = await response.text();
    return JSON.parse(text);
  }

  /**
   * 更新本機特定資料的同步旗標
   */
  updateSyncFlag(caseId, date, isPending) {
    const all = this.getAllLocalRecords();
    const target = all.find(r => r.caseId === caseId && r.date === date);
    if (target) {
      target.pendingSync = isPending;
      localStorage.setItem(this.storageKey, JSON.stringify(all));
    }
  }
}

window.GoogleSync = new GoogleSync();
