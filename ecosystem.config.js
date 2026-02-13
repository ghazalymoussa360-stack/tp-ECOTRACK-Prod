module.exports = {
  apps: [
    {
      name: 'ecotrack-api',
      script: 'src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3005,
        DB_HOST: '127.0.0.1',
        DB_PORT: 5434,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3005,
        DB_HOST: '127.0.0.1',
        DB_PORT: 5434,
      },
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 8000,
      kill_timeout: 5000,
      watch: false,
    },
  ],
};
