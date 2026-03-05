
import pdfMake from "pdfmake/build/pdfmake";
import * as arabicReshaper from 'arabic-reshaper';

// Handle different import styles for arabic-reshaper
const reshaper = (arabicReshaper && arabicReshaper.default) ? arabicReshaper.default : arabicReshaper;

/**
 * Prepares reshaped Arabic text for PDF generation.
 */
export function fixArabicText(text) {
    if (!text || text === '—') return text;
    text = String(text);
    const hasArabicData = /[\u0600-\u06FF\uFE70-\uFEFF]/.test(text);
    if (!hasArabicData) return text;

    try {
        if (reshaper && typeof reshaper.reshape === 'function') {
            return reshaper.reshape(text);
        }
        return text;
    } catch (e) {
        console.error("Reshaping failed:", e);
        return text;
    }
}

/**
 * Generates and downloads a universal PDF report using pdfMake.
 */
export async function downloadUniversalPDF({ title, filename, headers, data, isRtl, fontBase64, summaryData }) {
    // 1. Setup VFS and Fonts
    const vfs = {
        'MainFont.ttf': fontBase64
    };

    const fonts = {
        MainFont: {
            normal: 'MainFont.ttf',
            bold: 'MainFont.ttf',
            italics: 'MainFont.ttf',
            bolditalics: 'MainFont.ttf'
        }
    };

    // 2. Prepare Content
    const reshapedTitle = fixArabicText(title);
    const reshapedHeaders = headers.map(h => ({
        text: fixArabicText(h),
        style: 'tableHeader',
        alignment: 'center',
        margin: [5, 5]
    }));

    const tableBody = [reshapedHeaders];

    data.forEach(row => {
        tableBody.push(row.map(cell => ({
            text: fixArabicText(String(cell)),
            alignment: isRtl ? 'right' : 'left',
            margin: [5, 3]
        })));
    });

    const docDefinition = {
        content: [
            { text: reshapedTitle, style: 'header', alignment: 'center' },
            { text: '\n' },
        ],
        defaultStyle: {
            font: 'MainFont',
            fontSize: 10,
        },
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            tableHeader: {
                bold: true,
                fontSize: 11,
                color: 'white',
                fillColor: '#A66E29'
            }
        }
    };

    // Add summary if provided
    if (summaryData && summaryData.length > 0) {
        docDefinition.content.push({
            table: {
                widths: ['*', 'auto'],
                body: summaryData.map(row => [
                    { text: fixArabicText(String(row[1])), alignment: isRtl ? 'right' : 'left' },
                    { text: fixArabicText(String(row[0])), bold: true, alignment: isRtl ? 'left' : 'right' }
                ])
            },
            margin: [40, 10, 40, 20],
            layout: 'lightHorizontalLines'
        });
    }

    // Add main table
    docDefinition.content.push({
        table: {
            headerRows: 1,
            widths: headers.map(() => 'auto'),
            body: tableBody
        },
        layout: {
            fillColor: function (rowIndex) {
                return (rowIndex % 2 === 0 && rowIndex > 0) ? '#f9f9f9' : null;
            }
        }
    });

    // Handle RTL globally if needed (pdfMake supports it via text properties mostly)
    // For true RTL rendering in tables, we use the alignment property per cell.

    // 3. Create and Download using the correct 4-argument call
    // createPdf(docDefinition, tableLayouts, fonts, vfs)
    pdfMake.createPdf(docDefinition, {}, fonts, vfs).download(filename);
}
