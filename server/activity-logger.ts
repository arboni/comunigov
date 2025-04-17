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
}