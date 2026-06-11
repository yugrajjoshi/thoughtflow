import React, { useEffect, useState } from 'react';
import API_BASE from '../config';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const getToken = () => {
  const raw = localStorage.getItem('token');
  return raw ? raw.replace(/^"|"$/g, '').trim() : '';
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/notifications/`, {
        headers: {
          Authorization: 'Token ' + getToken(),
        },
      });
      if (!resp.ok) throw new Error('Failed to load');
      const data = await resp.json();
      setNotifications(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markGroupRead = async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      await fetch(`${API_BASE}/api/notifications/mark-read/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Token ' + getToken() },
        body: JSON.stringify({ ids: ids }),
      });
      setNotifications((prev) => prev.map(n => ids.includes(n.id) ? { ...n, unread: false } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/mark-all-read/`, {
        method: 'POST',
        headers: { Authorization: 'Token ' + getToken() },
      });
      setNotifications((prev) => prev.map(n => ({ ...n, unread: false })));
    } catch (e) {
      console.error(e);
    }
  };

  const groupNotifications = (list) => {
    const grouped = [];
    const groups = {}; // key: "type:postId"

    list.forEach(n => {
      const type = n.data?.type;
      const postId = n.data?.post_id;

      if ((type === 'like' || type === 'repost') && postId) {
        const groupKey = `${type}:${postId}`;
        if (!groups[groupKey]) {
          groups[groupKey] = {
            id: n.id,
            type: type,
            postId: postId,
            verb: type === 'like' ? 'liked your post' : 'reposted your post',
            preview: n.data?.preview || '',
            actors: [], // list of { username, profile_image }
            unread: false,
            created_at: n.created_at,
            ids: [],
          };
          grouped.push(groups[groupKey]);
        }
        
        // Add actor to group if not already in list
        if (n.actor_username && !groups[groupKey].actors.some(a => a.username === n.actor_username)) {
          groups[groupKey].actors.push({
            username: n.actor_username,
            profile_image: n.actor_profile_image
          });
        }
        if (n.unread) {
          groups[groupKey].unread = true;
        }
        groups[groupKey].ids.push(n.id);
        
        // Keep the most recent timestamp
        if (new Date(n.created_at) > new Date(groups[groupKey].created_at)) {
          groups[groupKey].created_at = n.created_at;
        }
      } else {
        // Single/non-groupable notification (e.g. follow)
        grouped.push({
          id: n.id,
          type: 'single',
          verb: n.verb,
          preview: n.data?.preview || '',
          actor_username: n.actor_username,
          actor_profile_image: n.actor_profile_image,
          unread: n.unread,
          created_at: n.created_at,
          data: n.data,
          ids: [n.id]
        });
      }
    });

    return grouped;
  };

  const groupedList = groupNotifications(notifications);

  return (
    <main className="responsive-layout bg-black w-full min-h-dvh overflow-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-white transition hover:bg-zinc-900"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
          </div>
          <div>
            <button 
              onClick={markAllRead} 
              className="px-4 py-2 text-sm font-medium border border-zinc-700 rounded-lg hover:bg-zinc-900 transition text-white"
            >
              Mark all read
            </button>
          </div>
        </div>

        {loading ? <p className="text-zinc-400">Loading...</p> : null}
        {groupedList.length === 0 && !loading ? (
          <p className="text-zinc-400">No notifications</p>
        ) : (
          <ul className="space-y-3">
            {groupedList.map((g, idx) => {
              if (g.type === 'like' || g.type === 'repost') {
                const recentActors = g.actors.slice(0, 3);
                const countRemaining = g.actors.length - 3;
                
                let namesText = '';
                if (g.actors.length === 1) {
                  namesText = g.actors[0].username;
                } else if (g.actors.length === 2) {
                  namesText = `${g.actors[0].username} and ${g.actors[1].username}`;
                } else if (g.actors.length === 3) {
                  namesText = `${g.actors[0].username}, ${g.actors[1].username}, and ${g.actors[2].username}`;
                } else {
                  namesText = `${g.actors[0].username}, ${g.actors[1].username}, ${g.actors[2].username}, and ${countRemaining} others`;
                }

                return (
                  <li
                    key={`${g.type}-${g.postId}-${idx}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/home', { state: { openPostId: g.postId } })}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate('/home', { state: { openPostId: g.postId } });
                      }
                    }}
                    className={`p-4 rounded-xl border transition ${g.unread ? 'bg-zinc-900/60 border-zinc-700' : 'bg-transparent border-zinc-800'} cursor-pointer hover:bg-zinc-900/80`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1 flex items-start gap-4">
                        {/* Overlapping profile pictures */}
                        <div className="flex -space-x-3 overflow-hidden shrink-0 mt-0.5">
                          {recentActors.map((actor, idxImg) => (
                            actor.profile_image ? (
                              <img
                                key={idxImg}
                                src={actor.profile_image}
                                alt={actor.username}
                                className="inline-block h-9 w-9 rounded-full ring-2 ring-black object-cover"
                              />
                            ) : (
                              <div
                                key={idxImg}
                                className="inline-block h-9 w-9 rounded-full bg-zinc-750 ring-2 ring-black flex items-center justify-center text-white text-xs font-semibold"
                              >
                                {actor.username?.slice(0, 2).toUpperCase() || 'U'}
                              </div>
                            )
                          ))}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-zinc-300">
                            <span className="text-white font-semibold">{namesText}</span> {g.verb}
                          </p>
                          {g.preview ? (
                            <p className="mt-1.5 text-xs leading-5 break-all text-zinc-400 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-900/60">
                              {g.preview}
                            </p>
                          ) : null}
                          <p className="text-xs text-zinc-500 mt-2">{new Date(g.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end shrink-0">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Open post</span>
                        {g.unread ? (
                          <button 
                            onClick={(event) => { event.stopPropagation(); markGroupRead(g.ids); }} 
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 transition rounded-md text-white shrink-0"
                          >
                            Mark read
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              } else {
                const isPostNav = g.data && Number.isFinite(Number(g.data.post_id));
                return (
                  <li
                    key={g.id}
                    role={isPostNav ? 'button' : undefined}
                    tabIndex={isPostNav ? 0 : undefined}
                    onClick={() => {
                      if (isPostNav) {
                        navigate('/home', { state: { openPostId: Number(g.data.post_id) } });
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        if (isPostNav) {
                          event.preventDefault();
                          navigate('/home', { state: { openPostId: Number(g.data.post_id) } });
                        }
                      }
                    }}
                    className={`p-4 rounded-xl border transition ${g.unread ? 'bg-zinc-900/60 border-zinc-700' : 'bg-transparent border-zinc-800'} ${isPostNav ? 'cursor-pointer hover:bg-zinc-900/80' : ''}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1 flex items-start gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (g.actor_username) navigate(`/profile/${g.actor_username}`);
                          }}
                          className="shrink-0 hover:opacity-80 transition"
                        >
                          {g.actor_profile_image ? (
                            <img src={g.actor_profile_image} alt={g.actor_username} className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-zinc-750 flex items-center justify-center text-white text-xs font-semibold">
                              {g.actor_username?.slice(0, 2).toUpperCase() || 'U'}
                            </div>
                          )}
                        </button>
                        
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-zinc-300">
                            {g.actor_username ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${g.actor_username}`);
                                }}
                                className="text-white font-medium hover:underline mr-2"
                              >
                                {g.actor_username}
                              </button>
                            ) : (
                              <strong className="text-white mr-2">System</strong>
                            )} <span className="text-zinc-300">{g.verb}</span>
                          </p>
                          {g.preview ? <p className="mt-1 text-xs leading-5 break-all text-zinc-400 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-900/60">{g.preview}</p> : null}
                          <p className="text-xs text-zinc-500 mt-2">{new Date(g.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end shrink-0">
                        {isPostNav ? <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Open post</span> : null}
                        {g.unread ? (
                          <button 
                            onClick={(event) => { event.stopPropagation(); markGroupRead(g.ids); }} 
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 transition rounded-md text-white shrink-0"
                          >
                            Mark read
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              }
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

export default Notifications;
