var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  MemStorage: () => MemStorage,
  storage: () => storage
});
import fs from "fs";
var MemStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    MemStorage = class {
      users;
      usersByNum;
      images;
      currentUserId;
      currentImageId;
      constructor() {
        this.users = /* @__PURE__ */ new Map();
        this.usersByNum = /* @__PURE__ */ new Map();
        this.images = /* @__PURE__ */ new Map();
        this.currentUserId = 1;
        this.currentImageId = 1;
        this.loadExistingImages().catch(console.error);
      }
      async loadExistingImages() {
        try {
          const path4 = await import("path");
          const sharp2 = await import("sharp");
          const { nanoid: nanoid3 } = await import("nanoid");
          const uploadsDir2 = path4.join(process.cwd(), "uploads");
          if (!fs.existsSync(uploadsDir2)) {
            return;
          }
          const files = fs.readdirSync(uploadsDir2);
          const imageFiles = files.filter(
            (file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
          );
          for (const filename of imageFiles) {
            const filePath = path4.join(uploadsDir2, filename);
            const stats = fs.statSync(filePath);
            try {
              const metadata = await sharp2.default(filePath).metadata();
              const originalName = filename.includes("-") ? filename.split("-").slice(2).join("-").replace(/\.[^/.]+$/, "") + path4.extname(filename) : filename;
              const image = {
                id: this.currentImageId++,
                filename,
                originalName,
                mimeType: `image/${path4.extname(filename).slice(1).toLowerCase()}`,
                size: stats.size,
                width: metadata.width || null,
                height: metadata.height || null,
                shortId: nanoid3(8),
                filePath,
                uploadedAt: stats.birthtime,
                expiresAt: null
              };
              this.images.set(image.id, image);
            } catch (error) {
              console.error(`Error processing existing file ${filename}:`, error);
            }
          }
          if (this.images.size > 0) {
            console.log(`Loaded ${this.images.size} existing images from uploads directory`);
          }
        } catch (error) {
          console.error("Error loading existing images:", error);
        }
      }
      async getUser(id) {
        return this.users.get(id);
      }
      async upsertUser(userData) {
        const existingUser = this.users.get(userData.id);
        if (existingUser) {
          const updatedUser = {
            ...existingUser,
            ...userData,
            updatedAt: /* @__PURE__ */ new Date()
          };
          this.users.set(userData.id, updatedUser);
          return updatedUser;
        }
        const newUser = {
          ...userData,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.users.set(userData.id, newUser);
        return newUser;
      }
      async getUserByUsername(username) {
        return Array.from(this.users.values()).find(
          (user) => user.username === username
        );
      }
      async createUser(insertUser) {
        const id = this.currentUserId++;
        const user = { ...insertUser, id };
        this.users.set(id, user);
        return user;
      }
      async createImage(insertImage) {
        const id = this.currentImageId++;
        const image = {
          ...insertImage,
          id,
          width: insertImage.width ?? null,
          height: insertImage.height ?? null,
          uploadedAt: /* @__PURE__ */ new Date(),
          expiresAt: null
        };
        this.images.set(id, image);
        return image;
      }
      async getImage(id) {
        return this.images.get(id);
      }
      async getImageByShortId(shortId) {
        return Array.from(this.images.values()).find(
          (image) => image.shortId === shortId
        );
      }
      async getAllImages() {
        return Array.from(this.images.values()).sort(
          (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
        );
      }
      async deleteImage(id) {
        const image = this.images.get(id);
        if (!image) return false;
        try {
          if (fs.existsSync(image.filePath)) {
            fs.unlinkSync(image.filePath);
          }
        } catch (error) {
          console.warn(`Failed to delete file from disk: ${image.filePath}`, error);
        }
        this.images.delete(id);
        return true;
      }
      async deleteExpiredImages() {
        const now = /* @__PURE__ */ new Date();
        let deletedCount = 0;
        for (const [id, image] of Array.from(this.images.entries())) {
          if (image.expiresAt && image.expiresAt <= now) {
            try {
              if (fs.existsSync(image.filePath)) {
                fs.unlinkSync(image.filePath);
              }
            } catch (error) {
              console.warn(`Failed to delete expired file from disk: ${image.filePath}`, error);
            }
            this.images.delete(id);
            deletedCount++;
          }
        }
        return deletedCount;
      }
      async setImageExpiration(id, days) {
        const image = this.images.get(id);
        if (!image) return false;
        const expiresAt = /* @__PURE__ */ new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
        const updatedImage = { ...image, expiresAt };
        this.images.set(id, updatedImage);
        return true;
      }
    };
    storage = new MemStorage();
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
init_storage();
import { createServer } from "http";

// server/replitAuth.ts
import session from "express-session";
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
function setupAuth(app2) {
  app2.use(session({
    secret: "simple-auth-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  }));
  app2.post("/api/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      req.session.isAuthenticated = true;
      res.json({ success: true, message: "\uB85C\uADF8\uC778 \uC131\uACF5" });
    } else {
      res.status(401).json({ success: false, message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uD2C0\uB838\uC2B5\uB2C8\uB2E4" });
    }
  });
  app2.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ success: false, message: "\uB85C\uADF8\uC544\uC6C3 \uC2E4\uD328" });
      } else {
        res.json({ success: true, message: "\uB85C\uADF8\uC544\uC6C3 \uC131\uACF5" });
      }
    });
  });
  app2.get("/api/auth/status", (req, res) => {
    const isAuthenticated2 = req.session?.isAuthenticated || false;
    res.json({ isAuthenticated: isAuthenticated2 });
  });
}
var isAuthenticated = async (req, res, next) => {
  const isAuth = req.session?.isAuthenticated || false;
  if (!isAuth) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// server/routes.ts
import multer from "multer";
import path from "path";
import fs2 from "fs";
import { nanoid } from "nanoid";
import sharp from "sharp";
var uploadsDir = path.join(process.cwd(), "uploads");
if (!fs2.existsSync(uploadsDir)) {
  fs2.mkdirSync(uploadsDir, { recursive: true });
}
async function resizeImage(inputPath, outputPath) {
  const resizedImage = await sharp(inputPath).resize(1024, null, {
    withoutEnlargement: true,
    // Don't enlarge smaller images
    fit: "inside"
    // Maintain aspect ratio
  }).jpeg({ quality: 85 }).toFile(outputPath);
  return { width: resizedImage.width || 1024, height: resizedImage.height || 512 };
}
var upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 7.5 * 1024 * 1024
    // 7.5MB limit (considering base64 encoding)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});
async function uploadFromBase64(req, res) {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }
    const uploadedImages = [];
    for (const imageData of images) {
      const { data, filename, mimeType } = imageData;
      if (!data || !filename || !mimeType) {
        continue;
      }
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(mimeType)) {
        continue;
      }
      try {
        const base64Data = data.replace(/^data:image\/[a-z]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(filename) || ".jpg";
        const newFilename = `api-${uniqueSuffix}${ext}`;
        const filePath = path.join(uploadsDir, newFilename);
        fs2.writeFileSync(filePath, buffer);
        const metadata = await sharp(filePath).metadata();
        let finalWidth = metadata.width || null;
        let finalHeight = metadata.height || null;
        let finalMimeType = mimeType;
        let finalSize = buffer.length;
        if (metadata.width && metadata.width > 1024) {
          const resizedPath = filePath.replace(path.extname(filePath), "_resized.jpg");
          const dimensions = await resizeImage(filePath, resizedPath);
          fs2.unlinkSync(filePath);
          fs2.renameSync(resizedPath, filePath);
          finalWidth = dimensions.width;
          finalHeight = dimensions.height;
          finalMimeType = "image/jpeg";
          finalSize = fs2.statSync(filePath).size;
        }
        const shortId = nanoid(8);
        const imageRecord = {
          filename: newFilename,
          originalName: filename,
          mimeType: finalMimeType,
          size: finalSize,
          width: finalWidth,
          height: finalHeight,
          shortId,
          filePath
        };
        const image = await storage.createImage(imageRecord);
        const imageWithUrl = {
          ...image,
          shortUrl: `${req.protocol}://${req.get("host")}/i/${image.shortId}`
        };
        uploadedImages.push(imageWithUrl);
      } catch (error) {
        console.error("Error processing base64 image:", filename, error);
      }
    }
    if (uploadedImages.length === 0) {
      return res.status(500).json({ message: "Failed to process any images" });
    }
    res.json({ images: uploadedImages });
  } catch (error) {
    console.error("API upload error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
}
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    res.json({
      id: "admin",
      email: "admin@example.com",
      firstName: "\uAD00\uB9AC\uC790",
      lastName: "",
      profileImageUrl: null
    });
  });
  app2.post("/api/upload", upload.array("images", 10), async (req, res) => {
    try {
      const files = req.files;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const uploadedImages = [];
      for (const file of files) {
        try {
          const metadata = await sharp(file.path).metadata();
          let finalWidth = metadata.width || null;
          let finalHeight = metadata.height || null;
          let finalMimeType = file.mimetype;
          let finalSize = file.size;
          if (metadata.width && metadata.width > 1024) {
            const resizedPath = file.path.replace(path.extname(file.path), "_resized.jpg");
            const dimensions = await resizeImage(file.path, resizedPath);
            fs2.unlinkSync(file.path);
            fs2.renameSync(resizedPath, file.path);
            finalWidth = dimensions.width;
            finalHeight = dimensions.height;
            finalMimeType = "image/jpeg";
            finalSize = fs2.statSync(file.path).size;
          }
          const shortId = nanoid(8);
          const imageData = {
            filename: file.filename,
            originalName: file.originalname,
            mimeType: finalMimeType,
            size: finalSize,
            width: finalWidth,
            height: finalHeight,
            shortId,
            filePath: file.path
          };
          const image = await storage.createImage(imageData);
          const imageWithUrl = {
            ...image,
            shortUrl: `${req.protocol}://${req.get("host")}/i/${image.shortId}`
          };
          uploadedImages.push(imageWithUrl);
        } catch (error) {
          console.error("Error processing file:", file.originalname, error);
          if (fs2.existsSync(file.path)) {
            fs2.unlinkSync(file.path);
          }
        }
      }
      if (uploadedImages.length === 0) {
        return res.status(500).json({ message: "Failed to process any images" });
      }
      res.json({ images: uploadedImages });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });
  app2.post("/api/upload-base64", uploadFromBase64);
  app2.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getAllImages();
      const imagesWithUrls = images.map((image) => ({
        ...image,
        shortUrl: `${req.protocol}://${req.get("host")}/i/${image.shortId}`
      }));
      res.json({ images: imagesWithUrls });
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });
  app2.get("/i/:shortId", async (req, res) => {
    try {
      const { shortId } = req.params;
      const image = await storage.getImageByShortId(shortId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      if (!fs2.existsSync(image.filePath)) {
        return res.status(404).json({ message: "Image file not found" });
      }
      res.sendFile(path.resolve(image.filePath));
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });
  app2.get("/api/images/:shortId", async (req, res) => {
    try {
      const { shortId } = req.params;
      const image = await storage.getImageByShortId(shortId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      const imageWithUrl = {
        ...image,
        shortUrl: `${req.protocol}://${req.get("host")}/i/${image.shortId}`
      };
      res.json({ image: imageWithUrl });
    } catch (error) {
      console.error("Error fetching image:", error);
      res.status(500).json({ message: "Failed to fetch image" });
    }
  });
  app2.delete("/api/images/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }
      const success = await storage.deleteImage(id);
      if (!success) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });
  app2.patch("/api/images/:id/expiration", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { days } = req.body;
      if (!days || days <= 0 || days > 365) {
        return res.status(400).json({ message: "Days must be between 1 and 365" });
      }
      const success = await storage.setImageExpiration(id, days);
      if (!success) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ message: `Image will expire in ${days} days` });
    } catch (error) {
      console.error("Error setting expiration:", error);
      res.status(500).json({ message: "Failed to set expiration" });
    }
  });
  app2.post("/api/cleanup", isAuthenticated, async (req, res) => {
    try {
      const deletedCount = await storage.deleteExpiredImages();
      res.json({ message: `Deleted ${deletedCount} expired images` });
    } catch (error) {
      console.error("Error cleaning up expired images:", error);
      res.status(500).json({ message: "Failed to cleanup expired images" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid as nanoid2 } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false, limit: "50mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, req, res, _next) => {
    console.error("Server error:", err);
    if (err.code === "ECONNRESET" || err.code === "ECONNABORTED") {
      console.log("Client disconnected during request");
      return;
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "\uD30C\uC77C \uD06C\uAE30\uAC00 \uB108\uBB34 \uD07D\uB2C8\uB2E4. \uCD5C\uB300 10MB\uAE4C\uC9C0 \uC5C5\uB85C\uB4DC \uAC00\uB2A5\uD569\uB2C8\uB2E4." });
    }
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
    setInterval(async () => {
      try {
        const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
        const deletedCount = await storage2.deleteExpiredImages();
        if (deletedCount > 0) {
          log(`Auto cleanup: deleted ${deletedCount} expired images`);
        }
      } catch (error) {
        log(`Auto cleanup error: ${error}`);
      }
    }, 12 * 60 * 60 * 1e3);
  });
})();
