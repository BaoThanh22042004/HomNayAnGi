'use client';

import { MenuInfos, DishType, Dish, SelectedOption } from "@/entities/menu";
import { useState, useEffect } from "react";
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
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isNameInputOpen, setIsNameInputOpen] = useState(false);
    const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);

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
            // If no options, show a simple modal for quantity and notes
            setQuantity(1);
            setNote('');
            setIsSimpleModalOpen(true);
        }
    };

    const handleNameSet = (name: string) => {
        setClientName(name);
        setIsNameInputOpen(false);

        // After setting the name, continue with the selection process
        if (hasOptions) {
            setIsModalOpen(true);
        } else {
            setIsSimpleModalOpen(true);
        }
    };

    const closeOptionsModal = () => {
        setIsModalOpen(false);
        setSelectedOptionItems(new Map());
        setQuantity(1);
        setNote('');
        setError(null);
    };

    const closeSimpleModal = () => {
        setIsSimpleModalOpen(false);
        setQuantity(1);
        setNote('');
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

    const addToSelections = async (fromSimpleModal = false) => {
        try {
            setIsSubmitting(true);
            setError(null);

            if (hasOptions && !fromSimpleModal && !validateSelections()) {
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
            if (hasOptions && !fromSimpleModal) {
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
                    quantity,
                    note
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add selection');
            }

            // Close modal if open
            if (isModalOpen) {
                closeOptionsModal();
            }
            if (isSimpleModalOpen) {
                closeSimpleModal();
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

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1) {
            setQuantity(newQuantity);
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
                        <p className="text-gray-600 text-sm mb-2">{dish.description}</p>
                    )}
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-red-600 font-semibold">
                            {dish.discount_price ? (
                                <>
                                    <span>{dish.discount_price.text}</span>
                                    <span className="text-gray-400 line-through text-sm ml-2">
                                        {dish.price.text}
                                    </span>
                                </>
                            ) : (
                                <span>{dish.price.text}</span>
                            )}
                        </div>
                        <button
                            onClick={handleSelect}
                            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 text-sm"
                        >
                            Chọn
                        </button>
                    </div>
                </div>
            </div>

            {isNameInputOpen && (
                <ClientNameInput onNameSet={handleNameSet} />
            )}

            {/* Modal for dishes with options */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex">
                    <div className="relative p-4 bg-white w-full max-w-md m-auto rounded-lg max-h-[90vh] overflow-y-auto">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            onClick={closeOptionsModal}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18M6 6l12 12"></path>
                            </svg>
                        </button>

                        <h2 className="text-xl font-bold mb-4 text-gray-800">{dish.name}</h2>

                        {/* Quantity selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Số lượng
                            </label>
                            <div className="flex items-center">
                                <button
                                    className="px-3 py-1 border border-gray-300 rounded-l text-gray-800"
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                    className="w-16 text-center border-t border-b border-gray-300 py-1 text-gray-800"
                                />
                                <button
                                    className="px-3 py-1 border border-gray-300 rounded-r text-gray-800"
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {dish.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="mb-4">
                                <h3 className="font-medium mb-2 text-gray-800">
                                    {option.name}{' '}
                                    <span className="text-sm text-gray-800">
                                        {option.min_select > 0
                                            ? `(Chọn ít nhất ${option.min_select})`
                                            : option.max_select === 1
                                                ? '(Chọn 1)'
                                                : `(Chọn tối đa ${option.max_select})`}
                                    </span>
                                </h3>
                                <div className="space-y-2">
                                    {option.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="flex items-center">
                                            <input
                                                type={option.max_select === 1 ? 'radio' : 'checkbox'}
                                                id={`${option.name}-${item.name}`}
                                                name={option.name}
                                                checked={(selectedOptionItems.get(option.name) || []).includes(item.name)}
                                                onChange={(e) => handleOptionChange(option.name, item.name, e.target.checked, option.max_select)}
                                                className="mr-2"
                                            />
                                            <label
                                                htmlFor={`${option.name}-${item.name}`}
                                                className="flex-1 text-gray-800"
                                            >
                                                {item.name}
                                            </label>
                                            <span className="text-red-600">
                                                {item.price.value > 0 ? `+${item.price.text}` : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Note input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ghi chú
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                                rows={3}
                                placeholder="Ghi chú về món ăn (tùy chọn)"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            ></textarea>
                        </div>

                        {error && (
                            <div className="mb-4 text-red-500">{error}</div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={closeOptionsModal}
                                className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => addToSelections(false)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang xử lý...' : 'Thêm vào giỏ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Simple modal for dishes without options */}
            {isSimpleModalOpen && (
                <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex">
                    <div className="relative p-4 bg-white w-full max-w-md m-auto rounded-lg">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            onClick={closeSimpleModal}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18M6 6l12 12"></path>
                            </svg>
                        </button>

                        <h2 className="text-xl font-bold mb-4 text-gray-800">{dish.name}</h2>
                        <p className="text-gray-600 mb-4">
                            {dish.price.text}
                        </p>

                        {/* Quantity selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Số lượng
                            </label>
                            <div className="flex items-center">
                                <button
                                    className="px-3 py-1 border border-gray-300 rounded-l text-gray-800"
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                    className="w-16 text-center border-t border-b border-gray-300 py-1 text-gray-800"
                                />
                                <button
                                    className="px-3 py-1 border border-gray-300 rounded-r text-gray-800"
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Note input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ghi chú
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                                rows={3}
                                placeholder="Ghi chú về món ăn (tùy chọn)"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            ></textarea>
                        </div>

                        {error && (
                            <div className="mb-4 text-red-500">{error}</div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={closeSimpleModal}
                                className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => addToSelections(true)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang xử lý...' : 'Thêm vào giỏ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
