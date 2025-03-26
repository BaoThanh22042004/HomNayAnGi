'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { hasClientName, getClientName, subscribeToNameChanges } from '@/lib/clientName';
import ClientNameInput from './ClientNameInput';

// Dynamically import SelectedDishes with no SSR
const SelectedDishes = dynamic(() => import('./SelectedDishes'), { ssr: false });

export default function SelectedDishesWrapper() {
    const [showNameInput, setShowNameInput] = useState(false);
    const [currentClientName, setCurrentClientName] = useState<string | null>(null);

    useEffect(() => {
        // Check if client name exists
        const storedName = getClientName();
        setCurrentClientName(storedName);
        
        if (!hasClientName()) {
            setShowNameInput(true);
        }
        
        // Subscribe to name changes
        const unsubscribe = subscribeToNameChanges((newName) => {
            setCurrentClientName(newName);
        });
        
        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleNameSet = (name: string) => {
        setShowNameInput(false);
        setCurrentClientName(name);
    };

    return (
        <>
            <SelectedDishes />
            {showNameInput && <ClientNameInput onNameSet={handleNameSet} initialName={currentClientName || ''} />}
        </>
    );
}
