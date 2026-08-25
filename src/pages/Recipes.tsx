import { useEffect, useRef, useState } from 'react';
import { recipes, UNITS, type Recipe, type RecipeIngredient } from '../services/api';
import ChevronActions from '../components/ChevronActions';
import EditModal from '../components/EditModal';

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M11.3 2.3a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-7 7-2.7.6.6-2.7 7-7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5l.5 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface IngredientEditorProps {
  ingredients: RecipeIngredient[];
  onChange: (next: RecipeIngredient[]) => void;
  hideTitle?: boolean;
}

function IngredientEditor({ ingredients, onChange, hideTitle }: IngredientEditorProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const add = (data: RecipeIngredient) => onChange([...ingredients, data]);
  const update = (idx: number, data: RecipeIngredient) => {
    const next = [...ingredients];
    next[idx] = data;
    onChange(next);
  };
  const remove = (idx: number) => onChange(ingredients.filter((_, i) => i !== idx));

  return (
    <div className="recipe-section">
      <div className={`recipe-section-title-row ${hideTitle ? 'detail-add-row' : ''}`}>
        {!hideTitle && (
          <span className="recipe-section-title">
            Ingredients
            {ingredients.length > 0 && <span className="section-count">{ingredients.length}</span>}
          </span>
        )}
        <button type="button" className="add-row-btn" onClick={() => setAdding(true)}>
          <span className="add-row-icon">+</span> Add ingredient
        </button>
      </div>
      {adding && (
        <EditModal
          title="Add ingredient"
          submitLabel="Add"
          fields={[
            { key: 'name', label: 'Ingredient', required: true, autoFocus: true },
            { key: 'quantity', label: 'Qty', type: 'number', placeholder: '200' },
            { key: 'unit', label: 'Unit', type: 'select', options: UNITS },
          ]}
          initial={{}}
          onSubmit={(values) => {
            add({
              name: String(values.name ?? '').trim(),
              quantity: values.quantity ? Number(values.quantity) : undefined,
              unit: String(values.unit ?? '').trim() || undefined,
            });
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
            <ChevronActions
              key={idx}
              isOpen={openIdx === idx}
              onToggle={() => setOpenIdx((cur) => (cur === idx ? null : idx))}
              actions={
                <>
                  <button className="action-edit-btn" onClick={() => setEditingIdx(idx)}>Edit</button>
                  <button className="action-delete-btn" onClick={() => remove(idx)}>Delete</button>
                </>
              }
            >
              <div className="recipe-row">
                <span className="item-name">{ing.name}</span>
                {ing.quantity != null && (
                  <span className="item-meta">{ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}</span>
                )}
              </div>
            </ChevronActions>
          ))}
        </div>
      )}

      {editingIdx != null && (
        <EditModal
          title="Edit ingredient"
          fields={[
            { key: 'name', label: 'Ingredient', required: true, autoFocus: true },
            { key: 'quantity', label: 'Qty', type: 'number', placeholder: '200' },
            { key: 'unit', label: 'Unit', type: 'select', options: UNITS },
          ]}
          initial={ingredients[editingIdx] ?? {}}
          onSubmit={(values) => {
            update(editingIdx, {
              name: String(values.name ?? '').trim(),
              quantity: values.quantity ? Number(values.quantity) : undefined,
              unit: String(values.unit ?? '').trim() || undefined,
            });
            setEditingIdx(null);
          }}
          onCancel={() => setEditingIdx(null)}
        />
      )}
    </div>
  );
}

interface StepEditorProps {
  steps: string[];
  onChange: (next: string[]) => void;
  hideTitle?: boolean;
}

function StepEditor({ steps, onChange, hideTitle }: StepEditorProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const add = (text: string) => onChange([...steps, text]);
  const update = (idx: number, text: string) => {
    const next = [...steps];
    next[idx] = text;
    onChange(next);
  };
  const remove = (idx: number) => onChange(steps.filter((_, i) => i !== idx));

  return (
    <div className="recipe-section">
      <div className={`recipe-section-title-row ${hideTitle ? 'detail-add-row' : ''}`}>
        {!hideTitle && (
          <span className="recipe-section-title">
            Instructions
            {steps.length > 0 && <span className="section-count">{steps.length}</span>}
          </span>
        )}
        <button type="button" className="add-row-btn" onClick={() => setAdding(true)}>
          <span className="add-row-icon">+</span> Add step
        </button>
      </div>
      {adding && (
        <EditModal
          title="Add step"
          submitLabel="Add"
          fields={[{ key: 'text', label: 'Step', type: 'textarea', rows: 3, required: true, autoFocus: true }]}
          initial={{}}
          onSubmit={(values) => {
            add(String(values.text ?? '').trim());
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
            <ChevronActions
              key={idx}
              isOpen={openIdx === idx}
              onToggle={() => setOpenIdx((cur) => (cur === idx ? null : idx))}
              actions={
                <>
                  <button className="action-edit-btn" onClick={() => setEditingIdx(idx)}>Edit</button>
                  <button className="action-delete-btn" onClick={() => remove(idx)}>Delete</button>
                </>
              }
            >
              <div className="recipe-row">
                <span className="step-number">{idx + 1}.</span>
                <span className="item-name">{step}</span>
              </div>
            </ChevronActions>
          ))}
        </div>
      )}

      {editingIdx != null && (
        <EditModal
          title="Edit step"
          fields={[{ key: 'text', label: 'Step', type: 'textarea', rows: 3, required: true, autoFocus: true }]}
          initial={{ text: steps[editingIdx] ?? '' }}
          onSubmit={(values) => {
            update(editingIdx, String(values.text ?? '').trim());
            setEditingIdx(null);
          }}
          onCancel={() => setEditingIdx(null)}
        />
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
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl('');
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a recipe name');
      return;
    }
    setError('');
    setSaving(true);
    try {
      let recipe: Recipe;
      if (imageFile) {
        const formData = new FormData();
        formData.append('recipe[name]', name.trim());
        formData.append('recipe[image]', imageFile);
        if (newIngredients.length > 0) formData.append('recipe[ingredients]', JSON.stringify(newIngredients));
        if (newSteps.length > 0) formData.append('recipe[instructions]', JSON.stringify(newSteps));
        recipe = await recipes.createWithImage(formData);
      } else {
        recipe = await recipes.create({
          name: name.trim(),
          image_url: imageUrl.trim() || undefined,
          ingredients: newIngredients,
          instructions: newSteps,
        });
      }
      onCreated(recipe);
    } catch {
      setError('Failed to create recipe');
      setSaving(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
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
          <div className="form-group">
            <label>Photo</label>
            {imagePreview ? (
              <div className="recipe-image-preview">
                <img src={imagePreview} alt="Preview" />
                <button type="button" className="btn btn-secondary btn-sm" onClick={clearImage}>Remove</button>
              </div>
            ) : (
              <div className="recipe-image-upload">
                <label className="recipe-image-upload-btn">
                  <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                  Choose file
                </label>
                <span className="recipe-image-upload-hint">or paste a URL below</span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Photo URL (optional)</label>
            <input
              className="form-input"
              placeholder="https://example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); setImagePreview(''); }}
              disabled={!!imageFile}
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

interface ConfirmDeleteModalProps {
  recipeName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteModal({ recipeName, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Delete recipe"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Delete recipe?</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p className="confirm-delete-text">
            “{recipeName}” and all its ingredients and steps will be permanently removed. This can’t be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  expanded: boolean;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onPhotoEdit: () => void;
  onIngredientsChange: (ingredients: RecipeIngredient[]) => void;
  onStepsChange: (steps: string[]) => void;
}

function RecipeCard({ recipe, expanded, onToggle, onRename, onDelete, onPhotoEdit, onIngredientsChange, onStepsChange }: RecipeCardProps) {
  const [tab, setTab] = useState<'ingredients' | 'steps'>('ingredients');
  const ingCount = (recipe.ingredients || []).length;
  const stepCount = (recipe.instructions || []).length;

  return (
    <div className="card">
      <div className="recipe-header" onClick={onToggle}>
        <div className="recipe-card-image">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.name} loading="lazy" />
          ) : (
            <div className="recipe-card-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          )}
          {expanded && (
            <button
              type="button"
              className="recipe-card-photo-btn"
              aria-label="Edit photo"
              onClick={(e) => { e.stopPropagation(); onPhotoEdit(); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
          )}
        </div>
        <div className="recipe-header-info">
          <div className="recipe-title-row">
            <span className="recipe-name">{recipe.name}</span>
            <button
              type="button"
              className="detail-icon-btn"
              aria-label="Rename recipe"
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
            >
              <PencilIcon />
            </button>
          </div>
          <div className="recipe-meta">
            {ingCount} ingredient{ingCount !== 1 ? 's' : ''} · {stepCount} step{stepCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="recipe-header-actions">
          {expanded && (
            <button
              type="button"
              className="detail-icon-btn detail-icon-danger"
              aria-label="Delete recipe"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <TrashIcon />
            </button>
          )}
          <button
            type="button"
            className={`chevron-btn detail-chevron ${expanded ? 'open' : ''}`}
            aria-label={expanded ? 'Collapse recipe' : 'Expand recipe'}
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`recipe-body ${expanded ? 'open' : ''}`}>
        <div>
          <div className="detail-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'ingredients'}
              className={tab === 'ingredients' ? 'active' : ''}
              onClick={() => setTab('ingredients')}
            >
              Ingredients
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'steps'}
              className={tab === 'steps' ? 'active' : ''}
              onClick={() => setTab('steps')}
            >
              Instructions
            </button>
          </div>
          {tab === 'ingredients' ? (
            <IngredientEditor hideTitle ingredients={recipe.ingredients || []} onChange={onIngredientsChange} />
          ) : (
            <StepEditor hideTitle steps={recipe.instructions || []} onChange={onStepsChange} />
          )}
        </div>
      </div>
    </div>
  );
}

interface RecipePhotoEditModalProps {
  recipe: Recipe;
  onClose: () => void;
  onSaved: (recipe: Recipe) => void;
}

function RecipePhotoEditModal({ recipe, onClose, onSaved }: RecipePhotoEditModalProps) {
  const [imageUrl, setImageUrl] = useState(recipe.image_url || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl('');
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      let updated: Recipe;
      if (imageFile) {
        const formData = new FormData();
        formData.append('recipe[image]', imageFile);
        updated = await recipes.updateWithImage(recipe.id, formData);
      } else {
        updated = await recipes.update(recipe.id, { image_url: imageUrl.trim() || undefined });
      }
      onSaved(updated);
    } catch {
      setError('Failed to update photo');
      setSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await recipes.update(recipe.id, { image_url: '' });
      onSaved(updated);
    } catch {
      setError('Failed to remove photo');
      setSaving(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Edit photo" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit photo</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {imagePreview ? (
            <div className="recipe-image-preview">
              <img src={imagePreview} alt="Preview" />
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearImage}>Remove</button>
            </div>
          ) : recipe.image_url ? (
            <div className="recipe-image-preview">
              <img src={recipe.image_url} alt={recipe.name} />
            </div>
          ) : null}
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label>Upload from file</label>
            <div className="recipe-image-upload">
              <label className="recipe-image-upload-btn">
                <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                Choose file
              </label>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label>Or paste a URL</label>
            <input
              className="form-input"
              placeholder="https://example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); setImagePreview(''); }}
              disabled={!!imageFile}
            />
          </div>
          {error && <div className="error-msg" style={{ marginTop: '0.75rem' }}>{error}</div>}
        </div>
        <div className="modal-footer">
          {recipe.image_url && !confirmingRemove && (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmingRemove(true)} disabled={saving}>
              Remove photo
            </button>
          )}
          {confirmingRemove && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <span style={{ color: 'var(--charcoal)', fontSize: '0.875rem' }}>Remove photo?</span>
              <button type="button" className="btn btn-danger" onClick={handleRemovePhoto} disabled={saving}>
                Yes, remove
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmingRemove(false)} disabled={saving}>
                No
              </button>
            </span>
          )}
          {!confirmingRemove && (
            <>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            </>
          )}
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
  const [renaming, setRenaming] = useState<Recipe | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Recipe | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Recipe | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
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
  }, [query, page, perPage, reloadKey]);

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
    setShowCreate(false);
    setSearchInput('');
    setQuery('');
    setPage(1);
    setReloadKey((k) => k + 1);
    pendingScrollId.current = recipe.id;
    setSuccess('Recipe saved');
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteRecipe = async (id: number) => {
    setError('');
    try {
      await recipes.delete(id);
      const remaining = list.filter((r) => r.id !== id);
      setList(remaining);
      setTotal((t) => Math.max(0, t - 1));
      if (remaining.length === 0 && page > 1) setPage(page - 1);
      setExpandedId((cur) => (cur === id ? null : cur));
      setRenaming((cur) => (cur?.id === id ? null : cur));
      setConfirmingDelete((cur) => (cur?.id === id ? null : cur));
    } catch {
      setError('Failed to delete recipe');
    }
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

        {list.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            expanded={expandedId === recipe.id}
            onToggle={() => setExpandedId((cur) => (cur === recipe.id ? null : recipe.id))}
            onRename={() => setRenaming(recipe)}
            onDelete={() => setConfirmingDelete(recipe)}
            onPhotoEdit={() => setEditingPhoto(recipe)}
            onIngredientsChange={(ingredients) => updateRecipe(recipe.id, { ingredients })}
            onStepsChange={(steps) => updateRecipe(recipe.id, { instructions: steps })}
          />
        ))}
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

      {renaming && (
        <EditModal
          title="Rename recipe"
          fields={[{ key: 'name', label: 'Recipe name', required: true, autoFocus: true }]}
          initial={{ name: renaming.name }}
          onSubmit={(values) => {
            const name = String(values.name ?? '').trim();
            if (!name) return;
            updateRecipe(renaming.id, { name });
            setRenaming(null);
          }}
          onCancel={() => setRenaming(null)}
        />
      )}

      {confirmingDelete && (
        <ConfirmDeleteModal
          recipeName={confirmingDelete.name}
          onConfirm={() => {
            handleDeleteRecipe(confirmingDelete.id);
            setConfirmingDelete(null);
          }}
          onCancel={() => setConfirmingDelete(null)}
        />
      )}

      {showCreate && (
        <RecipeCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {editingPhoto && (
        <RecipePhotoEditModal
          recipe={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSaved={(updated) => {
            setList((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setEditingPhoto(null);
          }}
        />
      )}
    </div>
  );
}