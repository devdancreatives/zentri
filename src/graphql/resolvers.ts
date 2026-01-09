import { createAuthenticatedClient, supabase } from "@/lib/supabase";
import { getTronAddress } from "@/lib/wallet";
import { sendOtpEmail } from "@/lib/email";
import { createClient } from "@supabase/supabase-js";

const getClient = (context: any) => {
  // Handle both standard Request (App Router) and NextApiRequest (Pages Router)
  const headers = context.request.headers;
  const token =
    typeof headers.get === "function"
      ? headers.get("authorization")
      : headers["authorization"];

  if (!token) return supabase;
  return createAuthenticatedClient(token);
};

const getUser = async (client: any) => {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;
  return user;
};

const getBonusLabel = (milestone: number): string => {
  const labels: Record<number, string> = {
    5: "Bronze",
    10: "Silver",
    25: "Gold",
    50: "Platinum",
    100: "Diamond",
  };
  return labels[milestone] || "Unknown";
};

const getAvailableBalance = async (client: any, userId: string) => {
  // Sum confirmed deposits
  const { data: deposits } = await client
    .from("deposits")
    .select("amount")
    .eq("user_id", userId)
    .eq("status", "confirmed");
  const totalDeposited =
    deposits?.reduce((a: number, b: any) => a + b.amount, 0) || 0;

  // Sum active investments
  const { data: investments } = await client
    .from("investments")
    .select("amount")
    .eq("user_id", userId)
    .in("status", ["active", "completed"]);
  // Should we deduct completed? If completed, principal is returned?
  // PRD says: funds locked... cannot be withdrawn.
  // Logic: Balance = (Deposits + Profits) - (Investments)
  // If investment completes, does it go back to balance? Yes.
  // We need to track checks.
  // Simplified logic:
  // Transaction ledger is best source of truth if we maintained it properly.
  // For now: Sum(Deposits) - Sum(Active Investments).
  // Assuming 'completed' investments return principal to balance effectively (or stay in 'investments' table but marked completed).

  const activeInvestments =
    investments?.reduce((a: number, b: any) => a + b.amount, 0) || 0;

  // Also profits?
  const { data: roi } = await client
    .from("roi_snapshots")
    .select("profit_amount")
    .eq("user_id", userId);
  const totalProfit =
    roi?.reduce((a: number, b: any) => a + b.profit_amount, 0) || 0;

  // Sum pending or processed withdrawals (including fees)
  // We exclude 'rejected' withdrawals as they return funds to balance (or never leave).
  // Statuses: 'pending', 'processing', 'completed', 'rejected'.
  const { data: withdrawals } = await client
    .from("withdrawal_requests")
    .select("amount, fee")
    .eq("user_id", userId)
    .neq("status", "rejected");

  const totalWithdrawals =
    withdrawals?.reduce(
      (sum: number, w: any) => sum + w.amount + (w.fee || 0),
      0
    ) || 0;

  return totalDeposited + totalProfit - activeInvestments - totalWithdrawals;
};

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) return null;

      const { data: profile } = await client
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      return { ...user, ...profile };
    },
    myInvestments: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("investments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data;
    },
    myDeposits: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data;
    },
    myROI: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("roi_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      return data;
    },
    myTransactions: async (
      _: any,
      { limit = 50, offset = 0 }: any,
      context: any
    ) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      return data;
    },
    myReferralStats: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      // Get profile for referral data
      const { data: profile } = await client
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Get referral count
      const { count } = await client
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id);

      // Get total earned
      const { data: referralData } = await client
        .from("referrals")
        .select("total_earned")
        .eq("referrer_id", user.id);

      const totalEarned =
        referralData?.reduce((sum, r) => sum + (r.total_earned || 0), 0) || 0;

      // Check if can withdraw (minimum $50)
      const canWithdraw = (profile.referral_earnings || 0) >= 50;

      // Get next bonus
      const tiers = [5, 10, 25, 50, 100];
      const nextTier = tiers.find((t) => t > (count || 0));
      const nextBonus = nextTier
        ? {
            milestone: nextTier,
            bonus: nextTier * 10,
            label: getBonusLabel(nextTier),
          }
        : null;

      let referralCode = profile.referral_code;
      if (!referralCode) {
        // Generate a referral code if missing
        referralCode = Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();
        await client
          .from("users")
          .update({ referral_code: referralCode })
          .eq("id", user.id);
      }

      return {
        referralCode: referralCode,
        totalReferrals: count || 0,
        totalEarned,
        activeReferrals: count || 0,
        canWithdraw,
        nextBonus,
      };
    },
    myReferrals: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("referrals")
        .select("*, referee:referee_id(*)")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      return data;
    },
    myReferralEarnings: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data: referrals } = await client
        .from("referrals")
        .select("id")
        .eq("referrer_id", user.id);

      if (!referrals || referrals.length === 0) return [];

      const referralIds = referrals.map((r) => r.id);

      const { data } = await client
        .from("referral_earnings")
        .select(
          "*, investment:investment_id(*), referredUser:referred_user_id(*)"
        )
        .in("referral_id", referralIds)
        .order("created_at", { ascending: false });

      return data;
    },
    myWithdrawals: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data } = await client
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      return data;
    },
  },
  User: {
    fullName: (parent: any) => parent.full_name,
    referralCode: (parent: any) => parent.referral_code,
    referralEarnings: (parent: any) => parent.referral_earnings,
    availableBalance: async (parent: any, _: any, context: any) => {
      const client = getClient(context);
      return getAvailableBalance(client, parent.id);
    },
    wallet: async (parent: any, _: any, context: any) => {
      const client = getClient(context);
      const { data } = await client
        .from("wallets")
        .select("*")
        .eq("user_id", parent.id)
        .single();
      return data;
    },
  },
  Wallet: {
    pathIndex: (parent: any) => parent.path_index,
  },
  Deposit: {
    txHash: (parent: any) => parent.tx_hash,
    createdAt: (parent: any) => parent.created_at,
    confirmedAt: (parent: any) => parent.confirmed_at,
  },
  Investment: {
    durationMonths: (parent: any) => parent.duration_months,
    startDate: (parent: any) => parent.start_date,
    endDate: (parent: any) => parent.end_date,
  },
  Transaction: {
    createdAt: (parent: any) => parent.created_at,
  },
  Referral: {
    totalEarned: (parent: any) => parent.total_earned,
    createdAt: (parent: any) => parent.created_at,
  },
  ReferralEarning: {
    investmentAmount: (parent: any) => parent.investment?.amount || 0,
    createdAt: (parent: any) => parent.created_at,
  },
  ROISnapshot: {
    profitAmount: (parent: any) => parent.profit_amount,
    roiPercentage: (parent: any) => parent.roi_percentage,
  },
  WithdrawalRequest: {
    walletAddress: (parent: any) => parent.wallet_address,
    txHash: (parent: any) => parent.tx_hash,
    createdAt: (parent: any) => parent.created_at,
    processedAt: (parent: any) => parent.processed_at,
  },
  Mutation: {
    createInvestment: async (
      _: any,
      { amount, durationMonths }: any,
      context: any
    ) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const balance = await getAvailableBalance(client, user.id);
      if (balance < amount) throw new Error("Insufficient balance");

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);

      const { data, error } = await client
        .from("investments")
        .insert({
          user_id: user.id,
          amount,
          duration_months: durationMonths,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "active",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    simulateDeposit: async (_: any, { amount, txHash }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data, error } = await client
        .from("deposits")
        .insert({
          user_id: user.id,
          amount,
          tx_hash: txHash,
          status: "confirmed",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    createMyWallet: async (_: any, __: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data: existing } = await client
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existing) return existing;

      const mnemonic =
        process.env.WALLET_MNEMONIC ||
        "test mnemonic for dev environment only do not use in production";

      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { count } = await serviceClient
        .from("wallets")
        .select("*", { count: "exact", head: true });
      const index = (count || 0) + 1;

      const { address } = await getTronAddress(mnemonic, index);

      const { data, error } = await client
        .from("wallets")
        .insert({
          user_id: user.id,
          address,
          path_index: index,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    adminDistributeProfit: async (_: any, { amount }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      // Check role
      const { data: profile } = await client
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") throw new Error("Admin only");

      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: investments } = await serviceClient
        .from("investments")
        .select("*")
        .eq("status", "active");

      if (!investments || investments.length === 0)
        return "No active investments";

      const totalCapital = investments.reduce(
        (sum: number, inv: any) => sum + inv.amount,
        0
      );
      if (totalCapital === 0) return "Total capital is 0";

      const roiPercentage = (amount / totalCapital) * 100;

      const snapshots = [];
      for (const inv of investments) {
        const profit = (inv.amount / totalCapital) * amount;
        snapshots.push({
          user_id: inv.user_id,
          date: new Date().toISOString(),
          profit_amount: profit,
          roi_percentage: roiPercentage,
        });
      }

      const { error } = await serviceClient
        .from("roi_snapshots")
        .insert(snapshots);
      if (error) throw new Error(error.message);

      return `Distributed ${amount} USDT to ${
        investments.length
      } investments (ROI: ${roiPercentage.toFixed(2)}%)`;
    },
    requestOtp: async (_: any, { email, fullName }: any) => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error } = await serviceClient
        .from("verification_codes")
        .insert({ email, code, expires_at: expiresAt });

      if (error) throw new Error("Failed to generate OTP");

      await sendOtpEmail(email, code);

      return true;
    },
    registerWithOtp: async (
      _: any,
      { email, otp, password, fullName, referralCode }: any
    ) => {
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: codes } = await serviceClient
        .from("verification_codes")
        .select("*")
        .eq("email", email)
        .eq("code", otp)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (!codes || codes.length === 0)
        throw new Error("Invalid or expired OTP");

      const { data: authData, error: authError } =
        await serviceClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

      if (authError) throw new Error(authError.message);
      const newUser = authData.user;
      if (!newUser) throw new Error("User creation failed");

      // Generate a new unique referral code for this user
      const newReferralCode = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

      await serviceClient.from("users").upsert({
        id: newUser.id,
        email: newUser.email,
        full_name: fullName,
        role: "user",
        referral_code: newReferralCode,
      });

      // If a referral code was provided (upline), record the referral
      if (referralCode) {
        const { data: referrer } = await serviceClient
          .from("users")
          .select("id")
          .eq("referral_code", referralCode.toUpperCase())
          .single();

        if (referrer) {
          await serviceClient.from("referrals").insert({
            referrer_id: referrer.id,
            referee_id: newUser.id,
            total_earned: 0,
          });
        }
      }

      await serviceClient
        .from("verification_codes")
        .delete()
        .eq("email", email);

      return { ...newUser, fullName, role: "user" };
    },
    updateProfile: async (_: any, { fullName }: any, context: any) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      const { data, error } = await client
        .from("users")
        .update({ full_name: fullName })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { ...user, ...data };
    },
    requestWithdrawal: async (
      _: any,
      { amount, walletAddress }: any,
      context: any
    ) => {
      const client = getClient(context);
      const user = await getUser(client);
      if (!user) throw new Error("Unauthorized");

      // 1. Validation
      if (amount < 10) throw new Error("Minimum withdrawal is 10 USDT");

      // Validate TRON address (starts with T, 34 chars)
      const tronRegex = /^T[a-zA-Z0-9]{33}$/;
      if (!tronRegex.test(walletAddress)) {
        throw new Error(
          "Invalid TRON (TRC20) address. Must start with 'T' and be 34 characters long."
        );
      }

      const FEE = 3.0;
      const totalDeduction = amount + FEE;

      // 2. Check Balance
      const availableBalance = await getAvailableBalance(client, user.id);
      if (availableBalance < totalDeduction) {
        throw new Error(
          `Insufficient balance. You need ${totalDeduction.toFixed(
            2
          )} USDT (incl. $3 fee)`
        );
      }

      // 3. Create Request
      const { data, error } = await client
        .from("withdrawal_requests")
        .insert({
          user_id: user.id,
          amount: amount,
          fee: FEE,
          wallet_address: walletAddress,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
  },
};
