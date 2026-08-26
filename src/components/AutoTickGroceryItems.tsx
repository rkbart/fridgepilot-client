import { useEffect, useRef } from 'react';
import { usePantry } from '../contexts/PantryContext';
import { useGroceryLists } from '../contexts/GroceryListContext';

export default function AutoTickGroceryItems() {
  const { items: pantryItems } = usePantry();
  const { lists, updateItem } = useGroceryLists();
  const prevPantryCount = useRef(pantryItems.length);

  useEffect(() => {
    if (pantryItems.length <= prevPantryCount.current) {
      prevPantryCount.current = pantryItems.length;
      return;
    }
    prevPantryCount.current = pantryItems.length;

    const pantryNames = new Set(pantryItems.map((p) => p.name.toLowerCase()));

    for (const list of lists) {
      for (const item of list.items) {
        if (item.status !== 'pending') continue;
        if (pantryNames.has(item.name.toLowerCase())) {
          updateItem(list.id, item.id, { status: 'checked' });
        }
      }
    }
  }, [pantryItems, lists, updateItem]);
}
