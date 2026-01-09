import { createAuthenticatedClient, supabase } from "@/lib/supabase";
import { getTronAddress } from "@/lib/wallet";
import { sendOtpEmail } from "@/lib/email";
import { createClient } from "@supabase/supabase-js";

const getClient = (context: any) => {
  const token = context.request.headers.get("authorization");
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

  return totalDeposited + totalProfit - activeInvestments;
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
      const { data } = await client.from("investments").select("*");
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
      const { data } = await client.from("roi_snapshots").select("*");
      return data;
    },
    myTransactions: async (
      _: any,
      { limit = 50, offset = 0 }: any,
      context: any
    ) => {
      const client = getClient(context);
      const { data } = await client
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      return data;
    },
  },
  User: {
    wallet: async (parent: any, _: any, context: any) => {
      const client = getClient(context);
      const { data } = await client
        .from("wallets")
        .select("*")
        .eq("user_id", parent.id)
        .single();
      return data;
    },
    availableBalance: async (parent: any, _: any, context: any) => {
      const client = getClient(context);
      return getAvailableBalance(client, parent.id);
    },
  },
  Wallet: {
    pathIndex: (parent: any) => parent.path_index,
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

      // 1. Get all active investments
      // We need serviceClient to see ALL investments if RLS hides them
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

      // 2. Distribute
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

      // Save code
      const { error } = await serviceClient
        .from("verification_codes")
        .insert({ email, code, expires_at: expiresAt });

      if (error) throw new Error("Failed to generate OTP");

      // Send Email
      await sendOtpEmail(email, code);

      return true;
    },
    registerWithOtp: async (
      _: any,
      { email, otp, password, fullName }: any
    ) => {
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Verify OTP
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

      // Create User
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

      // Trigger or Manual Insert?
      // Assuming we need manual insert if no trigger exists.
      // We'll check schema.sql in next step, but let's add safe duplication here just in case?
      // No, duplication causes PK violation if trigger exists.
      // I'll assume trigger handles it or I'll add `upsert` logic?
      // Let's rely on standard Supabase pattern: usually a trigger handles `public.users`.
      // If I haven't implemented a trigger, I MUST do it here.
      // I haven't seen a trigger file. I will add manual insert to be safe, using `upsert` or `ignore` logic.

      await serviceClient.from("users").upsert({
        id: newUser.id,
        email: newUser.email,
        full_name: fullName,
        role: "user",
      });

      // Cleanup codes
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
  },
};
