import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import os from 'os'
import FolderTool from './services/folderTool'
import ImageTool from './services/imageTool'
import VideoDownloaderTool from './services/videoDownloaderTool'

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

let mainWindow

const folderTool = new FolderTool(app)
const videoDownloadTool = new VideoDownloaderTool(folderTool)

function createWindow() {
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
        icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
        width: 1000,
        height: 600,
        autoHideMenuBar: true,
        resizable: true,
        useContentSize: true,
        webPreferences: {
            contextIsolation: true,
            // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
            preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
        }
    })

    mainWindow.loadURL(process.env.APP_URL)

    if (process.env.DEBUGGING) {
        // if on DEV or Production with debug enabled
        mainWindow.webContents.openDevTools()
    } else {
        // we're on production; no access to devtools pls
        mainWindow.webContents.on('devtools-opened', () => {
            mainWindow.webContents.closeDevTools()
        })
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})

// Convertit un fichier produit en { data (data URL), path }
async function toResult(filePath) {
    return { data: await folderTool.readFile(filePath), path: filePath }
}

// Point d'entree general pour toutes les conversions
// data -> { file, inputExt, outputExt }
const converters = {
    mp4: (data) => data.inputExt === 'webp' ? ImageTool.convertWebpToVideo(data.file, 'mp4') : ImageTool.convertGifToVideo(data.file, 'mp4'),
    webm: (data) => data.inputExt === 'webp' ? ImageTool.convertWebpToVideo(data.file, 'webm') : ImageTool.convertGifToVideo(data.file, 'webm'),
    gif: (data) => ImageTool.convertToGif(data.file),
    ico: (data) => ImageTool.convertPngToIco(data.file),
    jpg: (data) => ImageTool.convertHeicToJpg(data.file),
    webp: (data) => ImageTool.convertImageToWebp(data.file)
}

ipcMain.handle('file:convert', async(e, data) => {
    try {
        const convert = converters[data.outputExt]
        if (!convert) return { error: 'Unsupported format: ' + data.outputExt }
        return await toResult(await convert(data))
    } catch (err) {
        return { error: 'Conversion failed: ' + err.message }
    }
})
ipcMain.handle('video:clip', async(e, data) => {
    return await toResult(await ImageTool.clipVideo(data.video, data.startTime, data.duration))
})
ipcMain.handle('video:crop', async(e, data) => {
    return await toResult(await ImageTool.cropVideo(data.video, data.x, data.y, data.w, data.h))
})
ipcMain.handle('img:remove-bg', async(e, data) => {
    try {
        return await toResult(await ImageTool.removeImageBackground(data.img))
    } catch (err) {
        return { error: 'Background removal failed: ' + err.message }
    }
})
ipcMain.handle('video:download', async(e, data) => {
    const file = await videoDownloadTool.downloadVideo(data.url)
    return file ? await toResult(file) : { error: 'Download failed' }
})
ipcMain.handle('audio:download', async(e, data) => {
    const file = await videoDownloadTool.downloadAudio(data.url)
    return file ? await toResult(file) : { error: 'Download failed' }
})

ipcMain.handle('folder:read', (e, data) => folderTool.readFolder(folderTool.getBaseFolderUrl() + '/' + data))
ipcMain.handle('file:read', (e, data) => folderTool.readFile(data.path))
ipcMain.handle('file:delete', (e, filePath) => folderTool.deleteFile(filePath))
ipcMain.handle('img:upload', (e, data) => folderTool.uploadFile(data.path, data.buffer))
ipcMain.handle('clear', () => folderTool.clearFolder())
ipcMain.on('quit', () => app.quit())
