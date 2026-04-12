import { useClientFilter } from '../../context/ClientFilterContext';

export default function ClientSelector() {
  const { selectedClientId, clients, setSelectedClientId, loading } = useClientFilter();

  if (loading) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <select
        value={selectedClientId ?? ''}
        onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
        className="text-xs bg-transparent border-none outline-none font-medium text-gray-700 dark:text-gray-300 cursor-pointer max-w-[200px] truncate"
      >
        <option value="">Todas as Empresas</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.companyName}
          </option>
        ))}
      </select>
    </div>
  );
}
