import type { RecipeIngredient, PantryItem } from '../services/api';

export interface IngredientAvailability {
  ingredient: RecipeIngredient;
  available: boolean;
  pantryItem?: PantryItem;
  quantityNeeded?: number;
  quantityAvailable?: number;
  unitMatch: boolean;
  status: 'available' | 'partial' | 'missing';
}

/**
 * Normalize ingredient name for matching
 * - Lowercase
 * - Remove extra whitespace
 * - Remove special characters
 * - Remove common prefixes/suffixes
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/^(the|a|an)\s+/i, '') // Remove common articles
    .trim();
}

/**
 * Check if two units are compatible for comparison
 * For simplicity, we consider units compatible if they are the same
 * A more sophisticated version could handle conversions (g/kg, ml/l, etc.)
 */
function areUnitsCompatible(unit1?: string, unit2?: string): boolean {
  if (!unit1 || !unit2) return true; // If either is missing, consider compatible
  return unit1.toLowerCase() === unit2.toLowerCase();
}

/**
 * Check availability of a single ingredient against pantry items
 */
export function checkIngredientAvailability(
  ingredient: RecipeIngredient,
  pantryItems: PantryItem[]
): IngredientAvailability {
  const normalizedName = normalizeName(ingredient.name);
  
  // Find matching pantry item by name
  const pantryItem = pantryItems.find(
    (item) => normalizeName(item.name) === normalizedName
  );
  
  if (!pantryItem) {
    return {
      ingredient,
      available: false,
      unitMatch: false,
      status: 'missing',
    };
  }
  
  // Check unit compatibility
  const unitMatch = areUnitsCompatible(ingredient.unit, pantryItem.unit);
  
  // If no quantities specified, consider available if name matches
  if (ingredient.quantity == null || pantryItem.quantity == null) {
    return {
      ingredient,
      available: true,
      pantryItem,
      unitMatch,
      status: unitMatch ? 'available' : 'partial',
    };
  }
  
  // Both have quantities - check if we have enough
  if (!unitMatch) {
    // Units don't match, can't directly compare quantities
    return {
      ingredient,
      available: false,
      pantryItem,
      quantityNeeded: ingredient.quantity,
      quantityAvailable: pantryItem.quantity,
      unitMatch: false,
      status: 'partial',
    };
  }
  
  // Units match - compare quantities
  const available = pantryItem.quantity >= ingredient.quantity;
  const hasPartial = pantryItem.quantity > 0 && pantryItem.quantity < ingredient.quantity;
  
  return {
    ingredient,
    available,
    pantryItem,
    quantityNeeded: ingredient.quantity,
    quantityAvailable: pantryItem.quantity,
    unitMatch: true,
    status: available ? 'available' : hasPartial ? 'partial' : 'missing',
  };
}

/**
 * Check availability of all ingredients in a recipe
 */
export function checkRecipeAvailability(
  ingredients: RecipeIngredient[],
  pantryItems: PantryItem[]
): {
  availability: IngredientAvailability[];
  availableCount: number;
  partialCount: number;
  missingCount: number;
  totalCount: number;
  percentage: number;
} {
  const availability = ingredients.map((ing) =>
    checkIngredientAvailability(ing, pantryItems)
  );
  
  const availableCount = availability.filter(
    (a) => a.status === 'available'
  ).length;
  const partialCount = availability.filter(
    (a) => a.status === 'partial'
  ).length;
  const missingCount = availability.filter(
    (a) => a.status === 'missing'
  ).length;
  const totalCount = ingredients.length;
  
  // Calculate percentage (partial counts as 0.5)
  const percentage =
    totalCount > 0
      ? Math.round(((availableCount + partialCount * 0.5) / totalCount) * 100)
      : 0;
  
  return {
    availability,
    availableCount,
    partialCount,
    missingCount,
    totalCount,
    percentage,
  };
}

/**
 * Calculate the quantity to import for an ingredient
 * Returns the remaining quantity needed after accounting for pantry
 */
export function calculateImportQuantity(
  ingredient: RecipeIngredient,
  pantryItem?: PantryItem,
  addAll: boolean = false
): { quantity?: number; status: 'pending' | 'checked' } {
  // If no quantity specified in recipe, import as-is
  if (ingredient.quantity == null) {
    return { quantity: undefined, status: 'pending' };
  }
  
  // If adding all items or no pantry item, import full quantity
  if (addAll || !pantryItem) {
    return { quantity: ingredient.quantity, status: 'pending' };
  }
  
  // If pantry doesn't have a quantity, import full amount
  if (pantryItem.quantity == null) {
    return { quantity: ingredient.quantity, status: 'pending' };
  }
  
  // Check if units are compatible
  if (!areUnitsCompatible(ingredient.unit, pantryItem.unit)) {
    // Units don't match, import full amount
    return { quantity: ingredient.quantity, status: 'pending' };
  }
  
  // Calculate remaining quantity needed
  const remaining = Math.max(0, ingredient.quantity - pantryItem.quantity);
  
  if (remaining === 0) {
    // Already have enough - mark as checked
    return { quantity: ingredient.quantity, status: 'checked' };
  }
  
  // Need more - add remaining quantity
  return { quantity: remaining, status: 'pending' };
}

/**
 * Group ingredients by their availability status
 */
export function groupByAvailability(
  availability: IngredientAvailability[]
): {
  available: IngredientAvailability[];
  partial: IngredientAvailability[];
  missing: IngredientAvailability[];
} {
  return {
    available: availability.filter((a) => a.status === 'available'),
    partial: availability.filter((a) => a.status === 'partial'),
    missing: availability.filter((a) => a.status === 'missing'),
  };
}

/**
 * Get a summary text for recipe availability
 */
export function getAvailabilitySummary(
  availableCount: number,
  partialCount: number,
  totalCount: number
): string {
  if (totalCount === 0) return 'No ingredients';
  
  const fullAvailable = availableCount + partialCount;
  if (fullAvailable === totalCount) {
    return 'All ingredients available';
  }
  
  if (availableCount === 0 && partialCount === 0) {
    return 'No ingredients in pantry';
  }
  
  return `${fullAvailable}/${totalCount} ingredients in pantry`;
}

/**
 * Get color class for availability percentage
 */
export function getAvailabilityColorClass(percentage: number): string {
  if (percentage >= 100) return 'availability-high';
  if (percentage >= 50) return 'availability-medium';
  return 'availability-low';
}
