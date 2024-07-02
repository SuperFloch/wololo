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
  static async convertToGif(imagePath) {
    var resUrl = imagePath.split("/input/").join("/output/").split(".")[0] + ".gif";
    return new Promise(async (resolve, error) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath("./resources/ffmpeg/ffprobe.exe").setFfmpegPath("./resources/ffmpeg/ffmpeg.exe");
      ffmpeg.input(imagePath).output(resUrl).on("end", (e) => {
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
import_electron.ipcMain.handle("img:convert:gif", async (e, data) => {
  return await folderTool.readFile(await imageTool_default.convertToGif(data.img));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjLWVsZWN0cm9uL2VsZWN0cm9uLW1haW4uanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ZvbGRlclRvb2wuanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ltYWdlVG9vbC5qcyIsICIuLi8uLi9zcmMtZWxlY3Ryb24vc2VydmljZXMvdmlkZW9Eb3dubG9hZGVyVG9vbC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93LCBuYXRpdmVUaGVtZSwgaXBjTWFpbiB9IGZyb20gJ2VsZWN0cm9uJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgb3MgZnJvbSAnb3MnXHJcbmltcG9ydCBGb2xkZXJUb29sIGZyb20gJy4vc2VydmljZXMvZm9sZGVyVG9vbCc7XHJcbmltcG9ydCBJbWFnZVRvb2wgZnJvbSAnLi9zZXJ2aWNlcy9pbWFnZVRvb2wnO1xyXG5pbXBvcnQgVmlkZW9Eb3dubG9hZGVyVG9vbCBmcm9tICcuL3NlcnZpY2VzL3ZpZGVvRG93bmxvYWRlclRvb2wnO1xyXG5cclxuLy8gbmVlZGVkIGluIGNhc2UgcHJvY2VzcyBpcyB1bmRlZmluZWQgdW5kZXIgTGludXhcclxuY29uc3QgcGxhdGZvcm0gPSBwcm9jZXNzLnBsYXRmb3JtIHx8IG9zLnBsYXRmb3JtKClcclxuXHJcbmxldCBtYWluV2luZG93XHJcblxyXG5jb25zdCBmb2xkZXJUb29sID0gbmV3IEZvbGRlclRvb2woYXBwKTtcclxuY29uc3QgdmlkZW9Eb3dubG9hZFRvb2wgPSBuZXcgVmlkZW9Eb3dubG9hZGVyVG9vbChmb2xkZXJUb29sKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpbmRvdygpIHtcclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbCB3aW5kb3cgb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBtYWluV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xyXG4gICAgICAgIGljb246IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdpY29ucy9pY29uLnBuZycpLCAvLyB0cmF5IGljb25cclxuICAgICAgICB3aWR0aDogMTAwMCxcclxuICAgICAgICBoZWlnaHQ6IDYwMCxcclxuICAgICAgICBhdXRvSGlkZU1lbnVCYXI6IHRydWUsXHJcbiAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgIHVzZUNvbnRlbnRTaXplOiB0cnVlLFxyXG4gICAgICAgIHdlYlByZWZlcmVuY2VzOiB7XHJcbiAgICAgICAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXHJcbiAgICAgICAgICAgIC8vIE1vcmUgaW5mbzogaHR0cHM6Ly92Mi5xdWFzYXIuZGV2L3F1YXNhci1jbGktdml0ZS9kZXZlbG9waW5nLWVsZWN0cm9uLWFwcHMvZWxlY3Ryb24tcHJlbG9hZC1zY3JpcHRcclxuICAgICAgICAgICAgcHJlbG9hZDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgcHJvY2Vzcy5lbnYuUVVBU0FSX0VMRUNUUk9OX1BSRUxPQUQpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICBtYWluV2luZG93LmxvYWRVUkwocHJvY2Vzcy5lbnYuQVBQX1VSTClcclxuXHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuREVCVUdHSU5HKSB7XHJcbiAgICAgICAgLy8gaWYgb24gREVWIG9yIFByb2R1Y3Rpb24gd2l0aCBkZWJ1ZyBlbmFibGVkXHJcbiAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vcGVuRGV2VG9vbHMoKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyB3ZSdyZSBvbiBwcm9kdWN0aW9uOyBubyBhY2Nlc3MgdG8gZGV2dG9vbHMgcGxzXHJcbiAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vbignZGV2dG9vbHMtb3BlbmVkJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBtYWluV2luZG93LndlYkNvbnRlbnRzLmNsb3NlRGV2VG9vbHMoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgbWFpbldpbmRvdy5vbignY2xvc2VkJywgKCkgPT4ge1xyXG4gICAgICAgIG1haW5XaW5kb3cgPSBudWxsXHJcbiAgICB9KVxyXG59XHJcblxyXG5hcHAud2hlblJlYWR5KCkudGhlbihjcmVhdGVXaW5kb3cpXHJcblxyXG5hcHAub24oJ3dpbmRvdy1hbGwtY2xvc2VkJywgKCkgPT4ge1xyXG4gICAgaWYgKHBsYXRmb3JtICE9PSAnZGFyd2luJykge1xyXG4gICAgICAgIGFwcC5xdWl0KClcclxuICAgIH1cclxufSlcclxuXHJcbmFwcC5vbignYWN0aXZhdGUnLCAoKSA9PiB7XHJcbiAgICBpZiAobWFpbldpbmRvdyA9PT0gbnVsbCkge1xyXG4gICAgICAgIGNyZWF0ZVdpbmRvdygpXHJcbiAgICB9XHJcbn0pXHJcblxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOmNvbnZlcnQ6d2VicCcsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGF3YWl0IEltYWdlVG9vbC5jb252ZXJ0SW1hZ2VUb1dlYnAoZGF0YS5pbWcpKVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOmNvbnZlcnQ6Z2lmJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRUb0dpZihkYXRhLmltZykpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6Y29udmVydDp3ZWJtJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRHaWZUb1dlYm0oZGF0YS5pbWcpKVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOmNvbnZlcnQ6aWNvJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRQbmdUb0ljbyhkYXRhLmltZykpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCd3ZWJtOnJlc2l6ZScsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCBJbWFnZVRvb2wucmVzaXplV2VibShkYXRhLmltZylcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ3ZpZGVvOmNsaXAnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICBjb25zdCBmaWxlVXJsID0gYXdhaXQgSW1hZ2VUb29sLmNsaXBWaWRlbyhkYXRhLnZpZGVvLCBkYXRhLnN0YXJ0VGltZSwgZGF0YS5kdXJhdGlvbilcclxuICAgIGlmIChmaWxlVXJsKSB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZmlsZVVybClcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCd2aWRlbzpjcm9wJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgY29uc3QgZmlsZVVybCA9IGF3YWl0IEltYWdlVG9vbC5jcm9wVmlkZW8oZGF0YS52aWRlbywgZGF0YS54LCBkYXRhLnksIGRhdGEudywgZGF0YS5oKVxyXG4gICAgaWYgKGZpbGVVcmwpIHtcclxuICAgICAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShmaWxlVXJsKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGxcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpnZXRGcmFtZXMnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRXZWJwVG9XZWJtKGRhdGEuaW1nKTtcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ZpbGU6cmVhZCcsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGRhdGEucGF0aCk7XHJcbn0pXHJcbmlwY01haW4ub24oJ2ltZzpyZW5hbWUnLCAoZSwgZGF0YSkgPT4ge1xyXG4gICAgZm9sZGVyVG9vbC5yZW5hbWVGaWxlKGRhdGEub2xkUGF0aCwgZGF0YS5uZXdQYXRoKVxyXG59KVxyXG5pcGNNYWluLm9uKCdmaWxlOndyaXRlJywgKGUsIGRhdGEpID0+IHtcclxuICAgIGZvbGRlclRvb2wud3JpdGVGaWxlKGRhdGEucGF0aCwgZGF0YS50ZXh0KVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOnVwbG9hZCcsIChlLCBkYXRhKSA9PiB7XHJcbiAgICByZXR1cm4gZm9sZGVyVG9vbC51cGxvYWRGaWxlKGRhdGEucGF0aCwgZGF0YS5idWZmZXIpO1xyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgndmlkZW86ZG93bmxvYWQnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdmlkZW9Eb3dubG9hZFRvb2wuZG93bmxvYWRWaWRlbyhkYXRhLnVybClcclxuICAgIGlmIChmaWxlKSB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZmlsZSlcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdhdWRpbzpkb3dubG9hZCcsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB2aWRlb0Rvd25sb2FkVG9vbC5kb3dubG9hZEF1ZGlvKGRhdGEudXJsKVxyXG4gICAgaWYgKGZpbGUpIHtcclxuICAgICAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5yZWFkRmlsZShmaWxlKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGxcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ltZzpyZW1vdmUtYmcnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICBjb25zdCBpbWdUb29sID0gbmV3IEltYWdlVG9vbChmb2xkZXJUb29sKVxyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoYXdhaXQgaW1nVG9vbC5yZW1vdmVJbWFnZUJhY2tncm91bmQoZGF0YS5pbWcpKVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnY2xlYXInLCBhc3luYyhlKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5jbGVhckZvbGRlcigpXHJcbn0pXHJcbmlwY01haW4ub24oJ3F1aXQnLCAoZSkgPT4ge1xyXG4gICAgYXBwLnF1aXQoKVxyXG59KSIsICJjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJylcclxuY29uc3QgeyByZWFkZGlyIH0gPSByZXF1aXJlKCdmcycpLnByb21pc2VzO1xyXG5jb25zdCBXT1JLU1BBQ0VfRElSID0gJ3dvbG9sbyc7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuXHJcbmNsYXNzIEZvbGRlclRvb2wge1xyXG4gICAgY29uc3RydWN0b3IoYXBwKSB7XHJcbiAgICAgICAgdGhpcy5CQVNFX1BBVEggPSBhcHAuZ2V0UGF0aCgndXNlckRhdGEnKTtcclxuICAgICAgICB0aGlzLldPUktTUEFDRV9ESVIgPSBXT1JLU1BBQ0VfRElSO1xyXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyh0aGlzLkJBU0VfUEFUSCArICcvJyArIFdPUktTUEFDRV9ESVIpKSB7XHJcbiAgICAgICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLkJBU0VfUEFUSCArICcvJyArIFdPUktTUEFDRV9ESVIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNyZWF0ZUZvbGRlcihcImlucHV0XCIpO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRm9sZGVyKFwib3V0cHV0XCIpO1xyXG5cclxuICAgIH1cclxuICAgIGdldEJhc2VGb2xkZXJVcmwoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuQkFTRV9QQVRIICsgJy8nICsgdGhpcy5XT1JLU1BBQ0VfRElSXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgY2xlYXJGb2xkZXIoKSB7XHJcbiAgICAgICAgY29uc3QgZm9sZGVyTmFtZSA9IHRoaXMuZ2V0QmFzZUZvbGRlclVybCgpICsgJy9pbnB1dCdcclxuICAgICAgICBjb25zdCBmb2xkZXJOYW1lMiA9IHRoaXMuZ2V0QmFzZUZvbGRlclVybCgpICsgJy9vdXRwdXQnXHJcbiAgICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLnJlYWRGb2xkZXIoZm9sZGVyTmFtZSlcclxuICAgICAgICBjb25zdCBmaWxlczIgPSBhd2FpdCB0aGlzLnJlYWRGb2xkZXIoZm9sZGVyTmFtZTIpXHJcbiAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XHJcbiAgICAgICAgICAgIGZzLnVubGlua1N5bmMoZmlsZSwgKGVycikgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzMikge1xyXG4gICAgICAgICAgICBmcy51bmxpbmtTeW5jKGZpbGUsIChlcnIpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHRocm93IGVycjtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlRm9sZGVyKGZvbGRlck5hbWUpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5CQVNFX1BBVEggKyAnLycgKyBXT1JLU1BBQ0VfRElSICsgXCIvXCIgKyBmb2xkZXJOYW1lO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyh1cmwpKSB7XHJcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmModXJsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0gR0VORVJBTCBUT09MU1xyXG5cclxuICAgIGFzeW5jIHJlYWRGb2xkZXIoZGlyTmFtZSkge1xyXG4gICAgICAgIGxldCBmaWxlcyA9IFtdO1xyXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgcmVhZGRpcihkaXJOYW1lLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5pc0RpcmVjdG9yeSgpKSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlcy5wdXNoKGAke2Rpck5hbWV9LyR7aXRlbS5uYW1lfWApO1xyXG4gICAgICAgICAgICAgICAgZmlsZXMgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgLi4uZmlsZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgLi4uKGF3YWl0IHRoaXMucmVhZEZvbGRlcihgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gKSksXHJcbiAgICAgICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKGZpbGVzKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWFkRmlsZShmaWxlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgZnMucmVhZEZpbGUoZmlsZVBhdGgsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXQgPSBCdWZmZXIuZnJvbShkYXRhKS50b1N0cmluZygnYmFzZTY0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmV0KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcihlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB3cml0ZUZpbGUoZmlsZVBhdGgsIHRleHQpIHtcclxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCB0ZXh0LCBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB1cGxvYWRGaWxlKGZpbGVQYXRoLCBidWZmZXIpIHtcclxuICAgICAgICB2YXIgc2F2ZVBhdGggPSB0aGlzLkJBU0VfUEFUSCArICcvJyArIFdPUktTUEFDRV9ESVIgKyAnL2lucHV0LycgKyBmaWxlUGF0aDtcclxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHNhdmVQYXRoLCBCdWZmZXIuZnJvbShidWZmZXIpLCBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhzYXZlUGF0aClcclxuICAgICAgICByZXR1cm4gc2F2ZVBhdGg7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuYW1lRmlsZShvbGR1cmwsIG5ld3VybCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZW5hbWVkICcgKyBvbGR1cmwgKyAnIGludG8gJyArIG5ld3VybCk7XHJcbiAgICAgICAgICAgIGlmIChuZXd1cmwuc3BsaXQoXCIuXCIpLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBuZXd1cmwgKz0gXCIud2VicFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZzLnJlbmFtZShvbGR1cmwsIG5ld3VybCwgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgRm9sZGVyVG9vbDsiLCAiLy8gR2lmIHRvIFdFQk0gbGlicmFyeVxyXG5jb25zdCBXZWJwSW1hZ2UgPSByZXF1aXJlKCdub2RlLXdlYnBtdXgnKS5JbWFnZTtcclxuXHJcbmNvbnN0IHBuZ1RvSWNvID0gcmVxdWlyZSgncG5nLXRvLWljbycpO1xyXG5cclxuY29uc3QgY2hpbGQgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJylcclxuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxyXG5jb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpXHJcbmltcG9ydCB7IHJlbW92ZUJhY2tncm91bmQgfSBmcm9tIFwiQGltZ2x5L2JhY2tncm91bmQtcmVtb3ZhbC1ub2RlXCI7XHJcblxyXG5jb25zdCB0ZXJtaW5hdGVXaXRoRXJyb3IgPSAoZXJyb3IgPSAnW2ZhdGFsXSBlcnJvcicpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKGVycm9yKVxyXG4gICAgICAgIC8vcHJvY2Vzcy5leGl0KDEpXHJcbn1cclxuXHJcbmNvbnN0IGV4ZWMgPSB1dGlsLnByb21pc2lmeShjaGlsZC5leGVjKVxyXG5cclxuY29uc3Qgd2VicCA9IHJlcXVpcmUoJ3dlYnAtY29udmVydGVyJyk7XHJcbi8vd2VicC5ncmFudF9wZXJtaXNzaW9uKCk7ICAvLyBNYXJjaGUgcHRldCBwYXMgc3VyIGxlIFBDIGR1IGJvdWxvdFxyXG5cclxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpXHJcblxyXG5jbGFzcyBJbWFnZVRvb2wge1xyXG4gICAgY29uc3RydWN0b3IoZm9sZGVyVG9vbCkge1xyXG4gICAgICAgIHRoaXMuZm9sZGVyVG9vbCA9IGZvbGRlclRvb2xcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydEltYWdlVG9XZWJwKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc1VybCA9IGltYWdlUGF0aC5zcGxpdChcIi5cIilbMF0gKyBcIi53ZWJwXCI7XHJcbiAgICAgICAgICAgICAgICByZXNVcmwgPSByZXNVcmwuc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gd2VicC5jd2VicChpbWFnZVBhdGgsIHJlc1VybCwgXCItcSA4MFwiLCBcIi12XCIpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzVXJsKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGVycm9yKGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRXZWJwVG9XZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRXZWJwVG9XZWJtTmV3KGltYWdlUGF0aCk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgd2ViUEltYWdlID0gYXdhaXQgbmV3IFdlYnBJbWFnZSgpO1xyXG4gICAgICAgICAgICBhd2FpdCB3ZWJQSW1hZ2UubG9hZChpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICBpZiAod2ViUEltYWdlLmhhc0FuaW0pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAod2ViUEltYWdlLmZyYW1lcyAhPT0gdW5kZWZpbmVkICYmIHdlYlBJbWFnZS5mcmFtZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IFsuLi53ZWJQSW1hZ2UuZnJhbWVzXTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZyYW1lcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyByZXNpemVXZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZwcm9iZS5leGUnKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZm1wZWcuZXhlJyk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dChpbWFnZVBhdGgpXHJcbiAgICAgICAgICAgICAgICAubm9BdWRpbygpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0T3B0aW9ucygnLXBpeF9mbXQgeXV2NDIwcCcpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KGltYWdlUGF0aC5zcGxpdCgnLicpWzBdICsgXCIxLndlYm1cIilcclxuICAgICAgICAgICAgICAgIC5zaXplKCc3MjB4PycpXHJcbiAgICAgICAgICAgICAgICAub24oXCJlbmRcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdlbmVyYXRlZCAhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLnVubGlua1N5bmMoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICBmZm1wZWcua2lsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaW1hZ2VQYXRoLnNwbGl0KCcuJylbMF0gKyBcIjEud2VibVwiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlcnJvclwiLCAoZSkgPT4gZXJyb3IoZSkpLnJ1bigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjbGlwVmlkZW8odmlkZW9QYXRoLCBzdGFydFRpbWUsIGR1cmF0aW9uKSB7XHJcbiAgICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKHZpZGVvUGF0aCk7XHJcbiAgICAgICAgY29uc3Qgb3V0TmFtZSA9IHZpZGVvUGF0aC5zcGxpdCgnLicpWzBdICsgJ19jbGlwJyArIGV4dFxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZwcm9iZS5leGUnKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZm1wZWcuZXhlJyk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dCh2aWRlb1BhdGgpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KG91dE5hbWUpXHJcbiAgICAgICAgICAgICAgICAuc2V0U3RhcnRUaW1lKHN0YXJ0VGltZSlcclxuICAgICAgICAgICAgICAgIC5zZXREdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAgICAgICAgIC5vbihcImVuZFwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR2VuZXJhdGVkICFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyh2aWRlb1BhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZmbXBlZy5raWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShvdXROYW1lKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlcnJvclwiLCAoZSkgPT4gZXJyb3IoZSkpLnJ1bigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjcm9wVmlkZW8odmlkZW9QYXRoLCB4LCB5LCB3LCBoKSB7XHJcbiAgICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKHZpZGVvUGF0aCk7XHJcbiAgICAgICAgY29uc3Qgb3V0TmFtZSA9IHZpZGVvUGF0aC5zcGxpdCgnLicpWzBdICsgJ19jcm9wJyArIGV4dFxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZwcm9iZS5leGUnKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZm1wZWcuZXhlJyk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dCh2aWRlb1BhdGgpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KG91dE5hbWUpXHJcbiAgICAgICAgICAgICAgICAudmlkZW9GaWx0ZXJzKFt7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBcImNyb3BcIixcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dF93OiB3LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRfaDogaFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LCBdKVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZW5kXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJHZW5lcmF0ZWQgIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmtTeW5jKHZpZGVvUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmZtcGVnLmtpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG91dE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5vbihcImVycm9yXCIsIChlKSA9PiBlcnJvcihlKSkucnVuKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRHaWZUb1dlYm0oaW1hZ2VQYXRoKSB7XHJcbiAgICAgICAgdmFyIHJlc1VybCA9IGltYWdlUGF0aC5zcGxpdCgnL2lucHV0LycpLmpvaW4oJy9vdXRwdXQvJykuc3BsaXQoJy4nKVswXSArICcud2VibSc7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUsIGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBmZm1wZWcgPSByZXF1aXJlKFwiZmx1ZW50LWZmbXBlZ1wiKSgpXHJcbiAgICAgICAgICAgICAgICAuc2V0RmZwcm9iZVBhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZnByb2JlLmV4ZScpXHJcbiAgICAgICAgICAgICAgICAuc2V0RmZtcGVnUGF0aCgnLi9yZXNvdXJjZXMvZmZtcGVnL2ZmbXBlZy5leGUnKTtcclxuXHJcbiAgICAgICAgICAgIGZmbXBlZ1xyXG4gICAgICAgICAgICAgICAgLmlucHV0KGltYWdlUGF0aClcclxuICAgICAgICAgICAgICAgIC5ub0F1ZGlvKClcclxuICAgICAgICAgICAgICAgIC5vdXRwdXRPcHRpb25zKCctcGl4X2ZtdCB5dXY0MjBwJylcclxuICAgICAgICAgICAgICAgIC5vdXRwdXQocmVzVXJsKVxyXG4gICAgICAgICAgICAgICAgLnNpemUoJzcyMHg/JylcclxuICAgICAgICAgICAgICAgIC5vbihcImVuZFwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR2VuZXJhdGVkICFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZmbXBlZy5raWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNVcmwpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5vbihcImVycm9yXCIsIChlKSA9PiBlcnJvcihlKSkucnVuKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRUb0dpZihpbWFnZVBhdGgpIHtcclxuICAgICAgICB2YXIgcmVzVXJsID0gaW1hZ2VQYXRoLnNwbGl0KCcvaW5wdXQvJykuam9pbignL291dHB1dC8nKS5zcGxpdCgnLicpWzBdICsgJy5naWYnO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZwcm9iZS5leGUnKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZm1wZWcuZXhlJyk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dChpbWFnZVBhdGgpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KHJlc1VybClcclxuICAgICAgICAgICAgICAgIC5vbihcImVuZFwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR2VuZXJhdGVkICFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZmbXBlZy5raWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNVcmwpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5vbihcImVycm9yXCIsIChlKSA9PiBlcnJvcihlKSkucnVuKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRXZWJwVG9XZWJtTmV3KGZpbGVuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lV2l0aG91dEV4dCA9IGZpbGVuYW1lLnJlcGxhY2UoJy53ZWJwJywgJycpXHJcbiAgICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnZnJhbWVzJylcclxuICAgICAgICAgICAgY29uc3QgZGVsZXRlT3JpZ2luYWwgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZnJhbWVzKSkgZnMucm1kaXJTeW5jKGZyYW1lcywgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuICAgICAgICAgICAgZnMubWtkaXJTeW5jKGZyYW1lcylcclxuXHJcbiAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIoJ2ZyYW1lcycpXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBwcm9jZXNzLmN3ZCgpKVxyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIGBhbmltX2R1bXAgLi4vJHtmaWxlbmFtZX1gKVxyXG4gICAgICAgICAgICBleGVjKGBhbmltX2R1bXAgLi4vJHtmaWxlbmFtZX1gKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIoJy4uJylcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgcHJvY2Vzcy5jd2QoKSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IGB3ZWJwbXV4IC1pbmZvIC4vJHtmaWxlbmFtZX1gXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleGVjKGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oKHsgc3Rkb3V0LCBzdGRlcnIgfSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGRlcnIpIHJldHVybiBQcm9taXNlLnJlamVjdChzdGRlcnIpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQW5pbWF0aW9uID0gc3Rkb3V0Lm1hdGNoKC9GZWF0dXJlcyBwcmVzZW50OiBhbmltYXRpb24vKSAhPT0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNBbmltYXRpb24pIHJldHVybiBQcm9taXNlLnJlamVjdCgnVGhpcyBpcyBub3QgYW4gYW5pbWF0ZWQgd2VicCBmaWxlJylcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlyc3RMaW5lID0gc3Rkb3V0Lm1hdGNoKC8xOi4rW1xccl0/XFxuL2cpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdExpbmUpIHJldHVyblxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmcmFtZUxlbmd0aCA9IGZpcnN0TGluZVswXS5zcGxpdCgvXFxzKy9nKVs2XVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lcmF0ZSA9IE1hdGgucm91bmQoMTAwMCAvIGZyYW1lTGVuZ3RoKSAvLyBmcmFtZXMvc2Vjb25kXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IHBhdGgucmVzb2x2ZShmcmFtZXMsICdkdW1wXyUwNGQucG5nJylcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYW5kID0gYGZmbXBlZyAtZnJhbWVyYXRlICR7ZnJhbWVyYXRlfSAtaSBcIiR7ZHVtcH1cIiBcIiR7bmFtZVdpdGhvdXRFeHR9LndlYm1cIiAteWBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWMoY29tbWFuZClcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAudGhlbigoeyBzdGRvdXQsIHN0ZGVyciB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKC9lcnJvci9nbS50ZXN0KHN0ZGVycikpIHJldHVybiBQcm9taXNlLnJlamVjdChzdGRlcnIpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsZWFudXBcclxuICAgICAgICAgICAgICAgICAgICBmcy5ybWRpclN5bmMoZnJhbWVzLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWxldGVPcmlnaW5hbCkgZnMucm1TeW5jKHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBmaWxlbmFtZSkpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXSBTdWNjZXNzIVxcbicpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IoZXJyKVxyXG4gICAgICAgICAgICAgICAgICAgIHRlcm1pbmF0ZVdpdGhFcnJvcihgW2ZhdGFsXSAke2Vycn1gKVxyXG4gICAgICAgICAgICAgICAgICAgIGZzLnJtZGlyU3luYyhmcmFtZXMsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBjb252ZXJ0UG5nVG9JY28oZmlsZU5hbWUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBuZXdOYW1lID0gZmlsZU5hbWUuc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpLnNwbGl0KCcuJylbMF0gKyAnLmljbyc7XHJcbiAgICAgICAgICAgIHBuZ1RvSWNvKGZpbGVOYW1lKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oYnVmID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKG5ld05hbWUsIGJ1Zik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShuZXdOYW1lKVxyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcihlcnIpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVtb3ZlSW1hZ2VCYWNrZ3JvdW5kKGltZ1NvdXJjZSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGltYWdlQnVmZmVyID0gZnMucmVhZEZpbGVTeW5jKGltZ1NvdXJjZSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbaW1hZ2VCdWZmZXJdLCB7IHR5cGU6IFwiaW1hZ2UvcG5nXCIgfSk7XHJcbiAgICAgICAgICAgIHZhciBuZXdOYW1lID0gaW1nU291cmNlLnNwbGl0KCcvaW5wdXQvJykuam9pbignL291dHB1dC8nKTtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVCYWNrZ3JvdW5kKGJsb2IpLnRoZW4oYXN5bmMoYmxvYjIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIuZnJvbShhd2FpdCBibG9iMi5hcnJheUJ1ZmZlcigpKTtcclxuICAgICAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKG5ld05hbWUsIGJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShuZXdOYW1lKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZS5tZXNzYWdlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydCBkZWZhdWx0IEltYWdlVG9vbDsiLCAiY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xyXG5jb25zdCB5dGRsID0gcmVxdWlyZSgneXRkbC1jb3JlJyk7XHJcbmNvbnN0IHJlYWRsaW5lID0gcmVxdWlyZSgncmVhZGxpbmUnKTtcclxuY29uc3QgY3AgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJyk7XHJcbmNvbnN0IGh0dHAgPSByZXF1aXJlKCdodHRwJyk7XHJcbmNvbnN0IGh0dHBzID0gcmVxdWlyZSgnaHR0cHMnKTtcclxuXHJcbmNsYXNzIFZpZGVvRG93bmxvYWRlclRvb2wge1xyXG4gICAgY29uc3RydWN0b3IoZm9sZGVyVG9vbCkge1xyXG4gICAgICAgIHRoaXMuZm9sZGVyVG9vbCA9IGZvbGRlclRvb2xcclxuICAgIH1cclxuICAgIGFzeW5jIGRvd25sb2FkVmlkZW8odXJsKSB7XHJcbiAgICAgICAgaWYgKHVybC5zcGxpdCgneW91dHViZScpLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZG93bmxvYWRZb3V0dWJlVmlkZW8odXJsKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHVybC5zcGxpdCgneG54eCcpLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZG93bmxvYWRWaWRlb1hueHgodXJsKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHVybC5zcGxpdCgneHZpZGVvcycpLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZG93bmxvYWRWaWRlb1h2aWRlb3ModXJsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhc3luYyBkb3dubG9hZFlvdXR1YmVWaWRlbyh1cmwpIHtcclxuICAgICAgICBjb25zdCBmaW5hbFBhdGhWaWRlbyA9IHRoaXMuZm9sZGVyVG9vbC5CQVNFX1BBVEggKyAnLycgKyB0aGlzLmZvbGRlclRvb2wuV09SS1NQQUNFX0RJUiArICcvaW5wdXQvJyArIHVybC5zdWJzdHJpbmcodXJsLmxlbmd0aCAtIDUsIHVybC5sZW5ndGgpICsgJ192Lm1wNCc7XHJcbiAgICAgICAgY29uc3QgZmluYWxQYXRoQXVkaW8gPSB0aGlzLmZvbGRlclRvb2wuQkFTRV9QQVRIICsgJy8nICsgdGhpcy5mb2xkZXJUb29sLldPUktTUEFDRV9ESVIgKyAnL2lucHV0LycgKyB1cmwuc3Vic3RyaW5nKHVybC5sZW5ndGggLSA1LCB1cmwubGVuZ3RoKSArICdfYS5tcDMnO1xyXG4gICAgICAgIGNvbnN0IGZpbmFsUGF0aCA9IHRoaXMuZm9sZGVyVG9vbC5CQVNFX1BBVEggKyAnLycgKyB0aGlzLmZvbGRlclRvb2wuV09SS1NQQUNFX0RJUiArICcvaW5wdXQvJyArIHVybC5zdWJzdHJpbmcodXJsLmxlbmd0aCAtIDUsIHVybC5sZW5ndGgpICsgJy5tcDQnO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2aWRlbyA9IHl0ZGwodXJsLCB7IHF1YWxpdHk6ICdoaWdoZXN0dmlkZW8nIH0pXHJcbiAgICAgICAgICAgICAgICB2aWRlby5waXBlKGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbmFsUGF0aFZpZGVvKSlcclxuICAgICAgICAgICAgICAgIHZpZGVvLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXVkaW8gPSB5dGRsKHVybCwgeyBxdWFsaXR5OiAnaGlnaGVzdGF1ZGlvJyB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGF1ZGlvLnBpcGUoZnMuY3JlYXRlV3JpdGVTdHJlYW0oZmluYWxQYXRoQXVkaW8pKVxyXG4gICAgICAgICAgICAgICAgICAgIGF1ZGlvLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmZm1wZWcgPSByZXF1aXJlKFwiZmx1ZW50LWZmbXBlZ1wiKSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0RmZwcm9iZVBhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZnByb2JlLmV4ZScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0RmZtcGVnUGF0aCgnLi9yZXNvdXJjZXMvZmZtcGVnL2ZmbXBlZy5leGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmZtcGVnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaW5wdXQoZmluYWxQYXRoVmlkZW8pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaW5wdXQoZmluYWxQYXRoQXVkaW8pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkT3B0aW9ucyhbJy1tYXAgMDp2JywgJy1tYXAgMTphJywgJy1jOnYgY29weSddKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZvcm1hdCgnbXA0JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vdXRwdXRPcHRpb25zKCctcGl4X2ZtdCB5dXY0MjBwJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vdXRwdXQoZmluYWxQYXRoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uKCdlbmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhmaW5hbFBhdGhBdWRpbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhmaW5hbFBhdGhWaWRlbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmZtcGVnLmtpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZpbmFsUGF0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhbiBlcnJvciBoYXBwZW5lZDogJyArIGVyci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGVycilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLnJ1bigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHZpZGVvLm9uKCdlcnJvcicsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGFzeW5jIGRvd25sb2FkQXVkaW8odXJsKSB7XHJcbiAgICAgICAgY29uc3QgZmluYWxQYXRoQXVkaW8gPSB0aGlzLmZvbGRlclRvb2wuQkFTRV9QQVRIICsgJy8nICsgdGhpcy5mb2xkZXJUb29sLldPUktTUEFDRV9ESVIgKyAnL2lucHV0LycgKyB1cmwuc3Vic3RyaW5nKHVybC5sZW5ndGggLSA1LCB1cmwubGVuZ3RoKSArICdfYS5tcDMnO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpbyA9IHl0ZGwodXJsLCB7IHF1YWxpdHk6ICdoaWdoZXN0YXVkaW8nIH0pXHJcbiAgICAgICAgICAgICAgICBhdWRpby5waXBlKGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbmFsUGF0aEF1ZGlvKSlcclxuICAgICAgICAgICAgICAgIGF1ZGlvLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShmaW5hbFBhdGhBdWRpbyk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgYXVkaW8ub24oJ2Vycm9yJywgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBhc3luYyBkb3dubG9hZFZpZGVvWG54eCh1cmwpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IGh0dHBzLmdldCh1cmwsIChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZS5vbignZGF0YScsIChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9keSArPSBkYXRhLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2aWRlb0xpbmsgPSBib2R5LnNwbGl0KCdodG1sNXZpZGVvX2Jhc2UnKVsxXS5zcGxpdCgnPGEgaHJlZj1cIicpWzFdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZpZGVvTGluayA9IHZpZGVvTGluay5zcGxpdCgnXCInKVswXVxyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXdhaXQgdGhpcy5nZXRGaWxlRnJvbVVybCh2aWRlb0xpbmspKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgZG93bmxvYWRWaWRlb1h2aWRlb3ModXJsKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBodHRwcy5nZXQodXJsLCAocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBib2R5ID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGJvZHkgKz0gZGF0YS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmlkZW9MaW5rID0gYm9keS5zcGxpdCgnXCJjb250ZW50VXJsXCI6IFwiJylbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmlkZW9MaW5rID0gdmlkZW9MaW5rLnNwbGl0KCdcIicpWzBdXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhd2FpdCB0aGlzLmdldEZpbGVGcm9tVXJsKHZpZGVvTGluaykpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBhc3luYyBnZXRGaWxlRnJvbVVybCh1cmwpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZmluYWxQYXRoID0gdGhpcy5mb2xkZXJUb29sLkJBU0VfUEFUSCArICcvJyArIHRoaXMuZm9sZGVyVG9vbC5XT1JLU1BBQ0VfRElSICsgJy9pbnB1dC8nICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNTAwMCkgKyAnLm1wNCc7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShmaW5hbFBhdGgpO1xyXG4gICAgICAgICAgICBsZXQgcHJvdG9jb2wgPSBodHRwXHJcbiAgICAgICAgICAgIGlmICh1cmwuc3BsaXQoJzonKVswXSA9PT0gJ2h0dHBzJykge1xyXG4gICAgICAgICAgICAgICAgcHJvdG9jb2wgPSBodHRwc1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBwcm90b2NvbC5nZXQodXJsLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnBpcGUoZmlsZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gYWZ0ZXIgZG93bmxvYWQgY29tcGxldGVkIGNsb3NlIGZpbGVzdHJlYW1cclxuICAgICAgICAgICAgICAgIGZpbGUub24oXCJmaW5pc2hcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbGUuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZpbmFsUGF0aClcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydCBkZWZhdWx0IFZpZGVvRG93bmxvYWRlclRvb2w7Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxz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RUFDekM7QUFDQSxTQUFPO0FBQ1gsQ0FBQztBQUNELHdCQUFRLE9BQU8sa0JBQWtCLE9BQU0sR0FBRyxTQUFTO0FBQy9DLFFBQU0sT0FBTyxNQUFNLGtCQUFrQixjQUFjLEtBQUssR0FBRztBQUMzRCxNQUFJLE1BQU07QUFDTixXQUFPLE1BQU0sV0FBVyxTQUFTLElBQUk7QUFBQSxFQUN6QztBQUNBLFNBQU87QUFDWCxDQUFDO0FBQ0Qsd0JBQVEsT0FBTyxpQkFBaUIsT0FBTSxHQUFHLFNBQVM7QUFDOUMsUUFBTSxVQUFVLElBQUksa0JBQVUsVUFBVTtBQUN4QyxTQUFPLE1BQU0sV0FBVyxTQUFTLE1BQU0sUUFBUSxzQkFBc0IsS0FBSyxHQUFHLENBQUM7QUFDbEYsQ0FBQztBQUNELHdCQUFRLE9BQU8sU0FBUyxPQUFNLE1BQU07QUFDaEMsU0FBTyxNQUFNLFdBQVcsWUFBWTtBQUN4QyxDQUFDO0FBQ0Qsd0JBQVEsR0FBRyxRQUFRLENBQUMsTUFBTTtBQUN0QixzQkFBSSxLQUFLO0FBQ2IsQ0FBQzsiLAogICJuYW1lcyI6IFsiYXBwIiwgInBhdGgiLCAiZnMiLCAiZm9sZGVyVG9vbCIsICJmcyIsICJmb2xkZXJUb29sIiwgIm9zIiwgInBhdGgiXQp9Cg==
