import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold mb-4">404 - Không tìm thấy</h2>
            <p className="text-gray-600 mb-6">
                Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.
            </p>
            <Link
                href="/"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
                Quay lại trang chủ
            </Link>
        </div>
    );
}
