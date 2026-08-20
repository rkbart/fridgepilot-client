import { useState } from 'react';
import { ai, type AiSuggestion } from '../services/api';

export default function AISuggestions() {
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
              <div style={{ fontSize: '0.85rem', color: 'var(--terracotta)' }}>
                <strong>Missing:</strong> {s.missing_ingredients.join(', ')}
              </div>
            )}
          </div>
        ))}
        {suggestions.length === 0 && !loading && !message && !error && (
          <div className="empty-state">
            <p>Click "Suggest recipes" to get ideas based on your pantry items.</p>
          </div>
        )}
      </div>
    </div>
  );
}
