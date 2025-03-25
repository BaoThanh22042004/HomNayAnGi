import type { Metadata } from "next";
import "./globals.css";
import SelectedDishesWrapper from "@/components/SelectedDishesWrapper";

export const metadata: Metadata = {
  title: "Hôm Nay Ăn Gì",
  description: "Ứng dụng giúp bạn chọn món ăn mỗi ngày",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-red-600 text-white py-4">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold">Hôm Nay Ăn Gì</h1>
          </div>
        </header>

        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 py-8 px-4">
          <div className="lg:col-span-3">
            <main>{children}</main>
          </div>

          <div className="lg:col-span-1">
            <SelectedDishesWrapper />
          </div>
        </div>

        <footer className="bg-gray-100 py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Hôm Nay Ăn Gì
          </div>
        </footer>
      </body>
    </html>
  );
}
