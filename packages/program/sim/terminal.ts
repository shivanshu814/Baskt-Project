import path from 'path';
import fs from 'fs';
import readline from 'readline';

const dirs = ['actions', 'read'];

// Recursively get all TypeScript files from a directory
function getTypeScriptFiles(dirPath: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively search subdirectories
      files.push(...getTypeScriptFiles(fullPath));
    } else if (item.endsWith('.ts') && item !== 'index.ts') {
      // Add TypeScript files but exclude index.ts files
      files.push(fullPath);
    }
  }
  
  return files;
}

async function loadActions() {
  const actions: Record<
    string,
    { fn: Function; description: string; mainName: string; aliases?: string[]; category?: string }
  > = {};

  for (const dir of dirs) {
    const dirPath = path.join(__dirname, dir);
    
    if (!fs.existsSync(dirPath)) {
      continue;
    }

    // Get all TypeScript files recursively
    const files = getTypeScriptFiles(dirPath);

    for (const filePath of files) {
      let mod;
      try {
        mod = await import(filePath);
      } catch (e) {
        mod = require(filePath);
      }
      const fn = mod.default;
      const description = fn && fn.description ? fn.description : 'No description';
      if (typeof fn === 'function') {
        // Extract the main name from the filename (without folder prefix)
        const fileName = path.basename(filePath, '.ts');
        const mainName = fileName;
        const aliases: string[] = Array.isArray(fn.aliases) ? fn.aliases : [];
        
        // Determine category from path
        const relativePath = path.relative(dirPath, filePath);
        const pathParts = relativePath.split(/[\/\\]/);
        const category = pathParts.length > 1 ? pathParts[0] : 'general';
        
        actions[mainName] = { fn, description, mainName, aliases, category };
        for (const alias of aliases) {
          actions[alias] = {
            fn,
            description: `(alias for ${mainName}) ${description}`,
            mainName,
            aliases,
            category,
          };
        }
      }
    }
  }
  return actions;
}

function showHelp(actions: Record<string, any>) {
  console.log('\nAvailable commands:');
  
  // Group commands by category
  const categories: Record<string, Array<{ cmd: string; description: string; aliases: string[] }>> = {};
  
  for (const [cmd, { description, mainName, aliases, category }] of Object.entries(actions)) {
    if (cmd !== mainName) continue; // Skip aliases in main listing
    
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category].push({
      cmd: mainName,
      description,
      aliases,
    });
  }
  
  // Display commands by category
  for (const [category, commands] of Object.entries(categories)) {
    if (commands.length === 0) continue;
    
    console.log(`\n${category.charAt(0).toUpperCase() + category.slice(1)}:`);
    for (const { cmd, description, aliases } of commands) {
      const aliasStr = aliases && aliases.length ? ` (aliases: ${aliases.join(', ')})` : '';
      console.log(`  ${cmd}${aliasStr} - ${description}`);
    }
  }
  
  console.log('\nUse "help <category>" to see commands in a specific category.');
  console.log('Categories: orders, positions, baskt, lifecycle, liquidity, protocol, config');
}

function showCategoryHelp(category: string) {
  const categoryMap: Record<string, string> = {
    'orders': 'Orders Management:\n  create-order - Creates a new order for a basket\n  cancel-order - Cancels an order by ID',
    'positions': 'Position Management:\n  open-position - Opens a position for an order\n  close-position - Closes a position by ID and exit price\n  add-collateral - Adds collateral to a position\n  liquidate-position - Liquidates a position',
    'baskt': 'Baskt Management:\n  create-baskt - Creates a baskt with specified assets and weights\n  create-random-baskt - Creates a baskt with random assets and weights\n  activate-baskt - Activates a baskt by index usage\n  rebalance-baskt - Rebalances a baskt with new asset weights',
    'lifecycle': 'Baskt Lifecycle Management:\n  decommission-baskt - Decommissions a baskt - enters decommissioning phase\n  settle-baskt - Settles a baskt - freeze price and funding after grace period\n  close-baskt - Closes a baskt - final state when all positions are closed',
    'liquidity': 'Liquidity Management:\n  deposit-blp - Deposits USDC into the BLP pool\n  withdraw-blp - Withdraws USDC from the BLP pool',
    'protocol': 'Protocol Management:\n  update-protocol-config - Updates protocol configuration parameters\n  update-feature-flags - Updates protocol feature flags',
    'config': 'Configuration Management:\n  update-baskt-config - Updates baskt configuration parameters\n  update-funding-index - Updates the funding index rate for a baskt\n  faucet - Faucet for USDC or SOL'
  };
  
  if (categoryMap[category]) {
    console.log(`\n${categoryMap[category]}`);
  } else {
    console.log(`\nUnknown category: ${category}`);
    console.log('Available categories: orders, positions, baskt, lifecycle, liquidity, protocol, config');
  }
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
      showHelp(actions);
      rl.prompt();
      return;
    }
    if (input.startsWith('help ')) {
      const category = input.split(' ')[1];
      showCategoryHelp(category);
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
