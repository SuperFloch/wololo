import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron'
import path from 'path'
import os from 'os'
import FolderTool from './services/folderTool';
import ImageTool from './services/imageTool';
import VideoDownloaderTool from './services/videoDownloaderTool';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

let mainWindow

const folderTool = new FolderTool(app);
const videoDownloadTool = new VideoDownloaderTool(folderTool);

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

ipcMain.handle('folder:read', async(e, data) => {
    return await folderTool.readFolder(folderTool.getBaseFolderUrl() + '/' + data)
})
ipcMain.handle('video:clip', async(e, data) => {
    const fileUrl = await ImageTool.clipVideo(data.video, data.startTime, data.duration)
    if (fileUrl) {
        return await folderTool.readFile(fileUrl)
    }
    return null
})
ipcMain.handle('video:crop', async(e, data) => {
    const fileUrl = await ImageTool.cropVideo(data.video, data.x, data.y, data.w, data.h)
    if (fileUrl) {
        return await folderTool.readFile(fileUrl)
    }
    return null
})

// Poit d'entrée général pour toutes les conversions
// data -> {file: [file], inputExt: [png, jpg, ...], outputExt: [png, jpg, ...]}
ipcMain.handle('file:convert', async(e, data) => {
    let fileUrl
    try {
        switch (data.outputExt) {
            case 'mp4':
            case 'webm':
                if (data.inputExt === 'webp') {
                    fileUrl = await ImageTool.convertWebpToWebm(data.img)
                } else {
                    fileUrl = await ImageTool.convertGifToVideo(data.file, data.outputExt)
                }
                break;
            case 'gif':
                fileUrl = await ImageTool.convertToGif(data.file)
                break;
            case 'ico':
                fileUrl = await ImageTool.convertPngToIco(data.file)
                break;
            case 'jpg':
                fileUrl = await ImageTool.convertHeicToJpg(data.file)
                break;
            case 'webp':
                fileUrl = await ImageTool.convertImageToWebp(data.file)
                break;
        }
        if (fileUrl) {
            return await folderTool.readFile(fileUrl)
        }
        return { error: 'Conversion failed' }
    } catch (e) {
        return { error: 'Conversion failed: ' + e.message }
    }
})
ipcMain.handle('file:read', async(e, data) => {
    return await folderTool.readFile(data.path);
})
ipcMain.on('img:rename', (e, data) => {
    folderTool.renameFile(data.oldPath, data.newPath)
})
ipcMain.on('file:write', (e, data) => {
    folderTool.writeFile(data.path, data.text)
})
ipcMain.handle('img:upload', (e, data) => {
    return folderTool.uploadFile(data.path, data.buffer);
})
ipcMain.handle('video:download', async(e, data) => {
    const file = await videoDownloadTool.downloadVideo(data.url)
    if (file) {
        return await folderTool.readFile(file)
    }
    return null
})
ipcMain.handle('audio:download', async(e, data) => {
    const file = await videoDownloadTool.downloadAudio(data.url)
    if (file) {
        return await folderTool.readFile(file)
    }
    return null
})
ipcMain.handle('img:remove-bg', async(e, data) => {
    const imgTool = new ImageTool(folderTool)
    return await folderTool.readFile(await imgTool.removeImageBackground(data.img))
})
ipcMain.handle('clear', async(e) => {
    return await folderTool.clearFolder()
})
ipcMain.on('quit', (e) => {
    app.quit()
})