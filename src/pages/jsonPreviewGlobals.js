// jsonPreviewGlobals.js
import fs from 'fs';
import path from 'path';
import xlsx from 'node-xlsx';
import { renderPage } from '../render.js';

const historyPath = path.join('uploads', 'history.json');

// === helpers ===
function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  } catch {
    return [];
  }
}

function getSheet(filepath, wantedName = 'Variabile_Globale') {
  const sheets = xlsx.parse(fs.readFileSync(filepath)); // [{name, data}]
  if (!sheets?.length) return { data: [], foundName: null };
  const found = sheets.find(s => s.name === wantedName);
  return { data: found?.data || [], foundName: found?.name || null };
}

function sanitizeHeader(h) {
  return (h ?? '')
    .toString()
    .trim();
}

function toSnakeKey(x) {
  return (x ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function escapeHtml(str) {
  return str
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

/**
 * Construiește structura:
 * {
 *   [categorie]: {
 *     [tip]: {
 *       [pachet]: valoareNumber
 *     }
 *   }
 * }
 * Coloane implicite: "Produs" (ipotecar/personal), "Tip" (fix/variabil), "Pachet" (standard, ...), "Valoare" (număr).
 */
function buildNestedFromGrid(grid, {
  colCategorie = 'Produs',
  colTip = 'Tip',
  colPachet = 'Nume',
  colValoare = 'Valoare',
  normalizeKeys = true
} = {}) {
  if (!grid?.length) return {};

  const [headerRow, ...rows] = grid;
  const headers = (headerRow || []).map(sanitizeHeader);
  const idx = {
    cat: headers.indexOf(colCategorie),
    tip: headers.indexOf(colTip),
    pack: headers.indexOf(colPachet),
    val: headers.indexOf(colValoare)
  };

  // dacă vreuna din coloane lipsește, returnăm gol (sau poți arunca eroare)
  if (idx.cat === -1 || idx.tip === -1 || idx.pack === -1 || idx.val === -1) {
    return {};
  }

  const out = {};
  for (const r of rows) {
    const rawCat = r?.[idx.cat];
    const rawTip = r?.[idx.tip];
    const rawPack = r?.[idx.pack];
    let rawVal = r?.[idx.val];

    // skip rânduri incomplete
    if (rawCat === undefined || rawTip === undefined || rawPack === undefined || rawVal === undefined) continue;

    // parse numeric: acceptă string cu virgula românească
    if (typeof rawVal === 'string') {
      const s = rawVal.replace(/\./g, '').replace(',', '.'); // 10.300,25 -> 10300.25 (best-effort)
      const n = Number(s);
      if (!Number.isNaN(n)) rawVal = n;
    }
    if (typeof rawVal !== 'number') {
      const n = Number(rawVal);
      if (!Number.isNaN(n)) rawVal = n;
    }

    const catKey  = normalizeKeys ? toSnakeKey(rawCat)  : String(rawCat);
    const tipKey  = normalizeKeys ? toSnakeKey(rawTip)  : String(rawTip);
    const packKey = normalizeKeys ? toSnakeKey(rawPack) : String(rawPack);

    if (!out[catKey]) out[catKey] = {};
    if (!out[catKey][tipKey]) out[catKey][tipKey] = {};
    out[catKey][tipKey][packKey] = rawVal;
  }

  return out;
}

export default function setupJsonPreviewGlobalsRoute(app) {
  app.get('/json-preview-globals', (req, res) => {
    const history = readHistory();
    if (!history.length && !req.query.file) {
      return res.send(renderPage('JSON Preview (Variabile_Globale)', `
        <h1>JSON Preview (Variabile_Globale)</h1>
        <p class="muted">Nu există fișiere în istoric. Încarcă mai întâi un fișier.</p>
      `));
    }

    const storedName = req.query.file
      ? req.query.file.toString()
      : history.at(-1).storedName;

    const filepath = path.join('uploads', storedName);
    if (!fs.existsSync(filepath)) {
      return res.send(renderPage('JSON Preview (Variabile_Globale)', `
        <h1>JSON Preview (Variabile_Globale)</h1>
        <p class="muted">Fișierul nu există pe disc: <code>${storedName}</code></p>
      `));
    }

    // Poți override numele coloanelor prin query dacă e nevoie.
    const colCategorie = (req.query.colCategorie || 'Produs').toString();
    const colTip       = (req.query.colTip || 'Tip').toString();
    const colPachet    = (req.query.colPachet || 'Nume').toString();
    const colValoare   = (req.query.colValoare || 'Valoare').toString();

    const { data: grid, foundName } = getSheet(filepath, 'Variabile_Globale');
    const nested = buildNestedFromGrid(grid, { colCategorie, colTip, colPachet, colValoare, normalizeKeys: true });
    const jsonPretty = escapeHtml(JSON.stringify(nested, null, 2));

    const fileOptions = history.map(h =>
      `<option value="${h.storedName}" ${h.storedName === storedName ? 'selected' : ''}>${h.originalName}</option>`
    ).join('');

    res.send(renderPage('JSON Preview (Variabile_Globale)', `
      <h1>JSON Preview (Variabile_Globale)</h1>

      <form method="get" style="display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; margin-bottom: 12px;">
        <label>
          Fișier:
          <select name="file" onchange="this.form.submit()">
            ${fileOptions}
          </select>
        </label>
        <details>
          <summary class="muted">Opțiuni (nume coloane)</summary>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
            <label>Categorie <input name="colCategorie" value="${escapeHtml(colCategorie)}" /></label>
            <label>Tip <input name="colTip" value="${escapeHtml(colTip)}" /></label>
            <label>Pachet <input name="colPachet" value="${escapeHtml(colPachet)}" /></label>
            <label>Valoare <input name="colValoare" value="${escapeHtml(colValoare)}" /></label>
            <button type="submit">Aplică</button>
          </div>
        </details>
      </form>

      <div class="muted">
        Fișier: <code>${storedName}</code> • Sheet: <code>${foundName ?? '(nu există Variabile_Globale)'}</code>
      </div>

      <h3 style="margin-top:16px;">Preview JSON (construit din sheet-ul "Variabile_Globale")</h3>
      <pre class="json">${jsonPretty}</pre>

      <p class="muted">Notă: cheile sunt normalizate la <em>snake_case</em> (ex: "Cu Asigurare" → "cu_asigurare").</p>
    `));
  });
}
