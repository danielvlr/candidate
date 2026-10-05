import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HeadhunterDTO } from '../types/api';
import { apiService } from '../services/api';
import { useUserRole } from './UserRoleContext';
import { useAuth } from './AuthContext';

interface HeadhunterFilterContextType {
  selectedHeadhunterId: number | null;
  selectedHeadhunter: HeadhunterDTO | null;
  headhunters: HeadhunterDTO[];
  setSelectedHeadhunterId: (id: number | null) => void;
  loading: boolean;
  locked: boolean;
}

const HeadhunterFilterContext = createContext<HeadhunterFilterContextType | undefined>(undefined);

const STORAGE_KEY = 'camarmo_selectedHeadhunterId';
const DEFAULT_HEADHUNTER_ID = 1;
const UNLINKED_HEADHUNTER_ID = -1;

export const HeadhunterFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userRole } = useUserRole();
  const { user } = useAuth();
  const [headhunters, setHeadhunters] = useState<HeadhunterDTO[]>([]);
  const [storedHeadhunterId, setStoredHeadhunterId] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const locked = userRole === 'headhunter';
  // Headhunter logado vê sempre os próprios dados, nunca a seleção salva de outra sessão.
  // Sem vínculo, -1 não casa com nenhum headhunter; DEFAULT só vale para admin simulando perfil em DEV.
  const isSimulatedHeadhunter = user?.role === 'ADMIN';
  const lockedHeadhunterId = user?.headhunterId
    ?? (isSimulatedHeadhunter ? DEFAULT_HEADHUNTER_ID : UNLINKED_HEADHUNTER_ID);
  const selectedHeadhunterId = locked ? lockedHeadhunterId : storedHeadhunterId;

  useEffect(() => {
    apiService.getHeadhunters({ page: 0, size: 100 })
      .then((result) => {
        const active = (result.content || []).filter(h => h.status === 'ACTIVE');
        setHeadhunters(active);
      })
      .catch(() => setHeadhunters([]))
      .finally(() => setLoading(false));
  }, []);

  const setSelectedHeadhunterId = (id: number | null) => {
    if (locked) return;
    setStoredHeadhunterId(id);
    if (id === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  };

  const selectedHeadhunter = selectedHeadhunterId
    ? headhunters.find(h => h.id === selectedHeadhunterId) ?? null
    : null;

  return (
    <HeadhunterFilterContext.Provider value={{
      selectedHeadhunterId, selectedHeadhunter, headhunters, setSelectedHeadhunterId, loading, locked
    }}>
      {children}
    </HeadhunterFilterContext.Provider>
  );
};

export const useHeadhunterFilter = (): HeadhunterFilterContextType => {
  const context = useContext(HeadhunterFilterContext);
  if (context === undefined) {
    throw new Error('useHeadhunterFilter must be used within a HeadhunterFilterProvider');
  }
  return context;
};
