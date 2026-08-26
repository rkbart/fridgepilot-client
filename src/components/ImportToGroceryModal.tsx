import { useEffect, useState } from 'react';
import type { Recipe, PantryItem } from '../services/api';
import { useGroceryLists } from '../contexts/GroceryListContext';
import { checkRecipeAvailability, calculateImportQuantity } from '../utils/pantryMatcher';

interface ImportToGroceryModalProps {
  recipe: Recipe;
  pantryItems: PantryItem[];
  onClose: () => void;
  onImported: (listId: number) => void;
}

export default function ImportToGroceryModal({ recipe, pantryItems, onClose, onImported }: ImportToGroceryModalProps) {
  const { lists, createList, addItem } = useGroceryLists();
  const [selectedListId, setSelectedListId] = useState<number | 'new'>('new');
  const [newListName, setNewListName] = useState(`${recipe.name} ingredients`);
  const [addAll, setAddAll] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const ingredients = recipe.ingredients || [];
  const availability = checkRecipeAvailability(ingredients, pantryItems);

  // Calculate what will be imported
  const importPreview = ingredients.map((ing, idx) => {
    const avail = availability.availability[idx];
    const importQty = calculateImportQuantity(ing, avail?.pantryItem, addAll);
    return {
      ingredient: ing,
      availability: avail,
      quantity: importQty.quantity,
      status: importQty.status,
    };
  });

  const missingCount = importPreview.filter((p) => p.status === 'pending').length;
  const checkedCount = importPreview.filter((p) => p.status === 'checked').length;

  const handleImport = async () => {
    setImporting(true);
    setError('');

    try {
      let listId: number;

      if (selectedListId === 'new') {
        if (!newListName.trim()) {
          setError('Please enter a list name');
          setImporting(false);
          return;
        }
        const newList = await createList({ name: newListName.trim() });
        listId = newList.id;
      } else {
        listId = selectedListId;
      }

      // Add items to the list
      for (const item of importPreview) {
        await addItem(listId, {
          name: item.ingredient.name,
          quantity: item.quantity,
          unit: item.ingredient.unit,
        });
      }

      onImported(listId);
    } catch {
      setError('Failed to import ingredients');
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Import to grocery list"
        style={{ maxWidth: 500 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Import to Grocery List</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="import-modal-fields">
            <div className="form-group">
              <label>Select grocery list</label>
              <select
                className="form-input"
                value={selectedListId}
                onChange={(e) => setSelectedListId(Number(e.target.value) || 'new')}
              >
                <option value="new">Create new list</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.items.length} items)
                  </option>
                ))}
              </select>
            </div>

            {selectedListId === 'new' && (
              <div className="form-group">
                <label>New list name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Weekly groceries"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={addAll}
                  onChange={(e) => setAddAll(e.target.checked)}
                />
                <span>Add all ingredients (ignore pantry quantities)</span>
              </label>
            </div>
          </div>

          <div className="import-preview">
            <div className="import-preview-header">
              <span>Preview ({ingredients.length} ingredients)</span>
              {checkedCount > 0 && (
                <span className="import-preview-checked">{checkedCount} already in pantry</span>
              )}
            </div>
            <div className="import-preview-list">
              {importPreview.map((item, idx) => (
                <div key={idx} className={`import-preview-item ${item.status}`}>
                  <span className="import-preview-status">
                    {item.status === 'checked' ? '✓' : '+'}
                  </span>
                  <span className="import-preview-name">{item.ingredient.name}</span>
                  {item.quantity != null && (
                    <span className="import-preview-qty">
                      {item.quantity}{item.ingredient.unit ? ` ${item.ingredient.unit}` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={importing}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleImport}
            disabled={importing || ingredients.length === 0}
          >
            {importing ? 'Importing...' : `Import ${missingCount} missing`}
          </button>
        </div>
      </div>
    </div>
  );
}
