/**
 * Premium CFO Tools Generator
 * Generates Excel spreadsheets for Charge Wealth premium users
 */

import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, '..', 'public', 'tools');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Color scheme matching Charge Wealth brand
const colors = {
  gold: 'C9A962',
  darkNavy: '0F1117',
  deepNavy: '1A1D28',
  lightGray: 'F4F5F7',
  mutedGray: '6B7280',
  charcoalSlate: '242B38',
};

// Helper to style headers
function styleHeader(row, workbook) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF' + colors.charcoalSlate }
  };
  row.alignment = { horizontal: 'center', vertical: 'middle' };
  row.height = 25;
}

// Helper to style input cells
function styleInput(cell) {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF9E6' }
  };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF' + colors.gold } },
    bottom: { style: 'thin', color: { argb: 'FF' + colors.gold } },
    left: { style: 'thin', color: { argb: 'FF' + colors.gold } },
    right: { style: 'thin', color: { argb: 'FF' + colors.gold } }
  };
}

// Helper to style formula cells
function styleFormula(cell) {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F5E9' }
  };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF4CAF50' } },
    bottom: { style: 'thin', color: { argb: 'FF4CAF50' } },
    left: { style: 'thin', color: { argb: 'FF4CAF50' } },
    right: { style: 'thin', color: { argb: 'FF4CAF50' } }
  };
}

// ============================================
// 1. CASH FLOW PROJECTION TEMPLATE
// ============================================
async function generateCashFlowProjection() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Charge Wealth';
  workbook.created = new Date();
  
  const sheet = workbook.addWorksheet('Cash Flow Projection', {
    views: [{ showGridLines: true, zoomScale: 100 }]
  });

  // Title
  sheet.mergeCells('A1:N1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '12-Month Cash Flow Projection';
  titleCell.font = { bold: true, size: 20, color: { argb: 'FF' + colors.gold } };
  titleCell.alignment = { horizontal: 'center' };
  sheet.getRow(1).height = 35;

  // Subtitle
  sheet.mergeCells('A2:N2');
  sheet.getCell('A2').value = 'Powered by Charge Wealth | Enter your data in the yellow cells';
  sheet.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FF' + colors.mutedGray } };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  // Months header row
  const months = ['Category', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total'];
  sheet.getRow(4).values = months;
  styleHeader(sheet.getRow(4));

  // Set column widths
  sheet.getColumn(1).width = 25;
  for (let i = 2; i <= 14; i++) {
    sheet.getColumn(i).width = 12;
  }

  // INCOME SECTION
  sheet.getRow(5).values = ['INCOME'];
  sheet.getCell('A5').font = { bold: true, size: 12, color: { argb: 'FF4CAF50' } };

  const incomeCategories = [
    'Salary/Wages',
    'Bonus',
    'Investment Income',
    'Rental Income',
    'Side Business',
    'Other Income'
  ];

  let currentRow = 6;
  incomeCategories.forEach((category, idx) => {
    const row = sheet.getRow(currentRow);
    row.getCell(1).value = category;
    for (let col = 2; col <= 13; col++) {
      const cell = row.getCell(col);
      cell.value = 0;
      cell.numFmt = '"$"#,##0';
      styleInput(cell);
    }
    // Total formula
    const totalCell = row.getCell(14);
    totalCell.value = { formula: `SUM(B${currentRow}:M${currentRow})` };
    totalCell.numFmt = '"$"#,##0';
    styleFormula(totalCell);
    currentRow++;
  });

  // Total Income row
  const totalIncomeRow = sheet.getRow(currentRow);
  totalIncomeRow.getCell(1).value = 'TOTAL INCOME';
  totalIncomeRow.getCell(1).font = { bold: true };
  for (let col = 2; col <= 14; col++) {
    const cell = totalIncomeRow.getCell(col);
    const colLetter = String.fromCharCode(64 + col);
    cell.value = { formula: `SUM(${colLetter}6:${colLetter}${currentRow - 1})` };
    cell.numFmt = '"$"#,##0';
    cell.font = { bold: true };
    styleFormula(cell);
  }
  const totalIncomeRowNum = currentRow;
  currentRow += 2;

  // EXPENSES SECTION
  sheet.getRow(currentRow).getCell(1).value = 'EXPENSES';
  sheet.getRow(currentRow).getCell(1).font = { bold: true, size: 12, color: { argb: 'FFF44336' } };
  currentRow++;

  const expenseCategories = [
    'Housing (Rent/Mortgage)',
    'Utilities',
    'Insurance',
    'Food & Groceries',
    'Transportation',
    'Healthcare',
    'Debt Payments',
    'Childcare',
    'Entertainment',
    'Shopping',
    'Travel',
    'Subscriptions',
    'Other Expenses'
  ];

  const expenseStartRow = currentRow;
  expenseCategories.forEach((category) => {
    const row = sheet.getRow(currentRow);
    row.getCell(1).value = category;
    for (let col = 2; col <= 13; col++) {
      const cell = row.getCell(col);
      cell.value = 0;
      cell.numFmt = '"$"#,##0';
      styleInput(cell);
    }
    const totalCell = row.getCell(14);
    totalCell.value = { formula: `SUM(B${currentRow}:M${currentRow})` };
    totalCell.numFmt = '"$"#,##0';
    styleFormula(totalCell);
    currentRow++;
  });

  // Total Expenses row
  const totalExpensesRow = sheet.getRow(currentRow);
  totalExpensesRow.getCell(1).value = 'TOTAL EXPENSES';
  totalExpensesRow.getCell(1).font = { bold: true };
  for (let col = 2; col <= 14; col++) {
    const cell = totalExpensesRow.getCell(col);
    const colLetter = String.fromCharCode(64 + col);
    cell.value = { formula: `SUM(${colLetter}${expenseStartRow}:${colLetter}${currentRow - 1})` };
    cell.numFmt = '"$"#,##0';
    cell.font = { bold: true };
    styleFormula(cell);
  }
  const totalExpensesRowNum = currentRow;
  currentRow += 2;

  // SURPLUS/DEFICIT row
  const surplusRow = sheet.getRow(currentRow);
  surplusRow.getCell(1).value = 'MONTHLY SURPLUS/DEFICIT';
  surplusRow.getCell(1).font = { bold: true, size: 12 };
  for (let col = 2; col <= 14; col++) {
    const cell = surplusRow.getCell(col);
    const colLetter = String.fromCharCode(64 + col);
    cell.value = { formula: `${colLetter}${totalIncomeRowNum}-${colLetter}${totalExpensesRowNum}` };
    cell.numFmt = '"$"#,##0;[Red]"-$"#,##0';
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + colors.gold + '33' }
    };
  }

  // Add instructions sheet
  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.getColumn(1).width = 80;
  instructionsSheet.addRow(['HOW TO USE THIS CASH FLOW PROJECTION']).font = { bold: true, size: 16 };
  instructionsSheet.addRow(['']);
  instructionsSheet.addRow(['1. Enter your monthly income in the yellow cells under each month']);
  instructionsSheet.addRow(['2. Enter your monthly expenses in the yellow cells']);
  instructionsSheet.addRow(['3. The green cells calculate automatically']);
  instructionsSheet.addRow(['4. Positive numbers in Surplus/Deficit = money left over']);
  instructionsSheet.addRow(['5. Negative numbers (in red) = spending more than you earn']);
  instructionsSheet.addRow(['']);
  instructionsSheet.addRow(['PRO TIPS:']);
  instructionsSheet.addRow(['• Budget irregular expenses (insurance, travel) across all months']);
  instructionsSheet.addRow(['• Include planned investments in "Other Expenses"']);
  instructionsSheet.addRow(['• Review quarterly and adjust projections based on actual spending']);

  await workbook.xlsx.writeFile(path.join(outputDir, 'cash-flow-projection.xlsx'));
  console.log('✅ Cash Flow Projection Template generated');
}

// ============================================
// 2. TAX PLANNING WORKSHEET
// ============================================
async function generateTaxPlanningWorksheet() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Charge Wealth';
  
  // Quarterly Estimated Taxes Sheet
  const quarterlySheet = workbook.addWorksheet('Quarterly Taxes');
  
  // Title
  quarterlySheet.mergeCells('A1:E1');
  quarterlySheet.getCell('A1').value = 'Quarterly Estimated Tax Calculator';
  quarterlySheet.getCell('A1').font = { bold: true, size: 20, color: { argb: 'FF' + colors.gold } };
  quarterlySheet.getCell('A1').alignment = { horizontal: 'center' };
  quarterlySheet.getRow(1).height = 35;

  quarterlySheet.getColumn(1).width = 30;
  quarterlySheet.getColumn(2).width = 18;
  quarterlySheet.getColumn(3).width = 18;
  quarterlySheet.getColumn(4).width = 18;
  quarterlySheet.getColumn(5).width = 18;

  // Input Section
  quarterlySheet.addRow(['']);
  quarterlySheet.addRow(['ANNUAL INCOME ESTIMATE']).font = { bold: true };
  
  let row = 4;
  quarterlySheet.getRow(row).values = ['Income Source', 'Annual Amount'];
  styleHeader(quarterlySheet.getRow(row));
  
  const incomeRows = [
    ['W-2 Wages (after withholding)', 0],
    ['Self-Employment Income', 0],
    ['Investment Income (dividends, capital gains)', 0],
    ['Rental Income', 0],
    ['Other Taxable Income', 0]
  ];
  
  row++;
  const incomeStartRow = row;
  incomeRows.forEach(([label, value]) => {
    quarterlySheet.getRow(row).values = [label, value];
    styleInput(quarterlySheet.getCell(`B${row}`));
    quarterlySheet.getCell(`B${row}`).numFmt = '"$"#,##0';
    row++;
  });
  
  quarterlySheet.getRow(row).values = ['Total Estimated Income', { formula: `SUM(B${incomeStartRow}:B${row-1})` }];
  quarterlySheet.getCell(`A${row}`).font = { bold: true };
  quarterlySheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  styleFormula(quarterlySheet.getCell(`B${row}`));
  const totalIncomeRow = row;
  
  row += 2;
  quarterlySheet.getRow(row).values = ['DEDUCTIONS'];
  quarterlySheet.getCell(`A${row}`).font = { bold: true };
  row++;
  
  quarterlySheet.getRow(row).values = ['Filing Status:', 'Single'];
  styleInput(quarterlySheet.getCell(`B${row}`));
  quarterlySheet.getCell(`B${row}`).note = 'Options: Single, Married Filing Jointly, Head of Household';
  const filingStatusRow = row;
  row++;
  
  quarterlySheet.getRow(row).values = ['Standard Deduction (2024)', 14600];
  quarterlySheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  const stdDeductionRow = row;
  row++;
  
  quarterlySheet.getRow(row).values = ['OR Itemized Deductions:', 0];
  styleInput(quarterlySheet.getCell(`B${row}`));
  quarterlySheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  const itemizedRow = row;
  row++;
  
  quarterlySheet.getRow(row).values = ['Deduction Used', { formula: `MAX(B${stdDeductionRow},B${itemizedRow})` }];
  quarterlySheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  styleFormula(quarterlySheet.getCell(`B${row}`));
  const deductionUsedRow = row;
  
  row += 2;
  quarterlySheet.getRow(row).values = ['TAX CALCULATION'];
  quarterlySheet.getCell(`A${row}`).font = { bold: true };
  row++;
  
  quarterlySheet.getRow(row).values = ['Taxable Income', { formula: `B${totalIncomeRow}-B${deductionUsedRow}` }];
  quarterlySheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  styleFormula(quarterlySheet.getCell(`B${row}`));
  const taxableIncomeRow = row;
  row++;
  
  quarterlySheet.getRow(row).values = ['Estimated Federal Tax (approx 22%)', { formula: `B${taxableIncomeRow}*0.22` }];
  quarterlySheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  quarterlySheet.getCell(`B${row}`).note = 'Simplified estimate. Actual brackets vary.';
  styleFormula(quarterlySheet.getCell(`B${row}`));
  const fedTaxRow = row;
  row++;
  
  quarterlySheet.getRow(row).values = ['State Tax Rate:', 0.05];
  styleInput(quarterlySheet.getCell(`B${row}`));
  quarterlySheet.getCell(`B${row}`).numFmt = '0.0%';
  const stateTaxRateRow = row;
  row++;
  
  quarterlySheet.getRow(row).values = ['Estimated State Tax', { formula: `B${taxableIncomeRow}*B${stateTaxRateRow}` }];
  quarterlySheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  styleFormula(quarterlySheet.getCell(`B${row}`));
  const stateTaxRow = row;
  row++;
  
  quarterlySheet.getRow(row).values = ['Self-Employment Tax (15.3%)', { formula: `B5*0.153` }];
  quarterlySheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  styleFormula(quarterlySheet.getCell(`B${row}`));
  const seTaxRow = row;
  row++;
  
  quarterlySheet.getRow(row).values = ['TOTAL ANNUAL TAX', { formula: `B${fedTaxRow}+B${stateTaxRow}+B${seTaxRow}` }];
  quarterlySheet.getCell(`A${row}`).font = { bold: true, size: 14 };
  quarterlySheet.getCell(`B${row}`).font = { bold: true, size: 14 };
  quarterlySheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  styleFormula(quarterlySheet.getCell(`B${row}`));
  const totalTaxRow = row;
  
  row += 2;
  quarterlySheet.getRow(row).values = ['QUARTERLY PAYMENT SCHEDULE'];
  quarterlySheet.getCell(`A${row}`).font = { bold: true, size: 14, color: { argb: 'FF' + colors.gold } };
  row++;
  
  quarterlySheet.getRow(row).values = ['Quarter', 'Due Date', 'Payment Amount'];
  styleHeader(quarterlySheet.getRow(row));
  row++;
  
  const quarters = [
    ['Q1 (Jan-Mar)', 'April 15', 0.25],
    ['Q2 (Apr-May)', 'June 15', 0.25],
    ['Q3 (Jun-Aug)', 'September 15', 0.25],
    ['Q4 (Sep-Dec)', 'January 15 (next year)', 0.25]
  ];
  
  quarters.forEach(([quarter, dueDate, pct]) => {
    quarterlySheet.getRow(row).values = [quarter, dueDate, { formula: `B${totalTaxRow}*${pct}` }];
    quarterlySheet.getCell(`C${row}`).numFmt = '"$"#,##0';
    styleFormula(quarterlySheet.getCell(`C${row}`));
    row++;
  });

  // Deduction Tracker Sheet
  const deductionSheet = workbook.addWorksheet('Deduction Tracker');
  deductionSheet.getColumn(1).width = 35;
  deductionSheet.getColumn(2).width = 15;
  deductionSheet.getColumn(3).width = 40;
  
  deductionSheet.mergeCells('A1:C1');
  deductionSheet.getCell('A1').value = 'Tax Deduction Tracker';
  deductionSheet.getCell('A1').font = { bold: true, size: 20, color: { argb: 'FF' + colors.gold } };
  
  row = 3;
  deductionSheet.getRow(row).values = ['Deduction Category', 'Amount', 'Notes/Documentation'];
  styleHeader(deductionSheet.getRow(row));
  row++;
  
  const deductions = [
    ['ITEMIZED DEDUCTIONS', '', ''],
    ['Medical Expenses (>7.5% AGI)', 0, 'Keep all receipts'],
    ['State & Local Taxes (SALT, max $10k)', 0, 'Property tax + state income tax'],
    ['Mortgage Interest', 0, 'Form 1098 from lender'],
    ['Charitable Donations', 0, 'Receipts for donations >$250'],
    ['', '', ''],
    ['ABOVE-THE-LINE DEDUCTIONS', '', ''],
    ['Traditional IRA Contributions', 0, 'Max $7,000 (2024)'],
    ['HSA Contributions', 0, 'Max $4,150 single / $8,300 family'],
    ['Student Loan Interest', 0, 'Max $2,500'],
    ['Self-Employment Deductions', 0, 'Home office, equipment, etc.'],
    ['', '', ''],
    ['BUSINESS DEDUCTIONS (if applicable)', '', ''],
    ['Home Office', 0, '$5/sq ft or actual expenses'],
    ['Business Travel', 0, 'Keep receipts'],
    ['Professional Development', 0, 'Courses, books, conferences'],
    ['Equipment & Software', 0, 'Computers, subscriptions'],
    ['Professional Services', 0, 'Accounting, legal fees'],
  ];
  
  const deductionStartRow = row + 1;
  deductions.forEach(([category, amount, notes]) => {
    if (category.includes('DEDUCTIONS')) {
      deductionSheet.getRow(row).values = [category];
      deductionSheet.getCell(`A${row}`).font = { bold: true };
    } else if (category !== '') {
      deductionSheet.getRow(row).values = [category, amount, notes];
      if (amount === 0) {
        styleInput(deductionSheet.getCell(`B${row}`));
      }
      deductionSheet.getCell(`B${row}`).numFmt = '"$"#,##0';
    }
    row++;
  });
  
  row++;
  deductionSheet.getRow(row).values = ['TOTAL ITEMIZED DEDUCTIONS', { formula: `SUM(B${deductionStartRow}:B${row-2})` }];
  deductionSheet.getCell(`A${row}`).font = { bold: true };
  deductionSheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  styleFormula(deductionSheet.getCell(`B${row}`));

  await workbook.xlsx.writeFile(path.join(outputDir, 'tax-planning-worksheet.xlsx'));
  console.log('✅ Tax Planning Worksheet generated');
}

// ============================================
// 3. NET WORTH TRACKER
// ============================================
async function generateNetWorthTracker() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Charge Wealth';
  
  const sheet = workbook.addWorksheet('Net Worth Tracker');
  
  // Title
  sheet.mergeCells('A1:N1');
  sheet.getCell('A1').value = 'Monthly Net Worth Tracker';
  sheet.getCell('A1').font = { bold: true, size: 20, color: { argb: 'FF' + colors.gold } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getRow(1).height = 35;

  sheet.getColumn(1).width = 25;
  for (let i = 2; i <= 14; i++) {
    sheet.getColumn(i).width = 12;
  }

  // Month headers
  const months = ['Category', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Change'];
  sheet.getRow(3).values = months;
  styleHeader(sheet.getRow(3));

  // ASSETS SECTION
  let row = 4;
  sheet.getRow(row).values = ['ASSETS'];
  sheet.getCell(`A${row}`).font = { bold: true, size: 12, color: { argb: 'FF4CAF50' } };
  row++;
  
  const assets = [
    'Cash & Checking',
    'Savings Accounts',
    'Investment Accounts',
    '401(k) / IRA',
    'Roth IRA',
    'HSA',
    'Real Estate Equity',
    'Vehicle Value',
    'Other Assets'
  ];
  
  const assetStartRow = row;
  assets.forEach(asset => {
    sheet.getRow(row).values = [asset];
    for (let col = 2; col <= 13; col++) {
      const cell = sheet.getCell(row, col);
      cell.value = 0;
      cell.numFmt = '"$"#,##0';
      styleInput(cell);
    }
    // Change column
    const changeCell = sheet.getCell(row, 14);
    changeCell.value = { formula: `M${row}-B${row}` };
    changeCell.numFmt = '"$"#,##0;[Red]"-$"#,##0';
    styleFormula(changeCell);
    row++;
  });
  
  // Total Assets
  sheet.getRow(row).values = ['TOTAL ASSETS'];
  sheet.getCell(`A${row}`).font = { bold: true };
  for (let col = 2; col <= 13; col++) {
    const colLetter = String.fromCharCode(64 + col);
    const cell = sheet.getCell(row, col);
    cell.value = { formula: `SUM(${colLetter}${assetStartRow}:${colLetter}${row-1})` };
    cell.numFmt = '"$"#,##0';
    cell.font = { bold: true };
    styleFormula(cell);
  }
  const changeCell = sheet.getCell(row, 14);
  changeCell.value = { formula: `M${row}-B${row}` };
  changeCell.numFmt = '"$"#,##0;[Red]"-$"#,##0';
  changeCell.font = { bold: true };
  styleFormula(changeCell);
  const totalAssetsRow = row;
  row += 2;

  // LIABILITIES SECTION
  sheet.getRow(row).values = ['LIABILITIES'];
  sheet.getCell(`A${row}`).font = { bold: true, size: 12, color: { argb: 'FFF44336' } };
  row++;
  
  const liabilities = [
    'Mortgage',
    'Auto Loans',
    'Student Loans',
    'Credit Cards',
    'Personal Loans',
    'Other Debt'
  ];
  
  const liabilityStartRow = row;
  liabilities.forEach(liability => {
    sheet.getRow(row).values = [liability];
    for (let col = 2; col <= 13; col++) {
      const cell = sheet.getCell(row, col);
      cell.value = 0;
      cell.numFmt = '"$"#,##0';
      styleInput(cell);
    }
    const changeCell = sheet.getCell(row, 14);
    changeCell.value = { formula: `M${row}-B${row}` };
    changeCell.numFmt = '"$"#,##0;[Red]"-$"#,##0';
    styleFormula(changeCell);
    row++;
  });
  
  // Total Liabilities
  sheet.getRow(row).values = ['TOTAL LIABILITIES'];
  sheet.getCell(`A${row}`).font = { bold: true };
  for (let col = 2; col <= 13; col++) {
    const colLetter = String.fromCharCode(64 + col);
    const cell = sheet.getCell(row, col);
    cell.value = { formula: `SUM(${colLetter}${liabilityStartRow}:${colLetter}${row-1})` };
    cell.numFmt = '"$"#,##0';
    cell.font = { bold: true };
    styleFormula(cell);
  }
  const liabChangeCell = sheet.getCell(row, 14);
  liabChangeCell.value = { formula: `M${row}-B${row}` };
  liabChangeCell.numFmt = '"$"#,##0;[Red]"-$"#,##0';
  liabChangeCell.font = { bold: true };
  styleFormula(liabChangeCell);
  const totalLiabilitiesRow = row;
  row += 2;

  // NET WORTH ROW
  sheet.getRow(row).values = ['NET WORTH'];
  sheet.getCell(`A${row}`).font = { bold: true, size: 14, color: { argb: 'FF' + colors.gold } };
  for (let col = 2; col <= 13; col++) {
    const colLetter = String.fromCharCode(64 + col);
    const cell = sheet.getCell(row, col);
    cell.value = { formula: `${colLetter}${totalAssetsRow}-${colLetter}${totalLiabilitiesRow}` };
    cell.numFmt = '"$"#,##0;[Red]"-$"#,##0';
    cell.font = { bold: true, size: 14 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + colors.gold + '44' }
    };
  }
  const nwChangeCell = sheet.getCell(row, 14);
  nwChangeCell.value = { formula: `M${row}-B${row}` };
  nwChangeCell.numFmt = '"$"#,##0;[Red]"-$"#,##0';
  nwChangeCell.font = { bold: true, size: 14 };
  nwChangeCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF' + colors.gold + '44' }
  };

  await workbook.xlsx.writeFile(path.join(outputDir, 'net-worth-tracker.xlsx'));
  console.log('✅ Net Worth Tracker generated');
}

// ============================================
// 4. DEBT PAYOFF CALCULATOR
// ============================================
async function generateDebtPayoffCalculator() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Charge Wealth';
  
  const sheet = workbook.addWorksheet('Debt Payoff Calculator');
  
  // Title
  sheet.mergeCells('A1:H1');
  sheet.getCell('A1').value = 'Debt Payoff Calculator - Avalanche vs Snowball';
  sheet.getCell('A1').font = { bold: true, size: 20, color: { argb: 'FF' + colors.gold } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getRow(1).height = 35;

  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 15;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 18;
  sheet.getColumn(6).width = 18;
  sheet.getColumn(7).width = 15;
  sheet.getColumn(8).width = 15;

  // Instructions
  sheet.mergeCells('A2:H2');
  sheet.getCell('A2').value = 'Enter your debts below. Yellow cells are for your input.';
  sheet.getCell('A2').font = { italic: true, color: { argb: 'FF' + colors.mutedGray } };

  // Extra payment input
  sheet.getRow(4).values = ['Extra Monthly Payment:', 200];
  sheet.getCell('A4').font = { bold: true };
  styleInput(sheet.getCell('B4'));
  sheet.getCell('B4').numFmt = '"$"#,##0';

  // Debt input section
  let row = 6;
  sheet.getRow(row).values = ['Debt Name', 'Balance', 'APR %', 'Min Payment', 'Avalanche Order', 'Snowball Order', 'Monthly Interest', 'Payoff Priority'];
  styleHeader(sheet.getRow(row));
  row++;

  const debts = [
    ['Credit Card 1', 5000, 22.99, 150],
    ['Credit Card 2', 3000, 18.99, 90],
    ['Auto Loan', 15000, 6.5, 350],
    ['Student Loan', 25000, 5.5, 280],
    ['Personal Loan', 8000, 12.0, 200],
  ];

  const debtStartRow = row;
  debts.forEach(([name, balance, apr, minPayment], idx) => {
    sheet.getRow(row).values = [name, balance, apr, minPayment];
    styleInput(sheet.getCell(`A${row}`));
    styleInput(sheet.getCell(`B${row}`));
    styleInput(sheet.getCell(`C${row}`));
    styleInput(sheet.getCell(`D${row}`));
    sheet.getCell(`B${row}`).numFmt = '"$"#,##0';
    sheet.getCell(`C${row}`).numFmt = '0.00"%"';
    sheet.getCell(`D${row}`).numFmt = '"$"#,##0';
    
    // Avalanche order (by highest APR)
    const avalancheCell = sheet.getCell(`E${row}`);
    avalancheCell.value = { formula: `RANK(C${row},C$${debtStartRow}:C$${debtStartRow + debts.length - 1},0)` };
    styleFormula(avalancheCell);
    
    // Snowball order (by lowest balance)
    const snowballCell = sheet.getCell(`F${row}`);
    snowballCell.value = { formula: `RANK(B${row},B$${debtStartRow}:B$${debtStartRow + debts.length - 1},1)` };
    styleFormula(snowballCell);
    
    // Monthly interest
    const interestCell = sheet.getCell(`G${row}`);
    interestCell.value = { formula: `B${row}*(C${row}/100)/12` };
    interestCell.numFmt = '"$"#,##0.00';
    styleFormula(interestCell);
    
    row++;
  });

  // Totals
  row++;
  sheet.getRow(row).values = ['TOTALS', { formula: `SUM(B${debtStartRow}:B${debtStartRow + debts.length - 1})` }, '', { formula: `SUM(D${debtStartRow}:D${debtStartRow + debts.length - 1})` }, '', '', { formula: `SUM(G${debtStartRow}:G${debtStartRow + debts.length - 1})` }];
  sheet.getCell(`A${row}`).font = { bold: true };
  sheet.getCell(`B${row}`).font = { bold: true };
  sheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  sheet.getCell(`D${row}`).font = { bold: true };
  sheet.getCell(`D${row}`).numFmt = '"$"#,##0';
  sheet.getCell(`G${row}`).font = { bold: true };
  sheet.getCell(`G${row}`).numFmt = '"$"#,##0.00';
  styleFormula(sheet.getCell(`B${row}`));
  styleFormula(sheet.getCell(`D${row}`));
  styleFormula(sheet.getCell(`G${row}`));
  const totalsRow = row;

  // Strategy Comparison section
  row += 3;
  sheet.mergeCells(`A${row}:D${row}`);
  sheet.getCell(`A${row}`).value = 'STRATEGY COMPARISON';
  sheet.getCell(`A${row}`).font = { bold: true, size: 14, color: { argb: 'FF' + colors.gold } };
  row += 2;

  sheet.getRow(row).values = ['Method', 'Description', 'Best For'];
  styleHeader(sheet.getRow(row));
  row++;

  sheet.getRow(row).values = ['Avalanche', 'Pay highest interest rate first', 'Saving the most money'];
  row++;
  sheet.getRow(row).values = ['Snowball', 'Pay smallest balance first', 'Quick wins & motivation'];
  row += 2;

  // Key insights
  sheet.getCell(`A${row}`).value = 'KEY INSIGHT:';
  sheet.getCell(`A${row}`).font = { bold: true };
  row++;
  sheet.mergeCells(`A${row}:H${row}`);
  sheet.getCell(`A${row}`).value = 'The Avalanche method saves more in interest, but the Snowball method provides psychological wins. Choose based on your personality!';
  sheet.getCell(`A${row}`).font = { italic: true };

  // Amortization sheet
  const amortSheet = workbook.addWorksheet('Payoff Schedule');
  amortSheet.getColumn(1).width = 10;
  amortSheet.getColumn(2).width = 15;
  amortSheet.getColumn(3).width = 15;
  amortSheet.getColumn(4).width = 15;
  amortSheet.getColumn(5).width = 20;

  amortSheet.getCell('A1').value = 'Sample Payoff Schedule';
  amortSheet.getCell('A1').font = { bold: true, size: 16 };

  amortSheet.getRow(3).values = ['Month', 'Payment', 'Principal', 'Interest', 'Remaining Balance'];
  styleHeader(amortSheet.getRow(3));

  // Sample schedule for first debt
  let balance = 5000;
  const apr = 22.99;
  const payment = 150 + 200; // min + extra
  row = 4;
  
  for (let month = 1; month <= 24 && balance > 0; month++) {
    const interest = balance * (apr / 100 / 12);
    const principal = Math.min(payment - interest, balance);
    balance = Math.max(0, balance - principal);
    
    amortSheet.getRow(row).values = [
      month,
      Math.min(payment, principal + interest),
      principal,
      interest,
      balance
    ];
    amortSheet.getCell(`B${row}`).numFmt = '"$"#,##0.00';
    amortSheet.getCell(`C${row}`).numFmt = '"$"#,##0.00';
    amortSheet.getCell(`D${row}`).numFmt = '"$"#,##0.00';
    amortSheet.getCell(`E${row}`).numFmt = '"$"#,##0.00';
    row++;
  }

  await workbook.xlsx.writeFile(path.join(outputDir, 'debt-payoff-calculator.xlsx'));
  console.log('✅ Debt Payoff Calculator generated');
}

// ============================================
// 5. INVESTMENT FEE ANALYZER
// ============================================
async function generateInvestmentFeeAnalyzer() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Charge Wealth';
  
  const sheet = workbook.addWorksheet('Fee Analyzer');
  
  // Title
  sheet.mergeCells('A1:G1');
  sheet.getCell('A1').value = 'Investment Fee Analyzer - The Hidden Cost of 1%';
  sheet.getCell('A1').font = { bold: true, size: 20, color: { argb: 'FF' + colors.gold } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getRow(1).height = 35;

  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 18;
  sheet.getColumn(4).width = 18;
  sheet.getColumn(5).width = 18;
  sheet.getColumn(6).width = 18;
  sheet.getColumn(7).width = 18;

  // Input section
  let row = 3;
  sheet.getRow(row).values = ['YOUR INPUTS'];
  sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
  row++;

  sheet.getRow(row).values = ['Starting Investment:', 100000];
  styleInput(sheet.getCell(`B${row}`));
  sheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  const startingInvestmentRow = row;
  row++;

  sheet.getRow(row).values = ['Monthly Contribution:', 1000];
  styleInput(sheet.getCell(`B${row}`));
  sheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  const monthlyContribRow = row;
  row++;

  sheet.getRow(row).values = ['Expected Annual Return:', 0.08];
  styleInput(sheet.getCell(`B${row}`));
  sheet.getCell(`B${row}`).numFmt = '0.0%';
  const returnRateRow = row;
  row += 2;

  // Fee scenarios
  sheet.getRow(row).values = ['FEE SCENARIOS'];
  sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
  row++;

  sheet.getRow(row).values = ['Scenario', 'Annual Fee', '10 Years', '20 Years', '30 Years', 'Fees Paid (30yr)', '% Lost to Fees'];
  styleHeader(sheet.getRow(row));
  row++;

  const feeScenarios = [
    ['DIY Index Funds', 0.0003, 'Low-cost ETFs like VTI'],
    ['Robo-Advisor', 0.0025, 'Betterment, Wealthfront'],
    ['Financial Advisor (1%)', 0.01, 'Typical AUM fee'],
    ['Financial Advisor (1.5%)', 0.015, 'Higher-end advisors'],
    ['High-Cost Mutual Funds', 0.012, 'Active management fees'],
  ];

  const scenarioStartRow = row;
  feeScenarios.forEach(([name, fee, note], idx) => {
    const netReturn = `B$${returnRateRow}-B${row}`;
    
    sheet.getRow(row).values = [
      name,
      fee,
      // 10 year formula: FV with monthly compounding
      { formula: `FV((${netReturn})/12,120,-B$${monthlyContribRow},-B$${startingInvestmentRow})` },
      // 20 year formula
      { formula: `FV((${netReturn})/12,240,-B$${monthlyContribRow},-B$${startingInvestmentRow})` },
      // 30 year formula
      { formula: `FV((${netReturn})/12,360,-B$${monthlyContribRow},-B$${startingInvestmentRow})` },
    ];
    
    sheet.getCell(`B${row}`).numFmt = '0.00%';
    sheet.getCell(`C${row}`).numFmt = '"$"#,##0';
    sheet.getCell(`D${row}`).numFmt = '"$"#,##0';
    sheet.getCell(`E${row}`).numFmt = '"$"#,##0';
    
    styleFormula(sheet.getCell(`C${row}`));
    styleFormula(sheet.getCell(`D${row}`));
    styleFormula(sheet.getCell(`E${row}`));
    
    // Fees paid = difference from lowest fee scenario
    if (idx === 0) {
      sheet.getCell(`F${row}`).value = 0;
      sheet.getCell(`G${row}`).value = 0;
    } else {
      sheet.getCell(`F${row}`).value = { formula: `E$${scenarioStartRow}-E${row}` };
      sheet.getCell(`G${row}`).value = { formula: `F${row}/E$${scenarioStartRow}` };
    }
    sheet.getCell(`F${row}`).numFmt = '"$"#,##0';
    sheet.getCell(`G${row}`).numFmt = '0.0%';
    styleFormula(sheet.getCell(`F${row}`));
    styleFormula(sheet.getCell(`G${row}`));
    
    row++;
  });

  // Impact summary
  row += 2;
  sheet.mergeCells(`A${row}:G${row}`);
  sheet.getCell(`A${row}`).value = 'THE HIDDEN COST OF HIGH FEES';
  sheet.getCell(`A${row}`).font = { bold: true, size: 14, color: { argb: 'FF' + colors.gold } };
  row += 2;

  sheet.getCell(`A${row}`).value = 'Cost of 1% fee over 30 years:';
  sheet.getCell(`A${row}`).font = { bold: true };
  sheet.getCell(`B${row}`).value = { formula: `E${scenarioStartRow}-E${scenarioStartRow + 2}` };
  sheet.getCell(`B${row}`).numFmt = '"$"#,##0';
  sheet.getCell(`B${row}`).font = { bold: true, size: 16, color: { argb: 'FFF44336' } };
  row += 2;

  // Key insights
  const insights = [
    'A 1% fee might sound small, but it compounds against you every year',
    'Over 30 years, high fees can cost you hundreds of thousands of dollars',
    'Low-cost index funds often outperform high-fee actively managed funds',
    'Always ask: "What am I getting for this fee that I can\'t get cheaper?"'
  ];

  sheet.getCell(`A${row}`).value = 'KEY INSIGHTS:';
  sheet.getCell(`A${row}`).font = { bold: true };
  row++;

  insights.forEach(insight => {
    sheet.getCell(`A${row}`).value = '• ' + insight;
    sheet.mergeCells(`A${row}:G${row}`);
    row++;
  });

  // Comparison chart data sheet
  const chartSheet = workbook.addWorksheet('Chart Data');
  chartSheet.getColumn(1).width = 10;
  chartSheet.getColumn(2).width = 15;
  chartSheet.getColumn(3).width = 15;
  chartSheet.getColumn(4).width = 15;

  chartSheet.getCell('A1').value = 'Yearly Growth Comparison (for charting)';
  chartSheet.getCell('A1').font = { bold: true, size: 14 };

  chartSheet.getRow(3).values = ['Year', 'No Fee (0.03%)', '1% Fee', 'Difference'];
  styleHeader(chartSheet.getRow(3));

  // Generate yearly data
  let noFeeBalance = 100000;
  let highFeeBalance = 100000;
  const monthlyContrib = 1000;
  const baseReturn = 0.08;
  
  for (let year = 1; year <= 30; year++) {
    // Simplified annual calc
    noFeeBalance = noFeeBalance * (1 + baseReturn - 0.0003) + (monthlyContrib * 12);
    highFeeBalance = highFeeBalance * (1 + baseReturn - 0.01) + (monthlyContrib * 12);
    
    chartSheet.getRow(3 + year).values = [
      year,
      Math.round(noFeeBalance),
      Math.round(highFeeBalance),
      Math.round(noFeeBalance - highFeeBalance)
    ];
    chartSheet.getCell(`B${3 + year}`).numFmt = '"$"#,##0';
    chartSheet.getCell(`C${3 + year}`).numFmt = '"$"#,##0';
    chartSheet.getCell(`D${3 + year}`).numFmt = '"$"#,##0';
  }

  await workbook.xlsx.writeFile(path.join(outputDir, 'investment-fee-analyzer.xlsx'));
  console.log('✅ Investment Fee Analyzer generated');
}

// Run all generators
async function generateAllTools() {
  console.log('🚀 Generating Charge Wealth Premium CFO Tools...\n');
  
  await generateCashFlowProjection();
  await generateTaxPlanningWorksheet();
  await generateNetWorthTracker();
  await generateDebtPayoffCalculator();
  await generateInvestmentFeeAnalyzer();
  
  console.log('\n✨ All premium tools generated successfully!');
  console.log(`📁 Output directory: ${outputDir}`);
}

generateAllTools().catch(console.error);
