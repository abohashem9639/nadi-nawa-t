
import pdfMake from "pdfmake/build/pdfmake";
import * as arabicReshaper from 'arabic-reshaper';

// Handle different import styles for arabic-reshaper
const reshaper = (arabicReshaper && arabicReshaper.default) ? arabicReshaper.default : arabicReshaper;

/**
 * Prepares reshaped Arabic text for PDF generation.
 */
export function fixArabicText(text) {
    if (!text) return "";
    text = String(text);
    const hasArabicData = /[\u0600-\u06FF\uFE70-\uFEFF]/.test(text);
    if (!hasArabicData) return text;

    try {
        if (typeof reshaper.reshape === 'function') {
            return reshaper.reshape(text);
        }
        return text;
    } catch (e) {
        console.error("Reshaping failed:", e);
        return text;
    }
}

/**
 * Generates and downloads a universal PDF report.
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
    const reshapedHeaders = headers.map(h => fixArabicText(h));
    const reshapedData = data.map(row => row.map(cell => fixArabicText(String(cell))));

    const docDefinition = {
        content: [
            { text: reshapedTitle, style: 'header', alignment: 'center' },
            { text: '\n' },
        ],
        defaultStyle: {
            font: 'MainFont',
            fontSize: 10,
            alignment: isRtl ? 'right' : 'left'
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
                fillColor: '#A66E29',
                alignment: 'center'
            }
        },
        rtl: isRtl
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
            margin: [40, 0, 40, 20],
            layout: 'lightHorizontalLines'
        });
    }

    // Add main table
    docDefinition.content.push({
        table: {
            headerRows: 1,
            widths: headers.map(() => 'auto'),
            body: [
                reshapedHeaders.map(h => ({ text: h, style: 'tableHeader', margin: [5, 2] })),
                ...reshapedData.map(row => row.map(cell => ({ text: cell, margin: [5, 2] })))
            ]
        },
        layout: {
            fillColor: function (rowIndex) {
                return (rowIndex % 2 === 0 && rowIndex > 0) ? '#f9f9f9' : null;
            }
        }
    });

    // 3. Create and Download
    // Using the 4-argument signature: createPdf(docDefinition, tableLayouts, fonts, vfs)
    pdfMake.createPdf(docDefinition, null, fonts, vfs).download(filename);
}
