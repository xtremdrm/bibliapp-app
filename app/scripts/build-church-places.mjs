// Builds src/assets/churches/places.json from the GeoNames postal code dump for Spain
// (https://download.geonames.org/export/zip/ES.zip, CC BY 4.0) and the parish list.
//
//   node scripts/build-church-places.mjs <path/to/ES.txt>
//
// Output: { m: [[name, province, community], ...], cp: { "46001": [lat, lon, [mIdx...]] } }
// Only postal codes used by a parish are kept, so the file stays small.

import { readFileSync, writeFileSync } from 'node:fs';

const [, , esPath] = process.argv;
if (!esPath) {
  console.error('Usage: node scripts/build-church-places.mjs <ES.txt>');
  process.exit(1);
}

const COMMUNITIES = {
  AN: 'Andalucía', AR: 'Aragón', AS: 'Asturias', CB: 'Cantabria', CE: 'Ceuta',
  CL: 'Castilla y León', CM: 'Castilla-La Mancha', CN: 'Canarias', CT: 'Cataluña',
  EX: 'Extremadura', GA: 'Galicia', IB: 'Islas Baleares', MC: 'Región de Murcia',
  MD: 'Comunidad de Madrid', ML: 'Melilla', NC: 'Navarra', PV: 'País Vasco',
  RI: 'La Rioja', VC: 'Comunidad Valenciana',
};

const LOWER = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'i', 'en', 'da', 'do', 'das', 'dos', 'a']);

// "Valencia De Don Juan" -> "Valencia de Don Juan"; "Barco, O" -> "O Barco".
function prettyName(raw) {
  let name = raw.trim();
  const article = name.match(/^(.*),\s*(El|La|Los|Las|L'|O|A|Os|As|Es|Sa|Ses|S')$/i);
  if (article) name = `${article[2]}${article[2].endsWith("'") ? '' : ' '}${article[1]}`;
  return name
    .split(' ')
    .map((w, i) => (i > 0 && LOWER.has(w.toLowerCase()) ? w.toLowerCase() : w))
    .join(' ');
}

// "Nudos, Los (Tabernas)" belongs to the municipality "Tabernas", but in
// "Aeropuerto De Manises (Valencia)" the parenthesis is the province: skip those places.
function municipalityOf(placeName, province) {
  const inner = placeName.match(/\(([^)]+)\)\s*$/);
  if (inner && fold(inner[1]) === fold(province)) return null;
  return prettyName(inner ? inner[1] : placeName);
}

const parishes = JSON.parse(readFileSync('src/assets/churches/parroquias_espana.json', 'utf8'));
const usedCps = new Set(parishes.map(p => String(p.codigo_postal).padStart(5, '0')));

// GeoNames often drops accents ("Valencia de Alcantara"); reuse the parish list's spelling.
const fold = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const accented = new Map();
for (const p of parishes) {
  const name = String(p.poblacion ?? '').trim();
  if (name && /[áéíóúüñàèòïç]/i.test(name) && !/[a-zà-ÿ][A-ZÀ-Þ]/.test(name)) accented.set(fold(name), name);
}
const withAccents = name => accented.get(fold(name)) ?? name;

const rows = readFileSync(esPath, 'utf8').trim().split('\n').map(l => l.split('\t'));

const munis = [];
const muniIndex = new Map();
const cp = {};

for (const r of rows) {
  const [, code, place, , adminCode1, province, , , , lat, lon] = r;
  if (!usedCps.has(code)) continue;
  const muni = municipalityOf(place, province);
  if (!muni) continue;
  const name = withAccents(muni);
  const community = COMMUNITIES[adminCode1] ?? '';
  const key = `${name}|${province}`;
  if (!muniIndex.has(key)) {
    muniIndex.set(key, munis.length);
    munis.push([name, province, community]);
  }
  const m = muniIndex.get(key);
  if (!cp[code]) cp[code] = [Number(lat), Number(lon), []];
  if (!cp[code][2].includes(m)) cp[code][2].push(m);
}

// Parish postal codes GeoNames lacks: borrow the closest known code in the same province.
const known = Object.keys(cp).sort();
let borrowed = 0;
for (const code of usedCps) {
  if (cp[code]) continue;
  const sameProvince = known.filter(k => k.slice(0, 2) === code.slice(0, 2));
  if (!sameProvince.length) continue;
  const nearest = sameProvince.reduce((a, b) =>
    Math.abs(+b - +code) < Math.abs(+a - +code) ? b : a);
  cp[code] = [cp[nearest][0], cp[nearest][1], []];
  borrowed++;
}

writeFileSync('src/assets/churches/places.json', JSON.stringify({ m: munis, cp }));
console.log(`places.json: ${munis.length} municipalities, ${Object.keys(cp).length} postal codes (${borrowed} approximated)`);
