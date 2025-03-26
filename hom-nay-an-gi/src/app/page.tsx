import { getEateries } from '@/lib/api';
import Link from 'next/link';
import { initializeDb } from '@/lib/db';

// Initialize the database when the application starts
initializeDb().catch(console.error);

export default async function Home() {
  const eateries = await getEateries();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Chọn Quán Ăn</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eateries.map((eatery, index) => (
          <Link 
            key={index} 
            href={`/eatery/${eatery.data_path}`}
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-800">{eatery.name}</h2>
              <p className="text-gray-600">Xem thực đơn &rarr;</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
