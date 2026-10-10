const fs = require('fs')
const path = require('path')
const { readdir, readFile, writeFile, unlink } = fs.promises

const WORKSPACE_DIR = 'wololo'

const MIME_TYPES = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    webm: 'video/webm',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mp3: 'audio/mpeg'
}

class FolderTool {
    constructor(app) {
        this.BASE_PATH = app.getPath('userData')
        this.WORKSPACE_DIR = WORKSPACE_DIR
        fs.mkdirSync(this.getBaseFolderUrl() + '/input', { recursive: true })
        fs.mkdirSync(this.getBaseFolderUrl() + '/output', { recursive: true })
    }

    getBaseFolderUrl() {
        return this.BASE_PATH + '/' + this.WORKSPACE_DIR
    }

    // Seuls les fichiers de l'espace de travail sont accessibles depuis l'interface
    assertInWorkspace(filePath) {
        const root = path.resolve(this.getBaseFolderUrl())
        const target = path.resolve(filePath)
        if (!target.startsWith(root + path.sep)) {
            throw new Error('Path outside of the workspace: ' + filePath)
        }
        return target
    }

    async clearFolder() {
        for (const folder of ['input', 'output']) {
            const dir = this.getBaseFolderUrl() + '/' + folder
            for (const file of await this.readFolder(dir)) {
                await unlink(file)
            }
        }
        return true
    }

    // Liste récursive des fichiers d'un dossier
    async readFolder(dirName) {
        let files = []
        const items = await readdir(dirName, { withFileTypes: true })
        for (const item of items) {
            const itemPath = `${dirName}/${item.name}`
            if (item.isDirectory()) {
                files = [...files, ...(await this.readFolder(itemPath))]
            } else {
                files.push(itemPath)
            }
        }
        return files
    }

    // Retourne le fichier sous forme de data URL
    async readFile(filePath) {
        const data = await readFile(this.assertInWorkspace(filePath))
        return this.getBase64Prefix(filePath) + data.toString('base64')
    }

    getBase64Prefix(filePath) {
        const mime = MIME_TYPES[path.extname(filePath).slice(1).toLowerCase()]
        return mime ? `data:${mime};base64,` : ''
    }

    async deleteFile(filePath) {
        await unlink(this.assertInWorkspace(filePath))
        return true
    }

    async uploadFile(fileName, buffer) {
        const savePath = this.getBaseFolderUrl() + '/input/' + path.basename(fileName)
        await writeFile(savePath, Buffer.from(buffer))
        return savePath
    }
}

export default FolderTool
