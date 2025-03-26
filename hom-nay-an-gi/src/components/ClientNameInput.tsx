'use client';

import { useState, useEffect } from 'react';
import { getClientName, setClientName, hasClientName } from '@/lib/clientName';

interface ClientNameInputProps {
    onNameSet?: (name: string) => void;
    initialName?: string;
    isUpdate?: boolean;
}

export default function ClientNameInput({
    onNameSet,
    initialName = '',
    isUpdate = false
}: ClientNameInputProps) {
    const [name, setName] = useState(initialName);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // For new name input, check if client name exists
        if (!isUpdate) {
            const storedName = getClientName();
            if (storedName) {
                setName(storedName);
            } else {
                // If no name, show the modal
                setIsOpen(true);
            }
        } else {
            // For update, always show the modal
            setIsOpen(true);
        }
    }, [isUpdate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const oldName = getClientName();

            // First update the name in localStorage
            setClientName(name.trim());

            // If this is an update (not initial setup) and we have an old name,
            // update the name in all existing selections
            if (isUpdate && oldName && oldName !== name.trim()) {
                const response = await fetch('/api/selections', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        oldName,
                        newName: name.trim()
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update name in selections');
                }
            }

            setIsOpen(false);

            if (onNameSet) {
                onNameSet(name.trim());
            }
        } catch (err) {
            console.error('Error updating name:', err);
            setError('Failed to update name in all selections. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        // Only allow cancel if updating name (not during initial setup)
        if (isUpdate) {
            setIsOpen(false);
            if (onNameSet) {
                onNameSet(getClientName() || '');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4 text-black">
                    {isUpdate ? 'Đổi tên của bạn' : 'Nhập tên của bạn'}
                </h2>
                <p className="text-gray-600 mb-4">
                    {isUpdate
                        ? 'Cập nhật tên của bạn để mọi người biết ai đã chọn món nào.'
                        : 'Vui lòng nhập tên của bạn để mọi người có thể biết ai đã chọn món nào.'}
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tên của bạn"
                        className="w-full p-2 border border-gray-300 rounded mb-4 text-black"
                        required
                        autoFocus
                    />

                    {error && (
                        <div className="text-red-500 text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <div className="flex space-x-2">
                        {isUpdate && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50"
                            >
                                Hủy bỏ
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`${isUpdate ? 'flex-1' : 'w-full'} py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50`}
                        >
                            {isSubmitting ? 'Đang cập nhật...' : (isUpdate ? 'Cập nhật' : 'Lưu')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
