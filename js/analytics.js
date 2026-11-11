/**
 * Analytics: 負責當日、當週與長期累計時段分佈分析
 * 升級功能：
 * 1. 融入 ADHD 臨床三大核心面向 (注意力不足、過動、衝動) 與正向良好行為統計
 * 2. 結合 A-B-C 行為前事與後果脈絡聚合
 * 3. 支援跨科任老師觀察數據匯流分析
 */
class Analytics {
  constructor() {
    this.behaviorCodes = [
      { code: '○', name: '玩文具、雜物、桌椅', category: '注意力不足 (Inattention)', color: '#3B82F6' },
      { code: '+', name: '放空、發呆', category: '注意力不足 (Inattention)', color: '#10B981' },
      { code: '↑', name: '尋找東西、遺失物', category: '注意力不足 (Inattention)', color: '#F59E0B' },
      { code: '～', name: '扭、抖動身體', category: '過動現象 (Hyperactivity)', color: '#8B5CF6' },
      { code: '×', name: '以動作、講話干擾附近人', category: '衝動控制 (Impulsivity)', color: '#EF4444' },
      { code: '！', name: '未舉手發言、搶話', category: '衝動控制 (Impulsivity)', color: '#EC4899' },
      { code: '★', name: '正向良好適應行為', category: '正向行為 (Positive)', color: '#F59E0B' },
      { code: 'V', name: '無紀錄/常態良好', category: '常態穩定', color: '#6B7280' }
    ];

    this.periods = [
      '早自習', '第一節', '第二節', '第三節', '第四節',
      '中午', '第五節', '第六節', '第七節'
    ];
  }

  filterRecords(allRecords, caseId, filterType = 'today', customRange = null) {
    if (!allRecords || allRecords.length === 0) return [];

    let filtered = allRecords.filter(r => r.caseId === caseId);
    const todayStr = new Date().toISOString().split('T')[0];

    if (filterType === 'today') {
      filtered = filtered.filter(r => r.date === todayStr);
    } else if (filterType === 'week') {
      const now = new Date();
      const day = now.getDay() || 7;
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

  computeSummary(records) {
    if (!records || records.length === 0) {
      return {
        totalDays: 0,
        totalBehaviors: 0,
        totalPositive: 0,
        ranking: [],
        periodTotals: {},
        heatmap: {},
        topBehavior: null,
        topPeriod: null,
        adhdCategories: { inattention: 0, hyperactivity: 0, impulsivity: 0, positive: 0 },
        antecedentCounts: {},
        consequenceCounts: {},
        insightText: '目前選取範圍尚無觀察紀錄。'
      };
    }

    const totalDays = records.length;
    let totalBehaviors = 0;
    let totalPositive = 0;
    const countByCode = {};
    const countByPeriod = {};
    const heatmap = {};
    const antecedentCounts = {};
    const consequenceCounts = {};

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

    records.forEach(rec => {
      (rec.periods || []).forEach(p => {
        const periodName = p.name;
        
        // 正向行為次數
        const pos = Number(p.positiveCount || 0);
        totalPositive += pos;
        countByCode['★'] = (countByCode['★'] || 0) + pos;
        if (heatmap[periodName]) {
          heatmap[periodName]['★'] = (heatmap[periodName]['★'] || 0) + pos;
        }

        // A-B-C 前事與後果統計
        (p.antecedentTags || []).forEach(t => antecedentCounts[t] = (antecedentCounts[t] || 0) + 1);
        (p.consequenceTags || []).forEach(t => consequenceCounts[t] = (consequenceCounts[t] || 0) + 1);

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

    // ADHD 三大面向分類加總
    const adhdCategories = {
      inattention: (countByCode['○'] || 0) + (countByCode['+'] || 0) + (countByCode['↑'] || 0),
      hyperactivity: (countByCode['～'] || 0),
      impulsivity: (countByCode['×'] || 0) + (countByCode['！'] || 0),
      positive: totalPositive
    };

    // 排行榜 (排除常態 V 與正向 ★)
    const ranking = this.behaviorCodes
      .filter(b => b.code !== 'V' && b.code !== '★')
      .map(b => {
        const count = countByCode[b.code] || 0;
        const percentage = totalBehaviors > 0 ? ((count / totalBehaviors) * 100).toFixed(1) : 0;
        return {
          code: b.code,
          name: b.name,
          category: b.category,
          color: b.color,
          count: count,
          percentage: Number(percentage)
        };
      })
      .sort((a, b) => b.count - a.count);

    const periodRanking = Object.keys(countByPeriod).map(p => ({
      period: p,
      count: countByPeriod[p]
    })).sort((a, b) => b.count - a.count);

    const topBehavior = ranking[0]?.count > 0 ? ranking[0] : null;
    const topPeriod = periodRanking[0]?.count > 0 ? periodRanking[0] : null;

    // 產生臨床與教學分析結論
    let insightText = '';
    if (totalBehaviors === 0) {
      insightText = `在選取的 ${totalDays} 天觀察中，該個案整體課堂表現穩定，未出現顯著干擾或分心行為，並累計展現 ${totalPositive} 次正向良好適應行為。`;
    } else {
      const topAntecedents = Object.entries(antecedentCounts).sort((a,b) => b[1]-a[1]).slice(0, 2).map(e => e[0]);
      const triggerDesc = topAntecedents.length > 0 ? `；常見觸發前置事件(A)為【${topAntecedents.join('、')}】` : '';
      
      const dominantCategory = 
        (adhdCategories.inattention >= adhdCategories.hyperactivity && adhdCategories.inattention >= adhdCategories.impulsivity) ? '注意力維持困難 (佔最大比重)' :
        (adhdCategories.hyperactivity >= adhdCategories.impulsivity) ? '身體活動量偏高 (過動特徵顯著)' : '衝動抑制控制弱 (搶話與干擾同儕)';

      insightText = `選取的 ${totalDays} 天共記錄 ${totalBehaviors} 次目標行為。頻率最高為「${topBehavior.code} ${topBehavior.name}」（共 ${topBehavior.count} 次，佔比 ${topBehavior.percentage}%）；密集時段落在「${topPeriod.period}」（累計 ${topPeriod.count} 次）。依 ADHD 三面向評估以【${dominantCategory}】為主${triggerDesc}。期間觀察到 ${totalPositive} 次正向行為，建議以此作為代幣增強之切入點。`;
    }

    return {
      totalDays,
      totalBehaviors,
      totalPositive,
      ranking,
      periodTotals: countByPeriod,
      heatmap,
      topBehavior,
      topPeriod,
      adhdCategories,
      antecedentCounts,
      consequenceCounts,
      insightText
    };
  }
}

window.Analytics = new Analytics();
