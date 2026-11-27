import { z } from 'zod';

export const DocumentCategoryEnum = z.enum([
  'IDENTITY',
  'EDUCATION',
  'EMPLOYMENT',
  'FINANCIAL',
  'INSURANCE',
  'MEDICAL',
  'LEGAL',
  'PERSONAL',
  'OTHER',
]);

export const DocumentTypeEnum = z.enum([
  'PDF',
  'IMAGE',
  'INVOICE',
  'RECEIPT',
  'WORD',
  'SPREADSHEET',
  'TEXT',
  'OTHER',
]);

export const uploadDocumentSchema = z.object({
  name: z.string().trim().min(1, 'Document name is required').max(255),
  description: z.string().trim().max(1000).optional().nullable(),
  category: DocumentCategoryEnum.default('OTHER'),
  tags: z
    .union([
      z.array(z.string().trim()),
      z.string().transform((val) =>
        val
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      ),
    ])
    .optional()
    .default([]),
  folderId: z
    .string()
    .transform((val) => (val === '' || val === 'null' ? null : val))
    .optional()
    .nullable(),
  billId: z
    .string()
    .transform((val) => (val === '' || val === 'null' ? null : val))
    .optional()
    .nullable(),
  expenseId: z
    .string()
    .transform((val) => (val === '' || val === 'null' ? null : val))
    .optional()
    .nullable(),
  subscriptionId: z
    .string()
    .transform((val) => (val === '' || val === 'null' ? null : val))
    .optional()
    .nullable(),
});

export const updateDocumentSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(255).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  category: DocumentCategoryEnum.optional(),
  tags: z
    .union([
      z.array(z.string().trim()),
      z.string().transform((val) =>
        val
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      ),
    ])
    .optional(),
  folderId: z
    .string()
    .transform((val) => (val === '' || val === 'null' ? null : val))
    .optional()
    .nullable(),
  billId: z
    .string()
    .transform((val) => (val === '' || val === 'null' ? null : val))
    .optional()
    .nullable(),
  expenseId: z
    .string()
    .transform((val) => (val === '' || val === 'null' ? null : val))
    .optional()
    .nullable(),
  subscriptionId: z
    .string()
    .transform((val) => (val === '' || val === 'null' ? null : val))
    .optional()
    .nullable(),
});

export const moveDocumentSchema = z.object({
  folderId: z
    .string()
    .transform((val) => (val === '' || val === 'null' || val === 'root' ? null : val))
    .optional()
    .nullable(),
});

export const queryDocumentSchema = z.object({
  category: DocumentCategoryEnum.optional(),
  folderId: z.string().optional(),
  search: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'name', 'size', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(100),
  color: z.string().trim().max(20).optional().default('#64748b'),
});

export const updateFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name cannot be empty').max(100).optional(),
  color: z.string().trim().max(20).optional(),
});

export type UploadDocumentDto = z.infer<typeof uploadDocumentSchema>;
export type UpdateDocumentDto = z.infer<typeof updateDocumentSchema>;
export type MoveDocumentDto = z.infer<typeof moveDocumentSchema>;
export type QueryDocumentDto = z.infer<typeof queryDocumentSchema>;
export type CreateFolderDto = z.infer<typeof createFolderSchema>;
export type UpdateFolderDto = z.infer<typeof updateFolderSchema>;
