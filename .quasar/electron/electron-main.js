var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src-electron/electron-main.js
var import_electron = require("electron");
var import_path = __toESM(require("path"));
var import_os = __toESM(require("os"));

// src-electron/services/imageTool.js
var WebpImage = require("node-webpmux").Image;
var pngToIco = require("png-to-ico");
var child = require("child_process");
var path = require("path");
var util = require("util");
var terminateWithError = (error = "[fatal] error") => {
  console.log(error);
};
var exec = util.promisify(child.exec);
var webp = require("webp-converter");
webp.grant_permission();
var fs = require("fs");
var ImageTool = class {
  constructor() {
  }
  static async convertImageToWebp(imagePath) {
    return new Promise(async (resolve) => {
      try {
        var resUrl = imagePath.split(".")[0] + ".webp";
        resUrl = resUrl.split("/input/").join("/output/");
        const result = webp.cwebp(imagePath, resUrl, "-q 80", "-v");
        result.then((response) => {
          fs.unlinkSync(imagePath);
          resolve(resUrl);
          console.log(response);
        });
      } catch (e) {
        console.log(e.message);
        resolve(false);
      }
    });
  }
  static async convertWebpToWebm(imagePath) {
    return this.convertWebpToWebmNew(imagePath);
    return new Promise(async (resolve) => {
      const webPImage = await new WebpImage();
      await webPImage.load(imagePath);
      if (webPImage.hasAnim) {
        if (webPImage.frames !== void 0 && webPImage.frames.length > 1) {
          const frames = [...webPImage.frames];
          resolve(frames);
        }
      }
    });
  }
  static async resizeWebm(imagePath) {
    return new Promise(async (resolve) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath("./resources/ffmpeg/ffprobe.exe").setFfmpegPath("./resources/ffmpeg/ffmpeg.exe");
      ffmpeg.input(imagePath).noAudio().outputOptions("-pix_fmt yuv420p").output(imagePath.split(".")[0] + "1.webm").size("720x?").on("end", (e) => {
        console.log("Generated !");
        fs.unlinkSync(imagePath);
        ffmpeg.kill();
        resolve(imagePath.split(".")[0] + "1.webm");
      }).on("error", (e) => console.log(e)).run();
    });
  }
  static async convertGifToWebm(imagePath) {
    var resUrl = imagePath.split("/input/").join("/output/").split(".")[0] + ".webm";
    return new Promise(async (resolve) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath("./resources/ffmpeg/ffprobe.exe").setFfmpegPath("./resources/ffmpeg/ffmpeg.exe");
      ffmpeg.input(imagePath).noAudio().outputOptions("-pix_fmt yuv420p").output(resUrl).size("720x?").on("end", (e) => {
        console.log("Generated !");
        fs.unlinkSync(imagePath);
        ffmpeg.kill();
        resolve(resUrl);
      }).on("error", (e) => console.log(e)).run();
    });
  }
  static async convertWebpToWebmNew(filename) {
    return new Promise((resolve) => {
      const nameWithoutExt = filename.replace(".webp", "");
      const frames = path.resolve(process.cwd(), "frames");
      const deleteOriginal = true;
      if (fs.existsSync(frames))
        fs.rmdirSync(frames, { recursive: true });
      fs.mkdirSync(frames);
      process.chdir("frames");
      console.log("[info]", process.cwd());
      console.log("[info]", `anim_dump ../${filename}`);
      exec(`anim_dump ../${filename}`).then(() => {
        process.chdir("..");
        console.log("[info]", process.cwd());
        const command = `webpmux -info ./${filename}`;
        console.log("[info]", command);
        return exec(command);
      }).then(({ stdout, stderr }) => {
        if (stderr)
          return Promise.reject(stderr);
        const isAnimation = stdout.match(/Features present: animation/) !== null;
        if (!isAnimation)
          return Promise.reject("This is not an animated webp file");
        const firstLine = stdout.match(/1:.+[\r]?\n/g);
        if (!firstLine)
          return;
        const frameLength = firstLine[0].split(/\s+/g)[6];
        const framerate = Math.round(1e3 / frameLength);
        const dump = path.resolve(frames, "dump_%04d.png");
        const command = `ffmpeg -framerate ${framerate} -i "${dump}" "${nameWithoutExt}.webm" -y`;
        console.log("[info]", command);
        return exec(command);
      }).then(({ stdout, stderr }) => {
        if (/error/gm.test(stderr))
          return Promise.reject(stderr);
        fs.rmdirSync(frames, { recursive: true });
        if (deleteOriginal)
          fs.rmSync(path.resolve(process.cwd(), filename));
        resolve(true);
        console.log("[info] Success!\n");
      }).catch((err) => {
        terminateWithError(`[fatal] ${err}`);
        fs.rmdirSync(frames, { recursive: true });
      });
    });
  }
  static convertPngToIco(fileName) {
    return new Promise((resolve) => {
      var newName = fileName.split("/input/").join("/output/").split(".")[0] + ".ico";
      pngToIco(fileName).then((buf) => {
        fs.writeFileSync(newName, buf);
        resolve(newName);
      });
    });
  }
};
var imageTool_default = ImageTool;

// src-electron/services/folderTool.js
var fs2 = require("fs");
var { readdir } = require("fs").promises;
var WORKSPACE_DIR = "workspace";
var FolderTool = class {
  constructor(app2) {
    this.BASE_PATH = app2.getPath("userData");
    if (!fs2.existsSync(this.BASE_PATH + "/" + WORKSPACE_DIR)) {
      fs2.mkdirSync(this.BASE_PATH + "/" + WORKSPACE_DIR);
    }
    this.createFolder("input");
    this.createFolder("output");
  }
  createFolder(folderName) {
    var url = this.BASE_PATH + "/" + WORKSPACE_DIR + "/" + folderName;
    try {
      if (!fs2.existsSync(url)) {
        fs2.mkdirSync(url);
      }
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
  async readFolder(dirName) {
    let files = [];
    const items = await readdir(dirName, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) {
        files.push(`${dirName}/${item.name}`);
        files = [
          ...files,
          ...await this.readFolder(`${dirName}/${item.name}`)
        ];
      } else {
        files.push(`${dirName}/${item.name}`);
      }
    }
    return files;
  }
  async readFile(filePath) {
    return new Promise(async (resolve) => {
      try {
        fs2.readFile(filePath, function(err, data) {
          if (!err) {
            var ret = Buffer.from(data).toString("base64");
            resolve(ret);
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
    fs2.writeFileSync(filePath, text, function(err) {
      if (err) {
        return console.log(err);
      }
    });
  }
  uploadFile(filePath, buffer) {
    var savePath = this.BASE_PATH + "/" + WORKSPACE_DIR + "/input/" + filePath;
    fs2.writeFileSync(savePath, Buffer.from(buffer), function(err) {
      if (err) {
        return console.log(err);
      }
    });
    console.log(savePath);
    return savePath;
  }
  renameFile(oldurl, newurl) {
    try {
      console.log("renamed " + oldurl + " into " + newurl);
      if (newurl.split(".").length == 1) {
        newurl += ".webp";
      }
      fs2.rename(oldurl, newurl, function(e) {
        console.log(e);
      });
    } catch (e) {
      console.log(e);
    }
  }
};
var folderTool_default = FolderTool;

// src-electron/electron-main.js
var platform = process.platform || import_os.default.platform();
var mainWindow;
var folderTool = new folderTool_default(import_electron.app);
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    icon: import_path.default.resolve(__dirname, "icons/icon.png"),
    width: 1e3,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      preload: import_path.default.resolve(__dirname, "D:\\GLAY\\Leek\\wololo\\.quasar\\electron\\electron-preload.js")
    }
  });
  mainWindow.loadURL("http://localhost:9300");
  if (true) {
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
import_electron.app.whenReady().then(createWindow);
import_electron.app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
import_electron.ipcMain.handle("img:convert:webp", async (e, data) => {
  return await folderTool.readFile(await imageTool_default.convertImageToWebp(data.img));
});
import_electron.ipcMain.handle("img:convert:webm", async (e, data) => {
  return await folderTool.readFile(await imageTool_default.convertGifToWebm(data.img));
});
import_electron.ipcMain.handle("img:convert:ico", async (e, data) => {
  return await folderTool.readFile(await imageTool_default.convertPngToIco(data.img));
});
import_electron.ipcMain.handle("webm:resize", async (e, data) => {
  return await imageTool_default.resizeWebm(data.img);
});
import_electron.ipcMain.handle("img:getFrames", async (e, data) => {
  return await imageTool_default.convertWebpToWebm(data.img);
});
import_electron.ipcMain.handle("file:read", async (e, data) => {
  return await folderTool.readFile(data.path);
});
import_electron.ipcMain.on("img:rename", (e, data) => {
  folderTool.renameFile(data.oldPath, data.newPath);
});
import_electron.ipcMain.on("file:write", (e, data) => {
  folderTool.writeFile(data.path, data.text);
});
import_electron.ipcMain.handle("img:upload", (e, data) => {
  return folderTool.uploadFile(data.path, data.buffer);
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjLWVsZWN0cm9uL2VsZWN0cm9uLW1haW4uanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ltYWdlVG9vbC5qcyIsICIuLi8uLi9zcmMtZWxlY3Ryb24vc2VydmljZXMvZm9sZGVyVG9vbC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93LCBuYXRpdmVUaGVtZSwgaXBjTWFpbiB9IGZyb20gJ2VsZWN0cm9uJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgb3MgZnJvbSAnb3MnXHJcbmltcG9ydCBGb2xkZXJUb29sIGZyb20gJy4vc2VydmljZXMvZm9sZGVyVG9vbCc7XHJcbmltcG9ydCBJbWFnZVRvb2wgZnJvbSAnLi9zZXJ2aWNlcy9pbWFnZVRvb2wnO1xyXG5cclxuLy8gbmVlZGVkIGluIGNhc2UgcHJvY2VzcyBpcyB1bmRlZmluZWQgdW5kZXIgTGludXhcclxuY29uc3QgcGxhdGZvcm0gPSBwcm9jZXNzLnBsYXRmb3JtIHx8IG9zLnBsYXRmb3JtKClcclxuXHJcbmxldCBtYWluV2luZG93XHJcblxyXG5jb25zdCBmb2xkZXJUb29sID0gbmV3IEZvbGRlclRvb2woYXBwKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpbmRvdygpIHtcclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbCB3aW5kb3cgb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBtYWluV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xyXG4gICAgICAgIGljb246IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdpY29ucy9pY29uLnBuZycpLCAvLyB0cmF5IGljb25cclxuICAgICAgICB3aWR0aDogMTAwMCxcclxuICAgICAgICBoZWlnaHQ6IDYwMCxcclxuICAgICAgICB1c2VDb250ZW50U2l6ZTogdHJ1ZSxcclxuICAgICAgICB3ZWJQcmVmZXJlbmNlczoge1xyXG4gICAgICAgICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICAvLyBNb3JlIGluZm86IGh0dHBzOi8vdjIucXVhc2FyLmRldi9xdWFzYXItY2xpLXZpdGUvZGV2ZWxvcGluZy1lbGVjdHJvbi1hcHBzL2VsZWN0cm9uLXByZWxvYWQtc2NyaXB0XHJcbiAgICAgICAgICAgIHByZWxvYWQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIHByb2Nlc3MuZW52LlFVQVNBUl9FTEVDVFJPTl9QUkVMT0FEKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgbWFpbldpbmRvdy5sb2FkVVJMKHByb2Nlc3MuZW52LkFQUF9VUkwpXHJcblxyXG4gICAgaWYgKHByb2Nlc3MuZW52LkRFQlVHR0lORykge1xyXG4gICAgICAgIC8vIGlmIG9uIERFViBvciBQcm9kdWN0aW9uIHdpdGggZGVidWcgZW5hYmxlZFxyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gd2UncmUgb24gcHJvZHVjdGlvbjsgbm8gYWNjZXNzIHRvIGRldnRvb2xzIHBsc1xyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub24oJ2RldnRvb2xzLW9wZW5lZCcsICgpID0+IHtcclxuICAgICAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5jbG9zZURldlRvb2xzKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIG1haW5XaW5kb3cub24oJ2Nsb3NlZCcsICgpID0+IHtcclxuICAgICAgICBtYWluV2luZG93ID0gbnVsbFxyXG4gICAgfSlcclxufVxyXG5cclxuYXBwLndoZW5SZWFkeSgpLnRoZW4oY3JlYXRlV2luZG93KVxyXG5cclxuYXBwLm9uKCd3aW5kb3ctYWxsLWNsb3NlZCcsICgpID0+IHtcclxuICAgIGlmIChwbGF0Zm9ybSAhPT0gJ2RhcndpbicpIHtcclxuICAgICAgICBhcHAucXVpdCgpXHJcbiAgICB9XHJcbn0pXHJcblxyXG5hcHAub24oJ2FjdGl2YXRlJywgKCkgPT4ge1xyXG4gICAgaWYgKG1haW5XaW5kb3cgPT09IG51bGwpIHtcclxuICAgICAgICBjcmVhdGVXaW5kb3coKVxyXG4gICAgfVxyXG59KVxyXG5cclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OndlYnAnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShhd2FpdCBJbWFnZVRvb2wuY29udmVydEltYWdlVG9XZWJwKGRhdGEuaW1nKSlcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OndlYm0nLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShhd2FpdCBJbWFnZVRvb2wuY29udmVydEdpZlRvV2VibShkYXRhLmltZykpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6Y29udmVydDppY28nLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShhd2FpdCBJbWFnZVRvb2wuY29udmVydFBuZ1RvSWNvKGRhdGEuaW1nKSlcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ3dlYm06cmVzaXplJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IEltYWdlVG9vbC5yZXNpemVXZWJtKGRhdGEuaW1nKVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOmdldEZyYW1lcycsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCBJbWFnZVRvb2wuY29udmVydFdlYnBUb1dlYm0oZGF0YS5pbWcpO1xyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnZmlsZTpyZWFkJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZGF0YS5wYXRoKTtcclxufSlcclxuaXBjTWFpbi5vbignaW1nOnJlbmFtZScsIChlLCBkYXRhKSA9PiB7XHJcbiAgICBmb2xkZXJUb29sLnJlbmFtZUZpbGUoZGF0YS5vbGRQYXRoLCBkYXRhLm5ld1BhdGgpXHJcbn0pXHJcbmlwY01haW4ub24oJ2ZpbGU6d3JpdGUnLCAoZSwgZGF0YSkgPT4ge1xyXG4gICAgZm9sZGVyVG9vbC53cml0ZUZpbGUoZGF0YS5wYXRoLCBkYXRhLnRleHQpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6dXBsb2FkJywgKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBmb2xkZXJUb29sLnVwbG9hZEZpbGUoZGF0YS5wYXRoLCBkYXRhLmJ1ZmZlcik7XHJcbn0pIiwgIi8vIEdpZiB0byBXRUJNIGxpYnJhcnlcclxuY29uc3QgV2VicEltYWdlID0gcmVxdWlyZSgnbm9kZS13ZWJwbXV4JykuSW1hZ2U7XHJcblxyXG5jb25zdCBwbmdUb0ljbyA9IHJlcXVpcmUoJ3BuZy10by1pY28nKTtcclxuXHJcbmNvbnN0IGNoaWxkID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcclxuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKVxyXG5cclxuY29uc3QgdGVybWluYXRlV2l0aEVycm9yID0gKGVycm9yID0gJ1tmYXRhbF0gZXJyb3InKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgICAgICAvL3Byb2Nlc3MuZXhpdCgxKVxyXG59XHJcblxyXG5jb25zdCBleGVjID0gdXRpbC5wcm9taXNpZnkoY2hpbGQuZXhlYylcclxuXHJcbmNvbnN0IHdlYnAgPSByZXF1aXJlKCd3ZWJwLWNvbnZlcnRlcicpO1xyXG53ZWJwLmdyYW50X3Blcm1pc3Npb24oKTtcclxuXHJcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKVxyXG5cclxuY2xhc3MgSW1hZ2VUb29sIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydEltYWdlVG9XZWJwKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzVXJsID0gaW1hZ2VQYXRoLnNwbGl0KFwiLlwiKVswXSArIFwiLndlYnBcIjtcclxuICAgICAgICAgICAgICAgIHJlc1VybCA9IHJlc1VybC5zcGxpdCgnL2lucHV0LycpLmpvaW4oJy9vdXRwdXQvJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB3ZWJwLmN3ZWJwKGltYWdlUGF0aCwgcmVzVXJsLCBcIi1xIDgwXCIsIFwiLXZcIik7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmtTeW5jKGltYWdlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNVcmwpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydFdlYnBUb1dlYm0oaW1hZ2VQYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udmVydFdlYnBUb1dlYm1OZXcoaW1hZ2VQYXRoKTtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB3ZWJQSW1hZ2UgPSBhd2FpdCBuZXcgV2VicEltYWdlKCk7XHJcbiAgICAgICAgICAgIGF3YWl0IHdlYlBJbWFnZS5sb2FkKGltYWdlUGF0aCk7XHJcbiAgICAgICAgICAgIGlmICh3ZWJQSW1hZ2UuaGFzQW5pbSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh3ZWJQSW1hZ2UuZnJhbWVzICE9PSB1bmRlZmluZWQgJiYgd2ViUEltYWdlLmZyYW1lcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZnJhbWVzID0gWy4uLndlYlBJbWFnZS5mcmFtZXNdO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZnJhbWVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIHJlc2l6ZVdlYm0oaW1hZ2VQYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgdmFyIGZmbXBlZyA9IHJlcXVpcmUoXCJmbHVlbnQtZmZtcGVnXCIpKClcclxuICAgICAgICAgICAgICAgIC5zZXRGZnByb2JlUGF0aCgnLi9yZXNvdXJjZXMvZmZtcGVnL2ZmcHJvYmUuZXhlJylcclxuICAgICAgICAgICAgICAgIC5zZXRGZm1wZWdQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZtcGVnLmV4ZScpO1xyXG5cclxuICAgICAgICAgICAgZmZtcGVnXHJcbiAgICAgICAgICAgICAgICAuaW5wdXQoaW1hZ2VQYXRoKVxyXG4gICAgICAgICAgICAgICAgLm5vQXVkaW8oKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dE9wdGlvbnMoJy1waXhfZm10IHl1djQyMHAnKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dChpbWFnZVBhdGguc3BsaXQoJy4nKVswXSArIFwiMS53ZWJtXCIpXHJcbiAgICAgICAgICAgICAgICAuc2l6ZSgnNzIweD8nKVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZW5kXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJHZW5lcmF0ZWQgIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmtTeW5jKGltYWdlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmZtcGVnLmtpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGltYWdlUGF0aC5zcGxpdCgnLicpWzBdICsgXCIxLndlYm1cIik7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZXJyb3JcIiwgKGUpID0+IGNvbnNvbGUubG9nKGUpKS5ydW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydEdpZlRvV2VibShpbWFnZVBhdGgpIHtcclxuICAgICAgICB2YXIgcmVzVXJsID0gaW1hZ2VQYXRoLnNwbGl0KCcvaW5wdXQvJykuam9pbignL291dHB1dC8nKS5zcGxpdCgnLicpWzBdICsgJy53ZWJtJztcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZwcm9iZS5leGUnKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZm1wZWcuZXhlJyk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dChpbWFnZVBhdGgpXHJcbiAgICAgICAgICAgICAgICAubm9BdWRpbygpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0T3B0aW9ucygnLXBpeF9mbXQgeXV2NDIwcCcpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KHJlc1VybClcclxuICAgICAgICAgICAgICAgIC5zaXplKCc3MjB4PycpXHJcbiAgICAgICAgICAgICAgICAub24oXCJlbmRcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdlbmVyYXRlZCAhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICBmZm1wZWcua2lsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzVXJsKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlcnJvclwiLCAoZSkgPT4gY29uc29sZS5sb2coZSkpLnJ1bigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjb252ZXJ0V2VicFRvV2VibU5ldyhmaWxlbmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lV2l0aG91dEV4dCA9IGZpbGVuYW1lLnJlcGxhY2UoJy53ZWJwJywgJycpXHJcbiAgICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnZnJhbWVzJylcclxuICAgICAgICAgICAgY29uc3QgZGVsZXRlT3JpZ2luYWwgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZnJhbWVzKSkgZnMucm1kaXJTeW5jKGZyYW1lcywgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuICAgICAgICAgICAgZnMubWtkaXJTeW5jKGZyYW1lcylcclxuXHJcbiAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIoJ2ZyYW1lcycpXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBwcm9jZXNzLmN3ZCgpKVxyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIGBhbmltX2R1bXAgLi4vJHtmaWxlbmFtZX1gKVxyXG4gICAgICAgICAgICBleGVjKGBhbmltX2R1bXAgLi4vJHtmaWxlbmFtZX1gKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIoJy4uJylcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgcHJvY2Vzcy5jd2QoKSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IGB3ZWJwbXV4IC1pbmZvIC4vJHtmaWxlbmFtZX1gXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleGVjKGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKHsgc3Rkb3V0LCBzdGRlcnIgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGRlcnIpIHJldHVybiBQcm9taXNlLnJlamVjdChzdGRlcnIpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQW5pbWF0aW9uID0gc3Rkb3V0Lm1hdGNoKC9GZWF0dXJlcyBwcmVzZW50OiBhbmltYXRpb24vKSAhPT0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNBbmltYXRpb24pIHJldHVybiBQcm9taXNlLnJlamVjdCgnVGhpcyBpcyBub3QgYW4gYW5pbWF0ZWQgd2VicCBmaWxlJylcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlyc3RMaW5lID0gc3Rkb3V0Lm1hdGNoKC8xOi4rW1xccl0/XFxuL2cpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdExpbmUpIHJldHVyblxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcmFtZUxlbmd0aCA9IGZpcnN0TGluZVswXS5zcGxpdCgvXFxzKy9nKVs2XVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lcmF0ZSA9IE1hdGgucm91bmQoMTAwMCAvIGZyYW1lTGVuZ3RoKSAvLyBmcmFtZXMvc2Vjb25kXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IHBhdGgucmVzb2x2ZShmcmFtZXMsICdkdW1wXyUwNGQucG5nJylcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYW5kID0gYGZmbXBlZyAtZnJhbWVyYXRlICR7ZnJhbWVyYXRlfSAtaSBcIiR7ZHVtcH1cIiBcIiR7bmFtZVdpdGhvdXRFeHR9LndlYm1cIiAteWBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWMoY29tbWFuZClcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAudGhlbigoeyBzdGRvdXQsIHN0ZGVyciB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKC9lcnJvci9nbS50ZXN0KHN0ZGVycikpIHJldHVybiBQcm9taXNlLnJlamVjdChzdGRlcnIpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsZWFudXBcclxuICAgICAgICAgICAgICAgICAgICBmcy5ybWRpclN5bmMoZnJhbWVzLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWxldGVPcmlnaW5hbCkgZnMucm1TeW5jKHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBmaWxlbmFtZSkpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXSBTdWNjZXNzIVxcbicpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVybWluYXRlV2l0aEVycm9yKGBbZmF0YWxdICR7ZXJyfWApXHJcbiAgICAgICAgICAgICAgICAgICAgZnMucm1kaXJTeW5jKGZyYW1lcywgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGNvbnZlcnRQbmdUb0ljbyhmaWxlTmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgbmV3TmFtZSA9IGZpbGVOYW1lLnNwbGl0KCcvaW5wdXQvJykuam9pbignL291dHB1dC8nKS5zcGxpdCgnLicpWzBdICsgJy5pY28nO1xyXG4gICAgICAgICAgICBwbmdUb0ljbyhmaWxlTmFtZSlcclxuICAgICAgICAgICAgICAgIC50aGVuKGJ1ZiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhuZXdOYW1lLCBidWYpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobmV3TmFtZSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5leHBvcnQgZGVmYXVsdCBJbWFnZVRvb2w7IiwgImNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKVxyXG5jb25zdCB7IHJlYWRkaXIgfSA9IHJlcXVpcmUoJ2ZzJykucHJvbWlzZXM7XHJcbmNvbnN0IFdPUktTUEFDRV9ESVIgPSAnd29ya3NwYWNlJztcclxuXHJcbmltcG9ydCBJbWFnZVRvb2wgZnJvbSAnLi9pbWFnZVRvb2wnO1xyXG5cclxuY2xhc3MgRm9sZGVyVG9vbCB7XHJcbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcclxuICAgICAgICB0aGlzLkJBU0VfUEFUSCA9IGFwcC5nZXRQYXRoKCd1c2VyRGF0YScpO1xyXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyh0aGlzLkJBU0VfUEFUSCArICcvJyArIFdPUktTUEFDRV9ESVIpKSB7XHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLkJBU0VfUEFUSCArICcvJyArIFdPUktTUEFDRV9ESVIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNyZWF0ZUZvbGRlcihcImlucHV0XCIpO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRm9sZGVyKFwib3V0cHV0XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZUZvbGRlcihmb2xkZXJOYW1lKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuQkFTRV9QQVRIICsgJy8nICsgV09SS1NQQUNFX0RJUiArIFwiL1wiICsgZm9sZGVyTmFtZTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmModXJsKSkge1xyXG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKHVybCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tIEdFTkVSQUwgVE9PTFNcclxuXHJcbiAgICBhc3luYyByZWFkRm9sZGVyKGRpck5hbWUpIHtcclxuICAgICAgICBsZXQgZmlsZXMgPSBbXTtcclxuICAgICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHJlYWRkaXIoZGlyTmFtZSwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW0uaXNEaXJlY3RvcnkoKSkge1xyXG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gKTtcclxuICAgICAgICAgICAgICAgIGZpbGVzID0gW1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLmZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgIC4uLihhd2FpdCB0aGlzLnJlYWRGb2xkZXIoYCR7ZGlyTmFtZX0vJHtpdGVtLm5hbWV9YCkpLFxyXG4gICAgICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goYCR7ZGlyTmFtZX0vJHtpdGVtLm5hbWV9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIChmaWxlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVhZEZpbGUoZmlsZVBhdGgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgZnMucmVhZEZpbGUoZmlsZVBhdGgsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXQgPSBCdWZmZXIuZnJvbShkYXRhKS50b1N0cmluZygnYmFzZTY0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmV0KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFwiZXJyb3JcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoXCJlcnJvclwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlRmlsZShmaWxlUGF0aCwgdGV4dCkge1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIHRleHQsIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHVwbG9hZEZpbGUoZmlsZVBhdGgsIGJ1ZmZlcikge1xyXG4gICAgICAgIHZhciBzYXZlUGF0aCA9IHRoaXMuQkFTRV9QQVRIICsgJy8nICsgV09SS1NQQUNFX0RJUiArICcvaW5wdXQvJyArIGZpbGVQYXRoO1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoc2F2ZVBhdGgsIEJ1ZmZlci5mcm9tKGJ1ZmZlciksIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNhdmVQYXRoKVxyXG4gICAgICAgIHJldHVybiBzYXZlUGF0aDtcclxuICAgIH1cclxuXHJcbiAgICByZW5hbWVGaWxlKG9sZHVybCwgbmV3dXJsKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlbmFtZWQgJyArIG9sZHVybCArICcgaW50byAnICsgbmV3dXJsKTtcclxuICAgICAgICAgICAgaWYgKG5ld3VybC5zcGxpdChcIi5cIikubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIG5ld3VybCArPSBcIi53ZWJwXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnMucmVuYW1lKG9sZHVybCwgbmV3dXJsLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBGb2xkZXJUb29sOyJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0JBQXlEO0FBQ3pELGtCQUFpQjtBQUNqQixnQkFBZTs7O0FDRGYsSUFBTSxZQUFZLFFBQVEsZ0JBQWdCO0FBRTFDLElBQU0sV0FBVyxRQUFRO0FBRXpCLElBQU0sUUFBUSxRQUFRO0FBQ3RCLElBQU0sT0FBTyxRQUFRO0FBQ3JCLElBQU0sT0FBTyxRQUFRO0FBRXJCLElBQU0scUJBQXFCLENBQUMsUUFBUSxvQkFBb0I7QUFDcEQsVUFBUSxJQUFJLEtBQUs7QUFFckI7QUFFQSxJQUFNLE9BQU8sS0FBSyxVQUFVLE1BQU0sSUFBSTtBQUV0QyxJQUFNLE9BQU8sUUFBUTtBQUNyQixLQUFLLGlCQUFpQjtBQUV0QixJQUFNLEtBQUssUUFBUTtBQUVuQixJQUFNLFlBQU4sTUFBZ0I7QUFBQSxFQUNaLGNBQWM7QUFBQSxFQUVkO0FBQUEsRUFFQSxhQUFhLG1CQUFtQixXQUFXO0FBQ3ZDLFdBQU8sSUFBSSxRQUFRLE9BQU0sWUFBWTtBQUNqQyxVQUFJO0FBQ0EsWUFBSSxTQUFTLFVBQVUsTUFBTSxHQUFHLEVBQUUsS0FBSztBQUN2QyxpQkFBUyxPQUFPLE1BQU0sU0FBUyxFQUFFLEtBQUssVUFBVTtBQUNoRCxjQUFNLFNBQVMsS0FBSyxNQUFNLFdBQVcsUUFBUSxTQUFTLElBQUk7QUFDMUQsZUFBTyxLQUFLLENBQUMsYUFBYTtBQUN0QixhQUFHLFdBQVcsU0FBUztBQUN2QixrQkFBUSxNQUFNO0FBQ2Qsa0JBQVEsSUFBSSxRQUFRO0FBQUEsUUFDeEIsQ0FBQztBQUFBLE1BQ0wsU0FBUyxHQUFQO0FBQ0UsZ0JBQVEsSUFBSSxFQUFFLE9BQU87QUFDckIsZ0JBQVEsS0FBSztBQUFBLE1BQ2pCO0FBQUEsSUFDSixDQUFDO0FBQUEsRUFDTDtBQUFBLEVBRUEsYUFBYSxrQkFBa0IsV0FBVztBQUN0QyxXQUFPLEtBQUsscUJBQXFCLFNBQVM7QUFDMUMsV0FBTyxJQUFJLFFBQVEsT0FBTSxZQUFZO0FBQ2pDLFlBQU0sWUFBWSxNQUFNLElBQUksVUFBVTtBQUN0QyxZQUFNLFVBQVUsS0FBSyxTQUFTO0FBQzlCLFVBQUksVUFBVSxTQUFTO0FBRW5CLFlBQUksVUFBVSxXQUFXLFVBQWEsVUFBVSxPQUFPLFNBQVMsR0FBRztBQUMvRCxnQkFBTSxTQUFTLENBQUMsR0FBRyxVQUFVLE1BQU07QUFDbkMsa0JBQVEsTUFBTTtBQUFBLFFBQ2xCO0FBQUEsTUFDSjtBQUFBLElBQ0osQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUVBLGFBQWEsV0FBVyxXQUFXO0FBQy9CLFdBQU8sSUFBSSxRQUFRLE9BQU0sWUFBWTtBQUNqQyxVQUFJLFNBQVMsUUFBUSxpQkFBaUIsRUFDakMsZUFBZSxnQ0FBZ0MsRUFDL0MsY0FBYywrQkFBK0I7QUFFbEQsYUFDSyxNQUFNLFNBQVMsRUFDZixRQUFRLEVBQ1IsY0FBYyxrQkFBa0IsRUFDaEMsT0FBTyxVQUFVLE1BQU0sR0FBRyxFQUFFLEtBQUssUUFBUSxFQUN6QyxLQUFLLE9BQU8sRUFDWixHQUFHLE9BQU8sQ0FBQyxNQUFNO0FBQ2QsZ0JBQVEsSUFBSSxhQUFhO0FBQ3pCLFdBQUcsV0FBVyxTQUFTO0FBQ3ZCLGVBQU8sS0FBSztBQUNaLGdCQUFRLFVBQVUsTUFBTSxHQUFHLEVBQUUsS0FBSyxRQUFRO0FBQUEsTUFDOUMsQ0FBQyxFQUNBLEdBQUcsU0FBUyxDQUFDLE1BQU0sUUFBUSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUk7QUFBQSxJQUNoRCxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBRUEsYUFBYSxpQkFBaUIsV0FBVztBQUNyQyxRQUFJLFNBQVMsVUFBVSxNQUFNLFNBQVMsRUFBRSxLQUFLLFVBQVUsRUFBRSxNQUFNLEdBQUcsRUFBRSxLQUFLO0FBQ3pFLFdBQU8sSUFBSSxRQUFRLE9BQU0sWUFBWTtBQUNqQyxVQUFJLFNBQVMsUUFBUSxpQkFBaUIsRUFDakMsZUFBZSxnQ0FBZ0MsRUFDL0MsY0FBYywrQkFBK0I7QUFFbEQsYUFDSyxNQUFNLFNBQVMsRUFDZixRQUFRLEVBQ1IsY0FBYyxrQkFBa0IsRUFDaEMsT0FBTyxNQUFNLEVBQ2IsS0FBSyxPQUFPLEVBQ1osR0FBRyxPQUFPLENBQUMsTUFBTTtBQUNkLGdCQUFRLElBQUksYUFBYTtBQUN6QixXQUFHLFdBQVcsU0FBUztBQUN2QixlQUFPLEtBQUs7QUFDWixnQkFBUSxNQUFNO0FBQUEsTUFDbEIsQ0FBQyxFQUNBLEdBQUcsU0FBUyxDQUFDLE1BQU0sUUFBUSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUk7QUFBQSxJQUNoRCxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBRUEsYUFBYSxxQkFBcUIsVUFBVTtBQUN4QyxXQUFPLElBQUksUUFBUSxDQUFDLFlBQVk7QUFDNUIsWUFBTSxpQkFBaUIsU0FBUyxRQUFRLFNBQVMsRUFBRTtBQUNuRCxZQUFNLFNBQVMsS0FBSyxRQUFRLFFBQVEsSUFBSSxHQUFHLFFBQVE7QUFDbkQsWUFBTSxpQkFBaUI7QUFFdkIsVUFBSSxHQUFHLFdBQVcsTUFBTTtBQUFHLFdBQUcsVUFBVSxRQUFRLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFDbkUsU0FBRyxVQUFVLE1BQU07QUFFbkIsY0FBUSxNQUFNLFFBQVE7QUFDdEIsY0FBUSxJQUFJLFVBQVUsUUFBUSxJQUFJLENBQUM7QUFFbkMsY0FBUSxJQUFJLFVBQVUsZ0JBQWdCLFVBQVU7QUFDaEQsV0FBSyxnQkFBZ0IsVUFBVSxFQUMxQixLQUFLLE1BQU07QUFDUixnQkFBUSxNQUFNLElBQUk7QUFDbEIsZ0JBQVEsSUFBSSxVQUFVLFFBQVEsSUFBSSxDQUFDO0FBRW5DLGNBQU0sVUFBVSxtQkFBbUI7QUFFbkMsZ0JBQVEsSUFBSSxVQUFVLE9BQU87QUFDN0IsZUFBTyxLQUFLLE9BQU87QUFBQSxNQUN2QixDQUFDLEVBQ0EsS0FBSyxDQUFDLEVBQUUsUUFBUSxPQUFPLE1BQU07QUFDMUIsWUFBSTtBQUFRLGlCQUFPLFFBQVEsT0FBTyxNQUFNO0FBRXhDLGNBQU0sY0FBYyxPQUFPLE1BQU0sNkJBQTZCLE1BQU07QUFDcEUsWUFBSSxDQUFDO0FBQWEsaUJBQU8sUUFBUSxPQUFPLG1DQUFtQztBQUUzRSxjQUFNLFlBQVksT0FBTyxNQUFNLGNBQWM7QUFDN0MsWUFBSSxDQUFDO0FBQVc7QUFFaEIsY0FBTSxjQUFjLFVBQVUsR0FBRyxNQUFNLE1BQU0sRUFBRTtBQUMvQyxjQUFNLFlBQVksS0FBSyxNQUFNLE1BQU8sV0FBVztBQUMvQyxjQUFNLE9BQU8sS0FBSyxRQUFRLFFBQVEsZUFBZTtBQUNqRCxjQUFNLFVBQVUscUJBQXFCLGlCQUFpQixVQUFVO0FBRWhFLGdCQUFRLElBQUksVUFBVSxPQUFPO0FBQzdCLGVBQU8sS0FBSyxPQUFPO0FBQUEsTUFDdkIsQ0FBQyxFQUNBLEtBQUssQ0FBQyxFQUFFLFFBQVEsT0FBTyxNQUFNO0FBQzFCLFlBQUksVUFBVSxLQUFLLE1BQU07QUFBRyxpQkFBTyxRQUFRLE9BQU8sTUFBTTtBQUd4RCxXQUFHLFVBQVUsUUFBUSxFQUFFLFdBQVcsS0FBSyxDQUFDO0FBQ3hDLFlBQUk7QUFBZ0IsYUFBRyxPQUFPLEtBQUssUUFBUSxRQUFRLElBQUksR0FBRyxRQUFRLENBQUM7QUFFbkUsZ0JBQVEsSUFBSTtBQUNaLGdCQUFRLElBQUksbUJBQW1CO0FBQUEsTUFDbkMsQ0FBQyxFQUNBLE1BQU0sU0FBTztBQUNWLDJCQUFtQixXQUFXLEtBQUs7QUFDbkMsV0FBRyxVQUFVLFFBQVEsRUFBRSxXQUFXLEtBQUssQ0FBQztBQUFBLE1BQzVDLENBQUM7QUFBQSxJQUNULENBQUM7QUFBQSxFQUNMO0FBQUEsRUFFQSxPQUFPLGdCQUFnQixVQUFVO0FBQzdCLFdBQU8sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUM1QixVQUFJLFVBQVUsU0FBUyxNQUFNLFNBQVMsRUFBRSxLQUFLLFVBQVUsRUFBRSxNQUFNLEdBQUcsRUFBRSxLQUFLO0FBQ3pFLGVBQVMsUUFBUSxFQUNaLEtBQUssU0FBTztBQUNULFdBQUcsY0FBYyxTQUFTLEdBQUc7QUFDN0IsZ0JBQVEsT0FBTztBQUFBLE1BQ25CLENBQUM7QUFBQSxJQUNULENBQUM7QUFBQSxFQUNMO0FBQ0o7QUFDQSxJQUFPLG9CQUFROzs7QUM1S2YsSUFBTUEsTUFBSyxRQUFRO0FBQ25CLElBQU0sRUFBRSxRQUFRLElBQUksUUFBUSxNQUFNO0FBQ2xDLElBQU0sZ0JBQWdCO0FBSXRCLElBQU0sYUFBTixNQUFpQjtBQUFBLEVBQ2IsWUFBWUMsTUFBSztBQUNiLFNBQUssWUFBWUEsS0FBSSxRQUFRLFVBQVU7QUFDdkMsUUFBSSxDQUFDRCxJQUFHLFdBQVcsS0FBSyxZQUFZLE1BQU0sYUFBYSxHQUFHO0FBQ3RELE1BQUFBLElBQUcsVUFBVSxLQUFLLFlBQVksTUFBTSxhQUFhO0FBQUEsSUFDckQ7QUFDQSxTQUFLLGFBQWEsT0FBTztBQUN6QixTQUFLLGFBQWEsUUFBUTtBQUFBLEVBQzlCO0FBQUEsRUFFQSxhQUFhLFlBQVk7QUFDckIsUUFBSSxNQUFNLEtBQUssWUFBWSxNQUFNLGdCQUFnQixNQUFNO0FBQ3ZELFFBQUk7QUFDQSxVQUFJLENBQUNBLElBQUcsV0FBVyxHQUFHLEdBQUc7QUFDckIsUUFBQUEsSUFBRyxVQUFVLEdBQUc7QUFBQSxNQUNwQjtBQUNBLGFBQU87QUFBQSxJQUNYLFNBQVMsS0FBUDtBQUNFLGNBQVEsSUFBSSxHQUFHO0FBQ2YsYUFBTztBQUFBLElBQ1g7QUFBQSxFQUNKO0FBQUEsRUFJQSxNQUFNLFdBQVcsU0FBUztBQUN0QixRQUFJLFFBQVEsQ0FBQztBQUNiLFVBQU0sUUFBUSxNQUFNLFFBQVEsU0FBUyxFQUFFLGVBQWUsS0FBSyxDQUFDO0FBRTVELGVBQVcsUUFBUSxPQUFPO0FBQ3RCLFVBQUksS0FBSyxZQUFZLEdBQUc7QUFDcEIsY0FBTSxLQUFLLEdBQUcsV0FBVyxLQUFLLE1BQU07QUFDcEMsZ0JBQVE7QUFBQSxVQUNKLEdBQUc7QUFBQSxVQUNILEdBQUksTUFBTSxLQUFLLFdBQVcsR0FBRyxXQUFXLEtBQUssTUFBTTtBQUFBLFFBQ3ZEO0FBQUEsTUFDSixPQUFPO0FBQ0gsY0FBTSxLQUFLLEdBQUcsV0FBVyxLQUFLLE1BQU07QUFBQSxNQUN4QztBQUFBLElBQ0o7QUFDQSxXQUFRO0FBQUEsRUFDWjtBQUFBLEVBRUEsTUFBTSxTQUFTLFVBQVU7QUFDckIsV0FBTyxJQUFJLFFBQVEsT0FBTSxZQUFZO0FBQ2pDLFVBQUk7QUFDQSxRQUFBQSxJQUFHLFNBQVMsVUFBVSxTQUFTLEtBQUssTUFBTTtBQUN0QyxjQUFJLENBQUMsS0FBSztBQUNOLGdCQUFJLE1BQU0sT0FBTyxLQUFLLElBQUksRUFBRSxTQUFTLFFBQVE7QUFDN0Msb0JBQVEsR0FBRztBQUFBLFVBQ2YsT0FBTztBQUNILG9CQUFRLE9BQU87QUFBQSxVQUNuQjtBQUFBLFFBQ0osQ0FBQztBQUFBLE1BQ0wsU0FBUyxLQUFQO0FBQ0UsZ0JBQVEsSUFBSSxHQUFHO0FBQ2YsZ0JBQVEsT0FBTztBQUFBLE1BQ25CO0FBQUEsSUFDSixDQUFDO0FBQUEsRUFDTDtBQUFBLEVBRUEsVUFBVSxVQUFVLE1BQU07QUFDdEIsSUFBQUEsSUFBRyxjQUFjLFVBQVUsTUFBTSxTQUFTLEtBQUs7QUFDM0MsVUFBSSxLQUFLO0FBQ0wsZUFBTyxRQUFRLElBQUksR0FBRztBQUFBLE1BQzFCO0FBQUEsSUFDSixDQUFDO0FBQUEsRUFDTDtBQUFBLEVBRUEsV0FBVyxVQUFVLFFBQVE7QUFDekIsUUFBSSxXQUFXLEtBQUssWUFBWSxNQUFNLGdCQUFnQixZQUFZO0FBQ2xFLElBQUFBLElBQUcsY0FBYyxVQUFVLE9BQU8sS0FBSyxNQUFNLEdBQUcsU0FBUyxLQUFLO0FBQzFELFVBQUksS0FBSztBQUNMLGVBQU8sUUFBUSxJQUFJLEdBQUc7QUFBQSxNQUMxQjtBQUFBLElBQ0osQ0FBQztBQUNELFlBQVEsSUFBSSxRQUFRO0FBQ3BCLFdBQU87QUFBQSxFQUNYO0FBQUEsRUFFQSxXQUFXLFFBQVEsUUFBUTtBQUN2QixRQUFJO0FBQ0EsY0FBUSxJQUFJLGFBQWEsU0FBUyxXQUFXLE1BQU07QUFDbkQsVUFBSSxPQUFPLE1BQU0sR0FBRyxFQUFFLFVBQVUsR0FBRztBQUMvQixrQkFBVTtBQUFBLE1BQ2Q7QUFDQSxNQUFBQSxJQUFHLE9BQU8sUUFBUSxRQUFRLFNBQVMsR0FBRztBQUNsQyxnQkFBUSxJQUFJLENBQUM7QUFBQSxNQUNqQixDQUFDO0FBQUEsSUFDTCxTQUFTLEdBQVA7QUFDRSxjQUFRLElBQUksQ0FBQztBQUFBLElBQ2pCO0FBQUEsRUFDSjtBQUNKO0FBRUEsSUFBTyxxQkFBUTs7O0FGOUZmLElBQU0sV0FBVyxRQUFRLFlBQVksVUFBQUUsUUFBRyxTQUFTO0FBRWpELElBQUk7QUFFSixJQUFNLGFBQWEsSUFBSSxtQkFBVyxtQkFBRztBQUVyQyxTQUFTLGVBQWU7QUFJcEIsZUFBYSxJQUFJLDhCQUFjO0FBQUEsSUFDM0IsTUFBTSxZQUFBQyxRQUFLLFFBQVEsV0FBVyxnQkFBZ0I7QUFBQSxJQUM5QyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixnQkFBZ0I7QUFBQSxJQUNoQixnQkFBZ0I7QUFBQSxNQUNaLGtCQUFrQjtBQUFBLE1BRWxCLFNBQVMsWUFBQUEsUUFBSyxRQUFRLFdBQVcsZ0VBQW1DO0FBQUEsSUFDeEU7QUFBQSxFQUNKLENBQUM7QUFFRCxhQUFXLFFBQVEsdUJBQW1CO0FBRXRDLE1BQUksTUFBdUI7QUFFdkIsZUFBVyxZQUFZLGFBQWE7QUFBQSxFQUN4QyxPQUFPO0FBRUgsZUFBVyxZQUFZLEdBQUcsbUJBQW1CLE1BQU07QUFDL0MsaUJBQVcsWUFBWSxjQUFjO0FBQUEsSUFDekMsQ0FBQztBQUFBLEVBQ0w7QUFFQSxhQUFXLEdBQUcsVUFBVSxNQUFNO0FBQzFCLGlCQUFhO0FBQUEsRUFDakIsQ0FBQztBQUNMO0FBRUEsb0JBQUksVUFBVSxFQUFFLEtBQUssWUFBWTtBQUVqQyxvQkFBSSxHQUFHLHFCQUFxQixNQUFNO0FBQzlCLE1BQUksYUFBYSxVQUFVO0FBQ3ZCLHdCQUFJLEtBQUs7QUFBQSxFQUNiO0FBQ0osQ0FBQztBQUVELG9CQUFJLEdBQUcsWUFBWSxNQUFNO0FBQ3JCLE1BQUksZUFBZSxNQUFNO0FBQ3JCLGlCQUFhO0FBQUEsRUFDakI7QUFDSixDQUFDO0FBRUQsd0JBQVEsT0FBTyxvQkFBb0IsT0FBTSxHQUFHLFNBQVM7QUFDakQsU0FBTyxNQUFNLFdBQVcsU0FBUyxNQUFNLGtCQUFVLG1CQUFtQixLQUFLLEdBQUcsQ0FBQztBQUNqRixDQUFDO0FBQ0Qsd0JBQVEsT0FBTyxvQkFBb0IsT0FBTSxHQUFHLFNBQVM7QUFDakQsU0FBTyxNQUFNLFdBQVcsU0FBUyxNQUFNLGtCQUFVLGlCQUFpQixLQUFLLEdBQUcsQ0FBQztBQUMvRSxDQUFDO0FBQ0Qsd0JBQVEsT0FBTyxtQkFBbUIsT0FBTSxHQUFHLFNBQVM7QUFDaEQsU0FBTyxNQUFNLFdBQVcsU0FBUyxNQUFNLGtCQUFVLGdCQUFnQixLQUFLLEdBQUcsQ0FBQztBQUM5RSxDQUFDO0FBQ0Qsd0JBQVEsT0FBTyxlQUFlLE9BQU0sR0FBRyxTQUFTO0FBQzVDLFNBQU8sTUFBTSxrQkFBVSxXQUFXLEtBQUssR0FBRztBQUM5QyxDQUFDO0FBQ0Qsd0JBQVEsT0FBTyxpQkFBaUIsT0FBTSxHQUFHLFNBQVM7QUFDOUMsU0FBTyxNQUFNLGtCQUFVLGtCQUFrQixLQUFLLEdBQUc7QUFDckQsQ0FBQztBQUNELHdCQUFRLE9BQU8sYUFBYSxPQUFNLEdBQUcsU0FBUztBQUMxQyxTQUFPLE1BQU0sV0FBVyxTQUFTLEtBQUssSUFBSTtBQUM5QyxDQUFDO0FBQ0Qsd0JBQVEsR0FBRyxjQUFjLENBQUMsR0FBRyxTQUFTO0FBQ2xDLGFBQVcsV0FBVyxLQUFLLFNBQVMsS0FBSyxPQUFPO0FBQ3BELENBQUM7QUFDRCx3QkFBUSxHQUFHLGNBQWMsQ0FBQyxHQUFHLFNBQVM7QUFDbEMsYUFBVyxVQUFVLEtBQUssTUFBTSxLQUFLLElBQUk7QUFDN0MsQ0FBQztBQUNELHdCQUFRLE9BQU8sY0FBYyxDQUFDLEdBQUcsU0FBUztBQUN0QyxTQUFPLFdBQVcsV0FBVyxLQUFLLE1BQU0sS0FBSyxNQUFNO0FBQ3ZELENBQUM7IiwKICAibmFtZXMiOiBbImZzIiwgImFwcCIsICJvcyIsICJwYXRoIl0KfQo=
