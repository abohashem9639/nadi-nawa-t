import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Loads a custom font into a jsPDF document.
 */
function loadFont(doc, fontBase64) {
    doc.addFileToVFS('NotoSansArabic.ttf', fontBase64);
    doc.addFont('NotoSansArabic.ttf', 'NotoSansArabic', 'normal');
    doc.setFont('NotoSansArabic');
}

/**
 * Downloads a universal PDF report.
 * Works with Arabic, English, Turkish – any language.
 */
export async function downloadUniversalPDF({ title, filename, headers, data, isRtl, fontBase64, summaryData }) {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    // Load Arabic-supporting font
    loadFont(doc, fontBase64);

    // Title
    doc.setFontSize(18);
    doc.text(title, 105, 20, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text(new Date().toLocaleString(), 105, 28, { align: 'center' });

    let startY = 36;

    // Summary table
    if (summaryData && summaryData.length > 0) {
        autoTable(doc, {
            startY: startY,
            head: [],
            body: summaryData.map(row => [String(row[0]), String(row[1])]),
            theme: 'grid',
            styles: {
                font: 'NotoSansArabic',
                fontSize: 10,
                cellPadding: 3,
                halign: isRtl ? 'right' : 'left'
            },
            columnStyles: {
                0: { fontStyle: 'normal', cellWidth: 60 },
                1: { cellWidth: 'auto' }
            },
            margin: { left: 30, right: 30 }
        });
        startY = doc.lastAutoTable.finalY + 10;
    }

    // Main data table
    autoTable(doc, {
        startY: startY,
        head: [headers],
        body: data.map(row => row.map(cell => String(cell))),
        theme: 'striped',
        headStyles: {
            fillColor: [166, 110, 41],
            font: 'NotoSansArabic',
            halign: isRtl ? 'right' : 'left'
        },
        styles: {
            font: 'NotoSansArabic',
            fontSize: 8,
            cellPadding: 2,
            halign: isRtl ? 'right' : 'left'
        }
    });

    doc.save(filename);
}
