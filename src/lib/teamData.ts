// Zastave in barve ekip za prikaz v karticah tekem
export const TEAM_DATA: Record<string, { flag: string; color: string }> = {
  // Skupina A
  'Mehika':                { flag: '🇲🇽', color: '#006847' },
  'Južna Koreja':          { flag: '🇰🇷', color: '#c60c30' },
  'Češka':                 { flag: '🇨🇿', color: '#d7141a' },
  'Južna Afrika':          { flag: '🇿🇦', color: '#007a4d' },
  // Skupina B
  'Kanada':                { flag: '🇨🇦', color: '#d80621' },
  'Bosna in Hercegovina':  { flag: '🇧🇦', color: '#002395' },
  'Švica':                 { flag: '🇨🇭', color: '#d52b1e' },
  'Katar':                 { flag: '🇶🇦', color: '#8d1b3d' },
  // Skupina C
  'Brazilija':             { flag: '🇧🇷', color: '#009c3b' },
  'Maroko':                { flag: '🇲🇦', color: '#c1272d' },
  'Haiti':                 { flag: '🇭🇹', color: '#00209f' },
  'Škotska':               { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', color: '#003f87' },
  // Skupina D
  'ZDA':                   { flag: '🇺🇸', color: '#002868' },
  'Turčija':               { flag: '🇹🇷', color: '#e30a17' },
  'Avstralija':            { flag: '🇦🇺', color: '#012169' },
  'Paragvaj':              { flag: '🇵🇾', color: '#d52b1e' },
  // Skupina E
  'Nemčija':               { flag: '🇩🇪', color: '#1a1a1a' },
  'Ekvador':               { flag: '🇪🇨', color: '#003087' },
  'Slonokoščena obala':    { flag: '🇨🇮', color: '#f77f00' },
  'Curaçao':               { flag: '🇨🇼', color: '#003da5' },
  // Skupina F
  'Nizozemska':            { flag: '🇳🇱', color: '#ae1c28' },
  'Japonska':              { flag: '🇯🇵', color: '#bc002d' },
  'Švedska':               { flag: '🇸🇪', color: '#006aa7' },
  'Tunizija':              { flag: '🇹🇳', color: '#e70013' },
  // Skupina G
  'Belgija':               { flag: '🇧🇪', color: '#1a1a1a' },
  'Egipt':                 { flag: '🇪🇬', color: '#c8102e' },
  'Iran':                  { flag: '🇮🇷', color: '#239f40' },
  'Nova Zelandija':        { flag: '🇳🇿', color: '#012169' },
  // Skupina H
  'Španija':               { flag: '🇪🇸', color: '#aa151b' },
  'Zelenortski otoki':     { flag: '🇨🇻', color: '#003893' },
  'Savdska Arabija':       { flag: '🇸🇦', color: '#006c35' },
  'Urugvaj':               { flag: '🇺🇾', color: '#5591d4' },
  // Skupina I
  'Francija':              { flag: '🇫🇷', color: '#002395' },
  'Senegal':               { flag: '🇸🇳', color: '#00853f' },
  'Irak':                  { flag: '🇮🇶', color: '#ce1126' },
  'Norveška':              { flag: '🇳🇴', color: '#ef2b2d' },
  // Skupina J
  'Argentina':             { flag: '🇦🇷', color: '#74acdf' },
  'Alžirija':              { flag: '🇩🇿', color: '#006233' },
  'Avstrija':              { flag: '🇦🇹', color: '#ed2939' },
  'Jordanija':             { flag: '🇯🇴', color: '#007a3d' },
  // Skupina K
  'Portugalska':           { flag: '🇵🇹', color: '#006600' },
  'DR Kongo':              { flag: '🇨🇩', color: '#007fff' },
  'Uzbekistan':            { flag: '🇺🇿', color: '#1eb53a' },
  'Kolumbija':             { flag: '🇨🇴', color: '#fcd116' },
  // Skupina L
  'Anglija':               { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#cf081f' },
  'Hrvaška':               { flag: '🇭🇷', color: '#ef2b2d' },
  'Gana':                  { flag: '🇬🇭', color: '#006b3f' },
  'Panama':                { flag: '🇵🇦', color: '#d21034' },
}

export function getTeam(name: string) {
  return TEAM_DATA[name] ?? { flag: '🏳️', color: '#6b7280' }
}

export function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
