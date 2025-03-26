import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { selections } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SelectedOption, Dish, SelectedDish } from '@/entities/menu';

class DishSelectionStore {
  async getAllSelections(): Promise<SelectedDish[]> {
    try {
      const result = await db.select().from(selections);
      
      // Convert the database rows to SelectedDish objects
      return result.map(row => ({
        id: row.id,
        dishId: row.dishId,
        name: row.name,
        photoUrl: row.photoUrl || undefined,
        price: Number(row.price), // Convert from decimal to number
        clientName: row.clientName,
        quantity: row.quantity,
        selectedOptions: row.selectedOptions as SelectedOption[],
        note: row.note || undefined
      }));
    } catch (error) {
      console.error('Error fetching selections from database:', error);
      throw error;
    }
  }

  async addSelection(
    dish: Dish, 
    clientName: string, 
    selectedOptions: SelectedOption[] = [], 
    quantity: number = 1,
    note: string = ""
  ): Promise<SelectedDish> {
    try {
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
      const newSelection = {
        id: randomUUID(),
        dishId: dish.id,
        name: dish.name,
        photoUrl: dish.photos.length > 0 ? dish.photos[0].value : null,
        price: totalPrice.toString(), // Convert number to string for database compatibility
        clientName,
        quantity,
        timestamp: Date.now(),
        selectedOptions: selectedOptions as SelectedOption[], // JSON will be automatically handled by Drizzle
        note: note || null
      };

      // Insert to database
      const result = await db.insert(selections).values(newSelection).returning();
      
      const insertedSelection = result[0];
      
      // Convert to SelectedDish format for response
      return {
        id: insertedSelection.id,
        dishId: insertedSelection.dishId,
        name: insertedSelection.name,
        photoUrl: insertedSelection.photoUrl || undefined,
        price: Number(insertedSelection.price), // Convert decimal to number
        clientName: insertedSelection.clientName,
        quantity: insertedSelection.quantity,
        selectedOptions: insertedSelection.selectedOptions as SelectedOption[],
        note: insertedSelection.note || undefined
      };
    } catch (error) {
      console.error('Error adding selection to database:', error);
      throw error;
    }
  }

  async removeSelection(id: string): Promise<boolean> {
    try {
      const result = await db.delete(selections)
        .where(eq(selections.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error removing selection from database:', error);
      throw error;
    }
  }

  async removeAllSelections(): Promise<void> {
    try {
      await db.delete(selections);
    } catch (error) {
      console.error('Error removing all selections from database:', error);
      throw error;
    }
  }

  async updateClientName(oldName: string, newName: string): Promise<number> {
    try {
      const result = await db.update(selections)
        .set({ clientName: newName })
        .where(eq(selections.clientName, oldName))
        .returning();
      
      return result.length;
    } catch (error) {
      console.error('Error updating client name in database:', error);
      throw error;
    }
  }
}

// Singleton instance
export const dishSelectionStore = new DishSelectionStore();
