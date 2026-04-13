import { useUserRole, UserRole } from "../../context/UserRoleContext";

export default function RoleSelector() {
  const { userRole, setUserRole } = useUserRole();

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setUserRole(event.target.value as UserRole);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
      <select
        value={userRole}
        onChange={handleRoleChange}
        className="text-xs bg-transparent border-none outline-none font-medium text-gray-700 dark:text-gray-300 cursor-pointer max-w-[120px]"
      >
        <option value="admin">Admin</option>
        <option value="headhunter">Headhunter</option>
        <option value="senior">Senior</option>
      </select>
    </div>
  );
}