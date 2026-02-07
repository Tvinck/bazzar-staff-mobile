import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Hash, Menu, MoreVertical, Send, Smile, Image as ImageIcon, Reply, Plus, Search, User, Gift, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const TeamChat = () => {
    const navigate = useNavigate();
    const [activeChannelId, setActiveChannelId] = useState(null);
    const [channels, setChannels] = useState([]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // Fetch Channels
            const { data: channelData } = await supabase
                .from('chat_channels')
                .select('*')
                .order('name');

            if (channelData && channelData.length > 0) {
                setChannels(channelData);
                // Set default to 'general' or first
                const general = channelData.find(c => c.slug === 'general');
                setActiveChannelId(general ? general.id : channelData[0].id);
            }
        };
        init();
    }, []);

    // Fetch & Subscribe
    useEffect(() => {
        if (!activeChannelId) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*, profiles(full_name, avatar_url, email)') // Join profiles
                .eq('channel_id', activeChannelId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (data) {
                setMessages(data.map(m => {
                    const profile = m.profiles || {};
                    const name = profile.full_name || (profile.email ? profile.email.split('@')[0] : 'User');
                    const avatar = profile.avatar_url || (name[0] || 'U').toUpperCase();
                    return {
                        id: m.id,
                        content: m.content,
                        user: name,
                        role: 'Staff', // Mock role for now
                        avatar: avatar, // URL or Initials
                        isImage: avatar.length > 2, // Simple check if avatar is URL or Initials
                        color: 'text-zinc-300',
                        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        reactions: {}
                    };
                }));
            }
        };

        fetchMessages();

        const channel = supabase
            .channel(`room:${activeChannelId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${activeChannelId}` }, async (payload) => {
                const m = payload.new;
                // Fetch sender profile to show name immediately? 
                // Or just show "User" until refresh?
                // Better: fetch profile
                const { data: profileData } = await supabase.from('profiles').select('full_name, avatar_url, email').eq('id', m.user_id).single();

                const profile = profileData || {};
                const name = profile.full_name || (profile.email ? profile.email.split('@')[0] : 'User');
                const avatar = profile.avatar_url || (name[0] || 'U').toUpperCase();

                setMessages(prev => [...prev, {
                    id: m.id,
                    content: m.content,
                    user: name,
                    role: 'Staff',
                    avatar: avatar,
                    isImage: avatar.length > 2,
                    color: 'text-zinc-300',
                    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    reactions: {}
                }]);
                scrollToBottom();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeChannelId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!message.trim() || !currentUser || !activeChannelId) return;

        const content = message.trim();
        setMessage(''); // Clear input immediately

        // Optimistic update? Maybe risky if insert fails.
        // Let's rely on real-time subscription for now to keep code simple, 
        // OR optimistic update. 
        // User wants "Team Chat functionality". 
        // Subscription is fast enough usually.

        const { error } = await supabase.from('chat_messages').insert({
            channel_id: activeChannelId,
            user_id: currentUser.id,
            content: content,
            type: 'text'
        });

        if (error) {
            console.error('Send error:', error);
            // revert optimistic if implemented
            alert('Error sending message');
        }
    };

    // Render logic remains similar...
    return (
        <div className="min-h-screen bg-[#313338] flex flex-col fixed inset-0 z-50 overflow-hidden">
            {/* Header */}
            <div className="h-14 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center px-4 shrink-0 shadow-sm relative z-20">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="mr-4 text-zinc-400 hover:text-white md:hidden">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-zinc-400" />
                    <h1 className="font-bold text-white tracking-tight">{channels.find(c => c.id === activeChannelId)?.name}</h1>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <Search className="w-5 h-5 text-zinc-400" />
                    <User className="w-5 h-5 text-zinc-400" />
                    <button onClick={() => navigate('/services')} className="text-sm font-bold text-red-400 ml-2">
                        Закрыть
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar */}
                <div className={`absolute inset-y-0 left-0 w-64 bg-[#2b2d31] transform transition-transform duration-300 z-30 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 border-r border-[#1e1f22]`}>
                    <div className="p-4 bg-[#2b2d31]">
                        <button className="w-full bg-[#1e1f22] text-left px-3 py-2 rounded text-sm text-zinc-400 mb-4 truncate text-ellipsis border border-zinc-700/50">
                            🔍 Найти канал...
                        </button>

                        <div className="space-y-1">
                            {channels.map(channel => (
                                <button
                                    key={channel.id}
                                    onClick={() => { setActiveChannelId(channel.id); setSidebarOpen(false); }}
                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg group transition-colors ${activeChannelId === channel.id ? 'bg-[#3f4147] text-white' : 'text-zinc-400 hover:bg-[#35373c] hover:text-zinc-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-1.5 font-medium">
                                        {channel.slug === 'announcements' ? (
                                            <Megaphone className="w-4 h-4 text-amber-400" />
                                        ) : (
                                            <Hash className="w-4 h-4 text-zinc-500" />
                                        )}
                                        <span>{channel.name}</span>
                                    </div>
                                    {channel.unread > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[1.25rem] text-center">
                                            {channel.unread}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* User Mini Profile */}
                    <div className="absolute bottom-0 left-0 w-full p-3 bg-[#232428] flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white relative">
                            {currentUser?.email?.[0]?.toUpperCase() || 'ME'}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#232428]"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{currentUser?.email?.split('@')[0] || 'Guest'}</div>
                            <div className="text-[10px] text-zinc-400 truncate">Online</div>
                        </div>
                    </div>
                </div>

                {isSidebarOpen && (
                    <div className="absolute inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>
                )}

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-[#313338] min-w-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 md:space-y-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-50">
                                <Hash className="w-16 h-16 mb-4" />
                                <p>Это начало канала #{channels.find(c => c.id === activeChannelId)?.name}</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const prevMsg = messages[idx - 1];
                                const isSameUser = prevMsg && prevMsg.user === msg.user;

                                return (
                                    <div key={msg.id || idx} className={`flex gap-3 group ${isSameUser ? 'mt-0.5' : 'mt-4'}`}>
                                        {!isSameUser ? (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm ${msg.avatar === 'ME' ? 'bg-indigo-600' : 'bg-zinc-600'
                                                }`}>
                                                {msg.avatar}
                                            </div>
                                        ) : (
                                            <div className="w-10 shrink-0 text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 text-right pt-1 select-none">
                                                {msg.time}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            {!isSameUser && (
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`font-medium ${msg.color} hover:underline cursor-pointer`}>
                                                        {msg.user}
                                                    </span>
                                                    <span className="text-xs text-zinc-500 ml-1">{msg.time}</span>
                                                </div>
                                            )}
                                            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-[#313338] shrink-0">
                        <div className="bg-[#383a40] rounded-lg flex items-center px-4 py-2.5 relative">
                            <button className="p-1.5 -ml-2 text-zinc-400 hover:text-zinc-200 rounded-full hover:bg-zinc-700/50 transition-colors">
                                <Plus className="w-5 h-5 rounded-full bg-zinc-400 text-[#383a40] p-0.5" />
                            </button>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={`Написать в #${channels.find(c => c.id === activeChannelId)?.name}`}
                                className="flex-1 bg-transparent border-none text-zinc-200 placeholder-zinc-500 focus:ring-0 px-3 text-sm"
                            />
                            {message.trim() && (
                                <button onClick={handleSendMessage} className="text-[#5865f2] hover:text-[#4752c4] transition-colors ml-1">
                                    <Send className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamChat;
