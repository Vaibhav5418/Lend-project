import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Inquiry } from '../types';

type InquiryCacheState = {
  inquiries: Inquiry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const InquiryCacheContext = createContext<InquiryCacheState | null>(null);

export function InquiryCacheProvider({ children }: { children: ReactNode }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getInquiries();
      setInquiries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const value: InquiryCacheState = {
    inquiries,
    loading,
    error,
    refetch,
  };

  return (
    <InquiryCacheContext.Provider value={value}>
      {children}
    </InquiryCacheContext.Provider>
  );
}

export function useInquiryCache(): InquiryCacheState {
  const ctx = useContext(InquiryCacheContext);
  if (!ctx) throw new Error('useInquiryCache must be used within InquiryCacheProvider');
  return ctx;
}
