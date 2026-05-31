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

  const markRead = async (id) => {
    try {
      await fetch(`${API_BASE}/api/notifications/mark-read/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Token ' + getToken() },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, unread: false } : n));
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

  const openNotification = async (notification) => {
    const postId = Number(notification?.data?.post_id);
    if (!Number.isFinite(postId) || postId <= 0) {
      return;
    }

    if (notification?.unread) {
      await markRead(notification.id);
    }

    navigate('/home', { state: { openPostId: postId } });
  };

  return (
    <main className="responsive-layout bg-black w-full min-h-dvh overflow-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 flex items-center justify-center text-white rounded-full  hover:bg-zinc-700"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
          </div>
          <div>
            <button onClick={markAllRead} className="px-3 py-1 bg-zinc-700 text-white rounded">Mark all read</button>
          </div>
        </div>

        {loading ? <p className="text-zinc-400">Loading...</p> : null}
        {notifications.length === 0 && !loading ? (
          <p className="text-zinc-400">No notifications</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li
                key={n.id}
                role={Number.isFinite(Number(n?.data?.post_id)) ? 'button' : undefined}
                tabIndex={Number.isFinite(Number(n?.data?.post_id)) ? 0 : undefined}
                onClick={() => openNotification(n)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openNotification(n);
                  }
                }}
                className={`p-3 rounded border transition ${n.unread ? 'bg-zinc-900/60 border-zinc-700' : 'bg-transparent border-zinc-800'} ${Number.isFinite(Number(n?.data?.post_id)) ? 'cursor-pointer hover:bg-zinc-900/80' : ''}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1 flex items-start gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (n.actor_username) navigate(`/profile/${n.actor_username}`);
                      }}
                      className="shrink-0 hover:opacity-80 transition"
                    >
                      {n.actor_profile_image ? (
                        <img src={n.actor_profile_image} alt={n.actor_username} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-700" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-300">
                        {n.actor_username ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${n.actor_username}`);
                            }}
                            className="text-white font-medium hover:underline mr-2"
                          >
                            {n.actor_username}
                          </button>
                        ) : (
                          <strong className="text-white mr-2">System</strong>
                        )} <span className="text-zinc-300">{n.verb}</span>
                      </p>
                      {n.data && n.data.preview ? <p className="mt-1 text-xs leading-5 break-normal whitespace-normal text-zinc-400">{n.data.preview}</p> : null}
                      <p className="text-xs text-zinc-500 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end shrink-0">
                    {n.data && n.data.post_id ? <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Open post</span> : null}
                    {n.unread ? (
                      <button onClick={(event) => { event.stopPropagation(); markRead(n.id); }} className="px-2 py-1 text-xs bg-blue-600 rounded text-white">Mark read</button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

export default Notifications;
