
// Better Arabic Reshaper and RTL helper for jsPDF
// This handles basic Arabic shaping and mixed LTR/RTL text reversal.

const ARABIC_CHARACTER_MAP = {
    '\u0627': ['\uFE8D', '\uFE8E', '\uFE8D', '\uFE8E'], // Alif
    '\u0628': ['\uFE8F', '\uFE90', '\uFE91', '\uFE92'], // Ba
    '\u062A': ['\uFE95', '\uFE96', '\uFE97', '\uFE98'], // Ta
    '\u062B': ['\uFE99', '\uFE9A', '\uFE9B', '\uFE9C'], // Tha
    '\u062C': ['\uFE9D', '\uFE9E', '\uFE9F', '\uFEA0'], // Jeem
    '\u062D': ['\uFEA1', '\uFEA2', '\uFEA3', '\uFEA4'], // Hha
    '\u062E': ['\uFEA5', '\uFEA6', '\uFEA7', '\uFEA8'], // Kha
    '\u062F': ['\uFEA9', '\uFEAA', '\uFEA9', '\uFEAA'], // Dal
    '\u0630': ['\uFEAB', '\uFEAC', '\uFEAB', '\uFEAC'], // Thal
    '\u0631': ['\uFEAD', '\uFEAE', '\uFEAD', '\uFEAE'], // Ra
    '\u0632': ['\uFEAF', '\uFEB0', '\uFEAF', '\uFEB0'], // Zain
    '\u0633': ['\uFEB1', '\uFEB2', '\uFEB3', '\uFEB4'], // Seen
    '\u0634': ['\uFEB5', '\uFEB6', '\uFEB7', '\uFEB8'], // Sheen
    '\u0635': ['\uFEB9', '\uFEBA', '\uFEBB', '\uFEBC'], // Sad
    '\u0636': ['\uFEBD', '\uFEBE', '\uFEBF', '\uFEC0'], // Dad
    '\u0637': ['\uFEC1', '\uFEC2', '\uFEC3', '\uFEC4'], // Tah
    '\u0638': ['\uFEC5', '\uFEC6', '\uFEC7', '\uFEC8'], // Zah
    '\u0639': ['\uFEC9', '\uFECA', '\uFECB', '\uFECC'], // Ain
    '\u063A': ['\uFECD', '\uFECE', '\uFECF', '\uFED0'], // Ghain
    '\u0641': ['\uFED1', '\uFED2', '\uFED3', '\uFED4'], // Fa
    '\u0642': ['\uFED5', '\uFED6', '\uFED7', '\uFED8'], // Qaf
    '\u0643': ['\uFED9', '\uFEDA', '\uFEDB', '\uFEDC'], // Kaf
    '\u0644': ['\uFEDD', '\uFEDE', '\uFEDF', '\uFEE0'], // Lam
    '\u0645': ['\uFEE1', '\uFEE2', '\uFEE3', '\uFEE4'], // Meem
    '\u0646': ['\uFEE5', '\uFEE6', '\uFEE7', '\uFEE8'], // Noon
    '\u0647': ['\uFEE9', '\uFEEA', '\uFEEB', '\uFEEC'], // Heh
    '\u0648': ['\uFEED', '\uFEEE', '\uFEED', '\uFEEE'], // Waw
    '\u0649': ['\uFEEF', '\uFEF0', '\uFEEF', '\uFEF0'], // Yeh (Alif Maqsura)
    '\u064A': ['\uFEF1', '\uFEF2', '\uFEF3', '\uFEF4'], // Yeh
    '\u0622': ['\uFE81', '\uFE82', '\uFE81', '\uFE82'], // Alif Madda
    '\u0623': ['\uFE83', '\uFE84', '\uFE83', '\uFE84'], // Alif Hamza Above
    '\u0624': ['\uFE85', '\uFE86', '\uFE85', '\uFE86'], // Waw Hamza Above
    '\u0625': ['\uFE87', '\uFE88', '\uFE87', '\uFE88'], // Alif Hamza Below
    '\u0626': ['\uFE89', '\uFE8A', '\uFE8B', '\uFE8C'], // Yeh Hamza Above
    '\u0629': ['\uFE93', '\uFE94', '\uFE93', '\uFE94'], // Teh Marbuta
};

const NON_JOINING = ['\u0627', '\u062D', '\u0630', '\u0631', '\u0632', '\u0648', '\u0622', '\u0623', '\u0625', '\u0624', '\u0629'];

function isArabicChar(char) {
    if (!char) return false;
    const code = char.charCodeAt(0);
    return (code >= 0x0600 && code <= 0x06FF) || (code >= 0xFE70 && code <= 0xFEFF);
}

function reshape(text) {
    let result = "";
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        let map = ARABIC_CHARACTER_MAP[char];

        if (!map) {
            result += char;
            continue;
        }

        let prev = i > 0 ? text[i - 1] : null;
        let next = i < text.length - 1 ? text[i + 1] : null;

        let hasPrev = prev && ARABIC_CHARACTER_MAP[prev] && !NON_JOINING.includes(prev);
        let hasNext = next && ARABIC_CHARACTER_MAP[next];

        if (!hasPrev && !hasNext) result += map[0]; // Isolated
        else if (!hasPrev && hasNext) result += map[2]; // Initial
        else if (hasPrev && hasNext) result += map[3]; // Medial
        else if (hasPrev && !hasNext) result += map[1]; // Final
    }
    return result;
}

export function fixArabicPDF(text) {
    if (!text) return text;

    // Convert to string just in case
    text = String(text);

    // First reshape English/Mixed characters correctly (reshape only Arabic)
    let reshaped = reshape(text);

    // Determine if it should be reversed (if contains Arabic)
    const hasArabicData = /[\u0600-\u06FF\uFE70-\uFEFF]/.test(text);
    if (!hasArabicData) return text;

    // Simple word-based reversal for mixed text or global reversal
    // For PDFs, usually we need to reverse the whole line because jsPDF is strictly LTR.
    // Numbers and English words within Arabic lines will APPEAR reversed if we just global reverse.
    // However, a simple reverse is better than forward Arabic.

    // Let's try a better approach: reverse only the string if it's mostly Arabic or has Arabic
    return reshaped.split("").reverse().join("");
}

export function prepareDocArabic(doc, fontBase64) {
    if (!fontBase64 || fontBase64.length < 100) {
        console.error("Invalid font data provided to PDF gen");
        return doc;
    }
    try {
        doc.addFileToVFS('Arabic.ttf', fontBase64);
        doc.addFont('Arabic.ttf', 'Arabic', 'normal');
        doc.setFont('Arabic');
    } catch (err) {
        console.error("Failed to load PDF font:", err);
    }
    return doc;
}
