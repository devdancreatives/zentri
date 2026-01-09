'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { FileText, ArrowUpRight, ArrowDownLeft, TrendingUp, Loader2 } from 'lucide-react'

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

const getTransactionIcon = (type: string) => {
    switch (type) {
        case 'deposit':
            return <ArrowDownLeft className="h-5 w-5 text-green-500" />
        case 'withdrawal':
            return <ArrowUpRight className="h-5 w-5 text-red-500" />
        case 'profit_payout':
            return <TrendingUp className="h-5 w-5 text-yellow-500" />
        case 'investment_start':
            return <TrendingUp className="h-5 w-5 text-blue-500" />
        default:
            return <FileText className="h-5 w-5 text-zinc-400" />
    }
}

const getTransactionColor = (type: string) => {
    switch (type) {
        case 'deposit':
            return 'text-green-500'
        case 'withdrawal':
            return 'text-red-500'
        case 'profit_payout':
            return 'text-yellow-500'
        case 'investment_start':
            return 'text-blue-500'
        default:
            return 'text-zinc-400'
    }
}

export default function TransactionsPage() {
    const { session } = useAuth()
    const [loading, setLoading] = useState(true)
    const [transactions, setTransactions] = useState<any[]>([])

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!session?.access_token) return

            const res = await fetchGraphQL(session.access_token, `
                query {
                    myTransactions(limit: 50) {
                        id
                        type
                        amount
                        description
                        createdAt
                    }
                }
            `)

            setTransactions(res?.data?.myTransactions || [])
            setLoading(false)
        }

        fetchTransactions()
    }, [session])

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
                    <FileText className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Transactions</h1>
                    <p className="text-sm text-zinc-400">View your transaction history</p>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 backdrop-blur-sm overflow-hidden">
                {transactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400">No transactions yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {transactions.map((tx) => (
                            <div
                                key={tx.id}
                                className="p-4 hover:bg-zinc-800/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-zinc-800/50 group-hover:bg-zinc-800 transition-all">
                                            {getTransactionIcon(tx.type)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white capitalize">
                                                {tx.type.replace('_', ' ')}
                                            </p>
                                            <p className="text-sm text-zinc-400">
                                                {tx.description || 'No description'}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-semibold ${getTransactionColor(tx.type)}`}>
                                            {tx.type === 'withdrawal' || tx.type === 'investment_start' ? '-' : '+'}
                                            ${tx.amount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-zinc-500">USDT</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
