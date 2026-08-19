import { useEffect, useState } from 'react';
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flex: 1 }}>
      <div className="form-group" style={{ flex: 2 }}>
        <label>Ingredient</label>
        <input className="form-input" placeholder="e.g. Spaghetti" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div className="form-group" style={{ flex: 1 }}>
        <label>Qty</label>
        <input className="form-input" type="number" min="0" placeholder="200" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div className="form-group" style={{ flex: 1 }}>
        <label>Unit</label>
        <select className="form-input" value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="">None</option>
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-primary">{submitLabel}</button>
      <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
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
    <div>
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
      <div style={{ marginTop: '0.5rem' }}>
        {adding ? (
          <IngredientForm
            submitLabel="Add"
            onSubmit={(data) => {
              add(data);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>Add ingredient</button>
        )}
      </div>
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flex: 1 }}>
      <div className="form-group" style={{ flex: 1 }}>
        <label>Step</label>
        <input className="form-input" placeholder="Describe this step..." value={text} onChange={(e) => setText(e.target.value)} required autoFocus />
      </div>
      <button type="submit" className="btn btn-primary">{submitLabel}</button>
      <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
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
    <div>
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
      <div style={{ marginTop: '0.5rem' }}>
        {adding ? (
          <StepForm
            submitLabel="Add"
            onSubmit={(text) => {
              add(text);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>Add step</button>
        )}
      </div>
    </div>
  );
}

export default function Recipes() {
  const [list, setList] = useState<Recipe[]>([]);
  const [name, setName] = useState('');
  const [newIngredients, setNewIngredients] = useState<RecipeIngredient[]>([]);
  const [newSteps, setNewSteps] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    recipes.list().then(setList).catch(() => setError('Failed to load recipes'));
  }, []);

  const updateRecipe = (id: number, patch: Partial<Recipe>) => {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    recipes.update(id, patch).catch(() => setError('Failed to save changes'));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const recipe = await recipes.create({
        name,
        ingredients: newIngredients,
        instructions: newSteps,
      });
      setList((prev) => [...prev, recipe]);
      setName('');
      setNewIngredients([]);
      setNewSteps([]);
    } catch {
      setError('Failed to create recipe');
    }
  };

  const handleDelete = async (id: number) => {
    setError('');
    try {
      await recipes.delete(id);
      setList((prev) => prev.filter((r) => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      setError('Failed to delete recipe');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Recipes</h1>
        <span className="subtitle">{list.length} saved</span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="form-group">
            <label>Recipe name</label>
            <input className="form-input" placeholder="e.g. Pasta Carbonara" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="recipe-section">
            <div className="recipe-section-title">Ingredients</div>
            <IngredientEditor ingredients={newIngredients} onChange={setNewIngredients} />
          </div>
          <div className="recipe-section">
            <div className="recipe-section-title">Procedure</div>
            <StepEditor steps={newSteps} onChange={setNewSteps} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Add recipe</button>
        </form>
      </div>

      <div className="card-grid">
        {list.length === 0 && (
          <div className="empty-state">
            <p>No recipes yet. Add your first one above.</p>
          </div>
        )}

        {list.map((recipe) => {
          const expanded = expandedId === recipe.id;
          const ingCount = (recipe.ingredients || []).length;
          const stepCount = (recipe.instructions || []).length;
          return (
            <div key={recipe.id} className="card">
              <div className="recipe-header">
                <button
                  type="button"
                  className="accordion-toggle"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : recipe.id)}
                >
                  <span className={`accordion-arrow ${expanded ? 'open' : ''}`}>▸</span>
                </button>
                <div className="recipe-header-info" onClick={() => setExpandedId(expanded ? null : recipe.id)}>
                  <div className="recipe-name">{recipe.name}</div>
                  <div className="recipe-meta">
                    {ingCount} ingredient{ingCount !== 1 ? 's' : ''} · {stepCount} step{stepCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(recipe.id)}>Delete</button>
              </div>

              <div className={`recipe-body ${expanded ? 'open' : ''}`}>
                <div>
                  <div className="recipe-section">
                    <div className="recipe-section-title">Ingredients</div>
                    <IngredientEditor
                      ingredients={recipe.ingredients || []}
                      onChange={(next) => updateRecipe(recipe.id, { ingredients: next })}
                    />
                  </div>
                  <div className="recipe-section">
                    <div className="recipe-section-title">Procedure</div>
                    <StepEditor
                      steps={recipe.instructions || []}
                      onChange={(next) => updateRecipe(recipe.id, { instructions: next })}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}