/**
 * ============================================================================
 * 檔案名稱：js/case-manager.js
 * 模組職責：去識別化個案管理與 3 碼英數隨機亂碼生成器
 * 系統設計者 (System Architect & Designer)：Chiahua (chy23)
 * 設計說明：
 *   1. 嚴格去識別化：生成 3 碼英數混合代號 (排除 0, O, 1, I 等易混淆字元)。
 *   2. 隱私防護：本機備忘僅存於記錄者瀏覽器，不連網傳輸任何真實姓名。
 * ============================================================================
 */
class CaseManager {
  constructor() {
    this.storageKey = 'bos_cases';
    this.activeCaseKey = 'bos_active_case';
    // 排除易混淆字元 0, O, 1, I
    this.charPool = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  }

  /**
   * 隨機生成 3 碼英數混合字串 (組合數: 32^3 = 32,768 種)
   */
  generateRandomCaseId() {
    let result = '';
    const existing = this.getAllCases().map(c => c.id);
    let attempts = 0;
    
    do {
      result = '';
      for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * this.charPool.length);
        result += this.charPool[randomIndex];
      }
      attempts++;
    } while (existing.includes(result) && attempts < 100);

    return result;
  }

  /**
   * 取得所有個案清單
   */
  getAllCases() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read cases from localStorage', e);
      return [];
    }
  }

  /**
   * 新增個案
   * @param {string} customId - 可指定 3 碼或自動生成
   * @param {string} localNote - 本機備忘暱稱 (不對外傳輸)
   */
  createCase(customId = null, localNote = '') {
    const cases = this.getAllCases();
    const caseId = (customId || this.generateRandomCaseId()).toUpperCase().trim();

    if (caseId.length !== 3) {
      throw new Error('個案代號必須為 3 碼英數字元');
    }

    const existing = cases.find(c => c.id === caseId);
    if (existing) {
      return existing;
    }

    const newCase = {
      id: caseId,
      localNote: localNote || '',
      createdAt: new Date().toISOString()
    };

    cases.push(newCase);
    localStorage.setItem(this.storageKey, JSON.stringify(cases));
    this.setActiveCase(caseId);
    return newCase;
  }

  /**
   * 取得當前作用中的個案代號
   */
  getActiveCaseId() {
    let activeId = localStorage.getItem(this.activeCaseKey);
    const cases = this.getAllCases();
    
    if (!activeId || !cases.find(c => c.id === activeId)) {
      if (cases.length > 0) {
        activeId = cases[0].id;
        this.setActiveCase(activeId);
      } else {
        // 若無任何個案，自動產生第一位
        const firstCase = this.createCase();
        activeId = firstCase.id;
      }
    }
    return activeId;
  }

  /**
   * 設定當前作用中個案
   */
  setActiveCase(caseId) {
    localStorage.setItem(this.activeCaseKey, caseId);
  }

  /**
   * 更新個案本機備忘註記
   */
  updateLocalNote(caseId, note) {
    const cases = this.getAllCases();
    const target = cases.find(c => c.id === caseId);
    if (target) {
      target.localNote = note;
      localStorage.setItem(this.storageKey, JSON.stringify(cases));
    }
  }

  /**
   * 刪除個案
   * @param {string} caseId - 目標個案代號
   * @param {boolean} deleteRecords - 是否連帶刪除該個案的歷史觀察紀錄
   */
  deleteCase(caseId, deleteRecords = false) {
    let cases = this.getAllCases();
    cases = cases.filter(c => c.id !== caseId);
    localStorage.setItem(this.storageKey, JSON.stringify(cases));

    if (deleteRecords && window.GoogleSync) {
      let records = window.GoogleSync.getAllLocalRecords();
      records = records.filter(r => r.caseId !== caseId);
      localStorage.setItem(window.GoogleSync.storageKey, JSON.stringify(records));
    }

    // 若刪除的是當前個案，重設作用中個案
    if (this.getActiveCaseId() === caseId) {
      localStorage.removeItem(this.activeCaseKey);
      if (cases.length > 0) {
        this.setActiveCase(cases[0].id);
      } else {
        const next = this.createCase();
        this.setActiveCase(next.id);
      }
    }
  }

  /**
   * 取得個案詳細資訊 (包含歷史紀錄天數與筆數)
   */
  getCaseStats(caseId) {
    const allRecords = window.GoogleSync ? window.GoogleSync.getAllLocalRecords() : [];
    const caseRecords = allRecords.filter(r => r.caseId === caseId);
    let totalBehaviors = 0;
    caseRecords.forEach(r => {
      (r.periods || []).forEach(p => {
        (p.behaviors || []).forEach(b => totalBehaviors += (b.count || 0));
      });
    });

    return {
      recordDays: caseRecords.length,
      totalBehaviors: totalBehaviors,
      lastObservedDate: caseRecords[0] ? caseRecords[0].date : '尚未記錄'
    };
  }
}

// 導出全域物件
window.CaseManager = new CaseManager();
