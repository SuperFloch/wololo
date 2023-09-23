
// Gif to WEBM library
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobe = require("@ffprobe-installer/ffprobe");
const WebpImage = require('node-webpmux').Image;

const child = require('child_process')
const path = require('path')
const util = require('util')

const terminateWithError = (error = '[fatal] error') => {
	console.log(error)
	//process.exit(1)
}

const exec = util.promisify(child.exec)

const webp=require('webp-converter');
webp.grant_permission();

const fs = require('fs')

class ImageTool{
    constructor(){

    }

    static async convertImageToWebp(imagePath){
        return new Promise(async (resolve) => {
            try{
                var resUrl = imagePath.split(".")[0]+".webp";
                const result = webp.cwebp(imagePath,resUrl,"-q 80","-v");
                result.then((response) => {
                    fs.unlinkSync(imagePath);
                    resolve(resUrl);
                    console.log(response);
                });
            }catch(e){
                console.log(e.message);
                resolve(false);
            }
        });
    }

    static async convertWebpToWebm(imagePath){
        return this.convertWebpToWebmNew(imagePath);
        return new Promise(async (resolve) =>{
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

    static async resizeWebm(imagePath){
        return new Promise(async (resolve) => {
            var ffmpeg = require("fluent-ffmpeg")()
            .setFfprobePath(ffprobe.path)
            .setFfmpegPath(ffmpegInstaller.path);
        
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
            .on("error", (e) => console.log(e)).run();
        });
    }

    static async convertGifToWebm(imagePath){
        return new Promise(async (resolve) => {
            var ffmpeg = require("fluent-ffmpeg")()
            .setFfprobePath(ffprobe.path)
            .setFfmpegPath(ffmpegInstaller.path);
        
            ffmpeg
            .input(imagePath)
            .noAudio()
            .outputOptions('-pix_fmt yuv420p')
            .output(imagePath.substring(0,imagePath.length - 3) + "webm")
            .size('720x?')
            .on("end", (e) => {
                console.log("Generated !");
                fs.unlinkSync(imagePath);
                ffmpeg.kill();
                resolve(imagePath.substring(0,imagePath.length - 3) + "webm");
            })
            .on("error", (e) => console.log(e)).run();
        });
    }

    static async convertWebpToWebmNew(filename){
        return new Promise((resolve)=>{
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
                    terminateWithError(`[fatal] ${err}`)
                    fs.rmdirSync(frames, { recursive: true })
                })
        });
    }
}
export default ImageTool;