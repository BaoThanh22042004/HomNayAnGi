import { randomUUID } from 'crypto';
import { SelectedDish, SelectedOption, Dish } from '@/entities/menu';

interface Selection {
  id: string;
  dishId: number;
  name: string;
  photoUrl?: string;
  price: number;
  clientName: string;
  quantity: number;
  selectedOptions: SelectedOption[];
  note?: string;
}

class DishSelectionStore {
  private selections: Selection[] = [];

  constructor() {
    // Initialize with any saved state if needed
  }

  async getAllSelections(): Promise<Selection[]> {
    return this.selections;
  }

  async addSelection(
    dish: Dish, 
    clientName: string, 
    selectedOptions: SelectedOption[] = [], 
    quantity: number = 1,
    note: string = ""
  ): Promise<Selection> {
    // Calculate total price
    let totalPrice = dish.discount_price?.value || dish.price.value;
    
    // Add option prices
    for (const option of selectedOptions) {
      for (const item of option.selectedItems) {
        totalPrice += item.price;
      }
    }
    
    // Multiply by quantity
    totalPrice *= quantity;

    // Create the selection
    const selection: Selection = {
      id: randomUUID(),
      dishId: dish.id,
      name: dish.name,
      photoUrl: dish.photos.length > 0 ? dish.photos[0].value : undefined,
      price: totalPrice,
      clientName,
      quantity,
      selectedOptions,
      note
    };

    this.selections.push(selection);
    return selection;
  }

  async removeSelection(id: string): Promise<boolean> {
    const initialLength = this.selections.length;
    this.selections = this.selections.filter(s => s.id !== id);
    return initialLength > this.selections.length;
  }

  async removeAllSelections(): Promise<void> {
    this.selections = [];
  }

  async updateClientName(oldName: string, newName: string): Promise<number> {
    let updatedCount = 0;
    this.selections.forEach(selection => {
      if (selection.clientName === oldName) {
        selection.clientName = newName;
        updatedCount++;
      }
    });
    return updatedCount;
  }
}

// Singleton instance
export const dishSelectionStore = new DishSelectionStore();
