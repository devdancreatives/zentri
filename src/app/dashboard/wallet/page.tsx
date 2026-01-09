'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Wallet as WalletIcon, Copy, Check, Plus, Loader2, ExternalLink } from 'lucide-react'
import { GET_ME, CREATE_MY_WALLET } from '@/graphql/queries'

export default function WalletPage() {
    const [creating, setCreating] = useState(false)
    const [copied, setCopied] = useState(false)

    // Use Apollo hooks instead of fetch
    const { data, loading } = useQuery(GET_ME)
    const [createWallet] = useMutation(CREATE_MY_WALLET, {
        refetchQueries: [{ query: GET_ME }],
        onCompleted: () => {
            setCreating(false)
        },
        onError: (error) => {
            console.error('Error creating wallet:', error)
            setCreating(false)
        }
    })

    const wallet = data?.me?.wallet

    const handleCreateWallet = async () => {
        setCreating(true)
        try {
            await createWallet()
        } catch (error) {
            console.error('Failed to create wallet:', error)
            setCreating(false)
        }
    }

    const handleCopy = () => {
        if (wallet?.address) {
            navigator.clipboard.writeText(wallet.address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
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
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
                    <WalletIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">My Wallet</h1>
                    <p className="text-sm text-zinc-400">Manage your USDT deposits</p>
                </div>
            </div>

            {!wallet ? (
                <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-12 text-center backdrop-blur-sm">
                    <div className="max-w-md mx-auto">
                        <div className="p-4 rounded-full bg-zinc-800/50 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <WalletIcon className="h-10 w-10 text-zinc-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">No Wallet Yet</h2>
                        <p className="text-zinc-400 mb-6">
                            Create a wallet to start depositing USDT and making investments
                        </p>
                        <button
                            onClick={handleCreateWallet}
                            disabled={creating}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-linear-to-r from-yellow-500 to-yellow-600 text-black font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Creating Wallet...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-5 w-5" />
                                    Create Wallet
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm">
                        <h2 className="text-lg font-semibold text-white mb-4">Wallet Address</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">TRON (TRC20) Address</label>
                                <div className="flex flex-row items-stretch sm:items-center gap-2">
                                    <div className="flex-1 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 font-mono text-sm text-white overflow-hidden">
                                        {/* Full address on desktop, truncated on mobile */}
                                        <span className="hidden sm:inline break-all">{wallet.address}</span>
                                        <span className="sm:hidden">
                                            {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-yellow-500/50 hover:bg-zinc-800 transition-all"
                                        title="Copy address"
                                    >
                                        {copied ? (
                                            <Check className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Copy className="h-5 w-5 text-zinc-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-zinc-800/30 border border-zinc-700">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Network</p>
                                    <p className="text-sm font-semibold text-white">TRON (TRC20)</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Token Symbol</p>
                                    <p className="text-sm font-semibold text-white">USDT</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <span>Derivation Path Index:</span>
                                <span className="text-white font-mono">{wallet.pathIndex}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20 p-6 backdrop-blur-sm">
                        <h3 className="text-sm font-semibold text-blue-400 mb-2">⚠️ Important Information</h3>
                        <ul className="space-y-2 text-sm text-zinc-300">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong>Network:</strong> TRON (TRC20) only - DO NOT send tokens from other networks</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span><strong>Token:</strong> USDT (Tether) only - sending other tokens may result in loss</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>Deposits are automatically credited to your account after network confirmation</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>Minimum deposit: 10 USDT</span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-900/50 to-zinc-900/30 p-6 backdrop-blur-sm">
                        <h3 className="text-sm font-semibold text-white mb-4">View on Blockchain</h3>
                        <a
                            href={`https://tronscan.org/#/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View on TronScan
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}
