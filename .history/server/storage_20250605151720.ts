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
const MemoryStore = session.MemoryStore;
import MySQLStoreFactory from "express-mysql-session";
const MySQLStore = MySQLStoreFactory(session);
import { db } from "./db";
import { eq, and, inArray, isNull, or, gt, desc, sql, ne } from "drizzle-orm";
import { pool } from "./db";
import { memoryStorage } from "multer";

const sessionStore = new MySQLStore({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});



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
  updateMeetingAttendee(id: number, attendeeData: Partial<MeetingAttendee): Promise<MeetingAttendee | undefined>;
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
  updateTask(id: number, taskData: Partial<MeetingAttendee>): Promise<Task | undefined>;
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

  // --- BEGIN: Add missing methods to satisfy IStorage ---

  async getMeetingsForUsers(userIds: number[]): Promise<Meeting[]> {
    // Return meetings where any attendee is in userIds
    const meetings: Meeting[] = [];
    for (const meeting of this.meetings.values()) {
      const attendees = await this.getMeetingAttendeesByMeetingId(meeting.id);
      if (attendees.some(a => userIds.includes(a.userId))) {
        meetings.push(meeting);
      }
    }
    return meetings;
  }

  async getUpcomingMeetingsForUsers(userIds: number[]): Promise<Meeting[]> {
    const now = new Date();
    const meetings: Meeting[] = [];
    for (const meeting of this.meetings.values()) {
      const attendees = await this.getMeetingAttendeesByMeetingId(meeting.id);
      if (
        attendees.some(a => userIds.includes(a.userId)) &&
        new Date(meeting.date) > now
      ) {
        meetings.push(meeting);
      }
    }
    return meetings;
  }

  async getAllSubjectsWithCreators(): Promise<(Subject & { creatorName?: string })[]> {
    return Array.from(this.subjects.values()).map(subject => {
      const creator = subject.createdBy ? this.users.get(subject.createdBy) : undefined;
      return {
        ...subject,
        creatorName: creator?.fullName
      };
    });
  }

  async getCommunicationWithFiles(id: number): Promise<CommunicationWithFiles | undefined> {
    const communication = this.communications.get(id);
    if (!communication) return undefined;
    const files = await this.getCommunicationFilesByCommunicationId(id);
    return {
      ...communication,
      files
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
      files
    };
  }

  async getAchievementBadge(id: number): Promise<AchievementBadge | undefined> {
    return this.achievementBadges.get(id);
  }

  async createAchievementBadge(badge: InsertAchievementBadge): Promise<AchievementBadge> {
    const id = this.currentAchievementBadgeId++;
    const achievementBadge: AchievementBadge = { ...badge, id };
    this.achievementBadges.set(id, achievementBadge);
    return achievementBadge;
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
    return Array.from(this.achievementBadges.values()).filter(b => b.category === category);
  }

  async getUserBadge(id: number): Promise<UserBadge | undefined> {
    return this.userBadges.get(id);
  }

  async createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const id = this.currentUserBadgeId++;
    const badge: UserBadge = { ...userBadge, id };
    this.userBadges.set(id, badge);
    return badge;
  }

  async updateUserBadge(id: number, userBadgeData: Partial<UserBadge): Promise<UserBadge | undefined> {
    const badge = this.userBadges.get(id);
    if (!badge) return undefined;
    const updatedBadge = { ...badge, ...userBadgeData };
    this.userBadges.set(id, updatedBadge);
    return updatedBadge;
  }

  async getUserBadgesByUserId(userId: number): Promise<(UserBadge & { badge: AchievementBadge })[]> {
    return Array.from(this.userBadges.values())
      .filter(b => b.userId === userId)
      .map(b => ({
        ...b,
        badge: this.achievementBadges.get(b.badgeId)!
      }));
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
    return (await this.getUserBadgesByUserId(userId)).filter(b => b.featured);
  }

  async markUserBadgesAsSeen(badgeIds: number[]): Promise<void> {
    for (const id of badgeIds) {
      const badge = this.userBadges.get(id);
      if (badge) {
        this.userBadges.set(id, { ...badge, seen: true });
      }
    }
  }

  async getPublicHearing(id: number): Promise<PublicHearing | undefined> {
    return this.publicHearings.get(id);
  }

  async getPublicHearingWithEntity(id: number): Promise<PublicHearingWithEntity | undefined> {
    const hearing = this.publicHearings.get(id);
    if (!hearing) return undefined;
    const entity = hearing.entityId ? this.entities.get(hearing.entityId) : undefined;
    return {
      ...hearing,
      entity
    };
  }

  async getPublicHearingWithFiles(id: number): Promise<PublicHearingWithFiles | undefined> {
    const hearing = this.publicHearings.get(id);
    if (!hearing) return undefined;
    const files = await this.getPublicHearingFilesByPublicHearingId(id);
    return {
      ...hearing,
      files
    };
  }

  async getPublicHearingWithEntityAndFiles(id: number): Promise<PublicHearingWithEntityAndFiles | undefined> {
    const hearing = this.publicHearings.get(id);
    if (!hearing) return undefined;
    const entity = hearing.entityId ? this.entities.get(hearing.entityId) : undefined;
    const files = await this.getPublicHearingFilesByPublicHearingId(id);
    return {
      ...hearing,
      entity,
      files
    };
  }

  async createPublicHearing(publicHearing: InsertPublicHearing): Promise<PublicHearing> {
    const id = this.currentPublicHearingId++;
    const hearing: PublicHearing = { ...publicHearing, id };
    this.publicHearings.set(id, hearing);
    return hearing;
  }

  async updatePublicHearing(id: number, publicHearingData: Partial<PublicHearing>): Promise<PublicHearing | undefined> {
    const hearing = this.publicHearings.get(id);
    if (!hearing) return undefined;
    const updated = { ...hearing, ...publicHearingData };
    this.publicHearings.set(id, updated);
    return updated;
  }

  async getAllPublicHearings(): Promise<PublicHearing[]> {
    return Array.from(this.publicHearings.values());
  }

  async getPublicHearingsByEntityId(entityId: number): Promise<PublicHearing[]> {
    return Array.from(this.publicHearings.values()).filter(h => h.entityId === entityId);
  }

  async getUpcomingPublicHearings(): Promise<PublicHearing[]> {
    const now = new Date();
    return Array.from(this.publicHearings.values()).filter(h => new Date(h.date) > now);
  }

  async getPublicHearingFile(id: number): Promise<PublicHearingFile | undefined> {
    return this.publicHearingFiles.get(id);
  }

  async createPublicHearingFile(file: InsertPublicHearingFile): Promise<PublicHearingFile> {
    const id = this.currentPublicHearingFileId++;
    const f: PublicHearingFile = { ...file, id };
    this.publicHearingFiles.set(id, f);
    return f;
  }

  async getPublicHearingFilesByPublicHearingId(publicHearingId: number): Promise<PublicHearingFile[]> {
    return Array.from(this.publicHearingFiles.values()).filter(f => f.publicHearingId === publicHearingId);
  }

  // --- END: Add missing methods to satisfy IStorage ---

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

  async updateMeetingAttendee(id: number, attendeeData: Partial<MeetingAttendee): Promise<MeetingAttendee | undefined> {
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

import { DatabaseStorage } from "db";
export const storage = new DatabaseStorage();
