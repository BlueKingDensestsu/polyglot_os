/**
 * POLYGLOT OS — Per-Language, Per-Module Theme System
 * 
 * Each language-module pair has its own visual identity.
 * Components read from this config to render differently.
 * German Palace looks different from German Grammar.
 * Greek Palace looks different from German Palace.
 * 
 * This is Wozniak Rule 15: context cues simplify recall.
 */

export const THEMES = {
  // ─── GERMAN ───
  'de-grammar': {
    name: 'German Grammar',
    primary: '#0d9488',        // teal
    accent: '#0ea5e9',         // sky blue
    headerGradient: 'linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Nunito', system-ui, sans-serif",
    exerciseColors: {
      transform: '#14b8a6',    // teal
      error_fix: '#f43f5e',    // coral
      translate: '#f59e0b',    // amber
      produce: '#8b5cf6',      // violet
      paragraph: '#0ea5e9',    // sky
    },
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'der' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'die' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'das' },
    },
  },
  'de-palace': {
    name: 'German Palace',
    primary: '#2563eb',        // blue
    accent: '#7c3aed',         // violet
    headerGradient: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Nunito', system-ui, sans-serif",
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'der' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'die' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'das' },
    },
  },

  // ─── GREEK ───
  'el-grammar': {
    name: 'Greek Grammar',
    primary: '#1e40af',        // deep blue
    accent: '#06b6d4',         // cyan
    headerGradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Noto Sans', system-ui, sans-serif",
    exerciseColors: {
      transform: '#2563eb',
      error_fix: '#dc2626',
      translate: '#ea580c',
      produce: '#7c3aed',
      paragraph: '#0891b2',
    },
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'ο' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'η' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'το' },
    },
  },
  'el-palace': {
    name: 'Greek Palace',
    primary: '#0369a1',        // ocean blue
    accent: '#0d9488',         // teal
    headerGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Noto Sans', system-ui, sans-serif",
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'ο' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'η' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'το' },
    },
  },

  // ─── RUSSIAN ───
  'ru-grammar': {
    name: 'Russian Grammar',
    primary: '#7f1d1d',        // deep red
    accent: '#dc2626',         // red
    headerGradient: 'linear-gradient(135deg, #450a0a 0%, #b91c1c 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Noto Sans', system-ui, sans-serif",
    exerciseColors: {
      transform: '#b91c1c',
      error_fix: '#c2410c',
      translate: '#a16207',
      produce: '#6d28d9',
      paragraph: '#0e7490',
    },
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'м' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'ж' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'ср' },
    },
  },
  'ru-palace': {
    name: 'Russian Palace',
    primary: '#991b1b',
    accent: '#ea580c',
    headerGradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Noto Sans', system-ui, sans-serif",
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'м' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'ж' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'ср' },
    },
  },

  // ─── SPANISH ───
  'es-grammar': {
    name: 'Spanish Grammar',
    primary: '#c2410c',        // orange-red
    accent: '#f59e0b',         // amber
    headerGradient: 'linear-gradient(135deg, #9a3412 0%, #ea580c 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Nunito', system-ui, sans-serif",
    exerciseColors: {
      transform: '#ea580c',
      error_fix: '#dc2626',
      translate: '#ca8a04',
      produce: '#7c3aed',
      paragraph: '#0891b2',
    },
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'el' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'la' },
    },
  },
  'es-palace': {
    name: 'Spanish Palace',
    primary: '#b45309',
    accent: '#d97706',
    headerGradient: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Nunito', system-ui, sans-serif",
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'el' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'la' },
    },
  },
};

/**
 * Get theme for a language-module combination
 * Falls back to German grammar if not found
 */
export function getTheme(langCode, module) {
  const key = langCode + '-' + module;
  return THEMES[key] || THEMES['de-grammar'];
}

/**
 * Get all available languages
 */
export function getLanguages() {
  const langs = {};
  Object.keys(THEMES).forEach(key => {
    const [code] = key.split('-');
    if (!langs[code]) {
      langs[code] = {
        code,
        name: { de: 'German', el: 'Greek', ru: 'Russian', es: 'Spanish', 
                ko: 'Korean', pt: 'Portuguese', ja: 'Japanese', it: 'Italian',
                ar: 'Arabic', zh: 'Mandarin' }[code] || code,
        flag: { de: '🇩🇪', el: '🇬🇷', ru: '🇷🇺', es: '🇪🇸',
                ko: '🇰🇷', pt: '🇵🇹', ja: '🇯🇵', it: '🇮🇹',
                ar: '🇸🇦', zh: '🇨🇳' }[code] || '🌍',
      };
    }
  });
  return Object.values(langs);
}
