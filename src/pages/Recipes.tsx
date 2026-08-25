import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Recipe } from '../services/api';
import { useRecipes } from '../contexts/RecipesContext';
import { usePantry } from '../contexts/PantryContext';
import { useToast } from '../contexts/ToastContext';
import RecipeCard from '../components/RecipeCard';
import RecipeCreateModal from '../components/RecipeCreateModal';
import RecipePhotoEditModal from '../components/RecipePhotoEditModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import ImportToGroceryModal from '../components/ImportToGroceryModal';
import EditModal from '../components/EditModal';
import { SkeletonCard } from '../components/Skeleton';
import { useFocusSearch } from '../hooks/useFocusSearch';

export default function Recipes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    list,
    total,
    loading,
    error: contextError,
    page,
    perPage,
    query,
    setPage,
    setQuery,
    updateRecipe,
    deleteRecipe,
    refresh,
  } = useRecipes();
  const { items: pantryItems } = usePantry();
  const { showToast } = useToast();
  const searchRef = useRef<HTMLInputElement | null>(null);
  useFocusSearch(searchRef);
  const [searchInput, setSearchInput] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [renaming, setRenaming] = useState<Recipe | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Recipe | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Recipe | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [addingToGroceryList, setAddingToGroceryList] = useState<Recipe | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput, setPage, setQuery]);

  // Handle ?q= from Dashboard "Cook tonight?" links: pre-fill the search bar
  // and run the search immediately, so the result shows like a normal search.
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (!qParam) return;

    setSearchParams({}, { replace: true });
    setSearchInput(qParam);
    setQuery(qParam);
    setPage(1);
  }, [searchParams, setSearchParams, setQuery, setPage]);

  // Leaving the page clears the search so shared context stays unfiltered
  useEffect(() => {
    return () => {
      setQuery('');
      setPage(1);
    };
  }, [setQuery, setPage]);

  const handleCreated = (recipe: Recipe) => {
    setShowCreate(false);
    setSearchInput('');
    setPage(1);
    setExpandedId(recipe.id);
    refresh().catch(() => showToast('Failed to refresh recipes', 'error'));
    showToast('Recipe saved');
  };

  const handleDeleteRecipe = async (id: number) => {
    try {
      await deleteRecipe(id);
      setConfirmingDelete(null);
      showToast('Recipe deleted');
    } catch {
      showToast('Failed to delete recipe', 'error');
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
            ref={searchRef}
            className="form-input"
            type="search"
            placeholder="Search recipes…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {contextError && <div className="error-msg">{contextError}</div>}

      <div className="card-grid">
        {!loading && list.length === 0 && (
          <div className="empty-state">
            <p>
              {query
                ? `No recipes match “${query}”.`
                : 'No recipes yet. Click “New recipe” to add your first one.'}
            </p>
          </div>
        )}

        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : list.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                elementId={`recipe-${recipe.id}`}
                recipe={recipe}
                expanded={expandedId === recipe.id}
                onToggle={() => setExpandedId((cur) => (cur === recipe.id ? null : recipe.id))}
                onRename={() => setRenaming(recipe)}
                onDelete={() => setConfirmingDelete(recipe)}
                onPhotoEdit={() => setEditingPhoto(recipe)}
                onIngredientsChange={(ingredients) =>
                  updateRecipe(recipe.id, { ingredients }).catch(() => showToast('Failed to save changes', 'error'))
                }
                onStepsChange={(steps) =>
                  updateRecipe(recipe.id, { instructions: steps }).catch(() => showToast('Failed to save changes', 'error'))
                }
                pantryItems={pantryItems}
                onAddToGroceryList={() => setAddingToGroceryList(recipe)}
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
            updateRecipe(renaming.id, { name })
              .then(() => showToast('Recipe renamed'))
              .catch(() => showToast('Failed to rename recipe', 'error'));
            setRenaming(null);
          }}
          onCancel={() => setRenaming(null)}
        />
      )}

      {confirmingDelete && (
        <ConfirmDeleteModal
          title="Delete recipe?"
          message={`“${confirmingDelete.name}” and all its ingredients and steps will be permanently removed. This can’t be undone.`}
          onConfirm={() => handleDeleteRecipe(confirmingDelete.id)}
          onCancel={() => setConfirmingDelete(null)}
        />
      )}

      {showCreate && (
        <RecipeCreateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}

      {editingPhoto && (
        <RecipePhotoEditModal
          recipe={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSaved={(updated) => {
            updateRecipe(updated.id, updated)
              .then(() => showToast('Photo updated'))
              .catch(() => showToast('Failed to update photo', 'error'));
            setEditingPhoto(null);
          }}
        />
      )}

      {addingToGroceryList && (
        <ImportToGroceryModal
          recipe={addingToGroceryList}
          pantryItems={pantryItems}
          onClose={() => setAddingToGroceryList(null)}
          onImported={() => {
            setAddingToGroceryList(null);
            showToast('Ingredients added to grocery list');
          }}
        />
      )}
    </div>
  );
}