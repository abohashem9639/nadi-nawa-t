const fs = require('fs');
const path = require('path');

const b64Path = path.join(__dirname, 'public/fonts/Arabic.base64');
const outputPath = path.join(__dirname, 'src/lib/fonts/arabic-font.js');

try {
    const b64Data = fs.readFileSync(b64Path, 'utf8').trim();
    const content = `export const ARABIC_FONT_BASE64 = "${b64Data}";\n`;

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content);
    console.log('Successfully generated arabic-font.js from Arabic.base64');
} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
