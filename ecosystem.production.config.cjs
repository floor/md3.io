// PM2 Ecosystem Configuration — md3.io (production, on floor-vps)
// Serves the built site; scripts/deploy.sh installs published dependencies and builds md3.io.
// pm2-admin.service owns the daemon as admin under Bun; never hand-start PM2.
// nginx proxies md3.io to this port (deploy/nginx/md3.io.conf).

module.exports = {
  apps: [
    {
      name: "md3.io",
      script: "bun",
      args: "server.ts",
      interpreter: "none",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 4300,
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
