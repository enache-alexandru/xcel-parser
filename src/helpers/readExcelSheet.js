import xlsx from 'node-xlsx';
import fs from 'fs';

/**
 * Returnează datele dintr-un sheet ales, după nume sau index (0-based).
 * Prioritate: sheetName > sheetIndex > primul sheet.
 */
export function readExcelSheet(filepath, { sheetName, sheetIndex } = {}) {
  const sheets = xlsx.parse(fs.readFileSync(filepath)); // [{name, data}, ...]
  if (!sheets.length) return [];

  if (sheetName) {
    const found = sheets.find(s => s.name === sheetName);
    return found?.data || [];
  }

  if (Number.isInteger(sheetIndex) && sheetIndex >= 0 && sheetIndex < sheets.length) {
    return sheets[sheetIndex].data || [];
  }

  // fallback: primul sheet
  return sheets[0].data || [];
}
