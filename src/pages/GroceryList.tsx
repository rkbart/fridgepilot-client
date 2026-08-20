import { useEffect, useState } from 'react';
import { groceryLists, UNITS, type GroceryItem, type GroceryList } from '../services/api';

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
    <form onSubmit={handleSubmit} className="stack-form">
      <div className="form-group">
        <label>Item name</label>
        <input className="form-input" placeholder="e.g. Milk" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div className="form-group">
        <label>Qty</label>
        <input className="form-input" type="number" min="0" placeholder="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div className="form-group">
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

export default function GroceryListPage() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [listName, setListName] = useState('');
  const [addingToList, setAddingToList] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ listId: number; item: GroceryItem } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    groceryLists.list().then(setLists).catch(() => setError('Failed to load grocery lists'));
  }, []);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const list = await groceryLists.create({ name: listName });
      setLists((prev) => [...prev, list]);
      setListName('');
    } catch {
      setError('Failed to create list');
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
      setEditing(null);
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
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleCreateList} className="stack-form">
          <div className="form-group">
            <label>New list name</label>
            <input className="form-input" placeholder="e.g. Weekly groceries" value={listName} onChange={(e) => setListName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </div>

      {lists.length === 0 && (
        <div className="empty-state">
          <p>No grocery lists yet. Create one to get started.</p>
        </div>
      )}

      {lists.map((list) => (
        <div key={list.id} className="card" style={{ marginBottom: '1rem' }}>
          <div className="grocery-list-header-row">
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{list.name}</h3>
            <span className={`tag ${list.source === 'ai_generated' ? 'tag-ai' : 'tag-manual'}`}>
              {list.source === 'ai_generated' ? 'AI' : 'Manual'}
            </span>
            <span className="subtitle">{list.items.length} item{list.items.length !== 1 ? 's' : ''}</span>
            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteList(list.id)}>Delete</button>
          </div>

          {list.items.length === 0 ? (
            <div className="empty-inline">No items yet</div>
          ) : (
            <div className="item-list">
              {list.items.map((item) => (
                <div key={item.id} className="item-row">
                  {editing && editing.listId === list.id && editing.item.id === item.id ? (
                    <ItemForm
                      initial={item}
                      submitLabel="Save"
                      onSubmit={(data) => handleUpdateItem(list.id, item.id, data)}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <>
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
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing({ listId: list.id, item })}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteItem(list.id, item.id)}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '0.75rem' }}>
            {addingToList === list.id ? (
              <ItemForm
                submitLabel="Add"
                onSubmit={(data) => handleAddItem(list.id, data)}
                onCancel={() => setAddingToList(null)}
              />
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => setAddingToList(list.id)}>Add item</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}