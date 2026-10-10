/* eslint-env node */
const { configure } = require('quasar/wrappers');

module.exports = configure(function( /* ctx */ ) {
    return {
        eslint: {
            warnings: false,
            errors: false
        },
        css: [
            'app.scss'
        ],
        extras: [
            'roboto-font',
            'material-icons'
        ],
        build: {
            target: {
                browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
                node: 'node16'
            },
            vueRouterMode: 'hash'
        },
        electron: {
            inspectPort: 5858,
            bundler: 'builder',
            builder: {
                appId: 'com.electron.wololo',
                productName: 'Wololo',
                win: {
                    target: 'portable'
                },
                // yt-dlp et ffmpeg, lus dans process.resourcesPath/ffmpeg
                extraResources: [
                    { from: './resources/ffmpeg', to: 'ffmpeg' }
                ]
            }
        }
    }
});
