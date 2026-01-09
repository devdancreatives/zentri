'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'
import { GET_ME, ADMIN_DISTRIBUTE_PROFIT } from '@/graphql/queries'

export default function AdminPage() {
    const router = useRouter()
    const [distributeAmount, setDistributeAmount] = useState('')
    const [result, setResult] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const { data, loading: checkingRole, error: roleError } = useQuery<any>(GET_ME)

    useEffect(() => {
        if (!checkingRole) {
            if (roleError || data?.me?.role !== "admin") {
                router.push("/dashboard")
            }
        }
    }, [data, checkingRole, roleError, router])

    const [distributeProfit, { loading }] = useMutation<any>(ADMIN_DISTRIBUTE_PROFIT, {
        onCompleted: (data: any) => {
            setResult(data.adminDistributeProfit)
            setDistributeAmount('')
            setError(null)
        },
        onError: (err) => {
            setError(err.message)
            setResult(null)
        }
    })

    const handleDistribute = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setResult(null)

        try {
            await distributeProfit({
                variables: {
                    amount: parseFloat(distributeAmount)
                }
            })
        } catch (err: any) {
            // Error handled by onError callback
        }
    }

    if (checkingRole) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        )
    }

    const isAdmin = data?.me?.role === 'admin'
    if (!isAdmin) return null

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
                    <Shield className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin Controls</h1>
                    <p className="text-sm text-zinc-400">Manage platform operations and distributions</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white mb-4">Distribute Weekly Profit</h2>
                    <form onSubmit={handleDistribute} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400">
                                Total Profit to Distribute (USDT)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                className="mt-2 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all"
                                placeholder="5000.00"
                                value={distributeAmount}
                                onChange={(e) => setDistributeAmount(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                {error}
                            </div>
                        )}

                        {result && (
                            <div className="text-sm text-green-500 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                                {result}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2 font-semibold text-zinc-900 hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 transition-all shadow-lg shadow-yellow-500/20"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Distribute Profit'}
                        </button>
                    </form>
                </div>

                {/* Add more admin controls here */}
            </div>
        </div>
    )
}
