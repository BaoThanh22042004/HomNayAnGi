'use client';

import { MenuInfos, DishType, Dish } from "@/entities/menu";
import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { SelectedOption } from "@/lib/dishSelectionStore";
import { getClientName, hasClientName, setClientName } from "@/lib/clientName";
import ClientNameInput from "./ClientNameInput";
import Image from "next/image";

interface MenuDisplayProps {
    menuInfos: MenuInfos;
    dataPath: string;
}

export default function MenuDisplay({ menuInfos, dataPath }: MenuDisplayProps) {
    if (!menuInfos || menuInfos.length === 0) {
        return (
            <div className="p-4 text-center">
                <p className="text-gray-500">No menu items available</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {menuInfos.map((dishType, index) => (
                <DishTypeSection key={index} dishType={dishType} dataPath={dataPath} />
            ))}
        </div>
    );
}

function DishTypeSection({ dishType, dataPath }: { dishType: DishType; dataPath: string }) {
    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-200">
                {dishType.dish_type_name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dishType.dishes.map((dish, index) => (
                    <DishCard key={index} dish={dish} dataPath={dataPath} />
                ))}
            </div>
        </div>
    );
}

function DishCard({ dish, dataPath }: { dish: Dish; dataPath: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOptionItems, setSelectedOptionItems] = useState<Map<string, string[]>>(new Map());
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isNameInputOpen, setIsNameInputOpen] = useState(false);

    useEffect(() => {
        // Try to get client name from localStorage on component mount
        const clientName = getClientName();
        if (clientName) {
            setClientName(clientName);
        }
    }, []);

    const photoUrl = dish.photos.length > 0
        ? dish.photos.find(p => p.width >= 400)?.value || dish.photos[0].value
        : null;

    const hasOptions = dish.options && dish.options.length > 0;

    const handleSelect = async () => {
        // Check if client name exists before proceeding
        if (!hasClientName()) {
            setIsNameInputOpen(true);
            return;
        }

        if (hasOptions) {
            // If dish has options, open modal for selection
            setIsModalOpen(true);

            // Initialize selection state with default selections
            const initialSelections = new Map<string, string[]>();

            dish.options.forEach(option => {
                // Find default items
                const defaultItems = option.items
                    .filter(item => item.is_default)
                    .map(item => item.name);

                // If there are defaults or required selection, initialize the map
                if (defaultItems.length > 0 || option.min_select > 0) {
                    initialSelections.set(option.name, defaultItems);
                }
            });

            setSelectedOptionItems(initialSelections);
        } else {
            // If no options, add directly
            await addToSelections();
        }
    };

    const handleNameSet = (name: string) => {
        setClientName(name);
        setIsNameInputOpen(false);

        // After setting the name, continue with the selection process
        if (hasOptions) {
            setIsModalOpen(true);
        } else {
            addToSelections();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOptionItems(new Map());
        setQuantity(1);
        setError(null);
    };

    const handleOptionChange = (optionName: string, itemName: string, isChecked: boolean, maxSelect: number) => {
        setSelectedOptionItems(prev => {
            const newMap = new Map(prev);
            const currentSelection = newMap.get(optionName) || [];

            if (maxSelect === 1) {
                // For radio buttons, replace current selection with new one
                if (isChecked) {
                    newMap.set(optionName, [itemName]);
                } else {
                    // If unchecking a radio button, clear the selection
                    newMap.set(optionName, []);
                }
            } else {
                // For checkboxes, add/remove from current selection
                if (isChecked) {
                    newMap.set(optionName, [...currentSelection, itemName]);
                } else {
                    newMap.set(
                        optionName,
                        currentSelection.filter(name => name !== itemName)
                    );
                }
            }

            return newMap;
        });
    };

    const validateSelections = (): boolean => {
        for (const option of dish.options) {
            const selectedItems = selectedOptionItems.get(option.name) || [];
            if (selectedItems.length < option.min_select) {
                setError(`Please select at least ${option.min_select} items for "${option.name}"`);
                return false;
            }
            if (selectedItems.length > option.max_select) {
                setError(`You can select at most ${option.max_select} items for "${option.name}"`);
                return false;
            }
        }
        return true;
    };

    const addToSelections = async () => {
        try {
            setIsSubmitting(true);
            setError(null);

            if (hasOptions && !validateSelections()) {
                setIsSubmitting(false);
                return;
            }

            // Always get fresh client name from localStorage to use latest value
            const currentClientName = getClientName();

            if (!currentClientName) {
                setError("Please provide your name first");
                setIsSubmitting(false);
                setIsNameInputOpen(true);
                return;
            }

            // Convert selectedOptionItems to the format expected by the API
            const selectedOptions: SelectedOption[] = [];

            // Only process options if we have them
            if (hasOptions) {
                dish.options.forEach(option => {
                    const selectedItemNames = selectedOptionItems.get(option.name) || [];
                    if (selectedItemNames.length > 0) {
                        const items = option.items
                            .filter(item => selectedItemNames.includes(item.name))
                            .map(item => ({
                                itemId: item.name, // Using name as ID since we don't have a distinct ID
                                itemName: item.name,
                                price: item.price.value
                            }));

                        selectedOptions.push({
                            optionId: option.name, // Using name as ID
                            optionName: option.name,
                            selectedItems: items
                        });
                    }
                });
            }

            // Call API to add selection
            const response = await fetch('/api/selections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dataPath,
                    dishId: dish.id,
                    clientName: currentClientName, // Using the fresh client name
                    selectedOptions,
                    quantity
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add selection');
            }

            // Close modal if open
            if (isModalOpen) {
                closeModal();
            }

            // Show temporary success message
            alert('Dish added to selections!');

        } catch (err) {
            console.error('Error adding selection:', err);
            setError('Failed to add selection. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {photoUrl && (
                    <div className="relative h-48 w-full">
                        <Image
                            src={photoUrl}
                            alt={dish.name}
                            className="object-cover w-full h-full"
                            width={500}
                            height={300}
                            unoptimized={photoUrl?.startsWith('data:') || false}
                        />
                    </div>
                )}
                <div className="p-4">
                    <h3 className="text-lg font-semibold mb-1 text-black">{dish.name}</h3>
                    {dish.description && (
                        <p className="text-sm text-gray-600 mb-2">{dish.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                        <div className="text-red-600 font-medium">
                            {dish.discount_price ? (
                                <div>
                                    <span className="line-through text-gray-400 mr-2">
                                        {dish.price.text}
                                    </span>
                                    <span>{dish.discount_price.text}</span>
                                </div>
                            ) : (
                                <span>{dish.price.text}</span>
                            )}
                        </div>
                        <button
                            onClick={handleSelect}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            Chọn
                        </button>
                    </div>
                    {hasOptions && (
                        <div className="mt-2 text-xs text-gray-500">
                            Có tùy chọn thêm
                        </div>
                    )}
                </div>
            </div>

            {/* Client Name Input Modal */}
            {isNameInputOpen && (
                <ClientNameInput onNameSet={handleNameSet} />
            )}

            {/* Option Selection Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-auto">
                        <div className="p-4 border-b sticky top-0 bg-white z-10">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-black">{dish.name}</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="text-red-600 font-medium">
                                {dish.discount_price ? dish.discount_price.text : dish.price.text}
                            </div>
                        </div>

                        <div className="p-4">
                            {dish.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="mb-4">
                                    <h4 className="font-medium mb-2 text-black">
                                        {option.name}
                                        {option.min_select > 0 && (
                                            <span className="text-red-600 ml-1 text-sm">
                                                *Bắt buộc (Chọn {option.min_select}-{option.max_select})
                                            </span>
                                        )}
                                    </h4>
                                    <div className="space-y-2">
                                        {option.items.map((item, itemIndex) => {
                                            const isSelected = (selectedOptionItems.get(option.name) || []).includes(item.name);
                                            return (
                                                <div key={itemIndex} className="flex items-center">
                                                    <input
                                                        type={option.max_select === 1 ? "radio" : "checkbox"}
                                                        id={`${option.name}-${item.name}-${itemIndex}`}
                                                        name={option.name}
                                                        checked={isSelected}
                                                        onChange={(e) => handleOptionChange(option.name, item.name, e.target.checked, option.max_select)}
                                                        className="mr-2"
                                                    />
                                                    <label
                                                        htmlFor={`${option.name}-${item.name}-${itemIndex}`}
                                                        className={`flex justify-between w-full text-black ${isSelected ? 'font-medium' : ''}`}
                                                    >
                                                        <span>{item.name}</span>
                                                        {item.price.value > 0 && (
                                                            <span className="text-gray-600">
                                                                +{formatPrice(item.price.value)}
                                                            </span>
                                                        )}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <div className="mb-4">
                                <h4 className="font-medium mb-2 text-black">Số lượng</h4>
                                <div className="flex items-center text-black">
                                    <button
                                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                                        className="px-2 border rounded-l"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4"><path d="M5 12h14" /></svg>
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-12 text-center border-t border-b"
                                    />
                                    <button
                                        onClick={() => setQuantity(prev => prev + 1)}
                                        className="px-2 border rounded-r"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-500 text-sm mb-4">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={addToSelections}
                                disabled={isSubmitting}
                                className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Đang thêm...' : 'Thêm món này'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
