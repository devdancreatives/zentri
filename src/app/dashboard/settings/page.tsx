'use client'

import { useState } from 'react'
import { Settings as SettingsIcon, Bell, Shield, Palette } from 'lucide-react'

export default function SettingsPage() {
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        weekly: true,
    })

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
                    <SettingsIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                    <p className="text-sm text-zinc-400">Manage your account preferences</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Notifications */}
                <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="h-5 w-5 text-yellow-500" />
                        <h2 className="text-lg font-semibold text-white">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/50 transition-all">
                            <div>
                                <p className="font-medium text-white">Email Notifications</p>
                                <p className="text-sm text-zinc-400">Receive updates via email</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                                className={`relative w-12 h-6 rounded-full transition-all ${notifications.email ? 'bg-yellow-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.email ? 'translate-x-6' : ''
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/50 transition-all">
                            <div>
                                <p className="font-medium text-white">Push Notifications</p>
                                <p className="text-sm text-zinc-400">Receive push notifications</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, push: !notifications.push })}
                                className={`relative w-12 h-6 rounded-full transition-all ${notifications.push ? 'bg-yellow-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.push ? 'translate-x-6' : ''
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/50 transition-all">
                            <div>
                                <p className="font-medium text-white">Weekly Reports</p>
                                <p className="text-sm text-zinc-400">Receive weekly performance reports</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, weekly: !notifications.weekly })}
                                className={`relative w-12 h-6 rounded-full transition-all ${notifications.weekly ? 'bg-yellow-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications.weekly ? 'translate-x-6' : ''
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="h-5 w-5 text-yellow-500" />
                        <h2 className="text-lg font-semibold text-white">Security</h2>
                    </div>

                    <div className="space-y-3">
                        <button className="w-full text-left p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-yellow-500/50 hover:bg-zinc-800/50 transition-all text-white">
                            Change Password
                        </button>
                        <button className="w-full text-left p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-yellow-500/50 hover:bg-zinc-800/50 transition-all text-white">
                            Two-Factor Authentication
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
