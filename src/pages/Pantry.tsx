import { useEffect, useState, useMemo, useRef } from 'react';
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
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [flashCat, setFlashCat] = useState<string | null>(null);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [error, setError] = useState('');

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const chipBarRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimers = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchInput.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    pantry.list().then(setList).catch(() => setError('Failed to load pantry'));
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      Object.values(collapseTimers.current).forEach((t) => {
        if (t) clearTimeout(t);
      });
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
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

  const visibleCategories = useMemo(() => Object.keys(grouped), [grouped]);

  const allExpanded = visibleCategories.length > 0 && visibleCategories.every((cat) => !collapsed[cat]);

  const apiErrorMessage = (e: unknown, fallback: string) => {
    const msg = (e as { error?: { message?: string } })?.error?.message;
    return msg || fallback;
  };

  const handleCreate = async (values: { name: string; quantity?: number; unit?: string; category?: string }) => {
    setError('');
    try {
      const item = await pantry.create(values);
      setList((prev) => [...prev, item]);
      setAddingItem(false);
    } catch (e) {
      setError(apiErrorMessage(e, 'Failed to add item'));
    }
  };

  const handleUpdate = async (id: number, values: { name: string; quantity?: number; unit?: string; category?: string }) => {
    setError('');
    try {
      const updated = await pantry.update(id, values);
      setList((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setEditingItem(null);
    } catch (e) {
      setError(apiErrorMessage(e, 'Failed to update item'));
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

  const toggleCollapsed = (cat: string) => {
    if (collapseTimers.current[cat]) {
      clearTimeout(collapseTimers.current[cat]);
      collapseTimers.current[cat] = null;
    }
    setActiveCat(cat);
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));
  };

  const jumpTo = (cat: string) => {
    setActiveCat(cat);
    setCollapsed((c) => (c[cat] ? { ...c, [cat]: false } : c));

    const chip = chipRefs.current[cat];
    const bar = chipBarRef.current;
    if (chip && bar) {
      const left = chip.offsetLeft - (bar.clientWidth - chip.clientWidth) / 2;
      bar.scrollTo({ left, behavior: 'smooth' });
    }

    setFlashCat(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlashCat(cat);
        sectionRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashCat(null), 1200);
  };

  const toggleAll = () => {
    Object.values(collapseTimers.current).forEach((t) => {
      if (t) clearTimeout(t);
    });
    collapseTimers.current = {};
    const expand = !allExpanded;
    setActiveCat(null);
    setFlashCat(null);
    if (expand) {
      setCollapsed((c) => {
        const next = { ...c };
        for (const cat of visibleCategories) delete next[cat];
        return next;
      });
    } else {
      [...visibleCategories].reverse().forEach((cat, i) => {
        collapseTimers.current[cat] = setTimeout(() => {
          collapseTimers.current[cat] = null;
          setCollapsed((c) => {
            if (c[cat]) return c;
            return { ...c, [cat]: true };
          });
        }, i * 60);
      });
    }
  };

  const backToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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

      {filtered.length > 0 && (
        <div className="pantry-chips-wrap">
          <div className="pantry-chips" ref={chipBarRef} role="group" aria-label="Jump to category">
            <button
              type="button"
              className={`pantry-chip pantry-chip-toggle ${activeCat == null ? 'active' : ''}`}
              aria-expanded={allExpanded}
              aria-label={allExpanded ? 'Collapse all categories' : 'Expand all categories'}
              onClick={toggleAll}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                style={{
                  transform: allExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease-out',
                }}
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {allExpanded ? 'collapse all' : 'show all'}
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                ref={(el) => { chipRefs.current[cat] = el; }}
                className={`pantry-chip ${activeCat === cat ? 'active' : ''}`}
                onClick={() => jumpTo(cat)}
              >
                {cat} <span className="pantry-chip-count">{grouped[cat].length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>
            {debouncedQuery
              ? `No items match "${debouncedQuery}".`
              : 'Your pantry is empty. Click "New item" to add what you have on hand.'}
          </p>
        </div>
      ) : (
        <div className="card-grid pantry-grid">
          {Object.entries(grouped).map(([cat, items]) => {
            const isCollapsed = !!collapsed[cat];
            return (
              <div
                key={cat}
                ref={(el) => { sectionRefs.current[cat] = el; }}
                className={`pantry-section ${flashCat === cat ? 'pantry-section-flash' : ''}`}
              >
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
                <div className={`pantry-category-body ${isCollapsed ? '' : 'open'}`}>
                  <div className="pantry-category-body-inner">
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