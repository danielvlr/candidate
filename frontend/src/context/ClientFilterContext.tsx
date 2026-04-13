import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClientDTO } from '../types/api';
import { apiService } from '../services/api';

interface ClientFilterContextType {
  selectedClientId: number | null;
  selectedClient: ClientDTO | null;
  clients: ClientDTO[];
  setSelectedClientId: (id: number | null) => void;
  loading: boolean;
}

const ClientFilterContext = createContext<ClientFilterContextType | undefined>(undefined);

const STORAGE_KEY = 'camarmo_selectedClientId';

export const ClientFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [selectedClientId, setSelectedClientIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getActiveClients()
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const setSelectedClientId = (id: number | null) => {
    setSelectedClientIdState(id);
    if (id === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  };

  const selectedClient = selectedClientId
    ? clients.find(c => c.id === selectedClientId) ?? null
    : null;

  return (
    <ClientFilterContext.Provider value={{
      selectedClientId, selectedClient, clients, setSelectedClientId, loading
    }}>
      {children}
    </ClientFilterContext.Provider>
  );
};

export const useClientFilter = (): ClientFilterContextType => {
  const context = useContext(ClientFilterContext);
  if (context === undefined) {
    throw new Error('useClientFilter must be used within a ClientFilterProvider');
  }
  return context;
};
