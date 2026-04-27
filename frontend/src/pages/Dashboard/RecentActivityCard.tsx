import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardBody, CardHeader, EmptyState } from '../../components/ui';
import {
  ActivityDigest,
  ActivityEvent,
  ActivityFilter,
  ActivitySeverity,
  DAY_BUCKET_LABEL,
  DayBucket,
  dayBucket,
  eventsByDigestKey,
  filterEvents,
  formatAbsolute,
  formatRelative,
} from './activityFeed';

interface RecentActivityCardProps {
  events: ActivityEvent[];
  digest: ActivityDigest;
  scopeLabel?: string;
  loading?: boolean;
}

type DigestKey = keyof ActivityDigest;

const SEVERITY_BORDER: Record<ActivitySeverity, string> = {
  success: 'border-l-emerald-500',
  danger: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-400',
  muted: 'border-l-gray-300 dark:border-l-gray-600',
};

const SEVERITY_TEXT: Record<ActivitySeverity, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  danger: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
  muted: 'text-gray-500 dark:text-gray-500',
};

interface DigestKpiProps {
  digestKey: DigestKey;
  icon: string;
  label: string;
  value: number;
  tone: 'success' | 'danger' | 'warning' | 'info';
  active: boolean;
  onClick: () => void;
}

const DigestKpi: React.FC<DigestKpiProps> = ({ icon, label, value, tone, active, onClick }) => {
  const tones = {
    success:
      'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300',
    danger:
      'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300',
    warning:
      'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300',
    info: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300',
  };
  const ringTone = {
    success: 'ring-emerald-400',
    danger: 'ring-red-400',
    warning: 'ring-amber-400',
    info: 'ring-blue-400',
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${tones[tone]} ${
        active ? `ring-2 ring-offset-1 dark:ring-offset-gray-900 ${ringTone}` : ''
      }`}
    >
      <span aria-hidden>{icon}</span>
      <span className="font-bold tabular-nums">{value}</span>
      <span className="opacity-90">{label}</span>
    </button>
  );
};

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: 'all', label: 'Tudo' },
  { key: 'business', label: 'Negócios' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'warranty', label: 'Garantia' },
  { key: 'newcomer', label: 'Novos' },
  { key: 'note', label: 'Notas' },
];

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  events,
  digest,
  scopeLabel,
  loading,
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [activeKpi, setActiveKpi] = useState<DigestKey | null>(null);

  const baseFiltered = useMemo(() => {
    if (activeKpi) {
      return eventsByDigestKey(events, activeKpi);
    }
    return filterEvents(events, filter);
  }, [events, filter, activeKpi]);

  const visible = useMemo(() => baseFiltered.slice(0, 30), [baseFiltered]);

  const groups = useMemo(() => {
    const map = new Map<DayBucket, ActivityEvent[]>();
    for (const e of visible) {
      const b = dayBucket(e.timestamp);
      const arr = map.get(b);
      if (arr) arr.push(e);
      else map.set(b, [e]);
    }
    const order: DayBucket[] = ['today', 'yesterday', 'thisWeek', 'older'];
    return order
      .filter((b) => map.has(b))
      .map((b) => ({ bucket: b, items: map.get(b) ?? [] }));
  }, [visible]);

  const hasAnyEvent = events.length > 0;

  const handleKpiClick = (key: DigestKey) => {
    setActiveKpi((prev) => (prev === key ? null : key));
    setFilter('all');
  };

  const handleFilterClick = (f: ActivityFilter) => {
    setFilter(f);
    setActiveKpi(null);
  };

  const activeKpiLabel: Record<DigestKey, string> = {
    offersAccepted: 'Mostrando: ofertas aceitas',
    contractsSigned: 'Mostrando: contratos assinados',
    interviews: 'Mostrando: entrevistas',
    warrantiesExpiring: 'Mostrando: garantias expirando',
    warrantiesBreached: 'Mostrando: garantias quebradas',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
            Atividade Recente
            {scopeLabel && (
              <span className="text-xs font-normal text-gray-400 ml-2">{scopeLabel}</span>
            )}
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">últimos 30 dias</span>
        </div>
      </CardHeader>
      <CardBody>
        {/* Digest KPI strip */}
        <div className="flex flex-wrap gap-2 mb-3">
          <DigestKpi
            digestKey="offersAccepted"
            icon="🤝"
            label="ofertas aceitas"
            value={digest.offersAccepted}
            tone="success"
            active={activeKpi === 'offersAccepted'}
            onClick={() => handleKpiClick('offersAccepted')}
          />
          <DigestKpi
            digestKey="contractsSigned"
            icon="📝"
            label="contratos"
            value={digest.contractsSigned}
            tone="success"
            active={activeKpi === 'contractsSigned'}
            onClick={() => handleKpiClick('contractsSigned')}
          />
          <DigestKpi
            digestKey="interviews"
            icon="📅"
            label="entrevistas"
            value={digest.interviews}
            tone="info"
            active={activeKpi === 'interviews'}
            onClick={() => handleKpiClick('interviews')}
          />
          <DigestKpi
            digestKey="warrantiesExpiring"
            icon="🛡️"
            label="garantias expirando"
            value={digest.warrantiesExpiring}
            tone="warning"
            active={activeKpi === 'warrantiesExpiring'}
            onClick={() => handleKpiClick('warrantiesExpiring')}
          />
          <DigestKpi
            digestKey="warrantiesBreached"
            icon="⚠️"
            label="quebradas"
            value={digest.warrantiesBreached}
            tone="danger"
            active={activeKpi === 'warrantiesBreached'}
            onClick={() => handleKpiClick('warrantiesBreached')}
          />
        </div>

        {/* Active KPI banner */}
        {activeKpi && (
          <div className="flex items-center justify-between gap-2 mb-3 px-3 py-1.5 rounded-md bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
            <span className="text-xs text-brand-700 dark:text-brand-300">
              {activeKpiLabel[activeKpi]}
              {(activeKpi === 'warrantiesExpiring' || activeKpi === 'warrantiesBreached') && (
                <button
                  type="button"
                  onClick={() => navigate('/warranties')}
                  className="ml-3 underline hover:no-underline"
                >
                  ir para garantias →
                </button>
              )}
            </span>
            <button
              type="button"
              onClick={() => setActiveKpi(null)}
              className="text-xs text-brand-600 dark:text-brand-300 hover:opacity-80"
            >
              limpar
            </button>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex flex-wrap gap-1 mb-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1 w-fit">
          {FILTERS.map((f) => {
            const active = !activeKpi && filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFilterClick(f.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title={hasAnyEvent ? 'Nada neste filtro' : 'Sem atividade nas últimas 4 semanas'}
            description={
              hasAnyEvent
                ? 'Tente outro filtro acima ou clique em outro KPI.'
                : 'Quando houver propostas, contratos, entrevistas ou garantias, aparecem aqui.'
            }
          />
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {groups.map((g) => (
              <div key={g.bucket}>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 sticky top-0 bg-white dark:bg-gray-900 py-1">
                  {DAY_BUCKET_LABEL[g.bucket]}
                </h4>
                <div className="space-y-1.5">
                  {g.items.map((event) => {
                    const clickable = Boolean(event.href);
                    return (
                      <div
                        key={event.id}
                        onClick={() => event.href && navigate(event.href)}
                        className={`flex items-start gap-2.5 p-2 pl-3 rounded-r-md border-l-2 ${SEVERITY_BORDER[event.severity]} bg-gray-50/40 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors ${
                          clickable ? 'cursor-pointer' : ''
                        }`}
                      >
                        <span
                          className={`text-base leading-none flex-shrink-0 mt-0.5 ${SEVERITY_TEXT[event.severity]}`}
                          aria-hidden
                        >
                          {event.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              event.severity === 'muted'
                                ? 'text-gray-500 dark:text-gray-500'
                                : 'text-gray-900 dark:text-white/90'
                            }`}
                          >
                            {event.message}
                          </p>
                          {event.detail && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                              {event.detail}
                            </p>
                          )}
                          <span
                            className="text-[11px] text-gray-400 dark:text-gray-500"
                            title={formatAbsolute(event.timestamp)}
                          >
                            {formatRelative(event.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
