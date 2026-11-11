/**
 * Analytics: 負責當日、當週與長期累計時段分佈分析
 * 包含行為排行、時段熱區 (Heatmap)、用藥關聯與自然語言摘要
 */
class Analytics {
  constructor() {
    this.behaviorCodes = [
      { code: '○', name: '玩文具、雜物、桌椅', color: '#3B82F6' },
      { code: '+', name: '放空、發呆', color: '#10B981' },
      { code: '↑', name: '尋找東西、遺失物', color: '#F59E0B' },
      { code: '～', name: '扭、抖動身體', color: '#8B5CF6' },
      { code: '×', name: '以動作、講話干擾附近人', color: '#EF4444' },
      { code: '！', name: '未舉手發言、搶話', color: '#EC4899' },
      { code: 'V', name: '無紀錄/常態良好', color: '#6B7280' }
    ];

    this.periods = [
      '早自習', '第一節', '第二節', '第三節', '第四節',
      '中午', '第五節', '第六節', '第七節'
    ];
  }

  /**
   * 依個案與日期範圍篩選記錄
   * @param {Array} allRecords - 全部原始日紀錄
   * @param {string} caseId - 個案代號
   * @param {string} filterType - 'today' | 'week' | 'all' | 'custom'
   * @param {Object} customRange - { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
   */
  filterRecords(allRecords, caseId, filterType = 'today', customRange = null) {
    if (!allRecords || allRecords.length === 0) return [];

    let filtered = allRecords.filter(r => r.caseId === caseId);

    const todayStr = new Date().toISOString().split('T')[0];

    if (filterType === 'today') {
      filtered = filtered.filter(r => r.date === todayStr);
    } else if (filterType === 'week') {
      // 取得過去 7 天或是本週（週一到週日）
      const now = new Date();
      const day = now.getDay() || 7; // 週一為 1，週日為 7
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const monStr = monday.toISOString().split('T')[0];
      const sunStr = sunday.toISOString().split('T')[0];

      filtered = filtered.filter(r => r.date >= monStr && r.date <= sunStr);
    } else if (filterType === 'custom' && customRange) {
      filtered = filtered.filter(r => r.date >= customRange.start && r.date <= customRange.end);
    }

    return filtered;
  }

  /**
   * 彙整核心分析結果
   */
  computeSummary(records) {
    if (!records || records.length === 0) {
      return {
        totalDays: 0,
        totalBehaviors: 0,
        ranking: [],
        periodTotals: {},
        heatmap: {},
        topBehavior: null,
        topPeriod: null,
        contextWordCloud: {},
        insightText: '目前選取範圍尚無觀察紀錄。'
      };
    }

    const totalDays = records.length;
    let totalBehaviors = 0;
    const countByCode = {};
    const countByPeriod = {};
    const heatmap = {}; // { period: { code: count } }
    const contextCounter = {};

    // 初始化
    this.behaviorCodes.forEach(b => {
      if (b.code !== 'V') countByCode[b.code] = 0;
    });

    this.periods.forEach(p => {
      countByPeriod[p] = 0;
      heatmap[p] = {};
      this.behaviorCodes.forEach(b => {
        heatmap[p][b.code] = 0;
      });
    });

    // 歷遍紀錄
    records.forEach(rec => {
      (rec.periods || []).forEach(p => {
        const periodName = p.name;
        // 統計情境標籤
        (p.contextTags || []).forEach(tag => {
          contextCounter[tag] = (contextCounter[tag] || 0) + 1;
        });

        (p.behaviors || []).forEach(b => {
          if (b.code && b.code !== 'V' && b.count > 0) {
            countByCode[b.code] = (countByCode[b.code] || 0) + b.count;
            countByPeriod[periodName] = (countByPeriod[periodName] || 0) + b.count;
            if (heatmap[periodName]) {
              heatmap[periodName][b.code] = (heatmap[periodName][b.code] || 0) + b.count;
            }
            totalBehaviors += b.count;
          }
        });
      });
    });

    // 計算排行
    const ranking = this.behaviorCodes
      .filter(b => b.code !== 'V')
      .map(b => {
        const count = countByCode[b.code] || 0;
        const percentage = totalBehaviors > 0 ? ((count / totalBehaviors) * 100).toFixed(1) : 0;
        return {
          code: b.code,
          name: b.name,
          color: b.color,
          count: count,
          percentage: Number(percentage)
        };
      })
      .sort((a, b) => b.count - a.count);

    // 計算時段排行
    const periodRanking = Object.keys(countByPeriod).map(p => ({
      period: p,
      count: countByPeriod[p]
    })).sort((a, b) => b.count - a.count);

    const topBehavior = ranking[0]?.count > 0 ? ranking[0] : null;
    const topPeriod = periodRanking[0]?.count > 0 ? periodRanking[0] : null;

    // 產生客觀文本摘要
    let insightText = '';
    if (totalBehaviors === 0) {
      insightText = `在選取的 ${totalDays} 天觀察中，該個案未出現明顯干擾或分心行為，課堂表現穩定。`;
    } else {
      const topContexts = Object.entries(contextCounter)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(e => e[0]);

      const contextDesc = topContexts.length > 0 
        ? `，常伴隨之課堂情境以【${topContexts.join('、')}】為主` 
        : '';

      insightText = `在選取的 ${totalDays} 天共記錄 ${totalBehaviors} 次行為。其中出現頻率最高為「${topBehavior.code} ${topBehavior.name}」（共 ${topBehavior.count} 次，佔比 ${topBehavior.percentage}%）；時段分佈最密集於「${topPeriod.period}」（累計 ${topPeriod.count} 次）${contextDesc}。`;
    }

    return {
      totalDays,
      totalBehaviors,
      ranking,
      periodTotals: countByPeriod,
      heatmap,
      topBehavior,
      topPeriod,
      contextCounter,
      insightText
    };
  }
}

window.Analytics = new Analytics();
