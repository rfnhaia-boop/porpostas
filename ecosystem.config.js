// PM2 — produção na VPS.  Sobe o Next já buildado na porta 3015.
//   pm2 start ecosystem.config.js
//   pm2 save
module.exports = {
  apps: [
    {
      name: 'nex-quotes',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3015',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
