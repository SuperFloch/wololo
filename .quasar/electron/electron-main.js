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
var ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
var ffprobe = require("@ffprobe-installer/ffprobe");
var WebpImage = require("node-webpmux").Image;
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
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath(ffprobe.path).setFfmpegPath(ffmpegInstaller.path);
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
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath(ffprobe.path).setFfmpegPath(ffmpegInstaller.path);
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
};
var imageTool_default = ImageTool;

// src-electron/services/folderTool.js
var fs2 = require("fs");
var { readdir } = require("fs").promises;
var WORKSPACE_DIR = "workspace";
var FolderTool = class {
  constructor() {
    if (!fs2.existsSync(WORKSPACE_DIR)) {
      fs2.mkdirSync(WORKSPACE_DIR);
    }
    this.createFolder("input");
    this.createFolder("output");
  }
  createFolder(folderName) {
    var url = WORKSPACE_DIR + "/" + folderName;
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
    fs2.writeFileSync(filePath, text, function(err) {
      if (err) {
        return console.log(err);
      }
    });
  }
  uploadFile(filePath, buffer) {
    fs2.writeFileSync(filePath, Buffer.from(buffer), function(err) {
      if (err) {
        return console.log(err);
      }
    });
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
var folderTool = new folderTool_default();
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
  mainWindow.loadURL("http://localhost:9301");
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
import_electron.ipcMain.on("girl:infos:write", (e, data) => {
  folderTool.writeGirlInfoFile(data.name, data.girl);
});
import_electron.ipcMain.handle("folder:load", async (e, data) => {
  return await folderTool.readGirlFolder(data.name);
});
import_electron.ipcMain.handle("folder:create", async (e, data) => {
  return folderTool.createGirlFolder(data.name);
});
import_electron.ipcMain.handle("img:convert:webp", async (e, data) => {
  return await imageTool_default.convertImageToWebp(data.img);
});
import_electron.ipcMain.handle("img:convert:webm", async (e, data) => {
  return await imageTool_default.convertGifToWebm(data.img);
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
import_electron.ipcMain.on("img:upload", (e, data) => {
  folderTool.uploadFile(data.path, data.buffer);
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjLWVsZWN0cm9uL2VsZWN0cm9uLW1haW4uanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ltYWdlVG9vbC5qcyIsICIuLi8uLi9zcmMtZWxlY3Ryb24vc2VydmljZXMvZm9sZGVyVG9vbC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93LCBuYXRpdmVUaGVtZSwgaXBjTWFpbiB9IGZyb20gJ2VsZWN0cm9uJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgb3MgZnJvbSAnb3MnXHJcbmltcG9ydCBGb2xkZXJUb29sIGZyb20gJy4vc2VydmljZXMvZm9sZGVyVG9vbCc7XHJcbmltcG9ydCBJbWFnZVRvb2wgZnJvbSAnLi9zZXJ2aWNlcy9pbWFnZVRvb2wnO1xyXG5cclxuLy8gbmVlZGVkIGluIGNhc2UgcHJvY2VzcyBpcyB1bmRlZmluZWQgdW5kZXIgTGludXhcclxuY29uc3QgcGxhdGZvcm0gPSBwcm9jZXNzLnBsYXRmb3JtIHx8IG9zLnBsYXRmb3JtKClcclxuXHJcbmxldCBtYWluV2luZG93XHJcblxyXG5jb25zdCBmb2xkZXJUb29sID0gbmV3IEZvbGRlclRvb2woKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpbmRvdyAoKSB7XHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbCB3aW5kb3cgb3B0aW9uc1xyXG4gICAqL1xyXG4gIG1haW5XaW5kb3cgPSBuZXcgQnJvd3NlcldpbmRvdyh7XHJcbiAgICBpY29uOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnaWNvbnMvaWNvbi5wbmcnKSwgLy8gdHJheSBpY29uXHJcbiAgICB3aWR0aDogMTAwMCxcclxuICAgIGhlaWdodDogNjAwLFxyXG4gICAgdXNlQ29udGVudFNpemU6IHRydWUsXHJcbiAgICB3ZWJQcmVmZXJlbmNlczoge1xyXG4gICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxyXG4gICAgICAvLyBNb3JlIGluZm86IGh0dHBzOi8vdjIucXVhc2FyLmRldi9xdWFzYXItY2xpLXZpdGUvZGV2ZWxvcGluZy1lbGVjdHJvbi1hcHBzL2VsZWN0cm9uLXByZWxvYWQtc2NyaXB0XHJcbiAgICAgIHByZWxvYWQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIHByb2Nlc3MuZW52LlFVQVNBUl9FTEVDVFJPTl9QUkVMT0FEKVxyXG4gICAgfVxyXG4gIH0pXHJcblxyXG4gIG1haW5XaW5kb3cubG9hZFVSTChwcm9jZXNzLmVudi5BUFBfVVJMKVxyXG5cclxuICBpZiAocHJvY2Vzcy5lbnYuREVCVUdHSU5HKSB7XHJcbiAgICAvLyBpZiBvbiBERVYgb3IgUHJvZHVjdGlvbiB3aXRoIGRlYnVnIGVuYWJsZWRcclxuICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gd2UncmUgb24gcHJvZHVjdGlvbjsgbm8gYWNjZXNzIHRvIGRldnRvb2xzIHBsc1xyXG4gICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vbignZGV2dG9vbHMtb3BlbmVkJywgKCkgPT4ge1xyXG4gICAgICBtYWluV2luZG93LndlYkNvbnRlbnRzLmNsb3NlRGV2VG9vbHMoKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIG1haW5XaW5kb3cub24oJ2Nsb3NlZCcsICgpID0+IHtcclxuICAgIG1haW5XaW5kb3cgPSBudWxsXHJcbiAgfSlcclxufVxyXG5cclxuYXBwLndoZW5SZWFkeSgpLnRoZW4oY3JlYXRlV2luZG93KVxyXG5cclxuYXBwLm9uKCd3aW5kb3ctYWxsLWNsb3NlZCcsICgpID0+IHtcclxuICBpZiAocGxhdGZvcm0gIT09ICdkYXJ3aW4nKSB7XHJcbiAgICBhcHAucXVpdCgpXHJcbiAgfVxyXG59KVxyXG5cclxuYXBwLm9uKCdhY3RpdmF0ZScsICgpID0+IHtcclxuICBpZiAobWFpbldpbmRvdyA9PT0gbnVsbCkge1xyXG4gICAgY3JlYXRlV2luZG93KClcclxuICB9XHJcbn0pXHJcblxyXG5cclxuaXBjTWFpbi5vbignZ2lybDppbmZvczp3cml0ZScsIChlLCBkYXRhKSA9PiB7XHJcbiAgZm9sZGVyVG9vbC53cml0ZUdpcmxJbmZvRmlsZShkYXRhLm5hbWUsIGRhdGEuZ2lybCk7XHJcbn0pXHJcblxyXG5pcGNNYWluLmhhbmRsZSgnZm9sZGVyOmxvYWQnLCBhc3luYyAoZSwgZGF0YSkgPT4ge1xyXG4gIHJldHVybiBhd2FpdCBmb2xkZXJUb29sLnJlYWRHaXJsRm9sZGVyKGRhdGEubmFtZSk7XHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdmb2xkZXI6Y3JlYXRlJywgYXN5bmMgKGUsIGRhdGEpID0+IHtcclxuICByZXR1cm4gZm9sZGVyVG9vbC5jcmVhdGVHaXJsRm9sZGVyKGRhdGEubmFtZSk7XHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6Y29udmVydDp3ZWJwJywgYXN5bmMgKGUsIGRhdGEpID0+IHtcclxuICByZXR1cm4gYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRJbWFnZVRvV2VicChkYXRhLmltZylcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OndlYm0nLCBhc3luYyAoZSwgZGF0YSkgPT4ge1xyXG4gIHJldHVybiBhd2FpdCBJbWFnZVRvb2wuY29udmVydEdpZlRvV2VibShkYXRhLmltZylcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ3dlYm06cmVzaXplJywgYXN5bmMgKGUsIGRhdGEpID0+IHtcclxuICByZXR1cm4gYXdhaXQgSW1hZ2VUb29sLnJlc2l6ZVdlYm0oZGF0YS5pbWcpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6Z2V0RnJhbWVzJywgYXN5bmMgKGUsIGRhdGEpID0+IHtcclxuICByZXR1cm4gYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRXZWJwVG9XZWJtKGRhdGEuaW1nKTtcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ZpbGU6cmVhZCcsIGFzeW5jIChlLCBkYXRhKSA9PiB7XHJcbiAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZGF0YS5wYXRoKTtcclxufSlcclxuaXBjTWFpbi5vbignaW1nOnJlbmFtZScsIChlLCBkYXRhKSA9PiB7XHJcbiAgZm9sZGVyVG9vbC5yZW5hbWVGaWxlKGRhdGEub2xkUGF0aCwgZGF0YS5uZXdQYXRoKVxyXG59KVxyXG5pcGNNYWluLm9uKCdmaWxlOndyaXRlJywgKGUsIGRhdGEpID0+IHtcclxuICBmb2xkZXJUb29sLndyaXRlRmlsZShkYXRhLnBhdGgsIGRhdGEudGV4dClcclxufSlcclxuaXBjTWFpbi5vbignaW1nOnVwbG9hZCcsIChlLCBkYXRhKSA9PiB7XHJcbiAgZm9sZGVyVG9vbC51cGxvYWRGaWxlKGRhdGEucGF0aCwgZGF0YS5idWZmZXIpO1xyXG59KSIsICIvLyBHaWYgdG8gV0VCTSBsaWJyYXJ5XHJcbmNvbnN0IGZmbXBlZ0luc3RhbGxlciA9IHJlcXVpcmUoXCJAZmZtcGVnLWluc3RhbGxlci9mZm1wZWdcIik7XHJcbmNvbnN0IGZmcHJvYmUgPSByZXF1aXJlKFwiQGZmcHJvYmUtaW5zdGFsbGVyL2ZmcHJvYmVcIik7XHJcbmNvbnN0IFdlYnBJbWFnZSA9IHJlcXVpcmUoJ25vZGUtd2VicG11eCcpLkltYWdlO1xyXG5cclxuY29uc3QgY2hpbGQgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJylcclxuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxyXG5jb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpXHJcblxyXG5jb25zdCB0ZXJtaW5hdGVXaXRoRXJyb3IgPSAoZXJyb3IgPSAnW2ZhdGFsXSBlcnJvcicpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKGVycm9yKVxyXG4gICAgICAgIC8vcHJvY2Vzcy5leGl0KDEpXHJcbn1cclxuXHJcbmNvbnN0IGV4ZWMgPSB1dGlsLnByb21pc2lmeShjaGlsZC5leGVjKVxyXG5cclxuY29uc3Qgd2VicCA9IHJlcXVpcmUoJ3dlYnAtY29udmVydGVyJyk7XHJcbndlYnAuZ3JhbnRfcGVybWlzc2lvbigpO1xyXG5cclxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpXHJcblxyXG5jbGFzcyBJbWFnZVRvb2wge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjb252ZXJ0SW1hZ2VUb1dlYnAoaW1hZ2VQYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciByZXNVcmwgPSBpbWFnZVBhdGguc3BsaXQoXCIuXCIpWzBdICsgXCIud2VicFwiO1xyXG4gICAgICAgICAgICAgICAgcmVzVXJsID0gcmVzVXJsLnNwbGl0KCcvaW5wdXQvJykuam9pbignL291dHB1dC8nKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHdlYnAuY3dlYnAoaW1hZ2VQYXRoLCByZXNVcmwsIFwiLXEgODBcIiwgXCItdlwiKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc1VybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUubWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjb252ZXJ0V2VicFRvV2VibShpbWFnZVBhdGgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb252ZXJ0V2VicFRvV2VibU5ldyhpbWFnZVBhdGgpO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHdlYlBJbWFnZSA9IGF3YWl0IG5ldyBXZWJwSW1hZ2UoKTtcclxuICAgICAgICAgICAgYXdhaXQgd2ViUEltYWdlLmxvYWQoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgaWYgKHdlYlBJbWFnZS5oYXNBbmltKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHdlYlBJbWFnZS5mcmFtZXMgIT09IHVuZGVmaW5lZCAmJiB3ZWJQSW1hZ2UuZnJhbWVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcmFtZXMgPSBbLi4ud2ViUEltYWdlLmZyYW1lc107XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShmcmFtZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgcmVzaXplV2VibShpbWFnZVBhdGgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKGZmcHJvYmUucGF0aClcclxuICAgICAgICAgICAgICAgIC5zZXRGZm1wZWdQYXRoKGZmbXBlZ0luc3RhbGxlci5wYXRoKTtcclxuXHJcbiAgICAgICAgICAgIGZmbXBlZ1xyXG4gICAgICAgICAgICAgICAgLmlucHV0KGltYWdlUGF0aClcclxuICAgICAgICAgICAgICAgIC5ub0F1ZGlvKClcclxuICAgICAgICAgICAgICAgIC5vdXRwdXRPcHRpb25zKCctcGl4X2ZtdCB5dXY0MjBwJylcclxuICAgICAgICAgICAgICAgIC5vdXRwdXQoaW1hZ2VQYXRoLnNwbGl0KCcuJylbMF0gKyBcIjEud2VibVwiKVxyXG4gICAgICAgICAgICAgICAgLnNpemUoJzcyMHg/JylcclxuICAgICAgICAgICAgICAgIC5vbihcImVuZFwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR2VuZXJhdGVkICFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZmbXBlZy5raWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpbWFnZVBhdGguc3BsaXQoJy4nKVswXSArIFwiMS53ZWJtXCIpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5vbihcImVycm9yXCIsIChlKSA9PiBjb25zb2xlLmxvZyhlKSkucnVuKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRHaWZUb1dlYm0oaW1hZ2VQYXRoKSB7XHJcbiAgICAgICAgdmFyIHJlc1VybCA9IGltYWdlUGF0aC5zcGxpdCgnL2lucHV0LycpLmpvaW4oJy9vdXRwdXQvJykuc3BsaXQoJy4nKVswXSArICcud2VibSc7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgdmFyIGZmbXBlZyA9IHJlcXVpcmUoXCJmbHVlbnQtZmZtcGVnXCIpKClcclxuICAgICAgICAgICAgICAgIC5zZXRGZnByb2JlUGF0aChmZnByb2JlLnBhdGgpXHJcbiAgICAgICAgICAgICAgICAuc2V0RmZtcGVnUGF0aChmZm1wZWdJbnN0YWxsZXIucGF0aCk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dChpbWFnZVBhdGgpXHJcbiAgICAgICAgICAgICAgICAubm9BdWRpbygpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0T3B0aW9ucygnLXBpeF9mbXQgeXV2NDIwcCcpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KHJlc1VybClcclxuICAgICAgICAgICAgICAgIC5zaXplKCc3MjB4PycpXHJcbiAgICAgICAgICAgICAgICAub24oXCJlbmRcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdlbmVyYXRlZCAhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICBmZm1wZWcua2lsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzVXJsKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlcnJvclwiLCAoZSkgPT4gY29uc29sZS5sb2coZSkpLnJ1bigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjb252ZXJ0V2VicFRvV2VibU5ldyhmaWxlbmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lV2l0aG91dEV4dCA9IGZpbGVuYW1lLnJlcGxhY2UoJy53ZWJwJywgJycpXHJcbiAgICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnZnJhbWVzJylcclxuICAgICAgICAgICAgY29uc3QgZGVsZXRlT3JpZ2luYWwgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZnJhbWVzKSkgZnMucm1kaXJTeW5jKGZyYW1lcywgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuICAgICAgICAgICAgZnMubWtkaXJTeW5jKGZyYW1lcylcclxuXHJcbiAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIoJ2ZyYW1lcycpXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBwcm9jZXNzLmN3ZCgpKVxyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIGBhbmltX2R1bXAgLi4vJHtmaWxlbmFtZX1gKVxyXG4gICAgICAgICAgICBleGVjKGBhbmltX2R1bXAgLi4vJHtmaWxlbmFtZX1gKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIoJy4uJylcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgcHJvY2Vzcy5jd2QoKSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IGB3ZWJwbXV4IC1pbmZvIC4vJHtmaWxlbmFtZX1gXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleGVjKGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKHsgc3Rkb3V0LCBzdGRlcnIgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGRlcnIpIHJldHVybiBQcm9taXNlLnJlamVjdChzdGRlcnIpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQW5pbWF0aW9uID0gc3Rkb3V0Lm1hdGNoKC9GZWF0dXJlcyBwcmVzZW50OiBhbmltYXRpb24vKSAhPT0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNBbmltYXRpb24pIHJldHVybiBQcm9taXNlLnJlamVjdCgnVGhpcyBpcyBub3QgYW4gYW5pbWF0ZWQgd2VicCBmaWxlJylcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlyc3RMaW5lID0gc3Rkb3V0Lm1hdGNoKC8xOi4rW1xccl0/XFxuL2cpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdExpbmUpIHJldHVyblxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcmFtZUxlbmd0aCA9IGZpcnN0TGluZVswXS5zcGxpdCgvXFxzKy9nKVs2XVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lcmF0ZSA9IE1hdGgucm91bmQoMTAwMCAvIGZyYW1lTGVuZ3RoKSAvLyBmcmFtZXMvc2Vjb25kXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IHBhdGgucmVzb2x2ZShmcmFtZXMsICdkdW1wXyUwNGQucG5nJylcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYW5kID0gYGZmbXBlZyAtZnJhbWVyYXRlICR7ZnJhbWVyYXRlfSAtaSBcIiR7ZHVtcH1cIiBcIiR7bmFtZVdpdGhvdXRFeHR9LndlYm1cIiAteWBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWMoY29tbWFuZClcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAudGhlbigoeyBzdGRvdXQsIHN0ZGVyciB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKC9lcnJvci9nbS50ZXN0KHN0ZGVycikpIHJldHVybiBQcm9taXNlLnJlamVjdChzdGRlcnIpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsZWFudXBcclxuICAgICAgICAgICAgICAgICAgICBmcy5ybWRpclN5bmMoZnJhbWVzLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWxldGVPcmlnaW5hbCkgZnMucm1TeW5jKHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBmaWxlbmFtZSkpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXSBTdWNjZXNzIVxcbicpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVybWluYXRlV2l0aEVycm9yKGBbZmF0YWxdICR7ZXJyfWApXHJcbiAgICAgICAgICAgICAgICAgICAgZnMucm1kaXJTeW5jKGZyYW1lcywgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0IGRlZmF1bHQgSW1hZ2VUb29sOyIsICJjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJylcclxuY29uc3QgeyByZWFkZGlyIH0gPSByZXF1aXJlKCdmcycpLnByb21pc2VzO1xyXG5jb25zdCBXT1JLU1BBQ0VfRElSID0gJ3dvcmtzcGFjZSc7XHJcblxyXG5pbXBvcnQgSW1hZ2VUb29sIGZyb20gJy4vaW1hZ2VUb29sJztcclxuXHJcbmNsYXNzIEZvbGRlclRvb2wge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKFdPUktTUEFDRV9ESVIpKSB7XHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhXT1JLU1BBQ0VfRElSKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jcmVhdGVGb2xkZXIoXCJpbnB1dFwiKTtcclxuICAgICAgICB0aGlzLmNyZWF0ZUZvbGRlcihcIm91dHB1dFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVGb2xkZXIoZm9sZGVyTmFtZSkge1xyXG4gICAgICAgIHZhciB1cmwgPSBXT1JLU1BBQ0VfRElSICsgXCIvXCIgKyBmb2xkZXJOYW1lO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyh1cmwpKSB7XHJcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmModXJsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0gR0VORVJBTCBUT09MU1xyXG5cclxuICAgIGFzeW5jIHJlYWRGb2xkZXIoZGlyTmFtZSkge1xyXG4gICAgICAgIGxldCBmaWxlcyA9IFtdO1xyXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgcmVhZGRpcihkaXJOYW1lLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5pc0RpcmVjdG9yeSgpKSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlcy5wdXNoKGAke2Rpck5hbWV9LyR7aXRlbS5uYW1lfWApO1xyXG4gICAgICAgICAgICAgICAgZmlsZXMgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgLi4uZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgLi4uKGF3YWl0IHRoaXMucmVhZEZvbGRlcihgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gKSksXHJcbiAgICAgICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKGZpbGVzKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWFkRmlsZShmaWxlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJldCA9IEJ1ZmZlci5mcm9tKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJldC50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFwiZXJyb3JcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoXCJlcnJvclwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlRmlsZShmaWxlUGF0aCwgdGV4dCkge1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIHRleHQsIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHVwbG9hZEZpbGUoZmlsZVBhdGgsIGJ1ZmZlcikge1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIEJ1ZmZlci5mcm9tKGJ1ZmZlciksIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmFtZUZpbGUob2xkdXJsLCBuZXd1cmwpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVuYW1lZCAnICsgb2xkdXJsICsgJyBpbnRvICcgKyBuZXd1cmwpO1xyXG4gICAgICAgICAgICBpZiAobmV3dXJsLnNwbGl0KFwiLlwiKS5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgbmV3dXJsICs9IFwiLndlYnBcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmcy5yZW5hbWUob2xkdXJsLCBuZXd1cmwsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEZvbGRlclRvb2w7Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzQkFBeUQ7QUFDekQsa0JBQWlCO0FBQ2pCLGdCQUFlOzs7QUNEZixJQUFNLGtCQUFrQixRQUFRO0FBQ2hDLElBQU0sVUFBVSxRQUFRO0FBQ3hCLElBQU0sWUFBWSxRQUFRLGdCQUFnQjtBQUUxQyxJQUFNLFFBQVEsUUFBUTtBQUN0QixJQUFNLE9BQU8sUUFBUTtBQUNyQixJQUFNLE9BQU8sUUFBUTtBQUVyQixJQUFNLHFCQUFxQixDQUFDLFFBQVEsb0JBQW9CO0FBQ3BELFVBQVEsSUFBSSxLQUFLO0FBRXJCO0FBRUEsSUFBTSxPQUFPLEtBQUssVUFBVSxNQUFNLElBQUk7QUFFdEMsSUFBTSxPQUFPLFFBQVE7QUFDckIsS0FBSyxpQkFBaUI7QUFFdEIsSUFBTSxLQUFLLFFBQVE7QUFFbkIsSUFBTSxZQUFOLE1BQWdCO0FBQUEsRUFDWixjQUFjO0FBQUEsRUFFZDtBQUFBLEVBRUEsYUFBYSxt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
