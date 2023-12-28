const fs = require('fs')
const { readdir } = require('fs').promises;
const WORKSPACE_DIR = 'workspace';

import ImageTool from './imageTool';

class FolderTool {
    constructor() {
        if (!fs.existsSync(WORKSPACE_DIR)) {
            fs.mkdirSync(WORKSPACE_DIR);
        }
        this.createFolder("input");
        this.createFolder("output");
    }

    createFolder(folderName) {
        var url = WORKSPACE_DIR + "/" + folderName;
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
        return new Promise(async(resolve) => {
            try {
                fs.readFile(filePath, function(err, data) {
                    if (!err) {
                        var ret = Buffer.from(data);
                        resolve(ret.toString());
                    } else {
                        resolve("error");
                    }
                });
            } catch (err) {
                console.log(err);
                resolve("error");
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
        fs.writeFileSync(filePath, Buffer.from(buffer), function(err) {
            if (err) {
                return console.log(err);
            }
        });
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