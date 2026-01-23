import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";

const BSCSCAN_API_URL = "https://api.etherscan.io/v2/api";
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955"; // BSC-USD
const MIN_CONFIRMATIONS = 15;

// Interface for BscScan transaction
export interface BscScanTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
  confirmations: string;
}

interface ProcessedTransaction {
  txHash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  confirmations: number;
}

/**
 * Fetch recent BEP20 transactions for a wallet address from BscScan
 */
export async function getWalletTransactions(
  address: string,
  limit: number = 20,
): Promise<BscScanTransaction[]> {
  try {
    // Note: In production, you should use an API key for higher rate limits
    // &apikey=YourApiKeyToken
    const apiKeyParam = process.env.BSCSCAN_API_KEY
      ? `&apikey=${process.env.BSCSCAN_API_KEY}`
      : "";
    const url = `${BSCSCAN_API_URL}?chainid=56&module=account&action=tokentx&address=${address}&page=1&offset=${limit}&sort=desc${apiKeyParam}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`BscScan API error: ${response.statusText}`);
    }

    const data = await response.json();

    // BscScan returns status "1" for success
    if (data.status !== "1" && data.message !== "No transactions found") {
      // specific handling for "No transactions found" which might come with status 0
      if (data.message === "No transactions found") return [];
      console.warn("BscScan message:", data.message);
      return [];
    }

    return data.result || [];
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return [];
  }
}

/**
 * Get transaction confirmations (BSC specific)
 * BscScan includes confirmations in the transaction list endpoint,
 * but for specific tx logic we might just query the tx status or trusted RPC.
 * This function mimics the previous interface.
 */
export async function getTransactionConfirmations(
  txHash: string,
): Promise<number> {
  try {
    // We can use ethers to get standard provider confirmations
    // or query BscScan again. Cost-effective way is RPC.
    // Using public RPC for BSC
    const provider = new ethers.JsonRpcProvider(
      "https://bsc-dataseed.binance.org/",
    );
    const tx = await provider.getTransaction(txHash);
    const currentBlock = await provider.getBlockNumber();

    if (tx && tx.blockNumber) {
      return currentBlock - tx.blockNumber;
    }
    return 0;
  } catch (error) {
    console.error("Error getting confirmations:", error);
    // Fallback to BscScan logic if RPC fails?
    // For now return 0 to be safe.
    return 0;
  }
}

/**
 * Verify if transaction is valid USDT deposit
 */
export function verifyUSDTTransaction(
  tx: BscScanTransaction,
  expectedAddress: string,
): boolean {
  // Check if it's USDT contract
  if (tx.contractAddress.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
    return false;
  }

  // Check if destination matches (case insensitive for EVM)
  if (tx.to.toLowerCase() !== expectedAddress.toLowerCase()) {
    return false;
  }

  // Check if amount is positive
  const decimals = parseInt(tx.tokenDecimal);
  const amount = parseFloat(tx.value) / Math.pow(10, decimals);

  if (amount <= 0) {
    return false;
  }

  return true;
}

/**
 * Convert BscScanTransaction to ProcessedTransaction
 */
export function parseTransaction(tx: BscScanTransaction): ProcessedTransaction {
  const decimals = parseInt(tx.tokenDecimal);
  const amount = parseFloat(tx.value) / Math.pow(10, decimals);

  return {
    txHash: tx.hash,
    from: tx.from,
    to: tx.to,
    amount,
    timestamp: parseInt(tx.timeStamp) * 1000, // timestamp is usually in seconds
    confirmations: parseInt(tx.confirmations),
  };
}

/**
 * Check if transaction already exists in database
 */
export async function transactionExists(txHash: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data } = await supabase
    .from("deposits")
    .select("id")
    .eq("tx_hash", txHash)
    .single();

  return !!data;
}

/**
 * Get minimum required confirmations
 */
export function getMinConfirmations(): number {
  return parseInt(process.env.BSC_MIN_CONFIRMATIONS || "15");
}
