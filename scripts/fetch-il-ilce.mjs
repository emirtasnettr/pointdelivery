#!/usr/bin/env node
/**
 * Fetches Turkey provinces and districts from GitHub and writes lib/data/il-ilce.ts
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(__dirname, '..');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const [provinces, districts] = await Promise.all([
    get('https://raw.githubusercontent.com/liophin/TurkeyProvinces-2022/main/province.json'),
    get('https://raw.githubusercontent.com/liophin/TurkeyProvinces-2022/main/district.json'),
  ]);

  const provincesTs = provinces.map((p) => ({ id: p.id, name: p.Title }));
  const districtsByProvince = {};
  for (const d of districts) {
    const pid = parseInt(d.ProvinceID, 10);
    if (!districtsByProvince[pid]) districtsByProvince[pid] = [];
    districtsByProvince[pid].push(d.Title);
  }

  const out = `/**
 * Türkiye il ve ilçe listesi (TurkeyProvinces-2022)
 * https://github.com/liophin/TurkeyProvinces-2022
 */

export interface Il {
  id: number;
  name: string;
}

export const provinces: Il[] = ${JSON.stringify(provincesTs, null, 2)};

export const districtsByProvince: Record<number, string[]> = ${JSON.stringify(districtsByProvince, null, 2)};

export function getDistricts(provinceId: number): string[] {
  return districtsByProvince[provinceId] ?? [];
}
`;

  const outPath = path.join(base, 'lib', 'data', 'il-ilce.ts');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, 'utf8');
  console.log('Wrote', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
