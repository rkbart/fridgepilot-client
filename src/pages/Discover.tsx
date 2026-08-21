import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  pantry,
  groceryLists,
  discover,
  UNITS,
  type PantryItem,
  type GroceryList,
  type DiscoverRecipe,
  type DiscoverIngredient,
} from '../services/api';

interface SelectedRecipe extends DiscoverRecipe {
  showAllIngredients?: boolean;
}

const STORAGE_KEY = 'fp_discover_results';

interface PersistedDiscover {
  recipes: DiscoverRecipe[];
  meta: { total_searched: number; returned: number };
}

function loadPersisted(): PersistedDiscover | null {
  try {
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

export default function Discover() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const persisted = useMemo(() => loadPersisted(), []);
  const [recipes, setRecipes] = useState<DiscoverRecipe[]>(persisted?.recipes ?? []);
  const [meta, setMeta] = useState<{ total_searched: number; returned: number } | null>(persisted?.meta ?? null);
  const [hasSearched, setHasSearched] = useState(!!persisted);

  const [detailRecipe, setDetailRecipe] = useState<SelectedRecipe | null>(null);
  const [addingToGrocery, setAddingToGrocery] = useState<DiscoverRecipe | null>(null);
  const [groceryListsData, setGroceryListsData] = useState<GroceryList[]>([]);
  const [addSuccess, setAddSuccess] = useState('');

  useEffect(() => {
    pantry.list().then((items) => {
      setPantryItems(items);
    }).catch(() => setError('Failed to load pantry'));
  }, []);

  const allNames = useMemo(() => pantryItems.map((i) => i.name), [pantryItems]);

  const toggleIngredient = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allNames));
  const clearAll = () => setSelected(new Set());

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

  const perfectMatch = useMemo(() => recipes.filter((r) => r.match_pct === 100), [recipes]);
  const almostThere = useMemo(() => recipes.filter((r) => r.match_pct >= 60 && r.match_pct < 100), [recipes]);
  const moreNeeded = useMemo(() => recipes.filter((r) => r.match_pct < 60), [recipes]);

  const openDetail = (recipe: DiscoverRecipe) => setDetailRecipe({ ...recipe, showAllIngredients: false });

  const openAddToGrocery = async (recipe: DiscoverRecipe) => {
    try {
      const lists = await groceryLists.list();
      setGroceryListsData(lists);
    } catch {
      setGroceryListsData([]);
    }
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
        const newList = await groceryLists.create({ name: options.newListName, source: 'manual' });
        listId = newList.id;
        listName = newList.name;
        setGroceryListsData((prev) => [...prev, newList]);
      } else if (listId) {
        listName = groceryListsData.find((l) => l.id === listId)?.name || 'grocery list';
      }

      if (listId) {
        for (const item of items) {
          await groceryLists.addItem(listId, {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
          });
        }
      }

      setAddSuccess(`${items.length} ingredient${items.length !== 1 ? 's' : ''} added to ${listName}`);
      setAddingToGrocery(null);
      setTimeout(() => setAddSuccess(''), 3000);
    } catch {
      setError('Failed to add ingredients');
    }
  };

  if (pantryItems.length === 0 && !error) {
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

      {error && <div className="error-msg">{error}</div>}
      {addSuccess && <div className="info-msg">{addSuccess}</div>}

      <div className="discover-chips-section">
        <div className="discover-chips-header">
          <span className="discover-chips-label">Select ingredients to search with:</span>
          <div className="discover-chips-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={selectAll}>Select all</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearAll}>Clear</button>
          </div>
        </div>
        <div className="discover-chips">
          {pantryItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`discover-chip ${selected.has(item.name) ? 'selected' : ''}`}
              onClick={() => toggleIngredient(item.name)}
            >
              {selected.has(item.name) && <span className="discover-chip-check">✓</span>}
              {item.name}
            </button>
          ))}
        </div>
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

      {!loading && perfectMatch.length > 0 && (
        <div className="discover-section">
          <div className="discover-section-header">
            <h2>Perfect Match</h2>
            <span className="section-count">{perfectMatch.length}</span>
          </div>
          <p className="discover-section-sub">You have everything you need</p>
          <div className="card-grid">
            {perfectMatch.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onView={openDetail} />
            ))}
          </div>
        </div>
      )}

      {!loading && almostThere.length > 0 && (
        <div className="discover-section">
          <div className="discover-section-header">
            <h2>Almost There</h2>
            <span className="section-count">{almostThere.length}</span>
          </div>
          <p className="discover-section-sub">Just a few ingredients away</p>
          <div className="card-grid">
            {almostThere.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onView={openDetail}
                onAddMissing={openAddToGrocery}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && moreNeeded.length > 0 && (
        <div className="discover-section">
          <div className="discover-section-header">
            <h2>More Ingredients Needed</h2>
            <span className="section-count">{moreNeeded.length}</span>
          </div>
          <p className="discover-section-sub">Lower match, but still possible</p>
          <div className="card-grid">
            {moreNeeded.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onView={openDetail}
                onAddMissing={openAddToGrocery}
              />
            ))}
          </div>
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
    </div>
  );
}

function RecipeCard({
  recipe,
  onView,
  onAddMissing,
}: {
  recipe: DiscoverRecipe;
  onView: (r: DiscoverRecipe) => void;
  onAddMissing?: (r: DiscoverRecipe) => void;
}) {
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
          {recipe.category && <span className="tag tag-manual">{recipe.category}</span>}
          {recipe.area && <span className="tag tag-ai">{recipe.area}</span>}
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
}: {
  recipe: SelectedRecipe;
  onClose: () => void;
  onAddMissing: (r: DiscoverRecipe) => void;
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
            {recipe.category && <span className="tag tag-manual">{recipe.category}</span>}
            {recipe.area && <span className="tag tag-ai">{recipe.area}</span>}
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

  const ingredientByName = useMemo(() => {
    const map = new Map<string, DiscoverIngredient>();
    for (const ing of recipe.ingredients) map.set(ing.name.toLowerCase(), ing);
    return map;
  }, [recipe.ingredients]);

  const [items, setItems] = useState<GroceryItemDraft[]>(() =>
    recipe.missing.map((name) => {
      const ing = ingredientByName.get(name.toLowerCase());
      const parsed = ing?.measure ? parseMeasure(ing.measure) : { quantity: undefined, unit: undefined };
      return { name, quantity: parsed.quantity, unit: parsed.unit };
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
          <h2>Add Missing Ingredients</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p className="confirm-delete-text" style={{ marginBottom: '1rem' }}>
            Add {items.length} missing ingredient{items.length !== 1 ? 's' : ''} from "{recipe.name}":
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
