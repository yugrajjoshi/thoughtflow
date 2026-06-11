import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, VolumeX, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config';


const getCleanToken = () => {
  const rawToken = localStorage.getItem("token");
  return rawToken ? rawToken.replace(/^"|"$/g, "").trim() : "";
};

function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    is_private_account: false,
    allow_messages_from_non_followers: true,
    allow_tagging: true,
    notify_likes: true,
    notify_comments: true,
    notify_reposts: true,
    group_engagement_notifications: true,
    notify_follows: true,
    notify_mentions: true,
    notify_messages: true,
    theme: 'dark',
    show_online_status: true,
    allow_search_indexing: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [activeTab, setActiveTab] = useState('privacy');

  const [mutedUsers, setMutedUsers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    try {
      const muted = JSON.parse(localStorage.getItem('thoughtflow_muted_users') || '[]');
      setMutedUsers(Array.isArray(muted) ? muted : []);

      const blocked = JSON.parse(localStorage.getItem('thoughtflow_blocked_users') || '[]');
      setBlockedUsers(Array.isArray(blocked) ? blocked : []);
    } catch (error) {
      console.error('Failed to load muted/blocked users:', error);
    }
  }, [activeTab]);

  const handleUnmute = (username) => {
    try {
      const updated = mutedUsers.filter(u => u !== username);
      localStorage.setItem('thoughtflow_muted_users', JSON.stringify(updated));
      setMutedUsers(updated);
      window.dispatchEvent(new Event("thoughtflow_relations_changed"));
      showNotification('success', `Unmuted @${username}`);
    } catch (error) {
      console.error('Failed to unmute:', error);
      showNotification('error', 'Failed to unmute user');
    }
  };

  const handleUnblock = (username) => {
    try {
      const updated = blockedUsers.filter(u => u !== username);
      localStorage.setItem('thoughtflow_blocked_users', JSON.stringify(updated));
      setBlockedUsers(updated);
      window.dispatchEvent(new Event("thoughtflow_relations_changed"));
      showNotification('success', `Unblocked @${username}`);
    } catch (error) {
      console.error('Failed to unblock:', error);
      showNotification('error', 'Failed to unblock user');
    }
  };

  const fetchSettings = useCallback(async () => {
    const token = getCleanToken();
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/settings/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        const savedTheme = data?.theme || 'dark';
        localStorage.setItem('thoughtflow_theme', savedTheme);
      } else {
        showNotification('error', 'Failed to load settings');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      showNotification('error', 'Error loading settings');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme || 'dark';
    document.body.dataset.theme = settings.theme || 'dark';
  }, [settings.theme]);


  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 3000);
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleThemeChange = (theme) => {
    setSettings((prev) => ({
      ...prev,
      theme,
    }));
  };

  const saveSettings = async () => {
    const token = getCleanToken();
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/settings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        localStorage.setItem('thoughtflow_theme', settings.theme || 'dark');
        document.documentElement.dataset.theme = settings.theme || 'dark';
        document.body.dataset.theme = settings.theme || 'dark';
        showNotification('success', 'Settings saved successfully');
      } else {
        showNotification('error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      showNotification('error', 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur border-b border-zinc-700 px-4 py-3">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-zinc-900 rounded-full transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Notification */}
      {notification.message && (
        <div
          className={`sticky top-16 z-30 px-4 py-3 border-b flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-green-900/20 border-green-700'
              : 'bg-red-900/20 border-red-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle size={18} className="text-green-500" />
          ) : (
            <AlertCircle size={18} className="text-red-500" />
          )}
          <p className="text-sm">{notification.message}</p>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {/* Tabs */}
        <div className="flex border-b border-zinc-700 sticky top-22 z-30 bg-black/80 backdrop-blur">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'privacy'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Privacy
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'notifications'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'appearance'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'moderation'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Moderation
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Private Account</p>
                  <p className="text-sm text-zinc-400">
                    Only approved followers can see your posts
                  </p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.is_private_account}
                    onChange={() => handleToggle('is_private_account')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Allow Messages from Non-Followers</p>
                  <p className="text-sm text-zinc-400">
                    Accept direct messages from anyone
                  </p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.allow_messages_from_non_followers}
                    onChange={() => handleToggle('allow_messages_from_non_followers')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Allow Tagging</p>
                  <p className="text-sm text-zinc-400">
                    Allow others to tag you in posts
                  </p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.allow_tagging}
                    onChange={() => handleToggle('allow_tagging')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Show Online Status</p>
                  <p className="text-sm text-zinc-400">
                    Let others see when you're active
                  </p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.show_online_status}
                    onChange={() => handleToggle('show_online_status')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Allow Search Indexing</p>
                  <p className="text-sm text-zinc-400">
                    Allow search engines to index your profile
                  </p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.allow_search_indexing}
                    onChange={() => handleToggle('allow_search_indexing')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Likes</p>
                  <p className="text-sm text-zinc-400">Get notified when someone likes your post</p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notify_likes}
                    onChange={() => handleToggle('notify_likes')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Comments</p>
                  <p className="text-sm text-zinc-400">Get notified when someone comments on your post</p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notify_comments}
                    onChange={() => handleToggle('notify_comments')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Reposts</p>
                  <p className="text-sm text-zinc-400">Get notified when someone reposts your post</p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notify_reposts}
                    onChange={() => handleToggle('notify_reposts')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Group likes, comments, and reposts</p>
                  <p className="text-sm text-zinc-400">Bundle activity from the same people into one notification card</p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.group_engagement_notifications}
                    onChange={() => handleToggle('group_engagement_notifications')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Follows</p>
                  <p className="text-sm text-zinc-400">Get notified when someone follows you</p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notify_follows}
                    onChange={() => handleToggle('notify_follows')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Mentions</p>
                  <p className="text-sm text-zinc-400">Get notified when someone mentions you</p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notify_mentions}
                    onChange={() => handleToggle('notify_mentions')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">Messages</p>
                  <p className="text-sm text-zinc-400">Get notified for new direct messages</p>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notify_messages}
                    onChange={() => handleToggle('notify_messages')}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>

              <div>
                <p className="font-medium mb-4">Theme</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`px-6 py-3 rounded-lg transition ${
                      settings.theme === 'dark'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`px-6 py-3 rounded-lg transition ${
                      settings.theme === 'light'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    Light
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Moderation Tab */}
          {activeTab === 'moderation' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold mb-1 text-zinc-100">Muted Accounts</h2>
                <p className="text-sm text-zinc-400 mb-4">
                  Posts from these accounts will be hidden from your feed.
                </p>
                {mutedUsers.length === 0 ? (
                  <div className="p-4 bg-zinc-900/20 border border-zinc-800 rounded-xl text-center text-zinc-500 text-sm">
                    No muted accounts.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-850 border border-zinc-800 bg-zinc-900/10 rounded-xl overflow-hidden">
                    {mutedUsers.map((user) => (
                      <div key={user} className="flex items-center justify-between p-4 transition hover:bg-zinc-900/30">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                            <VolumeX size={16} />
                          </div>
                          <span className="font-medium text-zinc-200">@{user}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnmute(user)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-400 border border-blue-500/30 hover:border-blue-500 rounded-lg hover:bg-blue-500/10 transition"
                        >
                          Unmute
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-1 text-zinc-100">Blocked Accounts</h2>
                <p className="text-sm text-zinc-400 mb-4">
                  Posts from these accounts will be hidden from your feed.
                </p>
                {blockedUsers.length === 0 ? (
                  <div className="p-4 bg-zinc-900/20 border border-zinc-800 rounded-xl text-center text-zinc-500 text-sm">
                    No blocked accounts.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-850 border border-zinc-800 bg-zinc-900/10 rounded-xl overflow-hidden">
                    {blockedUsers.map((user) => (
                      <div key={user} className="flex items-center justify-between p-4 transition hover:bg-zinc-900/30">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                            <Ban size={16} />
                          </div>
                          <span className="font-medium text-zinc-200">@{user}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnblock(user)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/30 hover:border-red-500 rounded-lg hover:bg-red-500/10 transition"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-900 transition"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Settings;
