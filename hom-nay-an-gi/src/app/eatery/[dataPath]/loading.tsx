export default function Loading() {
    return (
        <div className="container mx-auto py-8">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="h-12 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-1 w-20 bg-gray-200 mb-8"></div>

                {[1, 2, 3].map((section) => (
                    <div key={section} className="mb-8">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((card) => (
                                <div key={card} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="h-48 bg-gray-200 w-full"></div>
                                    <div className="p-4">
                                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                                        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
