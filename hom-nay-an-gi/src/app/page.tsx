import EateryList from "@/components/EateryList";
import { getEateries } from "@/lib/api";

export default async function Home() {
  const eateries = await getEateries();

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Hôm Nay Ăn Gì?
      </h1>
      <p className="text-center mb-8 text-white">
        Chọn một nhà hàng để xem thực đơn
      </p>
      <EateryList eateries={eateries} />
    </main>
  );
}
