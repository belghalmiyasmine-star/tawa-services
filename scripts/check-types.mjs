import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectDir = join(__dirname, '..');

try {
  const tscPath = join(projectDir, 'node_modules', '.bin', 'tsc.cmd');
  const output = execSync(`"${tscPath}" --noEmit`, {
    cwd: projectDir,
    encoding: 'utf8',
    timeout: 90000,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log('TypeScript: PASSED');
  console.log(output);
  process.exit(0);
} catch (e) {
  console.log('TypeScript: ERRORS');
  console.log(e.stdout || '');
  console.log(e.stderr || '');
  process.exit(1);
}
