import { Dish, Option, OptionItem } from "@/entities/menu";

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

// In-memory store for selected dishes (not persistent)
class DishSelectionStore {
    private selections: SelectedDish[] = [];

    getAllSelections(): SelectedDish[] {
        return [...this.selections];
    }

    addSelection(dish: Dish, clientName: string, selectedOptions: SelectedOption[] = [], quantity: number = 1): SelectedDish {
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

        this.selections.push(selection);
        return selection;
    }

    removeSelection(id: string): boolean {
        const initialLength = this.selections.length;
        this.selections = this.selections.filter(s => s.id !== id);
        return this.selections.length < initialLength;
    }

    clearAllSelections(): void {
        this.selections = [];
    }

    // Add a method to update client name in all selections
    updateClientName(oldName: string, newName: string): number {
        let updatedCount = 0;

        this.selections = this.selections.map(selection => {
            if (selection.clientName === oldName) {
                updatedCount++;
                return { ...selection, clientName: newName };
            }
            return selection;
        });

        return updatedCount;
    }
}

// Create singleton instance
export const dishSelectionStore = new DishSelectionStore();
