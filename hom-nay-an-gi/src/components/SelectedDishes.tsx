'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { getClientName, subscribeToNameChanges } from '@/lib/clientName';
import ClientNameInput from './ClientNameInput';
import Image from 'next/image';
import { SelectedDish } from '@/entities/menu';
import { useToast } from '@/contexts/ToastContext';

export default function SelectedDishes() {
    const [selections, setSelections] = useState<SelectedDish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentClientName, setCurrentClientName] = useState<string | null>(null);
    const [showNameInput, setShowNameInput] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const { showToast } = useToast();

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
            
            // Show success toast
            showToast('Món đã được xóa thành công', 'success');
        } catch (err) {
            console.error('Error removing selection:', err);
            setError(err instanceof Error ? err.message : 'Failed to remove item. Please try again.');
            showToast(err instanceof Error ? err.message : 'Không thể xóa món. Vui lòng thử lại.', 'error');
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

        // Subscribe to client name changes
        const unsubscribe = subscribeToNameChanges((newName) => {
            setCurrentClientName(newName);
            // Refresh selections after name change to ensure proper ownership
            fetchSelections();
        });

        // Set up polling for updates every 5 seconds
        const intervalId = setInterval(fetchSelections, 5000);

        // Clean up on unmount
        return () => {
            clearInterval(intervalId);
            unsubscribe();
        };
    }, []);

    // Handle name change
    const handleNameChange = () => {
        setShowNameInput(true);
    };

    // Fix: Update handleNameSet to accept the name parameter
    const handleNameSet = (name: string) => {
        setShowNameInput(false);
        
        // Update current client name in state
        setCurrentClientName(name);
        
        // Force a refresh of the selections to get updates with new name
        fetchSelections();
    };

    const handleOpenDeleteAllModal = () => {
        setShowDeleteAllModal(true);
        setDeletePassword('');
        setDeleteError('');
    };

    const handleCloseDeleteAllModal = () => {
        setShowDeleteAllModal(false);
        setDeletePassword('');
        setDeleteError('');
    };

    const handleDeleteAll = async () => {
        try {
            setIsDeleting(true);
            setDeleteError('');
            
            const response = await fetch(`/api/selections?deleteAll=true&password=${encodeURIComponent(deletePassword)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to delete all selections: ${response.status}`);
            }

            // Clear selections and close modal
            setSelections([]);
            setShowDeleteAllModal(false);
            
            // Show success toast
            showToast('Tất cả món đã được xóa thành công', 'success');
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete selections. Please try again.');
            showToast(err instanceof Error ? err.message : 'Không thể xóa tất cả món. Vui lòng thử lại.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    // Calculate total price
    const totalPrice = selections.reduce((sum, dish) => sum + dish.price * dish.quantity, 0);

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="bg-red-600 text-white px-4 py-3 flex justify-between items-center">
                <h2 className="text-lg font-bold">Món đã chọn</h2>
                <div className="flex space-x-2">
                    {selections.length > 0 && (
                        <button
                            onClick={handleOpenDeleteAllModal}
                            className="text-white bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-sm flex items-center"
                            title="Xóa tất cả món đã chọn"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                            Xóa tất cả
                        </button>
                    )}
                    <span className="text-sm bg-white text-red-600 px-2 py-1 rounded-full">
                        {selections.length} món
                    </span>
                </div>
            </div>

            {/* Show current user info */}
            <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                <div className="text-sm">
                    <span className="text-gray-600">Bạn là: </span>
                    <span className="font-medium text-black">{currentClientName || 'Chưa đặt tên'}</span>
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
                                        <Image
                                            src={selection.photoUrl}
                                            alt={selection.name}
                                            className="w-16 h-16 object-cover rounded"
                                            width={200}
                                            height={150}
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

                                        <div className="text-sm text-gray-500 mt-1 font-semibold">
                                            Người chọn: <span className="font-bold">{selection.clientName}</span>
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

                                        {selection.note && (
                                            <div className="mt-1 text-sm text-gray-500">
                                                <span className="font-medium">Ghi chú:</span>{' '}
                                                {selection.note}
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
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="bg-gray-50 px-4 py-3 border-t">
                        <div className="flex justify-between items-center font-bold text-black">
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

            {showDeleteAllModal && (
                <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex">
                    <div className="relative p-6 bg-white w-full max-w-md m-auto rounded-lg">
                        <h2 className="text-xl font-bold mb-4">Xác nhận xóa tất cả</h2>
                        <p className="mb-4 text-gray-600">
                            Bạn có chắc chắn muốn xóa tất cả món đã chọn? Hành động này không thể hoàn tác.
                        </p>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu xác nhận
                            </label>
                            <input
                                type="password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Nhập mật khẩu để xác nhận"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                            />
                        </div>
                        
                        {deleteError && (
                            <div className="mb-4 text-red-500 text-sm">{deleteError}</div>
                        )}
                        
                        <div className="flex justify-end">
                            <button
                                onClick={handleCloseDeleteAllModal}
                                className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                disabled={isDeleting || !deletePassword}
                            >
                                {isDeleting ? 'Đang xử lý...' : 'Xóa tất cả'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
