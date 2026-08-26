import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, recipes as recipesApi, type Recipe } from '../services/api';
import { usePantry } from '../contexts/PantryContext';
import { useGroceryLists } from '../contexts/GroceryListContext';
import { useToast } from '../contexts/ToastContext';
import { checkRecipeAvailability } from '../utils/pantryMatcher';
import { SkeletonCard } from '../components/Skeleton';
import ImportToGroceryModal from '../components/ImportToGroceryModal';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { items: pantryItems } = usePantry();
  const { lists } = useGroceryLists();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [userName, setUserName] = useState('');
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [recipesTotal, setRecipesTotal] = useState(0);
  const [cooksLoading, setCooksLoading] = useState(true);
  const [addingToGroceryList, setAddingToGroceryList] = useState<Recipe | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((res) => setUserName(res.user.name || ''))
      .catch(() => {});
  }, []);

  // Full recipe library for cookability ranking + true total
  // (the RecipesContext holds one filtered page, not the whole library)
  useEffect(() => {
    let cancelled = false;
    recipesApi
      .list({ page: 1, per_page: 100 })
      .then(({ data, meta }) => {
        if (!cancelled) {
          setAllRecipes(data);
          setRecipesTotal(meta.total);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCooksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cookTonight = useMemo(() => {
    return allRecipes
      .filter((r) => (r.ingredients || []).length > 0)
      .map((r) => {
        const a = checkRecipeAvailability(r.ingredients || [], pantryItems);
        return {
          recipe: r,
          pct: a.totalCount > 0 ? Math.round((a.availableCount / a.totalCount) * 100) : 0,
          missing: a.missingCount + a.partialCount,
          total: a.totalCount,
        };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [allRecipes, pantryItems]);

  const pendingGroceries = lists.reduce(
    (sum, l) => sum + l.items.filter((i) => i.status !== 'checked').length,
    0
  );

  const stats = [
    { label: 'Pantry items', value: pantryItems.length, to: '/pantry', icon: '🥫' },
    { label: 'Recipes saved', value: recipesTotal, to: '/recipes', icon: '📄' },
    { label: 'Grocery lists', value: lists.length, to: '/grocery-lists', icon: '🛒' },
    { label: 'Items to buy', value: pendingGroceries, to: '/grocery-lists', icon: '✅' },
  ];

  const openRecipe = (recipe: Recipe) => {
    navigate(`/recipes?q=${encodeURIComponent(recipe.name)}`, { state: { expandRecipeId: recipe.id } });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h1>{greeting()}{userName ? `, ${userName}` : ''}</h1>
          <span className="subtitle">Here's what's cooking in your kitchen</span>
        </div>
      </div>

      <div className="dashboard-stats">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="dashboard-stat-card">
            <span className="dashboard-stat-icon" aria-hidden="true">{s.icon}</span>
            <span className="dashboard-stat-value">{s.value}</span>
            <span className="dashboard-stat-label">{s.label}</span>
          </Link>
        ))}
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Cook tonight?</h2>
          <span className="subtitle">Best matches across your whole recipe library</span>
        </div>
        {cooksLoading ? (
          <div className="dashboard-cook-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : cookTonight.length === 0 ? (
          <div className="empty-state">
            <p>
              Add some <Link to="/pantry">pantry items</Link> and{' '}
              <Link to="/recipes">recipes</Link> to see what you can cook.
            </p>
          </div>
        ) : (
          <div className="dashboard-cook-grid">
            {cookTonight.map(({ recipe, pct, missing, total }) => (
              <button
                key={recipe.id}
                type="button"
                className={`card dashboard-cook-card dashboard-cook-btn ${pct === 100 ? 'ready' : ''}`}
                onClick={() => openRecipe(recipe)}
              >
                <div className="dashboard-cook-image">
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.name} loading="lazy" />
                  ) : (
                    <div className="recipe-card-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="dashboard-cook-info">
                  <span className="recipe-name">{recipe.name}</span>
                  <span className={`availability-badge ${pct >= 100 ? 'availability-high' : pct >= 50 ? 'availability-medium' : 'availability-low'}`}>
                    {pct}% ready
                  </span>
                  <span className="dashboard-cook-meta">
                    {missing === 0
                      ? `All ${total} ingredients in pantry`
                      : `${missing} of ${total} ingredients missing`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Quick actions</h2>
        </div>
        <div className="dashboard-actions">
          <Link to="/pantry" className="btn btn-secondary">🥫 Update pantry</Link>
          <Link to="/discover" className="btn btn-secondary">🔍 Discover recipes</Link>
          <Link to="/grocery-lists" className="btn btn-secondary">🛒 Start shopping list</Link>
          <Link to="/ai-suggestions" className="btn btn-secondary">✨ Ask AI helper</Link>
        </div>
      </section>

      {addingToGroceryList && (
        <ImportToGroceryModal
          recipe={addingToGroceryList}
          pantryItems={pantryItems}
          onClose={() => setAddingToGroceryList(null)}
          onImported={() => {
            setAddingToGroceryList(null);
            showToast('Ingredients added to grocery list');
          }}
        />
      )}
    </div>
  );
}