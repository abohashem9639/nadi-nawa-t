
// Simple Arabic Reshaper and RTL helper for jsPDF
// This is a minimal implementation to handle basic Arabic shaping and reversal.

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

// Simplified reshaper logic
export function fixArabicPDF(text) {
    if (!text) return text;

    // 1. First, basic shaping (joining letters)
    let reshaped = "";
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        let map = ARABIC_CHARACTER_MAP[char];

        if (!map) {
            reshaped += char;
            continue;
        }

        let prev = i > 0 ? text[i - 1] : null;
        let next = i < text.length - 1 ? text[i + 1] : null;

        let hasPrev = prev && ARABIC_CHARACTER_MAP[prev] && !['\u0627', '\u062F', '\u0630', '\u0631', '\u0632', '\u0648', '\u0622', '\u0623', '\u0625', '\u0624'].includes(prev);
        let hasNext = next && ARABIC_CHARACTER_MAP[next];

        if (!hasPrev && !hasNext) reshaped += map[0]; // Isolated
        else if (!hasPrev && hasNext) reshaped += map[2]; // Initial
        else if (hasPrev && hasNext) reshaped += map[3]; // Medial
        else if (hasPrev && !hasNext) reshaped += map[1]; // Final
    }

    // 2. Handle RTL by reversing Arabic words only or just global reverse if it's mostly Arabic
    // This is a simple global reverse for now, as jsPDF prints LTR.
    // For a cleaner version, we should reverse only Arabic segments.
    return reshaped.split("").reverse().join("");
}

export function prepareDocArabic(doc, fontBase64) {
    if (fontBase64) {
        doc.addFileToVFS('Arabic.ttf', fontBase64);
        doc.addFont('Arabic.ttf', 'Arabic', 'normal');
        doc.setFont('Arabic');
    }
    return doc;
}
