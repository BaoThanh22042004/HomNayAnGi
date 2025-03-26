const CLIENT_NAME_KEY = 'hnag-client-name';

// Add event system to notify components of name changes
type ClientNameListener = (name: string) => void;
const listeners: ClientNameListener[] = [];

export function getClientName(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CLIENT_NAME_KEY);
}

export function setClientName(name: string): void {
    if (typeof window === 'undefined') return;
    
    // Store the name
    localStorage.setItem(CLIENT_NAME_KEY, name);
    
    // Notify all listeners about the name change
    listeners.forEach(listener => listener(name));
}

export function hasClientName(): boolean {
    return !!getClientName();
}

// Add function to subscribe to name changes
export function subscribeToNameChanges(callback: ClientNameListener): () => void {
    listeners.push(callback);
    
    // Return function to unsubscribe
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}
