
import pdfMake from "pdfmake/build/pdfmake";
// Note: We don't import vfs_fonts because we use our own custom font
import arabicReshaper from 'arabic-reshaper';

/**
 * Prepares reshaped Arabic text for PDF generation.
 * This is necessary because most PDF libraries don't handle glyph joining (shaping) automatically.
 * @param {string} text 
 * @returns {string}
 */
export function fixArabicText(text) {
    if (!text) return "";
    // Check if contains Arabic
    const hasArabicData = /[\u0600-\u06FF\uFE70-\uFEFF]/.test(text);
    if (!hasArabicData) return text;

    try {
        return arabicReshaper.reshape(text);
    } catch (e) {
        console.error("Reshaping failed:", e);
        return text;
    }
}

/**
 * Configure global PDF settings (fonts, etc.)
 * @param {string} fontBase64 
 */
export function configurePDF(fontBase64) {
    const fontName = 'MainFont';

    pdfMake.fonts = {
        MainFont: {
            normal: 'MainFont.ttf',
            bold: 'MainFont.ttf',
            italics: 'MainFont.ttf',
            bolditalics: 'MainFont.ttf'
        }
    };

    const vfs = {
        'MainFont.ttf': fontBase64
    };

    return { pdfMake, vfs };
}

/**
 * Generates and downloads a universal PDF report.
 * Supports all languages, RTL, and tables.
 */
export async function downloadUniversalPDF({ title, filename, headers, data, isRtl, fontBase64, summaryData }) {
    const { pdfMake, vfs } = configurePDF(fontBase64);

    // Reshape all strings in the data
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
                reshapedHeaders.map(h => ({ text: h, style: 'tableHeader' })),
                ...reshapedData
            ]
        },
        layout: {
            fillColor: function (rowIndex) {
                return (rowIndex % 2 === 0 && rowIndex > 0) ? '#f9f9f9' : null;
            }
        }
    });

    pdfMake.createPdf(docDefinition, null, null, vfs).download(filename);
}
