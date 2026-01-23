'use client'

import React, { useState } from 'react'
import { ArrowUp, ArrowDown, XCircle } from 'lucide-react'

interface TradeControlsProps {
    balance: number
    isTrading: boolean
    currentProfit: number
    stake: number
    sessionTimeLeft: number
    onStartTrade: (amount: number, direction: 'UP' | 'DOWN') => void
    onCloseTrade: () => void
    canCloseEarly: boolean
}

export function TradeControls({
    balance,
    isTrading,
    currentProfit,
    stake,
    sessionTimeLeft,
    onStartTrade,
    onCloseTrade,
    canCloseEarly
}: TradeControlsProps) {
    const [amount, setAmount] = useState('50') // Default $50
    const [error, setError] = useState<string | null>(null)

    const canEnter = !isTrading && sessionTimeLeft <= 30 && sessionTimeLeft > 0

    const handleTrade = (direction: 'UP' | 'DOWN') => {
        const val = parseFloat(amount)
        if (isNaN(val) || val <= 0) {
            setError('Invalid amount')
            return
        }
        if (val > balance) {
            setError('Insufficient balance')
            return
        }
        setError(null)
        onStartTrade(val, direction)
    }

    // Calculate Multiplier e.g. 1.5x
    const multiplier = stake > 0 ? ((stake + currentProfit) / stake).toFixed(2) : '1.00'

    return (
        <div className="p-4 bg-zinc-950/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-xl shadow-black/20 text-white flex flex-col gap-4 h-full relative overflow-hidden">
            <div className="flex justify-between items-center relative z-10">
                <span className="text-zinc-400 text-sm font-medium">Available Balance</span>
                <span className="font-mono text-xl text-yellow-500 font-bold">${balance.toFixed(2)}</span>
            </div>

            {!isTrading ? (
                <div className="flex flex-col gap-2 relative z-10">
                    <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Stake Amount (USDT)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 pl-7 text-lg font-mono text-white focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 outline-none w-full transition-all"
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-2 items-center py-6 bg-zinc-900/30 rounded-xl border border-zinc-800/50 relative z-10">
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">Current Return</span>
                    <div className={`text-5xl font-black font-mono tracking-tighter ${parseFloat(multiplier) >= 1 ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]' : 'text-red-400'}`}>
                        {multiplier}x
                    </div>
                    <span className={`text-sm font-mono ${currentProfit >= 0 ? 'text-zinc-400' : 'text-red-400/70'}`}>
                        {currentProfit >= 0 ? '+' : ''}{currentProfit.toFixed(2)} USDT
                    </span>
                </div>
            )}

            {error && (
                <div className="text-red-500 text-xs bg-red-500/10 p-2 rounded border border-red-500/20 relative z-10">{error}</div>
            )}

            {!isTrading ? (
                <div className="grid grid-cols-2 gap-3 mt-2 relative z-10">
                    <button
                        onClick={() => handleTrade('UP')}
                        disabled={!canEnter}
                        className="group bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/50 h-24 rounded-2xl flex flex-col items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                        <ArrowUp className="w-8 h-8 mb-2 text-green-400 group-hover:scale-110 transition-transform" />
                        <span className="text-green-400 font-bold tracking-widest text-lg">CALL</span>
                    </button>
                    <button
                        onClick={() => handleTrade('DOWN')}
                        disabled={!canEnter}
                        className="group bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/50 h-24 rounded-2xl flex flex-col items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                        <ArrowDown className="w-8 h-8 mb-2 text-red-400 group-hover:scale-110 transition-transform" />
                        <span className="text-red-400 font-bold tracking-widest text-lg">PUT</span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4 relative z-10">
                    <div className="h-16 flex items-center justify-center gap-3 text-zinc-400 bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed animate-pulse">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                        </span>
                        <span className="font-mono tracking-widest text-sm">RESOLVING IN 00:{sessionTimeLeft.toString().padStart(2, '0')}</span>
                    </div>

                    <button
                        onClick={onCloseTrade}
                        disabled={!canCloseEarly}
                        className={`w-full h-14 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${canCloseEarly ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20 scale-100' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed scale-95 opacity-50'}`}
                    >
                        {canCloseEarly ? (
                            <>
                                <XCircle className="w-5 h-5" />
                                TAKE PROFIT NOW
                            </>
                        ) : (
                            <span className="text-xs tracking-widest uppercase text-center">Early Close &gt; 1.5x</span>
                        )}
                    </button>
                </div>
            )}

            {!isTrading && (
                <div className="text-center mt-auto p-4 bg-black/40 rounded-xl border border-white/5 relative z-10">
                    <div className="text-[10px] text-zinc-500 mb-1 font-bold tracking-widest uppercase">Next Round In</div>
                    <div className={`text-2xl font-mono font-bold ${sessionTimeLeft > 30 ? 'text-zinc-600' : 'text-blue-400'}`}>
                        00:{sessionTimeLeft.toString().padStart(2, '0')}
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">
                        {sessionTimeLeft > 30 ? 'Market Locked' : 'Market Open'}
                    </div>
                </div>
            )}
        </div>
    )
}
