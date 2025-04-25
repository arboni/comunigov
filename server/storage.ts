import { 
  User, InsertUser, 
  Entity, InsertEntity,
  Meeting, InsertMeeting,
  MeetingAttendee, InsertMeetingAttendee,
  MeetingDocument, InsertMeetingDocument,
  MeetingReaction, InsertMeetingReaction,
  Subject, InsertSubject,
  SubjectEntity, InsertSubjectEntity,
  Task, InsertTask,
  TaskComment, InsertTaskComment,
  Communication, InsertCommunication,
  CommunicationRecipient, InsertCommunicationRecipient,
  CommunicationFile, InsertCommunicationFile,
  PublicHearing, InsertPublicHearing,
  PublicHearingFile, InsertPublicHearingFile,
  AchievementBadge, InsertAchievementBadge,
  UserBadge, InsertUserBadge,
  UserWithEntity,
  MeetingWithAttendees,
  MeetingWithDocuments,
  MeetingWithReactions,
  MeetingWithSubject,
  MeetingWithAttendeesAndSubject,
  MeetingWithAttendeesAndDocuments,
  MeetingWithAttendeesAndReactions,
  MeetingWithAll,
  TaskWithAssignee,
  CommunicationWithRecipients,
  CommunicationWithFiles,
  CommunicationWithRecipientsAndFiles,
  PublicHearingWithEntity,
  PublicHearingWithFiles,
  PublicHearingWithEntityAndFiles,
  UserWithBadges,
  users, entities, meetings, meetingAttendees, meetingDocuments, meetingReactions, subjects, subjectEntities,
  tasks, taskComments, communications, communicationRecipients, communicationFiles, publicHearings, publicHearingFiles,
  achievementBadges, userBadges
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq, and, inArray, isNull, or, gt, desc, sql, ne } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Admin operations
  truncateCommunicationsAndFiles(): Promise<{ success: boolean; message: string; tablesAffected: string[] }>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserWithEntity(id: number): Promise<UserWithEntity | undefined>;
  getUsersByEntityId(entityId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Entities
  getEntity(id: number): Promise<Entity | undefined>;
  getEntityByName(name: string): Promise<Entity | undefined>;
  createEntity(entity: InsertEntity): Promise<Entity>;
  updateEntity(id: number, entityData: Partial<Entity>): Promise<Entity | undefined>;
  getAllEntities(): Promise<Entity[]>;
  
  // Meetings
  getMeeting(id: number): Promise<Meeting | undefined>;
  getMeetingWithAttendees(id: number): Promise<MeetingWithAttendees | undefined>;
  getMeetingWithSubject(id: number): Promise<MeetingWithSubject | undefined>;
  getMeetingWithAttendeesAndSubject(id: number): Promise<MeetingWithAttendeesAndSubject | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meetingData: Partial<Meeting>): Promise<Meeting | undefined>;
  getAllMeetings(): Promise<Meeting[]>;
  getUpcomingMeetings(): Promise<Meeting[]>;
  getMeetingsForUsers(userIds: number[]): Promise<Meeting[]>;
  getUpcomingMeetingsForUsers(userIds: number[]): Promise<Meeting[]>;
  
  // Meeting Attendees
  getMeetingAttendee(id: number): Promise<MeetingAttendee | undefined>;
  getMeetingAttendeeByMeetingAndUser(meetingId: number, userId: number): Promise<MeetingAttendee | undefined>;
  createMeetingAttendee(attendee: InsertMeetingAttendee): Promise<MeetingAttendee>;
  updateMeetingAttendee(id: number, attendeeData: Partial<MeetingAttendee>): Promise<MeetingAttendee | undefined>;
  getMeetingAttendeesByMeetingId(meetingId: number): Promise<MeetingAttendee[]>;
  
  // Meeting Documents
  getMeetingDocument(id: number): Promise<MeetingDocument | undefined>;
  createMeetingDocument(document: InsertMeetingDocument): Promise<MeetingDocument>;
  getMeetingDocumentsByMeetingId(meetingId: number): Promise<MeetingDocument[]>;
  getMeetingWithDocuments(id: number): Promise<MeetingWithDocuments | undefined>;
  getMeetingWithAttendeesAndDocuments(id: number): Promise<MeetingWithAttendeesAndDocuments | undefined>;
  getMeetingWithAll(id: number): Promise<MeetingWithAll | undefined>;
  
  // Meeting Reactions
  getMeetingReaction(id: number): Promise<MeetingReaction | undefined>;
  getMeetingReactionByMeetingAndUser(meetingId: number, userId: number, emoji: string): Promise<MeetingReaction | undefined>;
  createMeetingReaction(reaction: InsertMeetingReaction): Promise<MeetingReaction>;
  deleteMeetingReaction(id: number): Promise<boolean>;
  getMeetingReactionsByMeetingId(meetingId: number): Promise<MeetingReaction[]>;
  getMeetingWithReactions(id: number): Promise<MeetingWithReactions | undefined>;
  getMeetingWithAttendeesAndReactions(id: number): Promise<MeetingWithAttendeesAndReactions | undefined>;
  
  // Subjects
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subjectData: Partial<Subject>): Promise<Subject | undefined>;
  getAllSubjects(): Promise<Subject[]>;
  getAllSubjectsWithCreators(): Promise<(Subject & { creatorName?: string })[]>;
  getSubjectsByCreator(userId: number): Promise<Subject[]>;
  
  // Subject-Entity relationships
  createSubjectEntity(subjectEntity: InsertSubjectEntity): Promise<SubjectEntity>;
  getSubjectEntitiesBySubjectId(subjectId: number): Promise<SubjectEntity[]>;
  getSubjectEntitiesByEntityId(entityId: number): Promise<SubjectEntity[]>;
  deleteSubjectEntity(id: number): Promise<boolean>;
  deleteSubjectEntityByIds(subjectId: number, entityId: number): Promise<boolean>;
  
  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTaskWithAssignee(id: number): Promise<TaskWithAssignee | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getTasksByUserId(userId: number): Promise<Task[]>;
  getTasksBySubject(subjectId: number): Promise<Task[]>;
  getUsersForSubjectTasks(subjectId: number): Promise<User[]>;
  getTasksByMeeting(meetingId: number): Promise<Task[]>;
  getTasksByEntity(entityId: number): Promise<Task[]>;
  
  // Task Comments
  getTaskComment(id: number): Promise<TaskComment | undefined>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  getTaskCommentsByTaskId(taskId: number): Promise<TaskComment[]>;
  
  // Communications
  getCommunication(id: number): Promise<Communication | undefined>;
  getCommunicationWithRecipients(id: number): Promise<CommunicationWithRecipients | undefined>;
  getCommunicationWithFiles(id: number): Promise<CommunicationWithFiles | undefined>;
  getCommunicationWithRecipientsAndFiles(id: number): Promise<CommunicationWithRecipientsAndFiles | undefined>;
  createCommunication(communication: InsertCommunication): Promise<Communication>;
  updateCommunication(id: number, communicationData: Partial<Communication>): Promise<Communication | undefined>;
  getAllCommunications(): Promise<Communication[]>;
  
  // Communication Recipients
  getCommunicationRecipient(id: number): Promise<CommunicationRecipient | undefined>;
  createCommunicationRecipient(recipient: InsertCommunicationRecipient): Promise<CommunicationRecipient>;
  updateCommunicationRecipient(id: number, recipientData: Partial<CommunicationRecipient>): Promise<CommunicationRecipient | undefined>;
  getCommunicationRecipientsByCommunicationId(communicationId: number): Promise<CommunicationRecipient[]>;
  
  // Communication Files
  getCommunicationFile(id: number): Promise<CommunicationFile | undefined>;
  createCommunicationFile(file: InsertCommunicationFile): Promise<CommunicationFile>;
  getCommunicationFilesByCommunicationId(communicationId: number): Promise<CommunicationFile[]>;
  
  // Achievement Badges
  getAchievementBadge(id: number): Promise<AchievementBadge | undefined>;
  createAchievementBadge(badge: InsertAchievementBadge): Promise<AchievementBadge>;
  updateAchievementBadge(id: number, badgeData: Partial<AchievementBadge>): Promise<AchievementBadge | undefined>;
  getAllAchievementBadges(): Promise<AchievementBadge[]>;
  getAchievementBadgesByCategory(category: string): Promise<AchievementBadge[]>;
  
  // User Badges
  getUserBadge(id: number): Promise<UserBadge | undefined>;
  createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  updateUserBadge(id: number, userBadgeData: Partial<UserBadge>): Promise<UserBadge | undefined>;
  getUserBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]>;
  getUserWithBadges(userId: number): Promise<UserWithBadges | undefined>;
  getFeaturedBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]>;
  markUserBadgesAsSeen(badgeIds: number[]): Promise<void>;
  
  // Public Hearings
  getPublicHearing(id: number): Promise<PublicHearing | undefined>;
  getPublicHearingWithEntity(id: number): Promise<PublicHearingWithEntity | undefined>;
  getPublicHearingWithFiles(id: number): Promise<PublicHearingWithFiles | undefined>;
  getPublicHearingWithEntityAndFiles(id: number): Promise<PublicHearingWithEntityAndFiles | undefined>;
  createPublicHearing(publicHearing: InsertPublicHearing): Promise<PublicHearing>;
  updatePublicHearing(id: number, publicHearingData: Partial<PublicHearing>): Promise<PublicHearing | undefined>;
  getAllPublicHearings(): Promise<PublicHearing[]>;
  getPublicHearingsByEntityId(entityId: number): Promise<PublicHearing[]>;
  getUpcomingPublicHearings(): Promise<PublicHearing[]>;
  
  // Public Hearing Files
  getPublicHearingFile(id: number): Promise<PublicHearingFile | undefined>;
  createPublicHearingFile(file: InsertPublicHearingFile): Promise<PublicHearingFile>;
  getPublicHearingFilesByPublicHearingId(publicHearingId: number): Promise<PublicHearingFile[]>;
  
  // Session Store
  sessionStore: any; // Fix type issue with SessionStore
}

export class MemStorage implements IStorage {
  // Data stores
  private users: Map<number, User>;
  private entities: Map<number, Entity>;
  private meetings: Map<number, Meeting>;
  private meetingAttendees: Map<number, MeetingAttendee>;
  private meetingDocuments: Map<number, MeetingDocument>;
  private meetingReactions: Map<number, MeetingReaction>;
  private subjects: Map<number, Subject>;
  private subjectEntities: Map<number, SubjectEntity>;
  private tasks: Map<number, Task>;
  private taskComments: Map<number, TaskComment>;
  private communications: Map<number, Communication>;
  private communicationRecipients: Map<number, CommunicationRecipient>;
  private communicationFiles: Map<number, CommunicationFile>;
  private publicHearings: Map<number, PublicHearing>;
  private publicHearingFiles: Map<number, PublicHearingFile>;
  private achievementBadges: Map<number, AchievementBadge>;
  private userBadges: Map<number, UserBadge>;
  
  // Auto-increment IDs
  currentUserId: number;
  currentEntityId: number;
  currentMeetingId: number;
  currentMeetingAttendeeId: number;
  currentMeetingDocumentId: number;
  currentMeetingReactionId: number;
  currentSubjectId: number;
  currentSubjectEntityId: number;
  currentTaskId: number;
  currentTaskCommentId: number;
  currentCommunicationId: number;
  currentCommunicationRecipientId: number;
  currentCommunicationFileId: number;
  currentPublicHearingId: number;
  currentPublicHearingFileId: number;
  currentAchievementBadgeId: number;
  currentUserBadgeId: number;
  
  // Session store
  sessionStore: any; // Use any type for sessionStore

  constructor() {
    // Initialize data stores
    this.users = new Map();
    this.entities = new Map();
    this.meetings = new Map();
    this.meetingAttendees = new Map();
    this.meetingDocuments = new Map();
    this.meetingReactions = new Map();
    this.subjects = new Map();
    this.subjectEntities = new Map();
    this.tasks = new Map();
    this.taskComments = new Map();
    this.communications = new Map();
    this.communicationRecipients = new Map();
    this.communicationFiles = new Map();
    this.publicHearings = new Map();
    this.publicHearingFiles = new Map();
    this.achievementBadges = new Map();
    this.userBadges = new Map();
    
    // Initialize auto-increment IDs
    this.currentUserId = 1;
    this.currentEntityId = 1;
    this.currentMeetingId = 1;
    this.currentMeetingAttendeeId = 1;
    this.currentMeetingDocumentId = 1;
    this.currentMeetingReactionId = 1;
    this.currentSubjectId = 1;
    this.currentSubjectEntityId = 1;
    this.currentTaskId = 1;
    this.currentTaskCommentId = 1;
    this.currentCommunicationId = 1;
    this.currentCommunicationRecipientId = 1;
    this.currentCommunicationFileId = 1;
    this.currentPublicHearingId = 1;
    this.currentPublicHearingFileId = 1;
    this.currentAchievementBadgeId = 1;
    this.currentUserBadgeId = 1;
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserWithEntity(id: number): Promise<UserWithEntity | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const entity = user.entityId ? this.entities.get(user.entityId) : undefined;
    return {
      ...user,
      entity,
    };
  }

  async getUsersByEntityId(entityId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.entityId === entityId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Entity methods
  async getEntity(id: number): Promise<Entity | undefined> {
    return this.entities.get(id);
  }

  async getEntityByName(name: string): Promise<Entity | undefined> {
    return Array.from(this.entities.values()).find(
      (entity) => entity.name === name,
    );
  }

  async createEntity(insertEntity: InsertEntity): Promise<Entity> {
    const id = this.currentEntityId++;
    const entity: Entity = { ...insertEntity, id };
    this.entities.set(id, entity);
    return entity;
  }

  async updateEntity(id: number, entityData: Partial<Entity>): Promise<Entity | undefined> {
    const entity = this.entities.get(id);
    if (!entity) return undefined;

    const updatedEntity = { ...entity, ...entityData };
    this.entities.set(id, updatedEntity);
    return updatedEntity;
  }

  async getAllEntities(): Promise<Entity[]> {
    return Array.from(this.entities.values());
  }

  // Meeting methods
  async getMeeting(id: number): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async getMeetingWithAttendees(id: number): Promise<MeetingWithAttendees | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;

    const attendees = await this.getMeetingAttendeesByMeetingId(id);
    return {
      ...meeting,
      attendees,
    };
  }
  
  async getMeetingWithSubject(id: number): Promise<MeetingWithSubject | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    if (meeting.isRegisteredSubject && meeting.subjectId) {
      const subject = await this.getSubject(meeting.subjectId);
      return {
        ...meeting,
        registeredSubject: subject
      };
    }
    
    return {
      ...meeting,
      registeredSubject: undefined
    };
  }
  
  async getMeetingWithAttendeesAndSubject(id: number): Promise<MeetingWithAttendeesAndSubject | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    const attendees = await this.getMeetingAttendeesByMeetingId(id);
    
    if (meeting.isRegisteredSubject && meeting.subjectId) {
      const subject = await this.getSubject(meeting.subjectId);
      return {
        ...meeting,
        attendees,
        registeredSubject: subject
      };
    }
    
    return {
      ...meeting,
      attendees,
      registeredSubject: undefined
    };
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = this.currentMeetingId++;
    const meeting: Meeting = { ...insertMeeting, id };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async updateMeeting(id: number, meetingData: Partial<Meeting>): Promise<Meeting | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;

    const updatedMeeting = { ...meeting, ...meetingData };
    this.meetings.set(id, updatedMeeting);
    return updatedMeeting;
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return Array.from(this.meetings.values());
  }

  async getUpcomingMeetings(): Promise<Meeting[]> {
    const now = new Date();
    return Array.from(this.meetings.values())
      .filter(meeting => {
        const meetingDate = new Date(meeting.date);
        // Convert time strings to hours and minutes
        const startTimeParts = meeting.startTime.split(':').map(Number);
        const meetingDateTime = new Date(
          meetingDate.getFullYear(),
          meetingDate.getMonth(),
          meetingDate.getDate(),
          startTimeParts[0],  // Hours from startTime
          startTimeParts[1]   // Minutes from startTime
        );
        
        return meetingDateTime > now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Meeting Attendee methods
  async getMeetingAttendee(id: number): Promise<MeetingAttendee | undefined> {
    return this.meetingAttendees.get(id);
  }

  async getMeetingAttendeeByMeetingAndUser(meetingId: number, userId: number): Promise<MeetingAttendee | undefined> {
    return Array.from(this.meetingAttendees.values()).find(
      (attendee) => attendee.meetingId === meetingId && attendee.userId === userId,
    );
  }

  async createMeetingAttendee(insertAttendee: InsertMeetingAttendee): Promise<MeetingAttendee> {
    const id = this.currentMeetingAttendeeId++;
    const attendee: MeetingAttendee = { ...insertAttendee, id };
    this.meetingAttendees.set(id, attendee);
    return attendee;
  }

  async updateMeetingAttendee(id: number, attendeeData: Partial<MeetingAttendee>): Promise<MeetingAttendee | undefined> {
    const attendee = this.meetingAttendees.get(id);
    if (!attendee) return undefined;

    const updatedAttendee = { ...attendee, ...attendeeData };
    this.meetingAttendees.set(id, updatedAttendee);
    return updatedAttendee;
  }

  async getMeetingAttendeesByMeetingId(meetingId: number): Promise<MeetingAttendee[]> {
    return Array.from(this.meetingAttendees.values()).filter(
      (attendee) => attendee.meetingId === meetingId,
    );
  }

  // Meeting Document methods
  async getMeetingDocument(id: number): Promise<MeetingDocument | undefined> {
    return this.meetingDocuments.get(id);
  }

  async createMeetingDocument(insertDocument: InsertMeetingDocument): Promise<MeetingDocument> {
    const id = this.currentMeetingDocumentId++;
    const document: MeetingDocument = { ...insertDocument, id };
    this.meetingDocuments.set(id, document);
    return document;
  }

  async getMeetingDocumentsByMeetingId(meetingId: number): Promise<MeetingDocument[]> {
    return Array.from(this.meetingDocuments.values()).filter(
      (document) => document.meetingId === meetingId,
    );
  }
  
  async getMeetingWithDocuments(id: number): Promise<MeetingWithDocuments | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    const documents = await this.getMeetingDocumentsByMeetingId(id);
    return {
      ...meeting,
      documents,
    };
  }
  
  async getMeetingWithAttendeesAndDocuments(id: number): Promise<MeetingWithAttendeesAndDocuments | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    const attendees = await this.getMeetingAttendeesByMeetingId(id);
    const documents = await this.getMeetingDocumentsByMeetingId(id);
    
    return {
      ...meeting,
      attendees,
      documents,
    };
  }
  
  async getMeetingWithAll(id: number): Promise<MeetingWithAll | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    const attendees = await this.getMeetingAttendeesByMeetingId(id);
    const documents = await this.getMeetingDocumentsByMeetingId(id);
    const reactions = await this.getMeetingReactionsByMeetingId(id);
    let registeredSubject = undefined;
    
    if (meeting.subjectId) {
      registeredSubject = await this.getSubject(meeting.subjectId);
    }
    
    return {
      ...meeting,
      attendees,
      documents,
      reactions,
      registeredSubject,
    };
  }
  
  // Meeting Reaction methods
  async getMeetingReaction(id: number): Promise<MeetingReaction | undefined> {
    return this.meetingReactions.get(id);
  }

  async getMeetingReactionByMeetingAndUser(meetingId: number, userId: number, emoji: string): Promise<MeetingReaction | undefined> {
    return Array.from(this.meetingReactions.values()).find(
      (reaction) => 
        reaction.meetingId === meetingId && 
        reaction.userId === userId && 
        reaction.emoji === emoji
    );
  }

  async createMeetingReaction(insertReaction: InsertMeetingReaction): Promise<MeetingReaction> {
    const id = this.currentMeetingReactionId++;
    const now = new Date();
    const reaction: MeetingReaction = { 
      ...insertReaction, 
      id,
      createdAt: now
    };
    this.meetingReactions.set(id, reaction);
    return reaction;
  }

  async deleteMeetingReaction(id: number): Promise<boolean> {
    const exists = this.meetingReactions.has(id);
    if (!exists) return false;
    
    this.meetingReactions.delete(id);
    return true;
  }

  async getMeetingReactionsByMeetingId(meetingId: number): Promise<MeetingReaction[]> {
    return Array.from(this.meetingReactions.values()).filter(
      (reaction) => reaction.meetingId === meetingId
    );
  }
  
  async getMeetingWithReactions(id: number): Promise<MeetingWithReactions | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    const reactions = await this.getMeetingReactionsByMeetingId(id);
    return {
      ...meeting,
      reactions,
    };
  }
  
  async getMeetingWithAttendeesAndReactions(id: number): Promise<MeetingWithAttendeesAndReactions | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    const attendees = await this.getMeetingAttendeesByMeetingId(id);
    const reactions = await this.getMeetingReactionsByMeetingId(id);
    
    return {
      ...meeting,
      attendees,
      reactions,
    };
  }

  // Subject methods
  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = this.currentSubjectId++;
    const now = new Date();
    const subject: Subject = { 
      ...insertSubject, 
      id,
      createdAt: now
    };
    this.subjects.set(id, subject);
    return subject;
  }

  async updateSubject(id: number, subjectData: Partial<Subject>): Promise<Subject | undefined> {
    const subject = this.subjects.get(id);
    if (!subject) return undefined;

    const updatedSubject = { ...subject, ...subjectData };
    this.subjects.set(id, updatedSubject);
    return updatedSubject;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async getSubjectsByCreator(userId: number): Promise<Subject[]> {
    return Array.from(this.subjects.values()).filter(
      (subject) => subject.createdBy === userId
    );
  }
  
  // Subject-Entity relationship methods
  async createSubjectEntity(insertSubjectEntity: InsertSubjectEntity): Promise<SubjectEntity> {
    const id = this.currentSubjectEntityId++;
    const subjectEntity: SubjectEntity = { ...insertSubjectEntity, id };
    this.subjectEntities.set(id, subjectEntity);
    return subjectEntity;
  }
  
  async getSubjectEntitiesBySubjectId(subjectId: number): Promise<SubjectEntity[]> {
    return Array.from(this.subjectEntities.values()).filter(
      (subjectEntity) => subjectEntity.subjectId === subjectId
    );
  }
  
  async getSubjectEntitiesByEntityId(entityId: number): Promise<SubjectEntity[]> {
    return Array.from(this.subjectEntities.values()).filter(
      (subjectEntity) => subjectEntity.entityId === entityId
    );
  }
  
  async deleteSubjectEntity(id: number): Promise<boolean> {
    const exists = this.subjectEntities.has(id);
    if (!exists) return false;
    
    this.subjectEntities.delete(id);
    return true;
  }
  
  async deleteSubjectEntityByIds(subjectId: number, entityId: number): Promise<boolean> {
    const subjectEntity = Array.from(this.subjectEntities.values()).find(
      (se) => se.subjectId === subjectId && se.entityId === entityId
    );
    
    if (!subjectEntity) return false;
    
    this.subjectEntities.delete(subjectEntity.id);
    return true;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTaskWithAssignee(id: number): Promise<TaskWithAssignee | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    // Check if task is assigned to a registered user
    if (task.isRegisteredUser && task.assignedToUserId) {
      const assignee = await this.getUser(task.assignedToUserId);
      if (!assignee) return undefined;

      return {
        ...task,
        assignee,
      };
    }

    // For non-registered owners, create a simple User object
    return {
      ...task,
      assignee: {
        id: 0, // Use 0 as a special ID to indicate external user
        username: task.ownerName || 'External',
        password: '', // Not relevant for display
        email: task.ownerEmail || '',
        fullName: task.ownerName || 'External User',
        role: 'entity_member',
        phone: task.ownerPhone || null,
        whatsapp: null,
        telegram: null,
        position: null,
        entityId: null
      }
    };
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = { 
      ...task, 
      ...taskData,
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.isRegisteredUser && task.assignedToUserId === userId
    );
  }

  async getTasksBySubject(subjectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.subjectId === subjectId
    );
  }
  
  // Get all users associated with tasks from a specific subject
  async getUsersForSubjectTasks(subjectId: number): Promise<User[]> {
    const tasks = await this.getTasksBySubject(subjectId);
    const userIds: number[] = [];
    const users: User[] = [];
    
    // Get all registered users from tasks
    for (const task of tasks) {
      if (task.isRegisteredUser && task.assignedToUserId 
          && !userIds.includes(task.assignedToUserId)) {
        userIds.push(task.assignedToUserId);
      }
    }
    
    // Get user objects for each unique user ID
    for (const userId of userIds) {
      const user = await this.getUser(userId);
      if (user) {
        users.push(user);
      }
    }
    
    return users;
  }

  async getTasksByMeeting(meetingId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.meetingId === meetingId,
    );
  }

  async getTasksByEntity(entityId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.entityId === entityId,
    );
  }

  // Task Comment methods
  async getTaskComment(id: number): Promise<TaskComment | undefined> {
    return this.taskComments.get(id);
  }

  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    const id = this.currentTaskCommentId++;
    const comment: TaskComment = { ...insertComment, id };
    this.taskComments.set(id, comment);
    return comment;
  }

  async getTaskCommentsByTaskId(taskId: number): Promise<TaskComment[]> {
    return Array.from(this.taskComments.values()).filter(
      (comment) => comment.taskId === taskId,
    );
  }

  // Communication methods
  async getCommunication(id: number): Promise<Communication | undefined> {
    return this.communications.get(id);
  }

  async getCommunicationWithRecipients(id: number): Promise<CommunicationWithRecipients | undefined> {
    const communication = this.communications.get(id);
    if (!communication) return undefined;

    const recipients = await this.getCommunicationRecipientsByCommunicationId(id);
    return {
      ...communication,
      recipients,
    };
  }

  async createCommunication(insertCommunication: InsertCommunication): Promise<Communication> {
    const id = this.currentCommunicationId++;
    const communication: Communication = { ...insertCommunication, id };
    this.communications.set(id, communication);
    return communication;
  }

  async updateCommunication(id: number, communicationData: Partial<Communication>): Promise<Communication | undefined> {
    const communication = this.communications.get(id);
    if (!communication) return undefined;

    const updatedCommunication = { ...communication, ...communicationData };
    this.communications.set(id, updatedCommunication);
    return updatedCommunication;
  }

  async getAllCommunications(): Promise<Communication[]> {
    return Array.from(this.communications.values());
  }

  // Communication Recipient methods
  async getCommunicationRecipient(id: number): Promise<CommunicationRecipient | undefined> {
    return this.communicationRecipients.get(id);
  }

  async createCommunicationRecipient(insertRecipient: InsertCommunicationRecipient): Promise<CommunicationRecipient> {
    const id = this.currentCommunicationRecipientId++;
    const recipient: CommunicationRecipient = { ...insertRecipient, id };
    this.communicationRecipients.set(id, recipient);
    return recipient;
  }

  async updateCommunicationRecipient(id: number, recipientData: Partial<CommunicationRecipient>): Promise<CommunicationRecipient | undefined> {
    const recipient = this.communicationRecipients.get(id);
    if (!recipient) return undefined;

    const updatedRecipient = { ...recipient, ...recipientData };
    this.communicationRecipients.set(id, updatedRecipient);
    return updatedRecipient;
  }

  async getCommunicationRecipientsByCommunicationId(communicationId: number): Promise<CommunicationRecipient[]> {
    return Array.from(this.communicationRecipients.values()).filter(
      (recipient) => recipient.communicationId === communicationId,
    );
  }

  // Communication File methods
  async getCommunicationFile(id: number): Promise<CommunicationFile | undefined> {
    return this.communicationFiles.get(id);
  }

  async createCommunicationFile(insertFile: InsertCommunicationFile): Promise<CommunicationFile> {
    const id = this.currentCommunicationFileId++;
    const file: CommunicationFile = { 
      ...insertFile, 
      id,
      uploadedAt: new Date()
    };
    this.communicationFiles.set(id, file);
    return file;
  }

  async getCommunicationFilesByCommunicationId(communicationId: number): Promise<CommunicationFile[]> {
    return Array.from(this.communicationFiles.values()).filter(
      (file) => file.communicationId === communicationId,
    );
  }

  async getCommunicationWithFiles(id: number): Promise<CommunicationWithFiles | undefined> {
    const communication = this.communications.get(id);
    if (!communication) return undefined;

    const files = await this.getCommunicationFilesByCommunicationId(id);
    return {
      ...communication,
      files,
    };
  }

  async getCommunicationWithRecipientsAndFiles(id: number): Promise<CommunicationWithRecipientsAndFiles | undefined> {
    const communication = this.communications.get(id);
    if (!communication) return undefined;

    const recipients = await this.getCommunicationRecipientsByCommunicationId(id);
    const files = await this.getCommunicationFilesByCommunicationId(id);
    
    return {
      ...communication,
      recipients,
      files,
    };
  }

  // Achievement badge properties
  private achievementBadges: Map<number, AchievementBadge>;
  private userBadges: Map<number, UserBadge>;
  private currentAchievementBadgeId: number;
  private currentUserBadgeId: number;

  // Achievement badge methods
  async getAchievementBadge(id: number): Promise<AchievementBadge | undefined> {
    return this.achievementBadges.get(id);
  }

  async createAchievementBadge(badge: InsertAchievementBadge): Promise<AchievementBadge> {
    const id = this.currentAchievementBadgeId++;
    const newBadge: AchievementBadge = { 
      ...badge, 
      id,
      createdAt: new Date()
    };
    this.achievementBadges.set(id, newBadge);
    return newBadge;
  }

  async updateAchievementBadge(id: number, badgeData: Partial<AchievementBadge>): Promise<AchievementBadge | undefined> {
    const badge = this.achievementBadges.get(id);
    if (!badge) return undefined;
    
    const updatedBadge = { ...badge, ...badgeData };
    this.achievementBadges.set(id, updatedBadge);
    return updatedBadge;
  }

  async getAllAchievementBadges(): Promise<AchievementBadge[]> {
    return Array.from(this.achievementBadges.values());
  }

  async getAchievementBadgesByCategory(category: string): Promise<AchievementBadge[]> {
    return Array.from(this.achievementBadges.values()).filter(
      (badge) => badge.category === category
    );
  }

  // User badges methods
  async getUserBadge(id: number): Promise<UserBadge | undefined> {
    return this.userBadges.get(id);
  }

  async createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const id = this.currentUserBadgeId++;
    const newUserBadge: UserBadge = {
      ...userBadge,
      id,
      earnedAt: new Date()
    };
    this.userBadges.set(id, newUserBadge);
    return newUserBadge;
  }

  async updateUserBadge(id: number, userBadgeData: Partial<UserBadge>): Promise<UserBadge | undefined> {
    const userBadge = this.userBadges.get(id);
    if (!userBadge) return undefined;

    const updatedUserBadge = { ...userBadge, ...userBadgeData };
    this.userBadges.set(id, updatedUserBadge);
    return updatedUserBadge;
  }

  async getUserBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]> {
    const userBadges = Array.from(this.userBadges.values()).filter(
      (userBadge) => userBadge.userId === userId
    );

    return userBadges.map(userBadge => {
      const badge = this.achievementBadges.get(userBadge.badgeId);
      if (!badge) throw new Error(`Badge with id ${userBadge.badgeId} not found`);
      return { ...userBadge, badge };
    });
  }

  async getUserWithBadges(userId: number): Promise<UserWithBadges | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const badges = await this.getUserBadgesByUserId(userId);
    
    return {
      ...user,
      badges
    };
  }

  async getFeaturedBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]> {
    const userBadges = await this.getUserBadgesByUserId(userId);
    return userBadges.filter(userBadge => userBadge.featured);
  }
  
  async markUserBadgesAsSeen(badgeIds: number[]): Promise<void> {
    for (const id of badgeIds) {
      const userBadge = this.userBadges.get(id);
      if (userBadge) {
        const updatedBadge = { ...userBadge, seen: true };
        this.userBadges.set(id, updatedBadge);
      }
    }
  }
  
  // Public Hearing methods
  async getPublicHearing(id: number): Promise<PublicHearing | undefined> {
    return this.publicHearings.get(id);
  }

  async getPublicHearingWithEntity(id: number): Promise<PublicHearingWithEntity | undefined> {
    const publicHearing = await this.getPublicHearing(id);
    if (!publicHearing) return undefined;

    const entity = await this.getEntity(publicHearing.entityId);
    if (!entity) return undefined;

    return {
      ...publicHearing,
      entity
    };
  }

  async getPublicHearingWithFiles(id: number): Promise<PublicHearingWithFiles | undefined> {
    const publicHearing = await this.getPublicHearing(id);
    if (!publicHearing) return undefined;

    const files = await this.getPublicHearingFilesByPublicHearingId(id);

    return {
      ...publicHearing,
      files
    };
  }

  async getPublicHearingWithEntityAndFiles(id: number): Promise<PublicHearingWithEntityAndFiles | undefined> {
    const publicHearing = await this.getPublicHearing(id);
    if (!publicHearing) return undefined;

    const entity = await this.getEntity(publicHearing.entityId);
    if (!entity) return undefined;

    const files = await this.getPublicHearingFilesByPublicHearingId(id);

    return {
      ...publicHearing,
      entity,
      files
    };
  }

  async createPublicHearing(publicHearing: InsertPublicHearing): Promise<PublicHearing> {
    const id = this.currentPublicHearingId++;
    const now = new Date();
    const newPublicHearing: PublicHearing = { 
      ...publicHearing, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.publicHearings.set(id, newPublicHearing);
    return newPublicHearing;
  }

  async updatePublicHearing(id: number, publicHearingData: Partial<PublicHearing>): Promise<PublicHearing | undefined> {
    const publicHearing = this.publicHearings.get(id);
    if (!publicHearing) return undefined;

    const now = new Date();
    const updatedPublicHearing = { 
      ...publicHearing, 
      ...publicHearingData,
      updatedAt: now
    };
    this.publicHearings.set(id, updatedPublicHearing);
    return updatedPublicHearing;
  }

  async getAllPublicHearings(): Promise<PublicHearing[]> {
    return Array.from(this.publicHearings.values());
  }

  async getPublicHearingsByEntityId(entityId: number): Promise<PublicHearing[]> {
    return Array.from(this.publicHearings.values()).filter(
      (hearing) => hearing.entityId === entityId
    );
  }

  async getUpcomingPublicHearings(): Promise<PublicHearing[]> {
    const now = new Date();
    return Array.from(this.publicHearings.values())
      .filter(hearing => {
        const hearingDate = new Date(hearing.date);
        // Convert time strings to hours and minutes
        const startTimeParts = hearing.startTime.split(':').map(Number);
        const hearingDateTime = new Date(
          hearingDate.getFullYear(),
          hearingDate.getMonth(),
          hearingDate.getDate(),
          startTimeParts[0],  // Hours from startTime
          startTimeParts[1]   // Minutes from startTime
        );
        
        return hearingDateTime > now && hearing.status !== 'cancelled';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Public Hearing File methods
  async getPublicHearingFile(id: number): Promise<PublicHearingFile | undefined> {
    return this.publicHearingFiles.get(id);
  }

  async createPublicHearingFile(file: InsertPublicHearingFile): Promise<PublicHearingFile> {
    const id = this.currentPublicHearingFileId++;
    const now = new Date();
    const newFile: PublicHearingFile = { 
      ...file, 
      id,
      uploadedAt: now
    };
    this.publicHearingFiles.set(id, newFile);
    return newFile;
  }

  async getPublicHearingFilesByPublicHearingId(publicHearingId: number): Promise<PublicHearingFile[]> {
    return Array.from(this.publicHearingFiles.values()).filter(
      (file) => file.publicHearingId === publicHearingId
    );
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Use any type for sessionStore

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // Achievement Badges methods
  async getAchievementBadge(id: number): Promise<AchievementBadge | undefined> {
    const [badge] = await db
      .select()
      .from(achievementBadges)
      .where(eq(achievementBadges.id, id));
    return badge || undefined;
  }

  async createAchievementBadge(badge: InsertAchievementBadge): Promise<AchievementBadge> {
    const [newBadge] = await db
      .insert(achievementBadges)
      .values(badge)
      .returning();
    return newBadge;
  }

  async updateAchievementBadge(id: number, badgeData: Partial<AchievementBadge>): Promise<AchievementBadge | undefined> {
    const [updatedBadge] = await db
      .update(achievementBadges)
      .set(badgeData)
      .where(eq(achievementBadges.id, id))
      .returning();
    return updatedBadge || undefined;
  }

  async getAllAchievementBadges(): Promise<AchievementBadge[]> {
    return await db.select().from(achievementBadges);
  }

  async getAchievementBadgesByCategory(category: string): Promise<AchievementBadge[]> {
    return await db
      .select()
      .from(achievementBadges)
      .where(eq(achievementBadges.category, category));
  }

  // User Badges methods
  async getUserBadge(id: number): Promise<UserBadge | undefined> {
    const [userBadge] = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.id, id));
    return userBadge || undefined;
  }

  async createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const [newUserBadge] = await db
      .insert(userBadges)
      .values(userBadge)
      .returning();
    return newUserBadge;
  }

  async updateUserBadge(id: number, userBadgeData: Partial<UserBadge>): Promise<UserBadge | undefined> {
    const [updatedUserBadge] = await db
      .update(userBadges)
      .set(userBadgeData)
      .where(eq(userBadges.id, id))
      .returning();
    return updatedUserBadge || undefined;
  }

  async getUserBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]> {
    const result = await db
      .select({
        id: userBadges.id,
        userId: userBadges.userId,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        featured: userBadges.featured,
        badge: achievementBadges
      })
      .from(userBadges)
      .leftJoin(achievementBadges, eq(userBadges.badgeId, achievementBadges.id))
      .where(eq(userBadges.userId, userId));

    return result as unknown as (UserBadge & { badge: AchievementBadge })[];
  }

  async getUserWithBadges(userId: number): Promise<UserWithBadges | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;

    const badges = await this.getUserBadgesByUserId(userId);
    
    return {
      ...user,
      badges
    };
  }

  async getFeaturedBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]> {
    const result = await db
      .select({
        id: userBadges.id,
        userId: userBadges.userId,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        featured: userBadges.featured,
        badge: achievementBadges
      })
      .from(userBadges)
      .leftJoin(achievementBadges, eq(userBadges.badgeId, achievementBadges.id))
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.featured, true)
      ));

    return result as unknown as (UserBadge & { badge: AchievementBadge })[];
  }
  
  async markUserBadgesAsSeen(badgeIds: number[]): Promise<void> {
    if (badgeIds.length === 0) return;
    
    await db
      .update(userBadges)
      .set({ seen: true })
      .where(inArray(userBadges.id, badgeIds));
  }
  
  // Public Hearings methods
  async getPublicHearing(id: number): Promise<PublicHearing | undefined> {
    const [publicHearing] = await db
      .select()
      .from(publicHearings)
      .where(eq(publicHearings.id, id));
    return publicHearing || undefined;
  }

  async getPublicHearingWithEntity(id: number): Promise<PublicHearingWithEntity | undefined> {
    const [result] = await db
      .select({
        id: publicHearings.id,
        title: publicHearings.title,
        description: publicHearings.description,
        date: publicHearings.date,
        startTime: publicHearings.startTime,
        endTime: publicHearings.endTime,
        location: publicHearings.location,
        entityId: publicHearings.entityId,
        createdBy: publicHearings.createdBy,
        status: publicHearings.status,
        createdAt: publicHearings.createdAt,
        updatedAt: publicHearings.updatedAt,
        entity: entities
      })
      .from(publicHearings)
      .leftJoin(entities, eq(publicHearings.entityId, entities.id))
      .where(eq(publicHearings.id, id));

    if (!result) return undefined;
    return result as unknown as PublicHearingWithEntity;
  }

  async getPublicHearingWithFiles(id: number): Promise<PublicHearingWithFiles | undefined> {
    const [publicHearing] = await db
      .select()
      .from(publicHearings)
      .where(eq(publicHearings.id, id));
      
    if (!publicHearing) return undefined;
    
    const files = await db
      .select()
      .from(publicHearingFiles)
      .where(eq(publicHearingFiles.publicHearingId, id));
      
    return {
      ...publicHearing,
      files
    };
  }

  async getPublicHearingWithEntityAndFiles(id: number): Promise<PublicHearingWithEntityAndFiles | undefined> {
    // First get the public hearing
    const [publicHearing] = await db
      .select()
      .from(publicHearings)
      .where(eq(publicHearings.id, id));

    if (!publicHearing) return undefined;
    
    // Get the entity
    const [entity] = await db
      .select()
      .from(entities)
      .where(eq(entities.id, publicHearing.entityId));
      
    if (!entity) return undefined;
    
    // Get the files
    const files = await db
      .select()
      .from(publicHearingFiles)
      .where(eq(publicHearingFiles.publicHearingId, id));
      
    // Log for debugging
    console.log(`Found ${files.length} files for public hearing #${id}`);
    
    // Return the combined result with proper typing
    return {
      ...publicHearing,
      entity,
      files
    };
  }

  async createPublicHearing(publicHearing: InsertPublicHearing): Promise<PublicHearing> {
    const [newPublicHearing] = await db
      .insert(publicHearings)
      .values({
        ...publicHearing,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newPublicHearing;
  }

  async updatePublicHearing(id: number, publicHearingData: Partial<PublicHearing>): Promise<PublicHearing | undefined> {
    const [updatedPublicHearing] = await db
      .update(publicHearings)
      .set({
        ...publicHearingData,
        updatedAt: new Date()
      })
      .where(eq(publicHearings.id, id))
      .returning();
    return updatedPublicHearing || undefined;
  }

  async getAllPublicHearings(): Promise<PublicHearing[]> {
    return await db.select().from(publicHearings);
  }

  async getPublicHearingsByEntityId(entityId: number): Promise<PublicHearing[]> {
    return await db
      .select()
      .from(publicHearings)
      .where(eq(publicHearings.entityId, entityId));
  }

  async getUpcomingPublicHearings(): Promise<PublicHearing[]> {
    const now = new Date();
    
    return await db
      .select()
      .from(publicHearings)
      .where(and(
        gt(publicHearings.date, now),
        ne(publicHearings.status, 'cancelled')
      ))
      .orderBy(publicHearings.date);
  }

  // Public Hearing Files methods
  async getPublicHearingFile(id: number): Promise<PublicHearingFile | undefined> {
    const [file] = await db
      .select()
      .from(publicHearingFiles)
      .where(eq(publicHearingFiles.id, id));
    return file || undefined;
  }

  async createPublicHearingFile(file: InsertPublicHearingFile): Promise<PublicHearingFile> {
    const [newFile] = await db
      .insert(publicHearingFiles)
      .values({
        ...file,
        uploadedAt: new Date()
      })
      .returning();
    return newFile;
  }

  async getPublicHearingFilesByPublicHearingId(publicHearingId: number): Promise<PublicHearingFile[]> {
    return await db
      .select()
      .from(publicHearingFiles)
      .where(eq(publicHearingFiles.publicHearingId, publicHearingId));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserWithEntity(id: number): Promise<UserWithEntity | undefined> {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        phone: users.phone,
        whatsapp: users.whatsapp,
        telegram: users.telegram,
        position: users.position,
        entityId: users.entityId,
        entity: entities
      })
      .from(users)
      .leftJoin(entities, eq(users.entityId, entities.id))
      .where(eq(users.id, id));

    if (!user) return undefined;
    return user as unknown as UserWithEntity;
  }

  async getUsersByEntityId(entityId: number): Promise<User[]> {
    console.log(`Fetching users for entity ID: ${entityId}`);
    const result = await db.select().from(users).where(eq(users.entityId, entityId));
    console.log(`Found ${result.length} users for entity ID ${entityId}`);
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log("DatabaseStorage.createUser called with:", insertUser);
    
    // Ensure all required fields are present
    const userToInsert = {
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      fullName: insertUser.fullName,
      role: insertUser.role,
      phone: insertUser.phone ?? null,
      whatsapp: insertUser.whatsapp ?? null, 
      telegram: insertUser.telegram ?? null,
      position: insertUser.position ?? null,
      entityId: insertUser.entityId ?? null
    };
    
    try {
      console.log("Inserting user:", userToInsert);
      const [user] = await db.insert(users).values(userToInsert).returning();
      console.log("User inserted successfully:", user);
      return user;
    } catch (error) {
      console.error("Error inserting user:", error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Entity methods
  async getEntity(id: number): Promise<Entity | undefined> {
    const [entity] = await db.select().from(entities).where(eq(entities.id, id));
    return entity || undefined;
  }

  async getEntityByName(name: string): Promise<Entity | undefined> {
    const [entity] = await db.select().from(entities).where(eq(entities.name, name));
    return entity || undefined;
  }

  async createEntity(insertEntity: InsertEntity): Promise<Entity> {
    const [entity] = await db.insert(entities).values(insertEntity).returning();
    return entity;
  }

  async updateEntity(id: number, entityData: Partial<Entity>): Promise<Entity | undefined> {
    const [updatedEntity] = await db
      .update(entities)
      .set(entityData)
      .where(eq(entities.id, id))
      .returning();
    return updatedEntity || undefined;
  }

  async getAllEntities(): Promise<Entity[]> {
    return await db.select().from(entities);
  }
  
  // Meeting Reaction methods
  async getMeetingReaction(id: number): Promise<MeetingReaction | undefined> {
    const [reaction] = await db
      .select()
      .from(meetingReactions)
      .where(eq(meetingReactions.id, id));
    return reaction || undefined;
  }

  async getMeetingReactionByMeetingAndUser(meetingId: number, userId: number, emoji: string): Promise<MeetingReaction | undefined> {
    const [reaction] = await db
      .select()
      .from(meetingReactions)
      .where(
        and(
          eq(meetingReactions.meetingId, meetingId),
          eq(meetingReactions.userId, userId),
          eq(meetingReactions.emoji, emoji)
        )
      );
    return reaction || undefined;
  }

  async createMeetingReaction(reaction: InsertMeetingReaction): Promise<MeetingReaction> {
    const [newReaction] = await db
      .insert(meetingReactions)
      .values(reaction)
      .returning();
    return newReaction;
  }

  async deleteMeetingReaction(id: number): Promise<boolean> {
    const result = await db
      .delete(meetingReactions)
      .where(eq(meetingReactions.id, id));
    return result.rowCount > 0;
  }

  async getMeetingReactionsByMeetingId(meetingId: number): Promise<MeetingReaction[]> {
    return await db
      .select()
      .from(meetingReactions)
      .where(eq(meetingReactions.meetingId, meetingId));
  }
  
  async getMeetingWithReactions(id: number): Promise<MeetingWithReactions | undefined> {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, id));
    
    if (!meeting) return undefined;
    
    const reactions = await this.getMeetingReactionsByMeetingId(id);
    
    return {
      ...meeting,
      reactions
    };
  }
  
  async getMeetingWithAttendeesAndReactions(id: number): Promise<MeetingWithAttendeesAndReactions | undefined> {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, id));
    
    if (!meeting) return undefined;
    
    const attendees = await db
      .select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.meetingId, id));
    
    const reactions = await this.getMeetingReactionsByMeetingId(id);
    
    return {
      ...meeting,
      attendees,
      reactions
    };
  }

  // Subject methods
  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    try {
      console.log("Creating subject with data:", JSON.stringify(insertSubject));
      const [subject] = await db.insert(subjects).values({
        ...insertSubject,
        createdAt: new Date() // Explicitly set createdAt
      }).returning();
      console.log("Created subject:", JSON.stringify(subject));
      return subject;
    } catch (error) {
      console.error("Error creating subject:", error);
      throw error;
    }
  }

  async updateSubject(id: number, subjectData: Partial<Subject>): Promise<Subject | undefined> {
    const [updatedSubject] = await db
      .update(subjects)
      .set(subjectData)
      .where(eq(subjects.id, id))
      .returning();
    return updatedSubject || undefined;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }
  
  async getAllSubjectsWithCreators(): Promise<(Subject & { creatorName?: string })[]> {
    // First get all subjects
    const allSubjects = await db.select().from(subjects);
    
    // If no subjects found, return an empty array
    if (!allSubjects || allSubjects.length === 0) {
      return [];
    }
    
    try {
      // Create a map of user IDs to user data
      const userIds = new Set(allSubjects.map(subject => subject.createdBy));
      const usersResults = await db.select().from(users).where(inArray(users.id, Array.from(userIds)));
      
      const userMap = new Map();
      for (const user of usersResults) {
        userMap.set(user.id, user);
      }
      
      // Combine subject data with creator information
      return allSubjects.map(subject => {
        const creator = userMap.get(subject.createdBy);
        return {
          ...subject,
          creatorName: creator ? creator.fullName : undefined
        };
      });
    } catch (error) {
      console.error("Error getting subjects with creators:", error);
      // If there's an error looking up creators, just return subjects without creator names
      return allSubjects.map(subject => ({
        ...subject,
        creatorName: undefined
      }));
    }
  }

  async getSubjectsByCreator(userId: number): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.createdBy, userId));
  }

  // Subject-Entity relationship methods
  async createSubjectEntity(insertSubjectEntity: InsertSubjectEntity): Promise<SubjectEntity> {
    try {
      console.log("Creating subject-entity relationship with data:", JSON.stringify(insertSubjectEntity));
      const [subjectEntity] = await db
        .insert(subjectEntities)
        .values(insertSubjectEntity)
        .returning();
      console.log("Created subject-entity relationship:", JSON.stringify(subjectEntity));
      return subjectEntity;
    } catch (error) {
      console.error("Error creating subject-entity relationship:", error);
      throw error;
    }
  }

  async getSubjectEntitiesBySubjectId(subjectId: number): Promise<SubjectEntity[]> {
    return await db
      .select()
      .from(subjectEntities)
      .where(eq(subjectEntities.subjectId, subjectId));
  }

  async getSubjectEntitiesByEntityId(entityId: number): Promise<SubjectEntity[]> {
    return await db
      .select()
      .from(subjectEntities)
      .where(eq(subjectEntities.entityId, entityId));
  }

  async deleteSubjectEntity(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(subjectEntities)
        .where(eq(subjectEntities.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting subject-entity relationship:", error);
      return false;
    }
  }

  async deleteSubjectEntityByIds(subjectId: number, entityId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(subjectEntities)
        .where(
          and(
            eq(subjectEntities.subjectId, subjectId),
            eq(subjectEntities.entityId, entityId)
          )
        )
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting subject-entity relationship by IDs:", error);
      return false;
    }
  }

  // Meeting methods
  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting || undefined;
  }

  async getMeetingWithAttendees(id: number): Promise<MeetingWithAttendees | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) return undefined;

    const attendees = await db.select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.meetingId, id));
    
    return {
      ...meeting,
      attendees
    };
  }
  
  async getMeetingWithSubject(id: number): Promise<MeetingWithSubject | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) return undefined;
    
    if (meeting.isRegisteredSubject && meeting.subjectId) {
      const [subject] = await db.select()
        .from(subjects)
        .where(eq(subjects.id, meeting.subjectId));
      
      return {
        ...meeting,
        registeredSubject: subject
      };
    }
    
    return {
      ...meeting,
      registeredSubject: undefined
    };
  }
  
  async getMeetingWithAttendeesAndSubject(id: number): Promise<MeetingWithAttendeesAndSubject | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) return undefined;
    
    const attendees = await db.select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.meetingId, id));
    
    if (meeting.isRegisteredSubject && meeting.subjectId) {
      const [subject] = await db.select()
        .from(subjects)
        .where(eq(subjects.id, meeting.subjectId));
      
      return {
        ...meeting,
        attendees,
        registeredSubject: subject
      };
    }
    
    return {
      ...meeting,
      attendees,
      registeredSubject: undefined
    };
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    // Add current timestamp for createdAt if not provided
    const meetingWithCreatedAt = {
      ...insertMeeting,
      createdAt: new Date()
    };
    
    const [meeting] = await db.insert(meetings).values(meetingWithCreatedAt).returning();
    return meeting;
  }

  async updateMeeting(id: number, meetingData: Partial<Meeting>): Promise<Meeting | undefined> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set(meetingData)
      .where(eq(meetings.id, id))
      .returning();
    return updatedMeeting || undefined;
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return await db.select().from(meetings);
  }

  async getMeetingsForUsers(userIds: number[]): Promise<Meeting[]> {
    if (!userIds || userIds.length === 0) {
      return [];
    }
    
    try {
      // First, get meetings where users are attendees
      const meetingsAsAttendee = await db
        .select({
          id: meetings.id,
          name: meetings.name,
          date: meetings.date,
          startTime: meetings.startTime,
          endTime: meetings.endTime,
          location: meetings.location,
          description: meetings.description,
          createdBy: meetings.createdBy,
          isRegisteredSubject: meetings.isRegisteredSubject,
          subjectId: meetings.subjectId,
          customSubject: meetings.customSubject
        })
        .from(meetings)
        .innerJoin(meetingAttendees, eq(meetings.id, meetingAttendees.meetingId))
        .where(inArray(meetingAttendees.userId, userIds));
      
      // Next, get meetings created by these users
      const meetingsAsCreator = await db
        .select()
        .from(meetings)
        .where(inArray(meetings.createdBy, userIds));
      
      // Combine both sets and deduplicate by ID
      const allMeetings = [...meetingsAsAttendee, ...meetingsAsCreator];
      const uniqueMeetingIds = new Set();
      const uniqueMeetings = allMeetings.filter(meeting => {
        if (uniqueMeetingIds.has(meeting.id)) {
          return false;
        }
        uniqueMeetingIds.add(meeting.id);
        return true;
      });
      
      return uniqueMeetings;
    } catch (error) {
      console.error("Error getting meetings for users:", error);
      return [];
    }
  }
  
  async getUpcomingMeetingsForUsers(userIds: number[]): Promise<Meeting[]> {
    if (!userIds || userIds.length === 0) {
      return [];
    }
    
    try {
      const now = new Date();
      
      // Get all meetings for the users
      const allMeetings = await this.getMeetingsForUsers(userIds);
      
      // Filter for only upcoming meetings
      return allMeetings.filter(meeting => {
        const meetingDate = new Date(meeting.date);
        
        // For same-day meetings, compare the time as well
        if (meetingDate.toDateString() === now.toDateString()) {
          const meetingTime = meeting.startTime ? meeting.startTime.split(':') : ['0', '0'];
          const meetingHours = parseInt(meetingTime[0], 10);
          const meetingMinutes = parseInt(meetingTime[1], 10);
          
          const currentHours = now.getHours();
          const currentMinutes = now.getMinutes();
          
          // Compare hours first, then minutes
          if (meetingHours > currentHours) {
            return true;
          } else if (meetingHours === currentHours && meetingMinutes > currentMinutes) {
            return true;
          }
          return false;
        }
        
        // For different days, just compare dates
        return meetingDate > now;
      });
    } catch (error) {
      console.error("Error getting upcoming meetings for users:", error);
      return [];
    }
  }
  
  async getUpcomingMeetings(): Promise<Meeting[]> {
    const now = new Date();
    const allMeetings = await db.select().from(meetings);
    
    // Filter meetings that are in the future (considering both date and time)
    return allMeetings
      .filter(meeting => {
        const meetingDate = new Date(meeting.date);
        // Convert time strings to hours and minutes
        const startTimeParts = meeting.startTime.split(':').map(Number);
        const meetingDateTime = new Date(
          meetingDate.getFullYear(),
          meetingDate.getMonth(),
          meetingDate.getDate(),
          startTimeParts[0],  // Hours from startTime
          startTimeParts[1]   // Minutes from startTime
        );
        
        return meetingDateTime > now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Meeting Attendee methods
  async getMeetingAttendee(id: number): Promise<MeetingAttendee | undefined> {
    const [attendee] = await db
      .select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.id, id));
    return attendee || undefined;
  }

  async getMeetingAttendeeByMeetingAndUser(meetingId: number, userId: number): Promise<MeetingAttendee | undefined> {
    const [attendee] = await db
      .select()
      .from(meetingAttendees)
      .where(
        and(
          eq(meetingAttendees.meetingId, meetingId),
          eq(meetingAttendees.userId, userId)
        )
      );
    return attendee || undefined;
  }

  async createMeetingAttendee(insertAttendee: InsertMeetingAttendee): Promise<MeetingAttendee> {
    const [attendee] = await db
      .insert(meetingAttendees)
      .values(insertAttendee)
      .returning();
    return attendee;
  }

  async updateMeetingAttendee(id: number, attendeeData: Partial<MeetingAttendee>): Promise<MeetingAttendee | undefined> {
    const [updatedAttendee] = await db
      .update(meetingAttendees)
      .set(attendeeData)
      .where(eq(meetingAttendees.id, id))
      .returning();
    return updatedAttendee || undefined;
  }

  async getMeetingAttendeesByMeetingId(meetingId: number): Promise<MeetingAttendee[]> {
    return await db
      .select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.meetingId, meetingId));
  }

  // Meeting Document methods
  async getMeetingDocument(id: number): Promise<MeetingDocument | undefined> {
    const [document] = await db
      .select()
      .from(meetingDocuments)
      .where(eq(meetingDocuments.id, id));
    return document || undefined;
  }

  async createMeetingDocument(insertDocument: InsertMeetingDocument): Promise<MeetingDocument> {
    // Add current timestamp for uploadedAt
    const documentWithUploadedAt = {
      ...insertDocument,
      uploadedAt: new Date()
    };
    
    const [document] = await db
      .insert(meetingDocuments)
      .values(documentWithUploadedAt)
      .returning();
    return document;
  }

  async getMeetingDocumentsByMeetingId(meetingId: number): Promise<MeetingDocument[]> {
    return await db
      .select()
      .from(meetingDocuments)
      .where(eq(meetingDocuments.meetingId, meetingId));
  }
  
  async getMeetingWithDocuments(id: number): Promise<MeetingWithDocuments | undefined> {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, id));
      
    if (!meeting) return undefined;
    
    const documents = await db
      .select()
      .from(meetingDocuments)
      .where(eq(meetingDocuments.meetingId, id));
      
    return {
      ...meeting,
      documents
    };
  }
  
  async getMeetingWithAttendeesAndDocuments(id: number): Promise<MeetingWithAttendeesAndDocuments | undefined> {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, id));
      
    if (!meeting) return undefined;
    
    const attendees = await db
      .select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.meetingId, id));
      
    const documents = await db
      .select()
      .from(meetingDocuments)
      .where(eq(meetingDocuments.meetingId, id));
      
    return {
      ...meeting,
      attendees,
      documents
    };
  }
  
  async getMeetingWithAll(id: number): Promise<MeetingWithAll | undefined> {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, id));
      
    if (!meeting) return undefined;
    
    const attendees = await db
      .select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.meetingId, id));
      
    const documents = await db
      .select()
      .from(meetingDocuments)
      .where(eq(meetingDocuments.meetingId, id));
      
    const reactions = await db
      .select()
      .from(meetingReactions)
      .where(eq(meetingReactions.meetingId, id));
    
    let registeredSubject = undefined;
    
    if (meeting.subjectId) {
      const [subject] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, meeting.subjectId));
        
      registeredSubject = subject;
    }
    
    return {
      ...meeting,
      attendees,
      documents,
      reactions,
      registeredSubject
    };
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTaskWithAssignee(id: number): Promise<TaskWithAssignee | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return undefined;

    // Check if task is assigned to a registered user
    if (task.isRegisteredUser && task.assignedToUserId) {
      const [assignee] = await db.select().from(users).where(eq(users.id, task.assignedToUserId));
      if (!assignee) return undefined;

      return {
        ...task,
        assignee
      };
    }

    // For non-registered owners, create a simple User object
    return {
      ...task,
      assignee: {
        id: 0, // Use 0 as a special ID to indicate external user
        username: task.ownerName || 'External',
        password: '', // Not relevant for display
        email: task.ownerEmail || '',
        fullName: task.ownerName || 'External User',
        role: 'entity_member',
        phone: task.ownerPhone || null,
        whatsapp: null,
        telegram: null,
        position: null,
        entityId: null
      }
    };
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    // Add current timestamp for createdAt and updatedAt
    const now = new Date();
    const taskWithTimestamps = {
      ...insertTask,
      createdAt: now,
      updatedAt: now,
      // Ensure required fields have default values
      status: insertTask.status ?? 'pending',
      entityId: insertTask.entityId ?? null,
      meetingId: insertTask.meetingId ?? null
    };
    
    const [task] = await db.insert(tasks).values(taskWithTimestamps).returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    // Always update the updatedAt timestamp when tasks are modified
    const updatedTaskData = {
      ...taskData,
      updatedAt: new Date()
    };
    
    const [updatedTask] = await db
      .update(tasks)
      .set(updatedTaskData)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.isRegisteredUser, true),
          eq(tasks.assignedToUserId, userId)
        )
      );
  }
  
  async getTasksBySubject(subjectId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.subjectId, subjectId));
  }
  
  // Get all users associated with tasks from a specific subject
  async getUsersForSubjectTasks(subjectId: number): Promise<User[]> {
    // Find all tasks for this subject that are assigned to registered users
    const subjectTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.subjectId, subjectId),
          eq(tasks.isRegisteredUser, true),
          sql`${tasks.assignedToUserId} IS NOT NULL`
        )
      );
    
    if (subjectTasks.length === 0) {
      return [];
    }
    
    // Extract unique user IDs and filter out nulls
    const userIdsWithPossibleNulls = subjectTasks.map(task => task.assignedToUserId);
    const userIds: number[] = [];
    
    // Manually collect unique user IDs
    for (const id of userIdsWithPossibleNulls) {
      if (id !== null && !userIds.includes(id)) {
        userIds.push(id);
      }
    }
    
    if (userIds.length === 0) {
      return [];
    }
    
    // Get the user objects for these IDs using IN clause
    return await db
      .select()
      .from(users)
      .where(
        // Use OR conditions for each user ID as alternative to inArray
        or(
          ...userIds.map(id => eq(users.id, id))
        )
      );
  }

  async getTasksByMeeting(meetingId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.meetingId, meetingId));
  }

  async getTasksByEntity(entityId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.entityId, entityId));
  }

  // Task Comment methods
  async getTaskComment(id: number): Promise<TaskComment | undefined> {
    const [comment] = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.id, id));
    return comment || undefined;
  }

  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    // Add current timestamp for createdAt
    const commentWithCreatedAt = {
      ...insertComment,
      createdAt: new Date()
    };
    
    const [comment] = await db
      .insert(taskComments)
      .values(commentWithCreatedAt)
      .returning();
    return comment;
  }

  async getTaskCommentsByTaskId(taskId: number): Promise<TaskComment[]> {
    return await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId));
  }

  // Communication methods
  async getCommunication(id: number): Promise<Communication | undefined> {
    const [communication] = await db
      .select()
      .from(communications)
      .where(eq(communications.id, id));
    return communication || undefined;
  }

  async getCommunicationWithRecipients(id: number): Promise<CommunicationWithRecipientsAndFiles | undefined> {
    const [communication] = await db
      .select()
      .from(communications)
      .where(eq(communications.id, id));

    if (!communication) return undefined;

    const recipients = await db
      .select()
      .from(communicationRecipients)
      .where(eq(communicationRecipients.communicationId, id));

    const files = await this.getCommunicationFilesByCommunicationId(id);

    return {
      ...communication,
      recipients,
      files
    };
  }

  async createCommunication(insertCommunication: InsertCommunication): Promise<Communication> {
    // Add current timestamp for sentAt
    const communicationWithSentAt = {
      ...insertCommunication,
      sentAt: new Date()
    };
    
    const [communication] = await db
      .insert(communications)
      .values(communicationWithSentAt)
      .returning();
    return communication;
  }

  async updateCommunication(id: number, communicationData: Partial<Communication>): Promise<Communication | undefined> {
    try {
      console.log(`Updating communication ${id} with data:`, communicationData);
      const [updatedCommunication] = await db
        .update(communications)
        .set(communicationData)
        .where(eq(communications.id, id))
        .returning();
      console.log(`Updated communication:`, updatedCommunication);
      return updatedCommunication || undefined;
    } catch (error) {
      console.error('Error updating communication:', error);
      // Try a different approach if the first one fails
      try {
        // Get the current communication
        const [communication] = await db
          .select()
          .from(communications)
          .where(eq(communications.id, id));
        
        if (!communication) return undefined;
        
        // Manually update only the hasAttachments field
        if ('hasAttachments' in communicationData) {
          const [updated] = await db.execute(
            `UPDATE communications SET "hasAttachments" = $1 WHERE id = $2 RETURNING *`,
            [communicationData.hasAttachments, id]
          );
          return updated;
        }
        return communication;
      } catch (secondError) {
        console.error('Second error updating communication:', secondError);
        throw secondError;
      }
    }
  }

  async getAllCommunications(): Promise<Communication[]> {
    return await db.select().from(communications);
  }

  // Communication Recipient methods
  async getCommunicationRecipient(id: number): Promise<CommunicationRecipient | undefined> {
    const [recipient] = await db
      .select()
      .from(communicationRecipients)
      .where(eq(communicationRecipients.id, id));
    return recipient || undefined;
  }

  async createCommunicationRecipient(insertRecipient: InsertCommunicationRecipient): Promise<CommunicationRecipient> {
    // Add null for readAt if not provided (since it's nullable)
    const recipientWithReadAt = {
      ...insertRecipient,
      readAt: null
    };
    
    const [recipient] = await db
      .insert(communicationRecipients)
      .values(recipientWithReadAt)
      .returning();
    return recipient;
  }

  async updateCommunicationRecipient(id: number, recipientData: Partial<CommunicationRecipient>): Promise<CommunicationRecipient | undefined> {
    const [updatedRecipient] = await db
      .update(communicationRecipients)
      .set(recipientData)
      .where(eq(communicationRecipients.id, id))
      .returning();
    return updatedRecipient || undefined;
  }

  async getCommunicationRecipientsByCommunicationId(communicationId: number): Promise<CommunicationRecipient[]> {
    return await db
      .select()
      .from(communicationRecipients)
      .where(eq(communicationRecipients.communicationId, communicationId));
  }
  
  // Communication File methods
  async getCommunicationFile(id: number): Promise<CommunicationFile | undefined> {
    const [file] = await db
      .select()
      .from(communicationFiles)
      .where(eq(communicationFiles.id, id));
    return file || undefined;
  }

  async createCommunicationFile(insertFile: InsertCommunicationFile): Promise<CommunicationFile> {
    // Add current timestamp for uploadedAt if not provided
    const fileWithUploadedAt = {
      ...insertFile,
      uploadedAt: new Date()
    };
    
    const [file] = await db
      .insert(communicationFiles)
      .values(fileWithUploadedAt)
      .returning();
    return file;
  }

  async getCommunicationFilesByCommunicationId(communicationId: number): Promise<CommunicationFile[]> {
    return await db
      .select()
      .from(communicationFiles)
      .where(eq(communicationFiles.communicationId, communicationId));
  }
  
  async getCommunicationWithFiles(id: number): Promise<CommunicationWithFiles | undefined> {
    const [communication] = await db
      .select()
      .from(communications)
      .where(eq(communications.id, id));

    if (!communication) return undefined;

    const files = await db
      .select()
      .from(communicationFiles)
      .where(eq(communicationFiles.communicationId, id));

    return {
      ...communication,
      files
    };
  }

  async getCommunicationWithRecipientsAndFiles(id: number): Promise<CommunicationWithRecipientsAndFiles | undefined> {
    const [communication] = await db
      .select()
      .from(communications)
      .where(eq(communications.id, id));

    if (!communication) return undefined;

    const recipients = await db
      .select()
      .from(communicationRecipients)
      .where(eq(communicationRecipients.communicationId, id));
      
    const files = await db
      .select()
      .from(communicationFiles)
      .where(eq(communicationFiles.communicationId, id));

    return {
      ...communication,
      recipients,
      files
    };
  }
  
  /**
   * Truncate communications and files tables while preserving users, entities, and subjects
   * @returns Object with success status and message
   */
  async truncateCommunicationsAndFiles(): Promise<{ success: boolean; message: string; tablesAffected: string[] }> {
    try {
      // Define tables to truncate in order (respecting foreign key constraints)
      const tablesToTruncate = [
        'communication_files',
        'communication_recipients', 
        'communications',
        'meeting_documents',
        'meeting_attendees',
        'meetings',
        'task_comments',
        'tasks'
      ];
      
      // Check which tables exist
      const tableExistsQuery = await db.execute(sql`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
      `);
      
      const allExistingTables = tableExistsQuery.rows.map(row => row.tablename);
      console.log('Existing tables:', allExistingTables);
      
      // Process each table individually
      const truncatedTables: string[] = [];
      
      // First truncate communication_files
      if (allExistingTables.includes('communication_files')) {
        try {
          await db.execute(sql`TRUNCATE TABLE communication_files`);
          console.log(`Truncated table: communication_files`);
          truncatedTables.push('communication_files');
        } catch (err) {
          console.log(`Error truncating table communication_files:`, err);
        }
      }
      
      // Then truncate communication_recipients
      if (allExistingTables.includes('communication_recipients')) {
        try {
          await db.execute(sql`TRUNCATE TABLE communication_recipients`);
          console.log(`Truncated table: communication_recipients`);
          truncatedTables.push('communication_recipients');
        } catch (err) {
          console.log(`Error truncating table communication_recipients:`, err);
        }
      }
      
      // Then truncate communications
      if (allExistingTables.includes('communications')) {
        try {
          await db.execute(sql`TRUNCATE TABLE communications`);
          console.log(`Truncated table: communications`);
          truncatedTables.push('communications');
        } catch (err) {
          console.log(`Error truncating table communications:`, err);
        }
      }
      
      // Then truncate task_comments
      if (allExistingTables.includes('task_comments')) {
        try {
          await db.execute(sql`TRUNCATE TABLE task_comments`);
          console.log(`Truncated table: task_comments`);
          truncatedTables.push('task_comments');
        } catch (err) {
          console.log(`Error truncating table task_comments:`, err);
        }
      }
      
      // Then truncate tasks
      if (allExistingTables.includes('tasks')) {
        try {
          await db.execute(sql`TRUNCATE TABLE tasks`);
          console.log(`Truncated table: tasks`);
          truncatedTables.push('tasks');
        } catch (err) {
          console.log(`Error truncating table tasks:`, err);
        }
      }
      
      // Then truncate meeting_documents
      if (allExistingTables.includes('meeting_documents')) {
        try {
          await db.execute(sql`TRUNCATE TABLE meeting_documents`);
          console.log(`Truncated table: meeting_documents`);
          truncatedTables.push('meeting_documents');
        } catch (err) {
          console.log(`Error truncating table meeting_documents:`, err);
        }
      }
      
      // Then truncate meeting_attendees
      if (allExistingTables.includes('meeting_attendees')) {
        try {
          await db.execute(sql`TRUNCATE TABLE meeting_attendees`);
          console.log(`Truncated table: meeting_attendees`);
          truncatedTables.push('meeting_attendees');
        } catch (err) {
          console.log(`Error truncating table meeting_attendees:`, err);
        }
      }
      
      // Finally truncate meetings
      if (allExistingTables.includes('meetings')) {
        try {
          await db.execute(sql`TRUNCATE TABLE meetings`);
          console.log(`Truncated table: meetings`);
          truncatedTables.push('meetings');
        } catch (err) {
          console.log(`Error truncating table meetings:`, err);
        }
      }
      
      return {
        success: true,
        message: `Successfully truncated ${truncatedTables.length} tables while preserving users, entities, and subjects data.`,
        tablesAffected: truncatedTables
      };
    } catch (error) {
      console.error('Error truncating tables:', error);
      return {
        success: false,
        message: `Failed to truncate tables: ${error instanceof Error ? error.message : String(error)}`,
        tablesAffected: []
      };
    }
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
