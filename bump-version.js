import fs from 'fs';
import { resolve } from 'path';

const packagePath = resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

// Increments the Patch (1.5.7 -> 1.5.8)
const versionParts = pkg.version.split('.').map(Number);
versionParts[2] += 1;

const newVersion = versionParts.join('.');
pkg.version = newVersion;

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`🚀 Version bumped to ${newVersion}`);