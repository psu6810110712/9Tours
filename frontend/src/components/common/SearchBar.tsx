
export interface SearchBarProps {
    search: string;
    setSearch: (value: string) => void;
    guests: number;
    setGuests: (value: number) => void;
    onSearch: () => void;
}

export default function SearchBar({ search, setSearch, guests, setGuests, onSearch }: SearchBarProps) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-2 flex items-center gap-1 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 flex-1 min-w-0 pl-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input
                    type="text"
                    placeholder="ค้นหาทัวร์หรือสถานที่..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                    className="flex-1 py-2.5 text-gray-800 text-sm outline-none bg-transparent min-w-0"
                />
            </div>
            <div className="w-px h-7 bg-gray-200 flex-shrink-0" />
            <div className="flex items-center gap-1.5 px-3 flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="text-sm text-gray-700 bg-transparent outline-none font-medium"
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>x{n}</option>
                    ))}
                </select>
            </div>
            <button
                onClick={onSearch}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
            >
                ค้นหา
            </button>
        </div>
    );
}
