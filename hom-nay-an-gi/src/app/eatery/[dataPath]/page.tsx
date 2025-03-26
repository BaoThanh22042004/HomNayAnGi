import { getEateries, getEateryMenu } from "@/lib/api";
import MenuDisplay from "@/components/MenuDisplay";
import Link from "next/link";
import { notFound } from "next/navigation";

// Define the type for params as a Promise
type Params = Promise<{ dataPath: string }>;

export async function generateStaticParams() {
    const eateries = await getEateries();

    return eateries.map(eatery => ({
        dataPath: encodeURIComponent(eatery.data_path),
    }));
}

export default async function EateryPage({ params }: { params: Params }) {
    const { dataPath } = await params;
    const decodedDataPath = decodeURIComponent(dataPath);
    const menuInfos = await getEateryMenu(decodedDataPath);

    // Get all eateries to find the current eatery name
    const eateries = await getEateries();
    const currentEatery = eateries.find(e => e.data_path === decodedDataPath);

    if (!currentEatery) {
        return notFound();
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Link
                    href="/"
                    className="text-blue-600 hover:underline flex items-center"
                >
                    <span className="mr-1">←</span> Quay lại danh sách
                </Link>
            </div>

            <h1 className="text-3xl font-bold mb-2">
                {currentEatery.name}
            </h1>
            <div className="h-1 w-20 bg-red-500 mb-8"></div>

            <MenuDisplay menuInfos={menuInfos} dataPath={decodedDataPath} />
        </div>
    );
}
