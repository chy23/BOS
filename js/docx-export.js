/**
 * DocxExport: 負責將行為紀錄與統計分析匯出為排版整齊的 Word 報告
 * 升級包含：多師觀察者註記、A-B-C 行為脈絡、正向良好行為、ADHD 三面向評估摘要
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

  exportDailyWord(record, summary) {
    if (!record) {
      alert('請先選擇或儲存當日紀錄！');
      return;
    }

    const caseId = this.escapeHtml(record.caseId || '未指定');
    const date = this.escapeHtml(record.date || new Date().toISOString().split('T')[0]);
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
      const posTag = (p.positiveCount > 0) ? `<br><b style="color:#D97706;">★ 正向良好行為：${p.positiveCount} 次</b>` : '';

      const aTags = (p.antecedentTags && p.antecedentTags.length > 0)
        ? `<div><small style="color:#2563EB;">【前事 A】</small> ${p.antecedentTags.map(t => `<span class="tag">${this.escapeHtml(t)}</span>`).join(' ')}</div>`
        : '';
      const cTags = (p.consequenceTags && p.consequenceTags.length > 0)
        ? `<div><small style="color:#D97706;">【後果 C】</small> ${p.consequenceTags.map(t => `<span class="tag-c">${this.escapeHtml(t)}</span>`).join(' ')}</div>`
        : '';
      const note = p.contextNote ? `<div style="color:#475569; font-size:9.5pt; margin-top:2pt;">備註：${this.escapeHtml(p.contextNote)}</div>` : '';

      const contextHtml = (aTags || cTags || note) ? `${aTags}${cTags}${note}` : '一般課堂常態';

      rowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold; background-color: #F8FAFC;">
            ${p.name}<br>${observerTag}
          </td>
          <td>${behaviorDesc.join('<br>')}${posTag}</td>
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
          <td><b>${r.code}</b> ${r.name}</td>
          <td style="color:#64748B;">${r.category}</td>
          <td style="text-align:center; font-weight:bold;">${r.count} 次</td>
          <td style="text-align:center;">${r.percentage}%</td>
        </tr>`).join('');
    }
    if (!rankingHtml) {
      rankingHtml = '<tr><td colspan="5" style="text-align:center;">當日無顯著干擾行為紀錄</td></tr>';
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

        <h2>一、 各節課堂行為歷程與 A-B-C 脈絡紀錄</h2>
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
      </body>
      </html>
    `;

    this.downloadWordFile(`BOS行為紀錄_${caseId}_${date}.doc`, htmlContent);
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
      { c: '+', n: '放空發呆' },
      { c: '↑', n: '尋找遺失物' },
      { c: '～', n: '身體扭動' },
      { c: '×', n: '干擾他人' },
      { c: '！', n: '未舉手搶話' },
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

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>行為時段分佈與累計分析報告 - ${caseId}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif; font-size: 11pt; color: #1E293B; line-height: 1.5; }
          h1 { text-align: center; font-size: 17pt; margin-bottom: 2pt; color: #0F172A; }
          h2 { font-size: 12.5pt; margin-top: 14pt; margin-bottom: 5pt; color: #1E3A8A; border-bottom: 1.5pt solid #1E3A8A; padding-bottom: 2pt; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
          .table th { background-color: #2563EB; color: #ffffff; padding: 5.5pt; border: 1pt solid #1D4ED8; font-size: 9.5pt; }
          .table td { padding: 5.5pt; border: 1pt solid #CBD5E1; font-size: 9.5pt; }
          .insight { background-color: #EFF6FF; border-left: 4pt solid #3B82F6; padding: 8pt 10pt; margin-top: 8pt; font-size: 10.5pt; }
        </style>
      </head>
      <body>
        <h1>學生行為觀察長期累計與時段熱區分析</h1>
        <p style="text-align:center; color:#64748B;">個案代號：<b>${caseId}</b> ｜ 分析範圍：<b>${filterDesc}</b> ｜ 觀察天數：<b>${summary.totalDays} 天</b></p>
        
        <h2>一、 核心結論摘要</h2>
        <div class="insight">
          ${summary.insightText}
        </div>

        <h2>二、 時段 × 行為代號 交叉分佈熱區表 (Heatmap)</h2>
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
      </body>
      </html>
    `;

    this.downloadWordFile(`BOS累計分析_${caseId}_${filterDesc}.doc`, htmlContent);
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
