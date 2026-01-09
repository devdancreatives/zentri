'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export function PublicNavbar() {
    const { user } = useAuth()

    return (
        <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="mx-auto flex max-w-7xl items-center justify-between p-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-yellow-500" />
                    <span className="text-lg font-bold text-white">Zentrivest</span>
                </Link>
                <div className="flex items-center gap-6">
                    <Link href="/about" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        About
                    </Link>
                    <Link href="/terms" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Terms
                    </Link>
                    <Link href="/privacy" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Privacy
                    </Link>
                    {user ? (
                        <Link
                            href="/dashboard"
                            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-yellow-400 transition-colors"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}
