import { watch } from 'fs';
import { exec } from 'child_process';
import { join } from 'path';

// Configurations
const WATCH_DIR = process.cwd();
const DEBOUNCE_DELAY = 3000; // 3 seconds
const IGNORED_PATHS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.env',
  '.env.local',
  'package-lock.json'
];

let timeoutId = null;
let isSyncing = false;
let pendingChanges = false;

function shouldIgnore(path) {
  return IGNORED_PATHS.some(ignored => {
    const relativePart = path.split(/[/\\]/)[0];
    return relativePart === ignored || path.includes(ignored);
  });
}

function runCommand(command) {
  return new Promise((resolve) => {
    exec(command, { cwd: WATCH_DIR }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, output: stderr || error.message });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
}

async function syncToGithub() {
  if (isSyncing) {
    pendingChanges = true;
    return;
  }

  isSyncing = true;
  pendingChanges = false;
  
  console.log(`\x1b[36m[${new Date().toLocaleTimeString()}] Detectando alterações... Sincronizando com o GitHub...\x1b[0m`);

  // Check if there are actual changes to commit
  const status = await runCommand('git status --porcelain');
  if (!status.success || !status.output.trim()) {
    console.log(`\x1b[33m[${new Date().toLocaleTimeString()}] Sem alterações relevantes para sincronizar.\x1b[0m`);
    isSyncing = false;
    return;
  }

  console.log(`\x1b[32m[${new Date().toLocaleTimeString()}] Alterações encontradas. Enviando para o GitHub...\x1b[0m`);
  
  // 1. Git Add
  const add = await runCommand('git add .');
  if (!add.success) {
    console.error('\x1b[31mErro ao adicionar arquivos:\x1b[0m', add.output);
    isSyncing = false;
    return;
  }

  // 2. Git Commit
  const commitMsg = `Auto-update: local edit em ${new Date().toLocaleString('pt-BR')}`;
  const commit = await runCommand(`git commit -m "${commitMsg}"`);
  if (!commit.success) {
    console.error('\x1b[31mErro ao criar commit:\x1b[0m', commit.output);
    isSyncing = false;
    return;
  }

  // 3. Git Push
  const push = await runCommand('git push origin main');
  if (!push.success) {
    console.error('\x1b[31mErro ao enviar para o GitHub (Push):\x1b[0m', push.output);
    console.log('\x1b[33mDica: Verifique se você está logado no Git ou se o repositório exige autenticação.\x1b[0m');
  } else {
    console.log(`\x1b[32m✔ [${new Date().toLocaleTimeString()}] Sincronizado com sucesso no GitHub!\x1b[0m`);
  }

  isSyncing = false;
  
  // If changes occurred during syncing, trigger again
  if (pendingChanges) {
    triggerSync();
  }
}

function triggerSync() {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(() => {
    syncToGithub();
  }, DEBOUNCE_DELAY);
}

console.log('\x1b[35m=== Monitor de Sincronização Automática Ativo ===\x1b[0m');
console.log(`Monitorando alterações em: ${WATCH_DIR}`);
console.log('Qualquer arquivo alterado será enviado automaticamente para o GitHub após 3 segundos sem novas edições.');
console.log('Pressione Ctrl+C para encerrar o monitor.');
console.log('--------------------------------------------------');

// Start watching
watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename || shouldIgnore(filename)) {
    return;
  }
  
  triggerSync();
});
