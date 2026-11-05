/**
 * The languages PLaMo 3 Translate knows (docs/translate.md §2): 53 codes, lowercase and without a
 * region, plus `ja(easy)`, Easy Japanese, which the model takes only as a target.
 */

/** A language as the pane shows it: its code, its own name and its English name. */
export interface Language {
  code: string
  native: string
  english: string
}

export const EASY_JAPANESE = 'ja(easy)'

export const LANGUAGES: readonly Language[] = [
  { code: 'ja', native: '日本語', english: 'Japanese' },
  { code: 'en', native: 'English', english: 'English' },
  { code: 'zh-hans', native: '简体中文', english: 'Chinese, simplified' },
  { code: 'zh-hant', native: '繁體中文', english: 'Chinese, traditional' },
  { code: 'ko', native: '한국어', english: 'Korean' },
  { code: 'ar', native: 'العربية', english: 'Arabic' },
  { code: 'az', native: 'Azərbaycan', english: 'Azerbaijani' },
  { code: 'be', native: 'Беларуская', english: 'Belarusian' },
  { code: 'bg', native: 'Български', english: 'Bulgarian' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali' },
  { code: 'ca', native: 'Català', english: 'Catalan' },
  { code: 'ceb', native: 'Cebuano', english: 'Cebuano' },
  { code: 'de', native: 'Deutsch', english: 'German' },
  { code: 'es', native: 'Español', english: 'Spanish' },
  { code: 'et', native: 'Eesti', english: 'Estonian' },
  { code: 'eu', native: 'Euskara', english: 'Basque' },
  { code: 'fa', native: 'فارسی', english: 'Persian' },
  { code: 'fr', native: 'Français', english: 'French' },
  { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati' },
  { code: 'he', native: 'עברית', english: 'Hebrew' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'hr', native: 'Hrvatski', english: 'Croatian' },
  { code: 'hu', native: 'Magyar', english: 'Hungarian' },
  { code: 'hy', native: 'Հայերեն', english: 'Armenian' },
  { code: 'id', native: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'it', native: 'Italiano', english: 'Italian' },
  { code: 'jv', native: 'Basa Jawa', english: 'Javanese' },
  { code: 'ka', native: 'ქართული', english: 'Georgian' },
  { code: 'kk', native: 'Қазақ', english: 'Kazakh' },
  { code: 'km', native: 'ខ្មែរ', english: 'Khmer' },
  { code: 'lt', native: 'Lietuvių', english: 'Lithuanian' },
  { code: 'lv', native: 'Latviešu', english: 'Latvian' },
  { code: 'ml', native: 'മലയാളം', english: 'Malayalam' },
  { code: 'mr', native: 'मराठी', english: 'Marathi' },
  { code: 'ms', native: 'Bahasa Melayu', english: 'Malay' },
  { code: 'my', native: 'မြန်မာ', english: 'Burmese' },
  { code: 'ne', native: 'नेपाली', english: 'Nepali' },
  { code: 'nl', native: 'Nederlands', english: 'Dutch' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  { code: 'pl', native: 'Polski', english: 'Polish' },
  { code: 'ru', native: 'Русский', english: 'Russian' },
  { code: 'si', native: 'සිංහල', english: 'Sinhala' },
  { code: 'sk', native: 'Slovenčina', english: 'Slovak' },
  { code: 'sl', native: 'Slovenščina', english: 'Slovenian' },
  { code: 'sr', native: 'Српски', english: 'Serbian' },
  { code: 'sw', native: 'Kiswahili', english: 'Swahili' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu' },
  { code: 'th', native: 'ไทย', english: 'Thai' },
  { code: 'tl', native: 'Tagalog', english: 'Tagalog' },
  { code: 'ur', native: 'اردو', english: 'Urdu' },
  { code: 'uz', native: 'Oʻzbek', english: 'Uzbek' },
  { code: 'vi', native: 'Tiếng Việt', english: 'Vietnamese' },
]

const CODES = new Set(LANGUAGES.map((language) => language.code))

/** A language the model translates from: one of the 53 (Easy Japanese is a target only). */
export function isSourceLang(value: unknown): value is string {
  return typeof value === 'string' && CODES.has(value)
}

/** A language the model translates into: one of the 53, or Easy Japanese. */
export function isTargetLang(value: unknown): value is string {
  return value === EASY_JAPANESE || isSourceLang(value)
}

/** The plain/polite form exists only for Japanese; the template refuses it for any other target. */
export function takesForm(target: string): boolean {
  return target === 'ja'
}

/** The language a swap puts on the source side: Easy Japanese cannot be a source, so it is Japanese. */
export function asSource(target: string): string {
  return target === EASY_JAPANESE ? 'ja' : target
}
