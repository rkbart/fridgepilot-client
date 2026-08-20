import { useEffect, useState, useMemo } from 'react';
import { groceryLists, UNITS, type GroceryItem, type GroceryList } from '../services/api';
import SwipeToReveal from '../components/SwipeToReveal';
import BottomSheet from '../components/BottomSheet';

interface ItemFormProps {
  initial?: Partial<GroceryItem>;
  submitLabel: string;
  onSubmit: (data: { name: string; quantity?: number; unit?: string }) => void;
  onCancel: () => void;
}

function ItemForm({ initial, submitLabel, onSubmit, onCancel }: ItemFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [quantity, setQuantity] = useState(initial?.quantity != null ? String(initial.quantity) : '');
  const [unit, setUnit] = useState(initial?.unit || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="inline-form">
      <div className="form-group inline-form-field-lg">
        <label>Item name</label>
        <input className="form-input" placeholder="e.g. Milk" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div className="form-group inline-form-field-sm">
        <label>Qty</label>
        <input className="form-input" type="number" min="0" placeholder="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
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

export default function GroceryListPage() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [addingToList, setAddingToList] = useState<number | null>(null);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [draftListName, setDraftListName] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchInput.trim().toLowerCase());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return lists;
    return lists.filter((l) => l.name.toLowerCase().includes(debouncedQuery));
  }, [lists, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    groceryLists.list().then(setLists).catch(() => setError('Failed to load grocery lists'));
  }, []);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const list = await groceryLists.create({ name: newListName });
      setLists((prev) => [...prev, list]);
      setNewListName('');
      setShowCreate(false);
    } catch {
      setError('Failed to create list');
    }
  };

  const handleRenameList = async (listId: number) => {
    if (!draftListName.trim()) return;
    setError('');
    try {
      const updated = await groceryLists.update(listId, { name: draftListName.trim() });
      setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, ...updated } : l)));
      setEditingListId(null);
    } catch {
      setError('Failed to rename list');
    }
  };

  const handleDeleteList = async (id: number) => {
    setError('');
    try {
      await groceryLists.delete(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError('Failed to delete list');
    }
  };

  const handleAddItem = async (listId: number, data: { name: string; quantity?: number; unit?: string }) => {
    setError('');
    try {
      const item = await groceryLists.addItem(listId, data);
      setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, items: [...l.items, item] } : l)));
      setAddingToList(null);
    } catch {
      setError('Failed to add item');
    }
  };

  const handleToggleItem = async (listId: number, item: GroceryItem) => {
    const nextStatus = item.status === 'checked' ? 'pending' : 'checked';
    try {
      const updated = await groceryLists.updateItem(listId, item.id, { status: nextStatus });
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId
            ? { ...l, items: l.items.map((i) => (i.id === item.id ? updated : i)) }
            : l
        )
      );
    } catch {
      setError('Failed to update item');
    }
  };

  const handleUpdateItem = async (listId: number, itemId: number, data: { name: string; quantity?: number; unit?: string }) => {
    setError('');
    try {
      const updated = await groceryLists.updateItem(listId, itemId, data);
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId
            ? { ...l, items: l.items.map((i) => (i.id === itemId ? updated : i)) }
            : l
        )
      );
    } catch {
      setError('Failed to update item');
    }
  };

  const handleDeleteItem = async (listId: number, itemId: number) => {
    setError('');
    try {
      await groceryLists.deleteItem(listId, itemId);
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l
        )
      );
    } catch {
      setError('Failed to delete item');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Grocery Lists</h1>
          <span className="subtitle">{lists.length} list{lists.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <span className="btn-icon">+</span> New list
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
            placeholder="Search lists…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showCreate && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <form onSubmit={handleCreateList} className="inline-form">
            <div className="form-group inline-form-field-lg">
              <label>List name</label>
              <input className="form-input" placeholder="e.g. Weekly groceries" value={newListName} onChange={(e) => setNewListName(e.target.value)} required autoFocus />
            </div>
            <div className="inline-form-actions">
              <button type="submit" className="btn btn-primary btn-sm">Create</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>
            {debouncedQuery
              ? `No lists match "${debouncedQuery}".`
              : 'No grocery lists yet. Click "New list" to add your first one.'}
          </p>
        </div>
      )}

      {paginated.map((list) => {
        const expanded = addingToList === list.id;
        const itemCount = list.items.length;
        return (
          <div key={list.id} className="card" style={{ marginBottom: '1rem' }}>
            <div className="recipe-header">
              <button
                type="button"
                className="accordion-toggle"
                aria-expanded={expanded}
                onClick={() => setAddingToList(expanded ? null : list.id)}
              >
                <span className={`accordion-arrow ${expanded ? 'open' : ''}`}>▸</span>
              </button>
              <div className="recipe-header-info" onClick={() => setAddingToList(expanded ? null : list.id)}>
                <div className="recipe-name">{list.name}</div>
                <div className="recipe-meta">
                  {itemCount} item{itemCount !== 1 ? 's' : ''} · {list.source === 'ai_generated' ? 'AI' : 'Manual'}
                </div>
              </div>
              <div className="recipe-header-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => { setEditingListId(list.id); setDraftListName(list.name); }}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteList(list.id)}>Delete</button>
                <button className="btn btn-icon-only" onClick={() => { setEditingListId(list.id); setDraftListName(list.name); }} aria-label="Edit">✏️</button>
                <button className="btn btn-icon-only" onClick={() => handleDeleteList(list.id)} aria-label="Delete">🗑️</button>
              </div>
            </div>

            <div className={`recipe-body ${expanded ? 'open' : ''}`}>
              <div>
                {list.items.length === 0 ? (
                  <div className="empty-inline">No items yet</div>
                ) : (
                  <div className="item-list">
                    {list.items.map((item) => (
                      <div key={item.id} className="item-row">
                        <SwipeToReveal
                          actions={
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateItem(list.id, item.id, { name: item.name })}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteItem(list.id, item.id)}>Delete</button>
                            </>
                          }
                        >
                          <label className={`checkbox-label ${item.status === 'checked' ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={item.status === 'checked'}
                              onChange={() => handleToggleItem(list.id, item)}
                            />
                            <span className="item-text">{item.name}</span>
                          </label>
                          {item.quantity != null && (
                            <span className="item-meta">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                          )}
                          {item.source === 'ai_suggested' && <span className="tag tag-ai">AI</span>}
                          {item.status === 'pending' && <span className="tag tag-pending">Pending</span>}
                          <div className="item-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateItem(list.id, item.id, { name: item.name })}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteItem(list.id, item.id)}>Delete</button>
                          </div>
                        </SwipeToReveal>
                      </div>
                    ))}
                  </div>
                )}

                {expanded && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {addingToList === list.id ? (
                      <ItemForm
                        submitLabel="Add"
                        onSubmit={(data) => handleAddItem(list.id, data)}
                        onCancel={() => setAddingToList(null)}
                      />
                    ) : (
                      <button className="add-row-btn" onClick={() => setAddingToList(list.id)}>
                        <span className="add-row-icon">+</span> Add item
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

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

      {editingListId && (
        <BottomSheet open={true} onClose={() => setEditingListId(null)} title="Rename list">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>List name</label>
            <input className="form-input" value={draftListName} onChange={(e) => setDraftListName(e.target.value)} required autoFocus />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setEditingListId(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => handleRenameList(editingListId)} disabled={!draftListName.trim()}>Save</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
