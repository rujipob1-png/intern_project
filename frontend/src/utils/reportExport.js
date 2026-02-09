/**
 * Report Export Utilities
 * สำหรับ export รายงานเป็น Excel และ PDF
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// Thai font for PDF (Base64 encoded THSarabunNew or similar)
// Note: You need to add actual Thai font base64 data for full Thai support
const THAI_FONT_LOADED = false;

/**
 * Export ข้อมูลเป็น Excel file
 * @param {Object[]} data - Array of objects to export
 * @param {string} filename - ชื่อไฟล์ (ไม่ต้องมี .xlsx)
 * @param {Object} options - ตัวเลือกเพิ่มเติม
 */
export function exportToExcel(data, filename, options = {}) {
  const {
    sheetName = 'Sheet1',
    columnHeaders = null, // Custom column headers { originalKey: 'Display Name' }
    columnWidths = null,  // { columnIndex: width }
    dateFormat = 'dd/mm/yyyy'
  } = options;

  // Transform data if custom headers provided
  let exportData = data;
  if (columnHeaders) {
    exportData = data.map(row => {
      const newRow = {};
      Object.keys(columnHeaders).forEach(key => {
        if (key in row) {
          newRow[columnHeaders[key]] = row[key];
        }
      });
      return newRow;
    });
  }

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths if provided
  if (columnWidths) {
    ws['!cols'] = Object.keys(columnWidths).map(idx => ({
      wch: columnWidths[idx]
    }));
  } else {
    // Auto-set column widths based on content
    const colWidths = [];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.v) {
          const cellValue = String(cell.v);
          maxWidth = Math.max(maxWidth, cellValue.length + 2);
        }
      }
      colWidths.push({ wch: Math.min(maxWidth, 30) });
    }
    ws['!cols'] = colWidths;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate filename with date
  const exportFilename = `${filename}_${formatDateForFilename(new Date())}.xlsx`;

  // Download file
  XLSX.writeFile(wb, exportFilename);

  return exportFilename;
}

/**
 * Export รายงานการลาเป็น Excel
 * @param {Object[]} leaves - Array of leave data
 * @param {string} reportTitle - ชื่อรายงาน
 */
export function exportLeavesToExcel(leaves, reportTitle = 'รายงานการลา') {
  const columnHeaders = {
    leaveNumber: 'เลขที่ใบลา',
    employeeCode: 'รหัสพนักงาน',
    employeeName: 'ชื่อ-นามสกุล',
    department: 'แผนก/กลุ่มงาน',
    leaveType: 'ประเภทการลา',
    startDate: 'วันที่เริ่ม',
    endDate: 'วันที่สิ้นสุด',
    totalDays: 'จำนวนวัน',
    status: 'สถานะ',
    reason: 'เหตุผล',
    createdAt: 'วันที่ยื่น'
  };

  const statusLabels = {
    pending: 'รอพิจารณา',
    approved_level1: 'ผอ.อนุมัติแล้ว',
    approved_level2: 'ระดับ 2 ผ่าน',
    approved_level3: 'ระดับ 3 ผ่าน',
    approved_final: 'อนุมัติแล้ว',
    rejected: 'ถูกปฏิเสธ',
    cancelled: 'ยกเลิกแล้ว'
  };

  const exportData = leaves.map(leave => ({
    leaveNumber: leave.leaveNumber || leave.leave_number || '-',
    employeeCode: leave.employeeCode || leave.user?.employee_code || '-',
    employeeName: leave.employeeName || `${leave.user?.first_name || ''} ${leave.user?.last_name || ''}`.trim() || '-',
    department: leave.department || leave.user?.department || '-',
    leaveType: leave.leaveType || leave.leave_types?.type_name || '-',
    startDate: formatDateThai(leave.startDate || leave.start_date),
    endDate: formatDateThai(leave.endDate || leave.end_date),
    totalDays: leave.totalDays || leave.total_days || 0,
    status: statusLabels[leave.status] || leave.status,
    reason: leave.reason || '-',
    createdAt: formatDateThai(leave.createdAt || leave.created_at)
  }));

  return exportToExcel(exportData, reportTitle, {
    sheetName: 'รายงานการลา',
    columnHeaders
  });
}

/**
 * Export รายงานเป็น PDF
 * @param {Object} options - PDF options
 */
export function exportToPDF(options) {
  const {
    title = 'รายงาน',
    data = [],
    columns = [],
    orientation = 'portrait', // 'portrait' or 'landscape'
    pageSize = 'a4'
  } = options;

  // Create PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize
  });

  // Set font (Note: For full Thai support, need to embed Thai font)
  doc.setFont('helvetica');
  doc.setFontSize(16);

  // Add title
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${formatDateThai(new Date())}`, pageWidth / 2, 28, { align: 'center' });

  // Table settings
  const startY = 40;
  const cellPadding = 3;
  const lineHeight = 8;
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginBottom = 20;

  // Calculate column widths
  const tableWidth = pageWidth - 20; // 10mm margin on each side
  const colWidth = tableWidth / columns.length;

  let currentY = startY;

  // Draw header
  doc.setFillColor(59, 130, 246); // Blue
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  
  doc.rect(10, currentY, tableWidth, lineHeight, 'F');
  
  columns.forEach((col, i) => {
    doc.text(col.header, 10 + (i * colWidth) + cellPadding, currentY + 5.5);
  });

  currentY += lineHeight;

  // Draw data rows
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);

  data.forEach((row, rowIndex) => {
    // Check if need new page
    if (currentY + lineHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 20;
      
      // Redraw header on new page
      doc.setFillColor(59, 130, 246);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      
      doc.rect(10, currentY, tableWidth, lineHeight, 'F');
      
      columns.forEach((col, i) => {
        doc.text(col.header, 10 + (i * colWidth) + cellPadding, currentY + 5.5);
      });
      
      currentY += lineHeight;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
    }

    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(10, currentY, tableWidth, lineHeight, 'F');
    }

    // Draw row data
    columns.forEach((col, i) => {
      let value = row[col.key] || '';
      // Truncate long text
      if (String(value).length > 20) {
        value = String(value).substring(0, 18) + '...';
      }
      doc.text(String(value), 10 + (i * colWidth) + cellPadding, currentY + 5.5);
    });

    currentY += lineHeight;
  });

  // Add border
  doc.setDrawColor(200, 200, 200);
  doc.rect(10, startY, tableWidth, currentY - startY, 'S');

  // Add page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Generate filename and download
  const filename = `${title.replace(/\s+/g, '_')}_${formatDateForFilename(new Date())}.pdf`;
  doc.save(filename);

  return filename;
}

/**
 * Export รายงานการลาเป็น PDF
 * @param {Object[]} leaves - Array of leave data
 * @param {string} reportTitle - ชื่อรายงาน
 */
export function exportLeavesToPDF(leaves, reportTitle = 'Leave Report') {
  const statusLabels = {
    pending: 'Pending',
    approved_level1: 'Level 1',
    approved_level2: 'Level 2',
    approved_level3: 'Level 3',
    approved_final: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled'
  };

  const data = leaves.map(leave => ({
    leaveNumber: leave.leaveNumber || leave.leave_number || '-',
    employeeName: leave.employeeName || `${leave.user?.first_name || ''} ${leave.user?.last_name?.charAt(0) || ''}.`.trim() || '-',
    leaveType: leave.leaveType || leave.leave_types?.type_name || '-',
    dates: `${formatDateShort(leave.startDate || leave.start_date)}`,
    days: leave.totalDays || leave.total_days || 0,
    status: statusLabels[leave.status] || leave.status
  }));

  const columns = [
    { key: 'leaveNumber', header: 'Leave No.' },
    { key: 'employeeName', header: 'Employee' },
    { key: 'leaveType', header: 'Type' },
    { key: 'dates', header: 'Date' },
    { key: 'days', header: 'Days' },
    { key: 'status', header: 'Status' }
  ];

  return exportToPDF({
    title: reportTitle,
    data,
    columns,
    orientation: 'landscape'
  });
}

// Helper functions
function formatDateThai(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

function formatDateForFilename(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export default {
  exportToExcel,
  exportToPDF,
  exportLeavesToExcel,
  exportLeavesToPDF
};
