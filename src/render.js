// render.js
export function renderPage(title, bodyHtml) {
  return `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; max-width: 1200px; margin: auto !important; }
        nav { background: #f5f5f5; padding: 10px; margin-bottom: 20px; border-radius: 8px; }
        nav a { margin-right: 15px; text-decoration: none; color: #007bff; font-weight: bold; }
        nav a:hover { text-decoration: underline; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .diff { background-color: #ffe5e5; }
        .same { background-color: #e7ffe7; }
        pre.json { background:#0b1020; color:#e6edf3; padding:16px; border-radius:8px; overflow:auto; }
        .muted { color:#666; font-size: 13px; }
      </style>
    </head>
    <body>
      <nav>
        <a href="/">Upload</a>
        <a href="/history">Istoric</a>
        <a href="/compare">Comparare</a>
        <a href="/json-preview-globals">JSON Preview</a>
        <a href="/freemarker-preview-globals">Freemarker Preview</a>
      </nav>
      ${bodyHtml}
    </body>
    </html>
  `;
}
