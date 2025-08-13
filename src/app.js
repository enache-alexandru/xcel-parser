import express from 'express';
import setupUploadRoute from './pages/upload.js';
import setupHistoryRoutes from './pages/history.js';
// import setupJsonPreviewRoute from './pages/jsonPreview.js';
import setupJsonPreviewGlobalsRoute from './pages/jsonPreviewGlobals.js';
import setupFreemarkerPreviewGlobalsRoute from './pages/freemarkerPreviewGlobals.js';
import { generateComparePage } from './pages/compare.js';
import { renderPage } from './render.js';

const app = express();
const port = 8080;

app.use(express.static('public'));
setupUploadRoute(app);
setupHistoryRoutes(app);
// setupJsonPreviewRoute(app);
setupJsonPreviewGlobalsRoute(app);
setupFreemarkerPreviewGlobalsRoute(app);

app.get('/compare', (req, res) => {
  const page = generateComparePage();
  res.send(renderPage('Comparare fișiere', page));
});

app.listen(port, () => {
  console.log(`Serverul rulează la http://localhost:${port}`);
});
