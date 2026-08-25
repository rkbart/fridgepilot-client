import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { recipes, type Recipe, type RecipeIngredient } from '../services/api';

interface RecipesContextType {
  list: Recipe[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  perPage: number;
  query: string;
  setPage: (page: number | ((prev: number) => number)) => void;
  setQuery: (query: string) => void;
  createRecipe: (data: { name: string; image_url?: string; ingredients?: RecipeIngredient[]; instructions?: string[] }) => Promise<Recipe>;
  updateRecipe: (id: number, data: Partial<Recipe>) => Promise<Recipe>;
  deleteRecipe: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const RecipesContext = createContext<RecipesContextType | undefined>(undefined);

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const perPage = 10;

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, meta } = await recipes.list({ q: query, page, per_page: perPage });
      setList(data);
      setTotal(meta.total);
    } catch {
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [query, page, perPage]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const createRecipe = useCallback(async (data: { name: string; image_url?: string; ingredients?: RecipeIngredient[]; instructions?: string[] }) => {
    const recipe = await recipes.create(data);
    await fetchRecipes(); // Refresh list
    return recipe;
  }, [fetchRecipes]);

  const updateRecipe = useCallback(async (id: number, data: Partial<Recipe>) => {
    const recipe = await recipes.update(id, data);
    setList(prev => prev.map(r => r.id === id ? recipe : r));
    return recipe;
  }, []);

  const deleteRecipe = useCallback(async (id: number) => {
    await recipes.delete(id);
    await fetchRecipes(); // Refresh list
  }, [fetchRecipes]);

  const refresh = useCallback(async () => {
    await fetchRecipes();
  }, [fetchRecipes]);

  return (
    <RecipesContext.Provider value={{
      list,
      total,
      loading,
      error,
      page,
      perPage,
      query,
      setPage,
      setQuery,
      createRecipe,
      updateRecipe,
      deleteRecipe,
      refresh
    }}>
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipesContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipesProvider');
  }
  return context;
}
