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
  
    const uploadForm = `
      <h1>Încarcă un fișier Excel</h1>
      <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="excelFile" accept=".xlsx" required />
        <button type="submit">Upload</button>
      </form>
    `;
  
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
  
    res.send(renderPage('Upload fișier', uploadForm + lastFileInfo));
  });

  app.post('/upload', upload.single('excelFile'), (req, res) => {
    if (!req.file) return res.send(renderPage('Eroare', '<p>Niciun fișier primit.</p>'));

    const filepath = req.file.path;
    const data = xlsx.parse(fs.readFileSync(filepath))[0]?.data || [];
    const uploadTime = new Date().toISOString();

    appendToHistory({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      sizeKB: Math.round(req.file.size / 1024),
      uploadedAt: uploadTime
    });

    const table = generateHtmlTable(data);
    fs.unlinkSync(filepath); // ștergem fișierul temporar

    res.send(renderPage('Fișier încărcat', `
      <h1>Fișier procesat: ${req.file.originalname}</h1>
      <div><strong>Încărcat la:</strong> ${new Date(uploadTime).toLocaleString('ro-RO')}</div>
      ${table}
    `));
  });
}