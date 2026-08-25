import { useEffect, useMemo, useState } from 'react';
import { ai, type AiSuggestion } from '../services/api';
import { useGroceryLists } from '../contexts/GroceryListContext';
import { useToast } from '../contexts/ToastContext';

function AddMissingModal({
  suggestion,
  onClose,
  onDone,
}: {
  suggestion: AiSuggestion;
  onClose: () => void;
  onDone: () => void;
}) {
  const { lists, createList, addItem } = useGroceryLists();
  const [mode, setMode] = useState<'existing' | 'new'>(lists.length === 0 ? 'new' : 'existing');
  const [selectedListId, setSelectedListId] = useState<number | null>(lists.length > 0 ? lists[0].id : null);
  const [newListName, setNewListName] = useState(`${suggestion.name} ingredients`);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let listId: number;
      let listName: string;

      if (mode === 'new') {
        const trimmed = newListName.trim();
        if (!trimmed) {
          showToast('Please enter a list name', 'error');
          setSubmitting(false);
          return;
        }
        const newList = await createList({ name: trimmed });
        listId = newList.id;
        listName = newList.name;
      } else if (selectedListId != null) {
        listId = selectedListId;
        listName = lists.find((l) => l.id === selectedListId)?.name || 'grocery list';
      } else {
        setSubmitting(false);
        return;
      }

      for (const name of suggestion.missing_ingredients) {
        await addItem(listId, { name });
      }

      showToast(
        `${suggestion.missing_ingredients.length} ingredient${suggestion.missing_ingredients.length !== 1 ? 's' : ''} added to ${listName}`
      );
      onDone();
    } catch {
      showToast('Failed to add ingredients', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add missing ingredients"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Add Missing Ingredients</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="confirm-delete-text" style={{ marginBottom: '1rem' }}>
            Add {suggestion.missing_ingredients.length} missing ingredient
            {suggestion.missing_ingredients.length !== 1 ? 's' : ''} from "{suggestion.name}":
          </p>
          <div className="item-list" style={{ marginBottom: '1rem' }}>
            {suggestion.missing_ingredients.map((name) => (
              <div key={name} className="grocery-add-row">
                <span className="item-name">{name}</span>
              </div>
            ))}
          </div>
          <div className="detail-tabs" style={{ marginBottom: '0.75rem' }}>
            <button type="button" className={mode === 'existing' ? 'active' : ''} onClick={() => setMode('existing')}>
              Existing list
            </button>
            <button type="button" className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>
              New list
            </button>
          </div>
          {mode === 'existing' ? (
            <div className="form-group">
              <label>Grocery List</label>
              {lists.length === 0 ? (
                <p className="empty-inline">No grocery lists found.</p>
              ) : (
                <select
                  className="form-input"
                  value={selectedListId ?? ''}
                  onChange={(e) => setSelectedListId(Number(e.target.value))}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label>List name</label>
              <input
                className="form-input"
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || (mode === 'existing' && !selectedListId)}
            onClick={handleSubmit}
          >
            {submitting ? 'Adding…' : mode === 'new' ? 'Create & Add' : 'Add to List'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AISuggestions() {
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [addingSuggestion, setAddingSuggestion] = useState<AiSuggestion | null>(null);

  const hasAnyMissing = useMemo(
    () => suggestions.some((s) => s.missing_ingredients.length > 0),
    [suggestions]
  );

  const handleSuggest = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await ai.suggestRecipes();
      setSuggestions(res.suggestions);
      if (res.message) setMessage(res.message);
    } catch {
      setError('Failed to get suggestions. Check your API key in Settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h1>AI Helper</h1>
          <span className="subtitle">Recipe ideas from your pantry</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--stone)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Based on what's in your pantry, the AI will suggest recipes and flag missing ingredients.
        </p>
        <button onClick={handleSuggest} disabled={loading} className="btn btn-primary">
          {loading ? 'Thinking...' : 'Suggest recipes'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {message && <div className="info-msg">{message}</div>}

      <div className="card-grid">
        {suggestions.map((s, i) => (
          <div key={i} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{s.name}</h3>
              <div className="score-bar">
                <div className="score-fill">
                  <span style={{ width: `${Math.round(s.match_score * 100)}%` }} />
                </div>
                {Math.round(s.match_score * 100)}%
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--stone)', marginBottom: '0.5rem' }}>
              <strong>Ingredients:</strong> {s.ingredients.join(', ')}
            </div>
            {s.missing_ingredients.length > 0 && (
              <>
                <div style={{ fontSize: '0.85rem', color: 'var(--terracotta)', marginBottom: '0.75rem' }}>
                  <strong>Missing:</strong> {s.missing_ingredients.join(', ')}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAddingSuggestion(s)}
                >
                  Add {s.missing_ingredients.length} missing to grocery list
                </button>
              </>
            )}
          </div>
        ))}
        {suggestions.length === 0 && !loading && !message && !error && (
          <div className="empty-state">
            <p>Click "Suggest recipes" to get ideas based on your pantry items.</p>
          </div>
        )}
        {!hasAnyMissing && suggestions.length > 0 && (
          <div className="discover-meta">You can make all of these with what you have!</div>
        )}
      </div>

      {addingSuggestion && (
        <AddMissingModal
          suggestion={addingSuggestion}
          onClose={() => setAddingSuggestion(null)}
          onDone={() => setAddingSuggestion(null)}
        />
      )}
    </div>
  );
}
