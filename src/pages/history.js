// history.js
import fs from 'fs';
import path from 'path';
import xlsx from 'node-xlsx';
import { renderPage } from '../render.js';

const historyPath = path.join('uploads', 'history.json');

function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
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

function generateHtmlTable(data) {
  if (!data.length) return '<p>Fișierul este gol.</p>';
  return `<table>${data.map((row, i) => `<tr>${row.map(cell => {
    const tag = i === 0 ? 'th' : 'td';
    return `<${tag}>${cell ?? ''}</${tag}>`;
  }).join('')}</tr>`).join('')}</table>`;
}

export default function setupHistoryRoutes(app) {
  app.get('/history', (req, res) => {
    const history = readHistory();

    const rows = history.map(h => `
      <tr>
        <td><a href="/view/${h.storedName}">${h.originalName}</a></td>
        <td>${h.sizeKB} KB</td>
        <td>${new Date(h.uploadedAt).toLocaleString('ro-RO')}</td>
        <td><a href="/view/${h.storedName}">Vezi</a></td>
      </tr>
    `).join('');

    const table = `
      <table>
        <tr><th>Nume fișier</th><th>Dimensiune</th><th>Data uploadului</th><th></th></tr>
        ${rows}
      </table>
    `;

    res.send(renderPage('Istoric fișiere', `<h1>Istoric fișiere încărcate</h1>${table}`));
  });

  app.get('/view/:filename', (req, res) => {
    const filepath = path.join('uploads', req.params.filename);

    if (!fs.existsSync(filepath)) {
      return res.send(renderPage('Fișier lipsă', `<p>Fișierul nu a fost găsit.</p>`));
    }

    const data = readExcelData(filepath);
    const table = generateHtmlTable(data);

    res.send(renderPage('Vizualizare fișier', `
      <h1>Vizualizare fișier: ${req.params.filename}</h1>
      ${table}
    `));
  });
}
