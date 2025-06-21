import { users, images, type User, type InsertUser, type Image, type InsertImage, type UpsertUser } from "@shared/schema";
import fs from "fs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createImage(image: InsertImage): Promise<Image>;
  getImage(id: number): Promise<Image | undefined>;
  getImageByShortId(shortId: string): Promise<Image | undefined>;
  getAllImages(): Promise<Image[]>;
  deleteImage(id: number): Promise<boolean>;
  deleteExpiredImages(): Promise<number>;
  setImageExpiration(id: number, days: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private usersByNum: Map<number, User>;
  private images: Map<number, Image>;
  private currentUserId: number;
  private currentImageId: number;

  constructor() {
    this.users = new Map();
    this.usersByNum = new Map();
    this.images = new Map();
    this.currentUserId = 1;
    this.currentImageId = 1;
    
    // Load existing images from uploads directory on startup
    this.loadExistingImages().catch(console.error);
  }

  private async loadExistingImages() {
    try {
      const path = await import('path');
      const sharp = await import('sharp');
      const { nanoid } = await import('nanoid');
      
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        return;
      }

      const files = fs.readdirSync(uploadsDir);
      const imageFiles = files.filter((file: string) => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      );

      for (const filename of imageFiles) {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        
        try {
          const metadata = await sharp.default(filePath).metadata();
          
          // Extract original name from filename pattern
          const originalName = filename.includes('-') ? 
            filename.split('-').slice(2).join('-').replace(/\.[^/.]+$/, '') + path.extname(filename) : 
            filename;
          
          const image: Image = {
            id: this.currentImageId++,
            filename,
            originalName,
            mimeType: `image/${path.extname(filename).slice(1).toLowerCase()}`,
            size: stats.size,
            width: metadata.width || null,
            height: metadata.height || null,
            shortId: nanoid(8),
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
      console.error('Error loading existing images:', error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      const updatedUser = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    }

    const newUser: User = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, newUser);
    return newUser;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = this.currentImageId++;
    const image: Image = { 
      ...insertImage, 
      id,
      width: insertImage.width ?? null,
      height: insertImage.height ?? null,
      uploadedAt: new Date(),
      expiresAt: null
    };
    this.images.set(id, image);
    return image;
  }

  async getImage(id: number): Promise<Image | undefined> {
    return this.images.get(id);
  }

  async getImageByShortId(shortId: string): Promise<Image | undefined> {
    return Array.from(this.images.values()).find(
      (image) => image.shortId === shortId,
    );
  }

  async getAllImages(): Promise<Image[]> {
    return Array.from(this.images.values()).sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  async deleteImage(id: number): Promise<boolean> {
    return this.images.delete(id);
  }

  async deleteExpiredImages(): Promise<number> {
    const now = new Date();
    let deletedCount = 0;
    
    for (const [id, image] of Array.from(this.images.entries())) {
      if (image.expiresAt && image.expiresAt <= now) {
        // Delete file from disk
        if (fs.existsSync(image.filePath)) {
          fs.unlinkSync(image.filePath);
        }
        this.images.delete(id);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  async setImageExpiration(id: number, days: number): Promise<boolean> {
    const image = this.images.get(id);
    if (!image) return false;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    
    const updatedImage = { ...image, expiresAt };
    this.images.set(id, updatedImage);
    return true;
  }
}

export const storage = new MemStorage();
