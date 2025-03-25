import { Eatery } from "@/entities/eatery";
import Link from "next/link";

interface EateryListProps {
    eateries: Eatery[];
}

export default function EateryList({ eateries }: EateryListProps) {
    if (!eateries || eateries.length === 0) {
        return (
            <div className="p-4 text-center">
                <p className="text-gray-500">No eateries available</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {eateries.map((eatery, index) => (
                <Link
                    href={`/eatery/${encodeURIComponent(eatery.data_path)}`} // Add timestamp to force the router to treat it as a new page
                    key={index}
                    className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100"
                >
                    <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900">
                        {eatery.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                        Click to view menu
                    </p>
                </Link>
            ))}
        </div>
    );
}
