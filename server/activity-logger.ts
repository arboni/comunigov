import { Request } from "express";
import { 
  userActivityLogs, 
  InsertUserActivityLog, 
  userActionEnum 
} from "@shared/schema";
import { db } from "./db";

/**
 * Service for logging user activities in the system
 */
export class ActivityLogger {
  /**
   * Log a user activity
   * @param userId The ID of the user performing the action
   * @param action The type of action being performed
   * @param description A human-readable description of the action
   * @param entityType The type of entity being acted upon (e.g., "meeting", "task", "user")
   * @param entityId The ID of the entity being acted upon (if applicable)
   * @param req Express request object (optional, for IP and user agent)
   * @param metadata Additional information about the action (optional)
   */
  static async log(
    userId: number, 
    action: typeof userActionEnum.enumValues[number], 
    description: string,
    entityType: string,
    entityId?: number,
    req?: Request,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const logEntry: InsertUserActivityLog = {
        userId,
        action,
        description,
        entityType,
        entityId: entityId || null,
        ipAddress: req ? this.getClientIp(req) : null,
        userAgent: req?.headers['user-agent'] || null,
        metadata: metadata || null
      };
      
      await db.insert(userActivityLogs).values(logEntry);
    } catch (error) {
      console.error("Failed to log user activity:", error);
      // Don't throw error to prevent disrupting the main application flow
    }
  }
  
  /**
   * Extract IP address from request
   */
  private static getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.socket.remoteAddress ||
      ''
    );
  }
  
  /**
   * Log a login event
   */
  static async logLogin(userId: number, req: Request): Promise<void> {
    await this.log(
      userId,
      'login',
      'User logged in',
      'user',
      userId,
      req,
      { source: req.headers.origin || req.headers.referer || 'unknown' }
    );
  }
  
  /**
   * Log a logout event
   */
  static async logLogout(userId: number, req: Request): Promise<void> {
    await this.log(
      userId,
      'logout',
      'User logged out',
      'user',
      userId,
      req
    );
  }
  
  /**
   * Log a data viewing event
   */
  static async logView(
    userId: number, 
    entityType: string, 
    entityId: number,
    description: string,
    req?: Request
  ): Promise<void> {
    await this.log(
      userId,
      'view',
      description,
      entityType,
      entityId,
      req
    );
  }
  
  /**
   * Log a creation event
   */
  static async logCreate(
    userId: number,
    entityType: string,
    entityId: number,
    description: string,
    req?: Request,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(
      userId,
      'create',
      description,
      entityType,
      entityId,
      req,
      metadata
    );
  }
  
  /**
   * Log an update event
   */
  static async logUpdate(
    userId: number,
    entityType: string,
    entityId: number,
    description: string,
    req?: Request,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(
      userId,
      'update',
      description,
      entityType,
      entityId,
      req,
      metadata
    );
  }
  
  /**
   * Log a deletion event
   */
  static async logDelete(
    userId: number,
    entityType: string,
    entityId: number,
    description: string,
    req?: Request
  ): Promise<void> {
    await this.log(
      userId,
      'delete',
      description,
      entityType,
      entityId,
      req
    );
  }
  
  /**
   * Log a communication sending event
   */
  static async logSend(
    userId: number,
    entityType: string,
    entityId: number,
    description: string,
    req?: Request,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(
      userId,
      'send',
      description,
      entityType,
      entityId,
      req,
      metadata
    );
  }

  /**
   * Log a file download event
   */
  static async logDownload(
    userId: number,
    fileType: string,
    fileId: number,
    fileName: string,
    req?: Request
  ): Promise<void> {
    await this.log(
      userId,
      'download',
      `Downloaded ${fileType}: ${fileName}`,
      fileType,
      fileId,
      req,
      { fileName }
    );
  }

  /**
   * Log a file upload event
   */
  static async logUpload(
    userId: number,
    fileType: string,
    fileId: number,
    fileName: string,
    fileSize: number,
    req?: Request
  ): Promise<void> {
    await this.log(
      userId,
      'upload',
      `Uploaded ${fileType}: ${fileName}`,
      fileType,
      fileId,
      req,
      { fileName, fileSize }
    );
  }

  /**
   * Get activity logs for a specific user
   * @param userId The ID of the user to get logs for
   * @param limit Maximum number of logs to return (for pagination)
   * @param offset Offset for pagination
   * @param filters Optional filters (action, entityType, etc.)
   */
  static async getUserActivityLogs(
    userId: number,
    limit: number = 50,
    offset: number = 0,
    filters?: {
      action?: typeof userActionEnum.enumValues[number];
      entityType?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ) {
    let query = db.select().from(userActivityLogs).where(
      (logs, { eq }) => eq(logs.userId, userId)
    );

    // Apply filters if provided
    if (filters) {
      if (filters.action) {
        query = query.where((logs, { eq }) => eq(logs.action, filters.action!));
      }
      
      if (filters.entityType) {
        query = query.where((logs, { eq }) => eq(logs.entityType, filters.entityType!));
      }
      
      if (filters.fromDate) {
        query = query.where((logs, { gte }) => gte(logs.timestamp, filters.fromDate!));
      }
      
      if (filters.toDate) {
        query = query.where((logs, { lte }) => lte(logs.timestamp, filters.toDate!));
      }
    }

    // Get total count for pagination info
    const countResult = await db.select({ count: sql`count(*)` }).from(userActivityLogs)
      .where((logs, { eq }) => eq(logs.userId, userId));
    
    const total = Number(countResult[0].count);
    
    // Get paginated results with sorting
    const logs = await query
      .orderBy((logs, { desc }) => [desc(logs.timestamp)])
      .limit(limit)
      .offset(offset);
    
    return {
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total
      }
    };
  }

  /**
   * Get all activity logs in the system
   * @param limit Maximum number of logs to return (for pagination)
   * @param offset Offset for pagination
   * @param filters Optional filters (userId, action, entityType, etc.)
   */
  static async getAllActivityLogs(
    limit: number = 50,
    offset: number = 0,
    filters?: {
      userId?: number;
      action?: typeof userActionEnum.enumValues[number];
      entityType?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ) {
    let query = db.select().from(userActivityLogs);

    // Apply filters if provided
    if (filters) {
      if (filters.userId) {
        query = query.where((logs, { eq }) => eq(logs.userId, filters.userId!));
      }
      
      if (filters.action) {
        query = query.where((logs, { eq }) => eq(logs.action, filters.action!));
      }
      
      if (filters.entityType) {
        query = query.where((logs, { eq }) => eq(logs.entityType, filters.entityType!));
      }
      
      if (filters.fromDate) {
        query = query.where((logs, { gte }) => gte(logs.timestamp, filters.fromDate!));
      }
      
      if (filters.toDate) {
        query = query.where((logs, { lte }) => lte(logs.timestamp, filters.toDate!));
      }
    }

    // Get total count for pagination info
    const countResult = await db.select({ count: sql`count(*)` }).from(userActivityLogs);
    const total = Number(countResult[0].count);
    
    // Get paginated results with sorting
    const logs = await query
      .orderBy((logs, { desc }) => [desc(logs.timestamp)])
      .limit(limit)
      .offset(offset);
    
    // Get associated user information for each log
    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, log.userId),
          columns: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            role: true,
            entityId: true
          }
        });
        
        return {
          ...log,
          user
        };
      })
    );
    
    return {
      logs: logsWithUsers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total
      }
    };
  }
}