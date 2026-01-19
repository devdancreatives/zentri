'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { GET_ADMIN_USERS, ADMIN_UPDATE_USER } from '@/graphql/queries'
import { Edit2, X, Save, Check } from 'lucide-react'

export default function AdminUsersPage() {
    const { data, loading, refetch } = useQuery<any>(GET_ADMIN_USERS)
    const [updateUser] = useMutation(ADMIN_UPDATE_USER)

    const [editingUser, setEditingUser] = useState<any>(null)
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: '',
        balance: ''
    })
    const [isSaving, setIsSaving] = useState(false)

    const handleEdit = (user: any) => {
        setEditingUser(user)
        setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            role: user.role || 'user',
            balance: user.balance?.toString() || '0'
        })
    }

    const handleSave = async () => {
        if (!editingUser) return

        setIsSaving(true)
        try {
            await updateUser({
                variables: {
                    id: editingUser.id,
                    input: {
                        fullName: formData.fullName,
                        email: formData.email,
                        role: formData.role,
                        balance: parseFloat(formData.balance)
                    }
                }
            })
            await refetch()
            setEditingUser(null)
        } catch (e) {
            console.error(e)
            alert('Failed to update user')
        } finally {
            setIsSaving(false)
        }
    }

    if (loading && !data) return <div className="p-8 text-zinc-400">Loading users...</div>

    const users = data?.adminUsers || []

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">User Management</h1>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-400 uppercase bg-zinc-900">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u: any) => (
                                <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                                    <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                                        {u.id.slice(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4 text-white font-medium">
                                        {u.fullName}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400">
                                        {u.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-500' : 'bg-zinc-800 text-zinc-400'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-white font-mono">
                                        ${u.balance?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 text-xs">
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(u)}
                                            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                            title="Edit User"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                            <h2 className="text-lg font-bold text-white">Edit User</h2>
                            <button onClick={() => setEditingUser(null)} className="text-zinc-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-hidden focus:border-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-hidden focus:border-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-hidden focus:border-yellow-500"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Balance</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.balance}
                                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white focus:outline-hidden focus:border-yellow-500"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 rounded text-zinc-400 hover:text-white text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
