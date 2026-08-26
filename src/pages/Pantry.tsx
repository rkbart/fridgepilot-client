import { useEffect, useMemo, useRef, useState } from 'react';
import { UNITS, type PantryItem } from '../services/api';
import { usePantry } from '../contexts/PantryContext';
import { useToast } from '../contexts/ToastContext';
import ChevronActions from '../components/ChevronActions';
import EditModal from '../components/EditModal';
import { SkeletonList } from '../components/Skeleton';
import { useFocusSearch } from '../hooks/useFocusSearch';

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
  const { items, loading, error: contextError, addItem, updateItem, deleteItem } = usePantry();
  const { showToast } = useToast();
  const searchRef = useRef<HTMLInputElement | null>(null);
  useFocusSearch(searchRef);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [categoriesInit, setCategoriesInit] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchInput.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return items;
    return items.filter((i) => i.name.toLowerCase().includes(debouncedQuery));
  }, [items, debouncedQuery]);

  const grouped = useMemo(() => {
    const map: Record<string, PantryItem[]> = {};
    for (const item of filtered) {
      const cat = item.category || 'Uncategorized';
      (map[cat] ||= []).push(item);
    }
    return map;
  }, [filtered]);

  // Collapse all categories by default on first load
  useEffect(() => {
    if (categoriesInit || Object.keys(grouped).length === 0) return;
    const allCollapsed: Record<string, boolean> = {};
    for (const cat of Object.keys(grouped)) allCollapsed[cat] = true;
    setCollapsed(allCollapsed);
    setCategoriesInit(true);
  }, [grouped, categoriesInit]);

  const apiErrorMessage = (e: unknown, fallback: string) => {
    const msg = (e as { error?: { message?: string } })?.error?.message;
    return msg || fallback;
  };

  const handleCreate = async (values: { name: string; quantity?: number; unit?: string; category?: string }) => {
    try {
      await addItem(values);
      setAddingItem(false);
      showToast(`${values.name} added to pantry`);
    } catch (e) {
      showToast(apiErrorMessage(e, 'Failed to add item'), 'error');
    }
  };

  const handleQuickAdd = async (category: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('name') as HTMLInputElement | null;
    const name = input?.value.trim();
    if (!name) return;
    try {
      await addItem({ name, category });
      e.currentTarget.reset();
      showToast(`${name} added`);
    } catch (err) {
      showToast(apiErrorMessage(err, `Could not add "${name}"`), 'error');
    }
  };

  const handleUpdate = async (id: number, values: { name: string; quantity?: number; unit?: string; category?: string }) => {
    try {
      await updateItem(id, values);
      setEditingItem(null);
      showToast('Item updated');
    } catch (e) {
      showToast(apiErrorMessage(e, 'Failed to update item'), 'error');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteItem(id);
      setOpenId(null);
      showToast(`${name} removed`);
    } catch {
      showToast('Failed to delete item', 'error');
    }
  };

  const toggleCollapsed = (cat: string) => {
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));
  };

  const backToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Pantry</h1>
          <span className="subtitle">{items.length} item{items.length !== 1 ? 's' : ''}</span>
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
            ref={searchRef}
            className="form-input"
            type="search"
            placeholder="Search pantry…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <span className="search-hint" aria-hidden="true">Press / to search</span>
      </div>

      {contextError && <div className="error-msg">{contextError}</div>}

      {loading ? (
        <SkeletonList count={6} />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>
            {debouncedQuery
              ? `No items match "${debouncedQuery}".`
              : 'Your pantry is empty. Click "New item" to add what you have on hand.'}
          </p>
        </div>
      ) : (
        <div className="card-grid pantry-grid">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const isCollapsed = collapsed[cat] !== false;
            return (
              <div key={cat} className="pantry-section">
                <button
                  type="button"
                  className="pantry-category-header"
                  aria-expanded={!isCollapsed}
                  onClick={() => toggleCollapsed(cat)}
                >
                  <span className="pantry-category-chevron"><CategoryChevron collapsed={isCollapsed} /></span>
                  <span className="pantry-category-title">
                    {cat} <span className="section-count">{catItems.length}</span>
                  </span>
                </button>
                <div className={`pantry-category-body ${isCollapsed ? '' : 'open'}`}>
                  <div className="pantry-category-body-inner">
                    <div className="card">
                      {catItems.map((item) => (
                        <ChevronActions
                          key={item.id}
                          isOpen={openId === item.id}
                          onToggle={() => setOpenId((cur) => (cur === item.id ? null : item.id))}
                          actions={
                            <>
                              <button className="action-edit-btn" onClick={() => setEditingItem(item)}>Edit</button>
                              <button className="action-delete-btn" onClick={() => handleDelete(item.id, item.name)}>Delete</button>
                            </>
                          }
                        >
                          <span className="item-name">{item.name}</span>
                          {item.quantity != null && (
                            <span className="item-meta">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                          )}
                        </ChevronActions>
                      ))}
                      <form className="inline-add-row" onSubmit={(e) => handleQuickAdd(cat, e)}>
                        <span className="add-row-icon">+</span>
                        <input
                          name="name"
                          placeholder={`Quick add to ${cat.toLowerCase()}…`}
                          aria-label={`Quick add item to ${cat}`}
                          autoComplete="off"
                        />
                      </form>
                    </div>
                  </div>
                </div>
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

      {showTopBtn && (
        <button type="button" className="back-to-top" aria-label="Back to top" onClick={backToTop}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M12 10l-4-4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
