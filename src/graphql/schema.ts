export const typeDefs = `
  scalar DateTime

  type User {
    id: ID!
    email: String
    fullName: String
    role: String
    balance: Float
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

  type Query {
    me: User
    myInvestments: [Investment]
    myDeposits: [Deposit]
    myROI: [ROISnapshot]
    myTransactions(limit: Int, offset: Int): [Transaction]
  }

  type Mutation {
    createInvestment(amount: Float!, durationMonths: Int!): Investment
    simulateDeposit(amount: Float!, txHash: String!): Deposit
    createMyWallet: Wallet
    adminDistributeProfit(amount: Float!): String
    requestOtp(email: String!, fullName: String!): Boolean
    registerWithOtp(email: String!, otp: String!, password: String!, fullName: String!): User
    updateProfile(fullName: String): User
  }
`;
