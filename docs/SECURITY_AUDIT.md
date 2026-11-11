# BOS 行為觀察速記系統 —— 資安與個資隱私深度稽核報告 (Security & Privacy Audit)

本系統（Behavior Observation System, BOS）主要服務於國中小特教、資源班、輔導室及普通班教師，針對具有情緒、注意力或行為困擾（如 ADHD）之學生進行課堂行為觀察。

由於學生輔導與身心行為特徵屬於《個人資料保護法》第 6 條之**特種個人資料（醫療、健康檢查及身心障礙等敏感資訊）**，本系統在系統架構、資料傳輸、雲端儲存及防護代碼層面，均採取高規格的資安防護設計。

---

## 🛡️ 一、 個人資料保護與去識別化機制 (Privacy & De-identification)

### 1. 3 碼英數亂碼去識別化 (Pseudonymization / De-identification)
* **設計規格**：系統自動由 32 個高辨識字元池（排除易混淆之 `0`, `O`, `1`, `I`）隨機生成 3 位數英數亂碼代號（例如 `A7K`、`M9X`，組合數達 $32^3 = 32,768$ 種）。
* **個資法規遵循**：
  * 符合臺灣《個人資料保護法》及歐盟《GDPR》第 4(5) 條之去識別化（Pseudonymisation）標準。
  * **零個資傳輸原則**：在前端傳輸至 Google Apps Script 試算表、以及匯出的 Word 報表中，**絕不收集或傳送**學生姓名、身分證字號、學號、座號或照片。
  * **密鑰表（Codebook）物理隔離**：即使 Google 試算表遭到未授權檢視，未持有代碼對照表之第三方亦無法對號入座還原學生身分。
* **本地備忘本機隔離 (Local Isolation)**：
  * 老師若為便於辨認而在平板上自訂個案暱稱或本機備忘，該資料僅儲存在教師平板的瀏覽器 `localStorage` 中，**嚴格禁止傳輸至任何雲端 API**。

### 2. 資料刪除與被遺忘權 (Right to Erasure)
* 提供完整「個案刪除管理機制」：
  * 教師可一鍵刪除已結案或離校之個案代號。
  * 支援同步勾選「徹底清除此個案在本地及雲端的歷史行為觀察數據」，落實法規要求之資料生命週期管理與資料擦除權。

---

## 🔒 二、 資料傳輸與網路通訊安全 (Transmission Security)

* **全程強制 TLS/HTTPS 加密**：
  * 前端託管於 GitHub Pages，強制啟用 HTTPS（支援 TLS 1.2 及 TLS 1.3），杜絕降級攻擊（Downgrade Attack）。
  * 平板端與 Google Apps Script Web App 之間的雙向傳輸，全程受到 Google 官方頂級 SSL/TLS 憑證加密保護。
* **中間人攻擊（MitM）免疫**：
  * 學校校園公用 Wi-Fi、教育部學術網路或行動網路嗅探工具均無法側錄或還原傳輸中的行為次數與情境紀錄。
* **跨來源資源共享 (CORS) 安全處置**：
  * API 採用 POST / JSON 負載傳輸，在 Apps Script 端點嚴格以標準 JSON 封裝回應，無可被惡意利用之 Callback 注入漏洞。

---

## ☁️ 三、 雲端架構與試算表防禦 (Cloud Security & Formula Injection)

### 1. 數據主權歸屬 (Data Sovereignty)
* **零外部第三方商業伺服器**：
  * 系統無架設中央伺服器，資料直接由瀏覽器發送至「使用者自己建立的 Google 雲端試算表」。
  * 學校或教師保有 100% 的資料主權，完全排除商業資料庫外洩或被 AI 模型未授權訓練之疑慮。

### 2. 試算表公式注入防禦 (CWE-1236: CSV/Spreadsheet Formula Injection)
* **潛在風險**：在試算表中，若文字欄位以 `=`, `+`, `-`, `@` 等字元開頭，可能觸發試算表自動將其視為公式執行（例如 `=HYPERLINK()` 或 `=IMPORTXML()` 嘗試回傳外部惡意網址）。
* **已部署防禦（Code.gs）**：
  ```javascript
  function sanitizeCell(val) {
    if (typeof val === 'string') {
      val = val.trim();
      if (/^[=+\-@]/.test(val)) {
        return "'" + val; // 強制加上單引號，轉義為純文字儲存
      }
    }
    return val;
  }
  ```
  在寫入 Google 試算表時，所有觀察者名稱、行為備註、前事/後果標籤均經由 `sanitizeCell()` 嚴格轉義，徹底封堵公式注入風險。

### 3. 後端輸入格式嚴格驗證 (Backend Schema Validation)
* **驗證機制**：
  * 個案代號：強制轉大寫、過濾非法字元、長度嚴格限制為 3 碼英數（`caseId.length === 3`）。
  * 日期格式：正規表達式嚴格檢驗 `/^\d{4}-\d{2}-\d{2}$/`。
  * 異常請求將直接回應 HTTP 400 Bad Request，阻斷惡意或破損資料寫入試算表。

---

## 💻 四、 客戶端安全與 XSS 防護 (Client-Side & Export Security)

### 1. 報表匯出與跨站腳本防護 (XSS Defense in Word Export)
* **潛在風險**：在 Word (`.doc`) 匯出功能中，若包含教師輸入之情境備註（`contextNote`），若未過濾 HTML 標籤可能造成格式錯亂或腳本注入。
* **已部署防禦（docx-export.js）**：
  ```javascript
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  ```
  所有動態文字（個案代碼、教師角色、備註內容、A-B-C 標籤）在組裝報表 HTML 前均完成實體轉義。

### 2. 瀏覽器沙盒與公用平板防護
* **同源政策（Same-Origin Policy）**：
  * 本地儲存 `localStorage` 受限於同源沙盒，其他網址之網頁無法跨站讀取本系統資料。
* **現場操作建議（給學校資訊與教師）**：
  * 公用平板設備應設定螢幕鎖定密碼或 Face/Touch ID。
  * 建議定期於瀏覽器設定中清除網站資料，或在每學期末利用系統「刪除個案」功能清除本地快取。

---

## 👥 五、 多師協同之資料一致性防護 (Collaborative Concurrency)

* **節次級細粒度更新 (Period-Level Merge Upsert)**：
  * 傳統試算表覆寫常會因科任老師送出紀錄而把導師早上的紀錄洗掉。
  * 本系統 Google Apps Script 採用「精準刪除並插入（Targeted Merge）」架構：
    * 僅針對「同個案 + 同日期 + 本次更新的節次」進行置換。
    * 其他任課老師已記錄的節次完整予以保留，大幅提升資料完整性與併發協同安全性。

---

## 📊 六、 綜合風險評級摘要矩陣

| 評估面向 | 風險等級 | 威脅描述 | 防禦對策與落實現況 |
| :--- | :---: | :--- | :--- |
| **學生特種個資洩漏** | 🟢 **極低** | 身心行為記錄遭識別至特定學生 | 強制 3 碼英數隨機代碼去識別化；雲端與報表零個資傳輸 |
| **網路傳輸攔截竊聽** | 🟢 **極低** | 公用 Wi-Fi 封包嗅探 | GitHub Pages & Google Apps Script 100% 強制 TLS 1.3 HTTPS 加密 |
| **試算表公式注入攻擊** | 🟢 **極低** | 備註開頭輸入惡意試算表公式 | `Code.gs` 加入 `sanitizeCell()` 轉義 `=+\-@` 字元 |
| **跨站腳本攻擊 (XSS)** | 🟢 **極低** | 匯出 Word 或顯示備註時腳本注入 | `docx-export.js` 實施嚴格 HTML Entity 轉義 |
| **多師協同資料覆寫** | 🟢 **極低** | 科任老師存檔意外覆寫導師紀錄 | 節次級微更新架構（Period-level Atomic Upsert），互不干擾 |
| **數據主權與第三方外洩**| 🟢 **極低** | 商業 SaaS 平台被駭或模型訓練 | 零外部伺服器，100% 寫入教師個人 Google Drive |
| **公用平板本機遺留** | 🟡 **低** | 其他學生或外部人員拿起公用平板檢視 | 需配合校園設備管制（螢幕鎖）與系統一鍵清空/刪除個案功能 |
