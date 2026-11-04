import { spawn } from 'child_process';

const server = spawn(process.execPath, ['./node_modules/tsx/dist/cli.mjs', 'server/index.ts'], { stdio: 'inherit' });
const dev = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', '--port=3000', '--host=0.0.0.0'], { stdio: 'inherit' });

function shutdown() {
  server.kill();
  dev.kill();
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);
