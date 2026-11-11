/**
 * CaseManager: 負責個案管理與 3 碼英數隨機亂碼生成
 * 特點：
 * 1. 嚴格去識別化：生成 3 碼英數混合 (排除 0, O, 1, I 等易混淆字元)
 * 2. 多個案支援：可切換、新增、管理多位個案
 * 3. 隱私防護：真實姓名/暱稱僅存於記錄者本地瀏覽器，不連網傳輸
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
   */
  deleteCase(caseId) {
    let cases = this.getAllCases();
    cases = cases.filter(c => c.id !== caseId);
    localStorage.setItem(this.storageKey, JSON.stringify(cases));
    if (this.getActiveCaseId() === caseId) {
      localStorage.removeItem(this.activeCaseKey);
    }
  }
}

// 導出全域物件
window.CaseManager = new CaseManager();
