'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'

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

export default function InvestPage() {
    const { session } = useAuth()
    const [amount, setAmount] = useState('')
    const [duration, setDuration] = useState('1')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const handleInvest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session) return
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const res = await fetchGraphQL(session.access_token, `
        mutation CreateInvestment($amount: Float!, $duration: Int!) {
          createInvestment(amount: $amount, durationMonths: $duration) {
            id
            amount
            status
            endDate
          }
        }
      `, {
                amount: parseFloat(amount),
                duration: parseInt(duration)
            })

            if (res.errors) throw new Error(res.errors[0].message)
            setSuccess('Investment created successfully!')
            setAmount('')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-white">New Investment</h1>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl">
                <form onSubmit={handleInvest} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400">
                            Investment Amount (USDT)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            min="10"
                            className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            placeholder="1000.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400">
                            Duration (Months)
                        </label>
                        <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
                            {[1, 2, 3, 4, 5, 6].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setDuration(m.toString())}
                                    className={`flex flex-col items-center justify-center rounded-lg border px-2 py-3 text-sm font-medium transition-colors ${duration === m.toString()
                                            ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500'
                                            : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                        }`}
                                >
                                    <span className="text-lg">{m}</span>
                                    <span className="text-xs">Month{m > 1 ? 's' : ''}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="text-sm text-green-500 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-zinc-900 hover:bg-yellow-400 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Confirm Investment'}
                    </button>
                </form>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-400">
                <p>
                    Funds will be locked for the selected duration. ROI is distributed weekly based on trading performance.
                </p>
            </div>
        </div>
    )
}
