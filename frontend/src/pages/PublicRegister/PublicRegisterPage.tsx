import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { PublicInvitationResponse, SelfRegisterRequest } from '../../types/api';
import { useToast } from '../../components/ui';

type PageState = 'loading' | 'invalid' | 'form' | 'success';

const PublicRegisterPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<PublicInvitationResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    if (!token) {
      setPageState('invalid');
      return;
    }
    apiService
      .getPublicInvitation(token)
      .then((data) => {
        setInvitation(data);
        setFullName(data.fullName || '');
        setPageState('form');
      })
      .catch(() => {
        setPageState('invalid');
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invitation) return;

    const body: SelfRegisterRequest = {
      fullName: fullName.trim(),
      headline: headline.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      summary: summary.trim() || undefined,
      consentAccepted: true,
      consentVersion: invitation.consentVersion,
    };

    try {
      setSubmitting(true);
      await apiService.submitSelfRegister(token, body);
      setPageState('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      if (message === 'INVITATION_EXPIRED') {
        setPageState('invalid');
      } else {
        addToast({
          type: 'error',
          title: 'Erro ao enviar cadastro',
          message: 'Tente novamente em alguns instantes.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = fullName.trim().length > 0 && consentAccepted && !submitting;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando convite...</p>
        </div>
      </div>
    );
  }

  // ── Invalid / Expired ────────────────────────────────────────────────────
  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/15">
            <svg
              className="h-7 w-7 text-error-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Convite inválido ou expirado
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Este link de convite não é mais válido. Pode ter sido utilizado anteriormente ou já
            expirou. Solicite um novo convite ao headhunter responsável.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Ir para o início
          </button>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/15">
            <svg
              className="h-7 w-7 text-success-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Cadastro recebido!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Suas informações foram enviadas com sucesso. Você receberá um e-mail assim que o
            headhunter responsável aprovar seu perfil.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-transparent px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Ir para o início
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="mx-auto w-full max-w-xl">
        {/* Logo / brand area */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-1">
            Convite de cadastro
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Complete seu perfil
          </h1>
          {invitation && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Convidado por{' '}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {invitation.invitedByHeadhunterName}
              </span>
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 shadow-xl space-y-6"
        >
          {/* Read-only email banner */}
          {invitation && (
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
              <svg
                className="h-4 w-4 text-gray-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">{invitation.email}</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">Email (fixo)</span>
            </div>
          )}

          {/* Full name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nome completo <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Cargo / Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Ex: Desenvolvedor Full Stack Sênior"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Cidade
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: São Paulo"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Estado
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Ex: SP"
                maxLength={2}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              LinkedIn
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/seu-perfil"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Resumo profissional
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="Conte um pouco sobre sua trajetória profissional..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
            />
          </div>

          {/* Consent checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="consent"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
            />
            <label htmlFor="consent" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer leading-relaxed">
              Li e aceito a{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                Política de Privacidade (LGPD)
              </a>{' '}
              e o{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                Termo de Uso
              </a>
              .{' '}
              <span className="text-error-500">*</span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && (
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {submitting ? 'Enviando...' : 'Enviar cadastro'}
          </button>
        </form>

        {invitation && (
          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-600">
            Convite válido até{' '}
            {new Date(invitation.expiresAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
};

export default PublicRegisterPage;
