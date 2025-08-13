// render.js
export function renderPage(title, bodyHtml, currentPath = '') {
  function navLink(href, label, floatRight = false) {
    const isActive = currentPath === href;
    return `<a href="${href}" class="${floatRight ? 'right' : ''} ${isActive ? 'active' : ''}">${label}</a>`;
  }

  return `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; max-width: 1200px; font-size: 16px; margin: auto !important; }
        nav { background: #f5f5f5; padding: 0 15px; margin-bottom: 20px; border-radius: 8px; }
        nav a { display: inline-block; margin-right: 15px; text-decoration: none; color: #333; font-weight: bold; padding: 15px 0; }
        nav a.active { box-shadow: 0 -4px 0 -1px #ff6200 inset; }
        .right { float: right; }
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
        ${navLink('/', 'Upload')}
        ${navLink('/freemarker-preview-globals', 'Variabile Globale')}
        ${navLink('/compare', 'Comparare', true)}
        ${navLink('/history', 'Istoric', true)}
        <!-- ${navLink('/json-preview-globals', 'JSON Preview')} -->
      </nav>
      ${bodyHtml}
    </body>
    </html>
  `;
}
