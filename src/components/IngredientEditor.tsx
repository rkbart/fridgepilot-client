import { useState } from 'react';
import type { RecipeIngredient } from '../services/api';
import type { IngredientAvailability } from '../utils/pantryMatcher';
import ChevronActions from './ChevronActions';
import EditModal from './EditModal';
import { UNITS } from '../services/api';

interface IngredientEditorProps {
  ingredients: RecipeIngredient[];
  onChange: (next: RecipeIngredient[]) => void;
  hideTitle?: boolean;
  availability?: IngredientAvailability[];
}

export default function IngredientEditor({ ingredients, onChange, hideTitle, availability = [] }: IngredientEditorProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const add = (data: RecipeIngredient) => onChange([...ingredients, data]);
  const update = (idx: number, data: RecipeIngredient) => {
    const next = [...ingredients];
    next[idx] = data;
    onChange(next);
  };
  const remove = (idx: number) => onChange(ingredients.filter((_, i) => i !== idx));

  return (
    <div className="recipe-section">
      <div className={`recipe-section-title-row ${hideTitle ? 'detail-add-row' : ''}`}>
        {!hideTitle && (
          <span className="recipe-section-title">
            Ingredients
            {ingredients.length > 0 && <span className="section-count">{ingredients.length}</span>}
          </span>
        )}
        <button type="button" className="add-row-btn" onClick={() => setAdding(true)}>
          <span className="add-row-icon">+</span> Add ingredient
        </button>
      </div>
      {adding && (
        <EditModal
          title="Add ingredient"
          submitLabel="Add"
          fields={[
            { key: 'name', label: 'Ingredient', required: true, autoFocus: true },
            { key: 'quantity', label: 'Qty', type: 'number', placeholder: '200' },
            { key: 'unit', label: 'Unit', type: 'select', options: UNITS },
          ]}
          initial={{}}
          onSubmit={(values) => {
            add({
              name: String(values.name ?? '').trim(),
              quantity: values.quantity ? Number(values.quantity) : undefined,
              unit: String(values.unit ?? '').trim() || undefined,
            });
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {ingredients.length === 0 ? (
        <div className="empty-inline">No ingredients yet</div>
      ) : (
        <div className="item-list">
          {ingredients.map((ing, idx) => (
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
                {availability.length > 0 && (
                  <span className={`ingredient-availability ${availability[idx]?.status || 'missing'}`}>
                    {availability[idx]?.status === 'available' && '✓'}
                    {availability[idx]?.status === 'partial' && '⚠'}
                    {availability[idx]?.status === 'missing' && '✗'}
                  </span>
                )}
                <span className="item-name">{ing.name}</span>
                {ing.quantity != null && (
                  <span className="item-meta">{ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}</span>
                )}
                {availability[idx]?.pantryItem && availability[idx]?.quantityAvailable != null && (
                  <span className="item-pantry-info">
                    (Have: {availability[idx].quantityAvailable}{availability[idx].pantryItem.unit ? ` ${availability[idx].pantryItem.unit}` : ''})
                  </span>
                )}
              </div>
            </ChevronActions>
          ))}
        </div>
      )}

      {editingIdx != null && (
        <EditModal
          title="Edit ingredient"
          fields={[
            { key: 'name', label: 'Ingredient', required: true, autoFocus: true },
            { key: 'quantity', label: 'Qty', type: 'number', placeholder: '200' },
            { key: 'unit', label: 'Unit', type: 'select', options: UNITS },
          ]}
          initial={ingredients[editingIdx] ?? {}}
          onSubmit={(values) => {
            update(editingIdx, {
              name: String(values.name ?? '').trim(),
              quantity: values.quantity ? Number(values.quantity) : undefined,
              unit: String(values.unit ?? '').trim() || undefined,
            });
            setEditingIdx(null);
          }}
          onCancel={() => setEditingIdx(null)}
        />
      )}
    </div>
  );
}
