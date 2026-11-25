import { prisma } from '../config/database';
import { Reminder, Prisma } from '@prisma/client';
import { CreateReminderDto, UpdateReminderDto, QueryReminderDto } from '../schemas/reminder.schema';

export class ReminderRepository {
  async findMany(
    userId: string,
    query: QueryReminderDto
  ): Promise<{ reminders: Reminder[]; total: number }> {
    const where: Prisma.ReminderWhereInput = {
      userId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.startDate || query.endDate) {
      where.dueDate = {};
      if (query.startDate) {
        where.dueDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.dueDate.lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        skip,
        take,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
      }),
      prisma.reminder.count({ where }),
    ]);

    return { reminders, total };
  }

  async findById(userId: string, id: string): Promise<Reminder | null> {
    return prisma.reminder.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async create(
    userId: string,
    data: CreateReminderDto,
    parentId?: string
  ): Promise<Reminder> {
    return prisma.reminder.create({
      data: {
        userId,
        title: data.title,
        description: data.description ?? null,
        dueDate: new Date(data.dueDate),
        priority: data.priority,
        recurrenceType: data.recurrenceType,
        recurrenceValue: data.recurrenceValue ?? null,
        notifyBefore: data.notifyBefore,
        parentId: parentId ?? null,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: UpdateReminderDto
  ): Promise<Reminder | null> {
    // Ensure ownership before update
    const existing = await this.findById(userId, id);
    if (!existing) {
      return null;
    }

    const updateData: Prisma.ReminderUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.recurrenceType !== undefined) updateData.recurrenceType = data.recurrenceType;
    if (data.recurrenceValue !== undefined) updateData.recurrenceValue = data.recurrenceValue;
    if (data.notifyBefore !== undefined) updateData.notifyBefore = data.notifyBefore;

    return prisma.reminder.update({
      where: { id },
      data: updateData,
    });
  }

  async complete(
    userId: string,
    id: string,
    completedAt: Date = new Date()
  ): Promise<Reminder | null> {
    const existing = await this.findById(userId, id);
    if (!existing) {
      return null;
    }

    return prisma.reminder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt,
      },
    });
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const existing = await this.findById(userId, id);
    if (!existing) {
      return false;
    }

    await prisma.reminder.delete({
      where: { id },
    });

    return true;
  }
}

export const reminderRepository = new ReminderRepository();
