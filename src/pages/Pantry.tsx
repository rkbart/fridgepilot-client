import { useState, useEffect } from 'react';
import { pantry, type PantryItem } from '../services/api';
import ChevronActions from '../components/ChevronActions';
import EditModal from '../components/EditModal';

export default function Pantry() {
  const [list, setList] = useState<PantryItem[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

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

  const handleUpdate = async (id: number, values: { name: string; quantity?: number; unit?: string }) => {
    setError('');
    try {
      const updated = await pantry.update(id, values);
      setList((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setEditingItem(null);
    } catch {
      setError('Failed to update item');
    }
  };

  const handleDelete = async (id: number) => {
    setError('');
    try {
      await pantry.delete(id);
      setList((prev) => prev.filter((i) => i.id !== id));
      setOpenId(null);
    } catch {
      setError('Failed to delete item');
    }
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
              <ChevronActions
                key={item.id}
                isOpen={openId === item.id}
                onToggle={() => setOpenId((cur) => (cur === item.id ? null : item.id))}
                actions={
                  <>
                    <button className="action-edit-btn" onClick={() => setEditingItem(item)}>Edit</button>
                    <button className="action-delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                  </>
                }
              >
                <span className="item-name">{item.name}</span>
                {item.quantity != null && (
                  <span className="item-meta">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                )}
              </ChevronActions>
            ))}
          </div>
        )}
      </div>

      {editingItem && (
        <EditModal
          title="Edit item"
          fields={[
            { key: 'name', label: 'Name', required: true, autoFocus: true },
            { key: 'quantity', label: 'Qty', type: 'number', placeholder: '12' },
            { key: 'unit', label: 'Unit', placeholder: 'pcs' },
          ]}
          initial={editingItem}
          onSubmit={(values) =>
            handleUpdate(editingItem.id, {
              name: values.name as string,
              quantity: values.quantity ? Number(values.quantity) : undefined,
              unit: (values.unit as string) || undefined,
            })
          }
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}