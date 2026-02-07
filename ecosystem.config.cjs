module.exports = {
    apps: [
        {
            name: 'yandex-sync',
            script: 'scripts/yandex-sync.js',
            watch: false,
            autorestart: true,
            max_memory_restart: '300M',
            env: {
                NODE_ENV: 'production'
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            merge_logs: true
        },
        {
            name: 'digiseller-sync',
            script: 'scripts/digiseller-sync.js',
            watch: false,
            autorestart: true,
            max_memory_restart: '300M',
            env: {
                NODE_ENV: 'production'
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            merge_logs: true
        },
        {
            name: 'ggsel-sync',
            script: 'scripts/ggsel-sync.js',
            watch: false,
            autorestart: true,
            max_memory_restart: '300M',
            env: {
                NODE_ENV: 'production'
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            merge_logs: true
        }
    ]
};
