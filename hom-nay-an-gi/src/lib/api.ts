import { Eatery } from "@/entities/eatery";
import { MenuInfos } from "@/entities/menu";

// Helper to get absolute URL based on environment
function getBaseUrl() {
    if (typeof window !== 'undefined') {
        // Browser should use relative path
        return '';
    }

    // Server-side rendering must use absolute URL
    const vercelUrl = process.env.BASE_URL;
    if (vercelUrl) {
        return `https://${vercelUrl}`;
    }

    // Local development
    return `http://localhost:${process.env.PORT || 3000}`;
}

/**
 * Fetches the list of available eateries
 */
export async function getEateries(): Promise<Eatery[]> {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/menu`, {
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch eateries: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching eateries:", error);
        return [];
    }
}

/**
 * Fetches the menu for a specific eatery
 * @param dataPath - The data path for the eatery
 */
export async function getEateryMenu(dataPath: string): Promise<MenuInfos> {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/menu?data_path=${dataPath}`, {
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch menu: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching menu for ${dataPath}:`, error);
        return [];
    }
}
