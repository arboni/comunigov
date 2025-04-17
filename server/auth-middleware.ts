import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { eq, and, or, inArray } from 'drizzle-orm';
import { 
  meetings, 
  subjects,
  tasks,
  meetingAttendees,
  userRoleEnum,
  users,
  entities,
} from '@shared/schema';
import { ActivityLogger } from './activity-logger';

/**
 * Middleware to check if a user is authenticated
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

/**
 * Middleware to check if a user is a master implementer
 */
export function isMasterImplementer(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user?.role !== 'master_implementer') {
    ActivityLogger.log(
      req.user!.id,
      'view',
      'Access denied - Insufficient permissions',
      'system',
      undefined,
      req,
      { requiredRole: 'master_implementer', userRole: req.user?.role }
    );
    return res.status(403).json({ message: 'Forbidden: Requires master implementer role' });
  }

  next();
}

/**
 * Middleware to check if a user is an entity head
 */
export function isEntityHead(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user?.role !== 'master_implementer' && req.user?.role !== 'entity_head') {
    ActivityLogger.log(
      req.user!.id,
      'view',
      'Access denied - Insufficient permissions',
      'system',
      undefined,
      req,
      { requiredRole: 'entity_head', userRole: req.user?.role }
    );
    return res.status(403).json({ message: 'Forbidden: Requires entity head role or higher' });
  }

  next();
}

/**
 * Middleware to check if a user has access to a specific entity
 */
export async function hasEntityAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const entityId = parseInt(req.params.entityId || req.body.entityId);
  
  if (isNaN(entityId)) {
    return res.status(400).json({ message: 'Invalid entity ID' });
  }

  // Master implementers have access to all entities
  if (req.user?.role === 'master_implementer') {
    return next();
  }

  // Entity heads and members can only access their own entity
  if (req.user?.entityId !== entityId) {
    ActivityLogger.log(
      req.user!.id,
      'view',
      `Access denied to entity ${entityId}`,
      'entity',
      entityId,
      req,
      { userEntityId: req.user?.entityId }
    );
    return res.status(403).json({ message: 'Forbidden: You do not have access to this entity' });
  }

  next();
}

/**
 * Middleware to check if a user has access to a specific subject
 */
export async function hasSubjectAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const subjectId = parseInt(req.params.subjectId || req.body.subjectId);
  
  if (isNaN(subjectId)) {
    return res.status(400).json({ message: 'Invalid subject ID' });
  }

  // Master implementers have access to all subjects
  if (req.user?.role === 'master_implementer') {
    return next();
  }

  // Entity heads can access subjects created by users in their entity
  if (req.user?.role === 'entity_head') {
    const subjectAccess = await db.query.subjects.findFirst({
      where: (subjects, { eq, or, and }) => {
        const userInMyEntity = and(
          eq(users.entityId, req.user!.entityId!),
          eq(subjects.createdBy, users.id)
        );
        
        return or(
          eq(subjects.createdBy, req.user!.id),
          userInMyEntity
        );
      },
      with: {
        creator: true
      }
    });

    if (subjectAccess) {
      return next();
    }
  } else {
    // Regular members can only access subjects they created
    const subject = await db.query.subjects.findFirst({
      where: (subjects, { and, eq }) => 
        and(
          eq(subjects.id, subjectId),
          eq(subjects.createdBy, req.user!.id)
        )
    });

    if (subject) {
      return next();
    }

    // Or subjects where they have a task assigned
    const taskInSubject = await db.query.tasks.findFirst({
      where: (tasks, { and, eq }) => 
        and(
          eq(tasks.subjectId, subjectId),
          eq(tasks.isRegisteredUser, true),
          eq(tasks.assignedToUserId, req.user!.id)
        )
    });

    if (taskInSubject) {
      return next();
    }
  }

  ActivityLogger.log(
    req.user!.id,
    'view',
    `Access denied to subject ${subjectId}`,
    'subject',
    subjectId,
    req
  );
  
  return res.status(403).json({ message: 'Forbidden: You do not have access to this subject' });
}

/**
 * Middleware to check if a user has access to a specific meeting
 */
export async function hasMeetingAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const meetingId = parseInt(req.params.meetingId || req.body.meetingId);
  
  if (isNaN(meetingId)) {
    return res.status(400).json({ message: 'Invalid meeting ID' });
  }

  // Master implementers have access to all meetings
  if (req.user?.role === 'master_implementer') {
    return next();
  }
  
  // Check if user created the meeting
  const meeting = await db.query.meetings.findFirst({
    where: (meetings, { and, eq }) => 
      and(
        eq(meetings.id, meetingId),
        eq(meetings.createdBy, req.user!.id)
      )
  });
  
  if (meeting) {
    return next();
  }

  // Check if user is an attendee
  const isAttendee = await db.query.meetingAttendees.findFirst({
    where: (attendees, { and, eq }) => 
      and(
        eq(attendees.meetingId, meetingId),
        eq(attendees.userId, req.user!.id)
      )
  });
  
  if (isAttendee) {
    return next();
  }
  
  // Entity heads can access meetings for their entity
  if (req.user?.role === 'entity_head' && req.user?.entityId) {
    const entityMeeting = await db.query.meetings.findFirst({
      where: (meetings, { and, eq }) => 
        and(
          eq(meetings.id, meetingId),
          eq(users.id, meetings.createdBy),
          eq(users.entityId, req.user!.entityId!)
        ),
      with: {
        creator: true
      }
    });
    
    if (entityMeeting) {
      return next();
    }
  }

  ActivityLogger.log(
    req.user!.id,
    'view',
    `Access denied to meeting ${meetingId}`,
    'meeting',
    meetingId,
    req
  );
  
  return res.status(403).json({ message: 'Forbidden: You do not have access to this meeting' });
}

/**
 * Middleware to check if a user has access to a specific task
 */
export async function hasTaskAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const taskId = parseInt(req.params.taskId || req.body.taskId);
  
  if (isNaN(taskId)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  // Master implementers have access to all tasks
  if (req.user?.role === 'master_implementer') {
    return next();
  }

  // Check if user created the task
  const task = await db.query.tasks.findFirst({
    where: (tasks, { and, eq }) => 
      and(
        eq(tasks.id, taskId),
        eq(tasks.createdBy, req.user!.id)
      )
  });
  
  if (task) {
    return next();
  }

  // Check if user is assigned to the task
  const assignedTask = await db.query.tasks.findFirst({
    where: (tasks, { and, eq }) => 
      and(
        eq(tasks.id, taskId),
        eq(tasks.isRegisteredUser, true),
        eq(tasks.assignedToUserId, req.user!.id)
      )
  });
  
  if (assignedTask) {
    return next();
  }
  
  // Entity heads can access tasks for their entity
  if (req.user?.role === 'entity_head' && req.user?.entityId) {
    const entityTask = await db.query.tasks.findFirst({
      where: (tasks, { and, eq, or }) => 
        and(
          eq(tasks.id, taskId),
          or(
            eq(tasks.entityId, req.user!.entityId!),
            and(
              eq(users.id, tasks.createdBy),
              eq(users.entityId, req.user!.entityId!)
            )
          )
        ),
      with: {
        creator: true
      }
    });
    
    if (entityTask) {
      return next();
    }
  }

  ActivityLogger.log(
    req.user!.id,
    'view',
    `Access denied to task ${taskId}`,
    'task',
    taskId,
    req
  );
  
  return res.status(403).json({ message: 'Forbidden: You do not have access to this task' });
}

/**
 * Middleware to check if a user has access to analytics
 * Only master implementers and entity heads can access analytics
 */
export function hasAnalyticsAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user?.role !== 'master_implementer' && req.user?.role !== 'entity_head') {
    ActivityLogger.log(
      req.user!.id,
      'view',
      'Access denied to analytics',
      'analytics',
      undefined,
      req,
      { userRole: req.user?.role }
    );
    return res.status(403).json({ message: 'Forbidden: Requires entity head role or higher to access analytics' });
  }

  next();
}