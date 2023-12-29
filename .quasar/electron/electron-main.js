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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjLWVsZWN0cm9uL2VsZWN0cm9uLW1haW4uanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ltYWdlVG9vbC5qcyIsICIuLi8uLi9zcmMtZWxlY3Ryb24vc2VydmljZXMvZm9sZGVyVG9vbC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93LCBuYXRpdmVUaGVtZSwgaXBjTWFpbiB9IGZyb20gJ2VsZWN0cm9uJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgb3MgZnJvbSAnb3MnXHJcbmltcG9ydCBGb2xkZXJUb29sIGZyb20gJy4vc2VydmljZXMvZm9sZGVyVG9vbCc7XHJcbmltcG9ydCBJbWFnZVRvb2wgZnJvbSAnLi9zZXJ2aWNlcy9pbWFnZVRvb2wnO1xyXG5cclxuLy8gbmVlZGVkIGluIGNhc2UgcHJvY2VzcyBpcyB1bmRlZmluZWQgdW5kZXIgTGludXhcclxuY29uc3QgcGxhdGZvcm0gPSBwcm9jZXNzLnBsYXRmb3JtIHx8IG9zLnBsYXRmb3JtKClcclxuXHJcbmxldCBtYWluV2luZG93XHJcblxyXG5jb25zdCBmb2xkZXJUb29sID0gbmV3IEZvbGRlclRvb2woKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpbmRvdygpIHtcclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbCB3aW5kb3cgb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBtYWluV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xyXG4gICAgICAgIGljb246IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdpY29ucy9pY29uLnBuZycpLCAvLyB0cmF5IGljb25cclxuICAgICAgICB3aWR0aDogMTAwMCxcclxuICAgICAgICBoZWlnaHQ6IDYwMCxcclxuICAgICAgICB1c2VDb250ZW50U2l6ZTogdHJ1ZSxcclxuICAgICAgICB3ZWJQcmVmZXJlbmNlczoge1xyXG4gICAgICAgICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICAvLyBNb3JlIGluZm86IGh0dHBzOi8vdjIucXVhc2FyLmRldi9xdWFzYXItY2xpLXZpdGUvZGV2ZWxvcGluZy1lbGVjdHJvbi1hcHBzL2VsZWN0cm9uLXByZWxvYWQtc2NyaXB0XHJcbiAgICAgICAgICAgIHByZWxvYWQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIHByb2Nlc3MuZW52LlFVQVNBUl9FTEVDVFJPTl9QUkVMT0FEKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgbWFpbldpbmRvdy5sb2FkVVJMKHByb2Nlc3MuZW52LkFQUF9VUkwpXHJcblxyXG4gICAgaWYgKHByb2Nlc3MuZW52LkRFQlVHR0lORykge1xyXG4gICAgICAgIC8vIGlmIG9uIERFViBvciBQcm9kdWN0aW9uIHdpdGggZGVidWcgZW5hYmxlZFxyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gd2UncmUgb24gcHJvZHVjdGlvbjsgbm8gYWNjZXNzIHRvIGRldnRvb2xzIHBsc1xyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub24oJ2RldnRvb2xzLW9wZW5lZCcsICgpID0+IHtcclxuICAgICAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5jbG9zZURldlRvb2xzKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIG1haW5XaW5kb3cub24oJ2Nsb3NlZCcsICgpID0+IHtcclxuICAgICAgICBtYWluV2luZG93ID0gbnVsbFxyXG4gICAgfSlcclxufVxyXG5cclxuYXBwLndoZW5SZWFkeSgpLnRoZW4oY3JlYXRlV2luZG93KVxyXG5cclxuYXBwLm9uKCd3aW5kb3ctYWxsLWNsb3NlZCcsICgpID0+IHtcclxuICAgIGlmIChwbGF0Zm9ybSAhPT0gJ2RhcndpbicpIHtcclxuICAgICAgICBhcHAucXVpdCgpXHJcbiAgICB9XHJcbn0pXHJcblxyXG5hcHAub24oJ2FjdGl2YXRlJywgKCkgPT4ge1xyXG4gICAgaWYgKG1haW5XaW5kb3cgPT09IG51bGwpIHtcclxuICAgICAgICBjcmVhdGVXaW5kb3coKVxyXG4gICAgfVxyXG59KVxyXG5cclxuXHJcbmlwY01haW4ub24oJ2dpcmw6aW5mb3M6d3JpdGUnLCAoZSwgZGF0YSkgPT4ge1xyXG4gICAgZm9sZGVyVG9vbC53cml0ZUdpcmxJbmZvRmlsZShkYXRhLm5hbWUsIGRhdGEuZ2lybCk7XHJcbn0pXHJcblxyXG5pcGNNYWluLmhhbmRsZSgnZm9sZGVyOmxvYWQnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkR2lybEZvbGRlcihkYXRhLm5hbWUpO1xyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnZm9sZGVyOmNyZWF0ZScsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBmb2xkZXJUb29sLmNyZWF0ZUdpcmxGb2xkZXIoZGF0YS5uYW1lKTtcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OndlYnAnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRJbWFnZVRvV2VicChkYXRhLmltZylcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OndlYm0nLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRHaWZUb1dlYm0oZGF0YS5pbWcpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6Y29udmVydDppY28nLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRQbmdUb0ljbyhkYXRhLmltZylcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ3dlYm06cmVzaXplJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IEltYWdlVG9vbC5yZXNpemVXZWJtKGRhdGEuaW1nKVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOmdldEZyYW1lcycsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCBJbWFnZVRvb2wuY29udmVydFdlYnBUb1dlYm0oZGF0YS5pbWcpO1xyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnZmlsZTpyZWFkJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZGF0YS5wYXRoKTtcclxufSlcclxuaXBjTWFpbi5vbignaW1nOnJlbmFtZScsIChlLCBkYXRhKSA9PiB7XHJcbiAgICBmb2xkZXJUb29sLnJlbmFtZUZpbGUoZGF0YS5vbGRQYXRoLCBkYXRhLm5ld1BhdGgpXHJcbn0pXHJcbmlwY01haW4ub24oJ2ZpbGU6d3JpdGUnLCAoZSwgZGF0YSkgPT4ge1xyXG4gICAgZm9sZGVyVG9vbC53cml0ZUZpbGUoZGF0YS5wYXRoLCBkYXRhLnRleHQpXHJcbn0pXHJcbmlwY01haW4ub24oJ2ltZzp1cGxvYWQnLCAoZSwgZGF0YSkgPT4ge1xyXG4gICAgZm9sZGVyVG9vbC51cGxvYWRGaWxlKGRhdGEucGF0aCwgZGF0YS5idWZmZXIpO1xyXG59KSIsICIvLyBHaWYgdG8gV0VCTSBsaWJyYXJ5XHJcbmNvbnN0IGZmbXBlZ0luc3RhbGxlciA9IHJlcXVpcmUoXCJAZmZtcGVnLWluc3RhbGxlci9mZm1wZWdcIik7XHJcbmNvbnN0IGZmcHJvYmUgPSByZXF1aXJlKFwiQGZmcHJvYmUtaW5zdGFsbGVyL2ZmcHJvYmVcIik7XHJcbmNvbnN0IFdlYnBJbWFnZSA9IHJlcXVpcmUoJ25vZGUtd2VicG11eCcpLkltYWdlO1xyXG5cclxuY29uc3QgcG5nVG9JY28gPSByZXF1aXJlKCdwbmctdG8taWNvJyk7XHJcblxyXG5jb25zdCBjaGlsZCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxyXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXHJcbmNvbnN0IHV0aWwgPSByZXF1aXJlKCd1dGlsJylcclxuXHJcbmNvbnN0IHRlcm1pbmF0ZVdpdGhFcnJvciA9IChlcnJvciA9ICdbZmF0YWxdIGVycm9yJykgPT4ge1xyXG4gICAgY29uc29sZS5sb2coZXJyb3IpXHJcbiAgICAgICAgLy9wcm9jZXNzLmV4aXQoMSlcclxufVxyXG5cclxuY29uc3QgZXhlYyA9IHV0aWwucHJvbWlzaWZ5KGNoaWxkLmV4ZWMpXHJcblxyXG5jb25zdCB3ZWJwID0gcmVxdWlyZSgnd2VicC1jb252ZXJ0ZXInKTtcclxud2VicC5ncmFudF9wZXJtaXNzaW9uKCk7XHJcblxyXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJylcclxuXHJcbmNsYXNzIEltYWdlVG9vbCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRJbWFnZVRvV2VicChpbWFnZVBhdGgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc1VybCA9IGltYWdlUGF0aC5zcGxpdChcIi5cIilbMF0gKyBcIi53ZWJwXCI7XHJcbiAgICAgICAgICAgICAgICByZXNVcmwgPSByZXNVcmwuc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gd2VicC5jd2VicChpbWFnZVBhdGgsIHJlc1VybCwgXCItcSA4MFwiLCBcIi12XCIpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzVXJsKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRXZWJwVG9XZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRXZWJwVG9XZWJtTmV3KGltYWdlUGF0aCk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgd2ViUEltYWdlID0gYXdhaXQgbmV3IFdlYnBJbWFnZSgpO1xyXG4gICAgICAgICAgICBhd2FpdCB3ZWJQSW1hZ2UubG9hZChpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICBpZiAod2ViUEltYWdlLmhhc0FuaW0pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAod2ViUEltYWdlLmZyYW1lcyAhPT0gdW5kZWZpbmVkICYmIHdlYlBJbWFnZS5mcmFtZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IFsuLi53ZWJQSW1hZ2UuZnJhbWVzXTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZyYW1lcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyByZXNpemVXZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBmZm1wZWcgPSByZXF1aXJlKFwiZmx1ZW50LWZmbXBlZ1wiKSgpXHJcbiAgICAgICAgICAgICAgICAuc2V0RmZwcm9iZVBhdGgoZmZwcm9iZS5wYXRoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoZmZtcGVnSW5zdGFsbGVyLnBhdGgpO1xyXG5cclxuICAgICAgICAgICAgZmZtcGVnXHJcbiAgICAgICAgICAgICAgICAuaW5wdXQoaW1hZ2VQYXRoKVxyXG4gICAgICAgICAgICAgICAgLm5vQXVkaW8oKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dE9wdGlvbnMoJy1waXhfZm10IHl1djQyMHAnKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dChpbWFnZVBhdGguc3BsaXQoJy4nKVswXSArIFwiMS53ZWJtXCIpXHJcbiAgICAgICAgICAgICAgICAuc2l6ZSgnNzIweD8nKVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZW5kXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJHZW5lcmF0ZWQgIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmtTeW5jKGltYWdlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmZtcGVnLmtpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGltYWdlUGF0aC5zcGxpdCgnLicpWzBdICsgXCIxLndlYm1cIik7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZXJyb3JcIiwgKGUpID0+IGNvbnNvbGUubG9nKGUpKS5ydW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydEdpZlRvV2VibShpbWFnZVBhdGgpIHtcclxuICAgICAgICB2YXIgcmVzVXJsID0gaW1hZ2VQYXRoLnNwbGl0KCcvaW5wdXQvJykuam9pbignL291dHB1dC8nKS5zcGxpdCgnLicpWzBdICsgJy53ZWJtJztcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKGZmcHJvYmUucGF0aClcclxuICAgICAgICAgICAgICAgIC5zZXRGZm1wZWdQYXRoKGZmbXBlZ0luc3RhbGxlci5wYXRoKTtcclxuXHJcbiAgICAgICAgICAgIGZmbXBlZ1xyXG4gICAgICAgICAgICAgICAgLmlucHV0KGltYWdlUGF0aClcclxuICAgICAgICAgICAgICAgIC5ub0F1ZGlvKClcclxuICAgICAgICAgICAgICAgIC5vdXRwdXRPcHRpb25zKCctcGl4X2ZtdCB5dXY0MjBwJylcclxuICAgICAgICAgICAgICAgIC5vdXRwdXQocmVzVXJsKVxyXG4gICAgICAgICAgICAgICAgLnNpemUoJzcyMHg/JylcclxuICAgICAgICAgICAgICAgIC5vbihcImVuZFwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR2VuZXJhdGVkICFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZmbXBlZy5raWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNVcmwpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5vbihcImVycm9yXCIsIChlKSA9PiBjb25zb2xlLmxvZyhlKSkucnVuKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRXZWJwVG9XZWJtTmV3KGZpbGVuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWVXaXRob3V0RXh0ID0gZmlsZW5hbWUucmVwbGFjZSgnLndlYnAnLCAnJylcclxuICAgICAgICAgICAgY29uc3QgZnJhbWVzID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICdmcmFtZXMnKVxyXG4gICAgICAgICAgICBjb25zdCBkZWxldGVPcmlnaW5hbCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmcmFtZXMpKSBmcy5ybWRpclN5bmMoZnJhbWVzLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxyXG4gICAgICAgICAgICBmcy5ta2RpclN5bmMoZnJhbWVzKVxyXG5cclxuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpcignZnJhbWVzJylcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIHByb2Nlc3MuY3dkKCkpXHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgYGFuaW1fZHVtcCAuLi8ke2ZpbGVuYW1lfWApXHJcbiAgICAgICAgICAgIGV4ZWMoYGFuaW1fZHVtcCAuLi8ke2ZpbGVuYW1lfWApXHJcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5jaGRpcignLi4nKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBwcm9jZXNzLmN3ZCgpKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYW5kID0gYHdlYnBtdXggLWluZm8gLi8ke2ZpbGVuYW1lfWBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWMoY29tbWFuZClcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAudGhlbigoeyBzdGRvdXQsIHN0ZGVyciB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0ZGVycikgcmV0dXJuIFByb21pc2UucmVqZWN0KHN0ZGVycilcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNBbmltYXRpb24gPSBzdGRvdXQubWF0Y2goL0ZlYXR1cmVzIHByZXNlbnQ6IGFuaW1hdGlvbi8pICE9PSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0FuaW1hdGlvbikgcmV0dXJuIFByb21pc2UucmVqZWN0KCdUaGlzIGlzIG5vdCBhbiBhbmltYXRlZCB3ZWJwIGZpbGUnKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaXJzdExpbmUgPSBzdGRvdXQubWF0Y2goLzE6LitbXFxyXT9cXG4vZylcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpcnN0TGluZSkgcmV0dXJuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lTGVuZ3RoID0gZmlyc3RMaW5lWzBdLnNwbGl0KC9cXHMrL2cpWzZdXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZnJhbWVyYXRlID0gTWF0aC5yb3VuZCgxMDAwIC8gZnJhbWVMZW5ndGgpIC8vIGZyYW1lcy9zZWNvbmRcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gcGF0aC5yZXNvbHZlKGZyYW1lcywgJ2R1bXBfJTA0ZC5wbmcnKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSBgZmZtcGVnIC1mcmFtZXJhdGUgJHtmcmFtZXJhdGV9IC1pIFwiJHtkdW1wfVwiIFwiJHtuYW1lV2l0aG91dEV4dH0ud2VibVwiIC15YFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgY29tbWFuZClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhlYyhjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC50aGVuKCh7IHN0ZG91dCwgc3RkZXJyIH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoL2Vycm9yL2dtLnRlc3Qoc3RkZXJyKSkgcmV0dXJuIFByb21pc2UucmVqZWN0KHN0ZGVycilcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY2xlYW51cFxyXG4gICAgICAgICAgICAgICAgICAgIGZzLnJtZGlyU3luYyhmcmFtZXMsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlbGV0ZU9yaWdpbmFsKSBmcy5ybVN5bmMocGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIGZpbGVuYW1lKSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dIFN1Y2Nlc3MhXFxuJylcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hdGVXaXRoRXJyb3IoYFtmYXRhbF0gJHtlcnJ9YClcclxuICAgICAgICAgICAgICAgICAgICBmcy5ybWRpclN5bmMoZnJhbWVzLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgY29udmVydFBuZ1RvSWNvKGZpbGVOYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBuZXdOYW1lID0gZmlsZU5hbWUuc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpLnNwbGl0KCcuJylbMF0gKyAnLmljbyc7XHJcbiAgICAgICAgICAgIHBuZ1RvSWNvKGZpbGVOYW1lKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oYnVmID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKG5ld05hbWUsIGJ1Zik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShuZXdOYW1lKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydCBkZWZhdWx0IEltYWdlVG9vbDsiLCAiY29uc3QgZnMgPSByZXF1aXJlKCdmcycpXHJcbmNvbnN0IHsgcmVhZGRpciB9ID0gcmVxdWlyZSgnZnMnKS5wcm9taXNlcztcclxuY29uc3QgV09SS1NQQUNFX0RJUiA9ICd3b3Jrc3BhY2UnO1xyXG5cclxuaW1wb3J0IEltYWdlVG9vbCBmcm9tICcuL2ltYWdlVG9vbCc7XHJcblxyXG5jbGFzcyBGb2xkZXJUb29sIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhXT1JLU1BBQ0VfRElSKSkge1xyXG4gICAgICAgICAgICBmcy5ta2RpclN5bmMoV09SS1NQQUNFX0RJUik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY3JlYXRlRm9sZGVyKFwiaW5wdXRcIik7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVGb2xkZXIoXCJvdXRwdXRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlRm9sZGVyKGZvbGRlck5hbWUpIHtcclxuICAgICAgICB2YXIgdXJsID0gV09SS1NQQUNFX0RJUiArIFwiL1wiICsgZm9sZGVyTmFtZTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmModXJsKSkge1xyXG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKHVybCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tIEdFTkVSQUwgVE9PTFNcclxuXHJcbiAgICBhc3luYyByZWFkRm9sZGVyKGRpck5hbWUpIHtcclxuICAgICAgICBsZXQgZmlsZXMgPSBbXTtcclxuICAgICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHJlYWRkaXIoZGlyTmFtZSwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW0uaXNEaXJlY3RvcnkoKSkge1xyXG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gKTtcclxuICAgICAgICAgICAgICAgIGZpbGVzID0gW1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLmZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgIC4uLihhd2FpdCB0aGlzLnJlYWRGb2xkZXIoYCR7ZGlyTmFtZX0vJHtpdGVtLm5hbWV9YCkpLFxyXG4gICAgICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goYCR7ZGlyTmFtZX0vJHtpdGVtLm5hbWV9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIChmaWxlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVhZEZpbGUoZmlsZVBhdGgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgZnMucmVhZEZpbGUoZmlsZVBhdGgsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXQgPSBCdWZmZXIuZnJvbShkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXQudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShcImVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKFwiZXJyb3JcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB3cml0ZUZpbGUoZmlsZVBhdGgsIHRleHQpIHtcclxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCB0ZXh0LCBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB1cGxvYWRGaWxlKGZpbGVQYXRoLCBidWZmZXIpIHtcclxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCBCdWZmZXIuZnJvbShidWZmZXIpLCBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZW5hbWVGaWxlKG9sZHVybCwgbmV3dXJsKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlbmFtZWQgJyArIG9sZHVybCArICcgaW50byAnICsgbmV3dXJsKTtcclxuICAgICAgICAgICAgaWYgKG5ld3VybC5zcGxpdChcIi5cIikubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIG5ld3VybCArPSBcIi53ZWJwXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnMucmVuYW1lKG9sZHVybCwgbmV3dXJsLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBGb2xkZXJUb29sOyJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0JBQXlEO0FBQ3pELGtCQUFpQjtBQUNqQixnQkFBZTs7O0FDRGYsSUFBTSxrQkFBa0IsUUFBUTtBQUNoQyxJQUFNLFVBQVUsUUFBUTtBQUN4QixJQUFNLFlBQVksUUFBUSxnQkFBZ0I7QUFFMUMsSUFBTSxXQUFXLFFBQVE7QUFFekIsSUFBTSxRQUFRLFFBQVE7QUFDdEIsSUFBTSxPQUFPLFFBQVE7QUFDckIsSUFBTSxPQUFPLFFBQVE7QUFFckIsSUFBTSxxQkFBcUIsQ0FBQyxRQUFRLG9CQUFvQjtBQUNwRCxVQUFRLElBQUksS0FBSztBQUVyQjtBQUVBLElBQU0sT0FBTyxLQUFLLFVBQVUsTUFBTSxJQUFJO0FBRXRDLElBQU0sT0FBTyxRQUFRO0FBQ3JCLEtBQUssaUJBQWlCO0FBRXRCLElBQU0sS0FBSyxRQUFRO0FBRW5CLElBQU0sWUFBTixNQUFnQjtBQUFBLEVBQ1osY0FBYztBQUFBLEVBRWQ7QUFBQSxFQUVBLGFBQWEsbUJBQW1CLFdBQVc7QUFDdkMsV0FBTyxJQUFJLFFBQVEsT0FBTSxZQUFZO0FBQ2pDLFVBQUk7QUFDQSxZQUFJLFNBQVMsVUFBVSxNQUFNLEdBQUcsRUFBRSxLQUFLO0FBQ3ZDLGlCQUFTLE9BQU8sTUFBTSxTQUFTLEVBQUUsS0FBSyxVQUFVO0FBQ2hELGNBQU0sU0FBUyxLQUFLLE1BQU0sV0FBVyxRQUFRLFNBQVMsSUFBSTtBQUMxRCxlQUFPLEtB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SSxHQUFHLFlBQVksTUFBTTtBQUNyQixNQUFJLGVBQWUsTUFBTTtBQUNyQixpQkFBYTtBQUFBLEVBQ2pCO0FBQ0osQ0FBQztBQUdELHdCQUFRLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxTQUFTO0FBQ3hDLGFBQVcsa0JBQWtCLEtBQUssTUFBTSxLQUFLLElBQUk7QUFDckQsQ0FBQztBQUVELHdCQUFRLE9BQU8sZUFBZSxPQUFNLEdBQUcsU0FBUztBQUM1QyxTQUFPLE1BQU0sV0FBVyxlQUFlLEtBQUssSUFBSTtBQUNwRCxDQUFDO0FBQ0Qsd0JBQVEsT0FBTyxpQkFBaUIsT0FBTSxHQUFHLFNBQVM7QUFDOUMsU0FBTyxXQUFXLGlCQUFpQixLQUFLLElBQUk7QUFDaEQsQ0FBQztBQUNELHdCQUFRLE9BQU8sb0JBQW9CLE9BQU0sR0FBRyxTQUFTO0FBQ2pELFNBQU8sTUFBTSxrQkFBVSxtQkFBbUIsS0FBSyxHQUFHO0FBQ3RELENBQUM7QUFDRCx3QkFBUSxPQUFPLG9CQUFvQixPQUFNLEdBQUcsU0FBUztBQUNqRCxTQUFPLE1BQU0sa0JBQVUsaUJBQWlCLEtBQUssR0FBRztBQUNwRCxDQUFDO0FBQ0Qsd0JBQVEsT0FBTyxtQkFBbUIsT0FBTSxHQUFHLFNBQVM7QUFDaEQsU0FBTyxNQUFNLGtCQUFVLGdCQUFnQixLQUFLLEdBQUc7QUFDbkQsQ0FBQztBQUNELHdCQUFRLE9BQU8sZUFBZSxPQUFNLEdBQUcsU0FBUztBQUM1QyxTQUFPLE1BQU0sa0JBQVUsV0FBVyxLQUFLLEdBQUc7QUFDOUMsQ0FBQztBQUNELHdCQUFRLE9BQU8saUJBQWlCLE9BQU0sR0FBRyxTQUFTO0FBQzlDLFNBQU8sTUFBTSxrQkFBVSxrQkFBa0IsS0FBSyxHQUFHO0FBQ3JELENBQUM7QUFDRCx3QkFBUSxPQUFPLGFBQWEsT0FBTSxHQUFHLFNBQVM7QUFDMUMsU0FBTyxNQUFNLFdBQVcsU0FBUyxLQUFLLElBQUk7QUFDOUMsQ0FBQztBQUNELHdCQUFRLEdBQUcsY0FBYyxDQUFDLEdBQUcsU0FBUztBQUNsQyxhQUFXLFdBQVcsS0FBSyxTQUFTLEtBQUssT0FBTztBQUNwRCxDQUFDO0FBQ0Qsd0JBQVEsR0FBRyxjQUFjLENBQUMsR0FBRyxTQUFTO0FBQ2xDLGFBQVcsVUFBVSxLQUFLLE1BQU0sS0FBSyxJQUFJO0FBQzdDLENBQUM7QUFDRCx3QkFBUSxHQUFHLGNBQWMsQ0FBQyxHQUFHLFNBQVM7QUFDbEMsYUFBVyxXQUFXLEtBQUssTUFBTSxLQUFLLE1BQU07QUFDaEQsQ0FBQzsiLAogICJuYW1lcyI6IFsiZnMiLCAib3MiLCAicGF0aCJdCn0K
