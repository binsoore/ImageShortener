import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertImageSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer, { type MulterError } from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import sharp from "sharp";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to resize images
async function resizeImage(inputPath: string, outputPath: string): Promise<{ width: number; height: number }> {
  const resizedImage = await sharp(inputPath)
    .resize(1024, null, {
      withoutEnlargement: true, // Don't enlarge smaller images
      fit: 'inside' // Maintain aspect ratio
    })
    .jpeg({ quality: 85 }) // Convert to JPEG with good quality
    .toFile(outputPath);
    
  return { width: resizedImage.width || 1024, height: resizedImage.height || 512 };
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      cb(null, uploadsDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// API endpoint for uploading via JSON/base64
async function uploadFromBase64(req: Request, res: Response) {
  try {
    const { images } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    const uploadedImages = [];

    for (const imageData of images) {
      const { data, filename, mimeType } = imageData;
      
      if (!data || !filename || !mimeType) {
        continue;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(mimeType)) {
        continue;
      }

      try {
        // Decode base64 data
        const base64Data = data.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(filename) || '.jpg';
        const newFilename = `api-${uniqueSuffix}${ext}`;
        const filePath = path.join(uploadsDir, newFilename);
        
        // Write file to disk
        fs.writeFileSync(filePath, buffer);
        
        // Get image dimensions and resize if needed
        const metadata = await sharp(filePath).metadata();
        let finalWidth = metadata.width || null;
        let finalHeight = metadata.height || null;
        let finalMimeType = mimeType;
        let finalSize = buffer.length;
        
        // Resize if width is greater than 1024px
        if (metadata.width && metadata.width > 1024) {
          const resizedPath = filePath.replace(path.extname(filePath), '_resized.jpg');
          const dimensions = await resizeImage(filePath, resizedPath);
          
          // Remove original file and use resized version
          fs.unlinkSync(filePath);
          fs.renameSync(resizedPath, filePath);
          
          finalWidth = dimensions.width;
          finalHeight = dimensions.height;
          finalMimeType = 'image/jpeg';
          finalSize = fs.statSync(filePath).size;
        }
        
        // Generate short ID
        const shortId = nanoid(8);
        
        // Create image record
        const imageRecord = {
          filename: newFilename,
          originalName: filename,
          mimeType: finalMimeType,
          size: finalSize,
          width: finalWidth,
          height: finalHeight,
          shortId,
          filePath,
        };

        const image = await storage.createImage(imageRecord);
        
        // Add short URL to response
        const imageWithUrl = {
          ...image,
          shortUrl: `${req.protocol}://${req.get('host')}/i/${image.shortId}`
        };
        
        uploadedImages.push(imageWithUrl);
      } catch (error) {
        console.error('Error processing base64 image:', filename, error);
      }
    }

    if (uploadedImages.length === 0) {
      return res.status(500).json({ message: 'Failed to process any images' });
    }

    res.json({ images: uploadedImages });
  } catch (error) {
    console.error('API upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    res.json({
      id: "admin",
      email: "admin@example.com",
      firstName: "관리자",
      lastName: "",
      profileImageUrl: null
    });
  });
  
  // Upload images endpoint (form-data)
  app.post('/api/upload', upload.array('images', 10), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const uploadedImages = [];

      for (const file of files) {
        try {
          // Check if image needs resizing
          const metadata = await sharp(file.path).metadata();
          let finalWidth = metadata.width || null;
          let finalHeight = metadata.height || null;
          let finalMimeType = file.mimetype;
          let finalSize = file.size;
          
          // Resize if width is greater than 1024px
          if (metadata.width && metadata.width > 1024) {
            const resizedPath = file.path.replace(path.extname(file.path), '_resized.jpg');
            const dimensions = await resizeImage(file.path, resizedPath);
            
            // Remove original file and use resized version
            fs.unlinkSync(file.path);
            fs.renameSync(resizedPath, file.path);
            
            finalWidth = dimensions.width;
            finalHeight = dimensions.height;
            finalMimeType = 'image/jpeg';
            finalSize = fs.statSync(file.path).size;
          }
          
          // Generate short ID
          const shortId = nanoid(8);
          
          // Create image record
          const imageData = {
            filename: file.filename,
            originalName: file.originalname,
            mimeType: finalMimeType,
            size: finalSize,
            width: finalWidth,
            height: finalHeight,
            shortId,
            filePath: file.path,
          };

          const image = await storage.createImage(imageData);
          
          // Add short URL to response
          const imageWithUrl = {
            ...image,
            shortUrl: `${req.protocol}://${req.get('host')}/i/${image.shortId}`
          };
          
          uploadedImages.push(imageWithUrl);
        } catch (error) {
          console.error('Error processing file:', file.originalname, error);
          // Delete the file if processing failed
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }

      if (uploadedImages.length === 0) {
        return res.status(500).json({ message: 'Failed to process any images' });
      }

      res.json({ images: uploadedImages });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  // Upload images endpoint (JSON/base64)
  app.post('/api/upload-base64', uploadFromBase64);

  // Get all images
  app.get('/api/images', async (req, res) => {
    try {
      const images = await storage.getAllImages();
      
      // Add short URLs to all images
      const imagesWithUrls = images.map(image => ({
        ...image,
        shortUrl: `${req.protocol}://${req.get('host')}/i/${image.shortId}`
      }));
      
      res.json({ images: imagesWithUrls });
    } catch (error) {
      console.error('Error fetching images:', error);
      res.status(500).json({ message: 'Failed to fetch images' });
    }
  });

  // Serve image by short ID (redirect)
  app.get('/i/:shortId', async (req, res) => {
    try {
      const { shortId } = req.params;
      const image = await storage.getImageByShortId(shortId);
      
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Check if file exists
      if (!fs.existsSync(image.filePath)) {
        return res.status(404).json({ message: 'Image file not found' });
      }

      res.sendFile(path.resolve(image.filePath));
    } catch (error) {
      console.error('Error serving image:', error);
      res.status(500).json({ message: 'Failed to serve image' });
    }
  });

  // Get image metadata by short ID
  app.get('/api/images/:shortId', async (req, res) => {
    try {
      const { shortId } = req.params;
      const image = await storage.getImageByShortId(shortId);
      
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Add short URL to response
      const imageWithUrl = {
        ...image,
        shortUrl: `${req.protocol}://${req.get('host')}/i/${image.shortId}`
      };

      res.json({ image: imageWithUrl });
    } catch (error) {
      console.error('Error fetching image:', error);
      res.status(500).json({ message: 'Failed to fetch image' });
    }
  });

  // Delete specific image endpoint (protected)
  app.delete('/api/images/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const image = await storage.getImage(id);
      
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Delete file from disk
      if (fs.existsSync(image.filePath)) {
        fs.unlinkSync(image.filePath);
      }

      // Delete from storage
      await storage.deleteImage(id);
      
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ message: 'Failed to delete image' });
    }
  });

  // Set image expiration endpoint (protected)
  app.patch('/api/images/:id/expiration', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { days } = req.body;
      
      if (!days || days <= 0 || days > 365) {
        return res.status(400).json({ message: 'Days must be between 1 and 365' });
      }
      
      const success = await storage.setImageExpiration(id, days);
      
      if (!success) {
        return res.status(404).json({ message: 'Image not found' });
      }
      
      res.json({ message: `Image will expire in ${days} days` });
    } catch (error) {
      console.error('Error setting expiration:', error);
      res.status(500).json({ message: 'Failed to set expiration' });
    }
  });

  // Cleanup expired images endpoint (protected)
  app.post('/api/cleanup', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const deletedCount = await storage.deleteExpiredImages();
      res.json({ message: `Deleted ${deletedCount} expired images` });
    } catch (error) {
      console.error('Error cleaning up expired images:', error);
      res.status(500).json({ message: 'Failed to cleanup expired images' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
