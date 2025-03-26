export interface Price {
    text: string;
    unit: string;
    value: number;
}

export interface Photo {
    width: number;
    value: string;
    height: number;
}

export interface OptionItem {
    name: string;
    weight: number;
    ntop_price: Price;
    max_quantity: number;
    is_default: boolean;
    price: Price;
}

export interface Option {
    name: string;
    min_select: number;
    max_select: number;
    items: OptionItem[];
}

export interface Dish {
    id: number;
    name: string;
    description: string;
    price: Price;
    discount_price?: Price;
    photos: Photo[];
    options: Option[];
}

export interface DishType {
    dish_type_name: string;
    dishes: Dish[];
}

export type MenuInfos = DishType[];

// New interface for selected dish with note
export interface SelectedDish {
    id: string;
    dishId: number;
    name: string;
    price: number;
    photoUrl?: string;
    clientName: string;
    quantity: number;
    selectedOptions: SelectedOption[];
    note?: string; // Add note field
}

export interface SelectedOption {
    optionId: string;
    optionName: string;
    selectedItems: SelectedOptionItem[];
}

export interface SelectedOptionItem {
    itemId: string;
    itemName: string;
    price: number;
}

export interface RawDishType {
    dish_type_name: string;
    dishes: RawDish[];
}

export interface RawDish {
    id: number;
    name: string;
    description: string;
    price: Price;
    discount_price?: Price;
    photos: Photo[];
    options: RawOption[];
}

export interface RawOption {
    name: string;
    option_items: {
        min_select: number;
        max_select: number;
        items: RawOptionItem[];
    };
}

export interface RawOptionItem {
    name: string;
    weight: number;
    ntop_price: Price;
    max_quantity: number;
    is_default: boolean;
    price: Price;
}

// Mapping function
export const mapToMenuInfos = (data: RawDishType[]): MenuInfos => {
    // Sử dụng map thay vì forEach với push để tạo mảng mới
    return data.map(dishType => ({
        dish_type_name: dishType.dish_type_name,
        dishes: dishType.dishes.map(dish => ({
            id: dish.id,
            name: dish.name,
            description: dish.description,
            price: dish.price,
            discount_price: dish.discount_price,
            photos: dish.photos || [],
            options: Array.isArray(dish.options) ? dish.options.map(option => ({
                name: option.name,
                min_select: option.option_items?.min_select || 0,
                max_select: option.option_items?.max_select || 1,
                items: Array.isArray(option.option_items?.items) ?
                    option.option_items.items.map(item => ({
                        name: item.name,
                        weight: item.weight,
                        ntop_price: item.ntop_price,
                        max_quantity: item.max_quantity,
                        is_default: item.is_default,
                        price: item.price,
                    })) : []
            })) : []
        }))
    }));
};