// upload.js
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import xlsx from 'node-xlsx';
import { renderPage } from '../render.js';

const upload = multer({ dest: 'uploads/' });
const historyPath = path.join('uploads', 'history.json');

function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  } catch {
    return [];
  }
}

function appendToHistory(entry) {
  const existing = fs.existsSync(historyPath)
    ? JSON.parse(fs.readFileSync(historyPath, 'utf8'))
    : [];
  existing.push(entry);
  fs.writeFileSync(historyPath, JSON.stringify(existing, null, 2), 'utf8');
}

function generateHtmlTable(data) {
  if (!data.length) return '<p>Fișierul este gol.</p>';
  return `<table>${data.map((row, i) => `<tr>${row.map(cell => {
    const tag = i === 0 ? 'th' : 'td';
    return `<${tag}>${cell ?? ''}</${tag}>`;
  }).join('')}</tr>`).join('')}</table>`;
}

export default function setupUploadRoute(app) {
  app.get('/', (req, res) => {
    const history = readHistory();
    const last = history.at(-1); // ultimul fișier (dacă există)
    
    const lastFileInfo = last
      ? `
        <div style="margin-top:30px;">
          <h2>Ultimul fișier încărcat</h2>
          <ul>
            <li><strong>Nume:</strong> ${last.originalName}</li>
            <li><strong>Dimensiune:</strong> ${last.sizeKB} KB</li>
            <li><strong>Data:</strong> ${new Date(last.uploadedAt).toLocaleString('ro-RO')}</li>
            <li><a href="/view/${last.storedName}">Vezi conținut</a></li>
          </ul>
        </div>
      `
      : '';
  
    // upload.js (doar partea din GET '/')
    res.send(renderPage('Upload fișier', `
      <h1>Încarcă un fișier Excel</h1>
      <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="excelFile" accept=".xlsx" required />
        <input type="password" name="password" placeholder="Parolă (opțional)" />
        <button type="submit">Upload</button>
      </form>
      ${lastFileInfo}
    `, req.path));

  });

  // app.post('/upload', upload.single('excelFile'), (req, res) => {
  //   if (!req.file) return res.send(renderPage('Eroare', '<p>Niciun fișier primit.</p>'));

  //   const filepath = req.file.path;
  //   const data = xlsx.parse(fs.readFileSync(filepath))[0]?.data || [];
  //   const uploadTime = new Date().toISOString();

  //   appendToHistory({
  //     originalName: req.file.originalname,
  //     storedName: req.file.filename,
  //     sizeKB: Math.round(req.file.size / 1024),
  //     uploadedAt: uploadTime
  //   });

  //   const table = generateHtmlTable(data);
  //   fs.unlinkSync(filepath); // ștergem fișierul temporar

  //   res.send(renderPage('Fișier încărcat', `
  //     <h1>Fișier procesat: ${req.file.originalname}</h1>
  //     <div><strong>Încărcat la:</strong> ${new Date(uploadTime).toLocaleString('ro-RO')}</div>
  //     ${table}
  //   `));
  // });

  app.post('/upload', upload.single('excelFile'), (req, res) => {
    if (!req.file) {
      return res.send(renderPage('Eroare', '<p>Niciun fișier primit.</p>', req.path));
    }

    const filepath = req.file.path; // ex: uploads/abcd1234
    const password = (req.body.password || '').trim();
    const uploadTime = new Date().toISOString();

    const decName = req.file.filename + '_dec.xlsx';
    const decDest = path.join('uploads', decName);

    let data = [];
    let usedDecrypted = false;
    let storedNameForHistory = req.file.filename;

    // helper: citește doar foaia Variabile_Globale
    function readVariabileGlobaleSheet(file) {
      const sheets = xlsx.parse(fs.readFileSync(file));
      const vg = sheets.find(s => s.name === 'Variabile_Globale');
      return vg ? vg.data : [];
    }

    try {
      data = readVariabileGlobaleSheet(filepath);
    } catch (err) {
      if (password) {
        const scriptPath = path.resolve('decrypt_xlsx.py');
        const outPath = `${filepath}-dec.xlsx`;

        const { ok, log } = runPythonDecrypt(scriptPath, path.resolve(filepath), password, path.resolve(outPath));
        if (!ok) {
          return res.send(renderPage('Eroare decriptare',
            `<p>Nu s-a putut decripta fișierul. Mesaj: <pre>${log}</pre></p><a href="/">Înapoi</a>`));
        }

        try {
          fs.renameSync(outPath, decDest);
          data = readVariabileGlobaleSheet(decDest);
          usedDecrypted = true;
          storedNameForHistory = decName;
        } catch (e2) {
          return res.send(renderPage('Eroare',
            `<p>Fișierul decriptat nu a putut fi citit.</p><a href="/">Înapoi</a>`, req.path));
        }
      } else {
        return res.send(renderPage('Fișier protejat',
          `<p>Fișierul pare protejat cu parolă. Introdu parola și reîncarcă fișierul.</p><a href="/">Înapoi</a>`, req.path));
      }
    }

    appendToHistory({
      originalName: req.file.originalname,
      storedName: storedNameForHistory,
      sourceEncryptedName: usedDecrypted ? req.file.filename : undefined,
      wasDecrypted: usedDecrypted,
      sizeKB: Math.round(req.file.size / 1024),
      uploadedAt: uploadTime
    });

    let table;
    if (!data.length) {
      table = `<p><strong>Atenție:</strong> Sheet-ul <code>Variabile_Globale</code> nu există sau este gol.</p>`;
    } else {
      table = generateHtmlTable(data);
    }

    res.send(renderPage('Fișier încărcat', `
      <h1>Fișier procesat: ${req.file.originalname}</h1>
      <div><strong>Încărcat la:</strong> ${new Date(uploadTime).toLocaleString('ro-RO')}</div>
      ${table}
    `, req.path));
  });

}


//========= Python decrypter ========== 
import { spawnSync } from 'child_process';
import os from 'os';

function runPythonDecrypt(scriptPath, inputPath, password, outputPath) {
  // Încearcă pe Windows: `py -3`, apoi `python`
  // Pe alte OS: `python3`, apoi `python`
  const isWin = os.platform() === 'win32';

  const candidates = isWin
    ? [['py', ['-3']], ['python', []]]
    : [['python3', []], ['python', []]];

  for (const [cmd, baseArgs] of candidates) {
    try {
      const result = spawnSync(cmd, [...baseArgs, scriptPath, inputPath, password, outputPath], {
        encoding: 'utf8'
      });
      if (result.error) continue;
      if (result.status === 0 && (result.stdout || '').includes('OK')) {
        return { ok: true, log: result.stdout };
      }
      // dacă a rulat dar a eșuat, returnează eroarea
      if (result.status !== 0) {
        return { ok: false, log: result.stdout + result.stderr };
      }
    } catch {
      // încearcă următorul candidat
    }
  }
  return { ok: false, log: 'Nu s-a putut rula Python. Verifică instalarea / PATH.' };
}
