export function renderPage(title, bodyHtml) {
    return `
      <!DOCTYPE html>
      <html lang="ro">
      <head>
          <meta charset="UTF-8" />
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; max-width: 1200px; margin: auto; }
            nav { background: #f5f5f5; padding: 10px; margin-bottom: 20px; border-radius: 8px; }
            nav a { margin-right: 15px; text-decoration: none; color: #007bff; font-weight: bold; }
            nav a:hover { text-decoration: underline; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .diff { background-color: #ffe5e5; }
            .same { background-color: #e7ffe7; }
          </style>
      </head>
      <body>
          <nav>
            <a href="/">Upload</a>
            <a href="/history">Istoric</a>
            <a href="/compare">Comparare</a>
            <a href="/todo">Export Global vars</a>
            <a href="/todo">Export JSON</a>
          </nav>
          ${bodyHtml}
      </body>
      </html>
    `;
  }
  