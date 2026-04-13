import { useHeadhunterFilter } from '../../context/HeadhunterFilterContext';

export default function HeadhunterSelector() {
  const { selectedHeadhunterId, headhunters, setSelectedHeadhunterId, loading, locked } = useHeadhunterFilter();

  if (loading) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
      <select
        value={selectedHeadhunterId ?? ''}
        onChange={(e) => setSelectedHeadhunterId(e.target.value ? Number(e.target.value) : null)}
        disabled={locked}
        className={`text-xs bg-transparent border-none outline-none font-medium text-gray-700 dark:text-gray-300 max-w-[200px] truncate ${locked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
      >
        <option value="">Todos os Headhunters</option>
        {headhunters.map((hh) => (
          <option key={hh.id} value={hh.id}>
            {hh.fullName}
          </option>
        ))}
      </select>
    </div>
  );
}
