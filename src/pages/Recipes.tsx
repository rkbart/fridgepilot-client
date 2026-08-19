import { useEffect, useRef, useState } from 'react';
import { recipes, UNITS, type Recipe, type RecipeIngredient } from '../services/api';

interface IngredientFormProps {
  initial?: RecipeIngredient;
  submitLabel: string;
  onSubmit: (data: RecipeIngredient) => void;
  onCancel: () => void;
}

function IngredientForm({ initial, submitLabel, onSubmit, onCancel }: IngredientFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [quantity, setQuantity] = useState(initial?.quantity != null ? String(initial.quantity) : '');
  const [unit, setUnit] = useState(initial?.unit || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="inline-form">
      <div className="form-group inline-form-field-lg">
        <label>Ingredient</label>
        <input className="form-input" placeholder="e.g. Spaghetti" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div className="form-group inline-form-field-sm">
        <label>Qty</label>
        <input className="form-input" type="number" min="0" placeholder="200" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div className="form-group inline-form-field-sm">
        <label>Unit</label>
        <select className="form-input" value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="">None</option>
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      <div className="inline-form-actions">
        <button type="submit" className="btn btn-primary btn-sm">{submitLabel}</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

interface IngredientEditorProps {
  ingredients: RecipeIngredient[];
  onChange: (next: RecipeIngredient[]) => void;
}

function IngredientEditor({ ingredients, onChange }: IngredientEditorProps) {
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const add = (data: RecipeIngredient) => onChange([...ingredients, data]);
  const update = (idx: number, data: RecipeIngredient) => {
    const next = [...ingredients];
    next[idx] = data;
    onChange(next);
  };
  const remove = (idx: number) => onChange(ingredients.filter((_, i) => i !== idx));

  return (
    <div className="recipe-section">
      <div className="recipe-section-title-row">
        <span className="recipe-section-title">
          Ingredients
          {ingredients.length > 0 && <span className="section-count">{ingredients.length}</span>}
        </span>
        {!adding && (
          <button type="button" className="add-row-btn" onClick={() => setAdding(true)}>
            <span className="add-row-icon">+</span> Add ingredient
          </button>
        )}
      </div>
      {adding && (
        <IngredientForm
          submitLabel="Add"
          onSubmit={(data) => {
            add(data);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {ingredients.length === 0 ? (
        <div className="empty-inline">No ingredients yet</div>
      ) : (
        <div className="item-list">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="item-row">
              {editing === idx ? (
                <IngredientForm
                  initial={ing}
                  submitLabel="Save"
                  onSubmit={(data) => {
                    update(idx, data);
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <span className="item-name">{ing.name}</span>
                  {ing.quantity != null && (
                    <span className="item-meta">{ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}</span>
                  )}
                  <div className="item-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(idx)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(idx)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface StepFormProps {
  initial?: string;
  submitLabel: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

function StepForm({ initial, submitLabel, onSubmit, onCancel }: StepFormProps) {
  const [text, setText] = useState(initial || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(text.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="inline-form">
      <div className="form-group inline-form-field-lg">
        <label>Step</label>
        <input className="form-input" placeholder="Describe this step..." value={text} onChange={(e) => setText(e.target.value)} required autoFocus />
      </div>
      <div className="inline-form-actions">
        <button type="submit" className="btn btn-primary btn-sm">{submitLabel}</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

interface StepEditorProps {
  steps: string[];
  onChange: (next: string[]) => void;
}

function StepEditor({ steps, onChange }: StepEditorProps) {
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const add = (text: string) => onChange([...steps, text]);
  const update = (idx: number, text: string) => {
    const next = [...steps];
    next[idx] = text;
    onChange(next);
  };
  const remove = (idx: number) => onChange(steps.filter((_, i) => i !== idx));

  return (
    <div className="recipe-section">
      <div className="recipe-section-title-row">
        <span className="recipe-section-title">
          Procedure
          {steps.length > 0 && <span className="section-count">{steps.length}</span>}
        </span>
        {!adding && (
          <button type="button" className="add-row-btn" onClick={() => setAdding(true)}>
            <span className="add-row-icon">+</span> Add step
          </button>
        )}
      </div>
      {adding && (
        <StepForm
          submitLabel="Add"
          onSubmit={(text) => {
            add(text);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {steps.length === 0 ? (
        <div className="empty-inline">No steps yet</div>
      ) : (
        <div className="item-list">
          {steps.map((step, idx) => (
            <div key={idx} className="item-row">
              {editing === idx ? (
                <StepForm
                  initial={step}
                  submitLabel="Save"
                  onSubmit={(text) => {
                    update(idx, text);
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <span className="step-number">{idx + 1}.</span>
                  <span className="item-name">{step}</span>
                  <div className="item-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(idx)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(idx)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface RecipeCreateModalProps {
  onClose: () => void;
  onCreated: (recipe: Recipe) => void;
}

function RecipeCreateModal({ onClose, onCreated }: RecipeCreateModalProps) {
  const [name, setName] = useState('');
  const [newIngredients, setNewIngredients] = useState<RecipeIngredient[]>([]);
  const [newSteps, setNewSteps] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a recipe name');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const recipe = await recipes.create({
        name: name.trim(),
        ingredients: newIngredients,
        instructions: newSteps,
      });
      onCreated(recipe);
    } catch {
      setError('Failed to create recipe');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="New recipe" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New recipe</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Recipe name</label>
            <input
              className="form-input"
              placeholder="e.g. Pasta Carbonara"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              autoFocus
            />
          </div>
          <IngredientEditor ingredients={newIngredients} onChange={setNewIngredients} />
          <StepEditor steps={newSteps} onChange={setNewSteps} />
          {error && <div className="error-msg">{error}</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : 'Add recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Recipes() {
  const [list, setList] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingScrollId = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    recipes
      .list({ q: query, page, per_page: perPage })
      .then(({ data, meta }) => {
        if (cancelled) return;
        setList(data);
        setTotal(meta.total);
        setError('');
        if (pendingScrollId.current != null && data.some((r) => r.id === pendingScrollId.current)) {
          setExpandedId(pendingScrollId.current);
          setTimeout(() => {
            document.getElementById(`recipe-${pendingScrollId.current}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 60);
          pendingScrollId.current = null;
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load recipes');
      });
    return () => {
      cancelled = true;
    };
  }, [query, page, perPage]);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const updateRecipe = (id: number, patch: Partial<Recipe>) => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    recipes.update(id, patch).catch(() => setError('Failed to save changes'));
  };

  const handleCreated = (recipe: Recipe) => {
    pendingScrollId.current = recipe.id;
    setShowCreate(false);
    setSearchInput('');
    setQuery('');
    setPage(1);
    setSuccess('Recipe saved');
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = async (id: number) => {
    setError('');
    try {
      await recipes.delete(id);
      const remaining = list.filter((r) => r.id !== id);
      setList(remaining);
      setTotal((t) => Math.max(0, t - 1));
      if (remaining.length === 0 && page > 1) setPage(page - 1);
      setExpandedId((cur) => (cur === id ? null : cur));
      setEditingNameId((cur) => (cur === id ? null : cur));
    } catch {
      setError('Failed to delete recipe');
    }
  };

  const startRename = (recipe: Recipe) => {
    setEditingNameId(recipe.id);
    setDraftName(recipe.name);
  };

  const saveName = (id: number) => {
    const name = draftName.trim();
    if (!name) return;
    setEditingNameId(null);
    updateRecipe(id, { name });
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Recipes</h1>
          <span className="subtitle">{total} saved</span>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <span className="btn-icon">+</span> New recipe
          </button>
        </div>
      </div>

      <div className="recipes-toolbar">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <input
            className="form-input"
            type="search"
            placeholder="Search recipes…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="info-msg">{success}</div>}

      <div className="card-grid">
        {list.length === 0 && (
          <div className="empty-state">
            <p>
              {query
                ? `No recipes match “${query}”.`
                : 'No recipes yet. Click “New recipe” to add your first one.'}
            </p>
          </div>
        )}

        {list.map((recipe) => {
          const expanded = expandedId === recipe.id;
          const ingCount = (recipe.ingredients || []).length;
          const stepCount = (recipe.instructions || []).length;
          return (
            <div key={recipe.id} id={`recipe-${recipe.id}`} className="card">
              <div className="recipe-header">
                {editingNameId !== recipe.id && (
                  <button
                    type="button"
                    className="accordion-toggle"
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : recipe.id)}
                  >
                    <span className={`accordion-arrow ${expanded ? 'open' : ''}`}>▸</span>
                  </button>
                )}
                {editingNameId === recipe.id ? (
                  <form
                    className="recipe-name-edit"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveName(recipe.id);
                    }}
                  >
                    <input
                      className="form-input"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingNameId(null);
                      }}
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={!draftName.trim()}>
                      Save
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingNameId(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="recipe-header-info" onClick={() => setExpandedId(expanded ? null : recipe.id)}>
                    <div className="recipe-name">{recipe.name}</div>
                    <div className="recipe-meta">
                      {ingCount} ingredient{ingCount !== 1 ? 's' : ''} · {stepCount} step{stepCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => startRename(recipe)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(recipe.id)}>Delete</button>
              </div>

              <div className={`recipe-body ${expanded ? 'open' : ''}`}>
                <div>
                  <IngredientEditor
                    ingredients={recipe.ingredients || []}
                    onChange={(next) => updateRecipe(recipe.id, { ingredients: next })}
                  />
                  <StepEditor
                    steps={recipe.instructions || []}
                    onChange={(next) => updateRecipe(recipe.id, { instructions: next })}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button type="button" className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}

      {showCreate && (
        <RecipeCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}