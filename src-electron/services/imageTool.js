const path = require('path')
const fs = require('fs')
const { once } = require('events')
const { PassThrough } = require('stream')
const ffmpeg = require('fluent-ffmpeg')
const WebpImage = require('node-webpmux').Image
const pngToIco = require('png-to-ico')
const convertHeic = require('heic-convert')
const webp = require('webp-converter')
import { removeBackground } from '@imgly/background-removal-node'

const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked')
const ffprobePath = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked')

const BG_MIME_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }

// .../input/photo.png -> .../output/photo.png
const toOutputPath = (filePath) => filePath.replace(/[\\/]input([\\/][^\\/]*)$/, '/output$1')

// Remplace l'extension (et ajoute eventuellement un suffixe au nom)
const withExt = (filePath, ext, suffix = '') => filePath.slice(0, filePath.length - path.extname(filePath).length) + suffix + '.' + ext

const pgcd = (a, b) => (b === 0 ? a : pgcd(b, a % b))

class ImageTool {
    // Lance ffmpeg sur un fichier (ou un flux) et retourne le chemin du fichier produit.
    // `configure(command, step)` est appele apres la declaration de l'entree ('input')
    // puis de la sortie ('output').
    static runFfmpeg(input, outPath, configure = () => {}) {
        return new Promise((resolve, reject) => {
            const command = ffmpeg()
                .setFfmpegPath(ffmpegPath)
                .setFfprobePath(ffprobePath)
                .input(input)
            configure(command, 'input')
            command.output(outPath)
            configure(command, 'output')
            command.on('end', () => resolve(outPath)).on('error', reject).run()
        })
    }

    static async convertImageToWebp(imagePath) {
        const outPath = withExt(toOutputPath(imagePath), 'webp')
        await webp.cwebp(imagePath, outPath, '-q 80', '-v')
        return outPath
    }

    static clipVideo(videoPath, startTime, duration) {
        const outPath = withExt(videoPath, path.extname(videoPath).slice(1), '_clip')
        return this.runFfmpeg(videoPath, outPath, (command, step) => {
            if (step === 'output') command.setStartTime(startTime).setDuration(duration)
        })
    }

    static cropVideo(videoPath, x, y, w, h) {
        const outPath = withExt(videoPath, path.extname(videoPath).slice(1), '_crop')
        // Les encodeurs video exigent des dimensions paires
        const evenW = Math.max(2, w - (w % 2))
        const evenH = Math.max(2, h - (h % 2))
        return this.runFfmpeg(videoPath, outPath, (command, step) => {
            if (step === 'output') {
                command.videoFilters([{ filter: 'crop', options: { x, y, out_w: evenW, out_h: evenH } }])
            }
        })
    }

    // GIF / video -> webm ou mp4
    static convertGifToVideo(imagePath, format = 'webm') {
        const outPath = withExt(toOutputPath(imagePath), format)
        return this.runFfmpeg(imagePath, outPath, (command, step) => {
            if (step === 'output') command.outputOptions('-pix_fmt yuv420p').size('720x?')
        })
    }

    static convertToGif(imagePath) {
        return this.runFfmpeg(imagePath, withExt(toOutputPath(imagePath), 'gif'))
    }

    // WebP anime -> webm ou mp4.
    // ffmpeg ne sait pas decoder les WebP animes : les images sont reconstituees avec node-webpmux
    // puis envoyees brutes (RGBA) a ffmpeg.
    static async convertWebpToVideo(imagePath, format = 'webm') {
        const img = new WebpImage()
        await img.load(imagePath)
        await img.initLib()
        if (!img.hasAnim) throw new Error('This is not an animated webp file')

        const { width, height, frames } = img
        // Une image brute est envoyee toutes les "unit" ms, ce qui respecte la duree de chaque image
        const unit = Math.max(10, frames.reduce((acc, f) => pgcd(acc, f.delay || 100), 0))
        const fps = 1000 / unit

        const stream = new PassThrough()
        const done = this.runFfmpeg(stream, withExt(toOutputPath(imagePath), format), (command, step) => {
            if (step === 'input') {
                command.inputFormat('rawvideo').inputOptions(['-pix_fmt rgba', `-s ${width}x${height}`, `-framerate ${fps}`])
            } else {
                command.outputOptions('-pix_fmt yuv420p').videoFilters('scale=trunc(iw/2)*2:trunc(ih/2)*2')
            }
        })
        let failure = null
        done.catch((e) => { failure = e })

        const canvas = Buffer.alloc(width * height * 4) // RGBA, transparent au depart
        const flat = Buffer.alloc(width * height * 4) // image envoyee a ffmpeg : canvas sur fond blanc
        try {
            for (let i = 0; i < frames.length && !failure; i++) {
                const frame = frames[i]
                this.drawFrame(canvas, width, frame, Buffer.from(await img.getFrameData(i)))
                this.flattenOnWhite(canvas, flat)
                const repeat = Math.max(1, Math.round((frame.delay || 100) / unit))
                for (let n = 0; n < repeat && !failure; n++) {
                    if (!stream.write(flat)) {
                        await Promise.race([once(stream, 'drain'), done.catch(() => {})])
                    }
                }
                if (frame.dispose) this.clearRect(canvas, width, frame)
            }
        } finally {
            stream.end()
        }
        return await done
    }

    // Dessine une image de l'animation sur le canvas (alpha blending si demande)
    static drawFrame(canvas, canvasWidth, frame, data) {
        for (let y = 0; y < frame.height; y++) {
            for (let x = 0; x < frame.width; x++) {
                const src = (y * frame.width + x) * 4
                const dst = ((frame.y + y) * canvasWidth + frame.x + x) * 4
                const a = data[src + 3]
                if (!frame.blend || a === 255) {
                    data.copy(canvas, dst, src, src + 4)
                } else if (a > 0) {
                    const dstA = canvas[dst + 3]
                    const outA = a + dstA * (255 - a) / 255
                    for (let c = 0; c < 3; c++) {
                        canvas[dst + c] = (data[src + c] * a + canvas[dst + c] * dstA * (255 - a) / 255) / outA
                    }
                    canvas[dst + 3] = outA
                }
            }
        }
    }

    static clearRect(canvas, canvasWidth, frame) {
        for (let y = 0; y < frame.height; y++) {
            const start = ((frame.y + y) * canvasWidth + frame.x) * 4
            canvas.fill(0, start, start + frame.width * 4)
        }
    }

    // Les formats video n'ont pas de transparence : on la remplace par du blanc
    static flattenOnWhite(canvas, out) {
        for (let i = 0; i < canvas.length; i += 4) {
            const a = canvas[i + 3] / 255
            out[i] = canvas[i] * a + 255 * (1 - a)
            out[i + 1] = canvas[i + 1] * a + 255 * (1 - a)
            out[i + 2] = canvas[i + 2] * a + 255 * (1 - a)
            out[i + 3] = 255
        }
    }

    static async convertPngToIco(fileName) {
        const outPath = withExt(toOutputPath(fileName), 'ico')
        await fs.promises.writeFile(outPath, await pngToIco(fileName))
        return outPath
    }

    static async convertHeicToJpg(fileName) {
        const outPath = withExt(toOutputPath(fileName), 'jpg')
        const buffer = await convertHeic({
            buffer: await fs.promises.readFile(fileName),
            format: 'JPEG',
            quality: 1
        })
        await fs.promises.writeFile(outPath, Buffer.from(buffer))
        return outPath
    }

    // Le resultat est toujours un PNG (transparence)
    static async removeImageBackground(imgPath) {
        const type = BG_MIME_TYPES[path.extname(imgPath).slice(1).toLowerCase()] || 'image/png'
        const blob = new Blob([await fs.promises.readFile(imgPath)], { type })
        const result = await removeBackground(blob)
        const outPath = withExt(toOutputPath(imgPath), 'png')
        await fs.promises.writeFile(outPath, Buffer.from(await result.arrayBuffer()))
        return outPath
    }
}

export default ImageTool
