import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import SelectedDishesWrapper from "@/components/SelectedDishesWrapper";
import SseDebugger from "@/components/SseDebugger";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hôm Nay Ăn Gì?",
  description: "Ứng dụng giúp bạn chọn món ăn mỗi ngày",
};

// Use a server component for initial data prefetching
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16" />
        {/* Add meta tags to prevent aggressive caching */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <ToastProvider>
          <header className="bg-red-600 text-white py-4">
            <div className="container mx-auto px-4">
              <h1 className="text-2xl font-bold">Hôm Nay Ăn Gì?</h1>
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
              &copy; {new Date().getFullYear()} Hôm Nay Ăn Gì?
            </div>
          </footer>

          {/* Add the debug component at the end */}
          {process.env.NODE_ENV !== 'production' && <SseDebugger />}
        </ToastProvider>
      </body>
    </html>
  );
}
