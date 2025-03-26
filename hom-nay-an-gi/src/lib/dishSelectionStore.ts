import { Dish } from "@/entities/menu";
import fs from 'fs';
import path from 'path';

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

// File-based store for selected dishes (persistent)
class DishSelectionStore {
    private filePath: string;
    
    constructor() {
        // Store selections in data directory
        this.filePath = path.join(process.cwd(), 'src', 'data', 'selections.json');
        
        // Ensure the file exists
        this.ensureFileExists();
    }
    
    private ensureFileExists(): void {
        try {
            if (!fs.existsSync(this.filePath)) {
                // Create an empty selections array if file doesn't exist
                fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
            }
        } catch (error) {
            console.error('Error ensuring selections file exists:', error);
        }
    }
    
    private readSelectionsFromFile(): SelectedDish[] {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(data) as SelectedDish[];
        } catch (error) {
            console.error('Error reading selections from file:', error);
            return [];
        }
    }
    
    private writeSelectionsToFile(selections: SelectedDish[]): void {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(selections, null, 2), 'utf8');
        } catch (error) {
            console.error('Error writing selections to file:', error);
        }
    }

    getAllSelections(): SelectedDish[] {
        return this.readSelectionsFromFile();
    }

    addSelection(dish: Dish, clientName: string, selectedOptions: SelectedOption[] = [], quantity: number = 1): SelectedDish {
        const selections = this.readSelectionsFromFile();
        
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

        selections.push(selection);
        this.writeSelectionsToFile(selections);
        return selection;
    }

    removeSelection(id: string): boolean {
        const selections = this.readSelectionsFromFile();
        const initialLength = selections.length;
        const newSelections = selections.filter(s => s.id !== id);
        
        if (newSelections.length < initialLength) {
            this.writeSelectionsToFile(newSelections);
            return true;
        }
        
        return false;
    }

    clearAllSelections(): void {
        this.writeSelectionsToFile([]);
    }

    // Add a method to update client name in all selections
    updateClientName(oldName: string, newName: string): number {
        const selections = this.readSelectionsFromFile();
        let updatedCount = 0;

        const updatedSelections = selections.map(selection => {
            if (selection.clientName === oldName) {
                updatedCount++;
                return { ...selection, clientName: newName };
            }
            return selection;
        });

        if (updatedCount > 0) {
            this.writeSelectionsToFile(updatedSelections);
        }
        
        return updatedCount;
    }
}

// Create singleton instance
export const dishSelectionStore = new DishSelectionStore();
