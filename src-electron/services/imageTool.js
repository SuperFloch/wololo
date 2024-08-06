// Gif to WEBM library
const WebpImage = require('node-webpmux').Image;

const pngToIco = require('png-to-ico');

const child = require('child_process')
const path = require('path')
const util = require('util')
const { promisify } = require('util');
const convert = require('heic-convert');
import { removeBackground } from "@imgly/background-removal-node";

const terminateWithError = (error = '[fatal] error') => {
    console.log(error)
        //process.exit(1)
}

const exec = util.promisify(child.exec)

const webp = require('webp-converter');
//webp.grant_permission();  // Marche ptet pas sur le PC du boulot

const fs = require('fs')

const ffmpegPath = require('ffmpeg-static').replace(
    'app.asar',
    'app.asar.unpacked'
);
const ffprobePath = require('ffprobe-static').path.replace(
    'app.asar',
    'app.asar.unpacked'
);

class ImageTool {
    constructor(folderTool) {
        this.folderTool = folderTool
    }

    static async convertImageToWebp(imagePath) {
        return new Promise(async(resolve, error) => {
            try {
                var resUrl = imagePath.split(".")[0] + ".webp";
                resUrl = resUrl.split('/input/').join('/output/');
                const result = webp.cwebp(imagePath, resUrl, "-q 80", "-v");
                result.then((response) => {
                    fs.unlinkSync(imagePath);
                    resolve(resUrl);
                    console.log(response);
                });
            } catch (e) {
                console.log(e.message);
                error(e);
            }
        });
    }

    static async convertWebpToWebm(imagePath) {
        return this.convertWebpToWebmNew(imagePath);
        return new Promise(async(resolve) => {
            const webPImage = await new WebpImage();
            await webPImage.load(imagePath);
            if (webPImage.hasAnim) {

                if (webPImage.frames !== undefined && webPImage.frames.length > 1) {
                    const frames = [...webPImage.frames];
                    resolve(frames);
                }
            }
        })
    }

    static async resizeWebm(imagePath) {
        return new Promise(async(resolve, error) => {
            var ffmpeg = require("fluent-ffmpeg")()
                .setFfprobePath(ffprobePath)
                .setFfmpegPath(ffmpegPath);

            ffmpeg
                .input(imagePath)
                .noAudio()
                .outputOptions('-pix_fmt yuv420p')
                .output(imagePath.split('.')[0] + "1.webm")
                .size('720x?')
                .on("end", (e) => {
                    console.log("Generated !");
                    fs.unlinkSync(imagePath);
                    ffmpeg.kill();
                    resolve(imagePath.split('.')[0] + "1.webm");
                })
                .on("error", (e) => error(e)).run();
        });
    }

    static async clipVideo(videoPath, startTime, duration) {
        const ext = path.extname(videoPath);
        const outName = videoPath.split('.')[0] + '_clip' + ext
        return new Promise(async(resolve, error) => {
            var ffmpeg = require("fluent-ffmpeg")()
                .setFfprobePath(ffprobePath)
                .setFfmpegPath(ffmpegPath);

            ffmpeg
                .input(videoPath)
                .output(outName)
                .setStartTime(startTime)
                .setDuration(duration)
                .on("end", (e) => {
                    console.log("Generated !");
                    fs.unlinkSync(videoPath);
                    ffmpeg.kill();
                    resolve(outName);
                })
                .on("error", (e) => error(e)).run();
        });
    }

    static async cropVideo(videoPath, x, y, w, h) {
        const ext = path.extname(videoPath);
        const outName = videoPath.split('.')[0] + '_crop' + ext
        return new Promise(async(resolve, error) => {
            var ffmpeg = require("fluent-ffmpeg")()
                .setFfprobePath(ffprobePath)
                .setFfmpegPath(ffmpegPath);

            ffmpeg
                .input(videoPath)
                .output(outName)
                .videoFilters([{
                    filter: "crop",
                    options: {
                        x,
                        y,
                        out_w: w,
                        out_h: h
                    },
                }, ])
                .on("end", (e) => {
                    console.log("Generated !");
                    fs.unlinkSync(videoPath);
                    ffmpeg.kill();
                    resolve(outName);
                })
                .on("error", (e) => error(e)).run();
        });
    }

    static async convertGifToVideo(imagePath, format = 'webm') {
        var resUrl = imagePath.split('/input/').join('/output/').split('.')[0] + '.' + format;
        return new Promise(async(resolve, error) => {
            var ffmpeg = require("fluent-ffmpeg")()
                .setFfprobePath(ffprobePath)
                .setFfmpegPath(ffmpegPath);

            ffmpeg
                .input(imagePath)
                .noAudio()
                .outputOptions('-pix_fmt yuv420p')
                .output(resUrl)
                .size('720x?')
                .on("end", (e) => {
                    console.log("Generated !");
                    fs.unlinkSync(imagePath);
                    ffmpeg.kill();
                    resolve(resUrl);
                })
                .on("error", (e) => error(e)).run();
        });
    }

    static async convertToGif(imagePath) {
        var resUrl = imagePath.split('/input/').join('/output/').split('.')[0] + '.gif';
        return new Promise(async(resolve, error) => {
            var ffmpeg = require("fluent-ffmpeg")()
                .setFfprobePath(ffprobePath)
                .setFfmpegPath(ffmpegPath);

            ffmpeg
                .input(imagePath)
                .output(resUrl)
                .on("end", (e) => {
                    console.log("Generated !");
                    fs.unlinkSync(imagePath);
                    ffmpeg.kill();
                    resolve(resUrl);
                })
                .on("error", (e) => error(e)).run();
        });
    }

    static async convertWebpToWebmNew(filename) {
        return new Promise((resolve, error) => {
            const nameWithoutExt = filename.replace('.webp', '')
            const frames = path.resolve(process.cwd(), 'frames')
            const deleteOriginal = true;

            if (fs.existsSync(frames)) fs.rmdirSync(frames, { recursive: true })
            fs.mkdirSync(frames)

            process.chdir('frames')
            console.log('[info]', process.cwd())

            console.log('[info]', `anim_dump ../${filename}`)
            exec(`anim_dump ../${filename}`)
                .then(() => {
                    process.chdir('..')
                    console.log('[info]', process.cwd())

                    const command = `webpmux -info ./${filename}`

                    console.log('[info]', command)
                    return exec(command)
                })
                .then(({ stdout, stderr }) => {
                    if (stderr) return Promise.reject(stderr)

                    const isAnimation = stdout.match(/Features present: animation/) !== null
                    if (!isAnimation) return Promise.reject('This is not an animated webp file')

                    const firstLine = stdout.match(/1:.+[\r]?\n/g)
                    if (!firstLine) return

                    const frameLength = firstLine[0].split(/\s+/g)[6]
                    const framerate = Math.round(1000 / frameLength) // frames/second
                    const dump = path.resolve(frames, 'dump_%04d.png')
                    const command = `ffmpeg -framerate ${framerate} -i "${dump}" "${nameWithoutExt}.webm" -y`

                    console.log('[info]', command)
                    return exec(command)
                })
                .then(({ stdout, stderr }) => {
                    if (/error/gm.test(stderr)) return Promise.reject(stderr)

                    // cleanup
                    fs.rmdirSync(frames, { recursive: true })
                    if (deleteOriginal) fs.rmSync(path.resolve(process.cwd(), filename))

                    resolve(true);
                    console.log('[info] Success!\n')
                })
                .catch(err => {
                    error(err)
                    terminateWithError(`[fatal] ${err}`)
                    fs.rmdirSync(frames, { recursive: true })
                })
        });
    }

    static convertPngToIco(fileName) {
        return new Promise((resolve, error) => {
            var newName = fileName.split('/input/').join('/output/').split('.')[0] + '.ico';
            pngToIco(fileName)
                .then(buf => {
                    fs.writeFileSync(newName, buf);
                    resolve(newName)
                }).catch(err => {
                    error(err)
                })
        })
    }

    static convertHeicToJpg(fileName) {
        return new Promise(async(resolve) => {
            var newName = fileName.split('/input/').join('/output/').split('.')[0] + '.jpg';
            const imageBuffer = fs.readFileSync(fileName)
            const outputBuffer = await convert({
                buffer: imageBuffer, // the HEIC file buffer
                format: 'JPEG', // output format
                quality: 1 // the jpeg compression quality, between 0 and 1
            });
            fs.writeFileSync(newName, outputBuffer)
            resolve(newName)
        })
    }

    async removeImageBackground(imgSource) {
        try {
            const imageBuffer = fs.readFileSync(imgSource);
            const blob = new Blob([imageBuffer], { type: "image/png" });
            var newName = imgSource.split('/input/').join('/output/');
            return new Promise((resolve) => {
                removeBackground(blob).then(async(blob2) => {
                    const buffer = Buffer.from(await blob2.arrayBuffer());
                    fs.writeFileSync(newName, buffer);
                    resolve(newName);
                })
            })
        } catch (e) {
            return e.message
        }
    }
}
export default ImageTool;