// PM2 Ecosystem Configuration — md3.io (local dev)
// `bun run dev` (scripts/dev.ts) rebuilds material, the site and the server on its own,
// in that order, whenever the material checkout's src or this site's sources change.

module.exports = {
  apps: [
    {
      name: "md3.io",
      script: "bun",
      args: "run dev",
      interpreter: "none",
      cwd: __dirname,
      env: {
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
