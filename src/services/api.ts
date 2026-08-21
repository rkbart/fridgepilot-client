const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  id: number;
  email: string;
  name?: string;
}

interface AuthResponse {
  user: User;
}

interface LoginParams {
  email: string;
  password: string;
}

interface SignupParams {
  email: string;
  password: string;
  password_confirmation: string;
  name?: string;
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

function setToken(token: string): void {
  localStorage.setItem('token', token);
}

function clearToken(): void {
  localStorage.removeItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && !path.includes('/users/')) {
      clearToken();
      window.location.href = '/login';
    }
    const body = await res.json().catch(() => ({ errors: ['Request failed'] }));
    throw { status: res.status, ...body };
  }

  return res.json();
}

export async function login(params: LoginParams): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/users/sign_in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ user: params }),
  });

  const token = res.headers.get('Authorization')?.replace('Bearer ', '');
  if (token) setToken(token);

  const body = await res.json();
  if (!res.ok) throw { status: res.status, ...body };
  return body;
}

export async function signup(params: SignupParams): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ user: params }),
  });

  const token = res.headers.get('Authorization')?.replace('Bearer ', '');
  if (token) setToken(token);

  const body = await res.json();
  if (!res.ok) throw { status: res.status, ...body };
  return body;
}

export async function logout(): Promise<void> {
  try {
    await request('/users/sign_out', { method: 'DELETE' });
  } finally {
    clearToken();
  }
}

export async function getCurrentUser(): Promise<AuthResponse> {
  return request('/users/me');
}

function isAuthenticated(): boolean {
  return !!getToken();
}

// Recipes
export interface RecipeIngredient {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface Recipe {
  id: number;
  name: string;
  image_url?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
}

export interface RecipeListResult {
  data: Recipe[];
  meta: { total: number; page: number; per_page: number };
}

export const recipes = {
  list: (params?: { q?: string; page?: number; per_page?: number }): Promise<RecipeListResult> => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    const query = qs.toString();
    return request<RecipeListResult>(`/api/v1/recipes${query ? `?${query}` : ''}`);
  },
  get: (id: number) => request<Recipe>(`/api/v1/recipes/${id}`),
  create: (data: { name: string; image_url?: string; ingredients?: RecipeIngredient[]; instructions?: string[] }) =>
    request<Recipe>('/api/v1/recipes', { method: 'POST', body: JSON.stringify({ recipe: data }) }),
  update: (id: number, data: Partial<Recipe>) =>
    request<Recipe>(`/api/v1/recipes/${id}`, { method: 'PATCH', body: JSON.stringify({ recipe: data }) }),
  delete: (id: number) => request<void>(`/api/v1/recipes/${id}`, { method: 'DELETE' }),
};

// Pantry Items
export interface PantryItem {
  id: number;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
}

export const pantry = {
  list: () => request<PantryItem[]>('/api/v1/pantry_items'),
  get: (id: number) => request<PantryItem>(`/api/v1/pantry_items/${id}`),
  create: (data: { name: string; quantity?: number; unit?: string; category?: string }) =>
    request<PantryItem>('/api/v1/pantry_items', { method: 'POST', body: JSON.stringify({ pantry_item: data }) }),
  update: (id: number, data: Partial<PantryItem>) =>
    request<PantryItem>(`/api/v1/pantry_items/${id}`, { method: 'PATCH', body: JSON.stringify({ pantry_item: data }) }),
  delete: (id: number) => request<void>(`/api/v1/pantry_items/${id}`, { method: 'DELETE' }),
};

// Grocery Lists
export const UNITS = ['oz', 'lb', 'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'pcs', 'can', 'pack', 'bag', 'dozen', 'bunch', 'slice', 'pinch', 'box'];

export interface GroceryItem {
  id: number;
  name: string;
  quantity?: number;
  unit?: string;
  status: 'pending' | 'confirmed' | 'checked';
  source: 'manual' | 'ai_suggested';
  recipe_id?: number;
}

export interface GroceryList {
  id: number;
  name: string;
  source: 'manual' | 'ai_generated';
  items: GroceryItem[];
}

export const groceryLists = {
  list: () => request<GroceryList[]>('/api/v1/grocery_lists'),
  get: (id: number) => request<GroceryList>(`/api/v1/grocery_lists/${id}`),
  create: (data: { name: string; source?: string }) =>
    request<GroceryList>('/api/v1/grocery_lists', { method: 'POST', body: JSON.stringify({ grocery_list: data }) }),
  update: (id: number, data: { name: string }) =>
    request<GroceryList>(`/api/v1/grocery_lists/${id}`, { method: 'PATCH', body: JSON.stringify({ grocery_list: data }) }),
  delete: (id: number) => request<void>(`/api/v1/grocery_lists/${id}`, { method: 'DELETE' }),
  addItem: (listId: number, data: { name: string; quantity?: number; unit?: string; recipe_id?: number }) =>
    request<GroceryItem>(`/api/v1/grocery_lists/${listId}/items`, { method: 'POST', body: JSON.stringify({ grocery_item: data }) }),
  updateItem: (listId: number, itemId: number, data: Partial<GroceryItem>) =>
    request<GroceryItem>(`/api/v1/grocery_lists/${listId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ grocery_item: data }) }),
  deleteItem: (listId: number, itemId: number) =>
    request<void>(`/api/v1/grocery_lists/${listId}/items/${itemId}`, { method: 'DELETE' }),
};

export { getToken, isAuthenticated };

// AI
export interface AiSuggestion {
  name: string;
  ingredients: string[];
  match_score: number;
  missing_ingredients: string[];
}

export const ai = {
  suggestRecipes: () => request<{ suggestions: AiSuggestion[]; message?: string }>('/api/v1/ai/suggest_recipes', { method: 'POST' }),
  generateGroceryList: (recipeId: number) =>
    request<GroceryList>(`/api/v1/ai/generate_grocery_list`, { method: 'POST', body: JSON.stringify({ recipe_id: recipeId }) }),
};

// Settings
export interface UserSettings {
  data: {
    ai_api_key: string | null;
    ai_api_endpoint: string | null;
    has_api_key: boolean;
  };
}

export const settings = {
  get: () => request<UserSettings>('/api/v1/settings'),
  update: (data: { ai_api_key?: string; ai_api_endpoint?: string }) =>
    request<{ data: { message: string } }>('/api/v1/settings', { method: 'PUT', body: JSON.stringify({ settings: data }) }),
};

// Recipe Discovery
export interface DiscoverIngredient {
  name: string;
  measure: string;
  available: boolean;
}

export interface DiscoverRecipe {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  area: string | null;
  instructions: string | null;
  youtube_url: string | null;
  tags: string[] | null;
  match_pct: number;
  total_ingredients: number;
  available_count: number;
  ingredients: DiscoverIngredient[];
  available: string[];
  missing: string[];
}

export interface DiscoverResult {
  recipes: DiscoverRecipe[];
  meta: {
    total_searched: number;
    returned: number;
    query_ingredients: string[];
  };
}

export const discover = {
  search: (ingredients: string[]): Promise<DiscoverResult> =>
    request<DiscoverResult>('/api/v1/discover', {
      method: 'POST',
      body: JSON.stringify({ ingredients }),
    }),
};
