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

// src-electron/services/folderTool.js
var fs = require("fs");
var { readdir } = require("fs").promises;
var WORKSPACE_DIR = "wololo";
var path = require("path");
var FolderTool = class {
  constructor(app2) {
    this.BASE_PATH = app2.getPath("userData");
    this.WORKSPACE_DIR = WORKSPACE_DIR;
    if (!fs.existsSync(this.BASE_PATH + "/" + WORKSPACE_DIR)) {
      fs.mkdirSync(this.BASE_PATH + "/" + WORKSPACE_DIR);
    }
    this.createFolder("input");
    this.createFolder("output");
  }
  getBaseFolderUrl() {
    return this.BASE_PATH + "/" + this.WORKSPACE_DIR;
  }
  async clearFolder() {
    const folderName = this.getBaseFolderUrl() + "/input";
    const folderName2 = this.getBaseFolderUrl() + "/output";
    const files = await this.readFolder(folderName);
    const files2 = await this.readFolder(folderName2);
    for (const file of files) {
      fs.unlinkSync(file, (err) => {
        if (err)
          throw err;
      });
    }
    for (const file of files2) {
      fs.unlinkSync(file, (err) => {
        if (err)
          throw err;
      });
    }
    return true;
  }
  createFolder(folderName) {
    var url = this.BASE_PATH + "/" + WORKSPACE_DIR + "/" + folderName;
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
        fs.readFile(filePath, function(err, data) {
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
    fs.writeFileSync(filePath, text, function(err) {
      if (err) {
        return console.log(err);
      }
    });
  }
  uploadFile(filePath, buffer) {
    var savePath = this.BASE_PATH + "/" + WORKSPACE_DIR + "/input/" + filePath;
    fs.writeFileSync(savePath, Buffer.from(buffer), function(err) {
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
      fs.rename(oldurl, newurl, function(e) {
        console.log(e);
      });
    } catch (e) {
      console.log(e);
    }
  }
};
var folderTool_default = FolderTool;

// src-electron/services/imageTool.js
var import_background_removal_node = require("@imgly/background-removal-node");
var WebpImage = require("node-webpmux").Image;
var pngToIco = require("png-to-ico");
var child = require("child_process");
var path2 = require("path");
var util = require("util");
var terminateWithError = (error = "[fatal] error") => {
  console.log(error);
};
var exec = util.promisify(child.exec);
var webp = require("webp-converter");
var fs2 = require("fs");
var ImageTool = class {
  constructor(folderTool2) {
    this.folderTool = folderTool2;
  }
  static async convertImageToWebp(imagePath) {
    return new Promise(async (resolve, error) => {
      try {
        var resUrl = imagePath.split(".")[0] + ".webp";
        resUrl = resUrl.split("/input/").join("/output/");
        const result = webp.cwebp(imagePath, resUrl, "-q 80", "-v");
        result.then((response) => {
          fs2.unlinkSync(imagePath);
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
        fs2.unlinkSync(imagePath);
        ffmpeg.kill();
        resolve(imagePath.split(".")[0] + "1.webm");
      }).on("error", (e) => error(e)).run();
    });
  }
  static async clipVideo(videoPath, startTime, duration) {
    const ext = path2.extname(videoPath);
    const outName = videoPath.split(".")[0] + "_clip" + ext;
    return new Promise(async (resolve, error) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath("./resources/ffmpeg/ffprobe.exe").setFfmpegPath("./resources/ffmpeg/ffmpeg.exe");
      ffmpeg.input(videoPath).output(outName).setStartTime(startTime).setDuration(duration).on("end", (e) => {
        console.log("Generated !");
        fs2.unlinkSync(videoPath);
        ffmpeg.kill();
        resolve(outName);
      }).on("error", (e) => error(e)).run();
    });
  }
  static async cropVideo(videoPath, x, y, w, h) {
    const ext = path2.extname(videoPath);
    const outName = videoPath.split(".")[0] + "_crop" + ext;
    return new Promise(async (resolve, error) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath("./resources/ffmpeg/ffprobe.exe").setFfmpegPath("./resources/ffmpeg/ffmpeg.exe");
      ffmpeg.input(videoPath).output(outName).videoFilters([{
        filter: "crop",
        options: {
          x,
          y,
          out_w: w,
          out_h: h
        }
      }]).on("end", (e) => {
        console.log("Generated !");
        fs2.unlinkSync(videoPath);
        ffmpeg.kill();
        resolve(outName);
      }).on("error", (e) => error(e)).run();
    });
  }
  static async convertGifToWebm(imagePath) {
    var resUrl = imagePath.split("/input/").join("/output/").split(".")[0] + ".webm";
    return new Promise(async (resolve, error) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath("./resources/ffmpeg/ffprobe.exe").setFfmpegPath("./resources/ffmpeg/ffmpeg.exe");
      ffmpeg.input(imagePath).noAudio().outputOptions("-pix_fmt yuv420p").output(resUrl).size("720x?").on("end", (e) => {
        console.log("Generated !");
        fs2.unlinkSync(imagePath);
        ffmpeg.kill();
        resolve(resUrl);
      }).on("error", (e) => error(e)).run();
    });
  }
  static async convertWebpToWebmNew(filename) {
    return new Promise((resolve, error) => {
      const nameWithoutExt = filename.replace(".webp", "");
      const frames = path2.resolve(process.cwd(), "frames");
      const deleteOriginal = true;
      if (fs2.existsSync(frames))
        fs2.rmdirSync(frames, { recursive: true });
      fs2.mkdirSync(frames);
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
        const dump = path2.resolve(frames, "dump_%04d.png");
        const command = `ffmpeg -framerate ${framerate} -i "${dump}" "${nameWithoutExt}.webm" -y`;
        console.log("[info]", command);
        return exec(command);
      }).then(({ stdout, stderr }) => {
        if (/error/gm.test(stderr))
          return Promise.reject(stderr);
        fs2.rmdirSync(frames, { recursive: true });
        if (deleteOriginal)
          fs2.rmSync(path2.resolve(process.cwd(), filename));
        resolve(true);
        console.log("[info] Success!\n");
      }).catch((err) => {
        error(err);
        terminateWithError(`[fatal] ${err}`);
        fs2.rmdirSync(frames, { recursive: true });
      });
    });
  }
  static convertPngToIco(fileName) {
    return new Promise((resolve, error) => {
      var newName = fileName.split("/input/").join("/output/").split(".")[0] + ".ico";
      pngToIco(fileName).then((buf) => {
        fs2.writeFileSync(newName, buf);
        resolve(newName);
      }).catch((err) => {
        error(err);
      });
    });
  }
  async removeImageBackground(imgSource) {
    try {
      const imageBuffer = fs2.readFileSync(imgSource);
      const blob = new Blob([imageBuffer], { type: "image/png" });
      var newName = imgSource.split("/input/").join("/output/");
      return new Promise((resolve) => {
        (0, import_background_removal_node.removeBackground)(blob).then(async (blob2) => {
          const buffer = Buffer.from(await blob2.arrayBuffer());
          fs2.writeFileSync(newName, buffer);
          resolve(newName);
        });
      });
    } catch (e) {
      return e.message;
    }
  }
};
var imageTool_default = ImageTool;

// src-electron/services/videoDownloaderTool.js
var fs3 = require("fs");
var ytdl = require("ytdl-core");
var readline = require("readline");
var cp = require("child_process");
var http = require("http");
var https = require("https");
var VideoDownloaderTool = class {
  constructor(folderTool2) {
    this.folderTool = folderTool2;
  }
  async downloadVideo(url) {
    if (url.split("youtube").length > 1) {
      return await this.downloadYoutubeVideo(url);
    } else if (url.split("xnxx").length > 1) {
      return await this.downloadVideoXnxx(url);
    } else if (url.split("xvideos").length > 1) {
      return await this.downloadVideoXvideos(url);
    }
  }
  async downloadYoutubeVideo(url) {
    const finalPathVideo = this.folderTool.BASE_PATH + "/" + this.folderTool.WORKSPACE_DIR + "/input/" + url.substring(url.length - 5, url.length) + "_v.mp4";
    const finalPathAudio = this.folderTool.BASE_PATH + "/" + this.folderTool.WORKSPACE_DIR + "/input/" + url.substring(url.length - 5, url.length) + "_a.mp3";
    const finalPath = this.folderTool.BASE_PATH + "/" + this.folderTool.WORKSPACE_DIR + "/input/" + url.substring(url.length - 5, url.length) + ".mp4";
    return new Promise((resolve) => {
      try {
        const video = ytdl(url, { quality: "highestvideo" });
        video.pipe(fs3.createWriteStream(finalPathVideo));
        video.on("end", () => {
          const audio = ytdl(url, { quality: "highestaudio" });
          audio.pipe(fs3.createWriteStream(finalPathAudio));
          audio.on("end", () => {
            var ffmpeg = require("fluent-ffmpeg")().setFfprobePath("./resources/ffmpeg/ffprobe.exe").setFfmpegPath("./resources/ffmpeg/ffmpeg.exe");
            ffmpeg.input(finalPathVideo).input(finalPathAudio).addOptions(["-map 0:v", "-map 1:a", "-c:v copy"]).format("mp4").outputOptions("-pix_fmt yuv420p").output(finalPath).on("end", function() {
              fs3.unlinkSync(finalPathAudio);
              fs3.unlinkSync(finalPathVideo);
              ffmpeg.kill();
              resolve(finalPath);
            }).on("error", function(err) {
              console.log("an error happened: " + err.message);
              resolve(err);
            }).run();
          });
        });
        video.on("error", (e) => {
          resolve(null);
        });
      } catch (e) {
        resolve(e);
      }
    });
  }
  async downloadAudio(url) {
    const finalPathAudio = this.folderTool.BASE_PATH + "/" + this.folderTool.WORKSPACE_DIR + "/input/" + url.substring(url.length - 5, url.length) + "_a.mp3";
    return new Promise((resolve) => {
      try {
        const audio = ytdl(url, { quality: "highestaudio" });
        audio.pipe(fs3.createWriteStream(finalPathAudio));
        audio.on("end", () => {
          resolve(finalPathAudio);
        });
        audio.on("error", (e) => {
          resolve(null);
        });
      } catch (e) {
        resolve(e);
      }
    });
  }
  async downloadVideoXnxx(url) {
    return new Promise((resolve) => {
      const request = https.get(url, (response) => {
        let body = "";
        response.on("data", (data) => {
          body += data.toString();
        });
        response.on("end", async () => {
          let videoLink = body.split("html5video_base")[1].split('<a href="')[1];
          videoLink = videoLink.split('"')[0];
          resolve(await this.getFileFromUrl(videoLink));
        });
      });
    });
  }
  async downloadVideoXvideos(url) {
    return new Promise((resolve) => {
      const request = https.get(url, (response) => {
        let body = "";
        response.on("data", (data) => {
          body += data.toString();
        });
        response.on("end", async () => {
          let videoLink = body.split('"contentUrl": "')[1];
          videoLink = videoLink.split('"')[0];
          resolve(await this.getFileFromUrl(videoLink));
        });
      });
    });
  }
  async getFileFromUrl(url) {
    return new Promise((resolve) => {
      const finalPath = this.folderTool.BASE_PATH + "/" + this.folderTool.WORKSPACE_DIR + "/input/" + Math.floor(Math.random() * 5e3) + ".mp4";
      const file = fs3.createWriteStream(finalPath);
      let protocol = http;
      if (url.split(":")[0] === "https") {
        protocol = https;
      }
      const request = protocol.get(url, function(response) {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(finalPath);
        });
      });
    });
  }
};
var videoDownloaderTool_default = VideoDownloaderTool;

// src-electron/electron-main.js
var platform = process.platform || import_os.default.platform();
var mainWindow;
var folderTool = new folderTool_default(import_electron.app);
var videoDownloadTool = new videoDownloaderTool_default(folderTool);
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    icon: import_path.default.resolve(__dirname, "icons/icon.png"),
    width: 1e3,
    height: 600,
    autoHideMenuBar: true,
    resizable: true,
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
import_electron.ipcMain.handle("video:clip", async (e, data) => {
  const fileUrl = await imageTool_default.clipVideo(data.video, data.startTime, data.duration);
  if (fileUrl) {
    return await folderTool.readFile(fileUrl);
  }
  return null;
});
import_electron.ipcMain.handle("video:crop", async (e, data) => {
  const fileUrl = await imageTool_default.cropVideo(data.video, data.x, data.y, data.w, data.h);
  if (fileUrl) {
    return await folderTool.readFile(fileUrl);
  }
  return null;
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
import_electron.ipcMain.handle("video:download", async (e, data) => {
  const file = await videoDownloadTool.downloadVideo(data.url);
  if (file) {
    return await folderTool.readFile(file);
  }
  return null;
});
import_electron.ipcMain.handle("audio:download", async (e, data) => {
  const file = await videoDownloadTool.downloadAudio(data.url);
  if (file) {
    return await folderTool.readFile(file);
  }
  return null;
});
import_electron.ipcMain.handle("img:remove-bg", async (e, data) => {
  const imgTool = new imageTool_default(folderTool);
  return await folderTool.readFile(await imgTool.removeImageBackground(data.img));
});
import_electron.ipcMain.handle("clear", async (e) => {
  return await folderTool.clearFolder();
});
import_electron.ipcMain.on("quit", (e) => {
  import_electron.app.quit();
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjLWVsZWN0cm9uL2VsZWN0cm9uLW1haW4uanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ZvbGRlclRvb2wuanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ltYWdlVG9vbC5qcyIsICIuLi8uLi9zcmMtZWxlY3Ryb24vc2VydmljZXMvdmlkZW9Eb3dubG9hZGVyVG9vbC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93LCBuYXRpdmVUaGVtZSwgaXBjTWFpbiB9IGZyb20gJ2VsZWN0cm9uJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgb3MgZnJvbSAnb3MnXHJcbmltcG9ydCBGb2xkZXJUb29sIGZyb20gJy4vc2VydmljZXMvZm9sZGVyVG9vbCc7XHJcbmltcG9ydCBJbWFnZVRvb2wgZnJvbSAnLi9zZXJ2aWNlcy9pbWFnZVRvb2wnO1xyXG5pbXBvcnQgVmlkZW9Eb3dubG9hZGVyVG9vbCBmcm9tICcuL3NlcnZpY2VzL3ZpZGVvRG93bmxvYWRlclRvb2wnO1xyXG5cclxuLy8gbmVlZGVkIGluIGNhc2UgcHJvY2VzcyBpcyB1bmRlZmluZWQgdW5kZXIgTGludXhcclxuY29uc3QgcGxhdGZvcm0gPSBwcm9jZXNzLnBsYXRmb3JtIHx8IG9zLnBsYXRmb3JtKClcclxuXHJcbmxldCBtYWluV2luZG93XHJcblxyXG5jb25zdCBmb2xkZXJUb29sID0gbmV3IEZvbGRlclRvb2woYXBwKTtcclxuY29uc3QgdmlkZW9Eb3dubG9hZFRvb2wgPSBuZXcgVmlkZW9Eb3dubG9hZGVyVG9vbChmb2xkZXJUb29sKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpbmRvdygpIHtcclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbCB3aW5kb3cgb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBtYWluV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xyXG4gICAgICAgIGljb246IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdpY29ucy9pY29uLnBuZycpLCAvLyB0cmF5IGljb25cclxuICAgICAgICB3aWR0aDogMTAwMCxcclxuICAgICAgICBoZWlnaHQ6IDYwMCxcclxuICAgICAgICBhdXRvSGlkZU1lbnVCYXI6IHRydWUsXHJcbiAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgIHVzZUNvbnRlbnRTaXplOiB0cnVlLFxyXG4gICAgICAgIHdlYlByZWZlcmVuY2VzOiB7XHJcbiAgICAgICAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXHJcbiAgICAgICAgICAgIC8vIE1vcmUgaW5mbzogaHR0cHM6Ly92Mi5xdWFzYXIuZGV2L3F1YXNhci1jbGktdml0ZS9kZXZlbG9waW5nLWVsZWN0cm9uLWFwcHMvZWxlY3Ryb24tcHJlbG9hZC1zY3JpcHRcclxuICAgICAgICAgICAgcHJlbG9hZDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgcHJvY2Vzcy5lbnYuUVVBU0FSX0VMRUNUUk9OX1BSRUxPQUQpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICBtYWluV2luZG93LmxvYWRVUkwocHJvY2Vzcy5lbnYuQVBQX1VSTClcclxuXHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuREVCVUdHSU5HKSB7XHJcbiAgICAgICAgLy8gaWYgb24gREVWIG9yIFByb2R1Y3Rpb24gd2l0aCBkZWJ1ZyBlbmFibGVkXHJcbiAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vcGVuRGV2VG9vbHMoKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyB3ZSdyZSBvbiBwcm9kdWN0aW9uOyBubyBhY2Nlc3MgdG8gZGV2dG9vbHMgcGxzXHJcbiAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vbignZGV2dG9vbHMtb3BlbmVkJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBtYWluV2luZG93LndlYkNvbnRlbnRzLmNsb3NlRGV2VG9vbHMoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgbWFpbldpbmRvdy5vbignY2xvc2VkJywgKCkgPT4ge1xyXG4gICAgICAgIG1haW5XaW5kb3cgPSBudWxsXHJcbiAgICB9KVxyXG59XHJcblxyXG5hcHAud2hlblJlYWR5KCkudGhlbihjcmVhdGVXaW5kb3cpXHJcblxyXG5hcHAub24oJ3dpbmRvdy1hbGwtY2xvc2VkJywgKCkgPT4ge1xyXG4gICAgaWYgKHBsYXRmb3JtICE9PSAnZGFyd2luJykge1xyXG4gICAgICAgIGFwcC5xdWl0KClcclxuICAgIH1cclxufSlcclxuXHJcbmFwcC5vbignYWN0aXZhdGUnLCAoKSA9PiB7XHJcbiAgICBpZiAobWFpbldpbmRvdyA9PT0gbnVsbCkge1xyXG4gICAgICAgIGNyZWF0ZVdpbmRvdygpXHJcbiAgICB9XHJcbn0pXHJcblxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOmNvbnZlcnQ6d2VicCcsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGF3YWl0IEltYWdlVG9vbC5jb252ZXJ0SW1hZ2VUb1dlYnAoZGF0YS5pbWcpKVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOmNvbnZlcnQ6d2VibScsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGF3YWl0IEltYWdlVG9vbC5jb252ZXJ0R2lmVG9XZWJtKGRhdGEuaW1nKSlcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpjb252ZXJ0OmljbycsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGF3YWl0IEltYWdlVG9vbC5jb252ZXJ0UG5nVG9JY28oZGF0YS5pbWcpKVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnd2VibTpyZXNpemUnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgSW1hZ2VUb29sLnJlc2l6ZVdlYm0oZGF0YS5pbWcpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCd2aWRlbzpjbGlwJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgY29uc3QgZmlsZVVybCA9IGF3YWl0IEltYWdlVG9vbC5jbGlwVmlkZW8oZGF0YS52aWRlbywgZGF0YS5zdGFydFRpbWUsIGRhdGEuZHVyYXRpb24pXHJcbiAgICBpZiAoZmlsZVVybCkge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGZpbGVVcmwpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbFxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgndmlkZW86Y3JvcCcsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIGNvbnN0IGZpbGVVcmwgPSBhd2FpdCBJbWFnZVRvb2wuY3JvcFZpZGVvKGRhdGEudmlkZW8sIGRhdGEueCwgZGF0YS55LCBkYXRhLncsIGRhdGEuaClcclxuICAgIGlmIChmaWxlVXJsKSB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZmlsZVVybClcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6Z2V0RnJhbWVzJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IEltYWdlVG9vbC5jb252ZXJ0V2VicFRvV2VibShkYXRhLmltZyk7XHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdmaWxlOnJlYWQnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShkYXRhLnBhdGgpO1xyXG59KVxyXG5pcGNNYWluLm9uKCdpbWc6cmVuYW1lJywgKGUsIGRhdGEpID0+IHtcclxuICAgIGZvbGRlclRvb2wucmVuYW1lRmlsZShkYXRhLm9sZFBhdGgsIGRhdGEubmV3UGF0aClcclxufSlcclxuaXBjTWFpbi5vbignZmlsZTp3cml0ZScsIChlLCBkYXRhKSA9PiB7XHJcbiAgICBmb2xkZXJUb29sLndyaXRlRmlsZShkYXRhLnBhdGgsIGRhdGEudGV4dClcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzp1cGxvYWQnLCAoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGZvbGRlclRvb2wudXBsb2FkRmlsZShkYXRhLnBhdGgsIGRhdGEuYnVmZmVyKTtcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ3ZpZGVvOmRvd25sb2FkJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHZpZGVvRG93bmxvYWRUb29sLmRvd25sb2FkVmlkZW8oZGF0YS51cmwpXHJcbiAgICBpZiAoZmlsZSkge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGZpbGUpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbFxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnYXVkaW86ZG93bmxvYWQnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdmlkZW9Eb3dubG9hZFRvb2wuZG93bmxvYWRBdWRpbyhkYXRhLnVybClcclxuICAgIGlmIChmaWxlKSB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZmlsZSlcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6cmVtb3ZlLWJnJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgY29uc3QgaW1nVG9vbCA9IG5ldyBJbWFnZVRvb2woZm9sZGVyVG9vbClcclxuICAgIHJldHVybiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGF3YWl0IGltZ1Rvb2wucmVtb3ZlSW1hZ2VCYWNrZ3JvdW5kKGRhdGEuaW1nKSlcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2NsZWFyJywgYXN5bmMoZSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wuY2xlYXJGb2xkZXIoKVxyXG59KVxyXG5pcGNNYWluLm9uKCdxdWl0JywgKGUpID0+IHtcclxuICAgIGFwcC5xdWl0KClcclxufSkiLCAiY29uc3QgZnMgPSByZXF1aXJlKCdmcycpXHJcbmNvbnN0IHsgcmVhZGRpciB9ID0gcmVxdWlyZSgnZnMnKS5wcm9taXNlcztcclxuY29uc3QgV09SS1NQQUNFX0RJUiA9ICd3b2xvbG8nO1xyXG5jb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XHJcblxyXG5jbGFzcyBGb2xkZXJUb29sIHtcclxuICAgIGNvbnN0cnVjdG9yKGFwcCkge1xyXG4gICAgICAgIHRoaXMuQkFTRV9QQVRIID0gYXBwLmdldFBhdGgoJ3VzZXJEYXRhJyk7XHJcbiAgICAgICAgdGhpcy5XT1JLU1BBQ0VfRElSID0gV09SS1NQQUNFX0RJUjtcclxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmModGhpcy5CQVNFX1BBVEggKyAnLycgKyBXT1JLU1BBQ0VfRElSKSkge1xyXG4gICAgICAgICAgICBmcy5ta2RpclN5bmModGhpcy5CQVNFX1BBVEggKyAnLycgKyBXT1JLU1BBQ0VfRElSKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jcmVhdGVGb2xkZXIoXCJpbnB1dFwiKTtcclxuICAgICAgICB0aGlzLmNyZWF0ZUZvbGRlcihcIm91dHB1dFwiKTtcclxuXHJcbiAgICB9XHJcbiAgICBnZXRCYXNlRm9sZGVyVXJsKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLkJBU0VfUEFUSCArICcvJyArIHRoaXMuV09SS1NQQUNFX0RJUlxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGNsZWFyRm9sZGVyKCkge1xyXG4gICAgICAgIGNvbnN0IGZvbGRlck5hbWUgPSB0aGlzLmdldEJhc2VGb2xkZXJVcmwoKSArICcvaW5wdXQnXHJcbiAgICAgICAgY29uc3QgZm9sZGVyTmFtZTIgPSB0aGlzLmdldEJhc2VGb2xkZXJVcmwoKSArICcvb3V0cHV0J1xyXG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5yZWFkRm9sZGVyKGZvbGRlck5hbWUpXHJcbiAgICAgICAgY29uc3QgZmlsZXMyID0gYXdhaXQgdGhpcy5yZWFkRm9sZGVyKGZvbGRlck5hbWUyKVxyXG4gICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xyXG4gICAgICAgICAgICBmcy51bmxpbmtTeW5jKGZpbGUsIChlcnIpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlczIpIHtcclxuICAgICAgICAgICAgZnMudW5saW5rU3luYyhmaWxlLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZUZvbGRlcihmb2xkZXJOYW1lKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuQkFTRV9QQVRIICsgJy8nICsgV09SS1NQQUNFX0RJUiArIFwiL1wiICsgZm9sZGVyTmFtZTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmModXJsKSkge1xyXG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKHVybCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tIEdFTkVSQUwgVE9PTFNcclxuXHJcbiAgICBhc3luYyByZWFkRm9sZGVyKGRpck5hbWUpIHtcclxuICAgICAgICBsZXQgZmlsZXMgPSBbXTtcclxuICAgICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHJlYWRkaXIoZGlyTmFtZSwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW0uaXNEaXJlY3RvcnkoKSkge1xyXG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gKTtcclxuICAgICAgICAgICAgICAgIGZpbGVzID0gW1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLmZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgIC4uLihhd2FpdCB0aGlzLnJlYWRGb2xkZXIoYCR7ZGlyTmFtZX0vJHtpdGVtLm5hbWV9YCkpLFxyXG4gICAgICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goYCR7ZGlyTmFtZX0vJHtpdGVtLm5hbWV9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIChmaWxlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVhZEZpbGUoZmlsZVBhdGgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSwgZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKGZpbGVQYXRoLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmV0ID0gQnVmZmVyLmZyb20oZGF0YSkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJldCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgd3JpdGVGaWxlKGZpbGVQYXRoLCB0ZXh0KSB7XHJcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgdGV4dCwgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBsb2FkRmlsZShmaWxlUGF0aCwgYnVmZmVyKSB7XHJcbiAgICAgICAgdmFyIHNhdmVQYXRoID0gdGhpcy5CQVNFX1BBVEggKyAnLycgKyBXT1JLU1BBQ0VfRElSICsgJy9pbnB1dC8nICsgZmlsZVBhdGg7XHJcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhzYXZlUGF0aCwgQnVmZmVyLmZyb20oYnVmZmVyKSwgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coc2F2ZVBhdGgpXHJcbiAgICAgICAgcmV0dXJuIHNhdmVQYXRoO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmFtZUZpbGUob2xkdXJsLCBuZXd1cmwpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVuYW1lZCAnICsgb2xkdXJsICsgJyBpbnRvICcgKyBuZXd1cmwpO1xyXG4gICAgICAgICAgICBpZiAobmV3dXJsLnNwbGl0KFwiLlwiKS5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgbmV3dXJsICs9IFwiLndlYnBcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmcy5yZW5hbWUob2xkdXJsLCBuZXd1cmwsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEZvbGRlclRvb2w7IiwgIi8vIEdpZiB0byBXRUJNIGxpYnJhcnlcclxuY29uc3QgV2VicEltYWdlID0gcmVxdWlyZSgnbm9kZS13ZWJwbXV4JykuSW1hZ2U7XHJcblxyXG5jb25zdCBwbmdUb0ljbyA9IHJlcXVpcmUoJ3BuZy10by1pY28nKTtcclxuXHJcbmNvbnN0IGNoaWxkID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcclxuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKVxyXG5pbXBvcnQgeyByZW1vdmVCYWNrZ3JvdW5kIH0gZnJvbSBcIkBpbWdseS9iYWNrZ3JvdW5kLXJlbW92YWwtbm9kZVwiO1xyXG5cclxuY29uc3QgdGVybWluYXRlV2l0aEVycm9yID0gKGVycm9yID0gJ1tmYXRhbF0gZXJyb3InKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgICAgICAvL3Byb2Nlc3MuZXhpdCgxKVxyXG59XHJcblxyXG5jb25zdCBleGVjID0gdXRpbC5wcm9taXNpZnkoY2hpbGQuZXhlYylcclxuXHJcbmNvbnN0IHdlYnAgPSByZXF1aXJlKCd3ZWJwLWNvbnZlcnRlcicpO1xyXG4vL3dlYnAuZ3JhbnRfcGVybWlzc2lvbigpOyAgLy8gTWFyY2hlIHB0ZXQgcGFzIHN1ciBsZSBQQyBkdSBib3Vsb3RcclxuXHJcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKVxyXG5cclxuY2xhc3MgSW1hZ2VUb29sIHtcclxuICAgIGNvbnN0cnVjdG9yKGZvbGRlclRvb2wpIHtcclxuICAgICAgICB0aGlzLmZvbGRlclRvb2wgPSBmb2xkZXJUb29sXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRJbWFnZVRvV2VicChpbWFnZVBhdGgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSwgZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciByZXNVcmwgPSBpbWFnZVBhdGguc3BsaXQoXCIuXCIpWzBdICsgXCIud2VicFwiO1xyXG4gICAgICAgICAgICAgICAgcmVzVXJsID0gcmVzVXJsLnNwbGl0KCcvaW5wdXQvJykuam9pbignL291dHB1dC8nKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHdlYnAuY3dlYnAoaW1hZ2VQYXRoLCByZXNVcmwsIFwiLXEgODBcIiwgXCItdlwiKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc1VybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUubWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBlcnJvcihlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjb252ZXJ0V2VicFRvV2VibShpbWFnZVBhdGgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb252ZXJ0V2VicFRvV2VibU5ldyhpbWFnZVBhdGgpO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHdlYlBJbWFnZSA9IGF3YWl0IG5ldyBXZWJwSW1hZ2UoKTtcclxuICAgICAgICAgICAgYXdhaXQgd2ViUEltYWdlLmxvYWQoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgaWYgKHdlYlBJbWFnZS5oYXNBbmltKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHdlYlBJbWFnZS5mcmFtZXMgIT09IHVuZGVmaW5lZCAmJiB3ZWJQSW1hZ2UuZnJhbWVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcmFtZXMgPSBbLi4ud2ViUEltYWdlLmZyYW1lc107XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShmcmFtZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgcmVzaXplV2VibShpbWFnZVBhdGgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSwgZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdmFyIGZmbXBlZyA9IHJlcXVpcmUoXCJmbHVlbnQtZmZtcGVnXCIpKClcclxuICAgICAgICAgICAgICAgIC5zZXRGZnByb2JlUGF0aCgnLi9yZXNvdXJjZXMvZmZtcGVnL2ZmcHJvYmUuZXhlJylcclxuICAgICAgICAgICAgICAgIC5zZXRGZm1wZWdQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZtcGVnLmV4ZScpO1xyXG5cclxuICAgICAgICAgICAgZmZtcGVnXHJcbiAgICAgICAgICAgICAgICAuaW5wdXQoaW1hZ2VQYXRoKVxyXG4gICAgICAgICAgICAgICAgLm5vQXVkaW8oKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dE9wdGlvbnMoJy1waXhfZm10IHl1djQyMHAnKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dChpbWFnZVBhdGguc3BsaXQoJy4nKVswXSArIFwiMS53ZWJtXCIpXHJcbiAgICAgICAgICAgICAgICAuc2l6ZSgnNzIweD8nKVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZW5kXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJHZW5lcmF0ZWQgIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmtTeW5jKGltYWdlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmZtcGVnLmtpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGltYWdlUGF0aC5zcGxpdCgnLicpWzBdICsgXCIxLndlYm1cIik7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZXJyb3JcIiwgKGUpID0+IGVycm9yKGUpKS5ydW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY2xpcFZpZGVvKHZpZGVvUGF0aCwgc3RhcnRUaW1lLCBkdXJhdGlvbikge1xyXG4gICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZSh2aWRlb1BhdGgpO1xyXG4gICAgICAgIGNvbnN0IG91dE5hbWUgPSB2aWRlb1BhdGguc3BsaXQoJy4nKVswXSArICdfY2xpcCcgKyBleHRcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSwgZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdmFyIGZmbXBlZyA9IHJlcXVpcmUoXCJmbHVlbnQtZmZtcGVnXCIpKClcclxuICAgICAgICAgICAgICAgIC5zZXRGZnByb2JlUGF0aCgnLi9yZXNvdXJjZXMvZmZtcGVnL2ZmcHJvYmUuZXhlJylcclxuICAgICAgICAgICAgICAgIC5zZXRGZm1wZWdQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZtcGVnLmV4ZScpO1xyXG5cclxuICAgICAgICAgICAgZmZtcGVnXHJcbiAgICAgICAgICAgICAgICAuaW5wdXQodmlkZW9QYXRoKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dChvdXROYW1lKVxyXG4gICAgICAgICAgICAgICAgLnNldFN0YXJ0VGltZShzdGFydFRpbWUpXHJcbiAgICAgICAgICAgICAgICAuc2V0RHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlbmRcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdlbmVyYXRlZCAhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmModmlkZW9QYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICBmZm1wZWcua2lsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUob3V0TmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZXJyb3JcIiwgKGUpID0+IGVycm9yKGUpKS5ydW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY3JvcFZpZGVvKHZpZGVvUGF0aCwgeCwgeSwgdywgaCkge1xyXG4gICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZSh2aWRlb1BhdGgpO1xyXG4gICAgICAgIGNvbnN0IG91dE5hbWUgPSB2aWRlb1BhdGguc3BsaXQoJy4nKVswXSArICdfY3JvcCcgKyBleHRcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSwgZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdmFyIGZmbXBlZyA9IHJlcXVpcmUoXCJmbHVlbnQtZmZtcGVnXCIpKClcclxuICAgICAgICAgICAgICAgIC5zZXRGZnByb2JlUGF0aCgnLi9yZXNvdXJjZXMvZmZtcGVnL2ZmcHJvYmUuZXhlJylcclxuICAgICAgICAgICAgICAgIC5zZXRGZm1wZWdQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZtcGVnLmV4ZScpO1xyXG5cclxuICAgICAgICAgICAgZmZtcGVnXHJcbiAgICAgICAgICAgICAgICAuaW5wdXQodmlkZW9QYXRoKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dChvdXROYW1lKVxyXG4gICAgICAgICAgICAgICAgLnZpZGVvRmlsdGVycyhbe1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogXCJjcm9wXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRfdzogdyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0X2g6IGhcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSwgXSlcclxuICAgICAgICAgICAgICAgIC5vbihcImVuZFwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR2VuZXJhdGVkICFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyh2aWRlb1BhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZmbXBlZy5raWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShvdXROYW1lKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlcnJvclwiLCAoZSkgPT4gZXJyb3IoZSkpLnJ1bigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjb252ZXJ0R2lmVG9XZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHZhciByZXNVcmwgPSBpbWFnZVBhdGguc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpLnNwbGl0KCcuJylbMF0gKyAnLndlYm0nO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZwcm9iZS5leGUnKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZm1wZWcuZXhlJyk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dChpbWFnZVBhdGgpXHJcbiAgICAgICAgICAgICAgICAubm9BdWRpbygpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0T3B0aW9ucygnLXBpeF9mbXQgeXV2NDIwcCcpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KHJlc1VybClcclxuICAgICAgICAgICAgICAgIC5zaXplKCc3MjB4PycpXHJcbiAgICAgICAgICAgICAgICAub24oXCJlbmRcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdlbmVyYXRlZCAhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICBmZm1wZWcua2lsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzVXJsKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlcnJvclwiLCAoZSkgPT4gZXJyb3IoZSkpLnJ1bigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjb252ZXJ0V2VicFRvV2VibU5ldyhmaWxlbmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZVdpdGhvdXRFeHQgPSBmaWxlbmFtZS5yZXBsYWNlKCcud2VicCcsICcnKVxyXG4gICAgICAgICAgICBjb25zdCBmcmFtZXMgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJ2ZyYW1lcycpXHJcbiAgICAgICAgICAgIGNvbnN0IGRlbGV0ZU9yaWdpbmFsID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZyYW1lcykpIGZzLnJtZGlyU3luYyhmcmFtZXMsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyhmcmFtZXMpXHJcblxyXG4gICAgICAgICAgICBwcm9jZXNzLmNoZGlyKCdmcmFtZXMnKVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgcHJvY2Vzcy5jd2QoKSlcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBgYW5pbV9kdW1wIC4uLyR7ZmlsZW5hbWV9YClcclxuICAgICAgICAgICAgZXhlYyhgYW5pbV9kdW1wIC4uLyR7ZmlsZW5hbWV9YClcclxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmNoZGlyKCcuLicpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIHByb2Nlc3MuY3dkKCkpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSBgd2VicG11eCAtaW5mbyAuLyR7ZmlsZW5hbWV9YFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgY29tbWFuZClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhlYyhjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC50aGVuKCh7IHN0ZG91dCwgc3RkZXJyIH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RkZXJyKSByZXR1cm4gUHJvbWlzZS5yZWplY3Qoc3RkZXJyKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0FuaW1hdGlvbiA9IHN0ZG91dC5tYXRjaCgvRmVhdHVyZXMgcHJlc2VudDogYW5pbWF0aW9uLykgIT09IG51bGxcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzQW5pbWF0aW9uKSByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ1RoaXMgaXMgbm90IGFuIGFuaW1hdGVkIHdlYnAgZmlsZScpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0TGluZSA9IHN0ZG91dC5tYXRjaCgvMTouK1tcXHJdP1xcbi9nKVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlyc3RMaW5lKSByZXR1cm5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZnJhbWVMZW5ndGggPSBmaXJzdExpbmVbMF0uc3BsaXQoL1xccysvZylbNl1cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcmFtZXJhdGUgPSBNYXRoLnJvdW5kKDEwMDAgLyBmcmFtZUxlbmd0aCkgLy8gZnJhbWVzL3NlY29uZFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBwYXRoLnJlc29sdmUoZnJhbWVzLCAnZHVtcF8lMDRkLnBuZycpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IGBmZm1wZWcgLWZyYW1lcmF0ZSAke2ZyYW1lcmF0ZX0gLWkgXCIke2R1bXB9XCIgXCIke25hbWVXaXRob3V0RXh0fS53ZWJtXCIgLXlgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleGVjKGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKHsgc3Rkb3V0LCBzdGRlcnIgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgvZXJyb3IvZ20udGVzdChzdGRlcnIpKSByZXR1cm4gUHJvbWlzZS5yZWplY3Qoc3RkZXJyKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjbGVhbnVwXHJcbiAgICAgICAgICAgICAgICAgICAgZnMucm1kaXJTeW5jKGZyYW1lcywgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVsZXRlT3JpZ2luYWwpIGZzLnJtU3luYyhwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgZmlsZW5hbWUpKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10gU3VjY2VzcyFcXG4nKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yKGVycilcclxuICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hdGVXaXRoRXJyb3IoYFtmYXRhbF0gJHtlcnJ9YClcclxuICAgICAgICAgICAgICAgICAgICBmcy5ybWRpclN5bmMoZnJhbWVzLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgY29udmVydFBuZ1RvSWNvKGZpbGVOYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgbmV3TmFtZSA9IGZpbGVOYW1lLnNwbGl0KCcvaW5wdXQvJykuam9pbignL291dHB1dC8nKS5zcGxpdCgnLicpWzBdICsgJy5pY28nO1xyXG4gICAgICAgICAgICBwbmdUb0ljbyhmaWxlTmFtZSlcclxuICAgICAgICAgICAgICAgIC50aGVuKGJ1ZiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhuZXdOYW1lLCBidWYpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobmV3TmFtZSlcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IoZXJyKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlbW92ZUltYWdlQmFja2dyb3VuZChpbWdTb3VyY2UpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBpbWFnZUJ1ZmZlciA9IGZzLnJlYWRGaWxlU3luYyhpbWdTb3VyY2UpO1xyXG4gICAgICAgICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2ltYWdlQnVmZmVyXSwgeyB0eXBlOiBcImltYWdlL3BuZ1wiIH0pO1xyXG4gICAgICAgICAgICB2YXIgbmV3TmFtZSA9IGltZ1NvdXJjZS5zcGxpdCgnL2lucHV0LycpLmpvaW4oJy9vdXRwdXQvJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlQmFja2dyb3VuZChibG9iKS50aGVuKGFzeW5jKGJsb2IyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmZyb20oYXdhaXQgYmxvYjIuYXJyYXlCdWZmZXIoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhuZXdOYW1lLCBidWZmZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobmV3TmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGUubWVzc2FnZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5leHBvcnQgZGVmYXVsdCBJbWFnZVRvb2w7IiwgImNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcclxuY29uc3QgeXRkbCA9IHJlcXVpcmUoJ3l0ZGwtY29yZScpO1xyXG5jb25zdCByZWFkbGluZSA9IHJlcXVpcmUoJ3JlYWRsaW5lJyk7XHJcbmNvbnN0IGNwID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpO1xyXG5jb25zdCBodHRwID0gcmVxdWlyZSgnaHR0cCcpO1xyXG5jb25zdCBodHRwcyA9IHJlcXVpcmUoJ2h0dHBzJyk7XHJcblxyXG5jbGFzcyBWaWRlb0Rvd25sb2FkZXJUb29sIHtcclxuICAgIGNvbnN0cnVjdG9yKGZvbGRlclRvb2wpIHtcclxuICAgICAgICB0aGlzLmZvbGRlclRvb2wgPSBmb2xkZXJUb29sXHJcbiAgICB9XHJcbiAgICBhc3luYyBkb3dubG9hZFZpZGVvKHVybCkge1xyXG4gICAgICAgIGlmICh1cmwuc3BsaXQoJ3lvdXR1YmUnKS5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmRvd25sb2FkWW91dHViZVZpZGVvKHVybCk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh1cmwuc3BsaXQoJ3hueHgnKS5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmRvd25sb2FkVmlkZW9Ybnh4KHVybCk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh1cmwuc3BsaXQoJ3h2aWRlb3MnKS5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmRvd25sb2FkVmlkZW9YdmlkZW9zKHVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgYXN5bmMgZG93bmxvYWRZb3V0dWJlVmlkZW8odXJsKSB7XHJcbiAgICAgICAgY29uc3QgZmluYWxQYXRoVmlkZW8gPSB0aGlzLmZvbGRlclRvb2wuQkFTRV9QQVRIICsgJy8nICsgdGhpcy5mb2xkZXJUb29sLldPUktTUEFDRV9ESVIgKyAnL2lucHV0LycgKyB1cmwuc3Vic3RyaW5nKHVybC5sZW5ndGggLSA1LCB1cmwubGVuZ3RoKSArICdfdi5tcDQnO1xyXG4gICAgICAgIGNvbnN0IGZpbmFsUGF0aEF1ZGlvID0gdGhpcy5mb2xkZXJUb29sLkJBU0VfUEFUSCArICcvJyArIHRoaXMuZm9sZGVyVG9vbC5XT1JLU1BBQ0VfRElSICsgJy9pbnB1dC8nICsgdXJsLnN1YnN0cmluZyh1cmwubGVuZ3RoIC0gNSwgdXJsLmxlbmd0aCkgKyAnX2EubXAzJztcclxuICAgICAgICBjb25zdCBmaW5hbFBhdGggPSB0aGlzLmZvbGRlclRvb2wuQkFTRV9QQVRIICsgJy8nICsgdGhpcy5mb2xkZXJUb29sLldPUktTUEFDRV9ESVIgKyAnL2lucHV0LycgKyB1cmwuc3Vic3RyaW5nKHVybC5sZW5ndGggLSA1LCB1cmwubGVuZ3RoKSArICcubXA0JztcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmlkZW8gPSB5dGRsKHVybCwgeyBxdWFsaXR5OiAnaGlnaGVzdHZpZGVvJyB9KVxyXG4gICAgICAgICAgICAgICAgdmlkZW8ucGlwZShmcy5jcmVhdGVXcml0ZVN0cmVhbShmaW5hbFBhdGhWaWRlbykpXHJcbiAgICAgICAgICAgICAgICB2aWRlby5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ZGlvID0geXRkbCh1cmwsIHsgcXVhbGl0eTogJ2hpZ2hlc3RhdWRpbycgfSlcclxuICAgICAgICAgICAgICAgICAgICBhdWRpby5waXBlKGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbmFsUGF0aEF1ZGlvKSlcclxuICAgICAgICAgICAgICAgICAgICBhdWRpby5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZwcm9iZS5leGUnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZm1wZWcuZXhlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZmbXBlZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmlucHV0KGZpbmFsUGF0aFZpZGVvKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmlucHV0KGZpbmFsUGF0aEF1ZGlvKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZE9wdGlvbnMoWyctbWFwIDA6dicsICctbWFwIDE6YScsICctYzp2IGNvcHknXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mb3JtYXQoJ21wNCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub3V0cHV0T3B0aW9ucygnLXBpeF9mbXQgeXV2NDIwcCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub3V0cHV0KGZpbmFsUGF0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbignZW5kJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMoZmluYWxQYXRoQXVkaW8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMoZmluYWxQYXRoVmlkZW8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZmbXBlZy5raWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShmaW5hbFBhdGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYW4gZXJyb3IgaGFwcGVuZWQ6ICcgKyBlcnIubWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShlcnIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5ydW4oKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB2aWRlby5vbignZXJyb3InLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbClcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBhc3luYyBkb3dubG9hZEF1ZGlvKHVybCkge1xyXG4gICAgICAgIGNvbnN0IGZpbmFsUGF0aEF1ZGlvID0gdGhpcy5mb2xkZXJUb29sLkJBU0VfUEFUSCArICcvJyArIHRoaXMuZm9sZGVyVG9vbC5XT1JLU1BBQ0VfRElSICsgJy9pbnB1dC8nICsgdXJsLnN1YnN0cmluZyh1cmwubGVuZ3RoIC0gNSwgdXJsLmxlbmd0aCkgKyAnX2EubXAzJztcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVkaW8gPSB5dGRsKHVybCwgeyBxdWFsaXR5OiAnaGlnaGVzdGF1ZGlvJyB9KVxyXG4gICAgICAgICAgICAgICAgYXVkaW8ucGlwZShmcy5jcmVhdGVXcml0ZVN0cmVhbShmaW5hbFBhdGhBdWRpbykpXHJcbiAgICAgICAgICAgICAgICBhdWRpby5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZmluYWxQYXRoQXVkaW8pO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIGF1ZGlvLm9uKCdlcnJvcicsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgYXN5bmMgZG93bmxvYWRWaWRlb1hueHgodXJsKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBodHRwcy5nZXQodXJsLCAocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBib2R5ID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGJvZHkgKz0gZGF0YS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmlkZW9MaW5rID0gYm9keS5zcGxpdCgnaHRtbDV2aWRlb19iYXNlJylbMV0uc3BsaXQoJzxhIGhyZWY9XCInKVsxXTtcclxuICAgICAgICAgICAgICAgICAgICB2aWRlb0xpbmsgPSB2aWRlb0xpbmsuc3BsaXQoJ1wiJylbMF1cclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGF3YWl0IHRoaXMuZ2V0RmlsZUZyb21VcmwodmlkZW9MaW5rKSlcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGFzeW5jIGRvd25sb2FkVmlkZW9YdmlkZW9zKHVybCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gaHR0cHMuZ2V0KHVybCwgKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBib2R5ICs9IGRhdGEudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdlbmQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZpZGVvTGluayA9IGJvZHkuc3BsaXQoJ1wiY29udGVudFVybFwiOiBcIicpWzFdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZpZGVvTGluayA9IHZpZGVvTGluay5zcGxpdCgnXCInKVswXVxyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXdhaXQgdGhpcy5nZXRGaWxlRnJvbVVybCh2aWRlb0xpbmspKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgZ2V0RmlsZUZyb21VcmwodXJsKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbmFsUGF0aCA9IHRoaXMuZm9sZGVyVG9vbC5CQVNFX1BBVEggKyAnLycgKyB0aGlzLmZvbGRlclRvb2wuV09SS1NQQUNFX0RJUiArICcvaW5wdXQvJyArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUwMDApICsgJy5tcDQnO1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0oZmluYWxQYXRoKTtcclxuICAgICAgICAgICAgbGV0IHByb3RvY29sID0gaHR0cFxyXG4gICAgICAgICAgICBpZiAodXJsLnNwbGl0KCc6JylbMF0gPT09ICdodHRwcycpIHtcclxuICAgICAgICAgICAgICAgIHByb3RvY29sID0gaHR0cHNcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gcHJvdG9jb2wuZ2V0KHVybCwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZS5waXBlKGZpbGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGFmdGVyIGRvd25sb2FkIGNvbXBsZXRlZCBjbG9zZSBmaWxlc3RyZWFtXHJcbiAgICAgICAgICAgICAgICBmaWxlLm9uKFwiZmluaXNoXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmaWxlLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShmaW5hbFBhdGgpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5leHBvcnQgZGVmYXVsdCBWaWRlb0Rvd25sb2FkZXJUb29sOyJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0JBQXlEO0FBQ3pELGtCQUFpQjtBQUNqQixnQkFBZTs7O0FDRmYsSUFBTSxLQUFLLFFBQVE7QUFDbkIs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QUM7QUFDRCx3QkFBUSxHQUFHLGNBQWMsQ0FBQyxHQUFHLFNBQVM7QUFDbEMsYUFBVyxVQUFVLEtBQUssTUFBTSxLQUFLLElBQUk7QUFDN0MsQ0FBQztBQUNELHdCQUFRLE9BQU8sY0FBYyxDQUFDLEdBQUcsU0FBUztBQUN0QyxTQUFPLFdBQVcsV0FBVyxLQUFLLE1BQU0sS0FBSyxNQUFNO0FBQ3ZELENBQUM7QUFDRCx3QkFBUSxPQUFPLGtCQUFrQixPQUFNLEdBQUcsU0FBUztBQUMvQyxRQUFNLE9BQU8sTUFBTSxrQkFBa0IsY0FBYyxLQUFLLEdBQUc7QUFDM0QsTUFBSSxNQUFNO0FBQ04sV0FBTyxNQUFNLFdBQVcsU0FBUyxJQUFJO0FBQUEsRUFDekM7QUFDQSxTQUFPO0FBQ1gsQ0FBQztBQUNELHdCQUFRLE9BQU8sa0JBQWtCLE9BQU0sR0FBRyxTQUFTO0FBQy9DLFFBQU0sT0FBTyxNQUFNLGtCQUFrQixjQUFjLEtBQUssR0FBRztBQUMzRCxNQUFJLE1BQU07QUFDTixXQUFPLE1BQU0sV0FBVyxTQUFTLElBQUk7QUFBQSxFQUN6QztBQUNBLFNBQU87QUFDWCxDQUFDO0FBQ0Qsd0JBQVEsT0FBTyxpQkFBaUIsT0FBTSxHQUFHLFNBQVM7QUFDOUMsUUFBTSxVQUFVLElBQUksa0JBQVUsVUFBVTtBQUN4QyxTQUFPLE1BQU0sV0FBVyxTQUFTLE1BQU0sUUFBUSxzQkFBc0IsS0FBSyxHQUFHLENBQUM7QUFDbEYsQ0FBQztBQUNELHdCQUFRLE9BQU8sU0FBUyxPQUFNLE1BQU07QUFDaEMsU0FBTyxNQUFNLFdBQVcsWUFBWTtBQUN4QyxDQUFDO0FBQ0Qsd0JBQVEsR0FBRyxRQUFRLENBQUMsTUFBTTtBQUN0QixzQkFBSSxLQUFLO0FBQ2IsQ0FBQzsiLAogICJuYW1lcyI6IFsiYXBwIiwgInBhdGgiLCAiZnMiLCAiZm9sZGVyVG9vbCIsICJmcyIsICJmb2xkZXJUb29sIiwgIm9zIiwgInBhdGgiXQp9Cg==
