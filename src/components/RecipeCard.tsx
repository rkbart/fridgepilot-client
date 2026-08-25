import { useState } from 'react';
import type { Recipe, RecipeIngredient, PantryItem } from '../services/api';
import { checkRecipeAvailability, getAvailabilitySummary, getAvailabilityColorClass } from '../utils/pantryMatcher';
import IngredientEditor from './IngredientEditor';
import StepEditor from './StepEditor';

interface RecipeCardProps {
  elementId?: string;
  recipe: Recipe;
  expanded: boolean;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onPhotoEdit: () => void;
  onIngredientsChange: (ingredients: RecipeIngredient[]) => void;
  onStepsChange: (steps: string[]) => void;
  pantryItems: PantryItem[];
  onAddToGroceryList: (recipe: Recipe) => void;
}

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

export default function RecipeCard({ 
  elementId,
  recipe, 
  expanded, 
  onToggle, 
  onRename, 
  onDelete, 
  onPhotoEdit, 
  onIngredientsChange, 
  onStepsChange, 
  pantryItems, 
  onAddToGroceryList 
}: RecipeCardProps) {
  const [tab, setTab] = useState<'ingredients' | 'steps'>('ingredients');
  const ingCount = (recipe.ingredients || []).length;
  const stepCount = (recipe.instructions || []).length;
  
  // Calculate pantry availability
  const availability = checkRecipeAvailability(recipe.ingredients || [], pantryItems);
  const availabilitySummary = getAvailabilitySummary(
    availability.availableCount,
    availability.partialCount,
    availability.totalCount
  );
  const availabilityColorClass = getAvailabilityColorClass(availability.percentage);

  return (
    <div className="card" id={elementId}>
      <div className="recipe-header" onClick={onToggle}>
        <div className="recipe-card-image">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.name} loading="lazy" />
          ) : (
            <div className="recipe-card-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          )}
          {expanded && (
            <button
              type="button"
              className="recipe-card-photo-btn"
              aria-label="Edit photo"
              onClick={(e) => { e.stopPropagation(); onPhotoEdit(); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
          )}
        </div>
        <div className="recipe-header-info">
          <div className="recipe-title-row">
            <span className="recipe-name">{recipe.name}</span>
            <button
              type="button"
              className="detail-icon-btn"
              aria-label="Rename recipe"
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
            >
              <PencilIcon />
            </button>
          </div>
          <div className="recipe-meta">
            {ingCount} ingredient{ingCount !== 1 ? 's' : ''} · {stepCount} step{stepCount !== 1 ? 's' : ''}
            {ingCount > 0 && (
              <span className={`availability-badge ${availabilityColorClass}`}>
                {availabilitySummary}
              </span>
            )}
          </div>
        </div>
        <div className="recipe-header-actions">
          {expanded && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                aria-label="Add to grocery list"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToGroceryList(recipe);
                }}
              >
                Add to List
              </button>
              <button
                type="button"
                className="detail-icon-btn detail-icon-danger"
                aria-label="Delete recipe"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <TrashIcon />
              </button>
            </>
          )}
          <button
            type="button"
            className={`chevron-btn detail-chevron ${expanded ? 'open' : ''}`}
            aria-label={expanded ? 'Collapse recipe' : 'Expand recipe'}
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
          <div className="detail-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'ingredients'}
              className={tab === 'ingredients' ? 'active' : ''}
              onClick={() => setTab('ingredients')}
            >
              Ingredients
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'steps'}
              className={tab === 'steps' ? 'active' : ''}
              onClick={() => setTab('steps')}
            >
              Instructions
            </button>
          </div>
          {tab === 'ingredients' ? (
            <IngredientEditor 
              hideTitle 
              ingredients={recipe.ingredients || []} 
              onChange={onIngredientsChange}
              availability={availability.availability}
            />
          ) : (
            <StepEditor hideTitle steps={recipe.instructions || []} onChange={onStepsChange} />
          )}
        </div>
      </div>
    </div>
  );
}
