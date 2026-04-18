const API_BASE = "http://127.0.0.1:8000";

const toMediaUrl = (value) => {
    if (!value) return "";
    return value.startsWith("http") ? value : `${API_BASE}${value}`;
};

function FollowingList({ title, people = [], emptyMessage, onPersonClick }) {
    return (
        <section className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <span className="text-sm text-zinc-500">{people.length}</span>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {people.length > 0 ? (
                    people.map((person) => (
                        <button
                            key={person.username}
                            type="button"
                            onClick={() => onPersonClick?.(person.username)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-zinc-900/80 hover:bg-zinc-900/80 transition"
                        >
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                                {person.profile_image ? (
                                    <img
                                        src={toMediaUrl(person.profile_image)}
                                        alt={person.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-white font-medium truncate">{person.name || person.username}</p>
                                    {person.is_following ? (
                                        <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-300 border border-emerald-400/30 rounded-full px-2 py-0.5">
                                            Following
                                        </span>
                                    ) : null}
                                </div>
                                <p className="text-sm text-zinc-500 truncate">@{person.username}</p>
                                {person.bio ? <p className="text-sm text-zinc-400 line-clamp-2 mt-1">{person.bio}</p> : null}
                            </div>
                        </button>
                    ))
                ) : (
                    <p className="px-4 py-6 text-sm text-zinc-500">{emptyMessage}</p>
                )}
            </div>
        </section>
    );
}

export default FollowingList;
