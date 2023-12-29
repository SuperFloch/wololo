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
import_electron.ipcMain.handle("img:convert:webp", async (e, data) => {
  return await imageTool_default.convertImageToWebp(data.img);
});
import_electron.ipcMain.handle("img:convert:webm", async (e, data) => {
  return await imageTool_default.convertGifToWebm(data.img);
});
import_electron.ipcMain.handle("img:convert:ico", async (e, data) => {
  return await imageTool_default.convertPngToIco(data.img);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjLWVsZWN0cm9uL2VsZWN0cm9uLW1haW4uanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ltYWdlVG9vbC5qcyIsICIuLi8uLi9zcmMtZWxlY3Ryb24vc2VydmljZXMvZm9sZGVyVG9vbC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93LCBuYXRpdmVUaGVtZSwgaXBjTWFpbiB9IGZyb20gJ2VsZWN0cm9uJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgb3MgZnJvbSAnb3MnXHJcbmltcG9ydCBGb2xkZXJUb29sIGZyb20gJy4vc2VydmljZXMvZm9sZGVyVG9vbCc7XHJcbmltcG9ydCBJbWFnZVRvb2wgZnJvbSAnLi9zZXJ2aWNlcy9pbWFnZVRvb2wnO1xyXG5cclxuLy8gbmVlZGVkIGluIGNhc2UgcHJvY2VzcyBpcyB1bmRlZmluZWQgdW5kZXIgTGludXhcclxuY29uc3QgcGxhdGZvcm0gPSBwcm9jZXNzLnBsYXRmb3JtIHx8IG9zLnBsYXRmb3JtKClcclxuXHJcbmxldCBtYWluV2luZG93XHJcblxyXG5jb25zdCBmb2xkZXJUb29sID0gbmV3IEZvbGRlclRvb2woKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpbmRvdygpIHtcclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbCB3aW5kb3cgb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBtYWluV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xyXG4gICAgICAgIGljb246IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdpY29ucy9pY29uLnBuZycpLCAvLyB0cmF5IGljb25cclxuICAgICAgICB3aWR0aDogMTAwMCxcclxuICAgICAgICBoZWlnaHQ6IDYwMCxcclxuICAgICAgICB1c2VDb250ZW50U2l6ZTogdHJ1ZSxcclxuICAgICAgICB3ZWJQcmVmZXJlbmNlczoge1xyXG4gICAgICAgICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICAvLyBNb3JlIGluZm86IGh0dHBzOi8vdjIucXVhc2FyLmRldi9xdWFzYXItY2xpLXZpdGUvZGV2ZWxvcGluZy1lbGVjdHJvbi1hcHBzL2VsZWN0cm9uLXByZWxvYWQtc2NyaXB0XHJcbiAgICAgICAgICAgIHByZWxvYWQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIHByb2Nlc3MuZW52LlFVQVNBUl9FTEVDVFJPTl9QUkVMT0FEKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgbWFpbldpbmRvdy5sb2FkVVJMKHByb2Nlc3MuZW52LkFQUF9VUkwpXHJcblxyXG4gICAgaWYgKHByb2Nlc3MuZW52LkRFQlVHR0lORykge1xyXG4gICAgICAgIC8vIGlmIG9uIERFViBvciBQcm9kdWN0aW9uIHdpdGggZGVidWcgZW5hYmxlZFxyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gd2UncmUgb24gcHJvZHVjdGlvbjsgbm8gYWNjZXNzIHRvIGRldnRvb2xzIHBsc1xyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub24oJ2RldnRvb2xzLW9wZW5lZCcsICgpID0+IHtcclxuICAgICAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5jbG9zZURldlRvb2xzKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIG1haW5XaW5kb3cub24oJ2Nsb3NlZCcsICgpID0+IHtcclxuICAgICAgICBtYWluV2luZG93ID0gbnVsbFxyXG4gICAgfSlcclxufVxyXG5cclxuYXBwLndoZW5SZWFkeSgpLnRoZW4oY3JlYXRlV2luZG93KVxyXG5cclxuYXBwLm9uKCd3aW5kb3ctYWxsLWNsb3NlZCcsICgpID0+IHtcclxuICAgIGlmIChwbGF0Zm9ybSAhPT0gJ2RhcndpbicpIHtcclxuICAgICAgICBhcHAucXVpdCgpXHJcbiAgICB9XHJcbn0pXHJcblxyXG5hcHAub24oJ2FjdGl2YXRlJywgKCkgPT4ge1xyXG4gICAgaWYgKG1haW5XaW5kb3cgPT09IG51bGwpIHtcclxuICAgICAgICBjcmVhdGVXaW5kb3coKVxyXG4gICAgfVxyXG59KVxyXG5cclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OndlYnAnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRJbWFnZVRvV2VicChkYXRhLmltZylcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OndlYm0nLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRHaWZUb1dlYm0oZGF0YS5pbWcpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6Y29udmVydDppY28nLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRQbmdUb0ljbyhkYXRhLmltZylcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ3dlYm06cmVzaXplJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IEltYWdlVG9vbC5yZXNpemVXZWJtKGRhdGEuaW1nKVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOmdldEZyYW1lcycsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCBJbWFnZVRvb2wuY29udmVydFdlYnBUb1dlYm0oZGF0YS5pbWcpO1xyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnZmlsZTpyZWFkJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZGF0YS5wYXRoKTtcclxufSlcclxuaXBjTWFpbi5vbignaW1nOnJlbmFtZScsIChlLCBkYXRhKSA9PiB7XHJcbiAgICBmb2xkZXJUb29sLnJlbmFtZUZpbGUoZGF0YS5vbGRQYXRoLCBkYXRhLm5ld1BhdGgpXHJcbn0pXHJcbmlwY01haW4ub24oJ2ZpbGU6d3JpdGUnLCAoZSwgZGF0YSkgPT4ge1xyXG4gICAgZm9sZGVyVG9vbC53cml0ZUZpbGUoZGF0YS5wYXRoLCBkYXRhLnRleHQpXHJcbn0pXHJcbmlwY01haW4ub24oJ2ltZzp1cGxvYWQnLCAoZSwgZGF0YSkgPT4ge1xyXG4gICAgZm9sZGVyVG9vbC51cGxvYWRGaWxlKGRhdGEucGF0aCwgZGF0YS5idWZmZXIpO1xyXG59KSIsICIvLyBHaWYgdG8gV0VCTSBsaWJyYXJ5XHJcbmNvbnN0IFdlYnBJbWFnZSA9IHJlcXVpcmUoJ25vZGUtd2VicG11eCcpLkltYWdlO1xyXG5cclxuY29uc3QgcG5nVG9JY28gPSByZXF1aXJlKCdwbmctdG8taWNvJyk7XHJcblxyXG5jb25zdCBjaGlsZCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxyXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXHJcbmNvbnN0IHV0aWwgPSByZXF1aXJlKCd1dGlsJylcclxuXHJcbmNvbnN0IHRlcm1pbmF0ZVdpdGhFcnJvciA9IChlcnJvciA9ICdbZmF0YWxdIGVycm9yJykgPT4ge1xyXG4gICAgY29uc29sZS5sb2coZXJyb3IpXHJcbiAgICAgICAgLy9wcm9jZXNzLmV4aXQoMSlcclxufVxyXG5cclxuY29uc3QgZXhlYyA9IHV0aWwucHJvbWlzaWZ5KGNoaWxkLmV4ZWMpXHJcblxyXG5jb25zdCB3ZWJwID0gcmVxdWlyZSgnd2VicC1jb252ZXJ0ZXInKTtcclxud2VicC5ncmFudF9wZXJtaXNzaW9uKCk7XHJcblxyXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJylcclxuXHJcbmNsYXNzIEltYWdlVG9vbCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRJbWFnZVRvV2VicChpbWFnZVBhdGgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc1VybCA9IGltYWdlUGF0aC5zcGxpdChcIi5cIilbMF0gKyBcIi53ZWJwXCI7XHJcbiAgICAgICAgICAgICAgICByZXNVcmwgPSByZXNVcmwuc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gd2VicC5jd2VicChpbWFnZVBhdGgsIHJlc1VybCwgXCItcSA4MFwiLCBcIi12XCIpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzVXJsKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRXZWJwVG9XZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRXZWJwVG9XZWJtTmV3KGltYWdlUGF0aCk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgd2ViUEltYWdlID0gYXdhaXQgbmV3IFdlYnBJbWFnZSgpO1xyXG4gICAgICAgICAgICBhd2FpdCB3ZWJQSW1hZ2UubG9hZChpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICBpZiAod2ViUEltYWdlLmhhc0FuaW0pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAod2ViUEltYWdlLmZyYW1lcyAhPT0gdW5kZWZpbmVkICYmIHdlYlBJbWFnZS5mcmFtZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IFsuLi53ZWJQSW1hZ2UuZnJhbWVzXTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZyYW1lcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyByZXNpemVXZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBmZm1wZWcgPSByZXF1aXJlKFwiZmx1ZW50LWZmbXBlZ1wiKSgpXHJcbiAgICAgICAgICAgICAgICAuc2V0RmZwcm9iZVBhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZnByb2JlLmV4ZScpXHJcbiAgICAgICAgICAgICAgICAuc2V0RmZtcGVnUGF0aCgnLi9yZXNvdXJjZXMvZmZtcGVnL2ZmbXBlZy5leGUnKTtcclxuXHJcbiAgICAgICAgICAgIGZmbXBlZ1xyXG4gICAgICAgICAgICAgICAgLmlucHV0KGltYWdlUGF0aClcclxuICAgICAgICAgICAgICAgIC5ub0F1ZGlvKClcclxuICAgICAgICAgICAgICAgIC5vdXRwdXRPcHRpb25zKCctcGl4X2ZtdCB5dXY0MjBwJylcclxuICAgICAgICAgICAgICAgIC5vdXRwdXQoaW1hZ2VQYXRoLnNwbGl0KCcuJylbMF0gKyBcIjEud2VibVwiKVxyXG4gICAgICAgICAgICAgICAgLnNpemUoJzcyMHg/JylcclxuICAgICAgICAgICAgICAgIC5vbihcImVuZFwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR2VuZXJhdGVkICFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZmbXBlZy5raWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpbWFnZVBhdGguc3BsaXQoJy4nKVswXSArIFwiMS53ZWJtXCIpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5vbihcImVycm9yXCIsIChlKSA9PiBjb25zb2xlLmxvZyhlKSkucnVuKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRHaWZUb1dlYm0oaW1hZ2VQYXRoKSB7XHJcbiAgICAgICAgdmFyIHJlc1VybCA9IGltYWdlUGF0aC5zcGxpdCgnL2lucHV0LycpLmpvaW4oJy9vdXRwdXQvJykuc3BsaXQoJy4nKVswXSArICcud2VibSc7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgdmFyIGZmbXBlZyA9IHJlcXVpcmUoXCJmbHVlbnQtZmZtcGVnXCIpKClcclxuICAgICAgICAgICAgICAgIC5zZXRGZnByb2JlUGF0aCgnLi9yZXNvdXJjZXMvZmZtcGVnL2ZmcHJvYmUuZXhlJylcclxuICAgICAgICAgICAgICAgIC5zZXRGZm1wZWdQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZtcGVnLmV4ZScpO1xyXG5cclxuICAgICAgICAgICAgZmZtcGVnXHJcbiAgICAgICAgICAgICAgICAuaW5wdXQoaW1hZ2VQYXRoKVxyXG4gICAgICAgICAgICAgICAgLm5vQXVkaW8oKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dE9wdGlvbnMoJy1waXhfZm10IHl1djQyMHAnKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dChyZXNVcmwpXHJcbiAgICAgICAgICAgICAgICAuc2l6ZSgnNzIweD8nKVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZW5kXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJHZW5lcmF0ZWQgIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmtTeW5jKGltYWdlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmZtcGVnLmtpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc1VybCk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZXJyb3JcIiwgKGUpID0+IGNvbnNvbGUubG9nKGUpKS5ydW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydFdlYnBUb1dlYm1OZXcoZmlsZW5hbWUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZVdpdGhvdXRFeHQgPSBmaWxlbmFtZS5yZXBsYWNlKCcud2VicCcsICcnKVxyXG4gICAgICAgICAgICBjb25zdCBmcmFtZXMgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJ2ZyYW1lcycpXHJcbiAgICAgICAgICAgIGNvbnN0IGRlbGV0ZU9yaWdpbmFsID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZyYW1lcykpIGZzLnJtZGlyU3luYyhmcmFtZXMsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhmcmFtZXMpXHJcblxyXG4gICAgICAgICAgICBwcm9jZXNzLmNoZGlyKCdmcmFtZXMnKVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgcHJvY2Vzcy5jd2QoKSlcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBgYW5pbV9kdW1wIC4uLyR7ZmlsZW5hbWV9YClcclxuICAgICAgICAgICAgZXhlYyhgYW5pbV9kdW1wIC4uLyR7ZmlsZW5hbWV9YClcclxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmNoZGlyKCcuLicpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIHByb2Nlc3MuY3dkKCkpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSBgd2VicG11eCAtaW5mbyAuLyR7ZmlsZW5hbWV9YFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgY29tbWFuZClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhlYyhjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC50aGVuKCh7IHN0ZG91dCwgc3RkZXJyIH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RkZXJyKSByZXR1cm4gUHJvbWlzZS5yZWplY3Qoc3RkZXJyKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0FuaW1hdGlvbiA9IHN0ZG91dC5tYXRjaCgvRmVhdHVyZXMgcHJlc2VudDogYW5pbWF0aW9uLykgIT09IG51bGxcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzQW5pbWF0aW9uKSByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1RoaXMgaXMgbm90IGFuIGFuaW1hdGVkIHdlYnAgZmlsZScpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TGluZSA9IHN0ZG91dC5tYXRjaCgvMTouK1tcXHJdP1xcbi9nKVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlyc3RMaW5lKSByZXR1cm5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZnJhbWVMZW5ndGggPSBmaXJzdExpbmVbMF0uc3BsaXQoL1xccysvZylbNl1cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcmFtZXJhdGUgPSBNYXRoLnJvdW5kKDEwMDAgLyBmcmFtZUxlbmd0aCkgLy8gZnJhbWVzL3NlY29uZFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBwYXRoLnJlc29sdmUoZnJhbWVzLCAnZHVtcF8lMDRkLnBuZycpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IGBmZm1wZWcgLWZyYW1lcmF0ZSAke2ZyYW1lcmF0ZX0gLWkgXCIke2R1bXB9XCIgXCIke25hbWVXaXRob3V0RXh0fS53ZWJtXCIgLXlgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleGVjKGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKHsgc3Rkb3V0LCBzdGRlcnIgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgvZXJyb3IvZ20udGVzdChzdGRlcnIpKSByZXR1cm4gUHJvbWlzZS5yZWplY3Qoc3RkZXJyKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjbGVhbnVwXHJcbiAgICAgICAgICAgICAgICAgICAgZnMucm1kaXJTeW5jKGZyYW1lcywgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVsZXRlT3JpZ2luYWwpIGZzLnJtU3luYyhwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgZmlsZW5hbWUpKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10gU3VjY2VzcyFcXG4nKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRlcm1pbmF0ZVdpdGhFcnJvcihgW2ZhdGFsXSAke2Vycn1gKVxyXG4gICAgICAgICAgICAgICAgICAgIGZzLnJtZGlyU3luYyhmcmFtZXMsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBjb252ZXJ0UG5nVG9JY28oZmlsZU5hbWUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgdmFyIG5ld05hbWUgPSBmaWxlTmFtZS5zcGxpdCgnL2lucHV0LycpLmpvaW4oJy9vdXRwdXQvJykuc3BsaXQoJy4nKVswXSArICcuaWNvJztcclxuICAgICAgICAgICAgcG5nVG9JY28oZmlsZU5hbWUpXHJcbiAgICAgICAgICAgICAgICAudGhlbihidWYgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMobmV3TmFtZSwgYnVmKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5ld05hbWUpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuZXhwb3J0IGRlZmF1bHQgSW1hZ2VUb29sOyIsICJjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJylcclxuY29uc3QgeyByZWFkZGlyIH0gPSByZXF1aXJlKCdmcycpLnByb21pc2VzO1xyXG5jb25zdCBXT1JLU1BBQ0VfRElSID0gJ3dvcmtzcGFjZSc7XHJcblxyXG5pbXBvcnQgSW1hZ2VUb29sIGZyb20gJy4vaW1hZ2VUb29sJztcclxuXHJcbmNsYXNzIEZvbGRlclRvb2wge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKFdPUktTUEFDRV9ESVIpKSB7XHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhXT1JLU1BBQ0VfRElSKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jcmVhdGVGb2xkZXIoXCJpbnB1dFwiKTtcclxuICAgICAgICB0aGlzLmNyZWF0ZUZvbGRlcihcIm91dHB1dFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVGb2xkZXIoZm9sZGVyTmFtZSkge1xyXG4gICAgICAgIHZhciB1cmwgPSBXT1JLU1BBQ0VfRElSICsgXCIvXCIgKyBmb2xkZXJOYW1lO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyh1cmwpKSB7XHJcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmModXJsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0gR0VORVJBTCBUT09MU1xyXG5cclxuICAgIGFzeW5jIHJlYWRGb2xkZXIoZGlyTmFtZSkge1xyXG4gICAgICAgIGxldCBmaWxlcyA9IFtdO1xyXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgcmVhZGRpcihkaXJOYW1lLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5pc0RpcmVjdG9yeSgpKSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlcy5wdXNoKGAke2Rpck5hbWV9LyR7aXRlbS5uYW1lfWApO1xyXG4gICAgICAgICAgICAgICAgZmlsZXMgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgLi4uZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgLi4uKGF3YWl0IHRoaXMucmVhZEZvbGRlcihgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gKSksXHJcbiAgICAgICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKGZpbGVzKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWFkRmlsZShmaWxlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJldCA9IEJ1ZmZlci5mcm9tKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJldC50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFwiZXJyb3JcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoXCJlcnJvclwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlRmlsZShmaWxlUGF0aCwgdGV4dCkge1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIHRleHQsIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHVwbG9hZEZpbGUoZmlsZVBhdGgsIGJ1ZmZlcikge1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIEJ1ZmZlci5mcm9tKGJ1ZmZlciksIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmFtZUZpbGUob2xkdXJsLCBuZXd1cmwpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVuYW1lZCAnICsgb2xkdXJsICsgJyBpbnRvICcgKyBuZXd1cmwpO1xyXG4gICAgICAgICAgICBpZiAobmV3dXJsLnNwbGl0KFwiLlwiKS5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgbmV3dXJsICs9IFwiLndlYnBcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmcy5yZW5hbWUob2xkdXJsLCBuZXd1cmwsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEZvbGRlclRvb2w7Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzQkFBeUQ7QUFDekQsa0JBQWlCO0FBQ2pCLGdCQUFlOzs7QUNEZixJQUFNLFlBQVksUUFBUSxnQkFBZ0I7QUFFMUMsSUFBTSxXQUFXLFFBQVE7QUFFekIsSUFBTSxRQUFRLFFBQVE7QUFDdEIsSUFBTSxPQUFPLFFB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
