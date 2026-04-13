import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HeadhunterDTO } from '../types/api';
import { apiService } from '../services/api';
import { useUserRole } from './UserRoleContext';

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

export const HeadhunterFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userRole } = useUserRole();
  const [headhunters, setHeadhunters] = useState<HeadhunterDTO[]>([]);
  const [selectedHeadhunterId, setSelectedHeadhunterIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const locked = userRole === 'headhunter';

  useEffect(() => {
    apiService.getHeadhunters({ page: 0, size: 100 })
      .then((result) => {
        const active = (result.content || []).filter(h => h.status === 'ACTIVE');
        setHeadhunters(active);
      })
      .catch(() => setHeadhunters([]))
      .finally(() => setLoading(false));
  }, []);

  // Auto-set for headhunter role
  useEffect(() => {
    if (locked) {
      setSelectedHeadhunterIdState(DEFAULT_HEADHUNTER_ID);
      localStorage.setItem(STORAGE_KEY, String(DEFAULT_HEADHUNTER_ID));
    }
  }, [locked]);

  const setSelectedHeadhunterId = (id: number | null) => {
    if (locked) return;
    setSelectedHeadhunterIdState(id);
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
