import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { SyncResultDTO, SyncLogDTO } from '../../types/api';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  useToast,
} from '../../components/ui';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variants: Record<string, string> = {
    SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400',
    PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400',
  };
  const cls = variants[status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
};

const formatDate = (iso: string) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('pt-BR');
  } catch {
    return iso;
  }
};

const JestorSyncPage: React.FC = () => {
  const { addToast } = useToast();

  // Connection test state
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResultDTO[]>([]);

  // History state
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState<SyncLogDTO[]>([]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await apiService.getJestorSyncHistory(0, 20);
      setHistory(data.content ?? []);
    } catch {
      addToast({ type: 'error', title: 'Erro ao carregar historico de sincronizacao' });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      await apiService.testJestorConnection();
      setConnectionResult({ ok: true, message: 'Conexao estabelecida com sucesso.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao conectar com o Jestor.';
      setConnectionResult({ ok: false, message: msg });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResults([]);
    try {
      const results = await apiService.triggerJestorSync();
      setSyncResults(results ?? []);
      addToast({ type: 'success', title: 'Sincronizacao concluida' });
      fetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao sincronizar.';
      addToast({ type: 'error', title: msg });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">
            Integracao Jestor
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie a sincronizacao de dados entre o sistema e o Jestor
          </p>
        </div>

        {/* Connection card */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
              Conexao
            </h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Button
                variant="outline"
                size="sm"
                loading={testingConnection}
                onClick={handleTestConnection}
              >
                Testar Conexao
              </Button>
              {connectionResult && (
                <span
                  className={`text-sm font-medium ${
                    connectionResult.ok
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {connectionResult.ok ? '✓ ' : '✗ '}
                  {connectionResult.message}
                </span>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Sync card */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
              Sincronizacao
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Button
                variant="primary"
                size="sm"
                loading={syncing}
                onClick={handleSync}
              >
                Sincronizar Agora
              </Button>

              {syncResults.length > 0 && (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Entidade
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Criados
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Atualizados
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Erros
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {syncResults.map((r) => (
                        <tr
                          key={r.entity}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white/90">
                            {r.entity}
                          </td>
                          <td className="py-3 pr-4 text-green-700 dark:text-green-400">{r.created}</td>
                          <td className="py-3 pr-4 text-blue-700 dark:text-blue-400">{r.updated}</td>
                          <td className="py-3 pr-4 text-red-700 dark:text-red-400">{r.errors}</td>
                          <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{r.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* History card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
                Historico
              </h2>
              <Button variant="ghost" size="sm" onClick={fetchHistory} disabled={loadingHistory}>
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {loadingHistory ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
                  />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhum registro de sincronizacao encontrado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Entidade
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Criados
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Atualizados
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Erros
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {history.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {formatDate(log.startedAt)}
                        </td>
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white/90">
                          {log.entity}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={log.status} />
                        </td>
                        <td className="py-3 pr-4 text-green-700 dark:text-green-400">
                          {log.recordsCreated}
                        </td>
                        <td className="py-3 pr-4 text-blue-700 dark:text-blue-400">
                          {log.recordsUpdated}
                        </td>
                        <td className="py-3 pr-4 text-red-700 dark:text-red-400">
                          {log.recordsErrors}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default JestorSyncPage;
