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
var imgFormats = ["jpg", "gif", "png", "webp", "svg"];
var videoFormats = ["webm", "avi", "mp4", "mov"];
var audioFormats = ["mp3"];
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
        fs.readFile(filePath, (err, data) => {
          if (!err) {
            var ret = Buffer.from(data).toString("base64");
            var prefix = this.getBase64Prefix(filePath);
            resolve(prefix + ret);
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
  getBase64Prefix(filePath) {
    const ext = filePath.split(".").slice(-1)[0];
    if (imgFormats.includes(ext)) {
      return "data:image/" + ext + ";base64, ";
    } else if (videoFormats.includes(ext)) {
      return "data:video/" + ext + ";base64, ";
    } else if (audioFormats.includes(ext)) {
      return "data:audio/" + ext + ";base64, ";
    }
    return "";
  }
  deleteFile(filePath) {
    fs.unlinkSync(filePath, (err) => {
      if (err)
        return err;
    });
    return true;
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
var { promisify } = require("util");
var convert = require("heic-convert");
var terminateWithError = (error = "[fatal] error") => {
  console.log(error);
};
var exec = util.promisify(child.exec);
var webp = require("webp-converter");
var fs2 = require("fs");
var ffmpegPath = require("ffmpeg-static").replace(
  "app.asar",
  "app.asar.unpacked"
);
var ffprobePath = require("ffprobe-static").path.replace(
  "app.asar",
  "app.asar.unpacked"
);
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
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath(ffprobePath).setFfmpegPath(ffmpegPath);
      ffmpeg.input(imagePath).noAudio().outputOptions("-pix_fmt yuv420p").output(imagePath.split(".")[0] + "1.webm").size("720x?").on("end", (e) => {
        console.log("Generated !");
        ffmpeg.kill();
        resolve(imagePath.split(".")[0] + "1.webm");
      }).on("error", (e) => error(e)).run();
    });
  }
  static async clipVideo(videoPath, startTime, duration) {
    const ext = path2.extname(videoPath);
    const outName = videoPath.split(".")[0] + "_clip" + ext;
    return new Promise(async (resolve, error) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath(ffprobePath).setFfmpegPath(ffmpegPath);
      ffmpeg.input(videoPath).output(outName).setStartTime(startTime).setDuration(duration).on("end", (e) => {
        console.log("Generated !");
        ffmpeg.kill();
        resolve(outName);
      }).on("error", (e) => error(e)).run();
    });
  }
  static async cropVideo(videoPath, x, y, w, h) {
    const ext = path2.extname(videoPath);
    const outName = videoPath.split(".")[0] + "_crop" + ext;
    return new Promise(async (resolve, error) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath(ffprobePath).setFfmpegPath(ffmpegPath);
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
        ffmpeg.kill();
        resolve(outName);
      }).on("error", (e) => error(e)).run();
    });
  }
  static async convertGifToVideo(imagePath, format = "webm") {
    var resUrl = imagePath.split("/input/").join("/output/").split(".")[0] + "." + format;
    return new Promise(async (resolve, error) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath(ffprobePath).setFfmpegPath(ffmpegPath);
      ffmpeg.input(imagePath).noAudio().outputOptions("-pix_fmt yuv420p").output(resUrl).size("720x?").on("end", (e) => {
        console.log("Generated !");
        ffmpeg.kill();
        resolve(resUrl);
      }).on("error", (e) => error(e)).run();
    });
  }
  static async convertToGif(imagePath) {
    var resUrl = imagePath.split("/input/").join("/output/").split(".")[0] + ".gif";
    return new Promise(async (resolve, error) => {
      var ffmpeg = require("fluent-ffmpeg")().setFfprobePath(ffprobePath).setFfmpegPath(ffmpegPath);
      ffmpeg.input(imagePath).output(resUrl).on("end", (e) => {
        console.log("Generated !");
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
  static convertHeicToJpg(fileName) {
    return new Promise(async (resolve) => {
      var newName = fileName.split("/input/").join("/output/").split(".")[0] + ".jpg";
      const imageBuffer = fs2.readFileSync(fileName);
      const outputBuffer = await convert({
        buffer: imageBuffer,
        format: "JPEG",
        quality: 1
      });
      fs2.writeFileSync(newName, outputBuffer);
      resolve(newName);
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

// src-electron/services/ytCookie.js
var ytCookie_default = cookie = [
  {
    "domain": ".youtube.com",
    "expirationDate": 1757171145726707e-6,
    "hostOnly": false,
    "httpOnly": false,
    "name": "__Secure-1PAPISID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "fKLEBG-K7rNqn2dR/ADNBGY-dtscUPoTDW",
    "id": 1
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1757171145726984e-6,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-1PSID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "g.a000mgg6T5hcc-l2a7BwzBu5CHvQTRHU_8wk6EExj_UQv53WMUEJ_2gjdKo0a2IqKNTtW5jLAwACgYKAbgSARQSFQHGX2MirKdZX08Db3GtQIN4T6IVnxoVAUF8yKoft2gevYyGdjPKSpSTCpDb0076",
    "id": 2
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1754466104237467e-6,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-1PSIDCC",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "AKEyXzU9_QftQcNl8Xtya8QJxMN9psGutqqrN5p9gQJ8LucpIaKBA4xK3Nis4IHDQK_2C8n-UMw",
    "id": 3
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1754385332238839e-6,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-1PSIDTS",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "sidts-CjEB4E2dkVGmSVKA-BHWP6vr46iB29eU5e4SHkvZn8t_Xb9a-6x4cxLW4RZGqckpQQ2fEAA",
    "id": 4
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1757171145726752e-6,
    "hostOnly": false,
    "httpOnly": false,
    "name": "__Secure-3PAPISID",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "fKLEBG-K7rNqn2dR/ADNBGY-dtscUPoTDW",
    "id": 5
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1757171145727008e-6,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-3PSID",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "g.a000mgg6T5hcc-l2a7BwzBu5CHvQTRHU_8wk6EExj_UQv53WMUEJVceFz5h2Ldl-Nr644buKmQACgYKAYASARQSFQHGX2MiSm4cXqCUdWQyRtfieFoYixoVAUF8yKqO0Qnjbm4F1VdnHLfjrwAF0076",
    "id": 6
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1754466104237507e-6,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-3PSIDCC",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "AKEyXzXxVH9ffOf8eDt1BKHwDtOdjI8aHQiAgZJDHY9lHRgYws3iS6ooKIp-038vav9C5J40bg",
    "id": 7
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1754385332238945e-6,
    "hostOnly": false,
    "httpOnly": true,
    "name": "__Secure-3PSIDTS",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "sidts-CjEB4E2dkVGmSVKA-BHWP6vr46iB29eU5e4SHkvZn8t_Xb9a-6x4cxLW4RZGqckpQQ2fEAA",
    "id": 8
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1757171145726617e-6,
    "hostOnly": false,
    "httpOnly": false,
    "name": "APISID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": false,
    "session": false,
    "storeId": "0",
    "value": "bXta7P0Tl4qcR7R3/AbJsI4l_697TNEBsb",
    "id": 9
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1757171145726467e-6,
    "hostOnly": false,
    "httpOnly": true,
    "name": "HSID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": false,
    "session": false,
    "storeId": "0",
    "value": "AaSTHVPZSXEMXTQgI",
    "id": 10
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1755273082304073e-6,
    "hostOnly": false,
    "httpOnly": true,
    "name": "LOGIN_INFO",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "AFmmF2swRQIgfGxcOCRy0ThSN_Ar-cEbZ4fUinu9Ni7s9l9jTKXywOECIQCgg24roMIs3qdsiX9-MuLsIANH91AOvhfBHC8Niw0TCw:QUQ3MjNmelBHaVlfRklya3YzWWJ5U1FDMkhuci1YUUR4RjZBRVFmWmFJcGRla2o3ZUV6M2dUcUFZWnlmZlZtLUppNDdVQURoQVNpa2JZcy1EVWxtZWptY25obTV1Z0pjVEZjNTJQZVFIMURNQXRSNzRYeEhpc3hieVpvSkh2RnRzQ3BvNVd5Q19ackpIQ3ZBS2xLSUJVMnRYMUJ1WUZCdUx3",
    "id": 11
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1757490101764734e-6,
    "hostOnly": false,
    "httpOnly": false,
    "name": "PREF",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "f6=40000000&f7=4100&tz=Europe.Paris&f4=4000000&f5=30000",
    "id": 12
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1757171145726662e-6,
    "hostOnly": false,
    "httpOnly": false,
    "name": "SAPISID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "fKLEBG-K7rNqn2dR/ADNBGY-dtscUPoTDW",
    "id": 13
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 175717114572696e-5,
    "hostOnly": false,
    "httpOnly": false,
    "name": "SID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": false,
    "session": false,
    "storeId": "0",
    "value": "g.a000mgg6T5hcc-l2a7BwzBu5CHvQTRHU_8wk6EExj_UQv53WMUEJ96rZRpC1Z2lE_B_xhDaedQACgYKAc4SARQSFQHGX2MiWo7DfdbBzTAZI-nne3M7IhoVAUF8yKqzFJ6KFzrqGzrBZ_Zizd7g0076",
    "id": 14
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1754466104237361e-6,
    "hostOnly": false,
    "httpOnly": false,
    "name": "SIDCC",
    "path": "/",
    "sameSite": "unspecified",
    "secure": false,
    "session": false,
    "storeId": "0",
    "value": "AKEyXzUH7t_y591g5VlXU93My6LpMOc8xZOJs82Xq7F2CkeMQYWTSJtrggMqLnp3anslKmb7wQM",
    "id": 15
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1757171145726566e-6,
    "hostOnly": false,
    "httpOnly": true,
    "name": "SSID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "A-CluoUGPSBck41oc",
    "id": 16
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1722930109,
    "hostOnly": false,
    "httpOnly": false,
    "name": "ST-3opvp5",
    "path": "/",
    "sameSite": "unspecified",
    "secure": false,
    "session": false,
    "storeId": "0",
    "value": "session_logininfo=AFmmF2swRQIgfGxcOCRy0ThSN_Ar-cEbZ4fUinu9Ni7s9l9jTKXywOECIQCgg24roMIs3qdsiX9-MuLsIANH91AOvhfBHC8Niw0TCw%3AQUQ3MjNmelBHaVlfRklya3YzWWJ5U1FDMkhuci1YUUR4RjZBRVFmWmFJcGRla2o3ZUV6M2dUcUFZWnlmZlZtLUppNDdVQURoQVNpa2JZcy1EVWxtZWptY25obTV1Z0pjVEZjNTJQZVFIMURNQXRSNzRYeEhpc3hieVpvSkh2RnRzQ3BvNVd5Q19ackpIQ3ZBS2xLSUJVMnRYMUJ1WUZCdUx3",
    "id": 17
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1722930107,
    "hostOnly": false,
    "httpOnly": false,
    "name": "ST-tladcw",
    "path": "/",
    "sameSite": "unspecified",
    "secure": false,
    "session": false,
    "storeId": "0",
    "value": "session_logininfo=AFmmF2swRQIgfGxcOCRy0ThSN_Ar-cEbZ4fUinu9Ni7s9l9jTKXywOECIQCgg24roMIs3qdsiX9-MuLsIANH91AOvhfBHC8Niw0TCw%3AQUQ3MjNmelBHaVlfRklya3YzWWJ5U1FDMkhuci1YUUR4RjZBRVFmWmFJcGRla2o3ZUV6M2dUcUFZWnlmZlZtLUppNDdVQURoQVNpa2JZcy1EVWxtZWptY25obTV1Z0pjVEZjNTJQZVFIMURNQXRSNzRYeEhpc3hieVpvSkh2RnRzQ3BvNVd5Q19ackpIQ3ZBS2xLSUJVMnRYMUJ1WUZCdUx3",
    "id": 18
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1722930108,
    "hostOnly": false,
    "httpOnly": false,
    "name": "ST-xuwub9",
    "path": "/",
    "sameSite": "unspecified",
    "secure": false,
    "session": false,
    "storeId": "0",
    "value": "session_logininfo=AFmmF2swRQIgfGxcOCRy0ThSN_Ar-cEbZ4fUinu9Ni7s9l9jTKXywOECIQCgg24roMIs3qdsiX9-MuLsIANH91AOvhfBHC8Niw0TCw%3AQUQ3MjNmelBHaVlfRklya3YzWWJ5U1FDMkhuci1YUUR4RjZBRVFmWmFJcGRla2o3ZUV6M2dUcUFZWnlmZlZtLUppNDdVQURoQVNpa2JZcy1EVWxtZWptY25obTV1Z0pjVEZjNTJQZVFIMURNQXRSNzRYeEhpc3hieVpvSkh2RnRzQ3BvNVd5Q19ackpIQ3ZBS2xLSUJVMnRYMUJ1WUZCdUx3",
    "id": 19
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1725722543000628e-6,
    "hostOnly": false,
    "httpOnly": true,
    "name": "VISITOR_PRIVACY_METADATA",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "value": "CgJGUhIIEgQSAgsMIDs%3D",
    "id": 20
  }
];

// src-electron/services/videoDownloaderTool.js
var fs3 = require("fs");
var ytdl = require("@distube/ytdl-core");
var readline = require("readline");
var cp = require("child_process");
var http = require("http");
var https = require("https");
var agent = ytdl.createAgent(ytCookie_default);
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
        const video = ytdl(url, { quality: "highestvideo", agent });
        video.pipe(fs3.createWriteStream(finalPathVideo));
        video.on("end", () => {
          const audio = ytdl(url, { quality: "highestaudio" });
          audio.pipe(fs3.createWriteStream(finalPathAudio));
          audio.on("end", () => {
            var ffmpeg = require("fluent-ffmpeg")().setFfprobePath("./resources/ffmpeg/ffprobe.exe").setFfmpegPath("./resources/ffmpeg/ffmpeg.exe");
            ffmpeg.input(finalPathVideo).input(finalPathAudio).addOptions(["-map 0:v", "-map 1:a", "-c:v copy"]).format("mp4").outputOptions("-pix_fmt yuv420p").output(finalPath).on("end", function() {
              console.log("end");
              fs3.unlinkSync(finalPathAudio);
              fs3.unlinkSync(finalPathVideo);
              ffmpeg.kill();
              resolve(finalPath);
            }).on("error", function(err) {
              console.log("an error happened: " + err.message);
              resolve(err);
              ffmpeg.kill();
            }).run();
          });
        });
        video.on("error", (e) => {
          console.log(e);
          resolve(null);
        });
      } catch (e) {
        console.log(e);
        resolve(e);
      }
    });
  }
  async downloadAudio(url) {
    const finalPathAudio = this.folderTool.BASE_PATH + "/" + this.folderTool.WORKSPACE_DIR + "/input/" + url.substring(url.length - 5, url.length) + "_a.mp3";
    return new Promise((resolve) => {
      try {
        const audio = ytdl(url, { quality: "highestaudio", agent });
        audio.pipe(fs3.createWriteStream(finalPathAudio));
        audio.on("end", () => {
          resolve(finalPathAudio);
        });
        audio.on("error", (e) => {
          console.log(e);
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
import_electron.ipcMain.handle("folder:read", async (e, data) => {
  return await folderTool.readFolder(folderTool.getBaseFolderUrl() + "/" + data);
});
import_electron.ipcMain.handle("video:clip", async (e, data) => {
  const fileUrl = await imageTool_default.clipVideo(data.video, data.startTime, data.duration);
  if (fileUrl) {
    return { data: await folderTool.readFile(fileUrl), path: fileUrl };
  }
  return null;
});
import_electron.ipcMain.handle("video:crop", async (e, data) => {
  const fileUrl = await imageTool_default.cropVideo(data.video, data.x, data.y, data.w, data.h);
  if (fileUrl) {
    return { data: await folderTool.readFile(fileUrl), path: fileUrl };
  }
  return null;
});
import_electron.ipcMain.handle("file:convert", async (e, data) => {
  let fileUrl;
  try {
    switch (data.outputExt) {
      case "mp4":
      case "webm":
        if (data.inputExt === "webp") {
          fileUrl = await imageTool_default.convertWebpToWebm(data.img);
        } else {
          fileUrl = await imageTool_default.convertGifToVideo(data.file, data.outputExt);
        }
        break;
      case "gif":
        fileUrl = await imageTool_default.convertToGif(data.file);
        break;
      case "ico":
        fileUrl = await imageTool_default.convertPngToIco(data.file);
        break;
      case "jpg":
        fileUrl = await imageTool_default.convertHeicToJpg(data.file);
        break;
      case "webp":
        fileUrl = await imageTool_default.convertImageToWebp(data.file);
        break;
    }
    if (fileUrl) {
      return { data: await folderTool.readFile(fileUrl), path: fileUrl };
    }
    return { error: "Conversion failed" };
  } catch (e2) {
    return { error: "Conversion failed: " + e2.message };
  }
});
import_electron.ipcMain.handle("file:read", async (e, data) => {
  return await folderTool.readFile(data.path);
});
import_electron.ipcMain.handle("file:delete", async (e, path4) => {
  return folderTool.deleteFile(path4);
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
    return { data: await folderTool.readFile(file), path: file };
  }
  return { error: "Download failed" };
});
import_electron.ipcMain.handle("audio:download", async (e, data) => {
  const file = await videoDownloadTool.downloadAudio(data.url);
  if (file) {
    return { data: await folderTool.readFile(file), path: file };
  }
  return { error: "Download failed" };
});
import_electron.ipcMain.handle("img:remove-bg", async (e, data) => {
  const imgTool = new imageTool_default(folderTool);
  const dataPath = await imgTool.removeImageBackground(data.img);
  return { data: await folderTool.readFile(dataPath), path: dataPath };
});
import_electron.ipcMain.handle("clear", async (e) => {
  return await folderTool.clearFolder();
});
import_electron.ipcMain.on("quit", (e) => {
  import_electron.app.quit();
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjLWVsZWN0cm9uL2VsZWN0cm9uLW1haW4uanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ZvbGRlclRvb2wuanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL2ltYWdlVG9vbC5qcyIsICIuLi8uLi9zcmMtZWxlY3Ryb24vc2VydmljZXMveXRDb29raWUuanMiLCAiLi4vLi4vc3JjLWVsZWN0cm9uL3NlcnZpY2VzL3ZpZGVvRG93bmxvYWRlclRvb2wuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGFwcCwgQnJvd3NlcldpbmRvdywgbmF0aXZlVGhlbWUsIGlwY01haW4gfSBmcm9tICdlbGVjdHJvbidcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuaW1wb3J0IG9zIGZyb20gJ29zJ1xyXG5pbXBvcnQgRm9sZGVyVG9vbCBmcm9tICcuL3NlcnZpY2VzL2ZvbGRlclRvb2wnO1xyXG5pbXBvcnQgSW1hZ2VUb29sIGZyb20gJy4vc2VydmljZXMvaW1hZ2VUb29sJztcclxuaW1wb3J0IFZpZGVvRG93bmxvYWRlclRvb2wgZnJvbSAnLi9zZXJ2aWNlcy92aWRlb0Rvd25sb2FkZXJUb29sJztcclxuXHJcbi8vIG5lZWRlZCBpbiBjYXNlIHByb2Nlc3MgaXMgdW5kZWZpbmVkIHVuZGVyIExpbnV4XHJcbmNvbnN0IHBsYXRmb3JtID0gcHJvY2Vzcy5wbGF0Zm9ybSB8fCBvcy5wbGF0Zm9ybSgpXHJcblxyXG5sZXQgbWFpbldpbmRvd1xyXG5cclxuY29uc3QgZm9sZGVyVG9vbCA9IG5ldyBGb2xkZXJUb29sKGFwcCk7XHJcbmNvbnN0IHZpZGVvRG93bmxvYWRUb29sID0gbmV3IFZpZGVvRG93bmxvYWRlclRvb2woZm9sZGVyVG9vbCk7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXaW5kb3coKSB7XHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWwgd2luZG93IG9wdGlvbnNcclxuICAgICAqL1xyXG4gICAgbWFpbldpbmRvdyA9IG5ldyBCcm93c2VyV2luZG93KHtcclxuICAgICAgICBpY29uOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnaWNvbnMvaWNvbi5wbmcnKSwgLy8gdHJheSBpY29uXHJcbiAgICAgICAgd2lkdGg6IDEwMDAsXHJcbiAgICAgICAgaGVpZ2h0OiA2MDAsXHJcbiAgICAgICAgYXV0b0hpZGVNZW51QmFyOiB0cnVlLFxyXG4gICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICB1c2VDb250ZW50U2l6ZTogdHJ1ZSxcclxuICAgICAgICB3ZWJQcmVmZXJlbmNlczoge1xyXG4gICAgICAgICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICAvLyBNb3JlIGluZm86IGh0dHBzOi8vdjIucXVhc2FyLmRldi9xdWFzYXItY2xpLXZpdGUvZGV2ZWxvcGluZy1lbGVjdHJvbi1hcHBzL2VsZWN0cm9uLXByZWxvYWQtc2NyaXB0XHJcbiAgICAgICAgICAgIHByZWxvYWQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIHByb2Nlc3MuZW52LlFVQVNBUl9FTEVDVFJPTl9QUkVMT0FEKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgbWFpbldpbmRvdy5sb2FkVVJMKHByb2Nlc3MuZW52LkFQUF9VUkwpXHJcblxyXG4gICAgaWYgKHByb2Nlc3MuZW52LkRFQlVHR0lORykge1xyXG4gICAgICAgIC8vIGlmIG9uIERFViBvciBQcm9kdWN0aW9uIHdpdGggZGVidWcgZW5hYmxlZFxyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gd2UncmUgb24gcHJvZHVjdGlvbjsgbm8gYWNjZXNzIHRvIGRldnRvb2xzIHBsc1xyXG4gICAgICAgIG1haW5XaW5kb3cud2ViQ29udGVudHMub24oJ2RldnRvb2xzLW9wZW5lZCcsICgpID0+IHtcclxuICAgICAgICAgICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5jbG9zZURldlRvb2xzKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIG1haW5XaW5kb3cub24oJ2Nsb3NlZCcsICgpID0+IHtcclxuICAgICAgICBtYWluV2luZG93ID0gbnVsbFxyXG4gICAgfSlcclxufVxyXG5cclxuYXBwLndoZW5SZWFkeSgpLnRoZW4oY3JlYXRlV2luZG93KVxyXG5cclxuYXBwLm9uKCd3aW5kb3ctYWxsLWNsb3NlZCcsICgpID0+IHtcclxuICAgIGlmIChwbGF0Zm9ybSAhPT0gJ2RhcndpbicpIHtcclxuICAgICAgICBhcHAucXVpdCgpXHJcbiAgICB9XHJcbn0pXHJcblxyXG5hcHAub24oJ2FjdGl2YXRlJywgKCkgPT4ge1xyXG4gICAgaWYgKG1haW5XaW5kb3cgPT09IG51bGwpIHtcclxuICAgICAgICBjcmVhdGVXaW5kb3coKVxyXG4gICAgfVxyXG59KVxyXG5cclxuaXBjTWFpbi5oYW5kbGUoJ2ZvbGRlcjpyZWFkJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZvbGRlcihmb2xkZXJUb29sLmdldEJhc2VGb2xkZXJVcmwoKSArICcvJyArIGRhdGEpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCd2aWRlbzpjbGlwJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgY29uc3QgZmlsZVVybCA9IGF3YWl0IEltYWdlVG9vbC5jbGlwVmlkZW8oZGF0YS52aWRlbywgZGF0YS5zdGFydFRpbWUsIGRhdGEuZHVyYXRpb24pXHJcbiAgICBpZiAoZmlsZVVybCkge1xyXG4gICAgICAgIHJldHVybiB7IGRhdGE6IGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZmlsZVVybCksIHBhdGg6IGZpbGVVcmwgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGxcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ3ZpZGVvOmNyb3AnLCBhc3luYyhlLCBkYXRhKSA9PiB7XHJcbiAgICBjb25zdCBmaWxlVXJsID0gYXdhaXQgSW1hZ2VUb29sLmNyb3BWaWRlbyhkYXRhLnZpZGVvLCBkYXRhLngsIGRhdGEueSwgZGF0YS53LCBkYXRhLmgpXHJcbiAgICBpZiAoZmlsZVVybCkge1xyXG4gICAgICAgIHJldHVybiB7IGRhdGE6IGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZmlsZVVybCksIHBhdGg6IGZpbGVVcmwgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGxcclxufSlcclxuXHJcbi8vIFBvaXQgZCdlbnRyXHUwMEU5ZSBnXHUwMEU5blx1MDBFOXJhbCBwb3VyIHRvdXRlcyBsZXMgY29udmVyc2lvbnNcclxuLy8gZGF0YSAtPiB7ZmlsZTogW2ZpbGVdLCBpbnB1dEV4dDogW3BuZywganBnLCAuLi5dLCBvdXRwdXRFeHQ6IFtwbmcsIGpwZywgLi4uXX1cclxuaXBjTWFpbi5oYW5kbGUoJ2ZpbGU6Y29udmVydCcsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIGxldCBmaWxlVXJsXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHN3aXRjaCAoZGF0YS5vdXRwdXRFeHQpIHtcclxuICAgICAgICAgICAgY2FzZSAnbXA0JzpcclxuICAgICAgICAgICAgY2FzZSAnd2VibSc6XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5pbnB1dEV4dCA9PT0gJ3dlYnAnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZVVybCA9IGF3YWl0IEltYWdlVG9vbC5jb252ZXJ0V2VicFRvV2VibShkYXRhLmltZylcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZVVybCA9IGF3YWl0IEltYWdlVG9vbC5jb252ZXJ0R2lmVG9WaWRlbyhkYXRhLmZpbGUsIGRhdGEub3V0cHV0RXh0KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dpZic6XHJcbiAgICAgICAgICAgICAgICBmaWxlVXJsID0gYXdhaXQgSW1hZ2VUb29sLmNvbnZlcnRUb0dpZihkYXRhLmZpbGUpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnaWNvJzpcclxuICAgICAgICAgICAgICAgIGZpbGVVcmwgPSBhd2FpdCBJbWFnZVRvb2wuY29udmVydFBuZ1RvSWNvKGRhdGEuZmlsZSlcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdqcGcnOlxyXG4gICAgICAgICAgICAgICAgZmlsZVVybCA9IGF3YWl0IEltYWdlVG9vbC5jb252ZXJ0SGVpY1RvSnBnKGRhdGEuZmlsZSlcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd3ZWJwJzpcclxuICAgICAgICAgICAgICAgIGZpbGVVcmwgPSBhd2FpdCBJbWFnZVRvb2wuY29udmVydEltYWdlVG9XZWJwKGRhdGEuZmlsZSlcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZmlsZVVybCkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBkYXRhOiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGZpbGVVcmwpLCBwYXRoOiBmaWxlVXJsIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgZXJyb3I6ICdDb252ZXJzaW9uIGZhaWxlZCcgfVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIHJldHVybiB7IGVycm9yOiAnQ29udmVyc2lvbiBmYWlsZWQ6ICcgKyBlLm1lc3NhZ2UgfVxyXG4gICAgfVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnZmlsZTpyZWFkJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgcmV0dXJuIGF3YWl0IGZvbGRlclRvb2wucmVhZEZpbGUoZGF0YS5wYXRoKTtcclxufSlcclxuaXBjTWFpbi5oYW5kbGUoJ2ZpbGU6ZGVsZXRlJywgYXN5bmMoZSwgcGF0aCkgPT4ge1xyXG4gICAgcmV0dXJuIGZvbGRlclRvb2wuZGVsZXRlRmlsZShwYXRoKTtcclxufSlcclxuaXBjTWFpbi5vbignaW1nOnJlbmFtZScsIChlLCBkYXRhKSA9PiB7XHJcbiAgICBmb2xkZXJUb29sLnJlbmFtZUZpbGUoZGF0YS5vbGRQYXRoLCBkYXRhLm5ld1BhdGgpXHJcbn0pXHJcbmlwY01haW4ub24oJ2ZpbGU6d3JpdGUnLCAoZSwgZGF0YSkgPT4ge1xyXG4gICAgZm9sZGVyVG9vbC53cml0ZUZpbGUoZGF0YS5wYXRoLCBkYXRhLnRleHQpXHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6dXBsb2FkJywgKGUsIGRhdGEpID0+IHtcclxuICAgIHJldHVybiBmb2xkZXJUb29sLnVwbG9hZEZpbGUoZGF0YS5wYXRoLCBkYXRhLmJ1ZmZlcik7XHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCd2aWRlbzpkb3dubG9hZCcsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB2aWRlb0Rvd25sb2FkVG9vbC5kb3dubG9hZFZpZGVvKGRhdGEudXJsKVxyXG4gICAgaWYgKGZpbGUpIHtcclxuICAgICAgICByZXR1cm4geyBkYXRhOiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGZpbGUpLCBwYXRoOiBmaWxlIH1cclxuICAgIH1cclxuICAgIHJldHVybiB7IGVycm9yOiAnRG93bmxvYWQgZmFpbGVkJyB9XHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdhdWRpbzpkb3dubG9hZCcsIGFzeW5jKGUsIGRhdGEpID0+IHtcclxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB2aWRlb0Rvd25sb2FkVG9vbC5kb3dubG9hZEF1ZGlvKGRhdGEudXJsKVxyXG4gICAgaWYgKGZpbGUpIHtcclxuICAgICAgICByZXR1cm4geyBkYXRhOiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGZpbGUpLCBwYXRoOiBmaWxlIH1cclxuICAgIH1cclxuICAgIHJldHVybiB7IGVycm9yOiAnRG93bmxvYWQgZmFpbGVkJyB9XHJcbn0pXHJcbmlwY01haW4uaGFuZGxlKCdpbWc6cmVtb3ZlLWJnJywgYXN5bmMoZSwgZGF0YSkgPT4ge1xyXG4gICAgY29uc3QgaW1nVG9vbCA9IG5ldyBJbWFnZVRvb2woZm9sZGVyVG9vbClcclxuICAgIGNvbnN0IGRhdGFQYXRoID0gYXdhaXQgaW1nVG9vbC5yZW1vdmVJbWFnZUJhY2tncm91bmQoZGF0YS5pbWcpXHJcbiAgICByZXR1cm4geyBkYXRhOiBhd2FpdCBmb2xkZXJUb29sLnJlYWRGaWxlKGRhdGFQYXRoKSwgcGF0aDogZGF0YVBhdGggfVxyXG59KVxyXG5pcGNNYWluLmhhbmRsZSgnY2xlYXInLCBhc3luYyhlKSA9PiB7XHJcbiAgICByZXR1cm4gYXdhaXQgZm9sZGVyVG9vbC5jbGVhckZvbGRlcigpXHJcbn0pXHJcbmlwY01haW4ub24oJ3F1aXQnLCAoZSkgPT4ge1xyXG4gICAgYXBwLnF1aXQoKVxyXG59KSIsICJjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJylcclxuY29uc3QgeyByZWFkZGlyIH0gPSByZXF1aXJlKCdmcycpLnByb21pc2VzO1xyXG5jb25zdCBXT1JLU1BBQ0VfRElSID0gJ3dvbG9sbyc7XHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcclxuXHJcbmNvbnN0IGltZ0Zvcm1hdHMgPSBbJ2pwZycsICdnaWYnLCAncG5nJywgJ3dlYnAnLCAnc3ZnJ11cclxuY29uc3QgdmlkZW9Gb3JtYXRzID0gWyd3ZWJtJywgJ2F2aScsICdtcDQnLCAnbW92J11cclxuY29uc3QgYXVkaW9Gb3JtYXRzID0gWydtcDMnXVxyXG5cclxuY2xhc3MgRm9sZGVyVG9vbCB7XHJcbiAgICBjb25zdHJ1Y3RvcihhcHApIHtcclxuICAgICAgICB0aGlzLkJBU0VfUEFUSCA9IGFwcC5nZXRQYXRoKCd1c2VyRGF0YScpO1xyXG4gICAgICAgIHRoaXMuV09SS1NQQUNFX0RJUiA9IFdPUktTUEFDRV9ESVI7XHJcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHRoaXMuQkFTRV9QQVRIICsgJy8nICsgV09SS1NQQUNFX0RJUikpIHtcclxuICAgICAgICAgICAgZnMubWtkaXJTeW5jKHRoaXMuQkFTRV9QQVRIICsgJy8nICsgV09SS1NQQUNFX0RJUik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY3JlYXRlRm9sZGVyKFwiaW5wdXRcIik7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVGb2xkZXIoXCJvdXRwdXRcIik7XHJcblxyXG4gICAgfVxyXG4gICAgZ2V0QmFzZUZvbGRlclVybCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5CQVNFX1BBVEggKyAnLycgKyB0aGlzLldPUktTUEFDRV9ESVJcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBjbGVhckZvbGRlcigpIHtcclxuICAgICAgICBjb25zdCBmb2xkZXJOYW1lID0gdGhpcy5nZXRCYXNlRm9sZGVyVXJsKCkgKyAnL2lucHV0J1xyXG4gICAgICAgIGNvbnN0IGZvbGRlck5hbWUyID0gdGhpcy5nZXRCYXNlRm9sZGVyVXJsKCkgKyAnL291dHB1dCdcclxuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMucmVhZEZvbGRlcihmb2xkZXJOYW1lKVxyXG4gICAgICAgIGNvbnN0IGZpbGVzMiA9IGF3YWl0IHRoaXMucmVhZEZvbGRlcihmb2xkZXJOYW1lMilcclxuICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcclxuICAgICAgICAgICAgZnMudW5saW5rU3luYyhmaWxlLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMyKSB7XHJcbiAgICAgICAgICAgIGZzLnVubGlua1N5bmMoZmlsZSwgKGVycikgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWVcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVGb2xkZXIoZm9sZGVyTmFtZSkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLkJBU0VfUEFUSCArICcvJyArIFdPUktTUEFDRV9ESVIgKyBcIi9cIiArIGZvbGRlck5hbWU7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHVybCkpIHtcclxuICAgICAgICAgICAgICAgIGZzLm1rZGlyU3luYyh1cmwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLSBHRU5FUkFMIFRPT0xTXHJcblxyXG4gICAgYXN5bmMgcmVhZEZvbGRlcihkaXJOYW1lKSB7XHJcbiAgICAgICAgbGV0IGZpbGVzID0gW107XHJcbiAgICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCByZWFkZGlyKGRpck5hbWUsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtLmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goYCR7ZGlyTmFtZX0vJHtpdGVtLm5hbWV9YCk7XHJcbiAgICAgICAgICAgICAgICBmaWxlcyA9IFtcclxuICAgICAgICAgICAgICAgICAgICAuLi5maWxlcyxcclxuICAgICAgICAgICAgICAgICAgICAuLi4oYXdhaXQgdGhpcy5yZWFkRm9sZGVyKGAke2Rpck5hbWV9LyR7aXRlbS5uYW1lfWApKSxcclxuICAgICAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlcy5wdXNoKGAke2Rpck5hbWV9LyR7aXRlbS5uYW1lfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAoZmlsZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlYWRGaWxlKGZpbGVQYXRoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUsIGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZShmaWxlUGF0aCwgKGVyciwgZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXQgPSBCdWZmZXIuZnJvbShkYXRhKS50b1N0cmluZygnYmFzZTY0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmVmaXggPSB0aGlzLmdldEJhc2U2NFByZWZpeChmaWxlUGF0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShwcmVmaXggKyByZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yKGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEJhc2U2NFByZWZpeChmaWxlUGF0aCkge1xyXG4gICAgICAgIGNvbnN0IGV4dCA9IGZpbGVQYXRoLnNwbGl0KCcuJykuc2xpY2UoLTEpWzBdXHJcbiAgICAgICAgaWYgKGltZ0Zvcm1hdHMuaW5jbHVkZXMoZXh0KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJkYXRhOmltYWdlL1wiICsgZXh0ICsgXCI7YmFzZTY0LCBcIlxyXG4gICAgICAgIH0gZWxzZSBpZiAodmlkZW9Gb3JtYXRzLmluY2x1ZGVzKGV4dCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiZGF0YTp2aWRlby9cIiArIGV4dCArIFwiO2Jhc2U2NCwgXCJcclxuICAgICAgICB9ZWxzZSBpZiAoYXVkaW9Gb3JtYXRzLmluY2x1ZGVzKGV4dCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiZGF0YTphdWRpby9cIiArIGV4dCArIFwiO2Jhc2U2NCwgXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuICcnXHJcbiAgICB9XHJcblxyXG4gICAgZGVsZXRlRmlsZShmaWxlUGF0aCkge1xyXG4gICAgICAgIGZzLnVubGlua1N5bmMoZmlsZVBhdGgsIChlcnIpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIGVycjtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlRmlsZShmaWxlUGF0aCwgdGV4dCkge1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIHRleHQsIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHVwbG9hZEZpbGUoZmlsZVBhdGgsIGJ1ZmZlcikge1xyXG4gICAgICAgIHZhciBzYXZlUGF0aCA9IHRoaXMuQkFTRV9QQVRIICsgJy8nICsgV09SS1NQQUNFX0RJUiArICcvaW5wdXQvJyArIGZpbGVQYXRoO1xyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoc2F2ZVBhdGgsIEJ1ZmZlci5mcm9tKGJ1ZmZlciksIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNhdmVQYXRoKVxyXG4gICAgICAgIHJldHVybiBzYXZlUGF0aDtcclxuICAgIH1cclxuXHJcbiAgICByZW5hbWVGaWxlKG9sZHVybCwgbmV3dXJsKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlbmFtZWQgJyArIG9sZHVybCArICcgaW50byAnICsgbmV3dXJsKTtcclxuICAgICAgICAgICAgaWYgKG5ld3VybC5zcGxpdChcIi5cIikubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIG5ld3VybCArPSBcIi53ZWJwXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnMucmVuYW1lKG9sZHVybCwgbmV3dXJsLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBGb2xkZXJUb29sOyIsICIvLyBHaWYgdG8gV0VCTSBsaWJyYXJ5XHJcbmNvbnN0IFdlYnBJbWFnZSA9IHJlcXVpcmUoJ25vZGUtd2VicG11eCcpLkltYWdlO1xyXG5cclxuY29uc3QgcG5nVG9JY28gPSByZXF1aXJlKCdwbmctdG8taWNvJyk7XHJcblxyXG5jb25zdCBjaGlsZCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxyXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXHJcbmNvbnN0IHV0aWwgPSByZXF1aXJlKCd1dGlsJylcclxuY29uc3QgeyBwcm9taXNpZnkgfSA9IHJlcXVpcmUoJ3V0aWwnKTtcclxuY29uc3QgY29udmVydCA9IHJlcXVpcmUoJ2hlaWMtY29udmVydCcpO1xyXG5pbXBvcnQgeyByZW1vdmVCYWNrZ3JvdW5kIH0gZnJvbSBcIkBpbWdseS9iYWNrZ3JvdW5kLXJlbW92YWwtbm9kZVwiO1xyXG5cclxuY29uc3QgdGVybWluYXRlV2l0aEVycm9yID0gKGVycm9yID0gJ1tmYXRhbF0gZXJyb3InKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhlcnJvcilcclxuICAgICAgICAvL3Byb2Nlc3MuZXhpdCgxKVxyXG59XHJcblxyXG5jb25zdCBleGVjID0gdXRpbC5wcm9taXNpZnkoY2hpbGQuZXhlYylcclxuXHJcbmNvbnN0IHdlYnAgPSByZXF1aXJlKCd3ZWJwLWNvbnZlcnRlcicpO1xyXG4vL3dlYnAuZ3JhbnRfcGVybWlzc2lvbigpOyAgLy8gTWFyY2hlIHB0ZXQgcGFzIHN1ciBsZSBQQyBkdSBib3Vsb3RcclxuXHJcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKVxyXG5cclxuY29uc3QgZmZtcGVnUGF0aCA9IHJlcXVpcmUoJ2ZmbXBlZy1zdGF0aWMnKS5yZXBsYWNlKFxyXG4gICAgJ2FwcC5hc2FyJyxcclxuICAgICdhcHAuYXNhci51bnBhY2tlZCdcclxuKTtcclxuY29uc3QgZmZwcm9iZVBhdGggPSByZXF1aXJlKCdmZnByb2JlLXN0YXRpYycpLnBhdGgucmVwbGFjZShcclxuICAgICdhcHAuYXNhcicsXHJcbiAgICAnYXBwLmFzYXIudW5wYWNrZWQnXHJcbik7XHJcblxyXG5jbGFzcyBJbWFnZVRvb2wge1xyXG4gICAgY29uc3RydWN0b3IoZm9sZGVyVG9vbCkge1xyXG4gICAgICAgIHRoaXMuZm9sZGVyVG9vbCA9IGZvbGRlclRvb2xcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydEltYWdlVG9XZWJwKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc1VybCA9IGltYWdlUGF0aC5zcGxpdChcIi5cIilbMF0gKyBcIi53ZWJwXCI7XHJcbiAgICAgICAgICAgICAgICByZXNVcmwgPSByZXNVcmwuc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gd2VicC5jd2VicChpbWFnZVBhdGgsIHJlc1VybCwgXCItcSA4MFwiLCBcIi12XCIpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZnMudW5saW5rU3luYyhpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzVXJsKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGVycm9yKGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRXZWJwVG9XZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRXZWJwVG9XZWJtTmV3KGltYWdlUGF0aCk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgd2ViUEltYWdlID0gYXdhaXQgbmV3IFdlYnBJbWFnZSgpO1xyXG4gICAgICAgICAgICBhd2FpdCB3ZWJQSW1hZ2UubG9hZChpbWFnZVBhdGgpO1xyXG4gICAgICAgICAgICBpZiAod2ViUEltYWdlLmhhc0FuaW0pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAod2ViUEltYWdlLmZyYW1lcyAhPT0gdW5kZWZpbmVkICYmIHdlYlBJbWFnZS5mcmFtZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IFsuLi53ZWJQSW1hZ2UuZnJhbWVzXTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZyYW1lcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyByZXNpemVXZWJtKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKGZmcHJvYmVQYXRoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoZmZtcGVnUGF0aCk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dChpbWFnZVBhdGgpXHJcbiAgICAgICAgICAgICAgICAubm9BdWRpbygpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0T3B0aW9ucygnLXBpeF9mbXQgeXV2NDIwcCcpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KGltYWdlUGF0aC5zcGxpdCgnLicpWzBdICsgXCIxLndlYm1cIilcclxuICAgICAgICAgICAgICAgIC5zaXplKCc3MjB4PycpXHJcbiAgICAgICAgICAgICAgICAub24oXCJlbmRcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdlbmVyYXRlZCAhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZzLnVubGlua1N5bmMoaW1hZ2VQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICBmZm1wZWcua2lsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaW1hZ2VQYXRoLnNwbGl0KCcuJylbMF0gKyBcIjEud2VibVwiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlcnJvclwiLCAoZSkgPT4gZXJyb3IoZSkpLnJ1bigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjbGlwVmlkZW8odmlkZW9QYXRoLCBzdGFydFRpbWUsIGR1cmF0aW9uKSB7XHJcbiAgICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKHZpZGVvUGF0aCk7XHJcbiAgICAgICAgY29uc3Qgb3V0TmFtZSA9IHZpZGVvUGF0aC5zcGxpdCgnLicpWzBdICsgJ19jbGlwJyArIGV4dFxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKGZmcHJvYmVQYXRoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoZmZtcGVnUGF0aCk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dCh2aWRlb1BhdGgpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KG91dE5hbWUpXHJcbiAgICAgICAgICAgICAgICAuc2V0U3RhcnRUaW1lKHN0YXJ0VGltZSlcclxuICAgICAgICAgICAgICAgIC5zZXREdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAgICAgICAgIC5vbihcImVuZFwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR2VuZXJhdGVkICFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZnMudW5saW5rU3luYyh2aWRlb1BhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZmbXBlZy5raWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShvdXROYW1lKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJlcnJvclwiLCAoZSkgPT4gZXJyb3IoZSkpLnJ1bigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhc3luYyBjcm9wVmlkZW8odmlkZW9QYXRoLCB4LCB5LCB3LCBoKSB7XHJcbiAgICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKHZpZGVvUGF0aCk7XHJcbiAgICAgICAgY29uc3Qgb3V0TmFtZSA9IHZpZGVvUGF0aC5zcGxpdCgnLicpWzBdICsgJ19jcm9wJyArIGV4dFxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlLCBlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKGZmcHJvYmVQYXRoKVxyXG4gICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoZmZtcGVnUGF0aCk7XHJcblxyXG4gICAgICAgICAgICBmZm1wZWdcclxuICAgICAgICAgICAgICAgIC5pbnB1dCh2aWRlb1BhdGgpXHJcbiAgICAgICAgICAgICAgICAub3V0cHV0KG91dE5hbWUpXHJcbiAgICAgICAgICAgICAgICAudmlkZW9GaWx0ZXJzKFt7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBcImNyb3BcIixcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dF93OiB3LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRfaDogaFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LCBdKVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZW5kXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJHZW5lcmF0ZWQgIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBmcy51bmxpbmtTeW5jKHZpZGVvUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmZtcGVnLmtpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG91dE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5vbihcImVycm9yXCIsIChlKSA9PiBlcnJvcihlKSkucnVuKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFzeW5jIGNvbnZlcnRHaWZUb1ZpZGVvKGltYWdlUGF0aCwgZm9ybWF0ID0gJ3dlYm0nKSB7XHJcbiAgICAgICAgdmFyIHJlc1VybCA9IGltYWdlUGF0aC5zcGxpdCgnL2lucHV0LycpLmpvaW4oJy9vdXRwdXQvJykuc3BsaXQoJy4nKVswXSArICcuJyArIGZvcm1hdDtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMocmVzb2x2ZSwgZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdmFyIGZmbXBlZyA9IHJlcXVpcmUoXCJmbHVlbnQtZmZtcGVnXCIpKClcclxuICAgICAgICAgICAgICAgIC5zZXRGZnByb2JlUGF0aChmZnByb2JlUGF0aClcclxuICAgICAgICAgICAgICAgIC5zZXRGZm1wZWdQYXRoKGZmbXBlZ1BhdGgpO1xyXG5cclxuICAgICAgICAgICAgZmZtcGVnXHJcbiAgICAgICAgICAgICAgICAuaW5wdXQoaW1hZ2VQYXRoKVxyXG4gICAgICAgICAgICAgICAgLm5vQXVkaW8oKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dE9wdGlvbnMoJy1waXhfZm10IHl1djQyMHAnKVxyXG4gICAgICAgICAgICAgICAgLm91dHB1dChyZXNVcmwpXHJcbiAgICAgICAgICAgICAgICAuc2l6ZSgnNzIweD8nKVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZW5kXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJHZW5lcmF0ZWQgIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBmcy51bmxpbmtTeW5jKGltYWdlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmZtcGVnLmtpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc1VybCk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZXJyb3JcIiwgKGUpID0+IGVycm9yKGUpKS5ydW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydFRvR2lmKGltYWdlUGF0aCkge1xyXG4gICAgICAgIHZhciByZXNVcmwgPSBpbWFnZVBhdGguc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpLnNwbGl0KCcuJylbMF0gKyAnLmdpZic7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jKHJlc29sdmUsIGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBmZm1wZWcgPSByZXF1aXJlKFwiZmx1ZW50LWZmbXBlZ1wiKSgpXHJcbiAgICAgICAgICAgICAgICAuc2V0RmZwcm9iZVBhdGgoZmZwcm9iZVBhdGgpXHJcbiAgICAgICAgICAgICAgICAuc2V0RmZtcGVnUGF0aChmZm1wZWdQYXRoKTtcclxuXHJcbiAgICAgICAgICAgIGZmbXBlZ1xyXG4gICAgICAgICAgICAgICAgLmlucHV0KGltYWdlUGF0aClcclxuICAgICAgICAgICAgICAgIC5vdXRwdXQocmVzVXJsKVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZW5kXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJHZW5lcmF0ZWQgIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBmcy51bmxpbmtTeW5jKGltYWdlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmZtcGVnLmtpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc1VybCk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLm9uKFwiZXJyb3JcIiwgKGUpID0+IGVycm9yKGUpKS5ydW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgY29udmVydFdlYnBUb1dlYm1OZXcoZmlsZW5hbWUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWVXaXRob3V0RXh0ID0gZmlsZW5hbWUucmVwbGFjZSgnLndlYnAnLCAnJylcclxuICAgICAgICAgICAgY29uc3QgZnJhbWVzID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICdmcmFtZXMnKVxyXG4gICAgICAgICAgICBjb25zdCBkZWxldGVPcmlnaW5hbCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmcmFtZXMpKSBmcy5ybWRpclN5bmMoZnJhbWVzLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KVxyXG4gICAgICAgICAgICBmcy5ta2RpclN5bmMoZnJhbWVzKVxyXG5cclxuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpcignZnJhbWVzJylcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIHByb2Nlc3MuY3dkKCkpXHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgYGFuaW1fZHVtcCAuLi8ke2ZpbGVuYW1lfWApXHJcbiAgICAgICAgICAgIGV4ZWMoYGFuaW1fZHVtcCAuLi8ke2ZpbGVuYW1lfWApXHJcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5jaGRpcignLi4nKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbaW5mb10nLCBwcm9jZXNzLmN3ZCgpKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYW5kID0gYHdlYnBtdXggLWluZm8gLi8ke2ZpbGVuYW1lfWBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tpbmZvXScsIGNvbW1hbmQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWMoY29tbWFuZClcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAudGhlbigoeyBzdGRvdXQsIHN0ZGVyciB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0ZGVycikgcmV0dXJuIFByb21pc2UucmVqZWN0KHN0ZGVycilcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNBbmltYXRpb24gPSBzdGRvdXQubWF0Y2goL0ZlYXR1cmVzIHByZXNlbnQ6IGFuaW1hdGlvbi8pICE9PSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0FuaW1hdGlvbikgcmV0dXJuIFByb21pc2UucmVqZWN0KCdUaGlzIGlzIG5vdCBhbiBhbmltYXRlZCB3ZWJwIGZpbGUnKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaXJzdExpbmUgPSBzdGRvdXQubWF0Y2goLzE6LitbXFxyXT9cXG4vZylcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpcnN0TGluZSkgcmV0dXJuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZyYW1lTGVuZ3RoID0gZmlyc3RMaW5lWzBdLnNwbGl0KC9cXHMrL2cpWzZdXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZnJhbWVyYXRlID0gTWF0aC5yb3VuZCgxMDAwIC8gZnJhbWVMZW5ndGgpIC8vIGZyYW1lcy9zZWNvbmRcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gcGF0aC5yZXNvbHZlKGZyYW1lcywgJ2R1bXBfJTA0ZC5wbmcnKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSBgZmZtcGVnIC1mcmFtZXJhdGUgJHtmcmFtZXJhdGV9IC1pIFwiJHtkdW1wfVwiIFwiJHtuYW1lV2l0aG91dEV4dH0ud2VibVwiIC15YFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dJywgY29tbWFuZClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhlYyhjb21tYW5kKVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC50aGVuKCh7IHN0ZG91dCwgc3RkZXJyIH0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoL2Vycm9yL2dtLnRlc3Qoc3RkZXJyKSkgcmV0dXJuIFByb21pc2UucmVqZWN0KHN0ZGVycilcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY2xlYW51cFxyXG4gICAgICAgICAgICAgICAgICAgIGZzLnJtZGlyU3luYyhmcmFtZXMsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlbGV0ZU9yaWdpbmFsKSBmcy5ybVN5bmMocGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIGZpbGVuYW1lKSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2luZm9dIFN1Y2Nlc3MhXFxuJylcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcihlcnIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGVybWluYXRlV2l0aEVycm9yKGBbZmF0YWxdICR7ZXJyfWApXHJcbiAgICAgICAgICAgICAgICAgICAgZnMucm1kaXJTeW5jKGZyYW1lcywgeyByZWN1cnNpdmU6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGNvbnZlcnRQbmdUb0ljbyhmaWxlTmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdmFyIG5ld05hbWUgPSBmaWxlTmFtZS5zcGxpdCgnL2lucHV0LycpLmpvaW4oJy9vdXRwdXQvJykuc3BsaXQoJy4nKVswXSArICcuaWNvJztcclxuICAgICAgICAgICAgcG5nVG9JY28oZmlsZU5hbWUpXHJcbiAgICAgICAgICAgICAgICAudGhlbihidWYgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMobmV3TmFtZSwgYnVmKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5ld05hbWUpXHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yKGVycilcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgY29udmVydEhlaWNUb0pwZyhmaWxlTmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyhyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBuZXdOYW1lID0gZmlsZU5hbWUuc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpLnNwbGl0KCcuJylbMF0gKyAnLmpwZyc7XHJcbiAgICAgICAgICAgIGNvbnN0IGltYWdlQnVmZmVyID0gZnMucmVhZEZpbGVTeW5jKGZpbGVOYW1lKVxyXG4gICAgICAgICAgICBjb25zdCBvdXRwdXRCdWZmZXIgPSBhd2FpdCBjb252ZXJ0KHtcclxuICAgICAgICAgICAgICAgIGJ1ZmZlcjogaW1hZ2VCdWZmZXIsIC8vIHRoZSBIRUlDIGZpbGUgYnVmZmVyXHJcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdKUEVHJywgLy8gb3V0cHV0IGZvcm1hdFxyXG4gICAgICAgICAgICAgICAgcXVhbGl0eTogMSAvLyB0aGUganBlZyBjb21wcmVzc2lvbiBxdWFsaXR5LCBiZXR3ZWVuIDAgYW5kIDFcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMobmV3TmFtZSwgb3V0cHV0QnVmZmVyKVxyXG4gICAgICAgICAgICByZXNvbHZlKG5ld05hbWUpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZW1vdmVJbWFnZUJhY2tncm91bmQoaW1nU291cmNlKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgaW1hZ2VCdWZmZXIgPSBmcy5yZWFkRmlsZVN5bmMoaW1nU291cmNlKTtcclxuICAgICAgICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtpbWFnZUJ1ZmZlcl0sIHsgdHlwZTogXCJpbWFnZS9wbmdcIiB9KTtcclxuICAgICAgICAgICAgdmFyIG5ld05hbWUgPSBpbWdTb3VyY2Uuc3BsaXQoJy9pbnB1dC8nKS5qb2luKCcvb3V0cHV0LycpO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlbW92ZUJhY2tncm91bmQoYmxvYikudGhlbihhc3luYyhibG9iMikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGF3YWl0IGJsb2IyLmFycmF5QnVmZmVyKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMobmV3TmFtZSwgYnVmZmVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5ld05hbWUpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlLm1lc3NhZ2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0IGRlZmF1bHQgSW1hZ2VUb29sOyIsICIgZXhwb3J0IGRlZmF1bHQgY29va2llID0gW3tcclxuICAgICAgICAgXCJkb21haW5cIjogXCIueW91dHViZS5jb21cIixcclxuICAgICAgICAgXCJleHBpcmF0aW9uRGF0ZVwiOiAxNzU3MTcxMTQ1LjcyNjcwNyxcclxuICAgICAgICAgXCJob3N0T25seVwiOiBmYWxzZSxcclxuICAgICAgICAgXCJodHRwT25seVwiOiBmYWxzZSxcclxuICAgICAgICAgXCJuYW1lXCI6IFwiX19TZWN1cmUtMVBBUElTSURcIixcclxuICAgICAgICAgXCJwYXRoXCI6IFwiL1wiLFxyXG4gICAgICAgICBcInNhbWVTaXRlXCI6IFwidW5zcGVjaWZpZWRcIixcclxuICAgICAgICAgXCJzZWN1cmVcIjogdHJ1ZSxcclxuICAgICAgICAgXCJzZXNzaW9uXCI6IGZhbHNlLFxyXG4gICAgICAgICBcInN0b3JlSWRcIjogXCIwXCIsXHJcbiAgICAgICAgIFwidmFsdWVcIjogXCJmS0xFQkctSzdyTnFuMmRSL0FETkJHWS1kdHNjVVBvVERXXCIsXHJcbiAgICAgICAgIFwiaWRcIjogMVxyXG4gICAgIH0sXHJcbiAgICAge1xyXG4gICAgICAgICBcImRvbWFpblwiOiBcIi55b3V0dWJlLmNvbVwiLFxyXG4gICAgICAgICBcImV4cGlyYXRpb25EYXRlXCI6IDE3NTcxNzExNDUuNzI2OTg0LFxyXG4gICAgICAgICBcImhvc3RPbmx5XCI6IGZhbHNlLFxyXG4gICAgICAgICBcImh0dHBPbmx5XCI6IHRydWUsXHJcbiAgICAgICAgIFwibmFtZVwiOiBcIl9fU2VjdXJlLTFQU0lEXCIsXHJcbiAgICAgICAgIFwicGF0aFwiOiBcIi9cIixcclxuICAgICAgICAgXCJzYW1lU2l0ZVwiOiBcInVuc3BlY2lmaWVkXCIsXHJcbiAgICAgICAgIFwic2VjdXJlXCI6IHRydWUsXHJcbiAgICAgICAgIFwic2Vzc2lvblwiOiBmYWxzZSxcclxuICAgICAgICAgXCJzdG9yZUlkXCI6IFwiMFwiLFxyXG4gICAgICAgICBcInZhbHVlXCI6IFwiZy5hMDAwbWdnNlQ1aGNjLWwyYTdCd3pCdTVDSHZRVFJIVV84d2s2RUV4al9VUXY1M1dNVUVKXzJnamRLbzBhMklxS05UdFc1akxBd0FDZ1lLQWJnU0FSUVNGUUhHWDJNaXJLZFpYMDhEYjNHdFFJTjRUNklWbnhvVkFVRjh5S29mdDJnZXZZeUdkalBLU3BTVENwRGIwMDc2XCIsXHJcbiAgICAgICAgIFwiaWRcIjogMlxyXG4gICAgIH0sXHJcbiAgICAge1xyXG4gICAgICAgICBcImRvbWFpblwiOiBcIi55b3V0dWJlLmNvbVwiLFxyXG4gICAgICAgICBcImV4cGlyYXRpb25EYXRlXCI6IDE3NTQ0NjYxMDQuMjM3NDY3LFxyXG4gICAgICAgICBcImhvc3RPbmx5XCI6IGZhbHNlLFxyXG4gICAgICAgICBcImh0dHBPbmx5XCI6IHRydWUsXHJcbiAgICAgICAgIFwibmFtZVwiOiBcIl9fU2VjdXJlLTFQU0lEQ0NcIixcclxuICAgICAgICAgXCJwYXRoXCI6IFwiL1wiLFxyXG4gICAgICAgICBcInNhbWVTaXRlXCI6IFwidW5zcGVjaWZpZWRcIixcclxuICAgICAgICAgXCJzZWN1cmVcIjogdHJ1ZSxcclxuICAgICAgICAgXCJzZXNzaW9uXCI6IGZhbHNlLFxyXG4gICAgICAgICBcInN0b3JlSWRcIjogXCIwXCIsXHJcbiAgICAgICAgIFwidmFsdWVcIjogXCJBS0V5WHpVOV9RZnRRY05sOFh0eWE4UUp4TU45cHNHdXRxcXJONXA5Z1FKOEx1Y3BJYUtCQTR4SzNOaXM0SUhEUUtfMkM4bi1VTXdcIixcclxuICAgICAgICAgXCJpZFwiOiAzXHJcbiAgICAgfSxcclxuICAgICB7XHJcbiAgICAgICAgIFwiZG9tYWluXCI6IFwiLnlvdXR1YmUuY29tXCIsXHJcbiAgICAgICAgIFwiZXhwaXJhdGlvbkRhdGVcIjogMTc1NDM4NTMzMi4yMzg4MzksXHJcbiAgICAgICAgIFwiaG9zdE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwiaHR0cE9ubHlcIjogdHJ1ZSxcclxuICAgICAgICAgXCJuYW1lXCI6IFwiX19TZWN1cmUtMVBTSURUU1wiLFxyXG4gICAgICAgICBcInBhdGhcIjogXCIvXCIsXHJcbiAgICAgICAgIFwic2FtZVNpdGVcIjogXCJ1bnNwZWNpZmllZFwiLFxyXG4gICAgICAgICBcInNlY3VyZVwiOiB0cnVlLFxyXG4gICAgICAgICBcInNlc3Npb25cIjogZmFsc2UsXHJcbiAgICAgICAgIFwic3RvcmVJZFwiOiBcIjBcIixcclxuICAgICAgICAgXCJ2YWx1ZVwiOiBcInNpZHRzLUNqRUI0RTJka1ZHbVNWS0EtQkhXUDZ2cjQ2aUIyOWVVNWU0U0hrdlpuOHRfWGI5YS02eDRjeExXNFJaR3Fja3BRUTJmRUFBXCIsXHJcbiAgICAgICAgIFwiaWRcIjogNFxyXG4gICAgIH0sXHJcbiAgICAge1xyXG4gICAgICAgICBcImRvbWFpblwiOiBcIi55b3V0dWJlLmNvbVwiLFxyXG4gICAgICAgICBcImV4cGlyYXRpb25EYXRlXCI6IDE3NTcxNzExNDUuNzI2NzUyLFxyXG4gICAgICAgICBcImhvc3RPbmx5XCI6IGZhbHNlLFxyXG4gICAgICAgICBcImh0dHBPbmx5XCI6IGZhbHNlLFxyXG4gICAgICAgICBcIm5hbWVcIjogXCJfX1NlY3VyZS0zUEFQSVNJRFwiLFxyXG4gICAgICAgICBcInBhdGhcIjogXCIvXCIsXHJcbiAgICAgICAgIFwic2FtZVNpdGVcIjogXCJub19yZXN0cmljdGlvblwiLFxyXG4gICAgICAgICBcInNlY3VyZVwiOiB0cnVlLFxyXG4gICAgICAgICBcInNlc3Npb25cIjogZmFsc2UsXHJcbiAgICAgICAgIFwic3RvcmVJZFwiOiBcIjBcIixcclxuICAgICAgICAgXCJ2YWx1ZVwiOiBcImZLTEVCRy1LN3JOcW4yZFIvQUROQkdZLWR0c2NVUG9URFdcIixcclxuICAgICAgICAgXCJpZFwiOiA1XHJcbiAgICAgfSxcclxuICAgICB7XHJcbiAgICAgICAgIFwiZG9tYWluXCI6IFwiLnlvdXR1YmUuY29tXCIsXHJcbiAgICAgICAgIFwiZXhwaXJhdGlvbkRhdGVcIjogMTc1NzE3MTE0NS43MjcwMDgsXHJcbiAgICAgICAgIFwiaG9zdE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwiaHR0cE9ubHlcIjogdHJ1ZSxcclxuICAgICAgICAgXCJuYW1lXCI6IFwiX19TZWN1cmUtM1BTSURcIixcclxuICAgICAgICAgXCJwYXRoXCI6IFwiL1wiLFxyXG4gICAgICAgICBcInNhbWVTaXRlXCI6IFwibm9fcmVzdHJpY3Rpb25cIixcclxuICAgICAgICAgXCJzZWN1cmVcIjogdHJ1ZSxcclxuICAgICAgICAgXCJzZXNzaW9uXCI6IGZhbHNlLFxyXG4gICAgICAgICBcInN0b3JlSWRcIjogXCIwXCIsXHJcbiAgICAgICAgIFwidmFsdWVcIjogXCJnLmEwMDBtZ2c2VDVoY2MtbDJhN0J3ekJ1NUNIdlFUUkhVXzh3azZFRXhqX1VRdjUzV01VRUpWY2VGejVoMkxkbC1OcjY0NGJ1S21RQUNnWUtBWUFTQVJRU0ZRSEdYMk1pU200Y1hxQ1VkV1F5UnRmaWVGb1lpeG9WQVVGOHlLcU8wUW5qYm00RjFWZG5ITGZqcndBRjAwNzZcIixcclxuICAgICAgICAgXCJpZFwiOiA2XHJcbiAgICAgfSxcclxuICAgICB7XHJcbiAgICAgICAgIFwiZG9tYWluXCI6IFwiLnlvdXR1YmUuY29tXCIsXHJcbiAgICAgICAgIFwiZXhwaXJhdGlvbkRhdGVcIjogMTc1NDQ2NjEwNC4yMzc1MDcsXHJcbiAgICAgICAgIFwiaG9zdE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwiaHR0cE9ubHlcIjogdHJ1ZSxcclxuICAgICAgICAgXCJuYW1lXCI6IFwiX19TZWN1cmUtM1BTSURDQ1wiLFxyXG4gICAgICAgICBcInBhdGhcIjogXCIvXCIsXHJcbiAgICAgICAgIFwic2FtZVNpdGVcIjogXCJub19yZXN0cmljdGlvblwiLFxyXG4gICAgICAgICBcInNlY3VyZVwiOiB0cnVlLFxyXG4gICAgICAgICBcInNlc3Npb25cIjogZmFsc2UsXHJcbiAgICAgICAgIFwic3RvcmVJZFwiOiBcIjBcIixcclxuICAgICAgICAgXCJ2YWx1ZVwiOiBcIkFLRXlYelh4Vkg5ZmZPZjhlRHQxQktId0R0T2RqSThhSFFpQWdaSkRIWTlsSFJnWXdzM2lTNm9vS0lwLTAzOHZhdjlDNUo0MGJnXCIsXHJcbiAgICAgICAgIFwiaWRcIjogN1xyXG4gICAgIH0sXHJcbiAgICAge1xyXG4gICAgICAgICBcImRvbWFpblwiOiBcIi55b3V0dWJlLmNvbVwiLFxyXG4gICAgICAgICBcImV4cGlyYXRpb25EYXRlXCI6IDE3NTQzODUzMzIuMjM4OTQ1LFxyXG4gICAgICAgICBcImhvc3RPbmx5XCI6IGZhbHNlLFxyXG4gICAgICAgICBcImh0dHBPbmx5XCI6IHRydWUsXHJcbiAgICAgICAgIFwibmFtZVwiOiBcIl9fU2VjdXJlLTNQU0lEVFNcIixcclxuICAgICAgICAgXCJwYXRoXCI6IFwiL1wiLFxyXG4gICAgICAgICBcInNhbWVTaXRlXCI6IFwibm9fcmVzdHJpY3Rpb25cIixcclxuICAgICAgICAgXCJzZWN1cmVcIjogdHJ1ZSxcclxuICAgICAgICAgXCJzZXNzaW9uXCI6IGZhbHNlLFxyXG4gICAgICAgICBcInN0b3JlSWRcIjogXCIwXCIsXHJcbiAgICAgICAgIFwidmFsdWVcIjogXCJzaWR0cy1DakVCNEUyZGtWR21TVktBLUJIV1A2dnI0NmlCMjllVTVlNFNIa3Zabjh0X1hiOWEtNng0Y3hMVzRSWkdxY2twUVEyZkVBQVwiLFxyXG4gICAgICAgICBcImlkXCI6IDhcclxuICAgICB9LFxyXG4gICAgIHtcclxuICAgICAgICAgXCJkb21haW5cIjogXCIueW91dHViZS5jb21cIixcclxuICAgICAgICAgXCJleHBpcmF0aW9uRGF0ZVwiOiAxNzU3MTcxMTQ1LjcyNjYxNyxcclxuICAgICAgICAgXCJob3N0T25seVwiOiBmYWxzZSxcclxuICAgICAgICAgXCJodHRwT25seVwiOiBmYWxzZSxcclxuICAgICAgICAgXCJuYW1lXCI6IFwiQVBJU0lEXCIsXHJcbiAgICAgICAgIFwicGF0aFwiOiBcIi9cIixcclxuICAgICAgICAgXCJzYW1lU2l0ZVwiOiBcInVuc3BlY2lmaWVkXCIsXHJcbiAgICAgICAgIFwic2VjdXJlXCI6IGZhbHNlLFxyXG4gICAgICAgICBcInNlc3Npb25cIjogZmFsc2UsXHJcbiAgICAgICAgIFwic3RvcmVJZFwiOiBcIjBcIixcclxuICAgICAgICAgXCJ2YWx1ZVwiOiBcImJYdGE3UDBUbDRxY1I3UjMvQWJKc0k0bF82OTdUTkVCc2JcIixcclxuICAgICAgICAgXCJpZFwiOiA5XHJcbiAgICAgfSxcclxuICAgICB7XHJcbiAgICAgICAgIFwiZG9tYWluXCI6IFwiLnlvdXR1YmUuY29tXCIsXHJcbiAgICAgICAgIFwiZXhwaXJhdGlvbkRhdGVcIjogMTc1NzE3MTE0NS43MjY0NjcsXHJcbiAgICAgICAgIFwiaG9zdE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwiaHR0cE9ubHlcIjogdHJ1ZSxcclxuICAgICAgICAgXCJuYW1lXCI6IFwiSFNJRFwiLFxyXG4gICAgICAgICBcInBhdGhcIjogXCIvXCIsXHJcbiAgICAgICAgIFwic2FtZVNpdGVcIjogXCJ1bnNwZWNpZmllZFwiLFxyXG4gICAgICAgICBcInNlY3VyZVwiOiBmYWxzZSxcclxuICAgICAgICAgXCJzZXNzaW9uXCI6IGZhbHNlLFxyXG4gICAgICAgICBcInN0b3JlSWRcIjogXCIwXCIsXHJcbiAgICAgICAgIFwidmFsdWVcIjogXCJBYVNUSFZQWlNYRU1YVFFnSVwiLFxyXG4gICAgICAgICBcImlkXCI6IDEwXHJcbiAgICAgfSxcclxuICAgICB7XHJcbiAgICAgICAgIFwiZG9tYWluXCI6IFwiLnlvdXR1YmUuY29tXCIsXHJcbiAgICAgICAgIFwiZXhwaXJhdGlvbkRhdGVcIjogMTc1NTI3MzA4Mi4zMDQwNzMsXHJcbiAgICAgICAgIFwiaG9zdE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwiaHR0cE9ubHlcIjogdHJ1ZSxcclxuICAgICAgICAgXCJuYW1lXCI6IFwiTE9HSU5fSU5GT1wiLFxyXG4gICAgICAgICBcInBhdGhcIjogXCIvXCIsXHJcbiAgICAgICAgIFwic2FtZVNpdGVcIjogXCJub19yZXN0cmljdGlvblwiLFxyXG4gICAgICAgICBcInNlY3VyZVwiOiB0cnVlLFxyXG4gICAgICAgICBcInNlc3Npb25cIjogZmFsc2UsXHJcbiAgICAgICAgIFwic3RvcmVJZFwiOiBcIjBcIixcclxuICAgICAgICAgXCJ2YWx1ZVwiOiBcIkFGbW1GMnN3UlFJZ2ZHeGNPQ1J5MFRoU05fQXItY0ViWjRmVWludTlOaTdzOWw5alRLWHl3T0VDSVFDZ2cyNHJvTUlzM3Fkc2lYOS1NdUxzSUFOSDkxQU92aGZCSEM4Tml3MFRDdzpRVVEzTWpObWVsQkhhVmxmUmtseWEzWXpXV0o1VTFGRE1raHVjaTFZVVVSNFJqWkJSVkZtV21GSmNHUmxhMm8zWlVWNk0yZFVjVUZaV25sbVpsWnRMVXBwTkRkVlFVUm9RVk5wYTJKWmN5MUVWV3h0WldwdFkyNW9iVFYxWjBwalZFWmpOVEpRWlZGSU1VUk5RWFJTTnpSWWVFaHBjM2hpZVZwdlNraDJSblJ6UTNCdk5WZDVRMTlhY2twSVEzWkJTMnhMU1VKVk1uUllNVUoxV1VaQ2RVeDNcIixcclxuICAgICAgICAgXCJpZFwiOiAxMVxyXG4gICAgIH0sXHJcbiAgICAge1xyXG4gICAgICAgICBcImRvbWFpblwiOiBcIi55b3V0dWJlLmNvbVwiLFxyXG4gICAgICAgICBcImV4cGlyYXRpb25EYXRlXCI6IDE3NTc0OTAxMDEuNzY0NzM0LFxyXG4gICAgICAgICBcImhvc3RPbmx5XCI6IGZhbHNlLFxyXG4gICAgICAgICBcImh0dHBPbmx5XCI6IGZhbHNlLFxyXG4gICAgICAgICBcIm5hbWVcIjogXCJQUkVGXCIsXHJcbiAgICAgICAgIFwicGF0aFwiOiBcIi9cIixcclxuICAgICAgICAgXCJzYW1lU2l0ZVwiOiBcInVuc3BlY2lmaWVkXCIsXHJcbiAgICAgICAgIFwic2VjdXJlXCI6IHRydWUsXHJcbiAgICAgICAgIFwic2Vzc2lvblwiOiBmYWxzZSxcclxuICAgICAgICAgXCJzdG9yZUlkXCI6IFwiMFwiLFxyXG4gICAgICAgICBcInZhbHVlXCI6IFwiZjY9NDAwMDAwMDAmZjc9NDEwMCZ0ej1FdXJvcGUuUGFyaXMmZjQ9NDAwMDAwMCZmNT0zMDAwMFwiLFxyXG4gICAgICAgICBcImlkXCI6IDEyXHJcbiAgICAgfSxcclxuICAgICB7XHJcbiAgICAgICAgIFwiZG9tYWluXCI6IFwiLnlvdXR1YmUuY29tXCIsXHJcbiAgICAgICAgIFwiZXhwaXJhdGlvbkRhdGVcIjogMTc1NzE3MTE0NS43MjY2NjIsXHJcbiAgICAgICAgIFwiaG9zdE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwiaHR0cE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwibmFtZVwiOiBcIlNBUElTSURcIixcclxuICAgICAgICAgXCJwYXRoXCI6IFwiL1wiLFxyXG4gICAgICAgICBcInNhbWVTaXRlXCI6IFwidW5zcGVjaWZpZWRcIixcclxuICAgICAgICAgXCJzZWN1cmVcIjogdHJ1ZSxcclxuICAgICAgICAgXCJzZXNzaW9uXCI6IGZhbHNlLFxyXG4gICAgICAgICBcInN0b3JlSWRcIjogXCIwXCIsXHJcbiAgICAgICAgIFwidmFsdWVcIjogXCJmS0xFQkctSzdyTnFuMmRSL0FETkJHWS1kdHNjVVBvVERXXCIsXHJcbiAgICAgICAgIFwiaWRcIjogMTNcclxuICAgICB9LFxyXG4gICAgIHtcclxuICAgICAgICAgXCJkb21haW5cIjogXCIueW91dHViZS5jb21cIixcclxuICAgICAgICAgXCJleHBpcmF0aW9uRGF0ZVwiOiAxNzU3MTcxMTQ1LjcyNjk2LFxyXG4gICAgICAgICBcImhvc3RPbmx5XCI6IGZhbHNlLFxyXG4gICAgICAgICBcImh0dHBPbmx5XCI6IGZhbHNlLFxyXG4gICAgICAgICBcIm5hbWVcIjogXCJTSURcIixcclxuICAgICAgICAgXCJwYXRoXCI6IFwiL1wiLFxyXG4gICAgICAgICBcInNhbWVTaXRlXCI6IFwidW5zcGVjaWZpZWRcIixcclxuICAgICAgICAgXCJzZWN1cmVcIjogZmFsc2UsXHJcbiAgICAgICAgIFwic2Vzc2lvblwiOiBmYWxzZSxcclxuICAgICAgICAgXCJzdG9yZUlkXCI6IFwiMFwiLFxyXG4gICAgICAgICBcInZhbHVlXCI6IFwiZy5hMDAwbWdnNlQ1aGNjLWwyYTdCd3pCdTVDSHZRVFJIVV84d2s2RUV4al9VUXY1M1dNVUVKOTZyWlJwQzFaMmxFX0JfeGhEYWVkUUFDZ1lLQWM0U0FSUVNGUUhHWDJNaVdvN0RmZGJCelRBWkktbm5lM003SWhvVkFVRjh5S3F6Rko2S0Z6cnFHenJCWl9aaXpkN2cwMDc2XCIsXHJcbiAgICAgICAgIFwiaWRcIjogMTRcclxuICAgICB9LFxyXG4gICAgIHtcclxuICAgICAgICAgXCJkb21haW5cIjogXCIueW91dHViZS5jb21cIixcclxuICAgICAgICAgXCJleHBpcmF0aW9uRGF0ZVwiOiAxNzU0NDY2MTA0LjIzNzM2MSxcclxuICAgICAgICAgXCJob3N0T25seVwiOiBmYWxzZSxcclxuICAgICAgICAgXCJodHRwT25seVwiOiBmYWxzZSxcclxuICAgICAgICAgXCJuYW1lXCI6IFwiU0lEQ0NcIixcclxuICAgICAgICAgXCJwYXRoXCI6IFwiL1wiLFxyXG4gICAgICAgICBcInNhbWVTaXRlXCI6IFwidW5zcGVjaWZpZWRcIixcclxuICAgICAgICAgXCJzZWN1cmVcIjogZmFsc2UsXHJcbiAgICAgICAgIFwic2Vzc2lvblwiOiBmYWxzZSxcclxuICAgICAgICAgXCJzdG9yZUlkXCI6IFwiMFwiLFxyXG4gICAgICAgICBcInZhbHVlXCI6IFwiQUtFeVh6VUg3dF95NTkxZzVWbFhVOTNNeTZMcE1PYzh4Wk9KczgyWHE3RjJDa2VNUVlXVFNKdHJnZ01xTG5wM2Fuc2xLbWI3d1FNXCIsXHJcbiAgICAgICAgIFwiaWRcIjogMTVcclxuICAgICB9LFxyXG4gICAgIHtcclxuICAgICAgICAgXCJkb21haW5cIjogXCIueW91dHViZS5jb21cIixcclxuICAgICAgICAgXCJleHBpcmF0aW9uRGF0ZVwiOiAxNzU3MTcxMTQ1LjcyNjU2NixcclxuICAgICAgICAgXCJob3N0T25seVwiOiBmYWxzZSxcclxuICAgICAgICAgXCJodHRwT25seVwiOiB0cnVlLFxyXG4gICAgICAgICBcIm5hbWVcIjogXCJTU0lEXCIsXHJcbiAgICAgICAgIFwicGF0aFwiOiBcIi9cIixcclxuICAgICAgICAgXCJzYW1lU2l0ZVwiOiBcInVuc3BlY2lmaWVkXCIsXHJcbiAgICAgICAgIFwic2VjdXJlXCI6IHRydWUsXHJcbiAgICAgICAgIFwic2Vzc2lvblwiOiBmYWxzZSxcclxuICAgICAgICAgXCJzdG9yZUlkXCI6IFwiMFwiLFxyXG4gICAgICAgICBcInZhbHVlXCI6IFwiQS1DbHVvVUdQU0JjazQxb2NcIixcclxuICAgICAgICAgXCJpZFwiOiAxNlxyXG4gICAgIH0sXHJcbiAgICAge1xyXG4gICAgICAgICBcImRvbWFpblwiOiBcIi55b3V0dWJlLmNvbVwiLFxyXG4gICAgICAgICBcImV4cGlyYXRpb25EYXRlXCI6IDE3MjI5MzAxMDksXHJcbiAgICAgICAgIFwiaG9zdE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwiaHR0cE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwibmFtZVwiOiBcIlNULTNvcHZwNVwiLFxyXG4gICAgICAgICBcInBhdGhcIjogXCIvXCIsXHJcbiAgICAgICAgIFwic2FtZVNpdGVcIjogXCJ1bnNwZWNpZmllZFwiLFxyXG4gICAgICAgICBcInNlY3VyZVwiOiBmYWxzZSxcclxuICAgICAgICAgXCJzZXNzaW9uXCI6IGZhbHNlLFxyXG4gICAgICAgICBcInN0b3JlSWRcIjogXCIwXCIsXHJcbiAgICAgICAgIFwidmFsdWVcIjogXCJzZXNzaW9uX2xvZ2luaW5mbz1BRm1tRjJzd1JRSWdmR3hjT0NSeTBUaFNOX0FyLWNFYlo0ZlVpbnU5Tmk3czlsOWpUS1h5d09FQ0lRQ2dnMjRyb01JczNxZHNpWDktTXVMc0lBTkg5MUFPdmhmQkhDOE5pdzBUQ3clM0FRVVEzTWpObWVsQkhhVmxmUmtseWEzWXpXV0o1VTFGRE1raHVjaTFZVVVSNFJqWkJSVkZtV21GSmNHUmxhMm8zWlVWNk0yZFVjVUZaV25sbVpsWnRMVXBwTkRkVlFVUm9RVk5wYTJKWmN5MUVWV3h0WldwdFkyNW9iVFYxWjBwalZFWmpOVEpRWlZGSU1VUk5RWFJTTnpSWWVFaHBjM2hpZVZwdlNraDJSblJ6UTNCdk5WZDVRMTlhY2twSVEzWkJTMnhMU1VKVk1uUllNVUoxV1VaQ2RVeDNcIixcclxuICAgICAgICAgXCJpZFwiOiAxN1xyXG4gICAgIH0sXHJcbiAgICAge1xyXG4gICAgICAgICBcImRvbWFpblwiOiBcIi55b3V0dWJlLmNvbVwiLFxyXG4gICAgICAgICBcImV4cGlyYXRpb25EYXRlXCI6IDE3MjI5MzAxMDcsXHJcbiAgICAgICAgIFwiaG9zdE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwiaHR0cE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwibmFtZVwiOiBcIlNULXRsYWRjd1wiLFxyXG4gICAgICAgICBcInBhdGhcIjogXCIvXCIsXHJcbiAgICAgICAgIFwic2FtZVNpdGVcIjogXCJ1bnNwZWNpZmllZFwiLFxyXG4gICAgICAgICBcInNlY3VyZVwiOiBmYWxzZSxcclxuICAgICAgICAgXCJzZXNzaW9uXCI6IGZhbHNlLFxyXG4gICAgICAgICBcInN0b3JlSWRcIjogXCIwXCIsXHJcbiAgICAgICAgIFwidmFsdWVcIjogXCJzZXNzaW9uX2xvZ2luaW5mbz1BRm1tRjJzd1JRSWdmR3hjT0NSeTBUaFNOX0FyLWNFYlo0ZlVpbnU5Tmk3czlsOWpUS1h5d09FQ0lRQ2dnMjRyb01JczNxZHNpWDktTXVMc0lBTkg5MUFPdmhmQkhDOE5pdzBUQ3clM0FRVVEzTWpObWVsQkhhVmxmUmtseWEzWXpXV0o1VTFGRE1raHVjaTFZVVVSNFJqWkJSVkZtV21GSmNHUmxhMm8zWlVWNk0yZFVjVUZaV25sbVpsWnRMVXBwTkRkVlFVUm9RVk5wYTJKWmN5MUVWV3h0WldwdFkyNW9iVFYxWjBwalZFWmpOVEpRWlZGSU1VUk5RWFJTTnpSWWVFaHBjM2hpZVZwdlNraDJSblJ6UTNCdk5WZDVRMTlhY2twSVEzWkJTMnhMU1VKVk1uUllNVUoxV1VaQ2RVeDNcIixcclxuICAgICAgICAgXCJpZFwiOiAxOFxyXG4gICAgIH0sXHJcbiAgICAge1xyXG4gICAgICAgICBcImRvbWFpblwiOiBcIi55b3V0dWJlLmNvbVwiLFxyXG4gICAgICAgICBcImV4cGlyYXRpb25EYXRlXCI6IDE3MjI5MzAxMDgsXHJcbiAgICAgICAgIFwiaG9zdE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwiaHR0cE9ubHlcIjogZmFsc2UsXHJcbiAgICAgICAgIFwibmFtZVwiOiBcIlNULXh1d3ViOVwiLFxyXG4gICAgICAgICBcInBhdGhcIjogXCIvXCIsXHJcbiAgICAgICAgIFwic2FtZVNpdGVcIjogXCJ1bnNwZWNpZmllZFwiLFxyXG4gICAgICAgICBcInNlY3VyZVwiOiBmYWxzZSxcclxuICAgICAgICAgXCJzZXNzaW9uXCI6IGZhbHNlLFxyXG4gICAgICAgICBcInN0b3JlSWRcIjogXCIwXCIsXHJcbiAgICAgICAgIFwidmFsdWVcIjogXCJzZXNzaW9uX2xvZ2luaW5mbz1BRm1tRjJzd1JRSWdmR3hjT0NSeTBUaFNOX0FyLWNFYlo0ZlVpbnU5Tmk3czlsOWpUS1h5d09FQ0lRQ2dnMjRyb01JczNxZHNpWDktTXVMc0lBTkg5MUFPdmhmQkhDOE5pdzBUQ3clM0FRVVEzTWpObWVsQkhhVmxmUmtseWEzWXpXV0o1VTFGRE1raHVjaTFZVVVSNFJqWkJSVkZtV21GSmNHUmxhMm8zWlVWNk0yZFVjVUZaV25sbVpsWnRMVXBwTkRkVlFVUm9RVk5wYTJKWmN5MUVWV3h0WldwdFkyNW9iVFYxWjBwalZFWmpOVEpRWlZGSU1VUk5RWFJTTnpSWWVFaHBjM2hpZVZwdlNraDJSblJ6UTNCdk5WZDVRMTlhY2twSVEzWkJTMnhMU1VKVk1uUllNVUoxV1VaQ2RVeDNcIixcclxuICAgICAgICAgXCJpZFwiOiAxOVxyXG4gICAgIH0sXHJcbiAgICAge1xyXG4gICAgICAgICBcImRvbWFpblwiOiBcIi55b3V0dWJlLmNvbVwiLFxyXG4gICAgICAgICBcImV4cGlyYXRpb25EYXRlXCI6IDE3MjU3MjI1NDMuMDAwNjI4LFxyXG4gICAgICAgICBcImhvc3RPbmx5XCI6IGZhbHNlLFxyXG4gICAgICAgICBcImh0dHBPbmx5XCI6IHRydWUsXHJcbiAgICAgICAgIFwibmFtZVwiOiBcIlZJU0lUT1JfUFJJVkFDWV9NRVRBREFUQVwiLFxyXG4gICAgICAgICBcInBhdGhcIjogXCIvXCIsXHJcbiAgICAgICAgIFwic2FtZVNpdGVcIjogXCJub19yZXN0cmljdGlvblwiLFxyXG4gICAgICAgICBcInNlY3VyZVwiOiB0cnVlLFxyXG4gICAgICAgICBcInNlc3Npb25cIjogZmFsc2UsXHJcbiAgICAgICAgIFwic3RvcmVJZFwiOiBcIjBcIixcclxuICAgICAgICAgXCJ2YWx1ZVwiOiBcIkNnSkdVaElJRWdRU0Fnc01JRHMlM0RcIixcclxuICAgICAgICAgXCJpZFwiOiAyMFxyXG4gICAgIH1cclxuIF0iLCAiY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xyXG4vLyBjb25zdCB5dGRsID0gcmVxdWlyZSgneXRkbC1jb3JlJyk7XHJcbmNvbnN0IHl0ZGwgPSByZXF1aXJlKCdAZGlzdHViZS95dGRsLWNvcmUnKTtcclxuY29uc3QgcmVhZGxpbmUgPSByZXF1aXJlKCdyZWFkbGluZScpO1xyXG5jb25zdCBjcCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKTtcclxuY29uc3QgaHR0cCA9IHJlcXVpcmUoJ2h0dHAnKTtcclxuY29uc3QgaHR0cHMgPSByZXF1aXJlKCdodHRwcycpO1xyXG5pbXBvcnQgY29va2llIGZyb20gJy4veXRDb29raWUnO1xyXG5jb25zdCBhZ2VudCA9IHl0ZGwuY3JlYXRlQWdlbnQoY29va2llKTtcclxuXHJcbmNsYXNzIFZpZGVvRG93bmxvYWRlclRvb2wge1xyXG4gICAgY29uc3RydWN0b3IoZm9sZGVyVG9vbCkge1xyXG4gICAgICAgIHRoaXMuZm9sZGVyVG9vbCA9IGZvbGRlclRvb2xcclxuICAgIH1cclxuICAgIGFzeW5jIGRvd25sb2FkVmlkZW8odXJsKSB7XHJcbiAgICAgICAgaWYgKHVybC5zcGxpdCgneW91dHViZScpLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZG93bmxvYWRZb3V0dWJlVmlkZW8odXJsKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHVybC5zcGxpdCgneG54eCcpLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZG93bmxvYWRWaWRlb1hueHgodXJsKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHVybC5zcGxpdCgneHZpZGVvcycpLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZG93bmxvYWRWaWRlb1h2aWRlb3ModXJsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhc3luYyBkb3dubG9hZFlvdXR1YmVWaWRlbyh1cmwpIHtcclxuICAgICAgICBjb25zdCBmaW5hbFBhdGhWaWRlbyA9IHRoaXMuZm9sZGVyVG9vbC5CQVNFX1BBVEggKyAnLycgKyB0aGlzLmZvbGRlclRvb2wuV09SS1NQQUNFX0RJUiArICcvaW5wdXQvJyArIHVybC5zdWJzdHJpbmcodXJsLmxlbmd0aCAtIDUsIHVybC5sZW5ndGgpICsgJ192Lm1wNCc7XHJcbiAgICAgICAgY29uc3QgZmluYWxQYXRoQXVkaW8gPSB0aGlzLmZvbGRlclRvb2wuQkFTRV9QQVRIICsgJy8nICsgdGhpcy5mb2xkZXJUb29sLldPUktTUEFDRV9ESVIgKyAnL2lucHV0LycgKyB1cmwuc3Vic3RyaW5nKHVybC5sZW5ndGggLSA1LCB1cmwubGVuZ3RoKSArICdfYS5tcDMnO1xyXG4gICAgICAgIGNvbnN0IGZpbmFsUGF0aCA9IHRoaXMuZm9sZGVyVG9vbC5CQVNFX1BBVEggKyAnLycgKyB0aGlzLmZvbGRlclRvb2wuV09SS1NQQUNFX0RJUiArICcvaW5wdXQvJyArIHVybC5zdWJzdHJpbmcodXJsLmxlbmd0aCAtIDUsIHVybC5sZW5ndGgpICsgJy5tcDQnO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2aWRlbyA9IHl0ZGwodXJsLCB7IHF1YWxpdHk6ICdoaWdoZXN0dmlkZW8nLCBhZ2VudCB9KVxyXG4gICAgICAgICAgICAgICAgdmlkZW8ucGlwZShmcy5jcmVhdGVXcml0ZVN0cmVhbShmaW5hbFBhdGhWaWRlbykpXHJcbiAgICAgICAgICAgICAgICB2aWRlby5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ZGlvID0geXRkbCh1cmwsIHsgcXVhbGl0eTogJ2hpZ2hlc3RhdWRpbycgfSlcclxuICAgICAgICAgICAgICAgICAgICBhdWRpby5waXBlKGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbmFsUGF0aEF1ZGlvKSlcclxuICAgICAgICAgICAgICAgICAgICBhdWRpby5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmZtcGVnID0gcmVxdWlyZShcImZsdWVudC1mZm1wZWdcIikoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldEZmcHJvYmVQYXRoKCcuL3Jlc291cmNlcy9mZm1wZWcvZmZwcm9iZS5leGUnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldEZmbXBlZ1BhdGgoJy4vcmVzb3VyY2VzL2ZmbXBlZy9mZm1wZWcuZXhlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZmbXBlZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmlucHV0KGZpbmFsUGF0aFZpZGVvKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmlucHV0KGZpbmFsUGF0aEF1ZGlvKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZE9wdGlvbnMoWyctbWFwIDA6dicsICctbWFwIDE6YScsICctYzp2IGNvcHknXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mb3JtYXQoJ21wNCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub3V0cHV0T3B0aW9ucygnLXBpeF9mbXQgeXV2NDIwcCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub3V0cHV0KGZpbmFsUGF0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbignZW5kJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2VuZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhmaW5hbFBhdGhBdWRpbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhmaW5hbFBhdGhWaWRlbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmZtcGVnLmtpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZpbmFsUGF0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FuIGVycm9yIGhhcHBlbmVkOiAnICsgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZXJyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZmbXBlZy5raWxsKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLnJ1bigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHZpZGVvLm9uKCdlcnJvcicsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGFzeW5jIGRvd25sb2FkQXVkaW8odXJsKSB7XHJcbiAgICAgICAgY29uc3QgZmluYWxQYXRoQXVkaW8gPSB0aGlzLmZvbGRlclRvb2wuQkFTRV9QQVRIICsgJy8nICsgdGhpcy5mb2xkZXJUb29sLldPUktTUEFDRV9ESVIgKyAnL2lucHV0LycgKyB1cmwuc3Vic3RyaW5nKHVybC5sZW5ndGggLSA1LCB1cmwubGVuZ3RoKSArICdfYS5tcDMnO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpbyA9IHl0ZGwodXJsLCB7IHF1YWxpdHk6ICdoaWdoZXN0YXVkaW8nLCBhZ2VudCB9KVxyXG4gICAgICAgICAgICAgICAgYXVkaW8ucGlwZShmcy5jcmVhdGVXcml0ZVN0cmVhbShmaW5hbFBhdGhBdWRpbykpXHJcbiAgICAgICAgICAgICAgICBhdWRpby5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZmluYWxQYXRoQXVkaW8pO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIGF1ZGlvLm9uKCdlcnJvcicsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGRvd25sb2FkVmlkZW9Ybnh4KHVybCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gaHR0cHMuZ2V0KHVybCwgKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBib2R5ICs9IGRhdGEudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdlbmQnLCBhc3luYygpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmlkZW9MaW5rID0gYm9keS5zcGxpdCgnaHRtbDV2aWRlb19iYXNlJylbMV0uc3BsaXQoJzxhIGhyZWY9XCInKVsxXTtcclxuICAgICAgICAgICAgICAgICAgICB2aWRlb0xpbmsgPSB2aWRlb0xpbmsuc3BsaXQoJ1wiJylbMF1cclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGF3YWl0IHRoaXMuZ2V0RmlsZUZyb21VcmwodmlkZW9MaW5rKSlcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGFzeW5jIGRvd25sb2FkVmlkZW9YdmlkZW9zKHVybCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gaHR0cHMuZ2V0KHVybCwgKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYm9keSA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBib2R5ICs9IGRhdGEudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdlbmQnLCBhc3luYygpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmlkZW9MaW5rID0gYm9keS5zcGxpdCgnXCJjb250ZW50VXJsXCI6IFwiJylbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmlkZW9MaW5rID0gdmlkZW9MaW5rLnNwbGl0KCdcIicpWzBdXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhd2FpdCB0aGlzLmdldEZpbGVGcm9tVXJsKHZpZGVvTGluaykpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBhc3luYyBnZXRGaWxlRnJvbVVybCh1cmwpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZmluYWxQYXRoID0gdGhpcy5mb2xkZXJUb29sLkJBU0VfUEFUSCArICcvJyArIHRoaXMuZm9sZGVyVG9vbC5XT1JLU1BBQ0VfRElSICsgJy9pbnB1dC8nICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNTAwMCkgKyAnLm1wNCc7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShmaW5hbFBhdGgpO1xyXG4gICAgICAgICAgICBsZXQgcHJvdG9jb2wgPSBodHRwXHJcbiAgICAgICAgICAgIGlmICh1cmwuc3BsaXQoJzonKVswXSA9PT0gJ2h0dHBzJykge1xyXG4gICAgICAgICAgICAgICAgcHJvdG9jb2wgPSBodHRwc1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBwcm90b2NvbC5nZXQodXJsLCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UucGlwZShmaWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBhZnRlciBkb3dubG9hZCBjb21wbGV0ZWQgY2xvc2UgZmlsZXN0cmVhbVxyXG4gICAgICAgICAgICAgICAgZmlsZS5vbihcImZpbmlzaFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZmluYWxQYXRoKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuZXhwb3J0IGRlZmF1bHQgVmlkZW9Eb3dubG9hZGVyVG9vbDsiXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHNCQUF5RDtBQUN6RCxrQkFBaUI7QUFDakIsZ0JBQWU7OztBQ0ZmLElBQU0sS0FBSyxRQUFRO0FBQ25CLElBQU0sRUFBRSxRQUFRLElBQUksUUFBUSxNQUFNO0FBQ2xDLElBQU0sZ0JBQWdCO0FBQ3RCLElBQU0sT0FBTyxRQUFRO0FBRXJCLElBQU0sYUFBYSxDQUFDLE9BQU8sT0FBTyxPQUFPLFFB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UyxJQUFJLEdBQUcsTUFBTSxLQUFLO0FBQUEsRUFDL0Q7QUFDQSxTQUFPLEVBQUUsT0FBTyxrQkFBa0I7QUFDdEMsQ0FBQztBQUNELHdCQUFRLE9BQU8saUJBQWlCLE9BQU0sR0FBRyxTQUFTO0FBQzlDLFFBQU0sVUFBVSxJQUFJLGtCQUFVLFVBQVU7QUFDeEMsUUFBTSxXQUFXLE1BQU0sUUFBUSxzQkFBc0IsS0FBSyxHQUFHO0FBQzdELFNBQU8sRUFBRSxNQUFNLE1BQU0sV0FBVyxTQUFTLFFBQVEsR0FBRyxNQUFNLFNBQVM7QUFDdkUsQ0FBQztBQUNELHdCQUFRLE9BQU8sU0FBUyxPQUFNLE1BQU07QUFDaEMsU0FBTyxNQUFNLFdBQVcsWUFBWTtBQUN4QyxDQUFDO0FBQ0Qsd0JBQVEsR0FBRyxRQUFRLENBQUMsTUFBTTtBQUN0QixzQkFBSSxLQUFLO0FBQ2IsQ0FBQzsiLAogICJuYW1lcyI6IFsiYXBwIiwgInBhdGgiLCAiZnMiLCAiZm9sZGVyVG9vbCIsICJmcyIsICJmb2xkZXJUb29sIiwgIm9zIiwgInBhdGgiLCAiZSJdCn0K
