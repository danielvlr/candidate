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

const readStoredClientId = (): number | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = Number(stored);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
};

const persistClientId = (id: number | null): void => {
  try {
    if (id === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  } catch {
    // storage indisponível: o filtro só não é lembrado
  }
};

export const ClientFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<ClientDTO[]>([]);
  // Default é "Todas as Empresas" (null). Um valor salvo só é aplicado
  // depois de confirmar que a empresa ainda existe na lista de ativas.
  const [selectedClientId, setSelectedClientIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getActiveClients()
      .then((loaded) => {
        setClients(loaded);
        const storedId = readStoredClientId();
        const stillExists = storedId !== null && loaded.some(c => c.id === storedId);
        if (stillExists) {
          setSelectedClientIdState(storedId);
        } else if (storedId !== null) {
          persistClientId(null);
        }
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const setSelectedClientId = (id: number | null) => {
    setSelectedClientIdState(id);
    persistClientId(id);
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
