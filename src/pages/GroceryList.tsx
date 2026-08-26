import { useEffect, useMemo, useRef, useState } from 'react';
import { UNITS } from '../services/api';
import { useGroceryLists } from '../contexts/GroceryListContext';
import { useToast } from '../contexts/ToastContext';
import ChevronActions from '../components/ChevronActions';
import EditModal from '../components/EditModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { SkeletonList } from '../components/Skeleton';
import { useFocusSearch } from '../hooks/useFocusSearch';

export default function GroceryListPage() {
  const { lists, loading, error: contextError, createList, updateList, deleteList, addItem, updateItem, deleteItem } = useGroceryLists();
  const { showToast } = useToast();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  useFocusSearch(searchRef);

  useEffect(() => {
    if (contextError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [contextError]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addingToList, setAddingToList] = useState<number | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: number; name: string } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<{ id: number; name: string } | null>(null);
  const [editingItem, setEditingItem] = useState<{ listId: number; itemId: number; name: string; quantity?: number; unit?: string } | null>(null);
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
    const base = !debouncedQuery ? lists : lists.filter((l) => l.name.toLowerCase().includes(debouncedQuery));
    return [...base].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [lists, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createList({ name: newListName });
      setNewListName('');
      setShowCreate(false);
      showToast('List created');
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string } })?.error?.message || 'Failed to create list';
      showToast(message, 'error');
    }
  };

  const handleRenameList = async (list: { id: number }, name: string) => {
    try {
      await updateList(list.id, { name });
      setRenaming(null);
      showToast('List renamed');
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string } })?.error?.message || 'Failed to rename list';
      showToast(message, 'error');
    }
  };

  const handleDeleteList = async (id: number) => {
    try {
      await deleteList(id);
      if (expandedId === id) setExpandedId(null);
      setConfirmingDelete(null);
      showToast('List deleted');
    } catch {
      showToast('Failed to delete list', 'error');
    }
  };

  const handleAddItem = async (listId: number, data: { name: string; quantity?: number; unit?: string }) => {
    try {
      await addItem(listId, data);
      setAddingToList(null);
      showToast(`${data.name} added`);
    } catch {
      showToast('Failed to add item', 'error');
    }
  };

  const handleToggleItem = async (listId: number, itemId: number, checked: boolean) => {
    try {
      await updateItem(listId, itemId, { status: checked ? 'checked' : 'pending' });
    } catch {
      showToast('Failed to update item', 'error');
    }
  };

  const handleUpdateItem = async (listId: number, itemId: number, data: { name: string; quantity?: number; unit?: string }) => {
    try {
      await updateItem(listId, itemId, data);
      setEditingItem(null);
      showToast('Item updated');
    } catch {
      showToast('Failed to update item', 'error');
    }
  };

  const handleDeleteItem = async (listId: number, itemId: number, name: string) => {
    try {
      await deleteItem(listId, itemId);
      showToast(`${name} removed`);
    } catch {
      showToast('Failed to delete item', 'error');
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
            ref={searchRef}
            className="form-input"
            type="search"
            placeholder="Search lists…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <span className="search-hint" aria-hidden="true">Press / to search</span>
      </div>

      {contextError && <div className="error-msg" ref={errorRef}>{contextError}</div>}

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

      {loading ? (
        <SkeletonList count={4} />
      ) : (
        <>
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
            {paginated.map((list) => {
              const itemCount = list.items.length;
              const pendingCount = list.items.filter((i) => i.status !== 'checked').length;

              return (
                <div className="card" key={list.id}>
                  <div className="recipe-header" onClick={() => setExpandedId((cur) => (cur === list.id ? null : list.id))}>
                    <div className="recipe-header-info">
                      <div className="recipe-title-row">
                        <span className="recipe-name">{list.name}</span>
                        <button
                          type="button"
                          className="detail-icon-btn"
                          aria-label="Rename list"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenaming({ id: list.id, name: list.name });
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M11.3 2.3a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-7 7-2.7.6.6-2.7 7-7Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                      <div className="recipe-meta">
                        {itemCount} item{itemCount !== 1 ? 's' : ''} · {pendingCount} pending
                      </div>
                    </div>
                    <div className="recipe-header-actions">
                      {expandedId === list.id && (
                        <button
                          type="button"
                          className="detail-icon-btn detail-icon-danger"
                          aria-label="Delete list"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingDelete({ id: list.id, name: list.name });
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                            <path d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5l.5 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        className={`chevron-btn detail-chevron ${expandedId === list.id ? 'open' : ''}`}
                        aria-label={expandedId === list.id ? 'Collapse list' : 'Expand list'}
                        aria-expanded={expandedId === list.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId((cur) => (cur === list.id ? null : list.id));
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className={`recipe-body ${expandedId === list.id ? 'open' : ''}`}>
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
                                  <button
                                    className="action-edit-btn"
                                    onClick={() =>
                                      setEditingItem({
                                        listId: list.id,
                                        itemId: item.id,
                                        name: item.name,
                                        quantity: item.quantity,
                                        unit: item.unit,
                                      })
                                    }
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="action-delete-btn"
                                    onClick={() => handleDeleteItem(list.id, item.id, item.name)}
                                  >
                                    Delete
                                  </button>
                                </>
                              }
                            >
                              <label className={`checkbox-label ${item.status === 'checked' ? 'checked' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={item.status === 'checked'}
                                  onChange={() => handleToggleItem(list.id, item.id, item.status !== 'checked')}
                                />
                                <span className="item-text">{item.name}</span>
                              </label>
                              {item.quantity != null && (
                                <span className="item-meta">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                              )}
                            </ChevronActions>
                          ))}
                        </div>
                      )}

                      {expandedId === list.id && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <button className="add-row-btn" onClick={() => setAddingToList(list.id)}>
                            <span className="add-row-icon">+</span> Add ingredient
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
        </>
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
          title="Delete list?"
          message={`“${confirmingDelete.name}” and all its items will be permanently removed. This can’t be undone.`}
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
          initial={{ name: editingItem.name, quantity: editingItem.quantity, unit: editingItem.unit }}
          onSubmit={(values) =>
            handleUpdateItem(editingItem.listId, editingItem.itemId, {
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
