export default function CRMLoading() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="text-center">
                <div className="relative w-10 h-10 mx-auto mb-3">
                    <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-luna-charcoal animate-spin" />
                </div>
                <p className="text-sm text-luna-text-muted font-normal">Chargement…</p>
            </div>
        </div>
    );
}
