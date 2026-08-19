import { useState, useEffect } from 'react';
import { recipes, type Recipe } from '../services/api';

export default function Recipes() {
  const [list, setList] = useState<Recipe[]>([]);
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    recipes.list().then(setList).catch(() => setError('Failed to load recipes'));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const recipe = await recipes.create({
        name,
        ingredients: ingredients.split(',').map((s) => s.trim()).filter(Boolean),
        instructions,
      });
      setList((prev) => [...prev, recipe]);
      setName('');
      setIngredients('');
      setInstructions('');
    } catch {
      setError('Failed to create recipe');
    }
  };

  const handleDelete = async (id: number) => {
    await recipes.delete(id);
    setList((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Recipes</h1>
        <span className="subtitle">{list.length} saved</span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="form-group">
            <label>Recipe name</label>
            <input className="form-input" placeholder="e.g. Pasta Carbonara" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Ingredients</label>
            <input className="form-input" placeholder="spaghetti, eggs, bacon, parmesan" value={ingredients} onChange={(e) => setIngredients(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Instructions</label>
            <textarea className="form-input" placeholder="How to make it..." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Add recipe</button>
        </form>
      </div>

      <div className="card-grid">
        {list.length === 0 && (
          <div className="empty-state">
            <p>No recipes yet. Add your first one above.</p>
          </div>
        )}
        {list.map((recipe) => (
          <div key={recipe.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{recipe.name}</div>
              <div style={{ color: 'var(--stone)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
              </div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(recipe.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
