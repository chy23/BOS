/**
 * DocxExport: 負責將行為紀錄與統計分析匯出為排版整齊的 Word 報告
 * 支援 Word 雙擊開啟、原生表格樣式、列印最佳化與去識別化
 */
class DocxExport {
  /**
   * 匯出單日完整行為觀察紀錄 Word 檔
   */
  exportDailyWord(record, summary) {
    if (!record) {
      alert('請先選擇或儲存當日紀錄！');
      return;
    }

    const caseId = record.caseId || '未指定';
    const date = record.date || new Date().toISOString().split('T')[0];
    const medTime = record.medTime || '無 / 未記錄';
    const discomfort = record.discomfort || '無特殊異常';

    // 產生表格內容
    let rowsHtml = '';
    (record.periods || []).forEach(p => {
      let behaviorDesc = [];
      if (p.behaviors && p.behaviors.length > 0) {
        behaviorDesc = p.behaviors.map(b => `<b>${b.code}</b> ${b.name} (${b.count}次)`);
      } else {
        behaviorDesc = ['<i>V (無特別紀錄/表現穩定)</i>'];
      }

      const tags = (p.contextTags && p.contextTags.length > 0)
        ? p.contextTags.map(t => `<span class="tag">${t}</span>`).join(' ')
        : '一般常態';

      const note = p.contextNote ? `<br><small style="color:#555;">細節：${p.contextNote}</small>` : '';

      rowsHtml += `
        <tr>
          <td style="width: 15%; text-align: center; font-weight: bold; background-color: #F8FAFC;">${p.name}</td>
          <td style="width: 45%;">${behaviorDesc.join('<br>')}</td>
          <td style="width: 40%;">${tags}${note}</td>
        </tr>
      `;
    });

    // 產生排行內容
    let rankingHtml = '';
    if (summary && summary.ranking) {
      rankingHtml = summary.ranking
        .filter(r => r.count > 0)
        .map((r, i) => `<tr>
          <td style="text-align:center;">第 ${i + 1} 名</td>
          <td><b>${r.code}</b> ${r.name}</td>
          <td style="text-align:center;">${r.count} 次</td>
          <td style="text-align:center;">${r.percentage}%</td>
        </tr>`).join('');
    }
    if (!rankingHtml) {
      rankingHtml = '<tr><td colspan="4" style="text-align:center;">當日無顯著干擾行為紀錄</td></tr>';
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>學生課堂行為觀察紀錄表 - ${caseId}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', '微軟正黑體', Arial, sans-serif; font-size: 11pt; color: #1E293B; line-height: 1.5; }
          h1 { text-align: center; font-size: 18pt; margin-bottom: 4pt; color: #0F172A; }
          h2 { font-size: 13pt; margin-top: 14pt; margin-bottom: 6pt; color: #1E3A8A; border-bottom: 1.5pt solid #1E3A8A; padding-bottom: 3pt; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
          .meta-table td { padding: 5pt 8pt; border: 1pt solid #CBD5E1; }
          .meta-label { background-color: #F1F5F9; font-weight: bold; width: 18%; }
          .record-table { width: 100%; border-collapse: collapse; margin-bottom: 14pt; }
          .record-table th { background-color: #2563EB; color: #ffffff; padding: 6pt; border: 1pt solid #1D4ED8; font-size: 10.5pt; }
          .record-table td { padding: 6pt 8pt; border: 1pt solid #CBD5E1; vertical-align: top; }
          .tag { display: inline-block; background-color: #E2E8F0; padding: 2pt 5pt; border-radius: 3pt; font-size: 9.5pt; color: #334155; }
          .code-legend { background-color: #F8FAFC; border: 1pt dashed #94A3B8; padding: 8pt; margin-bottom: 12pt; font-size: 10pt; }
          .insight-box { background-color: #EFF6FF; border-left: 4pt solid #3B82F6; padding: 8pt 12pt; margin-top: 8pt; font-size: 10.5pt; }
          .footer-note { font-size: 9pt; color: #64748B; text-align: right; margin-top: 15pt; }
        </style>
      </head>
      <body>
        <h1>學生課堂行為觀察與情境脈絡紀錄表</h1>
        <div style="text-align:center; font-size:10pt; color:#64748B; margin-bottom:12pt;">
          （本表已去識別化處理，個案代號符合個資保護安全原則）
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

        <div class="code-legend">
          <b>紀錄簡易代號說明：</b><br>
          ○ 玩文具、雜物、桌椅 ｜ + 放空、發呆 ｜ ↑ 尋找東西、遺失物 ｜ ～ 扭、抖動身體<br>
          × 以動作、講話干擾附近人 ｜ ！ 未舉手發言、搶話 ｜ V 無紀錄/常態
        </div>

        <h2>一、 課堂行為與情境脈絡歷程</h2>
        <table class="record-table">
          <thead>
            <tr>
              <th style="width: 15%;">時段/節次</th>
              <th style="width: 45%;">行為代號與次數</th>
              <th style="width: 40%;">當下情境脈絡與環境事件</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <h2>二、 當日行為彙整與分析</h2>
        <table class="record-table">
          <thead>
            <tr>
              <th style="width: 15%;">排名</th>
              <th style="width: 45%;">行為類別</th>
              <th style="width: 20%;">發生次數</th>
              <th style="width: 20%;">佔比</th>
            </tr>
          </thead>
          <tbody>
            ${rankingHtml}
          </tbody>
        </table>

        <div class="insight-box">
          <b>觀察分析結論：</b><br>
          ${summary ? summary.insightText : '無詳細分析文字。'}
        </div>

        <div class="footer-note">
          匯出時間：${new Date().toLocaleString('zh-TW')} ｜ 系統：BOS 行為觀察紀錄系統
        </div>
      </body>
      </html>
    `;

    this.downloadWordFile(`BOS行為紀錄_${caseId}_${date}.doc`, htmlContent);
  }

  /**
   * 匯出多日/當週累計熱區與趨勢分析 Word 檔
   */
  exportWeeklyOrCumulativeWord(caseId, filterDesc, summary) {
    if (!summary) {
      alert('無有效分析數據！');
      return;
    }

    // 建立熱區矩陣 HTML
    const periods = ['早自習', '第一節', '第二節', '第三節', '第四節', '中午', '第五節', '第六節', '第七節'];
    const codes = [
      { c: '○', n: '玩文具' },
      { c: '+', n: '放空' },
      { c: '↑', n: '找東西' },
      { c: '～', n: '身體扭動' },
      { c: '×', n: '干擾他人' },
      { c: '！', n: '搶話發言' }
    ];

    let headerCols = codes.map(c => `<th style="text-align:center;">${c.c}<br><small>${c.n}</small></th>`).join('');
    let matrixRows = '';

    periods.forEach(p => {
      let cols = codes.map(c => {
        const val = (summary.heatmap && summary.heatmap[p] && summary.heatmap[p][c.c]) || 0;
        const bg = val > 5 ? '#FECACA' : val > 2 ? '#FED7AA' : val > 0 ? '#FEF08A' : '#FFFFFF';
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
          h1 { text-align: center; font-size: 18pt; margin-bottom: 4pt; color: #0F172A; }
          h2 { font-size: 13pt; margin-top: 14pt; margin-bottom: 6pt; color: #1E3A8A; border-bottom: 1.5pt solid #1E3A8A; padding-bottom: 3pt; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 14pt; }
          .table th { background-color: #2563EB; color: #ffffff; padding: 6pt; border: 1pt solid #1D4ED8; font-size: 10pt; }
          .table td { padding: 6pt; border: 1pt solid #CBD5E1; font-size: 10pt; }
          .insight { background-color: #EFF6FF; border-left: 4pt solid #3B82F6; padding: 10pt; margin-top: 10pt; font-size: 11pt; }
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
              <th style="width:14%; text-align:center;">時段總計</th>
            </tr>
          </thead>
          <tbody>
            ${matrixRows}
          </tbody>
        </table>

        <h2>三、 行為頻率排行榜</h2>
        <table class="table">
          <thead>
            <tr>
              <th style="width:15%;">排名</th>
              <th style="width:45%;">行為類別</th>
              <th style="width:20%; text-align:center;">累積次數</th>
              <th style="width:20%; text-align:center;">發生佔比</th>
            </tr>
          </thead>
          <tbody>
            ${summary.ranking.map((r, idx) => `
              <tr>
                <td style="text-align:center;">第 ${idx + 1} 名</td>
                <td><b>${r.code}</b> ${r.name}</td>
                <td style="text-align:center; font-weight:bold;">${r.count} 次</td>
                <td style="text-align:center;">${r.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    this.downloadWordFile(`BOS累計分析_${caseId}_${filterDesc}.doc`, htmlContent);
  }

  /**
   * 觸發瀏覽器下載
   */
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
