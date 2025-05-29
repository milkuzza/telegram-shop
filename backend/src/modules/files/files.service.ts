import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class FilesService {
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = path.join(process.cwd(), 'uploads');
    this.baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder?: string): Promise<{
    filename: string;
    originalName: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
  }> {
    const folderPath = folder ? path.join(this.uploadPath, folder) : this.uploadPath;
    
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Move file to correct folder if needed
    const finalPath = path.join(folderPath, file.filename);
    if (file.path !== finalPath) {
      fs.renameSync(file.path, finalPath);
    }

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined;
    if (this.isImage(file.mimetype)) {
      thumbnailUrl = await this.generateThumbnail(finalPath, folder);
    }

    const url = this.getFileUrl(file.filename, folder);

    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url,
      thumbnailUrl,
    };
  }

  async uploadMultipleFiles(files: Express.Multer.File[], folder?: string): Promise<Array<{
    filename: string;
    originalName: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
  }>> {
    const results = [];
    
    for (const file of files) {
      const result = await this.uploadFile(file, folder);
      results.push(result);
    }

    return results;
  }

  async deleteFile(filename: string, folder?: string): Promise<void> {
    const filePath = folder 
      ? path.join(this.uploadPath, folder, filename)
      : path.join(this.uploadPath, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    fs.unlinkSync(filePath);

    // Also delete thumbnail if exists
    const thumbnailPath = this.getThumbnailPath(filePath);
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
  }

  async getFile(filename: string, folder?: string): Promise<{
    path: string;
    mimetype: string;
    size: number;
  }> {
    const filePath = folder 
      ? path.join(this.uploadPath, folder, filename)
      : path.join(this.uploadPath, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const stats = fs.statSync(filePath);
    const mimetype = this.getMimeType(path.extname(filename));

    return {
      path: filePath,
      mimetype,
      size: stats.size,
    };
  }

  private async generateThumbnail(filePath: string, folder?: string): Promise<string> {
    const ext = path.extname(filePath);
    const basename = path.basename(filePath, ext);
    const thumbnailFilename = `${basename}_thumb${ext}`;
    const thumbnailPath = this.getThumbnailPath(filePath);

    try {
      await sharp(filePath)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      return this.getFileUrl(thumbnailFilename, folder);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return undefined;
    }
  }

  private getThumbnailPath(originalPath: string): string {
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);
    const dir = path.dirname(originalPath);
    return path.join(dir, `${basename}_thumb${ext}`);
  }

  private getFileUrl(filename: string, folder?: string): string {
    const relativePath = folder ? `${folder}/${filename}` : filename;
    return `${this.baseUrl}/uploads/${relativePath}`;
  }

  private isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  async getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    imageFiles: number;
    documentFiles: number;
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      imageFiles: 0,
      documentFiles: 0,
    };

    const scanDirectory = (dirPath: string) => {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileStat = fs.statSync(filePath);
        
        if (fileStat.isDirectory()) {
          scanDirectory(filePath);
        } else {
          stats.totalFiles++;
          stats.totalSize += fileStat.size;
          
          const ext = path.extname(file).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
            stats.imageFiles++;
          } else if (['.pdf', '.doc', '.docx'].includes(ext)) {
            stats.documentFiles++;
          }
        }
      }
    };

    if (fs.existsSync(this.uploadPath)) {
      scanDirectory(this.uploadPath);
    }

    return stats;
  }
}
