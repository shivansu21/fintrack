import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const path = new URL('../server/.env', import.meta.url);
if (existsSync(path)) console.log('server/.env already exists; kept your settings.');
else { writeFileSync(path, readFileSync(new URL('../server/.env.example', import.meta.url),'utf8').replace('replace-with-a-random-secret-at-least-32-characters',randomBytes(48).toString('hex'))); console.log('Created server/.env with a unique secret.'); }
