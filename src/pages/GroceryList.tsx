import { useEffect, useState, useMemo } from 'react';
import { groceryLists, UNITS, type GroceryItem, type GroceryList } from '../services/api';
import ChevronActions from '../components/ChevronActions';
import EditModal from '../components/EditModal';

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M11.3 2.3a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-7 7-2.7.6.6-2.7 7-7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5l.5 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ConfirmDeleteModalProps {
  listName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteModal({ listName, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Delete list"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Delete list?</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p className="confirm-delete-text">
            “{listName}” and all its items will be permanently removed. This can’t be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

interface ListCardProps {
  list: GroceryList;
  expanded: boolean;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  openKey: string | null;
  toggleOpen: (key: string) => void;
  onToggleItem: (listId: number, item: GroceryItem) => void;
  onEditItem: (listId: number, item: GroceryItem) => void;
  onDeleteItem: (listId: number, itemId: number) => void;
  onAddItem: () => void;
}

function ListCard({
  list,
  expanded,
  onToggle,
  onRename,
  onDelete,
  openKey,
  toggleOpen,
  onToggleItem,
  onEditItem,
  onDeleteItem,
  onAddItem,
}: ListCardProps) {
  const itemCount = list.items.length;
  const pendingCount = list.items.filter((i) => i.status !== 'checked').length;

  return (
    <div className="card">
      <div className="recipe-header" onClick={onToggle}>
        <div className="recipe-header-info">
          <div className="recipe-title-row">
            <span className="recipe-name">{list.name}</span>
            <button
              type="button"
              className="detail-icon-btn"
              aria-label="Rename list"
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
            >
              <PencilIcon />
            </button>
          </div>
          <div className="recipe-meta">
            {itemCount} item{itemCount !== 1 ? 's' : ''} · {pendingCount} pending · {list.source === 'ai_generated' ? 'AI' : 'Manual'}
          </div>
        </div>
        <div className="recipe-header-actions">
          {expanded && (
            <button
              type="button"
              className="detail-icon-btn detail-icon-danger"
              aria-label="Delete list"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <TrashIcon />
            </button>
          )}
          <button
            type="button"
            className={`chevron-btn detail-chevron ${expanded ? 'open' : ''}`}
            aria-label={expanded ? 'Collapse list' : 'Expand list'}
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`recipe-body ${expanded ? 'open' : ''}`}>
        <div>
          {itemCount === 0 ? (
            <div className="empty-inline">No items yet</div>
          ) : (
            <div className="item-list">
              {list.items.map((item) => (
                <ChevronActions
                  key={item.id}
                  isOpen={openKey === `item-${list.id}-${item.id}`}
                  onToggle={() => toggleOpen(`item-${list.id}-${item.id}`)}
                  actions={
                    <>
                      <button className="action-edit-btn" onClick={() => onEditItem(list.id, item)}>Edit</button>
                      <button className="action-delete-btn" onClick={() => onDeleteItem(list.id, item.id)}>Delete</button>
                    </>
                  }
                >
                  <label className={`checkbox-label ${item.status === 'checked' ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={item.status === 'checked'}
                      onChange={() => onToggleItem(list.id, item)}
                    />
                    <span className="item-text">{item.name}</span>
                  </label>
                  {item.quantity != null && (
                    <span className="item-meta">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                  )}
                  {item.source === 'ai_suggested' && <span className="tag tag-ai">AI</span>}
                  {item.status === 'pending' && <span className="tag tag-pending">Pending</span>}
                </ChevronActions>
              ))}
            </div>
          )}

          {expanded && (
            <div style={{ marginTop: '0.75rem' }}>
              <button className="add-row-btn" onClick={onAddItem}>
                <span className="add-row-icon">+</span> Add item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GroceryListPage() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addingToList, setAddingToList] = useState<number | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<GroceryList | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<GroceryList | null>(null);
  const [editingItem, setEditingItem] = useState<{ listId: number; item: GroceryItem } | null>(null);
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

  const handleRenameList = async (list: GroceryList, name: string) => {
    setError('');
    try {
      const updated = await groceryLists.update(list.id, { name });
      setLists((prev) => prev.map((l) => (l.id === list.id ? { ...l, ...updated } : l)));
      setRenaming(null);
    } catch {
      setError('Failed to rename list');
    }
  };

  const handleDeleteList = async (id: number) => {
    setError('');
    try {
      await groceryLists.delete(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
      if (expandedId === id) setExpandedId(null);
      setConfirmingDelete(null);
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
      setEditingItem(null);
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

  const toggleOpen = (key: string) => setOpenKey((cur) => (cur === key ? null : key));

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

      <div className="card-grid">
        {paginated.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            expanded={expandedId === list.id}
            onToggle={() => setExpandedId((cur) => (cur === list.id ? null : list.id))}
            onRename={() => setRenaming(list)}
            onDelete={() => setConfirmingDelete(list)}
            openKey={openKey}
            toggleOpen={toggleOpen}
            onToggleItem={handleToggleItem}
            onEditItem={(listId, item) => setEditingItem({ listId, item })}
            onDeleteItem={handleDeleteItem}
            onAddItem={() => setAddingToList(list.id)}
          />
        ))}
      </div>

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

      {renaming && (
        <EditModal
          title="Rename list"
          fields={[{ key: 'name', label: 'List name', required: true, autoFocus: true }]}
          initial={{ name: renaming.name }}
          onSubmit={(values) => handleRenameList(renaming, String(values.name ?? '').trim())}
          onCancel={() => setRenaming(null)}
        />
      )}

      {confirmingDelete && (
        <ConfirmDeleteModal
          listName={confirmingDelete.name}
          onConfirm={() => handleDeleteList(confirmingDelete.id)}
          onCancel={() => setConfirmingDelete(null)}
        />
      )}

      {addingToList != null && (
        <EditModal
          title="Add item"
          submitLabel="Add"
          fields={[
            { key: 'name', label: 'Name', required: true, autoFocus: true },
            { key: 'quantity', label: 'Qty', type: 'number', placeholder: '1' },
            { key: 'unit', label: 'Unit', type: 'select', options: UNITS },
          ]}
          initial={{}}
          onSubmit={(values) =>
            handleAddItem(addingToList, {
              name: String(values.name ?? '').trim(),
              quantity: values.quantity ? Number(values.quantity) : undefined,
              unit: String(values.unit ?? '').trim() || undefined,
            })
          }
          onCancel={() => setAddingToList(null)}
        />
      )}

      {editingItem && (
        <EditModal
          title="Edit item"
          fields={[
            { key: 'name', label: 'Name', required: true, autoFocus: true },
            { key: 'quantity', label: 'Qty', type: 'number', placeholder: '1' },
            { key: 'unit', label: 'Unit', type: 'select', options: UNITS },
          ]}
          initial={editingItem.item}
          onSubmit={(values) =>
            handleUpdateItem(editingItem.listId, editingItem.item.id, {
              name: String(values.name ?? '').trim(),
              quantity: values.quantity ? Number(values.quantity) : undefined,
              unit: String(values.unit ?? '').trim() || undefined,
            })
          }
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}