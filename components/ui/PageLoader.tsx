export default function PageLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-[3px] border-[var(--border)] border-t-[#E8A838] animate-spin" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-b-[#E8A838]/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <div className="text-center space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-disabled)]">Loading</p>
            </div>
        </div>
    );
}
