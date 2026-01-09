'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Wallet, TrendingUp, History, Settings, LogOut, User, FileText, Shield, Menu, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useAuth } from '@/lib/auth-context'

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
}

const baseNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Invest', href: '/dashboard/invest', icon: TrendingUp },
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Deposits', href: '/dashboard/deposits', icon: TrendingUp },
    { name: 'Transactions', href: '/dashboard/transactions', icon: FileText },
    { name: 'Investments', href: '/dashboard/investments', icon: History },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { session } = useAuth()
    const [userRole, setUserRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const fetchUserRole = async () => {
            if (!session?.access_token) return

            const res = await fetch('/api/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    query: `query { me { role } }`
                }),
            })

            const data = await res.json()
            setUserRole(data?.data?.me?.role || 'user')
            setLoading(false)
        }

        fetchUserRole()
    }, [session])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const navItems = userRole === 'admin'
        ? [...baseNavItems, { name: 'Admin', href: '/dashboard/admin', icon: Shield }]
        : baseNavItems

    const SidebarContent = () => (
        <>
            <div>
                <div className="mb-8 flex items-center gap-2 px-2">
                    <div className="h-8 w-8 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/50" />
                    <span className="text-lg font-bold bg-linear-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Zentrivest</span>
                </div>
                <nav className="flex flex-col gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-linear-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-500 shadow-lg shadow-yellow-500/10'
                                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white hover:translate-x-1'
                                )}
                            >
                                <Icon size={20} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div>
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-colors"
                aria-label="Toggle menu"
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed lg:static inset-y-0 left-0 z-40 flex h-screen w-64 flex-col justify-between border-r border-zinc-800 bg-zinc-950 p-4 text-white transition-transform duration-300",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <SidebarContent />
            </div>
        </>
    )
}
