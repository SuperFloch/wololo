const fs = require('fs')
const { readdir } = require('fs').promises;
const GIRLS_BASE_PATH = 'packs';

import ImageTool from './imageTool';

class FolderTool{
    constructor(){
        if (!fs.existsSync(GIRLS_BASE_PATH)){
            fs.mkdirSync(GIRLS_BASE_PATH);
        }
    }

    // --------- GIRLS TOOLS

    writeGirlInfoFile(girlName, girlObject){
        if(girlName != ''){
            var parsedGirl = JSON.parse(girlObject);
            var iniText = "[identity]\n";
            iniText += "first_name = " + parsedGirl.first_name+"\n";
            iniText += "last_name = " + parsedGirl.last_name+"\n";
            iniText += "traits = " + parsedGirl.traits.join(',')+"\n";
            iniText += "[info]\n";
            iniText += "source = " + parsedGirl.source+"\n";
            iniText += "modder = " + parsedGirl.modder+"\n";
            iniText += "[vars]\n";
            iniText += "sensitiveArea = " + parsedGirl.sensitive_area+"\n";
            this.writeFile(GIRLS_BASE_PATH + "/" + girlName + "/girlConfig.ini",iniText);
        }
    }
    async readGirlInfoFile(girlName){
        var file = await this.readFile(GIRLS_BASE_PATH + "/" + girlName + "/girlConfig.ini");
        var lines = file.split("\n");
        var girlObject = {};
        lines.forEach(l => {
            if(l.split("first_name").length > 1){
                girlObject.first_name = l.split("first_name")[1].trim().substring(1).trim();
            }
            if(l.split("last_name").length > 1){
                girlObject.last_name = l.split("last_name")[1].trim().substring(1).trim();
            }
            if(l.split("traits").length > 1){
                girlObject.traits = l.split("traits")[1].trim().substring(1).trim().split(',').filter(t=>t != '');
            }
            if(l.split("source").length > 1){
                girlObject.source = l.split("source")[1].trim().substring(1).trim();
            }
            if(l.split("modder").length > 1){
                girlObject.modder = l.split("modder")[1].trim().substring(1).trim();
            }
            if(l.split("sensitiveArea").length > 1){
                girlObject.sensitive_area = l.split("sensitiveArea")[1].trim().substring(1).trim();
            }
        });
        return girlObject;
    }

    createGirlFolder(girlName){
        var url = GIRLS_BASE_PATH + "/" + girlName;
        try {
            if (!fs.existsSync(url)){
                fs.mkdirSync(url);
                fs.mkdirSync(url+"/bodyparts");
                fs.mkdirSync(url+"/events");
                fs.mkdirSync(url+"/photoshoots");
                fs.mkdirSync(url+"/vids");
            }
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    async readGirlFolder(girlName){
        var url = GIRLS_BASE_PATH + "/" + girlName;
        var infos = await this.readGirlInfoFile(girlName);
        var files = await this.readFolder(url);
        return JSON.stringify({files, infos});
    }

    // --------- GENERAL TOOLS

    async readFolder(dirName){
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
        return(files);
    }

    async readFile(filePath){
        return new Promise(async (resolve) => {
            try{
                fs.readFile(filePath, function(err,data){
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

    writeFile(filePath,text){
        fs.writeFileSync(filePath, text, function(err) {
            if(err) {
                return console.log(err);
            }
        }); 
    }

    uploadFile(filePath, buffer){
        fs.writeFileSync(filePath, Buffer.from(buffer), function(err) {
            if(err) {
                return console.log(err);
            }
        }); 
    }

    renameFile(oldurl, newurl){
        try{
            console.log('renamed ' + oldurl +' into ' + newurl);
			if(newurl.split(".").length == 1){
				newurl += ".webp";
			}
            fs.rename( oldurl, newurl, function(e){
                console.log(e)
            });
        }catch(e){
            console.log(e)
        }
    }
}

export default FolderTool;