const CLIENT_NAME_KEY = 'hnag-client-name';

export function getClientName(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CLIENT_NAME_KEY);
}

export function setClientName(name: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CLIENT_NAME_KEY, name);
}

export function hasClientName(): boolean {
    return !!getClientName();
}
