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
  sessionStorage.removeItem('fp_discover_results');
  sessionStorage.removeItem('fp_discover_selected');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for requests that have a body
  if (options.body) {
    headers['Content-Type'] = 'application/json';
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

  // 204 No Content — no body to parse
  if (res.status === 204) return undefined as T;

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
  source?: string;
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
  createWithImage: (formData: FormData): Promise<Recipe> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE}/api/v1/recipes`, { method: 'POST', headers, body: formData })
      .then((res) => { if (!res.ok) throw res; return res.json(); });
  },
  update: (id: number, data: Partial<Recipe>) =>
    request<Recipe>(`/api/v1/recipes/${id}`, { method: 'PATCH', body: JSON.stringify({ recipe: data }) }),
  updateWithImage: (id: number, formData: FormData): Promise<Recipe> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE}/api/v1/recipes/${id}`, { method: 'PATCH', headers, body: formData })
      .then((res) => { if (!res.ok) throw res; return res.json(); });
  },
  delete: (id: number) => request<void>(`/api/v1/recipes/${id}`, { method: 'DELETE' }),
  importFromMealDb: (mealId: string): Promise<Recipe> =>
    request<Recipe>('/api/v1/recipes/import', {
      method: 'POST',
      body: JSON.stringify({ meal_id: mealId }),
    }),
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
  source: 'manual';
  recipe_id?: number;
}

export interface GroceryList {
  id: number;
  name: string;
  source: 'manual';
  items: GroceryItem[];
  created_at: string;
  updated_at: string;
}

export const groceryLists = {
  list: () => request<GroceryList[]>('/api/v1/grocery_lists'),
  get: (id: number) => request<GroceryList>(`/api/v1/grocery_lists/${id}`),
  create: (data: { name: string; source?: string }) =>
    request<GroceryList>('/api/v1/grocery_lists', { method: 'POST', body: JSON.stringify({ grocery_list: data }) }),
  update: (id: number, data: { name: string }) =>
    request<GroceryList>(`/api/v1/grocery_lists/${id}`, { method: 'PATCH', body: JSON.stringify({ grocery_list: data }) }),
  delete: (id: number) => request<void>(`/api/v1/grocery_lists/${id}`, { method: 'DELETE' }),
  addItem: (listId: number, data: { name: string; quantity?: number; unit?: string; recipe_id?: number; status?: string }) =>
    request<GroceryItem>(`/api/v1/grocery_lists/${listId}/items`, { method: 'POST', body: JSON.stringify({ grocery_item: data }) }),
  updateItem: (listId: number, itemId: number, data: Partial<GroceryItem>) =>
    request<GroceryItem>(`/api/v1/grocery_lists/${listId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ grocery_item: data }) }),
  deleteItem: (listId: number, itemId: number) =>
    request<void>(`/api/v1/grocery_lists/${listId}/items/${itemId}`, { method: 'DELETE' }),
};

export { getToken, isAuthenticated };

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
