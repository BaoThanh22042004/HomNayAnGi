import { Dish } from "@/entities/menu";
import { db, initializeDb } from './db';
import { eq } from 'drizzle-orm';
import { selections } from "@/db/schema";

export interface SelectedOption {
    optionId: string;
    optionName: string;
    selectedItems: {
        itemId: string;
        itemName: string;
        price: number;
    }[];
}

export interface SelectedDish {
    id: string; // Unique selection ID
    dishId: number;
    name: string;
    price: number;
    photoUrl: string | null;
    quantity: number;
    selectedOptions: SelectedOption[];
    timestamp: number;
    clientName: string; // Add client name to track who selected the dish
}

// Database store for selected dishes using Drizzle ORM
class DishSelectionStore {
    private dbInitialized: boolean = false;
    
    constructor() {
        // Initialize database
        this.initDatabase();
    }
    
    private async initDatabase(): Promise<void> {
        try {
            await initializeDb();
            this.dbInitialized = true;
        } catch (error) {
            console.error('Error initializing database:', error);
            this.dbInitialized = false;
        }
    }
    
    async getAllSelections(): Promise<SelectedDish[]> {
        try {
            // Use Drizzle ORM select
            const result = await db.select().from(selections).orderBy(selections.timestamp);
            
            return result.map(row => ({
                id: row.id,
                dishId: Number(row.dishId),
                name: row.name,
                price: Number(row.price),
                photoUrl: row.photoUrl,
                quantity: row.quantity,
                timestamp: row.timestamp,
                clientName: row.clientName,
                selectedOptions: row.selectedOptions as SelectedOption[]
            }));
        } catch (error) {
            console.error('Error reading selections from database:', error);
            return [];
        }
    }

    async addSelection(dish: Dish, clientName: string, selectedOptions: SelectedOption[] = [], quantity: number = 1): Promise<SelectedDish> {
        try {
            // Calculate the total price including options
            let totalPrice = dish.discount_price ? dish.discount_price.value : dish.price.value;

            // Add option prices
            selectedOptions.forEach(option => {
                option.selectedItems.forEach(item => {
                    totalPrice += item.price;
                });
            });

            // Multiply by quantity
            totalPrice *= quantity;

            const photoUrl = dish.photos.length > 0
                ? dish.photos.find(p => p.width >= 400)?.value || dish.photos[0].value
                : null;

            const selection: SelectedDish = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                dishId: dish.id,
                name: dish.name,
                price: totalPrice,
                photoUrl,
                quantity,
                selectedOptions,
                timestamp: Date.now(),
                clientName
            };

            // Use Drizzle ORM insert
            await db.insert(selections).values({
                id: selection.id,
                dishId: selection.dishId,
                name: selection.name,
                price: selection.price.toString(),
                photoUrl: selection.photoUrl,
                quantity: selection.quantity,
                timestamp: selection.timestamp,
                clientName: selection.clientName,
                selectedOptions: selection.selectedOptions
            });

            return selection;
        } catch (error) {
            console.error('Error adding selection to database:', error);
            throw error;
        }
    }

    async removeSelection(id: string): Promise<boolean> {
        try {
            // Use Drizzle ORM delete
            const result = await db.delete(selections)
                .where(eq(selections.id, id));
            
            return (result.rowCount ?? 0) > 0;
        } catch (error) {
            console.error('Error removing selection from database:', error);
            return false;
        }
    }

    async clearAllSelections(): Promise<void> {
        try {
            // Use Drizzle ORM delete all
            await db.delete(selections);
        } catch (error) {
            console.error('Error clearing selections from database:', error);
        }
    }

    // Update client name in all selections
    async updateClientName(oldName: string, newName: string): Promise<number> {
        try {
            // Use Drizzle ORM update
            const result = await db.update(selections)
                .set({ clientName: newName })
                .where(eq(selections.clientName, oldName));
            
            return result.rowCount ?? 0;
        } catch (error) {
            console.error('Error updating client name in database:', error);
            return 0;
        }
    }
}

// Create singleton instance
export const dishSelectionStore = new DishSelectionStore();
