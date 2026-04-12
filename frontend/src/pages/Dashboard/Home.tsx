import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import { Card, CardBody, CardHeader, EmptyState, SkeletonStatCard } from "../../components/ui";

const statCards = [
  {
    label: "Candidatos Ativos",
    value: "-",
    iconBg: "bg-success-50 dark:bg-success-500/10",
    iconColor: "text-success-500",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Vagas Abertas",
    value: "-",
    iconBg: "bg-brand-50 dark:bg-brand-500/10",
    iconColor: "text-brand-500",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
      </svg>
    ),
  },
  {
    label: "Aplicações",
    value: "-",
    iconBg: "bg-purple-50 dark:bg-purple-500/10",
    iconColor: "text-purple-500",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Contratações",
    value: "-",
    iconBg: "bg-warning-50 dark:bg-warning-500/10",
    iconColor: "text-warning-500",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <PageMeta
        title="Sistema de Gestão de Candidatos | Dashboard"
        description="Dashboard principal do sistema de gestão de candidatos"
      />
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90 mb-2">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Bem-vindo ao sistema de gestão de candidatos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
            : statCards.map((stat) => (
                <Card key={stat.label} hover>
                  <CardBody>
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${stat.iconBg} ${stat.iconColor} flex-shrink-0`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white/90">{stat.value}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">Acesso Rápido</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <a
                  href="/candidates"
                  className="flex items-center gap-3 p-3 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500/20">
                    <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-brand-700 dark:text-brand-400">Gerenciar Candidatos</span>
                </a>
                <a
                  href="/jobs"
                  className="flex items-center gap-3 p-3 rounded-lg bg-success-50 hover:bg-success-100 dark:bg-success-500/10 dark:hover:bg-success-500/20 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success-500/20">
                    <svg className="w-4 h-4 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <span className="font-medium text-success-700 dark:text-success-400">Gerenciar Vagas</span>
                </a>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">Atividades Recentes</h3>
            </CardHeader>
            <CardBody>
              <EmptyState
                title="Nenhuma atividade recente"
                description="As atividades aparecerão aqui conforme você usar o sistema."
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
