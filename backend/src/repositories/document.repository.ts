import { prisma } from '../config/database';
import {
  Document,
  Folder,
  Prisma,
  DocumentCategory,
  DocumentType,
} from '@prisma/client';
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  QueryDocumentDto,
  CreateFolderDto,
  UpdateFolderDto,
} from '../schemas/document.schema';

export interface VaultStats {
  totalDocuments: number;
  totalSizeBytes: number;
  categoryBreakdown: {
    category: DocumentCategory;
    count: number;
    sizeBytes: number;
  }[];
}

export interface FolderWithCount extends Folder {
  documentCount: number;
}

export class DocumentRepository {
  async findMany(
    userId: string,
    query: QueryDocumentDto
  ): Promise<{ documents: Document[]; total: number }> {
    const where: Prisma.DocumentWhereInput = {
      userId,
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.folderId !== undefined) {
      if (query.folderId === 'root' || query.folderId === 'null') {
        where.folderId = null;
      } else {
        where.folderId = query.folderId;
      }
    }

    if (query.tag) {
      where.tags = { has: query.tag.toLowerCase() };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { originalName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          folder: { select: { id: true, name: true, color: true } },
          bill: { select: { id: true, title: true, amount: true } },
          expense: { select: { id: true, title: true, amount: true } },
          subscription: { select: { id: true, name: true, amount: true } },
        },
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip,
        take,
      }),
      prisma.document.count({ where }),
    ]);

    return { documents, total };
  }

  async findById(userId: string, id: string): Promise<Document | null> {
    return prisma.document.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        folder: { select: { id: true, name: true, color: true } },
        bill: { select: { id: true, title: true, amount: true } },
        expense: { select: { id: true, title: true, amount: true } },
        subscription: { select: { id: true, name: true, amount: true } },
      },
    });
  }

  async create(
    userId: string,
    dto: UploadDocumentDto,
    fileInfo: {
      originalName: string;
      mimeType: string;
      size: number;
      storagePath: string;
      documentType: DocumentType;
    }
  ): Promise<Document> {
    return prisma.document.create({
      data: {
        userId,
        name: dto.name,
        originalName: fileInfo.originalName,
        description: dto.description ?? null,
        mimeType: fileInfo.mimeType,
        size: fileInfo.size,
        storagePath: fileInfo.storagePath,
        documentType: fileInfo.documentType,
        category: dto.category,
        tags: dto.tags ?? [],
        folderId: dto.folderId ?? null,
        billId: dto.billId ?? null,
        expenseId: dto.expenseId ?? null,
        subscriptionId: dto.subscriptionId ?? null,
      },
      include: {
        folder: true,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateDocumentDto
  ): Promise<Document | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    const data: Prisma.DocumentUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.folderId !== undefined) {
      data.folder = dto.folderId ? { connect: { id: dto.folderId } } : { disconnect: true };
    }
    if (dto.billId !== undefined) {
      data.bill = dto.billId ? { connect: { id: dto.billId } } : { disconnect: true };
    }
    if (dto.expenseId !== undefined) {
      data.expense = dto.expenseId ? { connect: { id: dto.expenseId } } : { disconnect: true };
    }
    if (dto.subscriptionId !== undefined) {
      data.subscription = dto.subscriptionId
        ? { connect: { id: dto.subscriptionId } }
        : { disconnect: true };
    }

    return prisma.document.update({
      where: { id },
      data,
      include: {
        folder: true,
        bill: { select: { id: true, title: true } },
        expense: { select: { id: true, title: true } },
        subscription: { select: { id: true, name: true } },
      },
    });
  }

  async moveToFolder(
    userId: string,
    id: string,
    folderId: string | null
  ): Promise<Document | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    return prisma.document.update({
      where: { id },
      data: {
        folderId,
      },
    });
  }

  async delete(userId: string, id: string): Promise<Document | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;

    return prisma.document.delete({
      where: { id },
    });
  }

  async getVaultStats(userId: string): Promise<VaultStats> {
    const documents = await prisma.document.findMany({
      where: { userId },
      select: {
        size: true,
        category: true,
      },
    });

    const totalDocuments = documents.length;
    const totalSizeBytes = documents.reduce((sum, d) => sum + d.size, 0);

    const catMap = new Map<DocumentCategory, { count: number; sizeBytes: number }>();
    for (const d of documents) {
      const prev = catMap.get(d.category) || { count: 0, sizeBytes: 0 };
      catMap.set(d.category, {
        count: prev.count + 1,
        sizeBytes: prev.sizeBytes + d.size,
      });
    }

    const categoryBreakdown = Array.from(catMap.entries()).map(([category, val]) => ({
      category,
      count: val.count,
      sizeBytes: val.sizeBytes,
    }));

    return {
      totalDocuments,
      totalSizeBytes,
      categoryBreakdown,
    };
  }

  // --- Folder Management ---

  async findFolders(userId: string): Promise<FolderWithCount[]> {
    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return folders.map((f) => ({
      id: f.id,
      userId: f.userId,
      name: f.name,
      color: f.color,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      documentCount: f._count.documents,
    }));
  }

  async findFolderById(userId: string, id: string): Promise<Folder | null> {
    return prisma.folder.findFirst({
      where: { id, userId },
    });
  }

  async findFolderByName(userId: string, name: string): Promise<Folder | null> {
    return prisma.folder.findFirst({
      where: {
        userId,
        name: { equals: name, mode: 'insensitive' },
      },
    });
  }

  async createFolder(userId: string, dto: CreateFolderDto): Promise<Folder> {
    return prisma.folder.create({
      data: {
        userId,
        name: dto.name,
        color: dto.color ?? '#64748b',
      },
    });
  }

  async updateFolder(
    userId: string,
    id: string,
    dto: UpdateFolderDto
  ): Promise<Folder | null> {
    const existing = await this.findFolderById(userId, id);
    if (!existing) return null;

    const data: Prisma.FolderUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.color !== undefined) data.color = dto.color;

    return prisma.folder.update({
      where: { id },
      data,
    });
  }

  async deleteFolder(userId: string, id: string): Promise<Folder | null> {
    const existing = await this.findFolderById(userId, id);
    if (!existing) return null;

    // Safe deletion: move documents to root so documents are NEVER silently deleted!
    await prisma.document.updateMany({
      where: { folderId: id, userId },
      data: { folderId: null },
    });

    return prisma.folder.delete({
      where: { id },
    });
  }

  // --- Linked Records Ownership Verification ---

  async verifyBillOwnership(userId: string, billId: string): Promise<boolean> {
    const bill = await prisma.bill.findFirst({
      where: { id: billId, userId },
      select: { id: true },
    });
    return Boolean(bill);
  }

  async verifyExpenseOwnership(userId: string, expenseId: string): Promise<boolean> {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, userId },
      select: { id: true },
    });
    return Boolean(expense);
  }

  async verifySubscriptionOwnership(
    userId: string,
    subscriptionId: string
  ): Promise<boolean> {
    const sub = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
      select: { id: true },
    });
    return Boolean(sub);
  }
}

export const documentRepository = new DocumentRepository();
