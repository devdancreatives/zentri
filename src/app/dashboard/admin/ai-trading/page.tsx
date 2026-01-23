'use client'

import React from 'react'
import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { Loader2, ShieldCheck, ShieldAlert, TrendingUp, DollarSign, Users } from 'lucide-react'

const GET_ADMIN_STATS = gql`
  query GetAdminAiStats {
    adminAiStats {
      totalRevenue
      totalPayouts
      netHouseProfit
      safetyStatus
    }
    adminInvestmentStats {
      totalActiveCapital
      totalProjectedPayout
      activeCount
    }
  }
`

export default function AdminAiTradingPage() {
    const { data, loading, error } = useQuery(GET_ADMIN_STATS, {
        pollInterval: 5000 // Real-time updates
    })

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-yellow-500 w-8 h-8" /></div>
    if (error) return <div className="text-red-500 p-4">Error: {error.message}</div>

    const { adminAiStats, adminInvestmentStats } = data

    return (
        <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Admin Finance Dashboard</h1>
                <p className="text-slate-400">Monitor AI Trading Profits and Investment Liabilities</p>
            </header>

            {/* AI Trading Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="text-yellow-500 w-6 h-6" />
                    <h2 className="text-xl font-bold text-white">AI Trading (High Frequency)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Net Profit Card */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign className="w-16 h-16 text-green-500" />
                        </div>
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-1">Net House Profit</div>
                        <div className={`text-3xl font-mono font-bold ${adminAiStats.netHouseProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${adminAiStats.netHouseProfit.toFixed(2)}
                        </div>
                        <div className="text-xs text-zinc-600 mt-2">Total Revenue - Payouts</div>
                    </div>

                    {/* Revenue Card */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Staked (In)</div>
                        <div className="text-2xl font-mono text-white">
                            ${adminAiStats.totalRevenue.toFixed(2)}
                        </div>
                    </div>

                    {/* Payouts Card */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Paid Out (Out)</div>
                        <div className="text-2xl font-mono text-red-300">
                            ${adminAiStats.totalPayouts.toFixed(2)}
                        </div>
                    </div>

                    {/* Safety Status Card */}
                    <div className={`p-6 border rounded-xl flex flex-col justify-center items-center ${adminAiStats.safetyStatus === 'SAFE' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        {adminAiStats.safetyStatus === 'SAFE' ? (
                            <ShieldCheck className="w-10 h-10 text-green-500 mb-2" />
                        ) : (
                            <ShieldAlert className="w-10 h-10 text-red-500 mb-2 animate-pulse" />
                        )}
                        <div className={`text-lg font-bold tracking-widest ${adminAiStats.safetyStatus === 'SAFE' ? 'text-green-500' : 'text-red-500'}`}>
                            POOL {adminAiStats.safetyStatus}
                        </div>
                        <div className="text-[10px] text-zinc-500 text-center mt-1">
                            {adminAiStats.safetyStatus === 'SAFE' ? 'Losses cover potential payouts' : 'WARNING: Payouts exceed losses'}
                        </div>
                    </div>
                </div>
            </section>

            <div className="h-px bg-zinc-800 w-full" />

            {/* Investment Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <Users className="text-blue-500 w-6 h-6" />
                    <h2 className="text-xl font-bold text-white">Platform Investments (Long Term)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Active Capital */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Active Capital</div>
                        <div className="text-3xl font-mono text-blue-400">
                            ${adminInvestmentStats.totalActiveCapital.toFixed(2)}
                        </div>
                        <div className="text-xs text-zinc-600 mt-2">From {adminInvestmentStats.activeCount} active investments</div>
                    </div>

                    {/* Projected Payout */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-1">Projected Obligations</div>
                        <div className="text-3xl font-mono text-white">
                            ${adminInvestmentStats.totalProjectedPayout.toFixed(2)}
                        </div>
                        <div className="text-xs text-zinc-600 mt-2">Principal repayable (excluding profit)</div>
                    </div>

                    {/* Info Card */}
                    <div className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex items-center">
                        <p className="text-sm text-zinc-400">
                            <strong>Note:</strong> Investment ROI is distributed manually via "Distribute Profit" workflow. The projected obligation above currently tracks the principal capital that must be returned.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
