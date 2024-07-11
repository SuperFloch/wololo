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

ipcMain.handle('img:convert:webp', async(e, data) => {
    return await folderTool.readFile(await ImageTool.convertImageToWebp(data.img))
})
ipcMain.handle('img:convert:gif', async(e, data) => {
    return await folderTool.readFile(await ImageTool.convertToGif(data.img))
})
ipcMain.handle('img:convert:webm', async(e, data) => {
    return await folderTool.readFile(await ImageTool.convertGifToWebm(data.img))
})
ipcMain.handle('img:convert:ico', async(e, data) => {
    return await folderTool.readFile(await ImageTool.convertPngToIco(data.img))
})
ipcMain.handle('img:convert:heicTojpg', async(e, data) => {
    return await folderTool.readFile(await ImageTool.convertHeicToJpg(data.img))
})
ipcMain.handle('webm:resize', async(e, data) => {
    return await ImageTool.resizeWebm(data.img)
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
ipcMain.handle('img:getFrames', async(e, data) => {
    return await ImageTool.convertWebpToWebm(data.img);
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