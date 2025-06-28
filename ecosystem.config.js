module.exports = {
  apps: [
    {
      name: 'oracle:manager',
      cwd: '/root/monorepo/services/oracle',
      script: 'bash',
      args: "-c 'node dist/manager.js'",
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
      args: "-c 'node dist/oracle-worker.js'",
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
      args: "-c 'node dist/server/index.js'",
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
      args: "-c 'node dist/listener.js'", 
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    }
  ],
};
