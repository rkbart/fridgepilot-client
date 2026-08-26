import { useState } from 'react';
import { recipes, type Recipe } from '../services/api';

interface RecipePhotoEditModalProps {
  recipe: Recipe;
  onClose: () => void;
  onSaved: (recipe: Recipe) => void;
}

export default function RecipePhotoEditModal({ recipe, onClose, onSaved }: RecipePhotoEditModalProps) {
  const [imageUrl, setImageUrl] = useState(recipe.image_url || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmingRemove, setConfirmingRemove] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      let updated: Recipe;
      if (imageFile) {
        const formData = new FormData();
        formData.append('recipe[image]', imageFile);
        updated = await recipes.updateWithImage(recipe.id, formData);
      } else {
        updated = await recipes.update(recipe.id, { image_url: imageUrl.trim() || undefined });
      }
      onSaved(updated);
    } catch {
      setError('Failed to update photo');
      setSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await recipes.update(recipe.id, { image_url: '' });
      onSaved(updated);
    } catch {
      setError('Failed to remove photo');
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
      <div className="modal" role="dialog" aria-modal="true" aria-label="Edit photo" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit photo</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {imagePreview ? (
            <div className="recipe-image-preview">
              <img src={imagePreview} alt="Preview" />
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearImage}>Remove</button>
            </div>
          ) : imageUrl ? (
            <div className="recipe-image-preview">
              <img
                src={imageUrl}
                alt="Preview"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ) : recipe.image_url ? (
            <div className="recipe-image-preview">
              <img src={recipe.image_url} alt={recipe.name} />
            </div>
          ) : null}
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label>Upload from file</label>
            <div className="recipe-image-upload">
              <label className="recipe-image-upload-btn">
                <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                Choose file
              </label>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label>Or paste a URL</label>
            <input
              className="form-input"
              placeholder="https://example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); setImagePreview(''); }}
              disabled={!!imageFile}
            />
          </div>
          {error && <div className="error-msg" style={{ marginTop: '0.75rem' }}>{error}</div>}
        </div>
        <div className="modal-footer">
          {recipe.image_url && !confirmingRemove && (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmingRemove(true)} disabled={saving}>
              Remove photo
            </button>
          )}
          {confirmingRemove && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <span style={{ color: 'var(--charcoal)', fontSize: '0.875rem' }}>Remove photo?</span>
              <button type="button" className="btn btn-danger" onClick={handleRemovePhoto} disabled={saving}>
                Yes, remove
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmingRemove(false)} disabled={saving}>
                No
              </button>
            </span>
          )}
          {!confirmingRemove && (
            <>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
