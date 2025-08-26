module.exports = {
  apps: [
    // {
    //   name: 'oracle:manager',
    //   cwd: './services/oracle',
    //   script: 'bash',
    //   args: "-c 'node dist/manager.js'",
    //   interpreter: 'none',
    //   exec_mode: 'fork',
    //   autorestart: true,
    //   watch: false,
    //   env_file: '.env', // Absolute path to root .env
    //   env: {
    //     NODE_ENV: 'production',
    //   },
    // },
    // {
    //   name: 'oracle:worker',
    //   cwd: './services/oracle',
    //   script: 'bash',
    //   args: "-c 'node dist/oracle-worker.js'",
    //   interpreter: 'none',
    //   exec_mode: 'fork',
    //   autorestart: true,
    //   watch: false,
    //   env_file: '.env', // Absolute path to root .env
    //   env: {
    //     NODE_ENV: 'production',
    //   },
    // },
    {
      name: 'cron-jobs:rebalance-manager',
      cwd: './services/cron-jobs',
      script: 'bash',
      args: "-c 'node dist/rebalance/manager.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'backend',
      cwd: './services/backend',
      script: 'bash',
      args: "-c 'node dist/index.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'event-listener',
      cwd: './services/event-listener',
      script: 'bash',
      args: "-c 'node dist/listener.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'cron-jobs',
      cwd: './services/cron-jobs',
      script: 'bash',
      args: "-c 'node dist/index.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'execution-engine',
      cwd: './services/execution-engine',
      script: 'bash',
      args: "-c 'node dist/index.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'guardian',
      cwd: './services/guardian',
      script: 'bash',
      args: "-c 'node dist/index.js'",
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_file: '.env', // Absolute path to root .env
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
