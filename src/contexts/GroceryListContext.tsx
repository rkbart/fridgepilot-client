import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { groceryLists, type GroceryList, type GroceryItem } from '../services/api';

interface GroceryListContextType {
  lists: GroceryList[];
  loading: boolean;
  error: string | null;
  createList: (data: { name: string; source?: string }) => Promise<GroceryList>;
  updateList: (id: number, data: { name: string }) => Promise<GroceryList>;
  deleteList: (id: number) => Promise<void>;
  addItem: (listId: number, data: { name: string; quantity?: number; unit?: string; recipe_id?: number }) => Promise<GroceryItem>;
  updateItem: (listId: number, itemId: number, data: Partial<GroceryItem>) => Promise<GroceryItem>;
  deleteItem: (listId: number, itemId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const GroceryListContext = createContext<GroceryListContextType | undefined>(undefined);

export function GroceryListProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await groceryLists.list();
      setLists(data);
    } catch {
      setError('Failed to load grocery lists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = useCallback(async (data: { name: string; source?: string }) => {
    const list = await groceryLists.create(data);
    setLists(prev => [...prev, list]);
    return list;
  }, []);

  const updateList = useCallback(async (id: number, data: { name: string }) => {
    const list = await groceryLists.update(id, data);
    setLists(prev => prev.map(l => l.id === id ? list : l));
    return list;
  }, []);

  const deleteList = useCallback(async (id: number) => {
    await groceryLists.delete(id);
    setLists(prev => prev.filter(l => l.id !== id));
  }, []);

  const addItem = useCallback(async (listId: number, data: { name: string; quantity?: number; unit?: string; recipe_id?: number; status?: string }) => {
    const item = await groceryLists.addItem(listId, data);
    setLists(prev => prev.map(l => 
      l.id === listId ? { ...l, items: [...l.items, item] } : l
    ));
    return item;
  }, []);

  const updateItem = useCallback(async (listId: number, itemId: number, data: Partial<GroceryItem>) => {
    const item = await groceryLists.updateItem(listId, itemId, data);
    setLists(prev => prev.map(l => 
      l.id === listId ? { ...l, items: l.items.map(i => i.id === itemId ? item : i) } : l
    ));
    return item;
  }, []);

  const deleteItem = useCallback(async (listId: number, itemId: number) => {
    await groceryLists.deleteItem(listId, itemId);
    setLists(prev => prev.map(l => 
      l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l
    ));
  }, []);

  const refresh = useCallback(async () => {
    await fetchLists();
  }, [fetchLists]);

  return (
    <GroceryListContext.Provider value={{
      lists,
      loading,
      error,
      createList,
      updateList,
      deleteList,
      addItem,
      updateItem,
      deleteItem,
      refresh
    }}>
      {children}
    </GroceryListContext.Provider>
  );
}

export function useGroceryLists() {
  const context = useContext(GroceryListContext);
  if (!context) {
    throw new Error('useGroceryLists must be used within a GroceryListProvider');
  }
  return context;
}
