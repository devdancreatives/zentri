export const typeDefs = `
  scalar DateTime

  type User {
    id: ID!
    email: String
    fullName: String
    role: String
    balance: Float
    referralCode: String
    referralEarnings: Float
    wallet: Wallet
    investments: [Investment]
    deposits: [Deposit]
    transactions: [Transaction]
    availableBalance: Float
  }

  type Wallet {
    address: String!
    pathIndex: Int!
  }

  type Deposit {
    id: ID!
    amount: Float!
    txHash: String!
    status: String!
    createdAt: DateTime!
    confirmedAt: DateTime
  }

  type Investment {
    id: ID!
    amount: Float!
    durationMonths: Int!
    startDate: DateTime!
    endDate: DateTime!
    status: String!
  }

  type ROISnapshot {
    date: String!
    profitAmount: Float!
    roiPercentage: Float!
  }

  type Transaction {
    id: ID!
    type: String!
    amount: Float!
    description: String
    createdAt: DateTime!
  }

  type ReferralStats {
    referralCode: String
    totalReferrals: Int!
    totalEarned: Float!
    activeReferrals: Int!
    canWithdraw: Boolean!
    nextBonus: ReferralBonus
  }

  type Referral {
    id: ID!
    referee: User!
    totalEarned: Float!
    createdAt: DateTime!
  }

  type ReferralEarning {
    id: ID!
    amount: Float!
    investmentAmount: Float
    referredUser: User
    investment: Investment!
    createdAt: DateTime!
  }

  type ReferralBonus {
    milestone: Int!
    bonus: Float!
    label: String!
  }

  type WithdrawalRequest {
    id: ID!
    amount: Float!
    fee: Float
    walletAddress: String!
    status: String!
    txHash: String
    createdAt: DateTime!
    processedAt: DateTime
  }

  type Query {
    me: User
    myInvestments: [Investment]
    myDeposits: [Deposit]
    myROI: [ROISnapshot]
    myTransactions(limit: Int, offset: Int): [Transaction]
    myReferralStats: ReferralStats
    myReferrals: [Referral]
    myReferralEarnings: [ReferralEarning]
    myWithdrawals: [WithdrawalRequest]
  }

  type Mutation {
    createInvestment(amount: Float!, durationMonths: Int!): Investment
    simulateDeposit(amount: Float!, txHash: String!): Deposit
    createMyWallet: Wallet
    adminDistributeProfit(amount: Float!): String
    requestOtp(email: String!, fullName: String!): Boolean
    registerWithOtp(email: String!, otp: String!, password: String!, fullName: String!, referralCode: String): User
    updateProfile(fullName: String): User
    requestWithdrawal(amount: Float!, walletAddress: String!): WithdrawalRequest
  }
`;
