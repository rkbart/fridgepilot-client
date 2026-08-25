import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { pantry, type PantryItem } from '../services/api';

interface PantryContextType {
  items: PantryItem[];
  loading: boolean;
  error: string | null;
  addItem: (data: { name: string; quantity?: number; unit?: string; category?: string }) => Promise<PantryItem>;
  updateItem: (id: number, data: Partial<PantryItem>) => Promise<PantryItem>;
  deleteItem: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const PantryContext = createContext<PantryContextType | undefined>(undefined);

export function PantryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pantry.list();
      setItems(data);
    } catch {
      setError('Failed to load pantry items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(async (data: { name: string; quantity?: number; unit?: string; category?: string }) => {
    const item = await pantry.create(data);
    setItems(prev => [...prev, item]);
    return item;
  }, []);

  const updateItem = useCallback(async (id: number, data: Partial<PantryItem>) => {
    const item = await pantry.update(id, data);
    setItems(prev => prev.map(i => i.id === id ? item : i));
    return item;
  }, []);

  const deleteItem = useCallback(async (id: number) => {
    await pantry.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    await fetchItems();
  }, [fetchItems]);

  return (
    <PantryContext.Provider value={{ items, loading, error, addItem, updateItem, deleteItem, refresh }}>
      {children}
    </PantryContext.Provider>
  );
}

export function usePantry() {
  const context = useContext(PantryContext);
  if (!context) {
    throw new Error('usePantry must be used within a PantryProvider');
  }
  return context;
}
