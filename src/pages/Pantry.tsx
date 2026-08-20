import { useEffect, useState, useMemo } from 'react';
import { pantry, UNITS, type PantryItem } from '../services/api';
import ChevronActions from '../components/ChevronActions';
import EditModal from '../components/EditModal';

const CATEGORIES = [
  'Uncategorized',
  'Grains & Pasta',
  'Canned Goods',
  'Spices',
  'Oils & Condiments',
  'Baking',
  'Dairy & Eggs',
  'Produce',
  'Meat & Seafood',
  'Frozen',
  'Beverages',
  'Snacks',
];

function CategoryChevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
        transition: 'transform 0.15s ease-out',
      }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Pantry() {
  const [list, setList] = useState<PantryItem[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchInput.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    pantry.list().then(setList).catch(() => setError('Failed to load pantry'));
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return list;
    return list.filter((i) => i.name.toLowerCase().includes(debouncedQuery));
  }, [list, debouncedQuery]);

  const grouped = useMemo(() => {
    const map: Record<string, PantryItem[]> = {};
    for (const item of filtered) {
      const cat = item.category || 'Uncategorized';
      (map[cat] ||= []).push(item);
    }
    return map;
  }, [filtered]);

  const handleCreate = async (values: { name: string; quantity?: number; unit?: string; category?: string }) => {
    setError('');
    try {
      const item = await pantry.create(values);
      setList((prev) => [...prev, item]);
      setAddingItem(false);
    } catch {
      setError('Failed to add item');
    }
  };

  const handleUpdate = async (id: number, values: { name: string; quantity?: number; unit?: string; category?: string }) => {
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

  const toggleCollapsed = (cat: string) => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Pantry</h1>
          <span className="subtitle">{list.length} item{list.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary" onClick={() => setAddingItem(true)}>
            <span className="btn-icon">+</span> New item
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
            placeholder="Search pantry…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>
            {debouncedQuery
              ? `No items match "${debouncedQuery}".`
              : 'Your pantry is empty. Click "New item" to add what you have on hand.'}
          </p>
        </div>
      ) : (
        <div className="card-grid">
          {Object.entries(grouped).map(([cat, items]) => {
            const isCollapsed = !!collapsed[cat];
            return (
              <div key={cat}>
                <button
                  type="button"
                  className="pantry-category-header"
                  aria-expanded={!isCollapsed}
                  onClick={() => toggleCollapsed(cat)}
                >
                  <span className="pantry-category-chevron"><CategoryChevron collapsed={isCollapsed} /></span>
                  <span className="pantry-category-title">
                    {cat} <span className="section-count">{items.length}</span>
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="card">
                    {items.map((item) => (
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
            );
          })}
        </div>
      )}

      {addingItem && (
        <EditModal
          title="Add item"
          submitLabel="Add"
          fields={[
            { key: 'name', label: 'Name', required: true, autoFocus: true },
            { key: 'quantity', label: 'Qty', type: 'number', placeholder: '1' },
            { key: 'unit', label: 'Unit', type: 'select', options: UNITS },
            { key: 'category', label: 'Category', type: 'select', options: CATEGORIES },
          ]}
          initial={{}}
          onSubmit={(values) =>
            handleCreate({
              name: String(values.name ?? '').trim(),
              quantity: values.quantity ? Number(values.quantity) : undefined,
              unit: String(values.unit ?? '').trim() || undefined,
              category: String(values.category ?? '').trim() || 'Uncategorized',
            })
          }
          onCancel={() => setAddingItem(false)}
        />
      )}

      {editingItem && (
        <EditModal
          title="Edit item"
          fields={[
            { key: 'name', label: 'Name', required: true, autoFocus: true },
            { key: 'quantity', label: 'Qty', type: 'number', placeholder: '12' },
            { key: 'unit', label: 'Unit', type: 'select', options: UNITS },
            { key: 'category', label: 'Category', type: 'select', options: CATEGORIES },
          ]}
          initial={editingItem}
          onSubmit={(values) =>
            handleUpdate(editingItem.id, {
              name: String(values.name ?? '').trim(),
              quantity: values.quantity ? Number(values.quantity) : undefined,
              unit: String(values.unit ?? '').trim() || undefined,
              category: String(values.category ?? '').trim() || 'Uncategorized',
            })
          }
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}