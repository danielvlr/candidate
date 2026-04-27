import {
  CandidateDTO,
  ClientDTO,
  HeadhunterDTO,
  HistoryType,
  JobDTO,
  JobHistoryDTO,
  ShortlistDTO,
  ShortlistStatus,
  WarrantyDTO,
  WarrantyStatus,
} from '../../types/api';

export type ActivitySeverity = 'success' | 'danger' | 'warning' | 'info' | 'muted';
export type ActivityCategory = 'business' | 'pipeline' | 'warranty' | 'note' | 'newcomer';
export type ActivityKind =
  | 'offer_made'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'contract_signed'
  | 'candidate_started'
  | 'interview'
  | 'shortlist'
  | 'status_changed'
  | 'warranty_expiring'
  | 'warranty_breached'
  | 'warranty_expired'
  | 'new_job'
  | 'new_candidate'
  | 'new_client'
  | 'new_headhunter'
  | 'note'
  | 'other';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  category: ActivityCategory;
  severity: ActivitySeverity;
  kind: ActivityKind;
  icon: string;
  message: React.ReactNode | string;
  detail?: string;
  jobId?: number;
  candidateId?: number;
  warrantyId?: number;
  clientId?: number;
  href?: string;
}

interface BuildOptions {
  histories: JobHistoryDTO[];
  warranties: WarrantyDTO[];
  shortlists: { sl: ShortlistDTO; jobTitle?: string; clientName?: string }[];
  newJobs: JobDTO[];
  newCandidates: CandidateDTO[];
  newClients: ClientDTO[];
  newHeadhunters: HeadhunterDTO[];
  windowDays: number;
}

const HISTORY_BUSINESS_TYPES = new Set<HistoryType>([
  HistoryType.OFFER_MADE,
  HistoryType.OFFER_ACCEPTED,
  HistoryType.OFFER_REJECTED,
  HistoryType.CONTRACT_SIGNED,
  HistoryType.CANDIDATE_STARTED,
]);

const HISTORY_PIPELINE_TYPES = new Set<HistoryType>([
  HistoryType.STATUS_CHANGED,
  HistoryType.SHORTLIST_SENT,
  HistoryType.INTERVIEW_SCHEDULED,
  HistoryType.INTERVIEW_COMPLETED,
  HistoryType.TECHNICAL_TEST,
  HistoryType.FEEDBACK_RECEIVED,
  HistoryType.CANDIDATE_APPLIED,
  HistoryType.CANDIDATE_CONTACTED,
  HistoryType.REFERENCE_CHECK,
  HistoryType.CLIENT_MEETING,
]);

function kindFromHistoryType(type: HistoryType): ActivityKind {
  switch (type) {
    case HistoryType.OFFER_MADE: return 'offer_made';
    case HistoryType.OFFER_ACCEPTED: return 'offer_accepted';
    case HistoryType.OFFER_REJECTED: return 'offer_rejected';
    case HistoryType.CONTRACT_SIGNED: return 'contract_signed';
    case HistoryType.CANDIDATE_STARTED: return 'candidate_started';
    case HistoryType.INTERVIEW_SCHEDULED:
    case HistoryType.INTERVIEW_COMPLETED:
      return 'interview';
    case HistoryType.SHORTLIST_SENT: return 'shortlist';
    case HistoryType.STATUS_CHANGED: return 'status_changed';
    case HistoryType.NOTE: return 'note';
    default: return 'other';
  }
}

function kindFromWarranty(w: WarrantyDTO): ActivityKind {
  switch (w.status) {
    case WarrantyStatus.EXPIRING_SOON: return 'warranty_expiring';
    case WarrantyStatus.BREACHED: return 'warranty_breached';
    case WarrantyStatus.EXPIRED: return 'warranty_expired';
    default: return 'other';
  }
}

function categoryFromHistoryType(type: HistoryType): ActivityCategory {
  if (type === HistoryType.NOTE) return 'note';
  if (HISTORY_BUSINESS_TYPES.has(type)) return 'business';
  if (type === HistoryType.GUARANTEE_PERIOD) return 'warranty';
  if (HISTORY_PIPELINE_TYPES.has(type)) return 'pipeline';
  return 'pipeline';
}

function severityFromHistoryType(type: HistoryType): ActivitySeverity {
  switch (type) {
    case HistoryType.OFFER_ACCEPTED:
    case HistoryType.CONTRACT_SIGNED:
    case HistoryType.CANDIDATE_STARTED:
      return 'success';
    case HistoryType.OFFER_REJECTED:
      return 'danger';
    case HistoryType.GUARANTEE_PERIOD:
    case HistoryType.OFFER_MADE:
      return 'warning';
    case HistoryType.NOTE:
      return 'muted';
    default:
      return 'info';
  }
}

function iconFromHistoryType(type: HistoryType): string {
  switch (type) {
    case HistoryType.OFFER_MADE:
    case HistoryType.OFFER_ACCEPTED:
      return '🤝';
    case HistoryType.OFFER_REJECTED:
      return '❌';
    case HistoryType.CONTRACT_SIGNED:
      return '📝';
    case HistoryType.CANDIDATE_STARTED:
      return '🎉';
    case HistoryType.INTERVIEW_SCHEDULED:
    case HistoryType.INTERVIEW_COMPLETED:
      return '📅';
    case HistoryType.SHORTLIST_SENT:
      return '📋';
    case HistoryType.TECHNICAL_TEST:
      return '🧪';
    case HistoryType.FEEDBACK_RECEIVED:
      return '💬';
    case HistoryType.STATUS_CHANGED:
      return '🔄';
    case HistoryType.CANDIDATE_APPLIED:
    case HistoryType.CANDIDATE_CONTACTED:
      return '👤';
    case HistoryType.CLIENT_MEETING:
      return '🏢';
    case HistoryType.REFERENCE_CHECK:
      return '🔍';
    case HistoryType.GUARANTEE_PERIOD:
      return '🛡️';
    case HistoryType.NOTE:
      return '🗒️';
    default:
      return '•';
  }
}

function humanMessageFromHistory(entry: JobHistoryDTO): string {
  const candidate = entry.candidateName ? entry.candidateName : null;
  const job = entry.jobTitle ?? `vaga #${entry.jobId}`;
  const headhunter = entry.headhunterName;

  switch (entry.type) {
    case HistoryType.OFFER_ACCEPTED:
      return candidate
        ? `${candidate} aceitou proposta · ${job}`
        : `Proposta aceita · ${job}`;
    case HistoryType.OFFER_REJECTED:
      return candidate
        ? `${candidate} recusou proposta · ${job}`
        : `Proposta recusada · ${job}`;
    case HistoryType.OFFER_MADE:
      return candidate
        ? `Proposta enviada para ${candidate} · ${job}`
        : `Proposta enviada · ${job}`;
    case HistoryType.CONTRACT_SIGNED:
      return candidate
        ? `Contrato assinado: ${candidate} · ${job}`
        : `Contrato assinado · ${job}`;
    case HistoryType.CANDIDATE_STARTED:
      return candidate
        ? `${candidate} começou em ${job}`
        : `Candidato iniciou em ${job}`;
    case HistoryType.SHORTLIST_SENT:
      return headhunter
        ? `${headhunter} enviou shortlist · ${job}`
        : `Shortlist enviada · ${job}`;
    case HistoryType.INTERVIEW_SCHEDULED:
      return candidate
        ? `Entrevista marcada com ${candidate} · ${job}`
        : `Entrevista agendada · ${job}`;
    case HistoryType.INTERVIEW_COMPLETED:
      return candidate
        ? `Entrevista realizada com ${candidate} · ${job}`
        : `Entrevista realizada · ${job}`;
    case HistoryType.STATUS_CHANGED:
      return `${job}: ${entry.title}`;
    case HistoryType.NOTE:
      return headhunter
        ? `${headhunter} anotou em ${job}`
        : `Nota em ${job}`;
    default:
      return entry.title;
  }
}

function severityFromWarranty(w: WarrantyDTO): ActivitySeverity {
  if (w.status === WarrantyStatus.BREACHED) return 'danger';
  if (w.status === WarrantyStatus.EXPIRED) return 'danger';
  if (w.status === WarrantyStatus.EXPIRING_SOON) return 'warning';
  return 'info';
}

function messageFromWarranty(w: WarrantyDTO): string {
  const who = w.candidateName ?? 'candidato';
  const where = w.clientName ?? w.jobTitle ?? '';
  const tail = where ? ` · ${where}` : '';
  switch (w.status) {
    case WarrantyStatus.BREACHED:
      return `Garantia quebrada: ${who} saiu${tail}`;
    case WarrantyStatus.EXPIRED:
      return `Garantia expirou: ${who}${tail}`;
    case WarrantyStatus.EXPIRING_SOON:
      return `Garantia expira em ${w.daysRemaining ?? '?'}d: ${who}${tail}`;
    default:
      return `Garantia ativa: ${who}${tail}`;
  }
}

function timestampFromWarranty(w: WarrantyDTO): string {
  return w.breachedAt ?? w.notificationSentAt ?? w.updatedAt ?? w.createdAt;
}

function severityFromShortlistStatus(status: ShortlistStatus): ActivitySeverity {
  switch (status) {
    case ShortlistStatus.APPROVED:
    case ShortlistStatus.INTERVIEW_REQUESTED:
      return 'success';
    case ShortlistStatus.REJECTED:
    case ShortlistStatus.WITHDRAWN:
      return 'danger';
    case ShortlistStatus.VIEWED:
    case ShortlistStatus.UNDER_REVIEW:
      return 'info';
    default:
      return 'info';
  }
}

function messageFromShortlist(sl: ShortlistDTO, jobTitle?: string, clientName?: string): string {
  const job = jobTitle ?? sl.jobTitle ?? `vaga #${sl.jobId}`;
  const where = clientName ? ` · ${clientName}` : '';
  switch (sl.status) {
    case ShortlistStatus.SENT:
      return `Shortlist enviada (${sl.candidateName}) · ${job}${where}`;
    case ShortlistStatus.VIEWED:
      return `Shortlist vista pelo cliente (${sl.candidateName}) · ${job}${where}`;
    case ShortlistStatus.APPROVED:
      return `Cliente aprovou ${sl.candidateName} · ${job}${where}`;
    case ShortlistStatus.REJECTED:
      return `Cliente recusou ${sl.candidateName} · ${job}${where}`;
    case ShortlistStatus.INTERVIEW_REQUESTED:
      return `Cliente pediu entrevista com ${sl.candidateName} · ${job}${where}`;
    default:
      return `Shortlist atualizada (${sl.candidateName}) · ${job}${where}`;
  }
}

export function buildActivityFeed(opts: BuildOptions): ActivityEvent[] {
  const cutoff = Date.now() - opts.windowDays * 86400000;
  const events: ActivityEvent[] = [];

  for (const h of opts.histories) {
    if (!h.createdAt) continue;
    if (new Date(h.createdAt).getTime() < cutoff) continue;
    events.push({
      id: `h-${h.id}`,
      timestamp: h.createdAt,
      category: categoryFromHistoryType(h.type),
      severity: severityFromHistoryType(h.type),
      kind: kindFromHistoryType(h.type),
      icon: iconFromHistoryType(h.type),
      message: humanMessageFromHistory(h),
      detail: h.description && h.description !== h.title ? h.description : undefined,
      jobId: h.jobId,
      candidateId: h.candidateId,
      href: h.jobId ? `/jobs/${h.jobId}` : undefined,
    });
  }

  for (const w of opts.warranties) {
    const ts = timestampFromWarranty(w);
    if (!ts) continue;
    events.push({
      id: `w-${w.id}`,
      timestamp: ts,
      category: 'warranty',
      severity: severityFromWarranty(w),
      kind: kindFromWarranty(w),
      icon: '🛡️',
      message: messageFromWarranty(w),
      jobId: w.jobId,
      warrantyId: w.id,
      href: `/warranties`,
    });
  }

  for (const item of opts.shortlists) {
    if (!item.sl.sentAt) continue;
    if (new Date(item.sl.sentAt).getTime() < cutoff) continue;
    events.push({
      id: `s-${item.sl.id}`,
      timestamp: item.sl.respondedAt ?? item.sl.viewedAt ?? item.sl.sentAt,
      category: 'pipeline',
      severity: severityFromShortlistStatus(item.sl.status),
      kind: 'shortlist',
      icon: '📋',
      message: messageFromShortlist(item.sl, item.jobTitle, item.clientName),
      jobId: item.sl.jobId,
      href: `/jobs/${item.sl.jobId}`,
    });
  }

  for (const j of opts.newJobs) {
    if (!j.createdAt || !j.id) continue;
    if (new Date(j.createdAt).getTime() < cutoff) continue;
    events.push({
      id: `nj-${j.id}`,
      timestamp: j.createdAt,
      category: 'newcomer',
      severity: 'info',
      kind: 'new_job',
      icon: '➕',
      message: `Nova vaga: ${j.title}${j.companyName ? ` · ${j.companyName}` : ''}`,
      jobId: j.id,
      href: `/jobs/${j.id}`,
    });
  }
  for (const c of opts.newCandidates) {
    if (!c.createdAt || !c.id) continue;
    if (new Date(c.createdAt).getTime() < cutoff) continue;
    events.push({
      id: `nc-${c.id}`,
      timestamp: c.createdAt,
      category: 'newcomer',
      severity: 'info',
      kind: 'new_candidate',
      icon: '👤',
      message: `Novo candidato: ${c.fullName}`,
      candidateId: c.id,
      href: `/candidates/${c.id}`,
    });
  }
  for (const cl of opts.newClients) {
    if (!cl.createdAt || !cl.id) continue;
    if (new Date(cl.createdAt).getTime() < cutoff) continue;
    events.push({
      id: `ncl-${cl.id}`,
      timestamp: cl.createdAt,
      category: 'newcomer',
      severity: 'info',
      kind: 'new_client',
      icon: '🏢',
      message: `Nova empresa: ${cl.companyName}`,
      clientId: cl.id,
      href: `/clients/${cl.id}`,
    });
  }
  for (const hh of opts.newHeadhunters) {
    if (!hh.createdAt || !hh.id) continue;
    if (new Date(hh.createdAt).getTime() < cutoff) continue;
    events.push({
      id: `nh-${hh.id}`,
      timestamp: hh.createdAt,
      category: 'newcomer',
      severity: 'info',
      kind: 'new_headhunter',
      icon: '🧑‍💼',
      message: `Novo headhunter: ${hh.fullName}`,
      href: `/headhunters`,
    });
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events;
}

export interface ActivityDigest {
  offersAccepted: number;
  contractsSigned: number;
  warrantiesExpiring: number;
  warrantiesBreached: number;
  interviews: number;
}

export function buildDigest(events: ActivityEvent[], windowDays = 7): ActivityDigest {
  const cutoff = Date.now() - windowDays * 86400000;
  const recent = events.filter((e) => new Date(e.timestamp).getTime() >= cutoff);

  return {
    offersAccepted: recent.filter((e) => e.kind === 'offer_accepted').length,
    contractsSigned: recent.filter((e) => e.kind === 'contract_signed').length,
    warrantiesExpiring: recent.filter((e) => e.kind === 'warranty_expiring').length,
    warrantiesBreached: recent.filter((e) => e.kind === 'warranty_breached').length,
    interviews: recent.filter((e) => e.kind === 'interview').length,
  };
}

const DIGEST_KIND_GROUPS: Record<string, ActivityKind[]> = {
  offer_accepted: ['offer_accepted'],
  contract_signed: ['contract_signed', 'candidate_started'],
  interview: ['interview'],
  warranty_expiring: ['warranty_expiring'],
  warranty_breached: ['warranty_breached', 'warranty_expired'],
};

export function eventsByDigestKey(
  events: ActivityEvent[],
  digestKey: keyof ActivityDigest,
): ActivityEvent[] {
  const map: Record<keyof ActivityDigest, string> = {
    offersAccepted: 'offer_accepted',
    contractsSigned: 'contract_signed',
    interviews: 'interview',
    warrantiesExpiring: 'warranty_expiring',
    warrantiesBreached: 'warranty_breached',
  };
  const kinds = DIGEST_KIND_GROUPS[map[digestKey]] ?? [];
  return events.filter((e) => kinds.includes(e.kind));
}

export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAbsolute(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type DayBucket = 'today' | 'yesterday' | 'thisWeek' | 'older';

export function dayBucket(dateStr: string): DayBucket {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const sevenDaysAgo = startOfToday - 6 * 86400000;
  const t = date.getTime();
  if (t >= startOfToday) return 'today';
  if (t >= startOfYesterday) return 'yesterday';
  if (t >= sevenDaysAgo) return 'thisWeek';
  return 'older';
}

export const DAY_BUCKET_LABEL: Record<DayBucket, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  thisWeek: 'Esta semana',
  older: 'Mais antigos',
};

export type ActivityFilter = 'all' | 'business' | 'pipeline' | 'warranty' | 'newcomer' | 'note';

export function filterEvents(events: ActivityEvent[], filter: ActivityFilter): ActivityEvent[] {
  if (filter === 'all') return events.filter((e) => e.category !== 'note');
  return events.filter((e) => e.category === filter);
}
