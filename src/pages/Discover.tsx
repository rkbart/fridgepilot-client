import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  discover,
  recipes as recipesApi,
  UNITS,
  type PantryItem,
  type GroceryList,
  type DiscoverRecipe,
  type DiscoverIngredient,
} from '../services/api';
import { usePantry } from '../contexts/PantryContext';
import { useGroceryLists } from '../contexts/GroceryListContext';
import { useToast } from '../contexts/ToastContext';
import { useFocusSearch } from '../hooks/useFocusSearch';

interface SelectedRecipe extends DiscoverRecipe {
  showAllIngredients?: boolean;
}

const STORAGE_KEY = 'fp_discover_results';
const SELECTION_KEY = 'fp_discover_selected';

interface PersistedDiscover {
  recipes: DiscoverRecipe[];
  meta: { total_searched: number; returned: number };
}

function loadPersisted(): PersistedDiscover | null {
  try {
    const selectionRaw = sessionStorage.getItem(SELECTION_KEY);
    if (!selectionRaw) return null;
    const selection = JSON.parse(selectionRaw);
    if (!Array.isArray(selection) || selection.length === 0) return null;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePersisted(data: PersistedDiscover) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function loadSelection(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SELECTION_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSelection(selected: Set<string>) {
  try {
    sessionStorage.setItem(SELECTION_KEY, JSON.stringify(Array.from(selected)));
  } catch { /* ignore */ }
}

export default function Discover() {
  const { items: pantryItems, error: pantryError } = usePantry();
  const { lists: groceryListsData, createList, addItem } = useGroceryLists();
  const { showToast } = useToast();
  const searchRef = useRef<HTMLInputElement | null>(null);
  useFocusSearch(searchRef);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => loadSelection());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const persisted = useMemo(() => loadPersisted(), []);
  const [recipes, setRecipes] = useState<DiscoverRecipe[]>(persisted?.recipes ?? []);
  const [meta, setMeta] = useState<{ total_searched: number; returned: number } | null>(persisted?.meta ?? null);
  const [hasSearched, setHasSearched] = useState(!!persisted);

  const [detailRecipe, setDetailRecipe] = useState<SelectedRecipe | null>(null);
  const [addingToGrocery, setAddingToGrocery] = useState<DiscoverRecipe | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [page, setPage] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Prune selected ingredients that no longer exist in the (shared) pantry
  useEffect(() => {
    setSelected((prev) => {
      const names = new Set(pantryItems.map((i) => i.name));
      const next = new Set(Array.from(prev).filter((n) => names.has(n)));
      return next.size === prev.size ? prev : next;
    });
  }, [pantryItems]);

  //oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    saveSelection(selected);
    if (selected.size === 0) {
      setRecipes([]);
      setMeta(null);
      setHasSearched(false);
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }, [selected]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(searchInput.trim().toLowerCase()); }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [recipes]);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  interface ItemGroup {
    name: string;
    items: PantryItem[];
  }

  const groups = useMemo<ItemGroup[]>(() => {
    const map = new Map<string, PantryItem[]>();
    for (const item of pantryItems) {
      const key = item.category?.trim() || 'Other';
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, items]) => ({
        name,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [pantryItems]);

  const visibleGroups = useMemo(() => {
    if (!debouncedQuery) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.name.toLowerCase().includes(debouncedQuery)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, debouncedQuery]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const nameToGroup = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of groups) {
      for (const item of group.items) map.set(item.name, group.name);
    }
    return map;
  }, [groups]);

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleGroupSelection = (group: ItemGroup) => {
    const allSelected = group.items.every((i) => selected.has(i.name));
    if (!allSelected) {
      setExpandedGroups((prev) => (prev.has(group.name) ? prev : new Set(prev).add(group.name)));
    }
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of group.items) {
        if (allSelected) next.delete(item.name);
        else next.add(item.name);
      }
      return next;
    });
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const suggestions = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return [];
    return pantryItems
      .filter((i) => i.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [pantryItems, searchInput]);

  const pickSuggestion = (name: string) => {
    toggleIngredient(name);
    setSearchInput('');
    setDebouncedQuery('');
    setShowSuggestions(false);
    setHighlightIndex(-1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightIndex(-1);
      return;
    }
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pickSuggestion(suggestions[Math.max(highlightIndex, 0)].name);
    }
  };

  const toggleIngredient = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else {
        next.add(name);
        const groupName = nameToGroup.get(name);
        if (groupName) setExpandedGroups((g) => (g.has(groupName) ? g : new Set(g).add(groupName)));
      }
      return next;
    });
  };

  const clearAll = () => setSelected(new Set());

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const PER_PAGE = 5;

  const handleSearch = useCallback(async () => {
    if (selected.size === 0) {
      setError('Select at least one ingredient to search');
      return;
    }
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const result = await discover.search(Array.from(selected));
      setRecipes(result.recipes);
      setMeta(result.meta);
      savePersisted({ recipes: result.recipes, meta: result.meta });
    } catch {
      setError('Failed to discover recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const sortedRecipes = useMemo(() =>
    [...recipes].sort((a, b) => b.match_pct - a.match_pct || b.available_count - a.available_count),
    [recipes]
  );

  const paginatedRecipes = useMemo(() =>
    sortedRecipes.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [sortedRecipes, page]
  );

  const openDetail = (recipe: DiscoverRecipe) => setDetailRecipe({ ...recipe, showAllIngredients: false });

  const openAddToGrocery = (recipe: DiscoverRecipe) => {
    setAddingToGrocery(recipe);
  };

  const handleAddToGrocery = async (
    items: { name: string; quantity?: number; unit?: string }[],
    options: { listId?: number; newListName?: string }
  ) => {
    if (!addingToGrocery) return;
    try {
      let listId = options.listId;
      let listName = 'grocery list';

      if (options.newListName) {
        const newList = await createList({ name: options.newListName });
        listId = newList.id;
        listName = newList.name;
      } else if (listId) {
        listName = groceryListsData.find((l) => l.id === listId)?.name || 'grocery list';
      }

      if (listId) {
        for (const item of items) {
          const pantryMatch = pantryItems.find(
            (p) => p.name.toLowerCase() === item.name.toLowerCase() && p.quantity === item.quantity && p.unit === item.unit
          );
          await addItem(listId, {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            status: pantryMatch ? 'checked' : undefined,
          });
        }
      }

      setAddingToGrocery(null);
      showToast(`${items.length} ingredient${items.length !== 1 ? 's' : ''} added to ${listName}`);
    } catch {
      showToast('Failed to add ingredients', 'error');
    }
  };

  const handleSaveRecipe = async (recipe: DiscoverRecipe) => {
    if (savedIds.has(recipe.id)) return;
    setSavingId(recipe.id);
    try {
      await recipesApi.importFromMealDb(recipe.id);
      setSavedIds((prev) => new Set(prev).add(recipe.id));
      showToast(`"${recipe.name}" saved to your recipes`);
    } catch {
      showToast('Failed to save recipe', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const pageError = error || pantryError;

  if (pantryItems.length === 0 && !pageError) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-title">
            <h1>What can you make today?</h1>
            <span className="subtitle">Discover recipes based on what's already in your pantry.</span>
          </div>
        </div>
        <div className="empty-state">
          <p>Add ingredients to your pantry to discover recipes you can make.</p>
          <Link to="/pantry" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
            Go to Pantry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h1>What can you make today?</h1>
          <span className="subtitle">
            Discover recipes based on what's already in your pantry.
            <span className="discover-count">{pantryItems.length} ingredient{pantryItems.length !== 1 ? 's' : ''} available</span>
          </span>
        </div>
      </div>

      {pageError && <div className="error-msg">{pageError}</div>}

      <div className="discover-chips-section">
        <span className="discover-chips-label">Select ingredients to search with:</span>
        <div className="discover-picker-search">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
            <input
              ref={searchRef}
              className="form-input"
              type="search"
              placeholder={`Search ${pantryItems.length} ingredients…`}
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
                setHighlightIndex(-1);
              }}
              onFocus={() => { if (searchInput.trim()) setShowSuggestions(true); }}
              onBlur={() => setShowSuggestions(false)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <span className="search-hint" aria-hidden="true">Press / to search</span>
          {showSuggestions && suggestions.length > 0 && (
            <div className="discover-suggestions">
              {suggestions.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={`discover-suggestion ${i === highlightIndex ? 'active' : ''} ${selected.has(item.name) ? 'picked' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickSuggestion(item.name)}
                >
                  <span>{selected.has(item.name) ? '✓ ' : ''}{item.name}</span>
                  {(item.quantity != null || item.unit) && (
                    <span className="discover-item-meta">{[item.quantity, item.unit].filter(Boolean).join(' ')}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="discover-groups">
          {visibleGroups.length === 0 && (
            <p className="discover-no-match">No ingredients match "{searchInput.trim()}"</p>
          )}
          {visibleGroups.map((group) => {
            const isCollapsed = !debouncedQuery && !expandedGroups.has(group.name);
            const allSelected = group.items.every((i) => selected.has(i.name));
            return (
              <div key={group.name} className="discover-group">
                <div className="discover-group-header">
                  <button
                    type="button"
                    className="discover-group-name"
                    onClick={() => toggleGroup(group.name)}
                    aria-expanded={!isCollapsed}
                  >
                    <span className={`discover-chevron ${isCollapsed ? 'collapsed' : ''}`}>▾</span>
                    {group.name}
                    <span className="discover-group-count">{group.items.length}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => toggleGroupSelection(group)}
                  >
                    {allSelected ? 'Deselect' : 'Select all'}
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="discover-items">
                    {group.items.map((item) => (
                      <label
                        key={item.id}
                        className={`discover-item ${selected.has(item.name) ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(item.name)}
                          onChange={() => toggleIngredient(item.name)}
                        />
                        <span className="discover-item-name">{item.name}</span>
                        {(item.quantity != null || item.unit) && (
                          <span className="discover-item-meta">{[item.quantity, item.unit].filter(Boolean).join(' ')}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selected.size > 0 && (
          <div className="discover-tray">
            <span className="discover-tray-label">Selected ({selected.size})</span>
            <div className="discover-tray-tokens">
              {Array.from(selected).map((name) => (
                <span key={name} className="discover-token">
                  {name}
                  <button
                    type="button"
                    className="discover-token-remove"
                    aria-label={`Remove ${name}`}
                    onClick={() => toggleIngredient(name)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearAll}>Clear all</button>
          </div>
        )}
      </div>

      <div className="discover-search">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={loading || selected.size === 0}
        >
          {loading ? 'Searching...' : `Find recipes (${selected.size} ingredient${selected.size !== 1 ? 's' : ''})`}
        </button>
      </div>

      {loading && (
        <div className="discover-loading">
          <div className="discover-spinner" />
          <span>Searching TheMealDB for matching recipes...</span>
        </div>
      )}

      {!loading && hasSearched && recipes.length === 0 && (
        <div className="empty-state">
          <p>We couldn't find a good match yet.</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Try selecting more ingredients, or{' '}
            <Link to="/recipes">browse your saved recipes</Link>.
          </p>
        </div>
      )}

      {!loading && sortedRecipes.length > 0 && (
        <div ref={resultsRef} className="discover-section">
          <div className="discover-section-header">
            <h2>Recipes</h2>
            <span className="section-count">{sortedRecipes.length}</span>
          </div>
          <p className="discover-section-sub">Sorted by best match</p>
          <div className="card-grid">
            {paginatedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onView={openDetail}
                onAddMissing={recipe.missing.length > 0 ? openAddToGrocery : undefined}
                onSave={handleSaveRecipe}
                savedIds={savedIds}
                savingId={savingId}
              />
            ))}
          </div>
          {sortedRecipes.length > PER_PAGE && (
            <div className="pagination">
              <button type="button" className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => { setPage(1); scrollToResults(); }}>«</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => { setPage((p) => p - 1); scrollToResults(); }}>‹</button>
              <span className="pagination-info">{page} / {Math.ceil(sortedRecipes.length / PER_PAGE)}</span>
              <button type="button" className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(sortedRecipes.length / PER_PAGE)} onClick={() => { setPage((p) => p + 1); scrollToResults(); }}>›</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(sortedRecipes.length / PER_PAGE)} onClick={() => { setPage(Math.ceil(sortedRecipes.length / PER_PAGE)); scrollToResults(); }}>»</button>
            </div>
          )}
        </div>
      )}

      {!loading && meta && recipes.length > 0 && (
        <div className="discover-meta">
          Searched {meta.total_searched} recipes · Showing {meta.returned} matches
        </div>
      )}

      {detailRecipe && (
        <RecipeDetailModal
          recipe={detailRecipe}
          onClose={() => setDetailRecipe(null)}
          onAddMissing={(recipe) => {
            setDetailRecipe(null);
            openAddToGrocery(recipe);
          }}
          onSave={handleSaveRecipe}
          isSaved={savedIds.has(detailRecipe.id)}
          isSaving={savingId === detailRecipe.id}
        />
      )}

      {addingToGrocery && (
        <AddToGroceryModal
          recipe={addingToGrocery}
          lists={groceryListsData}
          onSelect={(missing, options) => handleAddToGrocery(missing, options)}
          onCancel={() => setAddingToGrocery(null)}
        />
      )}

      {showTopBtn && (
        <button type="button" className="back-to-top" aria-label="Back to top" onClick={scrollToTop}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M12 10l-4-4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  onView,
  onAddMissing,
  onSave,
  savedIds,
  savingId,
}: {
  recipe: DiscoverRecipe;
  onView: (r: DiscoverRecipe) => void;
  onAddMissing?: (r: DiscoverRecipe) => void;
  onSave?: (r: DiscoverRecipe) => void;
  savedIds?: Set<string>;
  savingId?: string | null;
}) {
  const isSaved = savedIds?.has(recipe.id) ?? false;
  const isSaving = savingId === recipe.id;
  return (
    <div className="card discover-card">
      {recipe.image_url && (
        <div className="discover-card-image">
          <img src={recipe.image_url} alt={recipe.name} loading="lazy" />
        </div>
      )}
      <div className="discover-card-body">
        <div className="discover-card-header">
          <h3 className="discover-card-name">{recipe.name}</h3>
          <div className="score-bar">
            <div className="score-fill">
              <span style={{ width: `${recipe.match_pct}%` }} />
            </div>
            {recipe.match_pct}%
          </div>
        </div>
        <div className="discover-card-meta">
          <span className="discover-card-count">
            {recipe.available_count} of {recipe.total_ingredients} ingredients
          </span>
        </div>
        {recipe.missing.length > 0 && (
          <div className="discover-card-missing">
            <span className="discover-missing-label">Missing:</span>
            {recipe.missing.slice(0, 3).map((name) => (
              <span key={name} className="discover-missing-item">{name}</span>
            ))}
            {recipe.missing.length > 3 && (
              <span className="discover-missing-more">+{recipe.missing.length - 3} more</span>
            )}
          </div>
        )}
        <div className="discover-card-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onView(recipe)}>
            View Recipe
          </button>
          {onSave && (
            <button
              type="button"
              className={`btn btn-sm ${isSaved ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => onSave(recipe)}
              disabled={isSaved || isSaving}
            >
              {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
            </button>
          )}
          {onAddMissing && recipe.missing.length > 0 && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onAddMissing(recipe)}>
              Add Missing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecipeDetailModal({
  recipe,
  onClose,
  onAddMissing,
  onSave,
  isSaved,
  isSaving,
}: {
  recipe: SelectedRecipe;
  onClose: () => void;
  onAddMissing: (r: DiscoverRecipe) => void;
  onSave?: (r: DiscoverRecipe) => void;
  isSaved?: boolean;
  isSaving?: boolean;
}) {
  const instructions = getRecipeInstructions(recipe.instructions);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={recipe.name} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{recipe.name}</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {recipe.image_url && (
            <img src={recipe.image_url} alt={recipe.name} className="discover-detail-image" />
          )}
          <div className="discover-detail-meta">
            <div className="score-bar">
              <div className="score-fill">
                <span style={{ width: `${recipe.match_pct}%` }} />
              </div>
              {recipe.match_pct}% Pantry Match
            </div>
          </div>
          <div className="discover-detail-section">
            <h3>Ingredients</h3>
            <div className="item-list">
              {recipe.ingredients.map((ing: DiscoverIngredient) => (
                <div key={ing.name} className={`item-row discover-ingredient ${ing.available ? 'available' : 'missing'}`}>
                  <span className="discover-ingredient-icon">{ing.available ? '✓' : '✗'}</span>
                  <span className="item-name">{ing.name}</span>
                  <span className="item-meta">{ing.measure}</span>
                </div>
              ))}
            </div>
          </div>
          {instructions.length > 0 && (
            <div className="discover-detail-section">
              <h3>Instructions</h3>
              <div className="discover-instructions">
                {instructions.map((step, i) => (
                  <div key={i} className="discover-instruction-step">
                    <span className="step-number">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {onSave && (
            <button
              type="button"
              className={`btn ${isSaved ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => onSave(recipe)}
              disabled={isSaved || isSaving}
            >
              {isSaving ? 'Saving...' : isSaved ? 'Saved to Recipes' : 'Save to My Recipes'}
            </button>
          )}
          {recipe.missing.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={() => onAddMissing(recipe)}>
              Add {recipe.missing.length} Missing to Grocery List
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

interface GroceryItemDraft {
  name: string;
  quantity: number | undefined;
  unit: string | undefined;
}

function AddToGroceryModal({
  recipe,
  lists,
  onSelect,
  onCancel,
}: {
  recipe: DiscoverRecipe;
  lists: GroceryList[];
  onSelect: (items: GroceryItemDraft[], options: { listId?: number; newListName?: string }) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<'existing' | 'new'>(lists.length === 0 ? 'new' : 'existing');
  const [selectedListId, setSelectedListId] = useState<number | null>(lists.length > 0 ? lists[0].id : null);
  const [newListName, setNewListName] = useState(recipe.name);

  const [items, setItems] = useState<GroceryItemDraft[]>(() =>
    recipe.ingredients.map((ing) => {
      const parsed = ing.measure ? parseMeasure(ing.measure) : { quantity: undefined, unit: undefined };
      return { name: ing.name, quantity: parsed.quantity, unit: parsed.unit };
    })
  );

  const updateItem = (index: number, field: 'quantity' | 'unit', value: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === 'quantity' ? (value === '' ? undefined : Number(value) || undefined) : value || undefined,
            }
          : item
      )
    );
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Add to grocery list" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add to Grocery List</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p className="confirm-delete-text" style={{ marginBottom: '1rem' }}>
            Add {items.length} ingredient{items.length !== 1 ? 's' : ''} from "{recipe.name}":
          </p>
          <div className="item-list" style={{ marginBottom: '1rem' }}>
            {items.map((item, idx) => (
              <div key={item.name} className="grocery-add-row">
                <span className="item-name">{item.name}</span>
                <div className="grocery-add-fields">
                  <input
                    type="number"
                    className="form-input form-input-sm"
                    placeholder="Qty"
                    min="0"
                    step="any"
                    value={item.quantity ?? ''}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  />
                  <select
                    className="form-input form-input-sm"
                    value={item.unit ?? ''}
                    onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                  >
                    <option value="">Unit</option>
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="detail-tabs" style={{ marginBottom: '0.75rem' }}>
            <button
              type="button"
              className={mode === 'existing' ? 'active' : ''}
              onClick={() => setMode('existing')}
            >
              Existing list
            </button>
            <button
              type="button"
              className={mode === 'new' ? 'active' : ''}
              onClick={() => setMode('new')}
            >
              New list
            </button>
          </div>
          {mode === 'existing' ? (
            <div className="form-group">
              <label>Grocery List</label>
              {lists.length === 0 ? (
                <p className="empty-inline">No grocery lists found.</p>
              ) : (
                <select
                  className="form-input"
                  value={selectedListId ?? ''}
                  onChange={(e) => setSelectedListId(Number(e.target.value))}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label>List name</label>
              <input
                className="form-input"
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. Chicken Adobo"
                autoFocus
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            disabled={mode === 'existing' && !selectedListId}
            onClick={() => {
              if (mode === 'new') {
                const trimmed = newListName.trim();
                if (trimmed) onSelect(items, { newListName: trimmed });
              } else if (selectedListId) {
                onSelect(items, { listId: selectedListId });
              }
            }}
          >
            {mode === 'new' ? 'Create & Add' : 'Add to List'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function parseMeasure(measure: string): { quantity: number | undefined; unit: string | undefined } {
  const trimmed = measure.trim();
  if (!trimmed) return { quantity: undefined, unit: undefined };
  const m = trimmed.match(/^([\d./]+(?:\s*[-–]\s*[\d./]+)?)\s+(.+)$/);
  if (m) {
    const qtyPart = m[1].split(/\s*[-–]\s*/)[0];
    const num = parseFloat(qtyPart);
    return { quantity: isNaN(num) ? undefined : num, unit: m[2].trim() };
  }
  const num = parseFloat(trimmed);
  if (!isNaN(num)) return { quantity: num, unit: undefined };
  return { quantity: undefined, unit: trimmed };
}

function getRecipeInstructions(instructions: string | null): string[] {
  if (!instructions) return [];
  return instructions
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
