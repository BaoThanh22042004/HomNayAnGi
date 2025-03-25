'use client';

import { useEffect, useState } from 'react';
import { SelectedDish } from '@/lib/dishSelectionStore';
import { formatPrice } from '@/lib/utils';
import { getClientName } from '@/lib/clientName';
import ClientNameInput from './ClientNameInput';

export default function SelectedDishes() {
    const [selections, setSelections] = useState<SelectedDish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentClientName, setCurrentClientName] = useState<string | null>(null);
    const [showNameInput, setShowNameInput] = useState(false);

    // Function to fetch selected dishes
    const fetchSelections = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/selections');

            if (!response.ok) {
                throw new Error('Failed to fetch selections');
            }

            const data = await response.json();
            setSelections(data);
            setError(null);
        } catch (err) {
            setError('Could not load selections. Please try again.');
            console.error('Error fetching selections:', err);
        } finally {
            setLoading(false);
        }
    };

    // Function to remove a selected dish
    const removeSelection = async (id: string) => {
        try {
            const response = await fetch(`/api/selections?id=${id}&clientName=${encodeURIComponent(currentClientName || '')}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // Parse the error message
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove selection');
            }

            // Update the local state by removing the deleted item
            setSelections(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('Error removing selection:', err);
            setError(err instanceof Error ? err.message : 'Failed to remove item. Please try again.');
        }
    };

    // Update current client name when it changes
    const updateClientName = () => {
        const storedName = getClientName();
        setCurrentClientName(storedName);
    };

    // Fetch selections on component mount and set current client name
    useEffect(() => {
        fetchSelections();
        updateClientName();

        // Set up polling for updates every 5 seconds
        const intervalId = setInterval(fetchSelections, 5000);

        // Clean up on unmount
        return () => clearInterval(intervalId);
    }, []);

    // Handle name change
    const handleNameChange = () => {
        setShowNameInput(true);
    };

    const handleNameSet = (name: string) => {
        setShowNameInput(false);

        // Force a refresh of the selections to get updates with new name
        fetchSelections();

        // Update the current client name
        updateClientName();
    };

    // Calculate total price
    const totalPrice = selections.reduce((sum, dish) => sum + dish.price * dish.quantity, 0);

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-red-600 text-white px-4 py-3 flex justify-between items-center">
                <h2 className="text-lg font-bold">Món đã chọn</h2>
                <span className="text-sm bg-white text-red-600 px-2 py-1 rounded-full">
                    {selections.length} món
                </span>
            </div>

            {/* Show current user info */}
            <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                <div className="text-sm">
                    <span className="text-gray-600">Bạn là: </span>
                    <span className="font-medium">{currentClientName || 'Chưa đặt tên'}</span>
                </div>
                <button
                    onClick={handleNameChange}
                    className="text-xs text-blue-600 hover:underline"
                >
                    Đổi tên
                </button>
            </div>

            {loading && selections.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                    Đang tải danh sách món...
                </div>
            ) : error ? (
                <div className="p-4 text-center text-red-500">
                    {error}
                </div>
            ) : selections.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                    Chưa có món nào được chọn.
                </div>
            ) : (
                <div>
                    <ul className="divide-y divide-gray-200">
                        {selections.map(selection => (
                            <li key={selection.id} className={`p-4 hover:bg-gray-50 ${selection.clientName === currentClientName ? 'bg-yellow-50' : ''}`}>
                                <div className="flex items-start gap-3">
                                    {selection.photoUrl && (
                                        <img
                                            src={selection.photoUrl}
                                            alt={selection.name}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                            <h3 className="font-medium text-gray-900">
                                                {selection.name}
                                            </h3>
                                            <span className="text-red-600 font-medium">
                                                {formatPrice(selection.price)}
                                            </span>
                                        </div>

                                        <div className="text-sm text-gray-500 mt-1">
                                            Người chọn: <span className="font-medium">{selection.clientName}</span>
                                            {selection.clientName === currentClientName && ' (Bạn)'}
                                        </div>

                                        {selection.quantity > 1 && (
                                            <div className="text-sm text-gray-500 mt-1">
                                                Số lượng: {selection.quantity}
                                            </div>
                                        )}

                                        {selection.selectedOptions.length > 0 && (
                                            <div className="mt-1 text-sm text-gray-500">
                                                {selection.selectedOptions.map((option, idx) => (
                                                    <div key={idx}>
                                                        <span className="font-medium">{option.optionName}:</span>{' '}
                                                        {option.selectedItems.map(item => item.itemName).join(', ')}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Only allow users to remove their own selections */}
                                    {selection.clientName === currentClientName && (
                                        <button
                                            onClick={() => removeSelection(selection.id)}
                                            className="text-gray-400 hover:text-red-500"
                                            aria-label="Xóa"
                                            title="Xóa món này"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 111.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="bg-gray-50 px-4 py-3 border-t">
                        <div className="flex justify-between items-center font-bold">
                            <span>Tổng cộng:</span>
                            <span className="text-red-600">{formatPrice(totalPrice)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Name change modal */}
            {showNameInput && (
                <ClientNameInput
                    onNameSet={handleNameSet}
                    initialName={currentClientName || ''}
                    isUpdate={true}
                />
            )}
        </div>
    );
}
