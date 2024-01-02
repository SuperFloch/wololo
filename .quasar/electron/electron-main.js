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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjLWVsZWN0cm9uL2VsZWN0cm9uLW1haW4uanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ltYWdlVG9vbC5qcyIsICIuLi8uLi9zcmMtZWxlY3Ryb24vc2VydmljZXMvZm9sZGVyVG9vbC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93LCBuYXRpdmVUaGVtZSwgaXBjTWFpbiB9IGZyb20gJ2VsZWN0cm9uJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgb3MgZnJvbSAnb3MnXHJcbmltcG9ydCBGb2xkZXJUb29sIGZyb20gJy4vc2VydmljZXMvZm9sZGVyVG9vbCc7XHJcbmltcG9ydCBJbWFnZVRvb2wgZnJvbSAnLi9zZXJ2aWNlcy9pbWFnZVRvb2wnO1xyXG5cclxuLy8gbmVlZGVkIGluIGNhc2UgcHJvY2VzcyBpcyB1bmRlZmluZWQgdW5kZXIgTGludXhcclxuY29uc3QgcGxhdGZvcm0gPSBwcm9jZXNzLnBsYXRmb3JtIHx8IG9zLnBsYXRmb3JtKClcclxuXHJcbmxldCBtYWluV2luZG93XHJcblxyXG5jb25zdCBmb2xkZXJUb29sID0gbmV3IEZvbGRlclRvb2woYXBwKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpbmRvdygpIHtcclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbCB3aW5kb3cgb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBtYWluV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xyXG4gICAgICAgIGljb246IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdpY29ucy9pY29uLnBuZycpLCAvLyB0cmF5IGljb25cclxuICAgICAgICB3aWR0aDogMTAwMCxcclxuICAgICAgICBoZWlnaHQ6IDYwMCxcclxuICAgICAgICB1c2VDb250ZW50U2l6ZTogdHJ1ZSxcclxuICAgICAgICB3ZWJQcmVmZXJlbmNlczoge1xyXG4gICAgICAgICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICAvLyBNb3JlIGluZm86IGh0dHBzOi8vdjIucXVhc2FyLmRldi9xdWFzYXItY2xpLXZpdGUvZGV2ZWxvcGluZy1lbGVjdHJvbi1hcHBzL2VsZWN0cm9uLXByZWxvYWQtc2NyaXB0XHJcbiAgICAgICAgICAgIHByZWxvYWQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIHByb2Nlc3MuZW52LlFVQVNBUl9FTEVDVFJPTl9QUkVMT0FEKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgbWFpbldpbmRvdy5sb2FkVVJMKHByb2Nlc3MuZW52LkFQUF9VUkwpXHJcblxyXG4gICAgaWYgKHByb2Nlc3MuZW52LkRFQlVHR0lORykge1xyXG4gICAgICAgIC8vIGlmIG9uIERFViBvciBQcm9kdWN0aW9uIHdpdGggZGVidWcgZW5hYmxlZFxyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gd2UncmUgb24gcHJvZHVjdGlvbjsgbm8gYWNjZXNzIHRvIGRldnRvb2xzIHBsc1xyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub24oJ2RldnRvb2xzLW9wZW5lZCcsICgpID0+IHtcclxuICAgICAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5jbG9zZURldlRvb2xzKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIG1haW5XaW5kb3cub24oJ2Nsb3NlZCcsICgpID0+IHtcclxuICAgICAgICBtYWluV2luZG93ID0gbnVsbFxyXG4gICAgfSlcclxufVxyXG5cclxuYXBwLndoZW5SZWFkeSgpLnRoZW4oY3JlYXRlV2luZG93KVxyXG5cclxuYXBwLm9uKCd3aW5kb3ctYWxsLWNsb3NlZCcsICgpID0+IHtcclxuICAgIGlmIChwbGF0Zm9ybSAhPT0gJ2RhcndpbicpIHtcclxuICAgICAgICBhcHAucXVpdCgpXHJcbiAgICB9XHJcbn0pXHJcblxyXG5hcHAub24oJ2FjdGl2YXRlJywgKCkgPT4ge1xyXG4gICAgaWYgKG1haW5XaW5kb3cgPT09IG51bGwpIHtcclxuICAgICAgICBjcmVhdGVXaW5kb3coKVxyXG4gICAgfVxyXG59KVxyXG5cclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OndlYnAnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShhd2FpdCBJbWFnZVRvb2wuY29udmVydEltYWdlVG9XZWJwKGRhdGEuaW1nKSlcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OndlYm0nLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShhd2FpdCBJbWFnZVRvb2wuY29udmVydEdpZlRvV2VibShkYXRhLmltZykpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6Y29udmVydDppY28nLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShhd2FpdCBJbWFnZVRvb2wuY29udmVydFBuZ1RvSWNvKGRhdGEuaW1nKSlcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ3dlYm06cmVzaXplJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IEltYWdlVG9vbC5yZXNpemVXZWJtKGRhdGEuaW1nKVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOmdldEZyYW1lcycsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCBJbWFnZVRvb2wuY29udmVydFdlYnBUb1dlYm0oZGF0YS5pbWcpO1xyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnZmlsZTpyZWFkJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZGF0YS5wYXRoKTtcclxufSlcclxuaXBjTWFpbi5vbignaW1nOnJlbmFtZScsIChlLCBkYXRhKSA9PiB7XHJcbiAgICBmb2xkZXJUb29sLnJlbmFtZUZpbGUoZGF0YS5vbGRQYXRoLCBkYXRhLm5ld1BhdGgpXHJcbn0pXHJcbmlwY01haW4ub24oJ2ZpbGU6d3JpdGUnLCAoZSwgZGF0YSkgPT4ge1xyXG4gICAgZm9sZGVyVG9vbC53cml0ZUZpbGUoZGF0YS5wYXRoLCBkYXRhLnRleHQpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6dXBsb2FkJywgKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBmb2xkZXJUb29sLnVwbG9hZEZpbGUoZGF0YS5wYXRoLCBkYXRhLmJ1ZmZlcik7XHJcbn0pIiwgIi8vIEdpZiB0byBXRUJNIGxpYnJhcnlcclxuY29uc3QgV2VicEltYWdlID0gcmVxdWlyZSgnbm9kZS13ZWJwbXV4JykuSW1hZ2U7XHJcblxyXG5jb25zdCBwbmdUb0ljbyA9IHJlcXVpcmUoJ3BuZy10by1pY28nKTtcclxuXHJcbmNvbnN0IGNoaWxkID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcclxuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKVxyXG5cclxuY29uc3QgdGVybWluYXRlV2l0aEVycm9yID0gKGVycm9yID0gJ1tmYXRhbF0gZXJyb3InKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgICAgICAvL3Byb2Nlc3MuZXhpdCgxKVxyXG59XHJcblxyXG5jb25zdCBleGVjID0gdXRpbC5wcm9taXNpZnkoY2hpbGQuZXhlYylcclxuXHJcbmNvbnN0IHdlYnAgPSByZXF1aXJlKCd3ZWJwLWNvbnZlcnRlcicpO1xyXG4vL3dlYnAuZ3JhbnRfcGVybWlzc2lvbigpOyAgLy8gTWFyY2hlIHB0ZXQgcGFzIHN1ciBsZSBQQyBkdSBib3Vsb3RcclxuXHJcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKVxyXG5cclxuY2xhc3MgSW1hZ2VUb29sIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydEltYWdlVG9XZWJwKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzVXJsID0gaW1hZ2VQYXRoLnNwbGl0KFwiLlwiKVswXSArIFwiLndlYnBcIjtcclxuICAgICAgICAgICAgICAgIHJlc1VybCA9IHJlc1VybC5zcGxpdCgnL2lucHV0LycpLmpvaW4oJy9vdXRwdXQvJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB3ZWJwLmN3ZWJwKGltYWdlUGF0aCwgcmVzVXJsLCBcIi1xIDgwXCIsIFwiLXZcIik7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmtTeW5jKGltYWdlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNVcmwpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydFdlYnBUb1dlYm0oaW1hZ2VQYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udmVydFdlYnBUb1dlYm1OZXcoaW1hZ2VQYXRoKTtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB3ZWJQSW1hZ2UgPSBhd2FpdCBuZXcgV2VicEltYWdlKCk7XHJcbiAgICAgICAgICAgIGF3YWl0IHdlYlBJbWFnZS5sb2FkKGltYWdlUGF0aCk7XHJcbiAgICAgICAgICAgIGlmICh3ZWJQSW1hZ2UuaGFzQW5pbSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh3ZWJQSW1hZ2UuZnJhbWVzICE9PSB1bmRlZmluZWQgJiYgd2ViUEltYWdlLmZyYW1lcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZnJhbWVzID0gWy4uLndlYlBJbWFnZS5mcmFtZXNdO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZnJhbWVzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIHJlc2l6ZVdlYm0oaW1hZ2VQYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgdmFyIGZmbXBlZyA9IHJlcXVpcmUoXCJmbHVlbnQtZmZtcGVnXCIpKClcclxuICAgICAgICAgICAgICAgIC5zZXRGZnByb2JlUGF0aCgnLi9yZXNvdXJjZXMvZmZtcGVnL2ZmcHJvYmUuZXhlJylcclxuICAgICAgICAgICAgICAgIC5zZXRGZm1wZWdQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZtcGVnLmV4ZScpO1xyXG5cclxuICAgICAgICAgICAgZmZtcGVnXHJcbiAgICAgICAgICAgICAgICAuaW5wdXQoaW1hZ2VQYXRoKVxyXG4gICAgICAgICAgICAgICAgLm5vQXVkaW8oKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dE9wdGlvbnMoJy1waXhfZm10IHl1djQyMHAnKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dChpbWFnZVBhdGguc3BsaXQoJy4nKVswXSArIFwiMS53ZWJtXCIpXHJcbiAgICAgICAgICAgICAgICAuc2l6ZSgnNzIweD8nKVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZW5kXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJHZW5lcmF0ZWQgIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmtTeW5jKGltYWdlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmZtcGVnLmtpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGltYWdlUGF0aC5zcGxpdCgnLicpWzBdICsgXCIxLndlYm1cIik7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZXJyb3JcIiwgKGUpID0+IGNvbnNvbGUubG9nKGUpKS5ydW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydEdpZlRvV2VibShpbWFnZVBhdGgpIHtcclxuICAgICAgICB2YXIgcmVzVXJsID0gaW1hZ2VQYXRoLnNwbGl0KCcvaW5wdXQvJykuam9pbignL291dHB1dC8nKS5zcGxpdCgnLicpWzBdICsgJy53ZWJtJztcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZwcm9iZS5leGUnKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZm1wZWcuZXhlJyk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dChpbWFnZVBhdGgpXHJcbiAgICAgICAgICAgICAgICAubm9BdWRpbygpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0T3B0aW9ucygnLXBpeF9mbXQgeXV2NDIwcCcpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KHJlc1VybClcclxuICAgICAgICAgICAgICAgIC5zaXplKCc3MjB4PycpXHJcbiAgICAgICAgICAgICAgICAub24oXCJlbmRcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdlbmVyYXRlZCAhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICBmZm1wZWcua2lsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzVXJsKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlcnJvclwiLCAoZSkgPT4gY29uc29sZS5sb2coZSkpLnJ1bigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjb252ZXJ0V2VicFRvV2VibU5ldyhmaWxlbmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lV2l0aG91dEV4dCA9IGZpbGVuYW1lLnJlcGxhY2UoJy53ZWJwJywgJycpXHJcbiAgICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnZnJhbWVzJylcclxuICAgICAgICAgICAgY29uc3QgZGVsZXRlT3JpZ2luYWwgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZnJhbWVzKSkgZnMucm1kaXJTeW5jKGZyYW1lcywgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuICAgICAgICAgICAgZnMubWtkaXJTeW5jKGZyYW1lcylcclxuXHJcbiAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIoJ2ZyYW1lcycpXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBwcm9jZXNzLmN3ZCgpKVxyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIGBhbmltX2R1bXAgLi4vJHtmaWxlbmFtZX1gKVxyXG4gICAgICAgICAgICBleGVjKGBhbmltX2R1bXAgLi4vJHtmaWxlbmFtZX1gKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIoJy4uJylcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgcHJvY2Vzcy5jd2QoKSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IGB3ZWJwbXV4IC1pbmZvIC4vJHtmaWxlbmFtZX1gXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleGVjKGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKHsgc3Rkb3V0LCBzdGRlcnIgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGRlcnIpIHJldHVybiBQcm9taXNlLnJlamVjdChzdGRlcnIpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQW5pbWF0aW9uID0gc3Rkb3V0Lm1hdGNoKC9GZWF0dXJlcyBwcmVzZW50OiBhbmltYXRpb24vKSAhPT0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNBbmltYXRpb24pIHJldHVybiBQcm9taXNlLnJlamVjdCgnVGhpcyBpcyBub3QgYW4gYW5pbWF0ZWQgd2VicCBmaWxlJylcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlyc3RMaW5lID0gc3Rkb3V0Lm1hdGNoKC8xOi4rW1xccl0/XFxuL2cpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdExpbmUpIHJldHVyblxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcmFtZUxlbmd0aCA9IGZpcnN0TGluZVswXS5zcGxpdCgvXFxzKy9nKVs2XVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lcmF0ZSA9IE1hdGgucm91bmQoMTAwMCAvIGZyYW1lTGVuZ3RoKSAvLyBmcmFtZXMvc2Vjb25kXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IHBhdGgucmVzb2x2ZShmcmFtZXMsICdkdW1wXyUwNGQucG5nJylcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYW5kID0gYGZmbXBlZyAtZnJhbWVyYXRlICR7ZnJhbWVyYXRlfSAtaSBcIiR7ZHVtcH1cIiBcIiR7bmFtZVdpdGhvdXRFeHR9LndlYm1cIiAteWBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWMoY29tbWFuZClcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAudGhlbigoeyBzdGRvdXQsIHN0ZGVyciB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKC9lcnJvci9nbS50ZXN0KHN0ZGVycikpIHJldHVybiBQcm9taXNlLnJlamVjdChzdGRlcnIpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsZWFudXBcclxuICAgICAgICAgICAgICAgICAgICBmcy5ybWRpclN5bmMoZnJhbWVzLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWxldGVPcmlnaW5hbCkgZnMucm1TeW5jKHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBmaWxlbmFtZSkpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXSBTdWNjZXNzIVxcbicpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVybWluYXRlV2l0aEVycm9yKGBbZmF0YWxdICR7ZXJyfWApXHJcbiAgICAgICAgICAgICAgICAgICAgZnMucm1kaXJTeW5jKGZyYW1lcywgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGNvbnZlcnRQbmdUb0ljbyhmaWxlTmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgbmV3TmFtZSA9IGZpbGVOYW1lLnNwbGl0KCcvaW5wdXQvJykuam9pbignL291dHB1dC8nKS5zcGxpdCgnLicpWzBdICsgJy5pY28nO1xyXG4gICAgICAgICAgICBwbmdUb0ljbyhmaWxlTmFtZSlcclxuICAgICAgICAgICAgICAgIC50aGVuKGJ1ZiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhuZXdOYW1lLCBidWYpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobmV3TmFtZSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5leHBvcnQgZGVmYXVsdCBJbWFnZVRvb2w7IiwgImNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKVxyXG5jb25zdCB7IHJlYWRkaXIgfSA9IHJlcXVpcmUoJ2ZzJykucHJvbWlzZXM7XHJcbmNvbnN0IFdPUktTUEFDRV9ESVIgPSAnd29sb2xvJztcclxuXHJcbmltcG9ydCBJbWFnZVRvb2wgZnJvbSAnLi9pbWFnZVRvb2wnO1xyXG5cclxuY2xhc3MgRm9sZGVyVG9vbCB7XHJcbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcclxuICAgICAgICB0aGlzLkJBU0VfUEFUSCA9IGFwcC5nZXRQYXRoKCd1c2VyRGF0YScpO1xyXG5cclxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmModGhpcy5CQVNFX1BBVEggKyAnLycgKyBXT1JLU1BBQ0VfRElSKSkge1xyXG4gICAgICAgICAgICBmcy5ta2RpclN5bmModGhpcy5CQVNFX1BBVEggKyAnLycgKyBXT1JLU1BBQ0VfRElSKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jcmVhdGVGb2xkZXIoXCJpbnB1dFwiKTtcclxuICAgICAgICB0aGlzLmNyZWF0ZUZvbGRlcihcIm91dHB1dFwiKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlRm9sZGVyKGZvbGRlck5hbWUpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5CQVNFX1BBVEggKyAnLycgKyBXT1JLU1BBQ0VfRElSICsgXCIvXCIgKyBmb2xkZXJOYW1lO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyh1cmwpKSB7XHJcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmModXJsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0gR0VORVJBTCBUT09MU1xyXG5cclxuICAgIGFzeW5jIHJlYWRGb2xkZXIoZGlyTmFtZSkge1xyXG4gICAgICAgIGxldCBmaWxlcyA9IFtdO1xyXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgcmVhZGRpcihkaXJOYW1lLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5pc0RpcmVjdG9yeSgpKSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlcy5wdXNoKGAke2Rpck5hbWV9LyR7aXRlbS5uYW1lfWApO1xyXG4gICAgICAgICAgICAgICAgZmlsZXMgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgLi4uZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgLi4uKGF3YWl0IHRoaXMucmVhZEZvbGRlcihgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gKSksXHJcbiAgICAgICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKGZpbGVzKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWFkRmlsZShmaWxlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJldCA9IEJ1ZmZlci5mcm9tKGRhdGEpLnRvU3RyaW5nKCdiYXNlNjQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoXCJlcnJvclwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShcImVycm9yXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgd3JpdGVGaWxlKGZpbGVQYXRoLCB0ZXh0KSB7XHJcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgdGV4dCwgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBsb2FkRmlsZShmaWxlUGF0aCwgYnVmZmVyKSB7XHJcbiAgICAgICAgdmFyIHNhdmVQYXRoID0gdGhpcy5CQVNFX1BBVEggKyAnLycgKyBXT1JLU1BBQ0VfRElSICsgJy9pbnB1dC8nICsgZmlsZVBhdGg7XHJcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhzYXZlUGF0aCwgQnVmZmVyLmZyb20oYnVmZmVyKSwgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coc2F2ZVBhdGgpXHJcbiAgICAgICAgcmV0dXJuIHNhdmVQYXRoO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmFtZUZpbGUob2xkdXJsLCBuZXd1cmwpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVuYW1lZCAnICsgb2xkdXJsICsgJyBpbnRvICcgKyBuZXd1cmwpO1xyXG4gICAgICAgICAgICBpZiAobmV3dXJsLnNwbGl0KFwiLlwiKS5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgbmV3dXJsICs9IFwiLndlYnBcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmcy5yZW5hbWUob2xkdXJsLCBuZXd1cmwsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEZvbGRlclRvb2w7Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzQkFBeUQ7QUFDekQsa0JBQWlCO0FBQ2pCLGdCQUFlOzs7QUNEZixJQUFNLFlBQVksUUFBUSxnQkFBZ0I7QUFFMUMsSUFBTSxXQUFXLFFBQVE7QUFFekIsSUFBTSxRQUFRLFFBQVE7QUFDdEIsSUFBTSxPQUFPLFFBQVE7QUFDckIsSUFBTSxPQUFPLFFBQVE7QUFFckIsSUFBTSxxQkFBcUIsQ0FBQyxRQUFRLG9CQUFvQjtBQUNwRCxVQUFRLElBQUksS0FBSztBQUVyQjtBQUVBLElBQU0sT0FBTyxLQUFLLFVBQVUsTUFBTSxJQUFJO0FBRXRDLElBQU0sT0FBTyxRQUFRO0FBR3JCLElBQU0sS0FBSyxRQUFRO0FBRW5CLElBQU0sWUFBTixNQUFnQjtBQUFBLEVBQ1osY0FBYztBQUFBLEVBRWQ7QUFBQSxFQUVBLGFBQWEsbUJBQW1CLFdBQVc7QUFDdkMsV0FBTyxJQUFJLFFBQVEsT0FBTSxZQUFZO0FBQ2pDLFVBQUk7QUFDQSxZQUFJLFNBQVMsVUFBVSxNQUFNLEdBQUcsRUFBRSxLQUFLO0FBQ3ZDLGlCQUFTLE9BQU8sTUFBTSxTQUFTLEVBQUUsS0FBSyxVQUFVO0FBQ2hELGNBQU0sU0FBUyxLQUFLLE1BQU0sV0FBVyxRQUFRLFNBQVMsSUFBSTtBQUMxRCxlQUFPLEtBQUssQ0FBQyxhQUFhO0FBQ3RCLGFBQUcsV0FBVyxTQUFTO0FBQ3ZCLGtCQUFRLE1BQU07QUFDZCxr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
