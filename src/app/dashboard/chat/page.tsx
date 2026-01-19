'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_MY_CHATS, CREATE_CHAT, SEND_MESSAGE } from '@/graphql/queries'
import { Send, MessageSquare, User, Shield } from 'lucide-react'
import { format } from 'date-fns'

export default function ChatPage() {
    const { data, loading, refetch } = useQuery(GET_MY_CHATS, {
        pollInterval: 5000, // Real-time-ish updates
    })
    const [createChat] = useMutation(CREATE_CHAT)
    const [sendMessage] = useMutation(SEND_MESSAGE)

    const [input, setInput] = useState('')
    const [activeChatId, setActiveChatId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const chats = data?.myChats || []

    // Auto-select latest chat if exists
    useEffect(() => {
        if (!activeChatId && chats.length > 0) {
            setActiveChatId(chats[0].id)
        }
    }, [chats, activeChatId])

    const activeChat = chats.find((c: any) => c.id === activeChatId)
    const messages = activeChat?.messages || []

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        try {
            if (!activeChatId) {
                // Create new chat
                const { data } = await createChat({
                    variables: { initialMessage: input }
                })
                setActiveChatId(data.createChat.id)
            } else {
                // Send to existing
                await sendMessage({
                    variables: { chatId: activeChatId, content: input }
                })
            }
            setInput('')
            refetch()
        } catch (error) {
            console.error('Error sending message:', error)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (loading && !data) {
        return <div className="p-8 text-center text-zinc-400">Loading chat...</div>
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="border-b border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-white">Support Chat</h2>
                        <p className="text-xs text-zinc-400">
                            {activeChatId ? 'Ticket #' + activeChatId.slice(0, 8) : 'Start a new conversation'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !activeChatId ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p>No messages yet.</p>
                        <p className="text-sm">Send a message to start chatting with support.</p>
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isUser = msg.senderRole === 'user'
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                        {isUser ? <User size={14} /> : <Shield size={14} />}
                                    </div>
                                    <div
                                        className={`rounded-2xl px-4 py-2 ${isUser
                                                ? 'bg-yellow-500 text-black'
                                                : 'bg-zinc-800 text-zinc-200'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.content}</p>
                                        <span className={`mt-1 block text-[10px] ${isUser ? 'text-black/60' : 'text-zinc-500'}`}>
                                            {format(new Date(msg.createdAt), 'HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-zinc-800 bg-zinc-900 p-4">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message..."
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 focus:border-yellow-500/50 focus:outline-hidden focus:ring-1 focus:ring-yellow-500/50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="absolute right-2 p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
