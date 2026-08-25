import { useState } from 'react';
import ChevronActions from './ChevronActions';
import EditModal from './EditModal';

interface StepEditorProps {
  steps: string[];
  onChange: (next: string[]) => void;
  hideTitle?: boolean;
}

export default function StepEditor({ steps, onChange, hideTitle }: StepEditorProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const add = (text: string) => onChange([...steps, text]);
  const update = (idx: number, text: string) => {
    const next = [...steps];
    next[idx] = text;
    onChange(next);
  };
  const remove = (idx: number) => onChange(steps.filter((_, i) => i !== idx));

  return (
    <div className="recipe-section">
      <div className={`recipe-section-title-row ${hideTitle ? 'detail-add-row' : ''}`}>
        {!hideTitle && (
          <span className="recipe-section-title">
            Instructions
            {steps.length > 0 && <span className="section-count">{steps.length}</span>}
          </span>
        )}
        <button type="button" className="add-row-btn" onClick={() => setAdding(true)}>
          <span className="add-row-icon">+</span> Add step
        </button>
      </div>
      {adding && (
        <EditModal
          title="Add step"
          submitLabel="Add"
          fields={[{ key: 'text', label: 'Step', type: 'textarea', rows: 3, required: true, autoFocus: true }]}
          initial={{}}
          onSubmit={(values) => {
            add(String(values.text ?? '').trim());
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {steps.length === 0 ? (
        <div className="empty-inline">No steps yet</div>
      ) : (
        <div className="item-list">
          {steps.map((step, idx) => (
            <ChevronActions
              key={idx}
              isOpen={openIdx === idx}
              onToggle={() => setOpenIdx((cur) => (cur === idx ? null : idx))}
              actions={
                <>
                  <button className="action-edit-btn" onClick={() => setEditingIdx(idx)}>Edit</button>
                  <button className="action-delete-btn" onClick={() => remove(idx)}>Delete</button>
                </>
              }
            >
              <div className="recipe-row">
                <span className="step-number">{idx + 1}.</span>
                <span className="item-name">{step}</span>
              </div>
            </ChevronActions>
          ))}
        </div>
      )}

      {editingIdx != null && (
        <EditModal
          title="Edit step"
          fields={[{ key: 'text', label: 'Step', type: 'textarea', rows: 3, required: true, autoFocus: true }]}
          initial={{ text: steps[editingIdx] ?? '' }}
          onSubmit={(values) => {
            update(editingIdx, String(values.text ?? '').trim());
            setEditingIdx(null);
          }}
          onCancel={() => setEditingIdx(null)}
        />
      )}
    </div>
  );
}
