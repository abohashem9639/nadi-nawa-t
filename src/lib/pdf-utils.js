
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize default fonts first
pdfMake.addFonts(pdfFonts);

/**
 * Generates and downloads a universal PDF report using pdfMake v0.3.x
 */
export async function downloadUniversalPDF({ title, filename, headers, data, isRtl, fontBase64, summaryData }) {
    // 1. Register the Arabic font in the virtual file system
    pdfMake.virtualfs.writeFileSync('Arabic.ttf', fontBase64);

    // 2. Register the font family
    pdfMake.fonts.Arabic = {
        normal: 'Arabic.ttf',
        bold: 'Arabic.ttf',
        italics: 'Arabic.ttf',
        bolditalics: 'Arabic.ttf'
    };

    // 3. Build table body
    const tableBody = [
        headers.map(h => ({
            text: h,
            style: 'tableHeader',
            alignment: 'center',
            margin: [5, 5]
        }))
    ];

    data.forEach(row => {
        tableBody.push(row.map(cell => ({
            text: String(cell),
            alignment: isRtl ? 'right' : 'left',
            margin: [5, 3]
        })));
    });

    // 4. Build the document definition
    const docDefinition = {
        content: [
            { text: title, style: 'header', alignment: 'center' },
            { text: '\n' },
        ],
        defaultStyle: {
            font: 'Arabic',
            fontSize: 10,
        },
        styles: {
            header: {
                fontSize: 18,
                margin: [0, 0, 0, 10]
            },
            tableHeader: {
                fontSize: 11,
                color: 'white',
                fillColor: '#A66E29'
            }
        }
    };

    // Add summary table if provided
    if (summaryData && summaryData.length > 0) {
        docDefinition.content.push({
            table: {
                widths: ['*', 'auto'],
                body: summaryData.map(row => [
                    { text: String(row[1]), alignment: isRtl ? 'right' : 'left' },
                    { text: String(row[0]), alignment: isRtl ? 'left' : 'right' }
                ])
            },
            margin: [40, 10, 40, 20],
            layout: 'lightHorizontalLines'
        });
    }

    // Add main data table
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

    // 5. Create and Download
    pdfMake.createPdf(docDefinition).download(filename);
}
