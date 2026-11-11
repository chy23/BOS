/**
 * GoogleSync: 負責本地資料管理與 Google Apps Script 雲端試算表雙向同步
 * 支援多科任老師跨載具共同記錄：節次級合併、即時載入雲端最新整日資料
 */
class GoogleSync {
  constructor() {
    this.storageKey = 'bos_daily_records';
    this.apiUrlKey = 'bos_gas_api_url';
    this.observerKey = 'bos_observer_role';
  }

  getApiUrl() {
    return localStorage.getItem(this.apiUrlKey) || '';
  }

  setApiUrl(url) {
    localStorage.setItem(this.apiUrlKey, (url || '').trim());
  }

  getObserverRole() {
    return localStorage.getItem(this.observerKey) || '導師';
  }

  setObserverRole(role) {
    localStorage.setItem(this.observerKey, (role || '').trim());
  }

  getAllLocalRecords() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading records', e);
      return [];
    }
  }

  getRecord(caseId, date) {
    const all = this.getAllLocalRecords();
    return all.find(r => r.caseId === caseId && r.date === date) || null;
  }

  saveLocalRecord(record) {
    let all = this.getAllLocalRecords();
    const existingIndex = all.findIndex(r => r.caseId === record.caseId && r.date === record.date);
    record.updatedAt = new Date().toISOString();
    record.pendingSync = true;

    if (existingIndex >= 0) {
      all[existingIndex] = record;
    } else {
      all.unshift(record);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(all));
    return record;
  }

  deleteLocalRecord(caseId, date) {
    let all = this.getAllLocalRecords();
    all = all.filter(r => !(r.caseId === caseId && r.date === date));
    localStorage.setItem(this.storageKey, JSON.stringify(all));
  }

  /**
   * 從 Google 試算表即時抓取最新合併資料 (包含其他科任老師的記錄)
   */
  async fetchCloudRecord(caseId, date) {
    const apiUrl = this.getApiUrl();
    if (!apiUrl) return { success: false, reason: '未設定 Web App 網址' };

    try {
      const url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}action=getRecord&caseId=${encodeURIComponent(caseId)}&date=${encodeURIComponent(date)}&t=${Date.now()}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'success' && data.record) {
        // 合併至本地
        this.saveLocalRecord(data.record);
        return { success: true, record: data.record };
      }
      return { success: false, reason: '雲端尚無此日紀錄' };
    } catch (e) {
      console.warn('Fetch cloud record failed:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * 同步紀錄至 Google Apps Script 試算表
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
        observer: this.getObserverRole(),
        periods: record.periods
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const resText = await response.text();
      let resJson;
      try {
        resJson = JSON.parse(resText);
      } catch (err) {
        resJson = { status: 'success' };
      }

      record.pendingSync = false;
      this.updateSyncFlag(record.caseId, record.date, false);

      return { success: true, response: resJson };
    } catch (e) {
      console.warn('Sync to Google failed (offline copy kept):', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * 單獨只同步某一節 (科任老師送出單一堂課時使用，精確合併)
   */
  async syncSinglePeriodToGoogle(caseId, date, periodData, medTime = '', discomfort = '') {
    const apiUrl = this.getApiUrl();
    if (!apiUrl) return { success: false, reason: '未設定 Web App 網址' };

    try {
      const payload = {
        action: 'upsert',
        caseId: caseId,
        date: date,
        medTime: medTime,
        discomfort: discomfort,
        observer: this.getObserverRole(),
        periods: [periodData] // 只傳此節
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * 同步單筆進階臨床紀錄 (ClassroomBehaviorRecord) 至 Google 試算表
   */
  async syncAdvancedRecordToGoogle(record) {
    const apiUrl = this.getApiUrl();
    if (!apiUrl) return { success: false, reason: '未設定 Web App 網址' };

    try {
      const cleanRecord = { ...record };
      delete cleanRecord._meta;
      const payload = {
        action: 'upsertAdvanced',
        observer: this.getObserverRole(),
        record: cleanRecord
      };

      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (window.ClinicalAdvanced) {
        window.ClinicalAdvanced.markSynced(record.record_id);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

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

    return { syncedCount: successCount, totalPending: pendingList.length };
  }

  async testConnection(url) {
    const targetUrl = url || this.getApiUrl();
    if (!targetUrl) throw new Error('網址不得為空');

    const testUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=ping&t=' + Date.now();
    const response = await fetch(testUrl, { method: 'GET' });
    const text = await response.text();
    return JSON.parse(text);
  }

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
