import fs from 'fs';
import xlsx from 'node-xlsx';
import path from 'path';

const historyPath = path.join('uploads', 'history.json');

function readHistory() {
  try { return JSON.parse(fs.readFileSync(historyPath, 'utf8')); }
  catch { return []; }
}

function readExcelSheetVariabileGlobale(filepath) {
  try {
    const sheets = xlsx.parse(fs.readFileSync(filepath)); // [{ name, data }]
    const vg = sheets.find(s => s.name === 'Variabile_Globale');
    return vg?.data || []; // dacă nu există, întoarcem []
  } catch {
    return [];
  }
}

function getMaxCols(a, b) {
  let m = 0;
  const scan = arr => {
    for (let i = 0; i < arr.length; i++) {
      const len = Array.isArray(arr[i]) ? arr[i].length : 0;
      if (len > m) m = len;
    }
  };
  scan(a); scan(b);
  return m;
}


function generateComparisonTable(data1, data2, { rowLimit } = {}) {
  const maxRowsRaw = Math.max(data1.length, data2.length);
  const maxRows = rowLimit ? Math.min(maxRowsRaw, rowLimit) : maxRowsRaw;
  const maxCols = getMaxCols(data1, data2);

  let html = '<table><tr><th>Rând</th>';
  for (let c = 0; c < maxCols; c++) html += `<th>Col ${c + 1}</th>`;
  html += '</tr>';

  for (let r = 0; r < maxRows; r++) {
    const r1 = Array.isArray(data1[r]) ? data1[r] : [];
    const r2 = Array.isArray(data2[r]) ? data2[r] : [];
    html += `<tr><td>${r + 1}</td>`;
    for (let c = 0; c < maxCols; c++) {
      const v1 = r1[c] ?? '';
      const v2 = r2[c] ?? '';
      const css = v1 !== v2 ? 'diff' : 'same';
      html += `<td class="${css}">${v1}</td>`;
    }
    html += '</tr>';
  }

  html += '</table>';
  return html;
}


// Exportăm o funcție pentru a genera HTML de comparație între ultimele 2 fișiere
export function generateComparePage() {
  const history = readHistory();
  if (history.length < 2) {
    return '<p>Sunt necesare cel puțin două fișiere pentru comparare.</p><a href="/">Înapoi</a>';
  }

  // ultimele două fișiere din istoric
  const [latest, previous] = history.slice(-2).reverse();
  const latestPath = path.join('uploads', latest.storedName);
  const previousPath = path.join('uploads', previous.storedName);

  // >>> doar sheet-ul "Variabile_Globale"
  const latestData   = readExcelSheetVariabileGlobale(latestPath);
  const previousData = readExcelSheetVariabileGlobale(previousPath);

  // Mesaj clar dacă sheet-ul lipsește
  if (!latestData.length || !previousData.length) {
    return `
      <h1>Comparare ultimele două fișiere</h1>
      <p><strong>Atenție:</strong> sheet-ul <code>Variabile_Globale</code> nu a fost găsit într-unul dintre fișiere
      (${latest.originalName} sau ${previous.originalName}) sau este gol.</p>
      <a href="/history">Vezi fișierele</a>
    `;
  }

  // opțional: limită de rânduri pentru fișiere mari (schimbă 2000 cum vrei)
  const comparisonHtml = generateComparisonTable(latestData, previousData, { rowLimit: 2000 });

  return `
    <h1>Comparare (doar sheet: <code>Variabile_Globale</code>)</h1>
    <p><strong>${latest.originalName}</strong> vs <strong>${previous.originalName}</strong></p>
    ${comparisonHtml}
    <a href="/history">Înapoi</a>
  `;
}
