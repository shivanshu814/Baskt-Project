module.exports = {
  apps: [
    {
      name: 'oracle:manager',
      cwd: '~/monorepo/services/oracle',
      script: 'bash',
      args: "-c 'node dist/manager.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '~/monorepo/.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oracle:worker',
      cwd: '~/monorepo/services/oracle',
      script: 'bash',
      args: "-c 'node dist/oracle-worker.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '~/monorepo/.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oracle:rebalance-manager',
      cwd: '~/monorepo/services/oracle',
      script: 'bash',
      args: "-c 'node dist/rebalance/manager.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '~/monorepo/.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oracle:rebalance-worker',
      cwd: '~/monorepo/services/oracle',
      script: 'bash',
      args: "-c 'node dist/rebalance/worker.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '~/monorepo/.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'backend',
      cwd: '~/monorepo/services/backend',
      script: 'bash',
      args: "-c 'node dist/index.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '~/monorepo/.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'event-listener',
      cwd: '~/monorepo/services/event-engine',
      script: 'bash',
      args: "-c 'node dist/listener.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '~/monorepo/.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'oracle:nav-tracker',
      cwd: '~/monorepo/services/oracle',
      script: 'bash',
      args: "-c 'node dist/nav-tracker.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '~/monorepo/.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
