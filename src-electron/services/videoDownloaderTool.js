const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const http = require('http');
const https = require('https');

class VideoDownloaderTool {
    constructor(folderTool) {
        this.folderTool = folderTool
    }
    async downloadVideo(url) {
        return await this.downloadVideo(url);
    }
    // Dossier contenant yt-dlp.exe et ffmpeg (extraResource en prod, ./resources en dev)
    getBinFolder() {
        const prod = path.join(process.resourcesPath || '', 'ffmpeg');
        return fs.existsSync(path.join(prod, 'yt-dlp.exe')) ? prod : path.resolve('./resources/ffmpeg');
    }
    // Lance yt-dlp et retourne le chemin du fichier produit (ou null)
    runYtDlp(url, extraArgs) {
        const binFolder = this.getBinFolder();
        const inputDir = this.folderTool.BASE_PATH + '/' + this.folderTool.WORKSPACE_DIR + '/input';
        const args = [
            '--no-playlist',
            '--no-warnings',
            '--ffmpeg-location', binFolder,
            '-P', inputDir,
            '-o', '%(id)s.%(ext)s',
            '--print', 'after_move:filepath',
            ...extraArgs,
            url
        ];
        return new Promise(resolve => {
            cp.execFile(path.join(binFolder, 'yt-dlp.exe'), args, { maxBuffer: 1024 * 1024 * 10, windowsHide: true }, (err, stdout, stderr) => {
                if (err) {
                    console.log(stderr || err.message)
                    resolve(null)
                    return
                }
                const lines = stdout.split("?").map(l => l.trim()).filter(Boolean)
                resolve(lines.length ? lines[lines.length - 1] : null)
            })
        })
    }
    async downloadVideo(url) {
        return await this.runYtDlp(url, [
            '-f', 'bv*+ba/b',
            '-S', 'vcodec:h264,res,acodec:m4a',
            '--merge-output-format', 'mp4'
        ]);
    }
    async downloadAudio(url) {
        return await this.runYtDlp(url, ['-x', '--audio-format', 'mp3']);
    }

    async getFileFromUrl(url) {
        return new Promise((resolve) => {
            const finalPath = this.folderTool.BASE_PATH + '/' + this.folderTool.WORKSPACE_DIR + '/input/' + Math.floor(Math.random() * 5000) + '.mp4';
            const file = fs.createWriteStream(finalPath);
            let protocol = http
            if (url.split(':')[0] === 'https') {
                protocol = https
            }
            protocol.get(url, function (response) {
                response.pipe(file);

                // after download completed close filestream
                file.on("finish", () => {
                    file.close();
                    resolve(finalPath)
                });
            });
        })
    }
}
export default VideoDownloaderTool;