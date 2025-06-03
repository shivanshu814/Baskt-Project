module.exports = {
  apps: [
    {
      name: 'oracle:manager',
      cwd: '/root/monorepo/services/oracle',
      script: 'bash',
      args: "-c 'npx tsx src/manager.ts'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oracle:worker',
      cwd: '/root/monorepo/services/oracle',
      script: 'bash',
      args: "-c 'npx tsx src/oracle-worker.ts'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'backend',
      cwd: '/root/monorepo/services/backend',
      script: 'bash',
      args: "-c 'npx tsx src/server/index.ts'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'event-listener',
      cwd: '/root/monorepo/services/event-engine',
      script: 'bash',
      args: "-c 'npx tsx src/listener.ts'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'event-worker',
      cwd: '/root/monorepo/services/event-engine',
      script: 'bash',
      args: "-c 'npx tsx src/worker.ts'",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
