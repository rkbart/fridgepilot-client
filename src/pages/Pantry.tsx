import { useState, useEffect } from 'react';
import { pantry, type PantryItem } from '../services/api';

export default function Pantry() {
  const [list, setList] = useState<PantryItem[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');

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

  const handleDelete = async (id: number) => {
    await pantry.delete(id);
    setList((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Pantry</h1>
        <span className="subtitle">{list.length} item{list.length !== 1 ? 's' : ''}</span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Item name</label>
            <input className="form-input" placeholder="e.g. Eggs" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Qty</label>
            <input className="form-input" type="number" placeholder="12" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
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
                <span className="item-name">{item.name}</span>
                {item.quantity != null && (
                  <span className="item-meta">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                )}
                <div className="item-actions">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
