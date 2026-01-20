import { createClient } from "@supabase/supabase-js";
import {
  getWalletTransactions,
  getTransactionConfirmations,
  verifyUSDTTransaction,
  parseTransaction,
  transactionExists,
  getMinConfirmations,
  type BscScanTransaction,
} from "./bsc";
import { sendDepositNotification } from "./email";
import { sendPushNotification } from "./push-notifications";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface DepositResult {
  processed: number;
  pending: number;
  errors: number;
}

/**
 * Main function to monitor all wallets for new deposits
 */
export async function monitorDeposits(): Promise<DepositResult> {
  const result: DepositResult = {
    processed: 0,
    pending: 0,
    errors: 0,
  };

  try {
    // Get all wallet addresses
    const { data: wallets, error } = await supabase
      .from("wallets")
      .select("address, user_id");

    if (error || !wallets) {
      console.error("Error fetching wallets:", error);
      return result;
    }

    console.log(`Monitoring ${wallets.length} wallets...`);

    // Check each wallet for new transactions
    for (const wallet of wallets) {
      try {
        await checkWalletDeposits(wallet.address, wallet.user_id, result);
      } catch (error) {
        console.error(`Error checking wallet ${wallet.address}:`, error);
        result.errors++;
      }
    }

    console.log("Deposit monitoring complete:", result);
    return result;
  } catch (error) {
    console.error("Error in monitorDeposits:", error);
    return result;
  }
}

/**
 * Check a single wallet for new deposits
 */
async function checkWalletDeposits(
  address: string,
  userId: string,
  result: DepositResult,
): Promise<void> {
  // Fetch recent transactions
  const transactions = await getWalletTransactions(address, 20);

  for (const tx of transactions) {
    // Verify it's a valid USDT deposit
    if (!verifyUSDTTransaction(tx, address)) {
      continue;
    }

    // Check if already processed
    // BscScanTransaction doesn't have transaction_id, it has hash
    const exists = await transactionExists(tx.hash);
    if (exists) {
      continue;
    }

    // Get confirmations
    const confirmations = await getTransactionConfirmations(tx.hash);
    const minConfirmations = getMinConfirmations();

    if (confirmations >= minConfirmations) {
      // Process the deposit
      const processed = await processDeposit(tx, userId, confirmations);
      if (processed) {
        result.processed++;
      } else {
        result.errors++;
      }
    } else {
      // Save as pending
      await savePendingDeposit(tx, userId, confirmations);
      result.pending++;
    }
  }
}

/**
 * Process a confirmed deposit
 */
async function processDeposit(
  tx: BscScanTransaction,
  userId: string,
  _confirmations: number,
): Promise<boolean> {
  try {
    const parsedTx = parseTransaction(tx);
    const amount = parsedTx.amount;

    // Start a transaction
    const { error: depositError } = await supabase
      .from("deposits")
      .insert({
        user_id: userId,
        amount,
        tx_hash: parsedTx.txHash,
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (depositError) {
      console.error("Error creating deposit:", depositError);
      return false;
    }

    // Update user balance
    const { error: balanceError } = await supabase.rpc("increment_balance", {
      user_id: userId,
      amount: amount,
    });

    if (balanceError) {
      // Try direct update if RPC doesn't exist
      const { data: user } = await supabase
        .from("users")
        .select("balance")
        .eq("id", userId)
        .single();

      if (user) {
        await supabase
          .from("users")
          .update({ balance: (user.balance || 0) + amount })
          .eq("id", userId);
      }
    }

    // Create transaction record
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount,
      description: `USDT deposit - ${parsedTx.txHash.slice(0, 10)}...`,
    });

    // Send email notification
    const { data: user } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (user?.email) {
      await sendDepositNotification(
        user.email,
        user.full_name || "User",
        amount,
        parsedTx.txHash,
      );
    }

    // Send Push Notification
    await sendPushNotification(userId, {
      title: "Deposit Confirmed",
      body: `Your deposit of $${amount} USDT has been confirmed.`,
      url: "/dashboard/wallet",
    });

    console.log(`✅ Processed deposit: ${amount} USDT for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error processing deposit:", error);
    return false;
  }
}

/**
 * Save pending deposit (not enough confirmations yet)
 */
async function savePendingDeposit(
  tx: BscScanTransaction,
  userId: string,
  confirmations: number,
): Promise<void> {
  try {
    const parsedTx = parseTransaction(tx);

    await supabase.from("deposits").upsert(
      {
        user_id: userId,
        amount: parsedTx.amount,
        tx_hash: parsedTx.txHash,
        status: "pending",
      },
      {
        onConflict: "tx_hash",
      },
    );

    console.log(
      `⏳ Pending deposit: ${parsedTx.amount} USDT (${confirmations} confirmations)`,
    );
  } catch (error) {
    console.error("Error saving pending deposit:", error);
  }
}

/**
 * Check status of pending deposits and process if confirmed
 */
export async function checkPendingDeposits(): Promise<number> {
  try {
    const { data: pendingDeposits } = await supabase
      .from("deposits")
      .select("*")
      .eq("status", "pending");

    if (!pendingDeposits || pendingDeposits.length === 0) {
      return 0;
    }

    let processed = 0;

    for (const deposit of pendingDeposits) {
      const confirmations = await getTransactionConfirmations(deposit.tx_hash);
      const minConfirmations = getMinConfirmations();

      if (confirmations >= minConfirmations) {
        // Update status and process
        await supabase
          .from("deposits")
          .update({
            status: "confirmed",
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", deposit.id);

        // Update balance
        const { data: user } = await supabase
          .from("users")
          .select("balance")
          .eq("id", deposit.user_id)
          .single();

        if (user) {
          await supabase
            .from("users")
            .update({ balance: (user.balance || 0) + deposit.amount })
            .eq("id", deposit.user_id);
        }

        // Create transaction record
        await supabase.from("transactions").insert({
          user_id: deposit.user_id,
          type: "deposit",
          amount: deposit.amount,
          description: `USDT deposit - ${deposit.tx_hash.slice(0, 10)}...`,
        });

        processed++;
      }
    }

    return processed;
  } catch (error) {
    console.error("Error checking pending deposits:", error);
    return 0;
  }
}
