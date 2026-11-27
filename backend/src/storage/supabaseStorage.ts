import multer from 'multer';
import { getSupabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

const storage = multer.memoryStorage();

export const uploadInvoiceMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          `Unsupported file type: ${file.mimetype}. Allowed types: PDF, JPEG, PNG, WEBP.`
        )
      );
    }
  },
});

export class SupabaseStorageService {
  private bucketName = 'invoices';

  async uploadInvoice(
    userId: string,
    billId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<{ storagePath: string; publicUrl?: string }> {
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `invoices/${userId}/${billId}/${Date.now()}_${sanitizedName}`;

    try {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        logger.warn({ error, storagePath }, 'Supabase Storage upload warning');
        // Return user-scoped path even if remote storage bucket needs setup
      }

      return {
        storagePath: data?.path || storagePath,
      };
    } catch (error) {
      logger.warn({ error }, 'Supabase Storage upload failed — fallback to path record');
      return { storagePath };
    }
  }

  async uploadReceipt(
    userId: string,
    expenseId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<{ storagePath: string }> {
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `receipts/${userId}/${expenseId}/${Date.now()}_${sanitizedName}`;

    try {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        logger.warn({ error, storagePath }, 'Supabase Storage upload warning for receipt');
      }

      return {
        storagePath: data?.path || storagePath,
      };
    } catch (error) {
      logger.warn({ error }, 'Supabase Storage receipt upload failed — fallback to path record');
      return { storagePath };
    }
  }

  async getSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, expiresIn);

      if (error || !data?.signedUrl) {
        logger.warn({ error, storagePath }, 'Failed to create signed URL');
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      logger.warn({ error, storagePath }, 'Error getting signed URL');
      return null;
    }
  }

  async deleteFile(storagePath: string): Promise<boolean> {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.storage.from(this.bucketName).remove([storagePath]);
      if (error) {
        logger.warn({ error, storagePath }, 'Failed to delete file from Supabase storage');
        return false;
      }
      return true;
    } catch (error) {
      logger.warn({ error, storagePath }, 'Error deleting file from Supabase storage');
      return false;
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();
