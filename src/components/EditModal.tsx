import { useState } from 'react';

export interface EditField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  rows?: number;
}

interface EditModalProps {
  title: string;
  fields: EditField[];
  initial: object;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function EditModal({ title, fields, initial, onSubmit, onCancel, submitLabel = 'Save' }: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const values: Record<string, unknown> = {};
    const initialValues = initial as Record<string, unknown>;
    for (const f of fields) {
      values[f.key] = initialValues[f.key] ?? '';
    }
    return values;
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(formData);
    } finally {
      setSaving(false);
    }
  };

  const setValue = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="edit-modal-overlay" onClick={onCancel}>
      <div
        className="edit-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="edit-modal-title">{title}</h2>
        <form onSubmit={handleSubmit} className="edit-modal-form">
          {fields.map((f) => (
            <div key={f.key} className="form-group">
              <label>{f.label}</label>
              {f.type === 'select' ? (
                <select
                  className="form-input"
                  value={String(formData[f.key] ?? '')}
                  onChange={(e) => setValue(f.key, e.target.value)}
                  autoFocus={f.autoFocus}
                >
                  <option value="">None</option>
                  {f.options?.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  className="form-input form-textarea"
                  rows={f.rows ?? 4}
                  placeholder={f.placeholder}
                  value={String(formData[f.key] ?? '')}
                  onChange={(e) => setValue(f.key, e.target.value)}
                  required={f.required}
                  autoFocus={f.autoFocus}
                />
              ) : (
                <input
                  className="form-input"
                  type={f.type === 'number' ? 'number' : 'text'}
                  placeholder={f.placeholder}
                  value={String(formData[f.key] ?? '')}
                  onChange={(e) => setValue(f.key, e.target.value)}
                  required={f.required}
                  autoFocus={f.autoFocus}
                />
              )}
            </div>
          ))}
          <div className="edit-modal-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : submitLabel}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}