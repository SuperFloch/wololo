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
var fs = require("fs");
var ImageTool = class {
  constructor() {
  }
  static async convertImageToWebp(imagePath) {
    return new Promise(async (resolve, error) => {
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
        error(e);
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
    return new Promise(async (resolve, error) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath("./resources/ffmpeg/ffprobe.exe").setFfmpegPath("./resources/ffmpeg/ffmpeg.exe");
      ffmpeg.input(imagePath).noAudio().outputOptions("-pix_fmt yuv420p").output(imagePath.split(".")[0] + "1.webm").size("720x?").on("end", (e) => {
        console.log("Generated !");
        fs.unlinkSync(imagePath);
        ffmpeg.kill();
        resolve(imagePath.split(".")[0] + "1.webm");
      }).on("error", (e) => error(e)).run();
    });
  }
  static async convertGifToWebm(imagePath) {
    var resUrl = imagePath.split("/input/").join("/output/").split(".")[0] + ".webm";
    return new Promise(async (resolve, error) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath("./resources/ffmpeg/ffprobe.exe").setFfmpegPath("./resources/ffmpeg/ffmpeg.exe");
      ffmpeg.input(imagePath).noAudio().outputOptions("-pix_fmt yuv420p").output(resUrl).size("720x?").on("end", (e) => {
        console.log("Generated !");
        fs.unlinkSync(imagePath);
        ffmpeg.kill();
        resolve(resUrl);
      }).on("error", (e) => error(e)).run();
    });
  }
  static async convertWebpToWebmNew(filename) {
    return new Promise((resolve, error) => {
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
        error(err);
        terminateWithError(`[fatal] ${err}`);
        fs.rmdirSync(frames, { recursive: true });
      });
    });
  }
  static convertPngToIco(fileName) {
    return new Promise((resolve, error) => {
      var newName = fileName.split("/input/").join("/output/").split(".")[0] + ".ico";
      pngToIco(fileName).then((buf) => {
        fs.writeFileSync(newName, buf);
        resolve(newName);
      }).catch((err) => {
        error(err);
      });
    });
  }
};
var imageTool_default = ImageTool;

// src-electron/services/folderTool.js
var fs2 = require("fs");
var { readdir } = require("fs").promises;
var WORKSPACE_DIR = "wololo";
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
    return new Promise(async (resolve, error) => {
      try {
        fs2.readFile(filePath, function(err, data) {
          if (!err) {
            var ret = Buffer.from(data).toString("base64");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjLWVsZWN0cm9uL2VsZWN0cm9uLW1haW4uanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ltYWdlVG9vbC5qcyIsICIuLi8uLi9zcmMtZWxlY3Ryb24vc2VydmljZXMvZm9sZGVyVG9vbC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93LCBuYXRpdmVUaGVtZSwgaXBjTWFpbiB9IGZyb20gJ2VsZWN0cm9uJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgb3MgZnJvbSAnb3MnXHJcbmltcG9ydCBGb2xkZXJUb29sIGZyb20gJy4vc2VydmljZXMvZm9sZGVyVG9vbCc7XHJcbmltcG9ydCBJbWFnZVRvb2wgZnJvbSAnLi9zZXJ2aWNlcy9pbWFnZVRvb2wnO1xyXG5cclxuLy8gbmVlZGVkIGluIGNhc2UgcHJvY2VzcyBpcyB1bmRlZmluZWQgdW5kZXIgTGludXhcclxuY29uc3QgcGxhdGZvcm0gPSBwcm9jZXNzLnBsYXRmb3JtIHx8IG9zLnBsYXRmb3JtKClcclxuXHJcbmxldCBtYWluV2luZG93XHJcblxyXG5jb25zdCBmb2xkZXJUb29sID0gbmV3IEZvbGRlclRvb2woYXBwKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpbmRvdygpIHtcclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbCB3aW5kb3cgb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBtYWluV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xyXG4gICAgICAgIGljb246IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdpY29ucy9pY29uLnBuZycpLCAvLyB0cmF5IGljb25cclxuICAgICAgICB3aWR0aDogMTAwMCxcclxuICAgICAgICBoZWlnaHQ6IDYwMCxcclxuICAgICAgICB1c2VDb250ZW50U2l6ZTogdHJ1ZSxcclxuICAgICAgICB3ZWJQcmVmZXJlbmNlczoge1xyXG4gICAgICAgICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICAvLyBNb3JlIGluZm86IGh0dHBzOi8vdjIucXVhc2FyLmRldi9xdWFzYXItY2xpLXZpdGUvZGV2ZWxvcGluZy1lbGVjdHJvbi1hcHBzL2VsZWN0cm9uLXByZWxvYWQtc2NyaXB0XHJcbiAgICAgICAgICAgIHByZWxvYWQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIHByb2Nlc3MuZW52LlFVQVNBUl9FTEVDVFJPTl9QUkVMT0FEKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgbWFpbldpbmRvdy5sb2FkVVJMKHByb2Nlc3MuZW52LkFQUF9VUkwpXHJcblxyXG4gICAgaWYgKHByb2Nlc3MuZW52LkRFQlVHR0lORykge1xyXG4gICAgICAgIC8vIGlmIG9uIERFViBvciBQcm9kdWN0aW9uIHdpdGggZGVidWcgZW5hYmxlZFxyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gd2UncmUgb24gcHJvZHVjdGlvbjsgbm8gYWNjZXNzIHRvIGRldnRvb2xzIHBsc1xyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub24oJ2RldnRvb2xzLW9wZW5lZCcsICgpID0+IHtcclxuICAgICAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5jbG9zZURldlRvb2xzKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIG1haW5XaW5kb3cub24oJ2Nsb3NlZCcsICgpID0+IHtcclxuICAgICAgICBtYWluV2luZG93ID0gbnVsbFxyXG4gICAgfSlcclxufVxyXG5cclxuYXBwLndoZW5SZWFkeSgpLnRoZW4oY3JlYXRlV2luZG93KVxyXG5cclxuYXBwLm9uKCd3aW5kb3ctYWxsLWNsb3NlZCcsICgpID0+IHtcclxuICAgIGlmIChwbGF0Zm9ybSAhPT0gJ2RhcndpbicpIHtcclxuICAgICAgICBhcHAucXVpdCgpXHJcbiAgICB9XHJcbn0pXHJcblxyXG5hcHAub24oJ2FjdGl2YXRlJywgKCkgPT4ge1xyXG4gICAgaWYgKG1haW5XaW5kb3cgPT09IG51bGwpIHtcclxuICAgICAgICBjcmVhdGVXaW5kb3coKVxyXG4gICAgfVxyXG59KVxyXG5cclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OndlYnAnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShhd2FpdCBJbWFnZVRvb2wuY29udmVydEltYWdlVG9XZWJwKGRhdGEuaW1nKSlcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OndlYm0nLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShhd2FpdCBJbWFnZVRvb2wuY29udmVydEdpZlRvV2VibShkYXRhLmltZykpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6Y29udmVydDppY28nLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShhd2FpdCBJbWFnZVRvb2wuY29udmVydFBuZ1RvSWNvKGRhdGEuaW1nKSlcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ3dlYm06cmVzaXplJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IEltYWdlVG9vbC5yZXNpemVXZWJtKGRhdGEuaW1nKVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOmdldEZyYW1lcycsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCBJbWFnZVRvb2wuY29udmVydFdlYnBUb1dlYm0oZGF0YS5pbWcpO1xyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnZmlsZTpyZWFkJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZGF0YS5wYXRoKTtcclxufSlcclxuaXBjTWFpbi5vbignaW1nOnJlbmFtZScsIChlLCBkYXRhKSA9PiB7XHJcbiAgICBmb2xkZXJUb29sLnJlbmFtZUZpbGUoZGF0YS5vbGRQYXRoLCBkYXRhLm5ld1BhdGgpXHJcbn0pXHJcbmlwY01haW4ub24oJ2ZpbGU6d3JpdGUnLCAoZSwgZGF0YSkgPT4ge1xyXG4gICAgZm9sZGVyVG9vbC53cml0ZUZpbGUoZGF0YS5wYXRoLCBkYXRhLnRleHQpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6dXBsb2FkJywgKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBmb2xkZXJUb29sLnVwbG9hZEZpbGUoZGF0YS5wYXRoLCBkYXRhLmJ1ZmZlcik7XHJcbn0pIiwgIi8vIEdpZiB0byBXRUJNIGxpYnJhcnlcclxuY29uc3QgV2VicEltYWdlID0gcmVxdWlyZSgnbm9kZS13ZWJwbXV4JykuSW1hZ2U7XHJcblxyXG5jb25zdCBwbmdUb0ljbyA9IHJlcXVpcmUoJ3BuZy10by1pY28nKTtcclxuXHJcbmNvbnN0IGNoaWxkID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcclxuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKVxyXG5cclxuY29uc3QgdGVybWluYXRlV2l0aEVycm9yID0gKGVycm9yID0gJ1tmYXRhbF0gZXJyb3InKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgICAgICAvL3Byb2Nlc3MuZXhpdCgxKVxyXG59XHJcblxyXG5jb25zdCBleGVjID0gdXRpbC5wcm9taXNpZnkoY2hpbGQuZXhlYylcclxuXHJcbmNvbnN0IHdlYnAgPSByZXF1aXJlKCd3ZWJwLWNvbnZlcnRlcicpO1xyXG4vL3dlYnAuZ3JhbnRfcGVybWlzc2lvbigpOyAgLy8gTWFyY2hlIHB0ZXQgcGFzIHN1ciBsZSBQQyBkdSBib3Vsb3RcclxuXHJcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKVxyXG5cclxuY2xhc3MgSW1hZ2VUb29sIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydEltYWdlVG9XZWJwKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc1VybCA9IGltYWdlUGF0aC5zcGxpdChcIi5cIilbMF0gKyBcIi53ZWJwXCI7XHJcbiAgICAgICAgICAgICAgICByZXNVcmwgPSByZXNVcmwuc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gd2VicC5jd2VicChpbWFnZVBhdGgsIHJlc1VybCwgXCItcSA4MFwiLCBcIi12XCIpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzVXJsKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGVycm9yKGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRXZWJwVG9XZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRXZWJwVG9XZWJtTmV3KGltYWdlUGF0aCk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgd2ViUEltYWdlID0gYXdhaXQgbmV3IFdlYnBJbWFnZSgpO1xyXG4gICAgICAgICAgICBhd2FpdCB3ZWJQSW1hZ2UubG9hZChpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICBpZiAod2ViUEltYWdlLmhhc0FuaW0pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAod2ViUEltYWdlLmZyYW1lcyAhPT0gdW5kZWZpbmVkICYmIHdlYlBJbWFnZS5mcmFtZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IFsuLi53ZWJQSW1hZ2UuZnJhbWVzXTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZyYW1lcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyByZXNpemVXZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZwcm9iZS5leGUnKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZm1wZWcuZXhlJyk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dChpbWFnZVBhdGgpXHJcbiAgICAgICAgICAgICAgICAubm9BdWRpbygpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0T3B0aW9ucygnLXBpeF9mbXQgeXV2NDIwcCcpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KGltYWdlUGF0aC5zcGxpdCgnLicpWzBdICsgXCIxLndlYm1cIilcclxuICAgICAgICAgICAgICAgIC5zaXplKCc3MjB4PycpXHJcbiAgICAgICAgICAgICAgICAub24oXCJlbmRcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdlbmVyYXRlZCAhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICBmZm1wZWcua2lsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaW1hZ2VQYXRoLnNwbGl0KCcuJylbMF0gKyBcIjEud2VibVwiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlcnJvclwiLCAoZSkgPT4gZXJyb3IoZSkpLnJ1bigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjb252ZXJ0R2lmVG9XZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHZhciByZXNVcmwgPSBpbWFnZVBhdGguc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpLnNwbGl0KCcuJylbMF0gKyAnLndlYm0nO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZwcm9iZS5leGUnKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZm1wZWcuZXhlJyk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dChpbWFnZVBhdGgpXHJcbiAgICAgICAgICAgICAgICAubm9BdWRpbygpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0T3B0aW9ucygnLXBpeF9mbXQgeXV2NDIwcCcpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KHJlc1VybClcclxuICAgICAgICAgICAgICAgIC5zaXplKCc3MjB4PycpXHJcbiAgICAgICAgICAgICAgICAub24oXCJlbmRcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdlbmVyYXRlZCAhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICBmZm1wZWcua2lsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzVXJsKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlcnJvclwiLCAoZSkgPT4gZXJyb3IoZSkpLnJ1bigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjb252ZXJ0V2VicFRvV2VibU5ldyhmaWxlbmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZVdpdGhvdXRFeHQgPSBmaWxlbmFtZS5yZXBsYWNlKCcud2VicCcsICcnKVxyXG4gICAgICAgICAgICBjb25zdCBmcmFtZXMgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJ2ZyYW1lcycpXHJcbiAgICAgICAgICAgIGNvbnN0IGRlbGV0ZU9yaWdpbmFsID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZyYW1lcykpIGZzLnJtZGlyU3luYyhmcmFtZXMsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhmcmFtZXMpXHJcblxyXG4gICAgICAgICAgICBwcm9jZXNzLmNoZGlyKCdmcmFtZXMnKVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgcHJvY2Vzcy5jd2QoKSlcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBgYW5pbV9kdW1wIC4uLyR7ZmlsZW5hbWV9YClcclxuICAgICAgICAgICAgZXhlYyhgYW5pbV9kdW1wIC4uLyR7ZmlsZW5hbWV9YClcclxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmNoZGlyKCcuLicpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIHByb2Nlc3MuY3dkKCkpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSBgd2VicG11eCAtaW5mbyAuLyR7ZmlsZW5hbWV9YFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgY29tbWFuZClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhlYyhjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC50aGVuKCh7IHN0ZG91dCwgc3RkZXJyIH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RkZXJyKSByZXR1cm4gUHJvbWlzZS5yZWplY3Qoc3RkZXJyKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0FuaW1hdGlvbiA9IHN0ZG91dC5tYXRjaCgvRmVhdHVyZXMgcHJlc2VudDogYW5pbWF0aW9uLykgIT09IG51bGxcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzQW5pbWF0aW9uKSByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1RoaXMgaXMgbm90IGFuIGFuaW1hdGVkIHdlYnAgZmlsZScpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TGluZSA9IHN0ZG91dC5tYXRjaCgvMTouK1tcXHJdP1xcbi9nKVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlyc3RMaW5lKSByZXR1cm5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZnJhbWVMZW5ndGggPSBmaXJzdExpbmVbMF0uc3BsaXQoL1xccysvZylbNl1cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcmFtZXJhdGUgPSBNYXRoLnJvdW5kKDEwMDAgLyBmcmFtZUxlbmd0aCkgLy8gZnJhbWVzL3NlY29uZFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBwYXRoLnJlc29sdmUoZnJhbWVzLCAnZHVtcF8lMDRkLnBuZycpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IGBmZm1wZWcgLWZyYW1lcmF0ZSAke2ZyYW1lcmF0ZX0gLWkgXCIke2R1bXB9XCIgXCIke25hbWVXaXRob3V0RXh0fS53ZWJtXCIgLXlgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleGVjKGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKHsgc3Rkb3V0LCBzdGRlcnIgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgvZXJyb3IvZ20udGVzdChzdGRlcnIpKSByZXR1cm4gUHJvbWlzZS5yZWplY3Qoc3RkZXJyKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjbGVhbnVwXHJcbiAgICAgICAgICAgICAgICAgICAgZnMucm1kaXJTeW5jKGZyYW1lcywgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVsZXRlT3JpZ2luYWwpIGZzLnJtU3luYyhwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgZmlsZW5hbWUpKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10gU3VjY2VzcyFcXG4nKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yKGVycilcclxuICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hdGVXaXRoRXJyb3IoYFtmYXRhbF0gJHtlcnJ9YClcclxuICAgICAgICAgICAgICAgICAgICBmcy5ybWRpclN5bmMoZnJhbWVzLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgY29udmVydFBuZ1RvSWNvKGZpbGVOYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgbmV3TmFtZSA9IGZpbGVOYW1lLnNwbGl0KCcvaW5wdXQvJykuam9pbignL291dHB1dC8nKS5zcGxpdCgnLicpWzBdICsgJy5pY28nO1xyXG4gICAgICAgICAgICBwbmdUb0ljbyhmaWxlTmFtZSlcclxuICAgICAgICAgICAgICAgIC50aGVuKGJ1ZiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhuZXdOYW1lLCBidWYpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobmV3TmFtZSlcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IoZXJyKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydCBkZWZhdWx0IEltYWdlVG9vbDsiLCAiY29uc3QgZnMgPSByZXF1aXJlKCdmcycpXHJcbmNvbnN0IHsgcmVhZGRpciB9ID0gcmVxdWlyZSgnZnMnKS5wcm9taXNlcztcclxuY29uc3QgV09SS1NQQUNFX0RJUiA9ICd3b2xvbG8nO1xyXG5cclxuaW1wb3J0IEltYWdlVG9vbCBmcm9tICcuL2ltYWdlVG9vbCc7XHJcblxyXG5jbGFzcyBGb2xkZXJUb29sIHtcclxuICAgIGNvbnN0cnVjdG9yKGFwcCkge1xyXG4gICAgICAgIHRoaXMuQkFTRV9QQVRIID0gYXBwLmdldFBhdGgoJ3VzZXJEYXRhJyk7XHJcblxyXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyh0aGlzLkJBU0VfUEFUSCArICcvJyArIFdPUktTUEFDRV9ESVIpKSB7XHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLkJBU0VfUEFUSCArICcvJyArIFdPUktTUEFDRV9ESVIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNyZWF0ZUZvbGRlcihcImlucHV0XCIpO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRm9sZGVyKFwib3V0cHV0XCIpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVGb2xkZXIoZm9sZGVyTmFtZSkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLkJBU0VfUEFUSCArICcvJyArIFdPUktTUEFDRV9ESVIgKyBcIi9cIiArIGZvbGRlck5hbWU7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHVybCkpIHtcclxuICAgICAgICAgICAgICAgIGZzLm1rZGlyU3luYyh1cmwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLSBHRU5FUkFMIFRPT0xTXHJcblxyXG4gICAgYXN5bmMgcmVhZEZvbGRlcihkaXJOYW1lKSB7XHJcbiAgICAgICAgbGV0IGZpbGVzID0gW107XHJcbiAgICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCByZWFkZGlyKGRpck5hbWUsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtLmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goYCR7ZGlyTmFtZX0vJHtpdGVtLm5hbWV9YCk7XHJcbiAgICAgICAgICAgICAgICBmaWxlcyA9IFtcclxuICAgICAgICAgICAgICAgICAgICAuLi5maWxlcyxcclxuICAgICAgICAgICAgICAgICAgICAuLi4oYXdhaXQgdGhpcy5yZWFkRm9sZGVyKGAke2Rpck5hbWV9LyR7aXRlbS5uYW1lfWApKSxcclxuICAgICAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlcy5wdXNoKGAke2Rpck5hbWV9LyR7aXRlbS5uYW1lfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAoZmlsZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlYWRGaWxlKGZpbGVQYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUsIGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJldCA9IEJ1ZmZlci5mcm9tKGRhdGEpLnRvU3RyaW5nKCdiYXNlNjQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yKGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlRmlsZShmaWxlUGF0aCwgdGV4dCkge1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIHRleHQsIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHVwbG9hZEZpbGUoZmlsZVBhdGgsIGJ1ZmZlcikge1xyXG4gICAgICAgIHZhciBzYXZlUGF0aCA9IHRoaXMuQkFTRV9QQVRIICsgJy8nICsgV09SS1NQQUNFX0RJUiArICcvaW5wdXQvJyArIGZpbGVQYXRoO1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoc2F2ZVBhdGgsIEJ1ZmZlci5mcm9tKGJ1ZmZlciksIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNhdmVQYXRoKVxyXG4gICAgICAgIHJldHVybiBzYXZlUGF0aDtcclxuICAgIH1cclxuXHJcbiAgICByZW5hbWVGaWxlKG9sZHVybCwgbmV3dXJsKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlbmFtZWQgJyArIG9sZHVybCArICcgaW50byAnICsgbmV3dXJsKTtcclxuICAgICAgICAgICAgaWYgKG5ld3VybC5zcGxpdChcIi5cIikubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIG5ld3VybCArPSBcIi53ZWJwXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnMucmVuYW1lKG9sZHVybCwgbmV3dXJsLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBGb2xkZXJUb29sOyJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0JBQXlEO0FBQ3pELGtCQUFpQjtBQUNqQixnQkFBZTs7O0FDRGYsSUFBTSxZQUFZLFFBQVEsZ0JBQWdCO0FBRTFDLElBQU0sV0FBVyxRQUFRO0FBRXpCLElBQU0sUUFBUSxRQUFRO0FBQ3RCLElBQU0sT0FBTyxRQUFRO0FBQ3JCLElBQU0sT0FBTyxRQUFRO0FBRXJCLElBQU0scUJBQXFCLENBQUMsUUFBUSxvQkFBb0I7QUFDcEQsVUFBUSxJQUFJLEtBQUs7QUFFckI7QUFFQSxJQUFNLE9BQU8sS0FBSyxVQUFVLE1BQU0sSUFBSTtBQUV0QyxJQUFNLE9BQU8sUUFBUTtBQUdyQixJQUFNLEtBQUssUUFBUTtBQUVuQixJQUFNLFlBQU4sTUFBZ0I7QUFBQSxFQUNaLGNBQWM7QUFBQSxFQUVkO0FBQUEsRUFFQSxhQUFhLG1CQUFtQixXQUFXO0FBQ3ZDLFdBQU8sSUFBSSxRQUFRLE9BQU0sU0FBUyxVQUFVO0FBQ3hDLFVBQUk7QUFDQSxZQUFJLFNBQVMsVUFBVSxNQUFNLEdBQUcsRUFBRSxLQUFLO0FBQ3ZDLGlCQUFTLE9BQU8sTUFBTSxTQUFTLEVBQUUsS0FBSyxV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QUFhO0FBQUEsRUFDeEMsT0FBTztBQUVILGVBQVcsWUFBWSxHQUFHLG1CQUFtQixNQUFNO0FBQy9DLGlCQUFXLFlBQVksY0FBYztBQUFBLElBQ3pDLENBQUM7QUFBQSxFQUNMO0FBRUEsYUFBVyxHQUFHLFVBQVUsTUFBTTtBQUMxQixpQkFBYTtBQUFBLEVBQ2pCLENBQUM7QUFDTDtBQUVBLG9CQUFJLFVBQVUsRUFBRSxLQUFLLFlBQVk7QUFFakMsb0JBQUksR0FBRyxxQkFBcUIsTUFBTTtBQUM5QixNQUFJLGFBQWEsVUFBVTtBQUN2Qix3QkFBSSxLQUFLO0FBQUEsRUFDYjtBQUNKLENBQUM7QUFFRCxvQkFBSSxHQUFHLFlBQVksTUFBTTtBQUNyQixNQUFJLGVBQWUsTUFBTTtBQUNyQixpQkFBYTtBQUFBLEVBQ2pCO0FBQ0osQ0FBQztBQUVELHdCQUFRLE9BQU8sb0JBQW9CLE9BQU0sR0FBRyxTQUFTO0FBQ2pELFNBQU8sTUFBTSxXQUFXLFNBQVMsTUFBTSxrQkFBVSxtQkFBbUIsS0FBSyxHQUFHLENBQUM7QUFDakYsQ0FBQztBQUNELHdCQUFRLE9BQU8sb0JBQW9CLE9BQU0sR0FBRyxTQUFTO0FBQ2pELFNBQU8sTUFBTSxXQUFXLFNBQVMsTUFBTSxrQkFBVSxpQkFBaUIsS0FBSyxHQUFHLENBQUM7QUFDL0UsQ0FBQztBQUNELHdCQUFRLE9BQU8sbUJBQW1CLE9BQU0sR0FBRyxTQUFTO0FBQ2hELFNBQU8sTUFBTSxXQUFXLFNBQVMsTUFBTSxrQkFBVSxnQkFBZ0IsS0FBSyxHQUFHLENBQUM7QUFDOUUsQ0FBQztBQUNELHdCQUFRLE9BQU8sZUFBZSxPQUFNLEdBQUcsU0FBUztBQUM1QyxTQUFPLE1BQU0sa0JBQVUsV0FBVyxLQUFLLEdBQUc7QUFDOUMsQ0FBQztBQUNELHdCQUFRLE9BQU8saUJBQWlCLE9BQU0sR0FBRyxTQUFTO0FBQzlDLFNBQU8sTUFBTSxrQkFBVSxrQkFBa0IsS0FBSyxHQUFHO0FBQ3JELENBQUM7QUFDRCx3QkFBUSxPQUFPLGFBQWEsT0FBTSxHQUFHLFNBQVM7QUFDMUMsU0FBTyxNQUFNLFdBQVcsU0FBUyxLQUFLLElBQUk7QUFDOUMsQ0FBQztBQUNELHdCQUFRLEdBQUcsY0FBYyxDQUFDLEdBQUcsU0FBUztBQUNsQyxhQUFXLFdBQVcsS0FBSyxTQUFTLEtBQUssT0FBTztBQUNwRCxDQUFDO0FBQ0Qsd0JBQVEsR0FBRyxjQUFjLENBQUMsR0FBRyxTQUFTO0FBQ2xDLGFBQVcsVUFBVSxLQUFLLE1BQU0sS0FBSyxJQUFJO0FBQzdDLENBQUM7QUFDRCx3QkFBUSxPQUFPLGNBQWMsQ0FBQyxHQUFHLFNBQVM7QUFDdEMsU0FBTyxXQUFXLFdBQVcsS0FBSyxNQUFNLEtBQUssTUFBTTtBQUN2RCxDQUFDOyIsCiAgIm5hbWVzIjogWyJmcyIsICJhcHAiLCAib3MiLCAicGF0aCJdCn0K
