// API Types based on backend DTOs

export interface ExperienceDTO {
  id?: number;
  jobTitle: string;
  companyName: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface EducationDTO {
  id?: number;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface CandidateDTO {
  id?: number;
  fullName: string;
  email: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  headline?: string;
  desiredSalary?: number;
  summary?: string;
  skills?: string;
  experiences?: ExperienceDTO[];
  education?: EducationDTO[];
  status?: CandidateStatus;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  cvFilePath?: string;
  profilePictureUrl?: string;
  availabilityDate?: string;
  willingToRelocate?: boolean;
  workPreference?: WorkPreference;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobDTO {
  id?: number;
  title: string;
  description: string;
  companyName: string;
  clientId?: number;
  client?: ClientSummaryDTO;
  location: string;
  jobType: JobType;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  minSalary?: number;
  maxSalary?: number;
  skills?: string;
  benefits?: string;
  status: JobStatus;
  serviceCategory?: ServiceCategory;
  pipelineStage?: PipelineStage;
  featured: boolean;
  urgent: boolean;
  applicationDeadline?: string;
  guaranteeDays?: number;
  applicationsCount?: number;
  viewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobApplicationDTO {
  id?: number;
  candidateId: number;
  jobId: number;
  status: ApplicationStatus;
  coverLetter?: string;
  applicationDate?: string;
  candidate?: CandidateDTO;
  job?: JobDTO;
}

// Enums
export enum CandidateStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  HIRED = 'HIRED',
  BLACKLISTED = 'BLACKLISTED'
}

export enum WorkPreference {
  REMOTE = 'REMOTE',
  ONSITE = 'ONSITE',
  HYBRID = 'HYBRID'
}

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  FREELANCE = 'FREELANCE'
}

export enum WorkMode {
  REMOTE = 'REMOTE',
  ONSITE = 'ONSITE',
  HYBRID = 'HYBRID'
}

export enum ExperienceLevel {
  ENTRY = 'ENTRY',
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD'
}

export enum JobStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
  DRAFT = 'DRAFT'
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEWED = 'INTERVIEWED',
  TECHNICAL_TEST = 'TECHNICAL_TEST',
  OFFER_MADE = 'OFFER_MADE',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum ServiceCategory {
  PROJETOS = 'PROJETOS',
  NOSSO_HEADHUNTER = 'NOSSO_HEADHUNTER',
  TATICAS = 'TATICAS',
  EXECUTIVAS = 'EXECUTIVAS'
}

export enum PipelineStage {
  SOURCING = 'SOURCING',
  SCREENING = 'SCREENING',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  WARRANTY = 'WARRANTY'
}

export enum WarrantyStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  BREACHED = 'BREACHED'
}

// API Response Types
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}

// Filter Types
export interface CandidateFilters {
  headline?: string;
  city?: string;
  minSalary?: number;
  maxSalary?: number;
  workPreference?: WorkPreference;
  status?: CandidateStatus;
}

export interface JobFilters {
  location?: string;
  companyName?: string;
  jobType?: JobType;
  workMode?: WorkMode;
  experienceLevel?: ExperienceLevel;
  minSalary?: number;
  maxSalary?: number;
  clientId?: number;
}

// Request Types
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

// Client/Company Types
export interface ClientDTO {
  id?: number;
  companyName: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  contactPersonName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  linkedinUrl?: string;
  industry?: string;
  companySize?: string;
  description?: string;
  notes?: string;
  logoUrl?: string;
  status?: ClientStatus;
  type?: ClientType;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientSummaryDTO {
  id: number;
  companyName: string;
  contactPersonName?: string;
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  state?: string;
  industry?: string;
  type?: ClientType;
  logoUrl?: string;
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PROSPECT = 'PROSPECT'
}

export enum ClientType {
  STARTUP = 'STARTUP',
  SME = 'SME',
  ENTERPRISE = 'ENTERPRISE',
  MULTINATIONAL = 'MULTINATIONAL',
  GOVERNMENT = 'GOVERNMENT',
  NGO = 'NGO',
  CONSULTING = 'CONSULTING'
}

export interface ClientFilters {
  companyName?: string;
  city?: string;
  industry?: string;
  status?: ClientStatus;
  type?: ClientType;
}

// Job History Types
export interface JobHistoryDTO {
  id: number;
  jobId: number;
  jobTitle?: string;
  headhunterId?: number;
  headhunterName?: string;
  candidateId?: number;
  candidateName?: string;
  type: HistoryType;
  title: string;
  description?: string;
  status: HistoryStatus;
  scheduledDate?: string;
  completedAt?: string;
  createdAt: string;
  metadata?: string;
}

export interface JobHistoryCreateRequest {
  jobId: number;
  headhunterId?: number;
  candidateId?: number;
  type: HistoryType;
  title: string;
  description?: string;
  scheduledDate?: string;
  status?: HistoryStatus;
  metadata?: string;
}

export enum HistoryType {
  NOTE = 'NOTE',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  FEEDBACK_RECEIVED = 'FEEDBACK_RECEIVED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  SHORTLIST_SENT = 'SHORTLIST_SENT',
  CANDIDATE_APPLIED = 'CANDIDATE_APPLIED',
  CANDIDATE_CONTACTED = 'CANDIDATE_CONTACTED',
  CLIENT_MEETING = 'CLIENT_MEETING',
  TECHNICAL_TEST = 'TECHNICAL_TEST',
  REFERENCE_CHECK = 'REFERENCE_CHECK',
  OFFER_MADE = 'OFFER_MADE',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_REJECTED = 'OFFER_REJECTED',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  CANDIDATE_STARTED = 'CANDIDATE_STARTED',
  GUARANTEE_PERIOD = 'GUARANTEE_PERIOD',
  OTHER = 'OTHER'
}

export enum HistoryStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Shortlist Types
export interface ShortlistDTO {
  id: number;
  jobId: number;
  jobTitle?: string;
  candidateId: number;
  candidateName: string;
  candidateEmail?: string;
  candidateProfilePictureUrl?: string;
  headhunterId: number;
  headhunterName?: string;
  status: ShortlistStatus;
  sentAt: string;
  viewedAt?: string;
  respondedAt?: string;
  notes?: string;
  clientFeedback?: string;
  presentationText?: string;
  positionInShortlist?: number;
}

export interface ShortlistCreateRequest {
  jobId: number;
  candidateIds: number[];
  headhunterId: number;
  notes?: string;
  presentationText?: string;
}

export enum ShortlistStatus {
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INTERVIEW_REQUESTED = 'INTERVIEW_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

// Assessorado Types
export interface AssessoradoDTO {
  id?: number;
  candidateId: number;
  candidate?: CandidateDTO;
  seniorId: number;
  seniorName?: string;
  advisoryStartDate: string;
  advisoryEndDate?: string;
  specializations?: string;
  objectives?: string;
  currentPhase: AssessoradoPhase;
  notes?: string;
  status: AssessoradoStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessoradoCreateRequest {
  candidateId: number;
  seniorId: number;
  advisoryStartDate: string;
  advisoryEndDate?: string;
  specializations?: string;
  objectives?: string;
  currentPhase?: AssessoradoPhase;
  notes?: string;
}

export enum AssessoradoPhase {
  ONBOARDING = 'ONBOARDING',
  ACTIVE_SEARCH = 'ACTIVE_SEARCH',
  INTERVIEW_PREP = 'INTERVIEW_PREP',
  NEGOTIATION = 'NEGOTIATION',
  PLACED = 'PLACED',
  COMPLETED = 'COMPLETED'
}

export enum AssessoradoStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface AssessoradoHistoryDTO {
  id: number;
  assessoradoId: number;
  type: AssessoradoHistoryType;
  title: string;
  description?: string;
  createdAt: string;
}

export enum AssessoradoHistoryType {
  NOTE = 'NOTE',
  PHASE_CHANGED = 'PHASE_CHANGED',
  MEETING = 'MEETING',
  CV_REVIEW = 'CV_REVIEW',
  INTERVIEW_PREP = 'INTERVIEW_PREP',
  JOB_SUGGESTED = 'JOB_SUGGESTED',
  JOB_APPLIED = 'JOB_APPLIED',
  FEEDBACK = 'FEEDBACK'
}

export interface JobMatchDTO {
  job: JobDTO;
  matchScore: number;
  matchingSkills: string[];
  matchReasons: string[];
}

// Warranty Types
export interface WarrantyDTO {
  id: number;
  jobId: number;
  jobTitle?: string;
  jobApplicationId?: number;
  headhunterId?: number;
  headhunterName?: string;
  candidateName?: string;
  clientName?: string;
  contactPersonName?: string;
  contactEmail?: string;
  serviceCategory: ServiceCategory;
  guaranteeDays: number;
  startDate: string;
  endDate: string;
  status: WarrantyStatus;
  notificationSentAt?: string;
  breachedAt?: string;
  breachReason?: string;
  daysRemaining?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface WarrantyRuleDTO {
  id: number;
  serviceCategory: ServiceCategory;
  defaultDays: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WarrantyBreachRequest {
  reason: string;
}

// Headhunter Types
export interface HeadhunterDTO {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  seniority?: string;
  responsibleAreas?: string;
  fixedCost?: number;
  variableCost?: number;
  status?: string;
  linkedinUrl?: string;
  biography?: string;
  profilePictureUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Jestor Sync Types
export interface SyncResultDTO {
  entity: string;
  created: number;
  updated: number;
  errors: number;
  total: number;
  syncedAt: string;
  errorMessages: string[];
}

export interface SyncLogDTO {
  id: number;
  source: string;
  entity: string;
  recordsCreated: number;
  recordsUpdated: number;
  recordsErrors: number;
  status: string;
  errorDetails: string | null;
  startedAt: string;
  completedAt: string;
}