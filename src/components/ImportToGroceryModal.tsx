import { useEffect, useState } from 'react';
import { UNITS, type Recipe, type PantryItem } from '../services/api';
import { useGroceryLists } from '../contexts/GroceryListContext';

interface ImportToGroceryModalProps {
  recipe: Recipe;
  pantryItems: PantryItem[];
  onClose: () => void;
  onImported: (listId: number) => void;
}

interface ItemDraft {
  name: string;
  quantity: number | undefined;
  unit: string | undefined;
}

export default function ImportToGroceryModal({ recipe, pantryItems, onClose, onImported }: ImportToGroceryModalProps) {
  const { lists, createList, addItem } = useGroceryLists();
  const ingredients = recipe.ingredients || [];

  const [mode, setMode] = useState<'existing' | 'new'>(lists.length === 0 ? 'new' : 'existing');
  const [selectedListId, setSelectedListId] = useState<number | null>(lists.length > 0 ? lists[0].id : null);
  const [newListName, setNewListName] = useState(`${recipe.name} ingredients`);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState<ItemDraft[]>(() =>
    ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
    }))
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

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

  const handleImport = async () => {
    setImporting(true);
    setError('');

    try {
      let listId: number;

      if (mode === 'new') {
        if (!newListName.trim()) {
          setError('Please enter a list name');
          setImporting(false);
          return;
        }
        const newList = await createList({ name: newListName.trim() });
        listId = newList.id;
      } else {
        if (!selectedListId) {
          setError('Please select a list');
          setImporting(false);
          return;
        }
        listId = selectedListId;
      }

      for (const item of items) {
        const pantryMatch = pantryItems.find(
          (p) => p.name.toLowerCase() === item.name.toLowerCase()
        );
        await addItem(listId, {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          status: pantryMatch ? 'checked' : undefined,
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
          <h2>Add to Grocery List</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="confirm-delete-text" style={{ marginBottom: '1rem' }}>
            Add {items.length} ingredient{items.length !== 1 ? 's' : ''} from "{recipe.name}":
          </p>

          <div className="item-list" style={{ marginBottom: '1rem' }}>
            {items.map((item) => (
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
                    onChange={(e) => {
                      const idx = items.indexOf(item);
                      updateItem(idx, 'quantity', e.target.value);
                    }}
                  />
                  <select
                    className="form-input form-input-sm"
                    value={item.unit ?? ''}
                    onChange={(e) => {
                      const idx = items.indexOf(item);
                      updateItem(idx, 'unit', e.target.value);
                    }}
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
                placeholder="e.g. Weekly groceries"
                autoFocus
              />
            </div>
          )}

          {error && <div className="error-msg" style={{ marginTop: '0.75rem' }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            disabled={importing || (mode === 'existing' && !selectedListId)}
            onClick={handleImport}
          >
            {importing ? 'Importing...' : mode === 'new' ? 'Create & Add' : 'Add to List'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={importing}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
