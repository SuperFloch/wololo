const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require('readline');
const cp = require('child_process');
const http = require('http');
const https = require('https');

class VideoDownloaderTool {
    constructor(folderTool) {
        this.folderTool = folderTool
    }
    async downloadVideo(url) {
        if (url.split('youtube').length > 1) {
            return await this.downloadYoutubeVideo(url);
        } else if (url.split('xnxx').length > 1) {
            return await this.downloadVideoXnxx(url);
        } else if (url.split('xvideos').length > 1) {
            return await this.downloadVideoXvideos(url);
        }
    }
    async downloadYoutubeVideo(url) {
        const finalPathVideo = this.folderTool.BASE_PATH + '/' + this.folderTool.WORKSPACE_DIR + '/input/' + url.substring(url.length - 5, url.length) + '_v.mp4';
        const finalPathAudio = this.folderTool.BASE_PATH + '/' + this.folderTool.WORKSPACE_DIR + '/input/' + url.substring(url.length - 5, url.length) + '_a.mp3';
        const finalPath = this.folderTool.BASE_PATH + '/' + this.folderTool.WORKSPACE_DIR + '/input/' + url.substring(url.length - 5, url.length) + '.mp4';

        return new Promise(resolve => {
            try {
                const video = ytdl(url, { quality: 'highestvideo' })
                video.pipe(fs.createWriteStream(finalPathVideo))
                video.on('end', () => {
                    const audio = ytdl(url, { quality: 'highestaudio' })
                    audio.pipe(fs.createWriteStream(finalPathAudio))
                    audio.on('end', () => {
                        var ffmpeg = require("fluent-ffmpeg")()
                            .setFfprobePath('./resources/ffmpeg/ffprobe.exe')
                            .setFfmpegPath('./resources/ffmpeg/ffmpeg.exe');
                        ffmpeg
                            .input(finalPathVideo)
                            .input(finalPathAudio)
                            .addOptions(['-map 0:v', '-map 1:a', '-c:v copy'])
                            .format('mp4')
                            .outputOptions('-pix_fmt yuv420p')
                            .output(finalPath)
                            .on('end', function () {
                                fs.unlinkSync(finalPathAudio);
                                fs.unlinkSync(finalPathVideo);
                                ffmpeg.kill();
                                resolve(finalPath)
                            })
                            .on('error', function (err) {
                                console.log('an error happened: ' + err.message);
                                resolve(err)
                            }).run();
                    })
                });
                video.on('error', (e) => {
                    resolve(null)
                })
            } catch (e) {
                resolve(e)
            }
        })
    }
    async downloadAudio(url) {
        const finalPathAudio = this.folderTool.BASE_PATH + '/' + this.folderTool.WORKSPACE_DIR + '/input/' + url.substring(url.length - 5, url.length) + '_a.mp3';

        return new Promise(resolve => {
            try {
                const audio = ytdl(url, { quality: 'highestaudio' })
                audio.pipe(fs.createWriteStream(finalPathAudio))
                audio.on('end', () => {
                    resolve(finalPathAudio);
                })
                audio.on('error', (e) => {
                    resolve(null)
                })
            } catch (e) {
                resolve(e)
            }
        })
    }
    
    async downloadVideoXnxx(url) {
        return new Promise((resolve) => {
            const request = https.get(url, (response) => {
                let body = '';

                response.on('data', (data) => {
                    body += data.toString();
                });

                response.on('end', async () => {
                    let videoLink = body.split('html5video_base')[1].split('<a href="')[1];
                    videoLink = videoLink.split('"')[0]
                    resolve(await this.getFileFromUrl(videoLink))
                });
            });
        });
    }
    async downloadVideoXvideos(url) {
        return new Promise((resolve) => {
            const request = https.get(url, (response) => {
                let body = '';

                response.on('data', (data) => {
                    body += data.toString();
                });

                response.on('end', async () => {
                    let videoLink = body.split('"contentUrl": "')[1];
                    videoLink = videoLink.split('"')[0]
                    resolve(await this.getFileFromUrl(videoLink))
                });
            });
        });
    }
    async getFileFromUrl(url) {
        return new Promise((resolve) => {
            const finalPath = this.folderTool.BASE_PATH + '/' + this.folderTool.WORKSPACE_DIR + '/input/' + Math.floor(Math.random() * 5000) + '.mp4';
            const file = fs.createWriteStream(finalPath);
            let protocol = http
            if (url.split(':')[0] === 'https') {
                protocol = https
            }
            const request = protocol.get(url, function (response) {
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