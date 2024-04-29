const fs = require('fs')
const { readdir } = require('fs').promises;
const WORKSPACE_DIR = 'wololo';
const path = require("path");

class FolderTool {
    constructor(app) {
        this.BASE_PATH = app.getPath('userData');
        this.WORKSPACE_DIR = WORKSPACE_DIR;
        if (!fs.existsSync(this.BASE_PATH + '/' + WORKSPACE_DIR)) {
            fs.mkdirSync(this.BASE_PATH + '/' + WORKSPACE_DIR);
        }
        this.createFolder("input");
        this.createFolder("output");

    }
    getBaseFolderUrl() {
        return this.BASE_PATH + '/' + this.WORKSPACE_DIR
    }

    async clearFolder() {
        const folderName = this.getBaseFolderUrl() + '/input'
        const folderName2 = this.getBaseFolderUrl() + '/output'
        const files = await this.readFolder(folderName)
        const files2 = await this.readFolder(folderName2)
        for (const file of files) {
            fs.unlinkSync(file, (err) => {
                if (err) throw err;
            });
        }
        for (const file of files2) {
            fs.unlinkSync(file, (err) => {
                if (err) throw err;
            });
        }
        return true
    }

    createFolder(folderName) {
        var url = this.BASE_PATH + '/' + WORKSPACE_DIR + "/" + folderName;
        try {
            if (!fs.existsSync(url)) {
                fs.mkdirSync(url);
            }
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    // --------- GENERAL TOOLS

    async readFolder(dirName) {
        let files = [];
        const items = await readdir(dirName, { withFileTypes: true });

        for (const item of items) {
            if (item.isDirectory()) {
                files.push(`${dirName}/${item.name}`);
                files = [
                    ...files,
                    ...(await this.readFolder(`${dirName}/${item.name}`)),
                ];
            } else {
                files.push(`${dirName}/${item.name}`);
            }
        }
        return (files);
    }

    async readFile(filePath) {
        return new Promise(async(resolve, error) => {
            try {
                fs.readFile(filePath, function(err, data) {
                    if (!err) {
                        var ret = Buffer.from(data).toString('base64');
                        resolve(ret);
                    } else {
                        error(err);
                    }
                });
            } catch (err) {
                console.log(err);
                resolve(err);
            }
        });
    }

    writeFile(filePath, text) {
        fs.writeFileSync(filePath, text, function(err) {
            if (err) {
                return console.log(err);
            }
        });
    }

    uploadFile(filePath, buffer) {
        var savePath = this.BASE_PATH + '/' + WORKSPACE_DIR + '/input/' + filePath;
        fs.writeFileSync(savePath, Buffer.from(buffer), function(err) {
            if (err) {
                return console.log(err);
            }
        });
        console.log(savePath)
        return savePath;
    }

    renameFile(oldurl, newurl) {
        try {
            console.log('renamed ' + oldurl + ' into ' + newurl);
            if (newurl.split(".").length == 1) {
                newurl += ".webp";
            }
            fs.rename(oldurl, newurl, function(e) {
                console.log(e)
            });
        } catch (e) {
            console.log(e)
        }
    }
}

export default FolderTool;