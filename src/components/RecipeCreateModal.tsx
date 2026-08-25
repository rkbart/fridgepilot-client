import { useEffect, useState } from 'react';
import { recipes, type Recipe, type RecipeIngredient } from '../services/api';
import IngredientEditor from './IngredientEditor';
import StepEditor from './StepEditor';

interface RecipeCreateModalProps {
  onClose: () => void;
  onCreated: (recipe: Recipe) => void;
}

export default function RecipeCreateModal({ onClose, onCreated }: RecipeCreateModalProps) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [newIngredients, setNewIngredients] = useState<RecipeIngredient[]>([]);
  const [newSteps, setNewSteps] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl('');
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a recipe name');
      return;
    }
    setError('');
    setSaving(true);
    try {
      let recipe: Recipe;
      if (imageFile) {
        const formData = new FormData();
        formData.append('recipe[name]', name.trim());
        formData.append('recipe[image]', imageFile);
        if (newIngredients.length > 0) formData.append('recipe[ingredients]', JSON.stringify(newIngredients));
        if (newSteps.length > 0) formData.append('recipe[instructions]', JSON.stringify(newSteps));
        recipe = await recipes.createWithImage(formData);
      } else {
        recipe = await recipes.create({
          name: name.trim(),
          image_url: imageUrl.trim() || undefined,
          ingredients: newIngredients,
          instructions: newSteps,
        });
      }
      onCreated(recipe);
    } catch {
      setError('Failed to create recipe');
      setSaving(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="New recipe" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New recipe</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Recipe name</label>
            <input
              className="form-input"
              placeholder="e.g. Pasta Carbonara"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Photo</label>
            {imagePreview ? (
              <div className="recipe-image-preview">
                <img src={imagePreview} alt="Preview" />
                <button type="button" className="btn btn-secondary btn-sm" onClick={clearImage}>Remove</button>
              </div>
            ) : (
              <div className="recipe-image-upload">
                <label className="recipe-image-upload-btn">
                  <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                  Choose file
                </label>
                <span className="recipe-image-upload-hint">or paste a URL below</span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Photo URL (optional)</label>
            <input
              className="form-input"
              placeholder="https://example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); setImagePreview(''); }}
              disabled={!!imageFile}
            />
          </div>
          <IngredientEditor ingredients={newIngredients} onChange={setNewIngredients} />
          <StepEditor steps={newSteps} onChange={setNewSteps} />
          {error && <div className="error-msg">{error}</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : 'Add recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}
