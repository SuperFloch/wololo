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
var path = require("path");
var { readdir, readFile, writeFile, unlink } = fs.promises;
var WORKSPACE_DIR = "wololo";
var MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  webm: "video/webm",
  mp4: "video/mp4",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mp3: "audio/mpeg"
};
var FolderTool = class {
  constructor(app2) {
    this.BASE_PATH = app2.getPath("userData");
    this.WORKSPACE_DIR = WORKSPACE_DIR;
    fs.mkdirSync(this.getBaseFolderUrl() + "/input", { recursive: true });
    fs.mkdirSync(this.getBaseFolderUrl() + "/output", { recursive: true });
  }
  getBaseFolderUrl() {
    return this.BASE_PATH + "/" + this.WORKSPACE_DIR;
  }
  assertInWorkspace(filePath) {
    const root = path.resolve(this.getBaseFolderUrl());
    const target = path.resolve(filePath);
    if (!target.startsWith(root + path.sep)) {
      throw new Error("Path outside of the workspace: " + filePath);
    }
    return target;
  }
  async clearFolder() {
    for (const folder of ["input", "output"]) {
      const dir = this.getBaseFolderUrl() + "/" + folder;
      for (const file of await this.readFolder(dir)) {
        await unlink(file);
      }
    }
    return true;
  }
  async readFolder(dirName) {
    let files = [];
    const items = await readdir(dirName, { withFileTypes: true });
    for (const item of items) {
      const itemPath = `${dirName}/${item.name}`;
      if (item.isDirectory()) {
        files = [...files, ...await this.readFolder(itemPath)];
      } else {
        files.push(itemPath);
      }
    }
    return files;
  }
  async readFile(filePath) {
    const data = await readFile(this.assertInWorkspace(filePath));
    return this.getBase64Prefix(filePath) + data.toString("base64");
  }
  getBase64Prefix(filePath) {
    const mime = MIME_TYPES[path.extname(filePath).slice(1).toLowerCase()];
    return mime ? `data:${mime};base64,` : "";
  }
  async deleteFile(filePath) {
    await unlink(this.assertInWorkspace(filePath));
    return true;
  }
  async uploadFile(fileName, buffer) {
    const savePath = this.getBaseFolderUrl() + "/input/" + path.basename(fileName);
    await writeFile(savePath, Buffer.from(buffer));
    return savePath;
  }
};
var folderTool_default = FolderTool;

// src-electron/services/imageTool.js
var import_background_removal_node = require("@imgly/background-removal-node");
var path2 = require("path");
var fs2 = require("fs");
var { once } = require("events");
var { PassThrough } = require("stream");
var ffmpeg = require("fluent-ffmpeg");
var WebpImage = require("node-webpmux").Image;
var pngToIco = require("png-to-ico");
var convertHeic = require("heic-convert");
var webp = require("webp-converter");
var ffmpegPath = require("ffmpeg-static").replace("app.asar", "app.asar.unpacked");
var ffprobePath = require("ffprobe-static").path.replace("app.asar", "app.asar.unpacked");
var BG_MIME_TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
var toOutputPath = (filePath) => filePath.replace(/[\\/]input([\\/][^\\/]*)$/, "/output$1");
var withExt = (filePath, ext, suffix = "") => filePath.slice(0, filePath.length - path2.extname(filePath).length) + suffix + "." + ext;
var pgcd = (a, b) => b === 0 ? a : pgcd(b, a % b);
var ImageTool = class {
  static runFfmpeg(input, outPath, configure = () => {
  }) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg().setFfmpegPath(ffmpegPath).setFfprobePath(ffprobePath).input(input);
      configure(command, "input");
      command.output(outPath);
      configure(command, "output");
      command.on("end", () => resolve(outPath)).on("error", reject).run();
    });
  }
  static async convertImageToWebp(imagePath) {
    const outPath = withExt(toOutputPath(imagePath), "webp");
    await webp.cwebp(imagePath, outPath, "-q 80", "-v");
    return outPath;
  }
  static clipVideo(videoPath, startTime, duration) {
    const outPath = withExt(videoPath, path2.extname(videoPath).slice(1), "_clip");
    return this.runFfmpeg(videoPath, outPath, (command, step) => {
      if (step === "output")
        command.setStartTime(startTime).setDuration(duration);
    });
  }
  static cropVideo(videoPath, x, y, w, h) {
    const outPath = withExt(videoPath, path2.extname(videoPath).slice(1), "_crop");
    const evenW = Math.max(2, w - w % 2);
    const evenH = Math.max(2, h - h % 2);
    return this.runFfmpeg(videoPath, outPath, (command, step) => {
      if (step === "output") {
        command.videoFilters([{ filter: "crop", options: { x, y, out_w: evenW, out_h: evenH } }]);
      }
    });
  }
  static convertGifToVideo(imagePath, format = "webm") {
    const outPath = withExt(toOutputPath(imagePath), format);
    return this.runFfmpeg(imagePath, outPath, (command, step) => {
      if (step === "output")
        command.outputOptions("-pix_fmt yuv420p").size("720x?");
    });
  }
  static convertToGif(imagePath) {
    return this.runFfmpeg(imagePath, withExt(toOutputPath(imagePath), "gif"));
  }
  static async convertWebpToVideo(imagePath, format = "webm") {
    const img = new WebpImage();
    await img.load(imagePath);
    await img.initLib();
    if (!img.hasAnim)
      throw new Error("This is not an animated webp file");
    const { width, height, frames } = img;
    const unit = Math.max(10, frames.reduce((acc, f) => pgcd(acc, f.delay || 100), 0));
    const fps = 1e3 / unit;
    const stream = new PassThrough();
    const done = this.runFfmpeg(stream, withExt(toOutputPath(imagePath), format), (command, step) => {
      if (step === "input") {
        command.inputFormat("rawvideo").inputOptions(["-pix_fmt rgba", `-s ${width}x${height}`, `-framerate ${fps}`]);
      } else {
        command.outputOptions("-pix_fmt yuv420p").videoFilters("scale=trunc(iw/2)*2:trunc(ih/2)*2");
      }
    });
    let failure = null;
    done.catch((e) => {
      failure = e;
    });
    const canvas = Buffer.alloc(width * height * 4);
    const flat = Buffer.alloc(width * height * 4);
    try {
      for (let i = 0; i < frames.length && !failure; i++) {
        const frame = frames[i];
        this.drawFrame(canvas, width, frame, Buffer.from(await img.getFrameData(i)));
        this.flattenOnWhite(canvas, flat);
        const repeat = Math.max(1, Math.round((frame.delay || 100) / unit));
        for (let n = 0; n < repeat && !failure; n++) {
          if (!stream.write(flat)) {
            await Promise.race([once(stream, "drain"), done.catch(() => {
            })]);
          }
        }
        if (frame.dispose)
          this.clearRect(canvas, width, frame);
      }
    } finally {
      stream.end();
    }
    return await done;
  }
  static drawFrame(canvas, canvasWidth, frame, data) {
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        const src = (y * frame.width + x) * 4;
        const dst = ((frame.y + y) * canvasWidth + frame.x + x) * 4;
        const a = data[src + 3];
        if (!frame.blend || a === 255) {
          data.copy(canvas, dst, src, src + 4);
        } else if (a > 0) {
          const dstA = canvas[dst + 3];
          const outA = a + dstA * (255 - a) / 255;
          for (let c = 0; c < 3; c++) {
            canvas[dst + c] = (data[src + c] * a + canvas[dst + c] * dstA * (255 - a) / 255) / outA;
          }
          canvas[dst + 3] = outA;
        }
      }
    }
  }
  static clearRect(canvas, canvasWidth, frame) {
    for (let y = 0; y < frame.height; y++) {
      const start = ((frame.y + y) * canvasWidth + frame.x) * 4;
      canvas.fill(0, start, start + frame.width * 4);
    }
  }
  static flattenOnWhite(canvas, out) {
    for (let i = 0; i < canvas.length; i += 4) {
      const a = canvas[i + 3] / 255;
      out[i] = canvas[i] * a + 255 * (1 - a);
      out[i + 1] = canvas[i + 1] * a + 255 * (1 - a);
      out[i + 2] = canvas[i + 2] * a + 255 * (1 - a);
      out[i + 3] = 255;
    }
  }
  static async convertPngToIco(fileName) {
    const outPath = withExt(toOutputPath(fileName), "ico");
    await fs2.promises.writeFile(outPath, await pngToIco(fileName));
    return outPath;
  }
  static async convertHeicToJpg(fileName) {
    const outPath = withExt(toOutputPath(fileName), "jpg");
    const buffer = await convertHeic({
      buffer: await fs2.promises.readFile(fileName),
      format: "JPEG",
      quality: 1
    });
    await fs2.promises.writeFile(outPath, Buffer.from(buffer));
    return outPath;
  }
  static async removeImageBackground(imgPath) {
    const type = BG_MIME_TYPES[path2.extname(imgPath).slice(1).toLowerCase()] || "image/png";
    const blob = new Blob([await fs2.promises.readFile(imgPath)], { type });
    const result = await (0, import_background_removal_node.removeBackground)(blob);
    const outPath = withExt(toOutputPath(imgPath), "png");
    await fs2.promises.writeFile(outPath, Buffer.from(await result.arrayBuffer()));
    return outPath;
  }
};
var imageTool_default = ImageTool;

// src-electron/services/videoDownloaderTool.js
var fs3 = require("fs");
var path3 = require("path");
var cp = require("child_process");
var http = require("http");
var https = require("https");
var VideoDownloaderTool = class {
  constructor(folderTool2) {
    this.folderTool = folderTool2;
  }
  async downloadVideo(url) {
    return await this.downloadVideo(url);
  }
  getBinFolder() {
    const prod = path3.join(process.resourcesPath || "", "ffmpeg");
    return fs3.existsSync(path3.join(prod, "yt-dlp.exe")) ? prod : path3.resolve("./resources/ffmpeg");
  }
  runYtDlp(url, extraArgs) {
    const binFolder = this.getBinFolder();
    const inputDir = this.folderTool.BASE_PATH + "/" + this.folderTool.WORKSPACE_DIR + "/input";
    const args = [
      "--no-playlist",
      "--no-warnings",
      "--ffmpeg-location",
      binFolder,
      "-P",
      inputDir,
      "-o",
      "%(id)s.%(ext)s",
      "--print",
      "after_move:filepath",
      ...extraArgs,
      url
    ];
    return new Promise((resolve) => {
      cp.execFile(path3.join(binFolder, "yt-dlp.exe"), args, { maxBuffer: 1024 * 1024 * 10, windowsHide: true }, (err, stdout, stderr) => {
        if (err) {
          console.log(stderr || err.message);
          resolve(null);
          return;
        }
        const lines = stdout.split("?").map((l) => l.trim()).filter(Boolean);
        resolve(lines.length ? lines[lines.length - 1] : null);
      });
    });
  }
  async downloadVideo(url) {
    return await this.runYtDlp(url, [
      "-f",
      "bv*+ba/b",
      "-S",
      "vcodec:h264,res,acodec:m4a",
      "--merge-output-format",
      "mp4"
    ]);
  }
  async downloadAudio(url) {
    return await this.runYtDlp(url, ["-x", "--audio-format", "mp3"]);
  }
  async getFileFromUrl(url) {
    return new Promise((resolve) => {
      const finalPath = this.folderTool.BASE_PATH + "/" + this.folderTool.WORKSPACE_DIR + "/input/" + Math.floor(Math.random() * 5e3) + ".mp4";
      const file = fs3.createWriteStream(finalPath);
      let protocol = http;
      if (url.split(":")[0] === "https") {
        protocol = https;
      }
      protocol.get(url, function(response) {
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
      preload: import_path.default.resolve(__dirname, "D:\\travail\\src\\wololo\\.quasar\\electron\\electron-preload.js")
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
async function toResult(filePath) {
  return { data: await folderTool.readFile(filePath), path: filePath };
}
var converters = {
  mp4: (data) => data.inputExt === "webp" ? imageTool_default.convertWebpToVideo(data.file, "mp4") : imageTool_default.convertGifToVideo(data.file, "mp4"),
  webm: (data) => data.inputExt === "webp" ? imageTool_default.convertWebpToVideo(data.file, "webm") : imageTool_default.convertGifToVideo(data.file, "webm"),
  gif: (data) => imageTool_default.convertToGif(data.file),
  ico: (data) => imageTool_default.convertPngToIco(data.file),
  jpg: (data) => imageTool_default.convertHeicToJpg(data.file),
  webp: (data) => imageTool_default.convertImageToWebp(data.file)
};
import_electron.ipcMain.handle("file:convert", async (e, data) => {
  try {
    const convert = converters[data.outputExt];
    if (!convert)
      return { error: "Unsupported format: " + data.outputExt };
    return await toResult(await convert(data));
  } catch (err) {
    return { error: "Conversion failed: " + err.message };
  }
});
import_electron.ipcMain.handle("video:clip", async (e, data) => {
  return await toResult(await imageTool_default.clipVideo(data.video, data.startTime, data.duration));
});
import_electron.ipcMain.handle("video:crop", async (e, data) => {
  return await toResult(await imageTool_default.cropVideo(data.video, data.x, data.y, data.w, data.h));
});
import_electron.ipcMain.handle("img:remove-bg", async (e, data) => {
  try {
    return await toResult(await imageTool_default.removeImageBackground(data.img));
  } catch (err) {
    return { error: "Background removal failed: " + err.message };
  }
});
import_electron.ipcMain.handle("video:download", async (e, data) => {
  const file = await videoDownloadTool.downloadVideo(data.url);
  return file ? await toResult(file) : { error: "Download failed" };
});
import_electron.ipcMain.handle("audio:download", async (e, data) => {
  const file = await videoDownloadTool.downloadAudio(data.url);
  return file ? await toResult(file) : { error: "Download failed" };
});
import_electron.ipcMain.handle("folder:read", (e, data) => folderTool.readFolder(folderTool.getBaseFolderUrl() + "/" + data));
import_electron.ipcMain.handle("file:read", (e, data) => folderTool.readFile(data.path));
import_electron.ipcMain.handle("file:delete", (e, filePath) => folderTool.deleteFile(filePath));
import_electron.ipcMain.handle("img:upload", (e, data) => folderTool.uploadFile(data.path, data.buffer));
import_electron.ipcMain.handle("clear", () => folderTool.clearFolder());
import_electron.ipcMain.on("quit", () => import_electron.app.quit());
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjLWVsZWN0cm9uL2VsZWN0cm9uLW1haW4uanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ZvbGRlclRvb2wuanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ltYWdlVG9vbC5qcyIsICIuLi8uLi9zcmMtZWxlY3Ryb24vc2VydmljZXMvdmlkZW9Eb3dubG9hZGVyVG9vbC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93LCBpcGNNYWluIH0gZnJvbSAnZWxlY3Ryb24nXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXHJcbmltcG9ydCBvcyBmcm9tICdvcydcclxuaW1wb3J0IEZvbGRlclRvb2wgZnJvbSAnLi9zZXJ2aWNlcy9mb2xkZXJUb29sJ1xyXG5pbXBvcnQgSW1hZ2VUb29sIGZyb20gJy4vc2VydmljZXMvaW1hZ2VUb29sJ1xyXG5pbXBvcnQgVmlkZW9Eb3dubG9hZGVyVG9vbCBmcm9tICcuL3NlcnZpY2VzL3ZpZGVvRG93bmxvYWRlclRvb2wnXHJcblxyXG4vLyBuZWVkZWQgaW4gY2FzZSBwcm9jZXNzIGlzIHVuZGVmaW5lZCB1bmRlciBMaW51eFxyXG5jb25zdCBwbGF0Zm9ybSA9IHByb2Nlc3MucGxhdGZvcm0gfHwgb3MucGxhdGZvcm0oKVxyXG5cclxubGV0IG1haW5XaW5kb3dcclxuXHJcbmNvbnN0IGZvbGRlclRvb2wgPSBuZXcgRm9sZGVyVG9vbChhcHApXHJcbmNvbnN0IHZpZGVvRG93bmxvYWRUb29sID0gbmV3IFZpZGVvRG93bmxvYWRlclRvb2woZm9sZGVyVG9vbClcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdpbmRvdygpIHtcclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbCB3aW5kb3cgb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBtYWluV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xyXG4gICAgICAgIGljb246IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdpY29ucy9pY29uLnBuZycpLCAvLyB0cmF5IGljb25cclxuICAgICAgICB3aWR0aDogMTAwMCxcclxuICAgICAgICBoZWlnaHQ6IDYwMCxcclxuICAgICAgICBhdXRvSGlkZU1lbnVCYXI6IHRydWUsXHJcbiAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgIHVzZUNvbnRlbnRTaXplOiB0cnVlLFxyXG4gICAgICAgIHdlYlByZWZlcmVuY2VzOiB7XHJcbiAgICAgICAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXHJcbiAgICAgICAgICAgIC8vIE1vcmUgaW5mbzogaHR0cHM6Ly92Mi5xdWFzYXIuZGV2L3F1YXNhci1jbGktdml0ZS9kZXZlbG9waW5nLWVsZWN0cm9uLWFwcHMvZWxlY3Ryb24tcHJlbG9hZC1zY3JpcHRcclxuICAgICAgICAgICAgcHJlbG9hZDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgcHJvY2Vzcy5lbnYuUVVBU0FSX0VMRUNUUk9OX1BSRUxPQUQpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICBtYWluV2luZG93LmxvYWRVUkwocHJvY2Vzcy5lbnYuQVBQX1VSTClcclxuXHJcbiAgICBpZiAocHJvY2Vzcy5lbnYuREVCVUdHSU5HKSB7XHJcbiAgICAgICAgLy8gaWYgb24gREVWIG9yIFByb2R1Y3Rpb24gd2l0aCBkZWJ1ZyBlbmFibGVkXHJcbiAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vcGVuRGV2VG9vbHMoKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyB3ZSdyZSBvbiBwcm9kdWN0aW9uOyBubyBhY2Nlc3MgdG8gZGV2dG9vbHMgcGxzXHJcbiAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vbignZGV2dG9vbHMtb3BlbmVkJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBtYWluV2luZG93LndlYkNvbnRlbnRzLmNsb3NlRGV2VG9vbHMoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgbWFpbldpbmRvdy5vbignY2xvc2VkJywgKCkgPT4ge1xyXG4gICAgICAgIG1haW5XaW5kb3cgPSBudWxsXHJcbiAgICB9KVxyXG59XHJcblxyXG5hcHAud2hlblJlYWR5KCkudGhlbihjcmVhdGVXaW5kb3cpXHJcblxyXG5hcHAub24oJ3dpbmRvdy1hbGwtY2xvc2VkJywgKCkgPT4ge1xyXG4gICAgaWYgKHBsYXRmb3JtICE9PSAnZGFyd2luJykge1xyXG4gICAgICAgIGFwcC5xdWl0KClcclxuICAgIH1cclxufSlcclxuXHJcbmFwcC5vbignYWN0aXZhdGUnLCAoKSA9PiB7XHJcbiAgICBpZiAobWFpbldpbmRvdyA9PT0gbnVsbCkge1xyXG4gICAgICAgIGNyZWF0ZVdpbmRvdygpXHJcbiAgICB9XHJcbn0pXHJcblxyXG4vLyBDb252ZXJ0aXQgdW4gZmljaGllciBwcm9kdWl0IGVuIHsgZGF0YSAoZGF0YSBVUkwpLCBwYXRoIH1cclxuYXN5bmMgZnVuY3Rpb24gdG9SZXN1bHQoZmlsZVBhdGgpIHtcclxuICAgIHJldHVybiB7IGRhdGE6IGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZmlsZVBhdGgpLCBwYXRoOiBmaWxlUGF0aCB9XHJcbn1cclxuXHJcbi8vIFBvaW50IGQnZW50cmVlIGdlbmVyYWwgcG91ciB0b3V0ZXMgbGVzIGNvbnZlcnNpb25zXHJcbi8vIGRhdGEgLT4geyBmaWxlLCBpbnB1dEV4dCwgb3V0cHV0RXh0IH1cclxuY29uc3QgY29udmVydGVycyA9IHtcclxuICAgIG1wNDogKGRhdGEpID0+IGRhdGEuaW5wdXRFeHQgPT09ICd3ZWJwJyA/IEltYWdlVG9vbC5jb252ZXJ0V2VicFRvVmlkZW8oZGF0YS5maWxlLCAnbXA0JykgOiBJbWFnZVRvb2wuY29udmVydEdpZlRvVmlkZW8oZGF0YS5maWxlLCAnbXA0JyksXHJcbiAgICB3ZWJtOiAoZGF0YSkgPT4gZGF0YS5pbnB1dEV4dCA9PT0gJ3dlYnAnID8gSW1hZ2VUb29sLmNvbnZlcnRXZWJwVG9WaWRlbyhkYXRhLmZpbGUsICd3ZWJtJykgOiBJbWFnZVRvb2wuY29udmVydEdpZlRvVmlkZW8oZGF0YS5maWxlLCAnd2VibScpLFxyXG4gICAgZ2lmOiAoZGF0YSkgPT4gSW1hZ2VUb29sLmNvbnZlcnRUb0dpZihkYXRhLmZpbGUpLFxyXG4gICAgaWNvOiAoZGF0YSkgPT4gSW1hZ2VUb29sLmNvbnZlcnRQbmdUb0ljbyhkYXRhLmZpbGUpLFxyXG4gICAganBnOiAoZGF0YSkgPT4gSW1hZ2VUb29sLmNvbnZlcnRIZWljVG9KcGcoZGF0YS5maWxlKSxcclxuICAgIHdlYnA6IChkYXRhKSA9PiBJbWFnZVRvb2wuY29udmVydEltYWdlVG9XZWJwKGRhdGEuZmlsZSlcclxufVxyXG5cclxuaXBjTWFpbi5oYW5kbGUoJ2ZpbGU6Y29udmVydCcsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgY29udmVydCA9IGNvbnZlcnRlcnNbZGF0YS5vdXRwdXRFeHRdXHJcbiAgICAgICAgaWYgKCFjb252ZXJ0KSByZXR1cm4geyBlcnJvcjogJ1Vuc3VwcG9ydGVkIGZvcm1hdDogJyArIGRhdGEub3V0cHV0RXh0IH1cclxuICAgICAgICByZXR1cm4gYXdhaXQgdG9SZXN1bHQoYXdhaXQgY29udmVydChkYXRhKSlcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiB7IGVycm9yOiAnQ29udmVyc2lvbiBmYWlsZWQ6ICcgKyBlcnIubWVzc2FnZSB9XHJcbiAgICB9XHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCd2aWRlbzpjbGlwJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IHRvUmVzdWx0KGF3YWl0IEltYWdlVG9vbC5jbGlwVmlkZW8oZGF0YS52aWRlbywgZGF0YS5zdGFydFRpbWUsIGRhdGEuZHVyYXRpb24pKVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgndmlkZW86Y3JvcCcsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBhd2FpdCB0b1Jlc3VsdChhd2FpdCBJbWFnZVRvb2wuY3JvcFZpZGVvKGRhdGEudmlkZW8sIGRhdGEueCwgZGF0YS55LCBkYXRhLncsIGRhdGEuaCkpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6cmVtb3ZlLWJnJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gYXdhaXQgdG9SZXN1bHQoYXdhaXQgSW1hZ2VUb29sLnJlbW92ZUltYWdlQmFja2dyb3VuZChkYXRhLmltZykpXHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICByZXR1cm4geyBlcnJvcjogJ0JhY2tncm91bmQgcmVtb3ZhbCBmYWlsZWQ6ICcgKyBlcnIubWVzc2FnZSB9XHJcbiAgICB9XHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCd2aWRlbzpkb3dubG9hZCcsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB2aWRlb0Rvd25sb2FkVG9vbC5kb3dubG9hZFZpZGVvKGRhdGEudXJsKVxyXG4gICAgcmV0dXJuIGZpbGUgPyBhd2FpdCB0b1Jlc3VsdChmaWxlKSA6IHsgZXJyb3I6ICdEb3dubG9hZCBmYWlsZWQnIH1cclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2F1ZGlvOmRvd25sb2FkJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgY29uc3QgZmlsZSA9IGF3YWl0IHZpZGVvRG93bmxvYWRUb29sLmRvd25sb2FkQXVkaW8oZGF0YS51cmwpXHJcbiAgICByZXR1cm4gZmlsZSA/IGF3YWl0IHRvUmVzdWx0KGZpbGUpIDogeyBlcnJvcjogJ0Rvd25sb2FkIGZhaWxlZCcgfVxyXG59KVxyXG5cclxuaXBjTWFpbi5oYW5kbGUoJ2ZvbGRlcjpyZWFkJywgKGUsIGRhdGEpID0+IGZvbGRlclRvb2wucmVhZEZvbGRlcihmb2xkZXJUb29sLmdldEJhc2VGb2xkZXJVcmwoKSArICcvJyArIGRhdGEpKVxyXG5pcGNNYWluLmhhbmRsZSgnZmlsZTpyZWFkJywgKGUsIGRhdGEpID0+IGZvbGRlclRvb2wucmVhZEZpbGUoZGF0YS5wYXRoKSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ZpbGU6ZGVsZXRlJywgKGUsIGZpbGVQYXRoKSA9PiBmb2xkZXJUb29sLmRlbGV0ZUZpbGUoZmlsZVBhdGgpKVxyXG5pcGNNYWluLmhhbmRsZSgnaW1nOnVwbG9hZCcsIChlLCBkYXRhKSA9PiBmb2xkZXJUb29sLnVwbG9hZEZpbGUoZGF0YS5wYXRoLCBkYXRhLmJ1ZmZlcikpXHJcbmlwY01haW4uaGFuZGxlKCdjbGVhcicsICgpID0+IGZvbGRlclRvb2wuY2xlYXJGb2xkZXIoKSlcclxuaXBjTWFpbi5vbigncXVpdCcsICgpID0+IGFwcC5xdWl0KCkpXHJcbiIsICJjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJylcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmNvbnN0IHsgcmVhZGRpciwgcmVhZEZpbGUsIHdyaXRlRmlsZSwgdW5saW5rIH0gPSBmcy5wcm9taXNlc1xuXG5jb25zdCBXT1JLU1BBQ0VfRElSID0gJ3dvbG9sbydcblxuY29uc3QgTUlNRV9UWVBFUyA9IHtcbiAgICBqcGc6ICdpbWFnZS9qcGVnJyxcbiAgICBqcGVnOiAnaW1hZ2UvanBlZycsXG4gICAgcG5nOiAnaW1hZ2UvcG5nJyxcbiAgICBnaWY6ICdpbWFnZS9naWYnLFxuICAgIHdlYnA6ICdpbWFnZS93ZWJwJyxcbiAgICBzdmc6ICdpbWFnZS9zdmcreG1sJyxcbiAgICBpY286ICdpbWFnZS94LWljb24nLFxuICAgIHdlYm06ICd2aWRlby93ZWJtJyxcbiAgICBtcDQ6ICd2aWRlby9tcDQnLFxuICAgIG1vdjogJ3ZpZGVvL3F1aWNrdGltZScsXG4gICAgYXZpOiAndmlkZW8veC1tc3ZpZGVvJyxcbiAgICBtcDM6ICdhdWRpby9tcGVnJ1xufVxuXG5jbGFzcyBGb2xkZXJUb29sIHtcbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcbiAgICAgICAgdGhpcy5CQVNFX1BBVEggPSBhcHAuZ2V0UGF0aCgndXNlckRhdGEnKVxuICAgICAgICB0aGlzLldPUktTUEFDRV9ESVIgPSBXT1JLU1BBQ0VfRElSXG4gICAgICAgIGZzLm1rZGlyU3luYyh0aGlzLmdldEJhc2VGb2xkZXJVcmwoKSArICcvaW5wdXQnLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxuICAgICAgICBmcy5ta2RpclN5bmModGhpcy5nZXRCYXNlRm9sZGVyVXJsKCkgKyAnL291dHB1dCcsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXG4gICAgfVxuXG4gICAgZ2V0QmFzZUZvbGRlclVybCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuQkFTRV9QQVRIICsgJy8nICsgdGhpcy5XT1JLU1BBQ0VfRElSXG4gICAgfVxuXG4gICAgLy8gU2V1bHMgbGVzIGZpY2hpZXJzIGRlIGwnZXNwYWNlIGRlIHRyYXZhaWwgc29udCBhY2Nlc3NpYmxlcyBkZXB1aXMgbCdpbnRlcmZhY2VcbiAgICBhc3NlcnRJbldvcmtzcGFjZShmaWxlUGF0aCkge1xuICAgICAgICBjb25zdCByb290ID0gcGF0aC5yZXNvbHZlKHRoaXMuZ2V0QmFzZUZvbGRlclVybCgpKVxuICAgICAgICBjb25zdCB0YXJnZXQgPSBwYXRoLnJlc29sdmUoZmlsZVBhdGgpXG4gICAgICAgIGlmICghdGFyZ2V0LnN0YXJ0c1dpdGgocm9vdCArIHBhdGguc2VwKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXRoIG91dHNpZGUgb2YgdGhlIHdvcmtzcGFjZTogJyArIGZpbGVQYXRoKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0YXJnZXRcbiAgICB9XG5cbiAgICBhc3luYyBjbGVhckZvbGRlcigpIHtcbiAgICAgICAgZm9yIChjb25zdCBmb2xkZXIgb2YgWydpbnB1dCcsICdvdXRwdXQnXSkge1xuICAgICAgICAgICAgY29uc3QgZGlyID0gdGhpcy5nZXRCYXNlRm9sZGVyVXJsKCkgKyAnLycgKyBmb2xkZXJcbiAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBhd2FpdCB0aGlzLnJlYWRGb2xkZXIoZGlyKSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHVubGluayhmaWxlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgLy8gTGlzdGUgclx1MDBFOWN1cnNpdmUgZGVzIGZpY2hpZXJzIGQndW4gZG9zc2llclxuICAgIGFzeW5jIHJlYWRGb2xkZXIoZGlyTmFtZSkge1xuICAgICAgICBsZXQgZmlsZXMgPSBbXVxuICAgICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHJlYWRkaXIoZGlyTmFtZSwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgICAgICAgY29uc3QgaXRlbVBhdGggPSBgJHtkaXJOYW1lfS8ke2l0ZW0ubmFtZX1gXG4gICAgICAgICAgICBpZiAoaXRlbS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgZmlsZXMgPSBbLi4uZmlsZXMsIC4uLihhd2FpdCB0aGlzLnJlYWRGb2xkZXIoaXRlbVBhdGgpKV1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChpdGVtUGF0aClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmlsZXNcbiAgICB9XG5cbiAgICAvLyBSZXRvdXJuZSBsZSBmaWNoaWVyIHNvdXMgZm9ybWUgZGUgZGF0YSBVUkxcbiAgICBhc3luYyByZWFkRmlsZShmaWxlUGF0aCkge1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVhZEZpbGUodGhpcy5hc3NlcnRJbldvcmtzcGFjZShmaWxlUGF0aCkpXG4gICAgICAgIHJldHVybiB0aGlzLmdldEJhc2U2NFByZWZpeChmaWxlUGF0aCkgKyBkYXRhLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgIH1cblxuICAgIGdldEJhc2U2NFByZWZpeChmaWxlUGF0aCkge1xuICAgICAgICBjb25zdCBtaW1lID0gTUlNRV9UWVBFU1twYXRoLmV4dG5hbWUoZmlsZVBhdGgpLnNsaWNlKDEpLnRvTG93ZXJDYXNlKCldXG4gICAgICAgIHJldHVybiBtaW1lID8gYGRhdGE6JHttaW1lfTtiYXNlNjQsYCA6ICcnXG4gICAgfVxuXG4gICAgYXN5bmMgZGVsZXRlRmlsZShmaWxlUGF0aCkge1xuICAgICAgICBhd2FpdCB1bmxpbmsodGhpcy5hc3NlcnRJbldvcmtzcGFjZShmaWxlUGF0aCkpXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgYXN5bmMgdXBsb2FkRmlsZShmaWxlTmFtZSwgYnVmZmVyKSB7XG4gICAgICAgIGNvbnN0IHNhdmVQYXRoID0gdGhpcy5nZXRCYXNlRm9sZGVyVXJsKCkgKyAnL2lucHV0LycgKyBwYXRoLmJhc2VuYW1lKGZpbGVOYW1lKVxuICAgICAgICBhd2FpdCB3cml0ZUZpbGUoc2F2ZVBhdGgsIEJ1ZmZlci5mcm9tKGJ1ZmZlcikpXG4gICAgICAgIHJldHVybiBzYXZlUGF0aFxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRm9sZGVyVG9vbFxuIiwgImNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcclxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpXHJcbmNvbnN0IHsgb25jZSB9ID0gcmVxdWlyZSgnZXZlbnRzJylcclxuY29uc3QgeyBQYXNzVGhyb3VnaCB9ID0gcmVxdWlyZSgnc3RyZWFtJylcclxuY29uc3QgZmZtcGVnID0gcmVxdWlyZSgnZmx1ZW50LWZmbXBlZycpXHJcbmNvbnN0IFdlYnBJbWFnZSA9IHJlcXVpcmUoJ25vZGUtd2VicG11eCcpLkltYWdlXHJcbmNvbnN0IHBuZ1RvSWNvID0gcmVxdWlyZSgncG5nLXRvLWljbycpXHJcbmNvbnN0IGNvbnZlcnRIZWljID0gcmVxdWlyZSgnaGVpYy1jb252ZXJ0JylcclxuY29uc3Qgd2VicCA9IHJlcXVpcmUoJ3dlYnAtY29udmVydGVyJylcclxuaW1wb3J0IHsgcmVtb3ZlQmFja2dyb3VuZCB9IGZyb20gJ0BpbWdseS9iYWNrZ3JvdW5kLXJlbW92YWwtbm9kZSdcclxuXHJcbmNvbnN0IGZmbXBlZ1BhdGggPSByZXF1aXJlKCdmZm1wZWctc3RhdGljJykucmVwbGFjZSgnYXBwLmFzYXInLCAnYXBwLmFzYXIudW5wYWNrZWQnKVxyXG5jb25zdCBmZnByb2JlUGF0aCA9IHJlcXVpcmUoJ2ZmcHJvYmUtc3RhdGljJykucGF0aC5yZXBsYWNlKCdhcHAuYXNhcicsICdhcHAuYXNhci51bnBhY2tlZCcpXHJcblxyXG5jb25zdCBCR19NSU1FX1RZUEVTID0geyBqcGc6ICdpbWFnZS9qcGVnJywganBlZzogJ2ltYWdlL2pwZWcnLCB3ZWJwOiAnaW1hZ2Uvd2VicCcgfVxyXG5cclxuLy8gLi4uL2lucHV0L3Bob3RvLnBuZyAtPiAuLi4vb3V0cHV0L3Bob3RvLnBuZ1xyXG5jb25zdCB0b091dHB1dFBhdGggPSAoZmlsZVBhdGgpID0+IGZpbGVQYXRoLnJlcGxhY2UoL1tcXFxcL11pbnB1dChbXFxcXC9dW15cXFxcL10qKSQvLCAnL291dHB1dCQxJylcclxuXHJcbi8vIFJlbXBsYWNlIGwnZXh0ZW5zaW9uIChldCBham91dGUgZXZlbnR1ZWxsZW1lbnQgdW4gc3VmZml4ZSBhdSBub20pXHJcbmNvbnN0IHdpdGhFeHQgPSAoZmlsZVBhdGgsIGV4dCwgc3VmZml4ID0gJycpID0+IGZpbGVQYXRoLnNsaWNlKDAsIGZpbGVQYXRoLmxlbmd0aCAtIHBhdGguZXh0bmFtZShmaWxlUGF0aCkubGVuZ3RoKSArIHN1ZmZpeCArICcuJyArIGV4dFxyXG5cclxuY29uc3QgcGdjZCA9IChhLCBiKSA9PiAoYiA9PT0gMCA/IGEgOiBwZ2NkKGIsIGEgJSBiKSlcclxuXHJcbmNsYXNzIEltYWdlVG9vbCB7XHJcbiAgICAvLyBMYW5jZSBmZm1wZWcgc3VyIHVuIGZpY2hpZXIgKG91IHVuIGZsdXgpIGV0IHJldG91cm5lIGxlIGNoZW1pbiBkdSBmaWNoaWVyIHByb2R1aXQuXHJcbiAgICAvLyBgY29uZmlndXJlKGNvbW1hbmQsIHN0ZXApYCBlc3QgYXBwZWxlIGFwcmVzIGxhIGRlY2xhcmF0aW9uIGRlIGwnZW50cmVlICgnaW5wdXQnKVxyXG4gICAgLy8gcHVpcyBkZSBsYSBzb3J0aWUgKCdvdXRwdXQnKS5cclxuICAgIHN0YXRpYyBydW5GZm1wZWcoaW5wdXQsIG91dFBhdGgsIGNvbmZpZ3VyZSA9ICgpID0+IHt9KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IGZmbXBlZygpXHJcbiAgICAgICAgICAgICAgICAuc2V0RmZtcGVnUGF0aChmZm1wZWdQYXRoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKGZmcHJvYmVQYXRoKVxyXG4gICAgICAgICAgICAgICAgLmlucHV0KGlucHV0KVxyXG4gICAgICAgICAgICBjb25maWd1cmUoY29tbWFuZCwgJ2lucHV0JylcclxuICAgICAgICAgICAgY29tbWFuZC5vdXRwdXQob3V0UGF0aClcclxuICAgICAgICAgICAgY29uZmlndXJlKGNvbW1hbmQsICdvdXRwdXQnKVxyXG4gICAgICAgICAgICBjb21tYW5kLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKG91dFBhdGgpKS5vbignZXJyb3InLCByZWplY3QpLnJ1bigpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydEltYWdlVG9XZWJwKGltYWdlUGF0aCkge1xyXG4gICAgICAgIGNvbnN0IG91dFBhdGggPSB3aXRoRXh0KHRvT3V0cHV0UGF0aChpbWFnZVBhdGgpLCAnd2VicCcpXHJcbiAgICAgICAgYXdhaXQgd2VicC5jd2VicChpbWFnZVBhdGgsIG91dFBhdGgsICctcSA4MCcsICctdicpXHJcbiAgICAgICAgcmV0dXJuIG91dFBhdGhcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgY2xpcFZpZGVvKHZpZGVvUGF0aCwgc3RhcnRUaW1lLCBkdXJhdGlvbikge1xyXG4gICAgICAgIGNvbnN0IG91dFBhdGggPSB3aXRoRXh0KHZpZGVvUGF0aCwgcGF0aC5leHRuYW1lKHZpZGVvUGF0aCkuc2xpY2UoMSksICdfY2xpcCcpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuRmZtcGVnKHZpZGVvUGF0aCwgb3V0UGF0aCwgKGNvbW1hbmQsIHN0ZXApID0+IHtcclxuICAgICAgICAgICAgaWYgKHN0ZXAgPT09ICdvdXRwdXQnKSBjb21tYW5kLnNldFN0YXJ0VGltZShzdGFydFRpbWUpLnNldER1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGNyb3BWaWRlbyh2aWRlb1BhdGgsIHgsIHksIHcsIGgpIHtcclxuICAgICAgICBjb25zdCBvdXRQYXRoID0gd2l0aEV4dCh2aWRlb1BhdGgsIHBhdGguZXh0bmFtZSh2aWRlb1BhdGgpLnNsaWNlKDEpLCAnX2Nyb3AnKVxyXG4gICAgICAgIC8vIExlcyBlbmNvZGV1cnMgdmlkZW8gZXhpZ2VudCBkZXMgZGltZW5zaW9ucyBwYWlyZXNcclxuICAgICAgICBjb25zdCBldmVuVyA9IE1hdGgubWF4KDIsIHcgLSAodyAlIDIpKVxyXG4gICAgICAgIGNvbnN0IGV2ZW5IID0gTWF0aC5tYXgoMiwgaCAtIChoICUgMikpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuRmZtcGVnKHZpZGVvUGF0aCwgb3V0UGF0aCwgKGNvbW1hbmQsIHN0ZXApID0+IHtcclxuICAgICAgICAgICAgaWYgKHN0ZXAgPT09ICdvdXRwdXQnKSB7XHJcbiAgICAgICAgICAgICAgICBjb21tYW5kLnZpZGVvRmlsdGVycyhbeyBmaWx0ZXI6ICdjcm9wJywgb3B0aW9uczogeyB4LCB5LCBvdXRfdzogZXZlblcsIG91dF9oOiBldmVuSCB9IH1dKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvLyBHSUYgLyB2aWRlbyAtPiB3ZWJtIG91IG1wNFxyXG4gICAgc3RhdGljIGNvbnZlcnRHaWZUb1ZpZGVvKGltYWdlUGF0aCwgZm9ybWF0ID0gJ3dlYm0nKSB7XHJcbiAgICAgICAgY29uc3Qgb3V0UGF0aCA9IHdpdGhFeHQodG9PdXRwdXRQYXRoKGltYWdlUGF0aCksIGZvcm1hdClcclxuICAgICAgICByZXR1cm4gdGhpcy5ydW5GZm1wZWcoaW1hZ2VQYXRoLCBvdXRQYXRoLCAoY29tbWFuZCwgc3RlcCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoc3RlcCA9PT0gJ291dHB1dCcpIGNvbW1hbmQub3V0cHV0T3B0aW9ucygnLXBpeF9mbXQgeXV2NDIwcCcpLnNpemUoJzcyMHg/JylcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBjb252ZXJ0VG9HaWYoaW1hZ2VQYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuRmZtcGVnKGltYWdlUGF0aCwgd2l0aEV4dCh0b091dHB1dFBhdGgoaW1hZ2VQYXRoKSwgJ2dpZicpKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFdlYlAgYW5pbWUgLT4gd2VibSBvdSBtcDQuXHJcbiAgICAvLyBmZm1wZWcgbmUgc2FpdCBwYXMgZGVjb2RlciBsZXMgV2ViUCBhbmltZXMgOiBsZXMgaW1hZ2VzIHNvbnQgcmVjb25zdGl0dWVlcyBhdmVjIG5vZGUtd2VicG11eFxyXG4gICAgLy8gcHVpcyBlbnZveWVlcyBicnV0ZXMgKFJHQkEpIGEgZmZtcGVnLlxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRXZWJwVG9WaWRlbyhpbWFnZVBhdGgsIGZvcm1hdCA9ICd3ZWJtJykge1xyXG4gICAgICAgIGNvbnN0IGltZyA9IG5ldyBXZWJwSW1hZ2UoKVxyXG4gICAgICAgIGF3YWl0IGltZy5sb2FkKGltYWdlUGF0aClcclxuICAgICAgICBhd2FpdCBpbWcuaW5pdExpYigpXHJcbiAgICAgICAgaWYgKCFpbWcuaGFzQW5pbSkgdGhyb3cgbmV3IEVycm9yKCdUaGlzIGlzIG5vdCBhbiBhbmltYXRlZCB3ZWJwIGZpbGUnKVxyXG5cclxuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQsIGZyYW1lcyB9ID0gaW1nXHJcbiAgICAgICAgLy8gVW5lIGltYWdlIGJydXRlIGVzdCBlbnZveWVlIHRvdXRlcyBsZXMgXCJ1bml0XCIgbXMsIGNlIHF1aSByZXNwZWN0ZSBsYSBkdXJlZSBkZSBjaGFxdWUgaW1hZ2VcclxuICAgICAgICBjb25zdCB1bml0ID0gTWF0aC5tYXgoMTAsIGZyYW1lcy5yZWR1Y2UoKGFjYywgZikgPT4gcGdjZChhY2MsIGYuZGVsYXkgfHwgMTAwKSwgMCkpXHJcbiAgICAgICAgY29uc3QgZnBzID0gMTAwMCAvIHVuaXRcclxuXHJcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gbmV3IFBhc3NUaHJvdWdoKClcclxuICAgICAgICBjb25zdCBkb25lID0gdGhpcy5ydW5GZm1wZWcoc3RyZWFtLCB3aXRoRXh0KHRvT3V0cHV0UGF0aChpbWFnZVBhdGgpLCBmb3JtYXQpLCAoY29tbWFuZCwgc3RlcCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoc3RlcCA9PT0gJ2lucHV0Jykge1xyXG4gICAgICAgICAgICAgICAgY29tbWFuZC5pbnB1dEZvcm1hdCgncmF3dmlkZW8nKS5pbnB1dE9wdGlvbnMoWyctcGl4X2ZtdCByZ2JhJywgYC1zICR7d2lkdGh9eCR7aGVpZ2h0fWAsIGAtZnJhbWVyYXRlICR7ZnBzfWBdKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29tbWFuZC5vdXRwdXRPcHRpb25zKCctcGl4X2ZtdCB5dXY0MjBwJykudmlkZW9GaWx0ZXJzKCdzY2FsZT10cnVuYyhpdy8yKSoyOnRydW5jKGloLzIpKjInKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBsZXQgZmFpbHVyZSA9IG51bGxcclxuICAgICAgICBkb25lLmNhdGNoKChlKSA9PiB7IGZhaWx1cmUgPSBlIH0pXHJcblxyXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IEJ1ZmZlci5hbGxvYyh3aWR0aCAqIGhlaWdodCAqIDQpIC8vIFJHQkEsIHRyYW5zcGFyZW50IGF1IGRlcGFydFxyXG4gICAgICAgIGNvbnN0IGZsYXQgPSBCdWZmZXIuYWxsb2Mod2lkdGggKiBoZWlnaHQgKiA0KSAvLyBpbWFnZSBlbnZveWVlIGEgZmZtcGVnIDogY2FudmFzIHN1ciBmb25kIGJsYW5jXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZXMubGVuZ3RoICYmICFmYWlsdXJlOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lID0gZnJhbWVzW2ldXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdGcmFtZShjYW52YXMsIHdpZHRoLCBmcmFtZSwgQnVmZmVyLmZyb20oYXdhaXQgaW1nLmdldEZyYW1lRGF0YShpKSkpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZsYXR0ZW5PbldoaXRlKGNhbnZhcywgZmxhdClcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGVhdCA9IE1hdGgubWF4KDEsIE1hdGgucm91bmQoKGZyYW1lLmRlbGF5IHx8IDEwMCkgLyB1bml0KSlcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IG4gPSAwOyBuIDwgcmVwZWF0ICYmICFmYWlsdXJlOyBuKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXN0cmVhbS53cml0ZShmbGF0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLnJhY2UoW29uY2Uoc3RyZWFtLCAnZHJhaW4nKSwgZG9uZS5jYXRjaCgoKSA9PiB7fSldKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChmcmFtZS5kaXNwb3NlKSB0aGlzLmNsZWFyUmVjdChjYW52YXMsIHdpZHRoLCBmcmFtZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgIHN0cmVhbS5lbmQoKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXdhaXQgZG9uZVxyXG4gICAgfVxyXG5cclxuICAgIC8vIERlc3NpbmUgdW5lIGltYWdlIGRlIGwnYW5pbWF0aW9uIHN1ciBsZSBjYW52YXMgKGFscGhhIGJsZW5kaW5nIHNpIGRlbWFuZGUpXHJcbiAgICBzdGF0aWMgZHJhd0ZyYW1lKGNhbnZhcywgY2FudmFzV2lkdGgsIGZyYW1lLCBkYXRhKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBmcmFtZS5oZWlnaHQ7IHkrKykge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGZyYW1lLndpZHRoOyB4KyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNyYyA9ICh5ICogZnJhbWUud2lkdGggKyB4KSAqIDRcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRzdCA9ICgoZnJhbWUueSArIHkpICogY2FudmFzV2lkdGggKyBmcmFtZS54ICsgeCkgKiA0XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhID0gZGF0YVtzcmMgKyAzXVxyXG4gICAgICAgICAgICAgICAgaWYgKCFmcmFtZS5ibGVuZCB8fCBhID09PSAyNTUpIHtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLmNvcHkoY2FudmFzLCBkc3QsIHNyYywgc3JjICsgNClcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkc3RBID0gY2FudmFzW2RzdCArIDNdXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3V0QSA9IGEgKyBkc3RBICogKDI1NSAtIGEpIC8gMjU1XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgYyA9IDA7IGMgPCAzOyBjKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzW2RzdCArIGNdID0gKGRhdGFbc3JjICsgY10gKiBhICsgY2FudmFzW2RzdCArIGNdICogZHN0QSAqICgyNTUgLSBhKSAvIDI1NSkgLyBvdXRBXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhc1tkc3QgKyAzXSA9IG91dEFcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgY2xlYXJSZWN0KGNhbnZhcywgY2FudmFzV2lkdGgsIGZyYW1lKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBmcmFtZS5oZWlnaHQ7IHkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBzdGFydCA9ICgoZnJhbWUueSArIHkpICogY2FudmFzV2lkdGggKyBmcmFtZS54KSAqIDRcclxuICAgICAgICAgICAgY2FudmFzLmZpbGwoMCwgc3RhcnQsIHN0YXJ0ICsgZnJhbWUud2lkdGggKiA0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBMZXMgZm9ybWF0cyB2aWRlbyBuJ29udCBwYXMgZGUgdHJhbnNwYXJlbmNlIDogb24gbGEgcmVtcGxhY2UgcGFyIGR1IGJsYW5jXHJcbiAgICBzdGF0aWMgZmxhdHRlbk9uV2hpdGUoY2FudmFzLCBvdXQpIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhbnZhcy5sZW5ndGg7IGkgKz0gNCkge1xyXG4gICAgICAgICAgICBjb25zdCBhID0gY2FudmFzW2kgKyAzXSAvIDI1NVxyXG4gICAgICAgICAgICBvdXRbaV0gPSBjYW52YXNbaV0gKiBhICsgMjU1ICogKDEgLSBhKVxyXG4gICAgICAgICAgICBvdXRbaSArIDFdID0gY2FudmFzW2kgKyAxXSAqIGEgKyAyNTUgKiAoMSAtIGEpXHJcbiAgICAgICAgICAgIG91dFtpICsgMl0gPSBjYW52YXNbaSArIDJdICogYSArIDI1NSAqICgxIC0gYSlcclxuICAgICAgICAgICAgb3V0W2kgKyAzXSA9IDI1NVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydFBuZ1RvSWNvKGZpbGVOYW1lKSB7XHJcbiAgICAgICAgY29uc3Qgb3V0UGF0aCA9IHdpdGhFeHQodG9PdXRwdXRQYXRoKGZpbGVOYW1lKSwgJ2ljbycpXHJcbiAgICAgICAgYXdhaXQgZnMucHJvbWlzZXMud3JpdGVGaWxlKG91dFBhdGgsIGF3YWl0IHBuZ1RvSWNvKGZpbGVOYW1lKSlcclxuICAgICAgICByZXR1cm4gb3V0UGF0aFxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjb252ZXJ0SGVpY1RvSnBnKGZpbGVOYW1lKSB7XHJcbiAgICAgICAgY29uc3Qgb3V0UGF0aCA9IHdpdGhFeHQodG9PdXRwdXRQYXRoKGZpbGVOYW1lKSwgJ2pwZycpXHJcbiAgICAgICAgY29uc3QgYnVmZmVyID0gYXdhaXQgY29udmVydEhlaWMoe1xyXG4gICAgICAgICAgICBidWZmZXI6IGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGZpbGVOYW1lKSxcclxuICAgICAgICAgICAgZm9ybWF0OiAnSlBFRycsXHJcbiAgICAgICAgICAgIHF1YWxpdHk6IDFcclxuICAgICAgICB9KVxyXG4gICAgICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShvdXRQYXRoLCBCdWZmZXIuZnJvbShidWZmZXIpKVxyXG4gICAgICAgIHJldHVybiBvdXRQYXRoXHJcbiAgICB9XHJcblxyXG4gICAgLy8gTGUgcmVzdWx0YXQgZXN0IHRvdWpvdXJzIHVuIFBORyAodHJhbnNwYXJlbmNlKVxyXG4gICAgc3RhdGljIGFzeW5jIHJlbW92ZUltYWdlQmFja2dyb3VuZChpbWdQYXRoKSB7XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IEJHX01JTUVfVFlQRVNbcGF0aC5leHRuYW1lKGltZ1BhdGgpLnNsaWNlKDEpLnRvTG93ZXJDYXNlKCldIHx8ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFthd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShpbWdQYXRoKV0sIHsgdHlwZSB9KVxyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlbW92ZUJhY2tncm91bmQoYmxvYilcclxuICAgICAgICBjb25zdCBvdXRQYXRoID0gd2l0aEV4dCh0b091dHB1dFBhdGgoaW1nUGF0aCksICdwbmcnKVxyXG4gICAgICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShvdXRQYXRoLCBCdWZmZXIuZnJvbShhd2FpdCByZXN1bHQuYXJyYXlCdWZmZXIoKSkpXHJcbiAgICAgICAgcmV0dXJuIG91dFBhdGhcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgSW1hZ2VUb29sXHJcbiIsICJjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgY3AgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJyk7XG5jb25zdCBodHRwID0gcmVxdWlyZSgnaHR0cCcpO1xuY29uc3QgaHR0cHMgPSByZXF1aXJlKCdodHRwcycpO1xuXG5jbGFzcyBWaWRlb0Rvd25sb2FkZXJUb29sIHtcbiAgICBjb25zdHJ1Y3Rvcihmb2xkZXJUb29sKSB7XG4gICAgICAgIHRoaXMuZm9sZGVyVG9vbCA9IGZvbGRlclRvb2xcbiAgICB9XG4gICAgYXN5bmMgZG93bmxvYWRWaWRlbyh1cmwpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZG93bmxvYWRWaWRlbyh1cmwpO1xuICAgIH1cbiAgICAvLyBEb3NzaWVyIGNvbnRlbmFudCB5dC1kbHAuZXhlIGV0IGZmbXBlZyAoZXh0cmFSZXNvdXJjZSBlbiBwcm9kLCAuL3Jlc291cmNlcyBlbiBkZXYpXG4gICAgZ2V0QmluRm9sZGVyKCkge1xuICAgICAgICBjb25zdCBwcm9kID0gcGF0aC5qb2luKHByb2Nlc3MucmVzb3VyY2VzUGF0aCB8fCAnJywgJ2ZmbXBlZycpO1xuICAgICAgICByZXR1cm4gZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ocHJvZCwgJ3l0LWRscC5leGUnKSkgPyBwcm9kIDogcGF0aC5yZXNvbHZlKCcuL3Jlc291cmNlcy9mZm1wZWcnKTtcbiAgICB9XG4gICAgLy8gTGFuY2UgeXQtZGxwIGV0IHJldG91cm5lIGxlIGNoZW1pbiBkdSBmaWNoaWVyIHByb2R1aXQgKG91IG51bGwpXG4gICAgcnVuWXREbHAodXJsLCBleHRyYUFyZ3MpIHtcbiAgICAgICAgY29uc3QgYmluRm9sZGVyID0gdGhpcy5nZXRCaW5Gb2xkZXIoKTtcbiAgICAgICAgY29uc3QgaW5wdXREaXIgPSB0aGlzLmZvbGRlclRvb2wuQkFTRV9QQVRIICsgJy8nICsgdGhpcy5mb2xkZXJUb29sLldPUktTUEFDRV9ESVIgKyAnL2lucHV0JztcbiAgICAgICAgY29uc3QgYXJncyA9IFtcbiAgICAgICAgICAgICctLW5vLXBsYXlsaXN0JyxcbiAgICAgICAgICAgICctLW5vLXdhcm5pbmdzJyxcbiAgICAgICAgICAgICctLWZmbXBlZy1sb2NhdGlvbicsIGJpbkZvbGRlcixcbiAgICAgICAgICAgICctUCcsIGlucHV0RGlyLFxuICAgICAgICAgICAgJy1vJywgJyUoaWQpcy4lKGV4dClzJyxcbiAgICAgICAgICAgICctLXByaW50JywgJ2FmdGVyX21vdmU6ZmlsZXBhdGgnLFxuICAgICAgICAgICAgLi4uZXh0cmFBcmdzLFxuICAgICAgICAgICAgdXJsXG4gICAgICAgIF07XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNwLmV4ZWNGaWxlKHBhdGguam9pbihiaW5Gb2xkZXIsICd5dC1kbHAuZXhlJyksIGFyZ3MsIHsgbWF4QnVmZmVyOiAxMDI0ICogMTAyNCAqIDEwLCB3aW5kb3dzSGlkZTogdHJ1ZSB9LCAoZXJyLCBzdGRvdXQsIHN0ZGVycikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3RkZXJyIHx8IGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9IHN0ZG91dC5zcGxpdChcIj9cIikubWFwKGwgPT4gbC50cmltKCkpLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgICAgIHJlc29sdmUobGluZXMubGVuZ3RoID8gbGluZXNbbGluZXMubGVuZ3RoIC0gMV0gOiBudWxsKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG4gICAgYXN5bmMgZG93bmxvYWRWaWRlbyh1cmwpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucnVuWXREbHAodXJsLCBbXG4gICAgICAgICAgICAnLWYnLCAnYnYqK2JhL2InLFxuICAgICAgICAgICAgJy1TJywgJ3Zjb2RlYzpoMjY0LHJlcyxhY29kZWM6bTRhJyxcbiAgICAgICAgICAgICctLW1lcmdlLW91dHB1dC1mb3JtYXQnLCAnbXA0J1xuICAgICAgICBdKTtcbiAgICB9XG4gICAgYXN5bmMgZG93bmxvYWRBdWRpbyh1cmwpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucnVuWXREbHAodXJsLCBbJy14JywgJy0tYXVkaW8tZm9ybWF0JywgJ21wMyddKTtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRGaWxlRnJvbVVybCh1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaW5hbFBhdGggPSB0aGlzLmZvbGRlclRvb2wuQkFTRV9QQVRIICsgJy8nICsgdGhpcy5mb2xkZXJUb29sLldPUktTUEFDRV9ESVIgKyAnL2lucHV0LycgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDAwKSArICcubXA0JztcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShmaW5hbFBhdGgpO1xuICAgICAgICAgICAgbGV0IHByb3RvY29sID0gaHR0cFxuICAgICAgICAgICAgaWYgKHVybC5zcGxpdCgnOicpWzBdID09PSAnaHR0cHMnKSB7XG4gICAgICAgICAgICAgICAgcHJvdG9jb2wgPSBodHRwc1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJvdG9jb2wuZ2V0KHVybCwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UucGlwZShmaWxlKTtcblxuICAgICAgICAgICAgICAgIC8vIGFmdGVyIGRvd25sb2FkIGNvbXBsZXRlZCBjbG9zZSBmaWxlc3RyZWFtXG4gICAgICAgICAgICAgICAgZmlsZS5vbihcImZpbmlzaFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShmaW5hbFBhdGgpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG59XG5leHBvcnQgZGVmYXVsdCBWaWRlb0Rvd25sb2FkZXJUb29sOyJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0JBQTRDO0FBQzVDLGtCQUFpQjtBQUNqQixnQkFBZTs7O0FDRmYsSUFBTSxLQUFLLFFBQVE7QUFDbkIsSUFBTSxPQUFPLFFBQVE7QUFDckIsSUFBTSxFQUFFLFNBQVMsVUFBVSxXQUFXLE9BQU8sSUFBSSxHQUFHO0FBRXBELElBQU0sZ0JBQWdCO0FBRXRCLElBQU0sYUFBYTtBQUFBLEVBQ2YsS0FBSztBQUFBLEVBQ0wsTUFBTTtBQUFBLEVBQ04sS0FBSztBQUFBLEVBQ0wsS0FBSztBQUFBLEVBQ0wsTUFBTTtBQUFBLEVBQ04sS0FBSztBQUFBLEVBQ0wsS0FBSztBQUFBLEVBQ0wsTUFBTTtBQUFBLEVBQ04sS0FBSztBQUFBLEVBQ0wsS0FBSztBQUFBLEVBQ0wsS0FBSztBQUFBLEVBQ0wsS0FBSztBQUNUO0FBRUEsSUFBTSxhQUFOLE1BQWlCO0FBQUEsRUFDYixZQUFZQSxNQUFLO0FBQ2IsU0FBSyxZQUFZQSxLQUFJLFFBQVEsVUFBVTtBQUN2QyxTQUFLLGdCQUFnQjtBQUNyQixPQUFHLFVBQVUsS0FBSyxpQkFBaUIsSUFBSSxVQUFVLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFDcEUsT0FBRyxVQUFVLEtBQUssaUJBQWlCLElBQUksV0FBVyxFQUFFLFdBQVcsS0FBSyxDQUFDO0FBQUEsRUFDekU7QUFBQSxFQUVBLG1CQUFtQjtBQUNmLFdBQU8sS0FBSyxZQUFZLE1BQU0sS0FBSztBQUFBLEVBQ3ZDO0FBQUEsRUFHQSxrQkFBa0IsVUFBVTtBQUN4QixVQUFNLE9BQU8sS0FBSyxRQUFRLEtBQUssaUJBQWlCLENBQUM7QUFDakQsVUFBTSxTQUFTLEtBQUssUUFBUSxRQUFRO0FBQ3BDLFFBQUksQ0FBQyxPQUFPLFdBQVcsT0FBTyxLQUFLLEdBQUcsR0FBRztBQUNyQyxZQUFNLElBQUksTUFBTSxvQ0FBb0MsUUFBUTtBQUFBLElBQ2hFO0FBQ0EsV0FBTztBQUFBLEVBQ1g7QUFBQSxFQUVBLE1BQU0sY0FBYztBQUNoQixlQUFXLFVBQVUsQ0FBQyxTQUFTLFFBQVEsR0FBRztBQUN0QyxZQUFNLE1BQU0sS0FBSyxpQkFBaUIsSUFBSSxNQUFNO0FBQzVDLGlCQUFXLFFBQVEsTUFBTSxLQUFLLFdBQVcsR0FBRyxHQUFHO0FBQzNDLGNBQU0sT0FBTyxJQUFJO0FBQUEsTUFDckI7QUFBQSxJQUNKO0FBQ0EsV0FBTztBQUFBLEVBQ1g7QUFBQSxFQUdBLE1BQU0sV0FBVyxTQUFTO0FBQ3RCLFFBQUksUUFBUSxDQUFDO0FBQ2IsVUFBTSxRQUFRLE1BQU0sUUFBUSxTQUFTLEVBQUUsZUFBZSxLQUFLLENBQUM7QUFDNUQsZUFBVyxRQUFRLE9BQU87QUFDdEIsWUFBTSxXQUFXLEdBQUcsV0FBVyxLQUFLO0FBQ3BDLFVBQUksS0FBSyxZQUFZLEdBQUc7QUFDcEIsZ0JBQVEsQ0FBQyxHQUFHLE9BQU8sR0FBSSxNQUFNLEtBQUssV0FBVyxRQUFRLENBQUU7QUFBQSxNQUMzRCxPQUFPO0FBQ0gsY0FBTSxLQUFLLFFBQVE7QUFBQSxNQUN2QjtBQUFBLElBQ0o7QUFDQSxXQUFPO0FBQUEsRUFDWDtBQUFBLEVBR0EsTUFBTSxTQUFTLFVBQVU7QUFDckIsVUFBTSxPQUFPLE1BQU0sU0FBUyxLQUFLLGtCQUFrQixRQUFRLENBQUM7QUFDNUQsV0FBTyxLQUFLLGdCQUFnQixRQUFRLElBQUksS0FBSyxTQUFTLFFBQVE7QUFBQSxFQUNsRTtBQUFBLEVBRUEsZ0JBQWdCLFVBQVU7QUFDdEIsVUFBTSxPQUFPLFdBQVcsS0FBSyxRQUFRLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRSxZQUFZO0FBQ3BFLFdBQU8sT0FBTyxRQUFRLGlCQUFpQjtBQUFBLEVBQzNDO0FBQUEsRUFFQSxNQUFNLFdBQVcsVUFBVTtBQUN2QixVQUFNLE9BQU8sS0FBSyxrQkFBa0IsUUFBUSxDQUFDO0FBQzdDLFdBQU87QUFBQSxFQUNYO0FBQUEsRUFFQSxNQUFNLFdBQVcsVUFBVSxRQUFRO0FBQy9CLFVBQU0sV0FBVyxLQUFLLGlCQUFpQixJQUFJLFlBQVksS0FBSyxTQUFTLFFBQVE7QUFDN0UsVUFBTSxVQUFVLFVBQVUsT0FBTyxLQUFLLE1BQU0sQ0FBQztBQUM3QyxXQUFPO0FBQUEsRUFDWDtBQUNKO0FBRUEsSUFBTyxxQkFBUTs7O0FDbEZmLHFDQUFpQztBQVRqQyxJQUFNQyxRQUFPLFFBQVE7QUFDckIsSUFBTUMsTUFBSyxRQUFRO0FBQ25CLElBQU0sRUFBRSxLQUFLLElBQUksUUFBUTtBQUN6QixJQUFNLEVBQUUsWUFBWSxJQUFJLFFBQVE7QUFDaEMsSUFBTSxTQUFTLFFBQVE7QUFDdkIsSUFBTSxZQUFZLFFBQVEsZ0JBQWdCO0FBQzFDLElBQU0sV0FBVyxRQUFRO0FBQ3pCLElBQU0sY0FBYyxRQUFRO0FBQzVCLElBQU0sT0FBTyxRQUFRO0FBR3JCLElBQU0sYUFBYSxRQUFRLGlCQUFpQixRQUFRLFlBQVksbUJBQW1CO0FBQ25GLElBQU0sY0FBYyxRQUFRLGtCQUFrQixLQUFLLFFBQVEsWUFBWSxtQkFBbUI7QUFFMUYsSUFBTSxnQkFBZ0IsRUFBRSxLQUFLLGNBQWMsTUFBTSxjQUFjLE1BQU0sYUFBYTtBQUdsRixJQUFNLGVBQWUsQ0FBQyxhQUFhLFNBQVMsUUFBUSw2QkFBNkIsV0FBVztBQUc1RixJQUFNLFVBQVUsQ0FBQyxVQUFVLEtBQUssU0FBUyxPQUFPLFNBQVMsTUFBTSxHQUFHLFNBQVMsU0FBU0QsTUFBSyxRQUFRLFFBQVEsRUFBRSxNQUFNLElBQUksU0FBUyxNQUFNO0FBRXBJLElBQU0sT0FBTyxDQUFDLEdBQUcsTUFBTyxNQUFNLElBQUksSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBRW5ELElBQU0sWUFBTixNQUFnQjtBQUFBLEVBSVosT0FBTyxVQUFVLE9BQU8sU0FBUyxZQUFZLE1BQU07QUFBQSxFQUFDLEdBQUc7QUFDbkQsV0FBTyxJQUFJLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFDcEMsWUFBTSxVQUFVLE9BQU8sRUFDbEIsY0FBYyxVQUFVLEVBQ3hCLGVBQWUsV0FBVyxFQUMxQixNQUFNLEtBQUs7QUFDaEIsZ0JBQVUsU0FBUyxPQUFPO0FBQzFCLGNBQVEsT0FBTyxPQUFPO0FBQ3RCLGdCQUFVLFNBQVMsUUFBUTtBQUMzQixjQUFRLEdBQUcsT0FBTyxNQUFNLFFBQVEsT0FBTyxDQUFDLEVBQUUsR0FBRyxTQUFTLE1BQU0sRUFBRSxJQUFJO0FBQUEsSUFDdEUsQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUVBLGFBQWEsbUJBQW1CLFdBQVc7QUFDdkMsVUFBTSxVQUFVLFFBQVEsYUFBYSxTQUFTLEdBQUcsTUFBTTtBQUN2RCxVQUFNLEtBQUssTUFBTSxXQUFXLFNBQVMsU0FBUyxJQUFJO0FBQ2xELFdBQU87QUFBQSxFQUNYO0FBQUEsRUFFQSxPQUFPLFVBQVUsV0FBVyxXQUFXLFVBQVU7QUFDN0MsVUFBTSxVQUFVLFFBQVEsV0FBV0EsTUFBSyxRQUFRLFNBQVMsRUFBRSxNQUFNLENBQUMsR0FBRyxPQUFPO0FBQzVFLFdBQU8sS0FBSyxVQUFVLFdBQVcsU0FBUyxDQUFDLFNBQVMsU0FBUztBQUN6RCxVQUFJLFNBQVM7QUFBVSxnQkFBUSxhQUFhLFNBQVMsRUFBRSxZQUFZLFFBQVE7QUFBQSxJQUMvRSxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBRUEsT0FBTyxVQUFVLFdBQVcsR0FBRyxHQUFHLEdBQUcsR0FBRztBQUNwQyxVQUFNLFVBQVUsUUFBUSxXQUFXQSxNQUFLLFFBQVEsU0FBUyxFQUFFLE1BQU0sQ0FBQyxHQUFHLE9BQU87QUFFNUUsVUFBTSxRQUFRLEtBQUssSUFBSSxHQUFHLElBQUssSUFBSSxDQUFFO0FBQ3JDLFVBQU0sUUFBUSxLQUFLLElBQUksR0FBRyxJQUFLLElBQUksQ0FBRTtBQUNyQyxXQUFPLEtBQUssVUFBVSxXQUFXLFNBQVMsQ0FBQyxTQUFTLFNBQVM7QUFDekQsVUFBSSxTQUFTLFVBQVU7QUFDbkIsZ0JBQVEsYUFBYSxDQUFDLEVBQUUsUUFBUSxRQUFRLFNBQVMsRUFBRSxHQUFHLEdBQUcsT0FBTyxPQUFPLE9BQU8sTUFBTSxFQUFFLENBQUMsQ0FBQztBQUFBLE1BQzVGO0FBQUEsSUFDSixDQUFDO0FBQUEsRUFDTDtBQUFBLEVBR0EsT0FBTyxrQkFBa0IsV0FBVyxTQUFTLFFBQVE7QUFDakQsVUFBTSxVQUFVLFFBQVEsYUFBYSxTQUFTLEdBQUcsTUFBTTtBQUN2RCxXQUFPLEtBQUssVUFBVSxXQUFXLFNBQVMsQ0FBQyxTQUFTLFNBQVM7QUFDekQsVUFBSSxTQUFTO0FBQVUsZ0JBQVEsY0FBYyxrQkFBa0IsRUFBRSxLQUFLLE9BQU87QUFBQSxJQUNqRixDQUFDO0FBQUEsRUFDTDtBQUFBLEVBRUEsT0FBTyxhQUFhLFdBQVc7QUFDM0IsV0FBTyxLQUFLLFVBQVUsV0FBVyxRQUFRLGFBQWEsU0FBUyxHQUFHLEtBQUssQ0FBQztBQUFBLEVBQzVFO0FBQUEsRUFLQSxhQUFhLG1CQUFtQixXQUFXLFNBQVMsUUFBUTtBQUN4RCxVQUFNLE1BQU0sSUFBSSxVQUFVO0FBQzFCLFVBQU0sSUFBSSxLQUFLLFNBQVM7QUFDeEIsVUFBTSxJQUFJLFFBQVE7QUFDbEIsUUFBSSxDQUFDLElBQUk7QUFBUyxZQUFNLElBQUksTUFBTSxtQ0FBbUM7QUFFckUsVUFBTSxFQUFFLE9BQU8sUUFBUSxPQUFPLElBQUk7QUFFbEMsVUFBTSxPQUFPLEtBQUssSUFBSSxJQUFJLE9BQU8sT0FBTyxDQUFDLEtBQUssTUFBTSxLQUFLLEtBQUssRUFBRSxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDakYsVUFBTSxNQUFNLE1BQU87QUFFbkIsVUFBTSxTQUFTLElBQUksWUFBWTtBQUMvQixVQUFNLE9BQU8sS0FBSyxVQUFVLFFBQVEsUUFBUSxhQUFhLFNBQVMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxTQUFTLFNBQVM7QUFDN0YsVUFBSSxTQUFTLFNBQVM7QUFDbEIsZ0JBQVEsWUFBWSxVQUFVLEVBQUUsYUFBYSxDQUFDLGlCQUFpQixNQUFNLFNBQVMsVUFBVSxjQUFjLEtBQUssQ0FBQztBQUFBLE1BQ2hILE9BQU87QUFDSCxnQkFBUSxjQUFjLGtCQUFrQixFQUFFLGFBQWEsbUNBQW1DO0FBQUEsTUFDOUY7QUFBQSxJQUNKLENBQUM7QUFDRCxRQUFJLFVBQVU7QUFDZCxTQUFLLE1BQU0sQ0FBQyxNQUFNO0FBQUUsZ0JBQVU7QUFBQSxJQUFFLENBQUM7QUFFakMsVUFBTSxTQUFTLE9BQU8sTUFBTSxRQUFRLFNBQVMsQ0FBQztBQUM5QyxVQUFNLE9BQU8sT0FBTyxNQUFNLFFBQVEsU0FBUyxDQUFDO0FBQzVDLFFBQUk7QUFDQSxlQUFTLElBQUksR0FBRyxJQUFJLE9BQU8sVUFBVSxDQUFDLFNBQVMsS0FBSztBQUNoRCxjQUFNLFFBQVEsT0FBTztBQUNyQixhQUFLLFVBQVUsUUFBUSxPQUFPLE9BQU8sT0FBTyxLQUFLLE1BQU0sSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDO0FBQzNFLGFBQUssZUFBZSxRQUFRLElBQUk7QUFDaEMsY0FBTSxTQUFTLEtBQUssSUFBSSxHQUFHLEtBQUssT0FBTyxNQUFNLFNBQVMsT0FBTyxJQUFJLENBQUM7QUFDbEUsaUJBQVMsSUFBSSxHQUFHLElBQUksVUFBVSxDQUFDLFNBQVMsS0FBSztBQUN6QyxjQUFJLENBQUMsT0FBTyxNQUFNLElBQUksR0FBRztBQUNyQixrQkFBTSxRQUFRLEtBQUssQ0FBQyxLQUFLLFFBQVEsT0FBTyxHQUFHLEtBQUssTUFBTSxNQUFNO0FBQUEsWUFBQyxDQUFDLENBQUMsQ0FBQztBQUFBLFVBQ3BFO0FBQUEsUUFDSjtBQUNBLFlBQUksTUFBTTtBQUFTLGVBQUssVUFBVSxRQUFRLE9BQU8sS0FBSztBQUFBLE1BQzFEO0FBQUEsSUFDSixVQUFFO0FBQ0UsYUFBTyxJQUFJO0FBQUEsSUFDZjtBQUNBLFdBQU8sTUFBTTtBQUFBLEVBQ2pCO0FBQUEsRUFHQSxPQUFPLFVBQVUsUUFBUSxhQUFhLE9BQU8sTUFBTTtBQUMvQyxhQUFTLElBQUksR0FBRyxJQUFJLE1BQU0sUUFBUSxLQUFLO0FBQ25DLGVBQVMsSUFBSSxHQUFHLElBQUksTUFBTSxPQUFPLEtBQUs7QUFDbEMsY0FBTSxPQUFPLElBQUksTUFBTSxRQUFRLEtBQUs7QUFDcEMsY0FBTSxRQUFRLE1BQU0sSUFBSSxLQUFLLGNBQWMsTUFBTSxJQUFJLEtBQUs7QUFDMUQsY0FBTSxJQUFJLEtBQUssTUFBTTtBQUNyQixZQUFJLENBQUMsTUFBTSxTQUFTLE1BQU0sS0FBSztBQUMzQixlQUFLLEtBQUssUUFBUSxLQUFLLEtBQUssTUFBTSxDQUFDO0FBQUEsUUFDdkMsV0FBVyxJQUFJLEdBQUc7QUFDZCxnQkFBTSxPQUFPLE9BQU8sTUFBTTtBQUMxQixnQkFBTSxPQUFPLElBQUksUUFBUSxNQUFNLEtBQUs7QUFDcEMsbUJBQVMsSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLO0FBQ3hCLG1CQUFPLE1BQU0sTUFBTSxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsTUFBTSxLQUFLLE9BQU87QUFBQSxVQUN2RjtBQUNBLGlCQUFPLE1BQU0sS0FBSztBQUFBLFFBQ3RCO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQUEsRUFFQSxPQUFPLFVBQVUsUUFBUSxhQUFhLE9BQU87QUFDekMsYUFBUyxJQUFJLEdBQUcsSUFBSSxNQUFNLFFBQVEsS0FBSztBQUNuQyxZQUFNLFVBQVUsTUFBTSxJQUFJLEtBQUssY0FBYyxNQUFNLEtBQUs7QUFDeEQsYUFBTyxLQUFLLEdBQUcsT0FBTyxRQUFRLE1BQU0sUUFBUSxDQUFDO0FBQUEsSUFDakQ7QUFBQSxFQUNKO0FBQUEsRUFHQSxPQUFPLGVBQWUsUUFBUSxLQUFLO0FBQy9CLGFBQVMsSUFBSSxHQUFHLElBQUksT0FBTyxRQUFRLEtBQUssR0FBRztBQUN2QyxZQUFNLElBQUksT0FBTyxJQUFJLEtBQUs7QUFDMUIsVUFBSSxLQUFLLE9BQU8sS0FBSyxJQUFJLE9BQU8sSUFBSTtBQUNwQyxVQUFJLElBQUksS0FBSyxPQUFPLElBQUksS0FBSyxJQUFJLE9BQU8sSUFBSTtBQUM1QyxVQUFJLElBQUksS0FBSyxPQUFPLElBQUksS0FBSyxJQUFJLE9BQU8sSUFBSTtBQUM1QyxVQUFJLElBQUksS0FBSztBQUFBLElBQ2pCO0FBQUEsRUFDSjtBQUFBLEVBRUEsYUFBYSxnQkFBZ0IsVUFBVTtBQUNuQyxVQUFNLFVBQVUsUUFBUSxhQUFhLFFBQVEsR0FBRyxLQUFLO0FBQ3JELFVBQU1DLElBQUcsU0FBUyxVQUFVLFNBQVMsTUFBTSxTQUFTLFFBQVEsQ0FBQztBQUM3RCxXQUFPO0FBQUEsRUFDWDtBQUFBLEVBRUEsYUFBYSxpQkFBaUIsVUFBVTtBQUNwQyxVQUFNLFVBQVUsUUFBUSxhQUFhLFFBQVEsR0FBRyxLQUFLO0FBQ3JELFVBQU0sU0FBUyxNQUFNLFlBQVk7QUFBQSxNQUM3QixRQUFRLE1BQU1BLElBQUcsU0FBUyxTQUFTLFFBQVE7QUFBQSxNQUMzQyxRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsSUFDYixDQUFDO0FBQ0QsVUFBTUEsSUFBRyxTQUFTLFVBQVUsU0FBUyxPQUFPLEtBQUssTUFBTSxDQUFDO0FBQ3hELFdBQU87QUFBQSxFQUNYO0FBQUEsRUFHQSxhQUFhLHNCQUFzQixTQUFTO0FBQ3hDLFVBQU0sT0FBTyxjQUFjRCxNQUFLLFFBQVEsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFFLFlBQVksTUFBTTtBQUM1RSxVQUFNLE9BQU8sSUFBSSxLQUFLLENBQUMsTUFBTUMsSUFBRyxTQUFTLFNBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUM7QUFDckUsVUFBTSxTQUFTLFVBQU0saURBQWlCLElBQUk7QUFDMUMsVUFBTSxVQUFVLFFBQVEsYUFBYSxPQUFPLEdBQUcsS0FBSztBQUNwRCxVQUFNQSxJQUFHLFNBQVMsVUFBVSxTQUFTLE9BQU8sS0FBSyxNQUFNLE9BQU8sWUFBWSxDQUFDLENBQUM7QUFDNUUsV0FBTztBQUFBLEVBQ1g7QUFDSjtBQUVBLElBQU8sb0JBQVE7OztBQy9MZixJQUFNQyxNQUFLLFFBQVE7QUFDbkIsSUFBTUMsUUFBTyxRQUFRO0FBQ3JCLElBQU0sS0FBSyxRQUFRO0FBQ25CLElBQU0sT0FBTyxRQUFRO0FBQ3JCLElBQU0sUUFBUSxRQUFRO0FBRXRCLElBQU0sc0JBQU4sTUFBMEI7QUFBQSxFQUN0QixZQUFZQyxhQUFZO0FBQ3BCLFNBQUssYUFBYUE7QUFBQSxFQUN0QjtBQUFBLEVBQ0EsTUFBTSxjQUFjLEtBQUs7QUFDckIsV0FBTyxNQUFNLEtBQUssY0FBYyxHQUFHO0FBQUEsRUFDdkM7QUFBQSxFQUVBLGVBQWU7QUFDWCxVQUFNLE9BQU9ELE1BQUssS0FBSyxRQUFRLGlCQUFpQixJQUFJLFFBQVE7QUFDNUQsV0FBT0QsSUFBRyxXQUFXQyxNQUFLLEtBQUssTUFBTSxZQUFZLENBQUMsSUFBSSxPQUFPQSxNQUFLLFFBQVEsb0JBQW9CO0FBQUEsRUFDbEc7QUFBQSxFQUVBLFNBQVMsS0FBSyxXQUFXO0FBQ3JCLFVBQU0sWUFBWSxLQUFLLGFBQWE7QUFDcEMsVUFBTSxXQUFXLEtBQUssV0FBVyxZQUFZLE1BQU0sS0FBSyxXQUFXLGdCQUFnQjtBQUNuRixVQUFNLE9BQU87QUFBQSxNQUNUO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUFxQjtBQUFBLE1BQ3JCO0FBQUEsTUFBTTtBQUFBLE1BQ047QUFBQSxNQUFNO0FBQUEsTUFDTjtBQUFBLE1BQVc7QUFBQSxNQUNYLEdBQUc7QUFBQSxNQUNIO0FBQUEsSUFDSjtBQUNBLFdBQU8sSUFBSSxRQUFRLGFBQVc7QUFDMUIsU0FBRyxTQUFTQSxNQUFLLEtBQUssV0FBVyxZQUFZLEdBQUcsTUFBTSxFQUFFLFdBQVcsT0FBTyxPQUFPLElBQUksYUFBYSxLQUFLLEdBQUcsQ0FBQyxLQUFLLFFBQVEsV0FBVztBQUMvSCxZQUFJLEtBQUs7QUFDTCxrQkFBUSxJQUFJLFVBQVUsSUFBSSxPQUFPO0FBQ2pDLGtCQUFRLElBQUk7QUFDWjtBQUFBLFFBQ0o7QUFDQSxjQUFNLFFBQVEsT0FBTyxNQUFNLEdBQUcsRUFBRSxJQUFJLE9BQUssRUFBRSxLQUFLLENBQUMsRUFBRSxPQUFPLE9BQU87QUFDakUsZ0JBQVEsTUFBTSxTQUFTLE1BQU0sTUFBTSxTQUFTLEtBQUssSUFBSTtBQUFBLE1BQ3pELENBQUM7QUFBQSxJQUNMLENBQUM7QUFBQSxFQUNMO0FBQUEsRUFDQSxNQUFNLGNBQWMsS0FBSztBQUNyQixXQUFPLE1BQU0sS0FBSyxTQUFTLEtBQUs7QUFBQSxNQUM1QjtBQUFBLE1BQU07QUFBQSxNQUNOO0FBQUEsTUFBTTtBQUFBLE1BQ047QUFBQSxNQUF5QjtBQUFBLElBQzdCLENBQUM7QUFBQSxFQUNMO0FBQUEsRUFDQSxNQUFNLGNBQWMsS0FBSztBQUNyQixXQUFPLE1BQU0sS0FBSyxTQUFTLEtBQUssQ0FBQyxNQUFNLGtCQUFrQixLQUFLLENBQUM7QUFBQSxFQUNuRTtBQUFBLEVBRUEsTUFBTSxlQUFlLEtBQUs7QUFDdEIsV0FBTyxJQUFJLFFBQVEsQ0FBQyxZQUFZO0FBQzVCLFlBQU0sWUFBWSxLQUFLLFdBQVcsWUFBWSxNQUFNLEtBQUssV0FBVyxnQkFBZ0IsWUFBWSxLQUFLLE1BQU0sS0FBSyxPQUFPLElBQUksR0FBSSxJQUFJO0FBQ25JLFlBQU0sT0FBT0QsSUFBRyxrQkFBa0IsU0FBUztBQUMzQyxVQUFJLFdBQVc7QUFDZixVQUFJLElBQUksTUFBTSxHQUFHLEVBQUUsT0FBTyxTQUFTO0FBQy9CLG1CQUFXO0FBQUEsTUFDZjtBQUNBLGVBQVMsSUFBSSxLQUFLLFNBQVUsVUFBVTtBQUNsQyxpQkFBUyxLQUFLLElBQUk7QUFHbEIsYUFBSyxHQUFHLFVBQVUsTUFBTTtBQUNwQixlQUFLLE1BQU07QUFDWCxrQkFBUSxTQUFTO0FBQUEsUUFDckIsQ0FBQztBQUFBLE1BQ0wsQ0FBQztBQUFBLElBQ0wsQ0FBQztBQUFBLEVBQ0w7QUFDSjtBQUNBLElBQU8sOEJBQVE7OztBSG5FZixJQUFNLFdBQVcsUUFBUSxZQUFZLFVBQUFHLFFBQUcsU0FBUztBQUVqRCxJQUFJO0FBRUosSUFBTSxhQUFhLElBQUksbUJBQVcsbUJBQUc7QUFDckMsSUFBTSxvQkFBb0IsSUFBSSw0QkFBb0IsVUFBVTtBQUU1RCxTQUFTLGVBQWU7QUFJcEIsZUFBYSxJQUFJLDhCQUFjO0FBQUEsSUFDM0IsTUFBTSxZQUFBQyxRQUFLLFFBQVEsV0FBVyxnQkFBZ0I7QUFBQSxJQUM5QyxPQUFPO0FBQUEsSUFDUCxRQUFRO0FBQUEsSUFDUixpQkFBaUI7QUFBQSxJQUNqQixXQUFXO0FBQUEsSUFDWCxnQkFBZ0I7QUFBQSxJQUNoQixnQkFBZ0I7QUFBQSxNQUNaLGtCQUFrQjtBQUFBLE1BRWxCLFNBQVMsWUFBQUEsUUFBSyxRQUFRLFdBQVcsa0VBQW1DO0FBQUEsSUFDeEU7QUFBQSxFQUNKLENBQUM7QUFFRCxhQUFXLFFBQVEsdUJBQW1CO0FBRXRDLE1BQUksTUFBdUI7QUFFdkIsZUFBVyxZQUFZLGFBQWE7QUFBQSxFQUN4QyxPQUFPO0FBRUgsZUFBVyxZQUFZLEdBQUcsbUJBQW1CLE1BQU07QUFDL0MsaUJBQVcsWUFBWSxjQUFjO0FBQUEsSUFDekMsQ0FBQztBQUFBLEVBQ0w7QUFFQSxhQUFXLEdBQUcsVUFBVSxNQUFNO0FBQzFCLGlCQUFhO0FBQUEsRUFDakIsQ0FBQztBQUNMO0FBRUEsb0JBQUksVUFBVSxFQUFFLEtBQUssWUFBWTtBQUVqQyxvQkFBSSxHQUFHLHFCQUFxQixNQUFNO0FBQzlCLE1BQUksYUFBYSxVQUFVO0FBQ3ZCLHdCQUFJLEtBQUs7QUFBQSxFQUNiO0FBQ0osQ0FBQztBQUVELG9CQUFJLEdBQUcsWUFBWSxNQUFNO0FBQ3JCLE1BQUksZUFBZSxNQUFNO0FBQ3JCLGlCQUFhO0FBQUEsRUFDakI7QUFDSixDQUFDO0FBR0QsZUFBZSxTQUFTLFVBQVU7QUFDOUIsU0FBTyxFQUFFLE1BQU0sTUFBTSxXQUFXLFNBQVMsUUFBUSxHQUFHLE1BQU0sU0FBUztBQUN2RTtBQUlBLElBQU0sYUFBYTtBQUFBLEVBQ2YsS0FBSyxDQUFDLFNBQVMsS0FBSyxhQUFhLFNBQVMsa0JBQVUsbUJBQW1CLEtBQUssTUFBTSxLQUFLLElBQUksa0JBQVUsa0JBQWtCLEtBQUssTUFBTSxLQUFLO0FBQUEsRUFDdkksTUFBTSxDQUFDLFNBQVMsS0FBSyxhQUFhLFNBQVMsa0JBQVUsbUJBQW1CLEtBQUssTUFBTSxNQUFNLElBQUksa0JBQVUsa0JBQWtCLEtBQUssTUFBTSxNQUFNO0FBQUEsRUFDMUksS0FBSyxDQUFDLFNBQVMsa0JBQVUsYUFBYSxLQUFLLElBQUk7QUFBQSxFQUMvQyxLQUFLLENBQUMsU0FBUyxrQkFBVSxnQkFBZ0IsS0FBSyxJQUFJO0FBQUEsRUFDbEQsS0FBSyxDQUFDLFNBQVMsa0JBQVUsaUJBQWlCLEtBQUssSUFBSTtBQUFBLEVBQ25ELE1BQU0sQ0FBQyxTQUFTLGtCQUFVLG1CQUFtQixLQUFLLElBQUk7QUFDMUQ7QUFFQSx3QkFBUSxPQUFPLGdCQUFnQixPQUFNLEdBQUcsU0FBUztBQUM3QyxNQUFJO0FBQ0EsVUFBTSxVQUFVLFdBQVcsS0FBSztBQUNoQyxRQUFJLENBQUM7QUFBUyxhQUFPLEVBQUUsT0FBTyx5QkFBeUIsS0FBSyxVQUFVO0FBQ3RFLFdBQU8sTUFBTSxTQUFTLE1BQU0sUUFBUSxJQUFJLENBQUM7QUFBQSxFQUM3QyxTQUFTLEtBQVA7QUFDRSxXQUFPLEVBQUUsT0FBTyx3QkFBd0IsSUFBSSxRQUFRO0FBQUEsRUFDeEQ7QUFDSixDQUFDO0FBQ0Qsd0JBQVEsT0FBTyxjQUFjLE9BQU0sR0FBRyxTQUFTO0FBQzNDLFNBQU8sTUFBTSxTQUFTLE1BQU0sa0JBQVUsVUFBVSxLQUFLLE9BQU8sS0FBSyxXQUFXLEtBQUssUUFBUSxDQUFDO0FBQzlGLENBQUM7QUFDRCx3QkFBUSxPQUFPLGNBQWMsT0FBTSxHQUFHLFNBQVM7QUFDM0MsU0FBTyxNQUFNLFNBQVMsTUFBTSxrQkFBVSxVQUFVLEtBQUssT0FBTyxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQztBQUMvRixDQUFDO0FBQ0Qsd0JBQVEsT0FBTyxpQkFBaUIsT0FBTSxHQUFHLFNBQVM7QUFDOUMsTUFBSTtBQUNBLFdBQU8sTUFBTSxTQUFTLE1BQU0sa0JBQVUsc0JBQXNCLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDekUsU0FBUyxLQUFQO0FBQ0UsV0FBTyxFQUFFLE9BQU8sZ0NBQWdDLElBQUksUUFBUTtBQUFBLEVBQ2hFO0FBQ0osQ0FBQztBQUNELHdCQUFRLE9BQU8sa0JBQWtCLE9BQU0sR0FBRyxTQUFTO0FBQy9DLFFBQU0sT0FBTyxNQUFNLGtCQUFrQixjQUFjLEtBQUssR0FBRztBQUMzRCxTQUFPLE9BQU8sTUFBTSxTQUFTLElBQUksSUFBSSxFQUFFLE9BQU8sa0JBQWtCO0FBQ3BFLENBQUM7QUFDRCx3QkFBUSxPQUFPLGtCQUFrQixPQUFNLEdBQUcsU0FBUztBQUMvQyxRQUFNLE9BQU8sTUFBTSxrQkFBa0IsY0FBYyxLQUFLLEdBQUc7QUFDM0QsU0FBTyxPQUFPLE1BQU0sU0FBUyxJQUFJLElBQUksRUFBRSxPQUFPLGtCQUFrQjtBQUNwRSxDQUFDO0FBRUQsd0JBQVEsT0FBTyxlQUFlLENBQUMsR0FBRyxTQUFTLFdBQVcsV0FBVyxXQUFXLGlCQUFpQixJQUFJLE1BQU0sSUFBSSxDQUFDO0FBQzVHLHdCQUFRLE9BQU8sYUFBYSxDQUFDLEdBQUcsU0FBUyxXQUFXLFNBQVMsS0FBSyxJQUFJLENBQUM7QUFDdkUsd0JBQVEsT0FBTyxlQUFlLENBQUMsR0FBRyxhQUFhLFdBQVcsV0FBVyxRQUFRLENBQUM7QUFDOUUsd0JBQVEsT0FBTyxjQUFjLENBQUMsR0FBRyxTQUFTLFdBQVcsV0FBVyxLQUFLLE1BQU0sS0FBSyxNQUFNLENBQUM7QUFDdkYsd0JBQVEsT0FBTyxTQUFTLE1BQU0sV0FBVyxZQUFZLENBQUM7QUFDdEQsd0JBQVEsR0FBRyxRQUFRLE1BQU0sb0JBQUksS0FBSyxDQUFDOyIsCiAgIm5hbWVzIjogWyJhcHAiLCAicGF0aCIsICJmcyIsICJmcyIsICJwYXRoIiwgImZvbGRlclRvb2wiLCAib3MiLCAicGF0aCJdCn0K
