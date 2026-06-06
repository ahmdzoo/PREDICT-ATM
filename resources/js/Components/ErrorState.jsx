import { AlertTriangle } from 'lucide-react';

export default function ErrorState({ message = 'Terjadi kesalahan', onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="p-3 bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-600 text-sm mb-4 text-center">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Coba Lagi
                </button>
            )}
        </div>
    );
}
