import { useUserRole, UserRole } from "../../context/UserRoleContext";

export default function RoleSelector() {
  const { userRole, setUserRole, isDevelopment } = useUserRole();

  // Only show in development mode
  if (!isDevelopment) {
    return null;
  }

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setUserRole(event.target.value as UserRole);
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-lg">
      <span className="text-xs font-medium text-yellow-800">DEV:</span>
      <select
        value={userRole}
        onChange={handleRoleChange}
        className="text-xs bg-transparent border-none outline-none font-medium text-yellow-800 cursor-pointer"
      >
        <option value="admin">Admin</option>
        <option value="headhunter">Headhunter</option>
        <option value="senior">Senior</option>
      </select>
    </div>
  );
}