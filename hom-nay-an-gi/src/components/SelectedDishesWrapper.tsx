'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { hasClientName } from '@/lib/clientName';
import ClientNameInput from './ClientNameInput';

// Dynamically import SelectedDishes with no SSR
const SelectedDishes = dynamic(() => import('./SelectedDishes'), { ssr: false });

export default function SelectedDishesWrapper() {
    const [showNameInput, setShowNameInput] = useState(false);

    useEffect(() => {
        // Check if client name exists
        if (!hasClientName()) {
            setShowNameInput(true);
        }
    }, []);

    const handleNameSet = () => {
        setShowNameInput(false);
    };

    return (
        <>
            <SelectedDishes />
            {showNameInput && <ClientNameInput onNameSet={handleNameSet} />}
        </>
    );
}
