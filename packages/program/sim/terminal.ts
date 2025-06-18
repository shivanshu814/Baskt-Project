import path from 'path';
import fs from 'fs';
import readline from 'readline';

const dirs = ['actions', 'read'];

async function loadActions() {
  const actions: Record<
    string,
    { fn: Function; description: string; mainName: string; aliases?: string[] }
  > = {};

  for (const dir of dirs) {
    const dirPath = path.join(__dirname, dir);
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.ts'));

    for (const file of files) {
      const actionPath = path.join(dirPath, file);
      let mod;
      try {
        mod = await import(actionPath);
      } catch (e) {
        mod = require(actionPath);
      }
      const fn = mod.default;
      const description = fn && fn.description ? fn.description : 'No description';
      if (typeof fn === 'function') {
        const mainName = file.replace(/\.ts$/, '');
        const aliases: string[] = Array.isArray(fn.aliases) ? fn.aliases : [];
        actions[mainName] = { fn, description, mainName, aliases };
        for (const alias of aliases) {
          actions[alias] = {
            fn,
            description: `(alias for ${mainName}) ${description}`,
            mainName,
            aliases,
          };
        }
      }
    }
  }
  return actions;
}

async function main() {
  const actions = await loadActions();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });
  console.log('Type a command, or type help. Use up/down arrows for history.');
  rl.prompt();
  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }
    if (input === 'exit') {
      rl.close();
      return;
    }
    if (input === 'help') {
      console.log('\nAvailable commands:');
      // Only show main commands (not aliases) in the help list, but display their aliases
      const shown = new Set<string>();
      for (const [cmd, { description, mainName, aliases }] of Object.entries(actions)) {
        if (cmd !== mainName || shown.has(mainName)) continue;
        const aliasStr = aliases && aliases.length ? ` (aliases: ${aliases.join(', ')})` : '';
        console.log(`  ${mainName}${aliasStr} - ${description}`);
        shown.add(mainName);
      }
      console.log('');
      rl.prompt();
      return;
    }
    if (input === 'clear') {
      process.stdout.write('\x1Bc');
      rl.prompt();
      return;
    }
    const [cmd, ...args] = input.split(/\s+/);
    if (!actions[cmd]) {
      console.error(`Unknown command: ${cmd}`);
      rl.prompt();
      return;
    }
    try {
      await actions[cmd].fn(args);
    } catch (err: any) {
      console.error('Error:', err?.message || err);
    }
    rl.prompt();
  });
  rl.on('close', () => {
    console.log('Goodbye!');
    process.exit(0);
  });
}

main();
