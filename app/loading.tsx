export default function GlobalLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
                <div className="relative w-12 h-12 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gray-900 animate-spin" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Chargement…</p>
            </div>
        </div>
    );
}
