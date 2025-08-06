import fs from 'fs';
import xlsx from 'node-xlsx';
import path from 'path';

const historyPath = path.join('uploads', 'history.json');

function readHistory() {
  try {
    const raw = fs.readFileSync(historyPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function readExcelData(filepath) {
  try {
    const sheets = xlsx.parse(fs.readFileSync(filepath));
    return sheets[0]?.data || [];
  } catch {
    return [];
  }
}

function generateComparisonTable(data1, data2) {
  const maxRows = Math.max(data1.length, data2.length);
  const maxCols = Math.max(
    ...[...data1, ...data2].map(row => row?.length || 0)
  );

  let html = '<table><tr><th>Rând</th>';

  for (let col = 0; col < maxCols; col++) {
    html += `<th>Col ${col + 1}</th>`;
  }
  html += '</tr>';

  for (let row = 0; row < maxRows; row++) {
    html += `<tr><td>${row + 1}</td>`;

    for (let col = 0; col < maxCols; col++) {
      const val1 = data1[row]?.[col] ?? '';
      const val2 = data2[row]?.[col] ?? '';

      const cssClass = val1 !== val2 ? 'diff' : 'same';
      html += `<td class="${cssClass}">${val1}</td>`;
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

  const [latest, previous] = history.slice(-2).reverse();

  const latestData = readExcelData(`uploads/${latest.storedName}`);
  const previousData = readExcelData(`uploads/${previous.storedName}`);

  const comparisonHtml = generateComparisonTable(latestData, previousData);

  return `
    <h1>Comparare ultimele două fișiere</h1>
    <p><strong>${latest.originalName}</strong> vs <strong>${previous.originalName}</strong></p>
    ${comparisonHtml}
    <a href="/">Înapoi</a>
  `;
}
