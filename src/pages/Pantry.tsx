import { useState, useEffect } from 'react';
import { pantry, type PantryItem } from '../services/api';
import SwipeToReveal from '../components/SwipeToReveal';
import BottomSheet from '../components/BottomSheet';

export default function Pantry() {
  const [list, setList] = useState<PantryItem[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');

  useEffect(() => {
    pantry.list().then(setList).catch(() => setError('Failed to load pantry'));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const item = await pantry.create({
        name,
        quantity: quantity ? Number(quantity) : undefined,
        unit: unit || undefined,
      });
      setList((prev) => [...prev, item]);
      setName('');
      setQuantity('');
      setUnit('');
    } catch {
      setError('Failed to add item');
    }
  };

  const openEdit = (item: PantryItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditQuantity(item.quantity != null ? String(item.quantity) : '');
    setEditUnit(item.unit || '');
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    setError('');
    try {
      const updated = await pantry.update(editingItem.id, {
        name: editName,
        quantity: editQuantity ? Number(editQuantity) : undefined,
        unit: editUnit || undefined,
      });
      setList((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
      setEditingItem(null);
    } catch {
      setError('Failed to update item');
    }
  };

  const handleDelete = async (id: number) => {
    await pantry.delete(id);
    setList((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Pantry</h1>
          <span className="subtitle">{list.length} item{list.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleCreate} className="stack-form">
          <div className="form-group">
            <label>Item name</label>
            <input className="form-input" placeholder="e.g. Eggs" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Qty</label>
            <input className="form-input" type="number" placeholder="12" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <input className="form-input" placeholder="pcs" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">Add</button>
        </form>
      </div>

      <div className="card">
        {list.length === 0 ? (
          <div className="empty-state">
            <p>Your pantry is empty. Add what you have on hand.</p>
          </div>
        ) : (
          <div className="item-list">
            {list.map((item) => (
              <div key={item.id} className="item-row">
                <SwipeToReveal
                  actions={
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                    </>
                  }
                >
                  <span className="item-name">{item.name}</span>
                  {item.quantity != null && (
                    <span className="item-meta">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                  )}
                  <div className="item-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                  </div>
                </SwipeToReveal>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingItem && (
        <BottomSheet open={true} onClose={() => setEditingItem(null)} title="Edit item">
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label>Name</label>
            <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label>Qty</label>
            <input className="form-input" type="number" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Unit</label>
            <input className="form-input" value={editUnit} onChange={(e) => setEditUnit(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setEditingItem(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={!editName.trim()}>Save</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
