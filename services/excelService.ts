import { utils, writeFile } from 'xlsx';
import { TableData } from '../types';

export const generateExcel = (tables: TableData[], filename: string = 'Financial_Report_Tables.xlsx') => {
  const workbook = utils.book_new();

  tables.forEach((table, index) => {
    // Sanitize sheet name (max 31 chars, no special chars allowed in Excel sheets)
    // Excel forbids: \ / ? * [ ] :
    let safeName = (table.sheetName || `Table ${index + 1}`)
      .replace(/[\\/?*[\]:]/g, '')
      .trim();
    
    // Truncate to 31 chars
    if (safeName.length > 31) {
      safeName = safeName.slice(0, 31);
    }
    
    // Ensure unique sheet names
    let counter = 1;
    let uniqueName = safeName;
    while (workbook.SheetNames.includes(uniqueName)) {
      // If adding (1) makes it too long, trim original further
      const suffix = `(${counter})`;
      if (safeName.length + suffix.length > 31) {
        uniqueName = safeName.slice(0, 31 - suffix.length) + suffix;
      } else {
        uniqueName = safeName + suffix;
      }
      counter++;
    }

    const worksheet = utils.aoa_to_sheet(table.rows);
    
    // Auto-width adjustment
    const colWidths = table.rows.reduce((widths: number[], row) => {
      row.forEach((cell, colIndex) => {
        const cellValue = cell ? String(cell) : '';
        // Calculate approximate width (chars) + padding
        const currentWidth = widths[colIndex] || 0;
        const newWidth = Math.max(currentWidth, cellValue.length + 2);
        // Cap max width to prevent extremely wide columns for long paragraphs
        widths[colIndex] = Math.min(newWidth, 60);
      });
      return widths;
    }, [] as number[]);

    worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

    utils.book_append_sheet(workbook, worksheet, uniqueName);
  });

  writeFile(workbook, filename);
};