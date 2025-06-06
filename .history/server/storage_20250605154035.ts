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
// Importing MySQL session store factory
import MySQLStoreFactory from "express-mysql-session";
const MySQLStore = MySQLStoreFactory(session);

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



import { DatabaseStorage } from "./databaseStorage";
export const storage = new DatabaseStorage();


