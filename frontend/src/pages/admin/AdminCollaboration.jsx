import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMessageCircle, FiVideo, FiFileText, FiSend, FiPaperclip,
    FiDownload, FiTrash2, FiX, FiMaximize2, FiMinimize2,
    FiUsers, FiMic, FiMicOff, FiVideoOff, FiPhone
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';

const BUCKET = 'complaints-docs';
const DOCS_PATH = 'admin-collab-docs';

const DISTRICT_COLORS = {
    udhamsingh: '#4f46e5', almora: '#059669', pithoragarh: '#d97706',
    chamoli: '#dc2626', uttarkashi: '#7c3aed', rudraprayag: '#db2777',
    pauri: '#0891b2', nainital: '#65a30d', champawat: '#ea580c',
    bageshwar: '#9333ea', haridwar: '#0d9488', tehri: '#b45309',
    dehradun: '#1d4ed8', all: '#821D30'
};

function getColor(district) {
    return DISTRICT_COLORS[district?.toLowerCase()] || '#64748b';
}

function Avatar({ name, district, size = 36, photoUrl }) {
    if (photoUrl) return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
    const initials = (name || 'A').slice(0, 2).toUpperCase();
    const bg = getColor(district);
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: size * 0.36, flexShrink: 0
        }}>{initials}</div>
    );
}

export default function AdminCollaboration() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('chat');

    const myName = user?.name || user?.username || 'Admin';
    const myDistrict = user?.district || 'all';
    const myPhotoUrl = user?.photoUrl || user?.photo_url || '';

    return (
        <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <motion.div className="collab-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg, #821D30, #a52438)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiUsers size={20} color="white" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1a202c' }}>{t('collab.title')}</h2>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>{t('collab.subtitle')}</p>
                    </div>
                </div>
                {/* Tab Pills */}
                <div className="collab-tabs" style={{ display: 'flex', gap: 6, background: '#f1f5f9', borderRadius: 14, padding: 4 }}>
                    {[
                        { key: 'chat', label: t('collab.chatTab'), icon: <FiMessageCircle size={15} /> },
                        { key: 'meeting', label: t('collab.meetingTab'), icon: <FiVideo size={15} /> },
                        { key: 'docs', label: t('collab.docsTab'), icon: <FiFileText size={15} /> },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                                borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem',
                                background: activeTab === tab.key ? 'white' : 'transparent',
                                color: activeTab === tab.key ? '#821D30' : '#64748b',
                                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.2s'
                            }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'chat' && (
                        <motion.div key="chat" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
                            <ChatPanel myName={myName} myDistrict={myDistrict} myPhotoUrl={myPhotoUrl} />
                        </motion.div>
                    )}
                    {activeTab === 'meeting' && (
                        <motion.div key="meeting" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
                            <MeetingPanel myName={myName} myDistrict={myDistrict} myPhotoUrl={myPhotoUrl} />
                        </motion.div>
                    )}
                    {activeTab === 'docs' && (
                        <motion.div key="docs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
                            <DocsPanel myName={myName} myDistrict={myDistrict} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

/* ─────────────── CHAT PANEL ─────────────── */
const EMOJIS = [
    '😊', '😂', '🙏', '👍', '❤️', '🎉', '✅', '🔥', '📢', '💡',
    '📌', '⚠️', '🤝', '💬', '📊', '📋', '🏛️', '🗂️', '📝', '🕐',
    '👏', '😅', '🙌', '💪', '🧾', '💰', '📈', '🗓️', '📞', '📧'
];

const CHAT_BUCKET = 'complaints-docs';
const CHAT_FILES_PATH = 'admin-chat-files';

function ChatPanel({ myName, myDistrict, myPhotoUrl }) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showEmoji, setShowEmoji] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [chatRoom, setChatRoom] = useState('group'); // 'group' or other admin's name
    const channelRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const imageInputRef = useRef(null);
    const docInputRef = useRef(null);
    const emojiRef = useRef(null);

    // Close emoji popup on outside click
    useEffect(() => {
        const handler = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const uniqueKey = `${myName}-${Math.random().toString(36).substring(2, 9)}`;
        const channel = supabase.channel('admin-group-chat', {
            config: { presence: { key: uniqueKey } }
        });
        channelRef.current = channel;
        channel
            .on('broadcast', { event: 'message' }, ({ payload }) => {
                setMessages(prev => [...prev, payload]);
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users = Object.values(state).flat().map(u => ({ name: u.name, district: u.district, photoUrl: u.photoUrl }));
                // Remove duplicates by name just in case an admin has multiple tabs open
                const uniqueUsers = Array.from(new Map(users.map(u => [u.name, u])).values());
                setOnlineUsers(uniqueUsers);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ name: myName, district: myDistrict, photoUrl: myPhotoUrl, joinedAt: Date.now() });
                }
            });
        return () => {
            channel.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [myName, myDistrict]);

    // Scroll to bottom when room changes or new msg arrives
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, chatRoom]);

    const broadcast = useCallback(async (msg) => {
        if (!channelRef.current) return;
        await channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg });
        setMessages(prev => [...prev, { ...msg, isMine: true }]);
    }, []);

    const sendMessage = useCallback(async () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const msg = {
            id: Date.now(), sender: myName, district: myDistrict, photoUrl: myPhotoUrl,
            receiver: chatRoom === 'group' ? null : chatRoom,
            text: trimmed, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            type: 'text'
        };
        await broadcast(msg);
        setText('');
        inputRef.current?.focus();
    }, [text, myName, myDistrict, myPhotoUrl, chatRoom, broadcast]);

    const uploadAndSend = async (file, type) => {
        if (!file) return;
        setUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const safeName = `${Date.now()}-${myName}-${file.name}`;
            const { error } = await supabase.storage.from(CHAT_BUCKET).upload(`${CHAT_FILES_PATH}/${safeName}`, file);
            if (error) throw error;
            const { data } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(`${CHAT_FILES_PATH}/${safeName}`);
            const msg = {
                id: Date.now(), sender: myName, district: myDistrict, photoUrl: myPhotoUrl,
                receiver: chatRoom === 'group' ? null : chatRoom,
                text: file.name, url: data.publicUrl,
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                type // 'image' or 'file'
            };
            await broadcast(msg);
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

    const iconBtn = (onClick, title, children, active = false) => (
        <button onClick={onClick} title={title}
            style={{
                width: 36, height: 36, borderRadius: 10, border: 'none', background: active ? '#fef2f2' : 'transparent',
                color: active ? '#821D30' : '#94a3b8', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#821D30'; }}
            onMouseLeave={e => { e.currentTarget.style.background = active ? '#fef2f2' : 'transparent'; e.currentTarget.style.color = active ? '#821D30' : '#94a3b8'; }}>
            {children}
        </button>
    );

    const filteredMsgs = messages.filter(m =>
        chatRoom === 'group'
            ? !m.receiver
            : (m.district?.toLowerCase() === myDistrict?.toLowerCase() && m.receiver === chatRoom) || (m.district?.toLowerCase() === chatRoom && m.receiver === myDistrict?.toLowerCase())
    );

    return (
        <div className="collab-chat-layout" style={{ display: 'flex', height: '100%', gap: 16 }}>
            {/* Sidebar — Select Chat */}
            <div className="collab-sidebar" style={{ width: 230, background: 'white', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {t('collab.selectRoomTitle')}
                    </p>
                    <select
                        value={chatRoom}
                        onChange={(e) => setChatRoom(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0',
                            fontSize: '0.85rem', fontWeight: 600, color: '#1a202c', outline: 'none', background: '#f8fafc',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="group">🏢 {t('collab.teamGroupOption')}</option>
                        <optgroup label={t('collab.dmOnlineLabel')}>
                            {onlineUsers.filter(u => u.name !== myName).length > 0
                                ? onlineUsers.filter(u => u.name !== myName).map(u => (
                                    <option key={u.district} value={u.district.toLowerCase()}>🟢 {u.name} ({u.district})</option>
                                ))
                                : <option disabled>{t('collab.noAdminsOnline')}</option>
                            }
                        </optgroup>
                        <optgroup label={t('collab.dmOfflineLabel')}>
                            {Object.keys(DISTRICT_COLORS).filter(d => d !== 'all' && d !== myDistrict?.toLowerCase() && !onlineUsers.some(ou => ou.district?.toLowerCase() === d)).map(d => (
                                <option key={d} value={d}>⚪ {d.charAt(0).toUpperCase() + d.slice(1)} {t('collab.adminSuffix')}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ margin: '4px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('collab.whoOnline')} ({onlineUsers.length})</span>
                    </div>

                    {onlineUsers.map((u, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                            <div style={{ position: 'relative' }}>
                                <Avatar name={u.name} district={u.district} size={30} photoUrl={u.photoUrl} />
                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8', textTransform: 'capitalize' }}>{u.district}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="collab-chat-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                {/* Chat Header */}
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />
                    <span style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.92rem', textTransform: 'capitalize' }}>
                        {chatRoom === 'group' ? t('collab.teamGroupTitle') : `${t('collab.chatWith')} ${chatRoom} ${t('collab.adminSuffix')}`}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#94a3b8' }}>
                        {chatRoom === 'group' ? `${onlineUsers.length} ${t('collab.onlineLabel')}` : (onlineUsers.some(u => u.district?.toLowerCase() === chatRoom) ? t('collab.onlineDirect') : t('collab.offlineDirect'))}
                    </span>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredMsgs.length === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, color: '#cbd5e1' }}>
                            <FiMessageCircle size={44} strokeWidth={1} />
                            <p style={{ fontSize: '0.88rem', margin: 0 }}>
                                {chatRoom === 'group' ? t('collab.emptyGroup') : `${t('collab.startPrivate')} ${chatRoom.charAt(0).toUpperCase() + chatRoom.slice(1)} ${t('collab.adminSuffix')}! 👋`}
                            </p>
                        </div>
                    )}
                    {filteredMsgs.map(msg => {
                        const isMine = msg.isMine || msg.sender === myName;
                        return (
                            <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isMine ? 'row-reverse' : 'row' }}>
                                {!isMine && <Avatar name={msg.sender} district={msg.district} size={32} photoUrl={msg.photoUrl} />}
                                <div style={{ maxWidth: '70%' }}>
                                    {!isMine && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: getColor(msg.district) }}>{msg.sender}</span>
                                            <span style={{ fontSize: '0.62rem', color: '#cbd5e1', textTransform: 'capitalize' }}>• {msg.district}</span>
                                        </div>
                                    )}
                                    {/* Render different message types */}
                                    {msg.type === 'image' ? (
                                        <div style={{ borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                                            <img src={msg.url} alt={msg.text} style={{ maxWidth: 240, maxHeight: 200, display: 'block', objectFit: 'cover' }} />
                                        </div>
                                    ) : msg.type === 'file' ? (
                                        <a href={msg.url} target="_blank" rel="noreferrer" download={msg.text}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textDecoration: 'none',
                                                borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                background: isMine ? 'linear-gradient(135deg, #821D30, #a52438)' : '#f1f5f9',
                                                color: isMine ? 'white' : '#1a202c', boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                                            }}>
                                            <span style={{ fontSize: 24 }}>📎</span>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>{msg.text}</p>
                                                <p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.7 }}>Tap to download</p>
                                            </div>
                                        </a>
                                    ) : (
                                        <div style={{
                                            padding: '9px 13px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            background: isMine ? 'linear-gradient(135deg, #821D30, #a52438)' : '#f1f5f9',
                                            color: isMine ? 'white' : '#1a202c',
                                            fontSize: '0.87rem', lineHeight: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                                        }}>
                                            {msg.text}
                                        </div>
                                    )}
                                    <p style={{ margin: '3px 0 0', fontSize: '0.62rem', color: '#cbd5e1', textAlign: isMine ? 'right' : 'left' }}>{msg.time}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Input Bar */}
                <div style={{ borderTop: '1px solid #f1f5f9', background: 'white' }}>
                    {/* Toolbar row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '8px 12px 0', position: 'relative' }}>
                        {/* Emoji */}
                        <div ref={emojiRef} style={{ position: 'relative' }}>
                            {iconBtn(() => setShowEmoji(v => !v), 'Emoji', <span style={{ fontSize: 18 }}>😊</span>, showEmoji)}
                            <AnimatePresence>
                                {showEmoji && (
                                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        style={{
                                            position: 'absolute', bottom: '110%', left: 0, zIndex: 100,
                                            background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                                            border: '1px solid #f1f5f9', padding: 12, width: 280
                                        }}>
                                        <p style={{ margin: '0 0 8px', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Emojis</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
                                            {EMOJIS.map(em => (
                                                <button key={em} onClick={() => { setText(t => t + em); setShowEmoji(false); inputRef.current?.focus(); }}
                                                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', borderRadius: 6, padding: 2, lineHeight: 1 }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                                    {em}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Image / Camera */}
                        {iconBtn(() => imageInputRef.current?.click(), 'Send Image / Photo',
                            uploading ? <div style={{ width: 16, height: 16, border: '2px solid #e2e8f0', borderTopColor: '#821D30', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <span style={{ fontSize: 18 }}>📷</span>
                        )}
                        <input type="file" accept="image/*" ref={imageInputRef} style={{ display: 'none' }}
                            onChange={e => { uploadAndSend(e.target.files?.[0], 'image'); e.target.value = ''; }} />

                        {/* Document / File */}
                        {iconBtn(() => docInputRef.current?.click(), 'Share Document / File',
                            <span style={{ fontSize: 18 }}>📎</span>
                        )}
                        <input type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.ppt,.pptx,.zip,.rar,.txt" ref={docInputRef} style={{ display: 'none' }}
                            onChange={e => { uploadAndSend(e.target.files?.[0], 'file'); e.target.value = ''; }} />

                        {uploading && <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 6 }}>Uploading…</span>}
                    </div>

                    {/* Text + Send */}
                    <div style={{ display: 'flex', gap: 8, padding: '6px 12px 12px', alignItems: 'flex-end' }}>
                        <textarea
                            ref={inputRef}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder={t('collab.inputPlaceholder')}
                            rows={1}
                            style={{
                                flex: 1, padding: '10px 14px', borderRadius: 14, border: '1.5px solid #e2e8f0',
                                outline: 'none', resize: 'none', fontSize: '0.87rem', fontFamily: 'inherit',
                                lineHeight: 1.5, background: '#f8fafc', color: '#1a202c',
                                transition: 'border-color 0.2s', maxHeight: 100
                            }}
                            onFocus={e => e.target.style.borderColor = '#821D30'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                        <button onClick={sendMessage} disabled={!text.trim()}
                            style={{
                                width: 42, height: 42, borderRadius: 13, border: 'none',
                                background: text.trim() ? 'linear-gradient(135deg, #821D30, #a52438)' : '#f1f5f9',
                                color: text.trim() ? 'white' : '#cbd5e1',
                                cursor: text.trim() ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s', flexShrink: 0
                            }}>
                            <FiSend size={17} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


/* ─────────────── MEETING PANEL ─────────────── */
function MeetingPanel({ myName, myDistrict, myPhotoUrl }) {
    const { t } = useTranslation();
    const [joined, setJoined] = useState(false);
    const ROOM_NAME = 'etaxpay-uttarakhand-admin-hub';

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!joined ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ background: 'white', borderRadius: 24, padding: '48px 56px', textAlign: 'center', boxShadow: '0 4px 30px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', maxWidth: 480 }}>

                        {/* Video Icon */}
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <FiVideo size={36} color="#821D30" />
                        </div>

                        <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 700, color: '#1a202c' }}>{t('collab.meetTitle')}</h3>
                        <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            {t('collab.meetSubtitle')}
                        </p>

                        {/* Room Info */}
                        <div style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 20px', marginBottom: 28, textAlign: 'left' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('collab.roomLabel')}</p>
                            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#1a202c', fontFamily: 'monospace' }}>{ROOM_NAME}</p>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setJoined(true)}
                                style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #821D30, #a52438)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <FiVideo size={18} /> {t('collab.joinMeeting')}
                            </button>
                        </div>
                        <p style={{ margin: '16px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{t('collab.meetFooter')}</p>
                    </motion.div>
                </div>
            ) : (
                <div style={{ flex: 1, position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 30px rgba(0,0,0,0.12)' }}>
                    <iframe
                        src={`https://meet.jit.si/${ROOM_NAME}#userInfo.displayName="${encodeURIComponent(myName + ' (' + myDistrict + ')')}"${myPhotoUrl ? `&userInfo.avatarUrl="${encodeURIComponent(myPhotoUrl)}"` : ''}`}
                        allow="camera; microphone; display-capture; fullscreen; autoplay"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="Admin Meeting Room"
                    />
                    <button onClick={() => setJoined(false)}
                        style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
                        <FiX size={14} /> Leave Meeting
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─────────────── DOCS PANEL ─────────────── */
function DocsPanel({ myName, myDistrict }) {
    const { t } = useTranslation();
    const [docs, setDocs] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    const fetchDocs = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.storage.from(BUCKET).list(DOCS_PATH, { sortBy: { column: 'created_at', order: 'desc' } });
            if (error) throw error;
            setDocs(data || []);
        } catch (err) {
            console.error('Failed to list docs:', err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDocs(); }, [fetchDocs]);

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const safeName = `${Date.now()}-[${myName}]-${file.name}`;
            const { error } = await supabase.storage.from(BUCKET).upload(`${DOCS_PATH}/${safeName}`, file);
            if (error) throw error;
            await fetchDocs();
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const getPublicUrl = (name) => supabase.storage.from(BUCKET).getPublicUrl(`${DOCS_PATH}/${name}`).data.publicUrl;

    const handleDelete = async (name) => {
        if (!confirm(t('collab.confirmDelete'))) return;
        await supabase.storage.from(BUCKET).remove([`${DOCS_PATH}/${name}`]);
        await fetchDocs();
    };

    const formatSize = (bytes) => {
        if (!bytes) return '–';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (name) => {
        const ext = name.split('.').pop()?.toLowerCase();
        if (['pdf'].includes(ext)) return '📄';
        if (['xlsx', 'xls', 'csv'].includes(ext)) return '📊';
        if (['docx', 'doc'].includes(ext)) return '📝';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return '🖼️';
        if (['zip', 'rar'].includes(ext)) return '🗜️';
        return '📎';
    };

    const parseFileName = (raw) => {
        const parts = raw.replace(/^\d+-/, '').replace(/^\[([^\]]+)\]-/, '');
        const match = raw.match(/^\d+-\[([^\]]+)\]-(.+)$/);
        return { uploader: match?.[1] || t('collab.adminSuffix'), cleanName: match?.[2] || raw };
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#1a202c', fontSize: '0.95rem' }}>{t('collab.docsTitle')}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{t('collab.docsSubtitle')}</p>
                </div>
                <div>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleUpload} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                            borderRadius: 12, border: 'none', cursor: uploading ? 'wait' : 'pointer',
                            background: 'linear-gradient(135deg, #821D30, #a52438)', color: 'white',
                            fontWeight: 600, fontSize: '0.85rem', opacity: uploading ? 0.7 : 1,
                            transition: 'opacity 0.2s'
                        }}>
                        {uploading ? (
                            <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> {t('collab.uploading')}</>
                        ) : (
                            <><FiPaperclip size={15} /> {t('collab.uploadBtn')}</>
                        )}
                    </button>
                </div>
            </div>

            {/* File list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <div style={{ width: 32, height: 32, border: '3px solid #f1f5f9', borderTopColor: '#821D30', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                ) : docs.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#cbd5e1' }}>
                        <FiFileText size={48} strokeWidth={1} />
                        <p style={{ fontSize: '0.9rem', margin: 0 }}>{t('collab.noDocs')}</p>
                    </div>
                ) : docs.map(doc => {
                    const { uploader, cleanName } = parseFileName(doc.name);
                    const url = getPublicUrl(doc.name);
                    return (
                        <div key={doc.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 14, border: '1px solid #f1f5f9', background: '#fafafa', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fafafa'}>
                            <span style={{ fontSize: 28, flexShrink: 0 }}>{getFileIcon(cleanName)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#1a202c', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanName}</p>
                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>by {uploader} • {formatSize(doc.metadata?.size)}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                <a href={url} download={cleanName} target="_blank" rel="noreferrer"
                                    style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#3b82f6' }}>
                                    <FiDownload size={15} />
                                </a>
                                <button onClick={() => handleDelete(doc.name)}
                                    style={{ width: 34, height: 34, borderRadius: 10, background: '#fef2f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                    <FiTrash2 size={15} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
