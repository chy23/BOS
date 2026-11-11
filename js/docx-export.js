/**
 * ============================================================================
 * 檔案名稱：js/docx-export.js
 * 模組職責：行為觀察 Word 報表 (.doc) 與標準 ClassroomBehaviorRecord JSON 匯出引擎
 * 系統設計者 (System Architect & Designer)：Chiahua (chy23)
 * 設計說明：
 *   整合多師觀察者註記、課堂科目與型態、課後選填 A-B-C 脈絡、正向行為、
 *   以及進階模式之臨床疾病診斷鑑別映射報表，並內建 HTML 實體轉義防注入保護。
 * ============================================================================
 */
class DocxExport {
  /**
   * 資安轉義防護：防止 HTML Injection / XSS
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 匯出當日 Word 報告（自動整合原始速記資料 ＋ 當日進階臨床量化紀錄）
   */
  exportDailyWord(record, summary) {
    if (!record) {
      alert('請先選擇或儲存當日紀錄！');
      return;
    }

    const rawCaseId = record.caseId || '未指定';
    const rawDate = record.date || new Date().toISOString().split('T')[0];
    const caseId = this.escapeHtml(rawCaseId);
    const date = this.escapeHtml(rawDate);
    const medTime = this.escapeHtml(record.medTime || '無 / 未記錄');
    const discomfort = this.escapeHtml(record.discomfort || '無特殊異常');

    let rowsHtml = '';
    (record.periods || []).forEach(p => {
      let behaviorDesc = [];
      if (p.behaviors && p.behaviors.length > 0) {
        behaviorDesc = p.behaviors.filter(b => b.count > 0).map(b => `<b>${this.escapeHtml(b.code)}</b> ${this.escapeHtml(b.name)} (${b.count}次)`);
      }
      if (behaviorDesc.length === 0) {
        behaviorDesc = ['<i>V (常態穩定/無干擾)</i>'];
      }

      const observerTag = p.observer ? `<span class="teacher-tag">👩‍🏫 ${this.escapeHtml(p.observer)}</span>` : '<span class="teacher-tag">課堂教師</span>';
      const subjActTag = (p.subject || p.activityType)
        ? `<div style="margin-top:2pt;"><span class="tag">${this.escapeHtml(p.subject || '')}${p.subject && p.activityType ? ' · ' : ''}${this.escapeHtml(p.activityType || '')}</span></div>`
        : '';
      const posTag = (p.positiveCount > 0) ? `<br><b style="color:#D97706;">★ 正向良好行為：${p.positiveCount} 次</b>` : '';
      const intensityMap = { 1: '1-輕度(自我)', 2: '2-中度(鄰近)', 3: '3-重度(全班)' };
      const intTag = p.intensity
        ? `<br><span style="font-size:9pt; color:#B45309; font-weight:bold;">⚡ 干擾強度：${intensityMap[p.intensity] || p.intensity}</span>`
        : '';

      const aTags = (p.antecedentTags && p.antecedentTags.length > 0)
        ? `<div><small style="color:#2563EB;">【前事 A】</small> ${p.antecedentTags.map(t => `<span class="tag">${this.escapeHtml(t)}</span>`).join(' ')}</div>`
        : '';
      const cTags = (p.consequenceTags && p.consequenceTags.length > 0)
        ? `<div><small style="color:#D97706;">【後果 C】</small> ${p.consequenceTags.map(t => `<span class="tag-c">${this.escapeHtml(t)}</span>`).join(' ')}</div>`
        : '';
      const outTag = p.outcome
        ? `<div><small style="color:#047857;">【處遇成效】</small> <b style="color:#047857; font-size:9.5pt;">${this.escapeHtml(p.outcome)}</b></div>`
        : '';
      const note = p.contextNote ? `<div style="color:#475569; font-size:9.5pt; margin-top:2pt;">備註：${this.escapeHtml(p.contextNote)}</div>` : '';

      const contextHtml = (aTags || cTags || outTag || note) ? `${aTags}${cTags}${outTag}${note}` : '一般課堂常態';

      rowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold; background-color: #F8FAFC;">
            ${this.escapeHtml(p.name)}<br>${observerTag}${subjActTag}
          </td>
          <td>${behaviorDesc.join('<br>')}${intTag}${posTag}</td>
          <td>${contextHtml}</td>
        </tr>
      `;
    });

    let rankingHtml = '';
    if (summary && summary.ranking) {
      rankingHtml = summary.ranking
        .filter(r => r.count > 0)
        .map((r, i) => `<tr>
          <td style="text-align:center;">第 ${i + 1} 名</td>
          <td><b>${this.escapeHtml(r.code)}</b> ${this.escapeHtml(r.name)}</td>
          <td style="color:#64748B;">${this.escapeHtml(r.category)}</td>
          <td style="text-align:center; font-weight:bold;">${r.count} 次</td>
          <td style="text-align:center;">${r.percentage}%</td>
        </tr>`).join('');
    }
    if (!rankingHtml) {
      rankingHtml = '<tr><td colspan="5" style="text-align:center;">當日無顯著干擾行為紀錄</td></tr>';
    }

    // 檢查當日是否有進階臨床量化紀錄
    let advancedSectionHtml = '';
    if (window.ClinicalAdvanced) {
      const advRecords = window.ClinicalAdvanced.getRecordsByFilter(rawCaseId, rawDate, 'today');
      if (advRecords.length > 0) {
        const advAnalysis = window.ClinicalAdvanced.analyzeClinicalRecords(advRecords);
        advancedSectionHtml = this.buildAdvancedReportSectionHtml(advRecords, advAnalysis);
      }
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>學生行為觀察與情境脈絡紀錄表 - ${caseId}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif; font-size: 11pt; color: #1E293B; line-height: 1.5; }
          h1 { text-align: center; font-size: 17pt; margin-bottom: 2pt; color: #0F172A; }
          h2 { font-size: 12.5pt; margin-top: 14pt; margin-bottom: 5pt; color: #1E3A8A; border-bottom: 1.5pt solid #1E3A8A; padding-bottom: 2pt; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; }
          .meta-table td { padding: 4.5pt 7pt; border: 1pt solid #CBD5E1; font-size: 10.5pt; }
          .meta-label { background-color: #F1F5F9; font-weight: bold; width: 18%; }
          .record-table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
          .record-table th { background-color: #2563EB; color: #ffffff; padding: 5.5pt; border: 1pt solid #1D4ED8; font-size: 10pt; }
          .record-table td { padding: 5.5pt 7pt; border: 1pt solid #CBD5E1; vertical-align: top; font-size: 10pt; }
          .tag { display: inline-block; background-color: #DBEAFE; color: #1E40AF; padding: 1.5pt 4pt; border-radius: 2pt; font-size: 9pt; }
          .tag-c { display: inline-block; background-color: #FEF3C7; color: #92400E; padding: 1.5pt 4pt; border-radius: 2pt; font-size: 9pt; }
          .teacher-tag { display: inline-block; background-color: #E2E8F0; color: #334155; padding: 1pt 4pt; border-radius: 3pt; font-size: 8.5pt; margin-top: 2pt; }
          .insight-box { background-color: #EFF6FF; border-left: 4pt solid #3B82F6; padding: 8pt 10pt; margin-top: 8pt; font-size: 10.5pt; }
        </style>
      </head>
      <body>
        <h1>學生課堂行為觀察與情境脈絡紀錄表 (多師協同版)</h1>
        <div style="text-align:center; font-size:9.5pt; color:#64748B; margin-bottom:10pt;">
          （已完成個資去識別化，符合特教輔導與醫療評估參考規範）
        </div>

        <table class="meta-table">
          <tr>
            <td class="meta-label">個案代號</td>
            <td style="font-weight:bold; font-size:12pt; color:#2563EB;">${caseId}</td>
            <td class="meta-label">觀察日期</td>
            <td>${date}</td>
          </tr>
          <tr>
            <td class="meta-label">當日用藥時間</td>
            <td>${medTime}</td>
            <td class="meta-label">身體不適紀錄</td>
            <td>${discomfort}</td>
          </tr>
        </table>

        <h2>一、 各節課堂行為歷程與 A-B-C 脈絡紀錄 (原始速記資料)</h2>
        <table class="record-table">
          <thead>
            <tr>
              <th style="width: 18%;">時段/節次與記錄老師</th>
              <th style="width: 42%;">行為代號與次數 (B)</th>
              <th style="width: 40%;">前置前事 (A) 與後續反應 (C)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <h2>二、 行為頻率與 ADHD 面向排行榜</h2>
        <table class="record-table">
          <thead>
            <tr>
              <th style="width: 12%;">排名</th>
              <th style="width: 38%;">行為項目</th>
              <th style="width: 26%;">所屬面向</th>
              <th style="width: 12%;">次數</th>
              <th style="width: 12%;">佔比</th>
            </tr>
          </thead>
          <tbody>
            ${rankingHtml}
          </tbody>
        </table>

        <div class="insight-box">
          <b>觀察結論與輔導建議：</b><br>
          ${summary ? summary.insightText : '無詳細分析。'}
        </div>

        ${advancedSectionHtml}
      </body>
      </html>
    `;

    this.downloadWordFile(`BOS行為紀錄_${caseId}_${date}.doc`, htmlContent);
  }

  /**
   * 建構進階臨床量化與疾病鑑別映射 HTML 區塊
   */
  buildAdvancedReportSectionHtml(records, analysis) {
    if (!records || records.length === 0) return '';

    const eventRows = records.map(r => {
      const timePart = (r.timestamp || '').split('T')[1]?.substring(0, 5) || '';
      const datePart = (r.timestamp || '').split('T')[0] || '';
      const condTags = (r.behavior?.related_conditions || []).map(c => {
        const meta = window.ClinicalAdvanced?.RELATED_CONDITIONS_META[c];
        return `<span class="tag">${this.escapeHtml(meta ? meta.short : c)}</span>`;
      }).join(' ');

      const intensityMap = { 1: '1-輕度(自我)', 2: '2-中度(鄰近)', 3: '3-重度(全班)' };
      const intStr = intensityMap[r.metrics?.intensity] || r.metrics?.intensity;

      const periodDisplay = r.context?.period_label || `第 ${Number(r.context?.period || 1)} 節`;

      return `
        <tr>
          <td style="font-size:9pt;">
            <b>${this.escapeHtml(r.record_id)}</b><br>
            ${this.escapeHtml(datePart)} ${this.escapeHtml(timePart)}<br>
            ${this.escapeHtml(periodDisplay)} · <b>${this.escapeHtml(r.context?.subject)}</b><br>
            <span style="color:#475569;">${this.escapeHtml(r.context?.activity_type)}</span>
            ${r.context?.environment_notes ? `<br><small style="color:#64748B;">環境：${this.escapeHtml(r.context.environment_notes)}</small>` : ''}
          </td>
          <td style="font-size:9pt;">
            <b>[${this.escapeHtml(r.antecedent?.category || 'NONE')}]</b><br>
            ${this.escapeHtml(r.antecedent?.details || '無明顯外部前因')}
          </td>
          <td style="font-size:9pt;">
            <b style="color:#1E3A8A;">${this.escapeHtml(r.behavior?.target_label || r.behavior?.target_code)}</b><br>
            <small style="color:#64748B;">向度：${this.escapeHtml(r.behavior?.category)}</small><br>
            ${condTags}
          </td>
          <td style="text-align:center; font-size:9pt;">
            頻率：<b>${Number(r.metrics?.frequency || 1)}</b> 次<br>
            時長：<b>${Number(r.metrics?.duration_minutes || 0)}</b> 分<br>
            強度：<b>${this.escapeHtml(intStr)}</b>
          </td>
          <td style="font-size:9pt;">
            <b>處置：</b>${this.escapeHtml(r.intervention?.strategy_label)}<br>
            <b>成效：</b><span style="color:#047857;">${this.escapeHtml(r.intervention?.outcome_label)}</span>
            ${r.qualitative_notes ? `<br><div style="margin-top:3pt; color:#334155; background:#F8FAFC; padding:3pt;">質性備註：${this.escapeHtml(r.qualitative_notes)}</div>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    const diagRows = (analysis.rankedBehaviors || []).map(b => `
      <tr>
        <td><b>${this.escapeHtml(b.code)}</b> ${this.escapeHtml(b.shortName)} (${b.count}次 / ${b.duration}分)</td>
        <td style="color:#1D4ED8; font-weight:bold;">${this.escapeHtml(b.primary)}</td>
        <td>${this.escapeHtml(b.differential)}</td>
        <td style="font-size:9pt; color:#334155;">${this.escapeHtml(b.clinicalKey)}</td>
      </tr>
    `).join('');

    const condSummaryRows = (analysis.rankedConditions || []).map((c, idx) => `
      <tr>
        <td style="text-align:center;">#${idx + 1}</td>
        <td><b>${this.escapeHtml(c.label)}</b> (<code>${this.escapeHtml(c.code)}</code>)</td>
        <td style="text-align:center; font-weight:bold;">${c.count} 次關聯</td>
        <td style="text-align:center; font-weight:bold; color:#2563EB;">${c.weightedScore}</td>
      </tr>
    `).join('');

    return `
      <h2>三、 進階模式行為量化紀錄明細 (ClassroomBehaviorRecord Schema)</h2>
      <table class="record-table">
        <thead>
          <tr>
            <th style="width:20%;">紀錄編號 / 課堂情境</th>
            <th style="width:18%;">前因與誘發因子 (A)</th>
            <th style="width:22%;">核心外顯行為與關聯標籤 (B)</th>
            <th style="width:15%;">量化指標 (Metrics)</th>
            <th style="width:25%;">介入處置與成效 (C) / 質性觀察</th>
          </tr>
        </thead>
        <tbody>
          ${eventRows}
        </tbody>
      </table>

      <h2>四、 行為代碼與臨床疾病診斷鑑別映射分析</h2>
      <table class="record-table">
        <thead>
          <tr>
            <th style="width:22%;">觀察到之行為代碼</th>
            <th style="width:22%;">首要指向疾病 (Primary)</th>
            <th style="width:22%;">鑑別診斷與共病 (Differential)</th>
            <th style="width:34%;">臨床鑑別關鍵點</th>
          </tr>
        </thead>
        <tbody>
          ${diagRows}
        </tbody>
      </table>

      <h2>五、 臨床關聯障礙標籤 (related_conditions) 指標統計</h2>
      <table class="record-table">
        <thead>
          <tr>
            <th style="width:12%;">排序</th>
            <th style="width:48%;">臨床關聯障礙 / 疾病指標</th>
            <th style="width:20%;">觸發事件數</th>
            <th style="width:20%;">強度加權指數</th>
          </tr>
        </thead>
        <tbody>
          ${condSummaryRows || '<tr><td colspan="4" style="text-align:center;">尚無關聯指標資料</td></tr>'}
        </tbody>
      </table>
      <div style="font-size:9pt; color:#64748B; margin-top:4pt;">
        註：本表之臨床診斷與鑑別疾病映射僅供教育現場 IEP 團隊、特教篩檢與醫療轉介前之行為觀察量化溝通參考，正式醫療診斷須由兒童青少年精神科/心智科專科醫師綜合臨床評估判定。
      </div>
    `;
  }

  /**
   * 獨立匯出：進階臨床行為量化與鑑別評估專項 Word 報告
   */
  exportAdvancedClinicalWord(studentId, records, filterDesc = '進階臨床觀察') {
    if (!records || records.length === 0) {
      alert('目前尚無進階臨床行為紀錄可匯出！請先在進階模式新增紀錄或載入範例。');
      return;
    }

    const safeStudentId = this.escapeHtml(studentId || '未指定');
    const safeDesc = this.escapeHtml(filterDesc);
    const analysis = window.ClinicalAdvanced.analyzeClinicalRecords(records);
    const advHtml = this.buildAdvancedReportSectionHtml(records, analysis);

    const antRows = (analysis.rankedAntecedents || []).map(a => `
      <tr>
        <td><b>${this.escapeHtml(a.name)}</b> (<code>${this.escapeHtml(a.code)}</code>)</td>
        <td style="text-align:center; font-weight:bold;">${a.count} 次</td>
        <td>${this.escapeHtml(a.examples)}</td>
        <td style="color:#1E3A8A; font-weight:bold;">${this.escapeHtml(a.mechanism)}</td>
      </tr>
    `).join('');

    const stratRows = (analysis.strategyEffectiveness || []).map(s => {
      const rate = s.total > 0 ? Math.round(((s.immediate + s.transient * 0.5) / s.total) * 100) : 0;
      return `
        <tr>
          <td><b>${this.escapeHtml(s.label)}</b></td>
          <td style="text-align:center;">${s.total} 次</td>
          <td style="text-align:center; color:#047857; font-weight:bold;">${s.immediate} 次</td>
          <td style="text-align:center; color:#2563EB;">${s.transient} 次</td>
          <td style="text-align:center; color:#D97706;">${s.noEffect} 次</td>
          <td style="text-align:center; color:#E11D48; font-weight:bold;">${s.escalation} 次</td>
          <td style="text-align:center; font-weight:bold;">${rate}%</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>進階臨床行為量化與鑑別評估報告 - ${safeStudentId}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif; font-size: 10.5pt; color: #1E293B; line-height: 1.5; }
          h1 { text-align: center; font-size: 16.5pt; margin-bottom: 2pt; color: #0F172A; }
          h2 { font-size: 12pt; margin-top: 14pt; margin-bottom: 5pt; color: #1E3A8A; border-bottom: 1.5pt solid #1E3A8A; padding-bottom: 2pt; }
          .record-table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; }
          .record-table th { background-color: #1E3A8A; color: #ffffff; padding: 5pt; border: 1pt solid #1E40AF; font-size: 9.5pt; }
          .record-table td { padding: 5pt 6pt; border: 1pt solid #CBD5E1; vertical-align: top; font-size: 9.5pt; }
          .tag { display: inline-block; background-color: #DBEAFE; color: #1E40AF; padding: 1pt 3.5pt; border-radius: 2pt; font-size: 8.5pt; margin-right: 2pt; }
          .summary-box { background-color: #F8FAFC; border: 1pt solid #CBD5E1; padding: 8pt 10pt; margin-bottom: 10pt; }
        </style>
      </head>
      <body>
        <h1>國小課堂行為觀察量化與鑑別評估報告 (進階模式)</h1>
        <p style="text-align:center; color:#475569; font-size:9.5pt;">
          去識別化學生代碼：<b>${safeStudentId}</b> ｜ 範圍：<b>${safeDesc}</b> ｜ 總事件數：<b>${analysis.totalEvents} 筆</b> ｜ 累積持續時間：<b>${analysis.totalDuration} 分鐘</b> ｜ 平均干擾強度：<b>${analysis.avgIntensity} / 3.0</b>
        </p>

        ${advHtml}

        <h2>六、 誘發因子 (Antecedents) 與疾病機制歸因分析</h2>
        <table class="record-table">
          <thead>
            <tr>
              <th style="width:24%;">誘發分類</th>
              <th style="width:10%;">出現次數</th>
              <th style="width:33%;">觸發情境範例</th>
              <th style="width:33%;">最可能關聯的疾病機制</th>
            </tr>
          </thead>
          <tbody>
            ${antRows || '<tr><td colspan="4" style="text-align:center;">尚無前因資料</td></tr>'}
          </tbody>
        </table>

        <h2>七、 教師介入處置策略 (Intervention) 成效分析矩陣</h2>
        <table class="record-table">
          <thead>
            <tr>
              <th style="width:28%;">介入處置策略</th>
              <th style="width:12%;">使用次數</th>
              <th style="width:12%;">立即改善</th>
              <th style="width:12%;">短暫改善</th>
              <th style="width:12%;">毫無反應</th>
              <th style="width:12%;">抗拒加劇</th>
              <th style="width:12%;">綜合有效率</th>
            </tr>
          </thead>
          <tbody>
            ${stratRows || '<tr><td colspan="7" style="text-align:center;">尚無介入策略資料</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const dateTag = new Date().toISOString().split('T')[0];
    this.downloadWordFile(`BOS進階臨床鑑別報告_${safeStudentId}_${dateTag}.doc`, htmlContent);
  }

  /**
   * 匯出符合 Draft 2020-12 ClassroomBehaviorRecord Schema 的標準 JSON 檔案
   */
  exportAdvancedJson(studentId, records) {
    if (!records || records.length === 0) {
      alert('目前尚無進階臨床紀錄可匯出！');
      return;
    }
    // 剝除內部 _meta 欄位，確保 100% 符合 JSON Schema 規範
    const cleanRecords = records.map(r => {
      const copy = { ...r };
      delete copy._meta;
      return copy;
    });

    const jsonString = JSON.stringify(cleanRecords.length === 1 ? cleanRecords[0] : cleanRecords, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateTag = new Date().toISOString().split('T')[0].replace(/-/g, '');
    a.download = `ClassroomBehaviorRecord_${studentId || 'ALL'}_${dateTag}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportWeeklyOrCumulativeWord(caseId, filterDesc, summary) {
    if (!summary) {
      alert('無有效分析數據！');
      return;
    }

    const safeCaseId = this.escapeHtml(caseId || '未指定');
    const safeFilterDesc = this.escapeHtml(filterDesc || '觀察區間');

    const periods = ['早自習', '第一節', '第二節', '第三節', '第四節', '中午', '第五節', '第六節', '第七節'];
    const columns = [
      { c: '○', n: '玩文具雜物' },
      { c: '+', n: '放空/拖延' },
      { c: '↑', n: '尋找遺失物' },
      { c: '～', n: '身體扭動' },
      { c: '△', n: '擅自離座' },
      { c: '×', n: '干擾他人' },
      { c: '！', n: '未舉手搶話' },
      { c: '＃', n: '情緒抗拒/拒寫' },
      { c: '⚡', n: '怪聲/抽動' },
      { c: '★', n: '★ 正向好行為' }
    ];

    let headerCols = columns.map(c => `<th style="text-align:center; padding: 6pt;">${c.n}</th>`).join('');
    let matrixRows = '';

    periods.forEach(p => {
      let cols = columns.map(col => {
        const c = col.c;
        const val = (summary.heatmap && summary.heatmap[p] && summary.heatmap[p][c]) || 0;
        let bg = '#FFFFFF';
        if (c === '★') {
          bg = val > 0 ? '#DCFCE7' : '#FFFFFF';
        } else {
          bg = val > 5 ? '#FECACA' : val > 2 ? '#FED7AA' : val > 0 ? '#FEF08A' : '#FFFFFF';
        }
        return `<td style="text-align:center; background-color: ${bg}; font-weight: ${val > 0 ? 'bold' : 'normal'};">${val}</td>`;
      }).join('');

      const pTotal = summary.periodTotals ? (summary.periodTotals[p] || 0) : 0;
      matrixRows += `
        <tr>
          <td style="text-align:center; font-weight:bold; background-color:#F8FAFC;">${p}</td>
          ${cols}
          <td style="text-align:center; font-weight:bold; background-color:#F1F5F9;">${pTotal}</td>
        </tr>
      `;
    });

    // 若該個案也有進階紀錄，一併附加於累計報告尾端
    let advSection = '';
    if (window.ClinicalAdvanced) {
      const advRecords = window.ClinicalAdvanced.getRecordsByFilter(caseId, null, 'all');
      if (advRecords.length > 0) {
        const advAnalysis = window.ClinicalAdvanced.analyzeClinicalRecords(advRecords);
        advSection = this.buildAdvancedReportSectionHtml(advRecords, advAnalysis);
      }
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>行為時段分佈與累計分析報告 - ${safeCaseId}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif; font-size: 11pt; color: #1E293B; line-height: 1.5; }
          h1 { text-align: center; font-size: 17pt; margin-bottom: 2pt; color: #0F172A; }
          h2 { font-size: 12.5pt; margin-top: 14pt; margin-bottom: 5pt; color: #1E3A8A; border-bottom: 1.5pt solid #1E3A8A; padding-bottom: 2pt; }
          .table, .record-table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
          .table th, .record-table th { background-color: #2563EB; color: #ffffff; padding: 5.5pt; border: 1pt solid #1D4ED8; font-size: 9.5pt; }
          .table td, .record-table td { padding: 5.5pt; border: 1pt solid #CBD5E1; font-size: 9.5pt; vertical-align: top; }
          .tag { display: inline-block; background-color: #DBEAFE; color: #1E40AF; padding: 1pt 3.5pt; border-radius: 2pt; font-size: 8.5pt; margin-right: 2pt; }
          .insight { background-color: #EFF6FF; border-left: 4pt solid #3B82F6; padding: 8pt 10pt; margin-top: 8pt; font-size: 10.5pt; }
        </style>
      </head>
      <body>
        <h1>學生行為觀察長期累計與時段熱區分析</h1>
        <p style="text-align:center; color:#64748B;">個案代號：<b>${safeCaseId}</b> ｜ 分析範圍：<b>${safeFilterDesc}</b> ｜ 觀察天數：<b>${summary.totalDays} 天</b></p>
        
        <h2>一、 核心結論摘要</h2>
        <div class="insight">
          ${summary.insightText}
        </div>

        <h2>二、 時段 × 行為項目 交叉分佈熱區表 (Heatmap)</h2>
        <table class="table">
          <thead>
            <tr>
              <th style="width:16%;">節次/時段</th>
              ${headerCols}
              <th style="width:14%; text-align:center;">干擾小計</th>
            </tr>
          </thead>
          <tbody>
            ${matrixRows}
          </tbody>
        </table>

        ${advSection}
      </body>
      </html>
    `;

    this.downloadWordFile(`BOS累計分析_${safeCaseId}_${safeFilterDesc}.doc`, htmlContent);
  }

  downloadWordFile(filename, html) {
    const blob = new Blob(['\ufeff' + html], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

window.DocxExport = new DocxExport();
