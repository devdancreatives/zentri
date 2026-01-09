'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { User as UserIcon, Mail, Loader2, Check } from 'lucide-react'

const fetchGraphQL = async (token: string, query: string, variables?: any) => {
    const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: token,
        },
        body: JSON.stringify({ query, variables }),
    })
    return res.json()
}

export default function ProfilePage() {
    const { session } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [fullName, setFullName] = useState('')

    useEffect(() => {
        const fetchProfile = async () => {
            if (!session?.access_token) return

            const res = await fetchGraphQL(session.access_token, `
                query {
                    me {
                        id
                        email
                        fullName
                    }
                }
            `)

            const userData = res?.data?.me
            setUser(userData)
            setFullName(userData?.fullName || '')
            setLoading(false)
        }

        fetchProfile()
    }, [session])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session?.access_token) return

        setSaving(true)
        setSaved(false)

        try {
            const res = await fetchGraphQL(session.access_token, `
                mutation UpdateProfile($fullName: String) {
                    updateProfile(fullName: $fullName) {
                        id
                        fullName
                    }
                }
            `, { fullName })

            if (res.errors) throw new Error(res.errors[0].message)

            setUser({ ...user, fullName })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
                    <UserIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Profile</h1>
                    <p className="text-sm text-zinc-400">Manage your personal information</p>
                </div>
            </div>

            <div className="max-w-2xl">
                <form onSubmit={handleSave} className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Email Address
                        </label>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                            <Mail className="h-5 w-5 text-zinc-400" />
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="flex-1 bg-transparent text-white outline-none"
                            />
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Full Name
                        </label>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 focus-within:border-yellow-500 transition-all">
                            <UserIcon className="h-5 w-5 text-zinc-400" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="flex-1 bg-transparent text-white outline-none"
                                placeholder="Enter your full name"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={saving || fullName === user?.fullName}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-linear-to-r from-yellow-500 to-yellow-600 text-zinc-900 font-semibold hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/20"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>

                        {saved && (
                            <div className="flex items-center gap-2 text-green-500 animate-fade-in">
                                <Check className="h-4 w-4" />
                                <span className="text-sm">Saved successfully!</span>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
