# TASK_BRIEF: Phase 1.5 — Patient Selection (勾選病患匯出)

**Parent:** `TASK_BRIEF_multi_disease_export.md`
**Execution mode:** Claude Code
**Depends on:** Phase 2 complete (KiDiTi export already in HTML)
**Blocked by:** nothing

## Goal

在病患清單表格加入 checkbox 勾選機制，讓使用者可以選擇部分病患匯出。
這是 **core 功能**，所有 disease group 的匯出按鈕共用。

## 1. UI Changes — Patient List Table

### 1.1 新增 Checkbox 欄位

在病患清單表格**最左邊**新增一欄：

- **表頭 (thead)**：一個全選 checkbox
  ```html
  <th style="width:36px; text-align:center">
    <input type="checkbox" id="selectAll" title="全選/全不選"
      onchange="toggleSelectAll(this.checked)">
  </th>
  ```
- **每一列 (tbody)**：一個 checkbox，value = chartno
  ```html
  <td style="text-align:center">
    <input type="checkbox" class="patient-select"
      value="000810385G" onchange="updateSelectState()">
  </td>
  ```

### 1.2 視覺設計

- Checkbox 欄位寬度固定 36px，不參與排序/篩選
- 勾選的列加淡藍底色 `background: #eaf4fd`（可選，增加辨識度）
- 全選 checkbox 為 indeterminate 狀態時顯示 `—`（部分勾選）

### 1.3 勾選狀態管理

```javascript
// 狀態存在 memory，不需 persist 到 localStorage
// （重新整理頁面後清除是合理的）
let selectedPatients = new Set();

function toggleSelectAll(checked) {
  // 取得目前篩選後可見的病患（不是全部）
  const visibleRows = document.querySelectorAll('.patient-select');
  visibleRows.forEach(cb => {
    cb.checked = checked;
    if (checked) selectedPatients.add(cb.value);
    else selectedPatients.delete(cb.value);
  });
  updateSelectUI();
}

function togglePatientSelect(chartno, checked) {
  if (checked) selectedPatients.add(chartno);
  else selectedPatients.delete(chartno);
  updateSelectState();
}

function updateSelectState() {
  // 更新全選 checkbox 的 checked / indeterminate 狀態
  const all = document.querySelectorAll('.patient-select');
  const checked = document.querySelectorAll('.patient-select:checked');
  const selectAll = document.getElementById('selectAll');
  if (!selectAll) return;
  selectAll.checked = checked.length === all.length && all.length > 0;
  selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
  updateSelectUI();
}

function updateSelectUI() {
  // 更新匯出按鈕文字顯示勾選數量（可選）
  const count = selectedPatients.size;
  // 也可更新列的背景色
}

function getSelectedChartNos() {
  // 供匯出函數呼叫
  return selectedPatients.size > 0
    ? Array.from(selectedPatients)
    : null;  // null = 匯出全部
}
```

### 1.4 篩選/排序後保持勾選狀態

`renderPatientList()` 重新渲染表格時，必須根據 `selectedPatients` Set
回復每個 checkbox 的勾選狀態。全選 checkbox 也要同步更新。

## 2. Export Button Behavior Change

### 2.1 匯出邏輯修改

所有匯出按鈕（目前有 2 個：匯出KiDiTi資料、匯出csv）改為：

```javascript
function exportKiDiTiCSV() {
  const selected = getSelectedChartNos();
  // selected = null → 全部, array → 只匯這些
  const patients = loadPatients();
  const targets = selected
    ? Object.entries(patients).filter(([k]) => selected.includes(k))
    : Object.entries(patients);
  // ... 原有匯出邏輯，把 patients 替換成 targets
}
```

同理 `exportCombinedCSV()` 也需要同樣修改。

### 2.2 匯出按鈕提示（可選增強）

勾選病患時，按鈕文字可加數量提示：

- 無勾選：`匯出KiDiTi資料`（匯出全部）
- 有勾選：`匯出KiDiTi資料 (3)`

實作方式：`updateSelectUI()` 裡更新按鈕文字。

## 3. 刪除病患時清除勾選

`confirmRemovePatient()` 成功刪除後，同步從 `selectedPatients` 移除：

```javascript
selectedPatients.delete(chartno);
```

## 4. Implementation Notes

### 修改的函數

| 函數 | 修改內容 |
|---|---|
| `renderPatientHead()` | 表頭最左加 checkbox `<th>` |
| `renderPatientBody()` | 每列最左加 checkbox `<td>`，根據 Set 回復狀態 |
| `exportKiDiTiCSV()` | 讀取 `getSelectedChartNos()` 篩選匯出對象 |
| `exportCombinedCSV()` | 同上 |
| `confirmRemovePatient()` | 刪除後清 selectedPatients |
| `renderPatientList()` | 渲染後呼叫 `updateSelectState()` |

### 新增的函數

| 函數 | 用途 |
|---|---|
| `toggleSelectAll(checked)` | 全選/全不選 |
| `togglePatientSelect(chartno, checked)` | 單一勾選 |
| `updateSelectState()` | 同步全選 checkbox 狀態 |
| `updateSelectUI()` | 更新按鈕文字等視覺回饋 |
| `getSelectedChartNos()` | 回傳勾選清單或 null |

## 5. Testing Checklist

- [ ] 表格最左欄顯示 checkbox
- [ ] 全選 checkbox 勾選/取消 → 全部列跟著變
- [ ] 部分勾選時全選 checkbox 顯示 indeterminate
- [ ] 篩選病患後，全選只影響可見列
- [ ] 排序/篩選後勾選狀態保持
- [ ] 無勾選 → 匯出KiDiTi → 匯出全部病患（行為不變）
- [ ] 勾選 3 位 → 匯出KiDiTi → CSV 只有 3 位病患資料
- [ ] 無勾選 → 匯出CSV → 匯出全部（行為不變）
- [ ] 勾選 3 位 → 匯出CSV → 只有 3 位
- [ ] 刪除已勾選病患 → 勾選狀態同步清除
- [ ] 重新整理頁面 → 勾選狀態清除（預期行為）

## 6. File Changes Summary

| File | Action |
|---|---|
| `hospital-lab-data.html` | 修改 renderPatientHead/Body、新增勾選函數、修改匯出函數 |
| `WORKLOG.md` | 更新 |

## 7. Scope Boundary

**不在此 phase：**
- 不改 `groups/dialysis.js`（group module 不需要知道勾選機制）
- 不改 patterns repo
- 不改 sync-patterns.js
- 不做「記住勾選狀態」（localStorage persist）— 刻意不做
