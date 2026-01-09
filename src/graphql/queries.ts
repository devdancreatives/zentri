import { gql } from "@apollo/client";

// User Queries
export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      fullName
      role
      balance
      referralCode
      referralEarnings
      availableBalance
      wallet {
        address
        pathIndex
      }
    }
  }
`;

export const GET_MY_INVESTMENTS = gql`
  query GetMyInvestments {
    myInvestments {
      id
      amount
      durationMonths
      startDate
      endDate
      status
    }
  }
`;

export const GET_MY_DEPOSITS = gql`
  query GetMyDeposits {
    myDeposits {
      id
      amount
      txHash
      status
      createdAt
      confirmedAt
    }
  }
`;

export const GET_MY_TRANSACTIONS = gql`
  query GetMyTransactions($limit: Int, $offset: Int) {
    myTransactions(limit: $limit, offset: $offset) {
      id
      type
      amount
      description
      createdAt
    }
  }
`;

export const GET_MY_REFERRAL_STATS = gql`
  query GetMyReferralStats {
    myReferralStats {
      referralCode
      totalReferrals
      totalEarned
      activeReferrals
      canWithdraw
      nextBonus {
        milestone
        bonus
        label
      }
    }
  }
`;

export const GET_MY_REFERRALS = gql`
  query GetMyReferrals {
    myReferrals {
      id
      referee {
        id
        email
        fullName
      }
      totalEarned
      createdAt
    }
  }
`;

export const GET_MY_REFERRAL_EARNINGS = gql`
  query GetMyReferralEarnings {
    myReferralEarnings {
      id
      amount
      investmentAmount
      referredUser {
        id
        fullName
      }
      investment {
        id
        amount
      }
      createdAt
    }
  }
`;

export const GET_MY_WITHDRAWALS = gql`
  query GetMyWithdrawals {
    myWithdrawals {
      id
      amount
      fee
      walletAddress
      status
      txHash
      createdAt
      processedAt
    }
  }
`;

// Mutations
export const CREATE_INVESTMENT = gql`
  mutation CreateInvestment($amount: Float!, $durationMonths: Int!) {
    createInvestment(amount: $amount, durationMonths: $durationMonths) {
      id
      amount
      durationMonths
      startDate
      endDate
      status
    }
  }
`;

export const CREATE_MY_WALLET = gql`
  mutation CreateMyWallet {
    createMyWallet {
      address
      pathIndex
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($fullName: String) {
    updateProfile(fullName: $fullName) {
      id
      fullName
    }
  }
`;

export const REQUEST_WITHDRAWAL = gql`
  mutation RequestWithdrawal($amount: Float!, $walletAddress: String!) {
    requestWithdrawal(amount: $amount, walletAddress: $walletAddress) {
      id
      amount
      fee
      walletAddress
      status
      createdAt
    }
  }
`;

export const REGISTER_WITH_OTP = gql`
  mutation RegisterWithOtp(
    $email: String!
    $otp: String!
    $password: String!
    $fullName: String!
    $referralCode: String
  ) {
    registerWithOtp(
      email: $email
      otp: $otp
      password: $password
      fullName: $fullName
      referralCode: $referralCode
    ) {
      id
      email
      fullName
    }
  }
`;

export const REQUEST_OTP = gql`
  mutation RequestOtp($email: String!, $fullName: String!) {
    requestOtp(email: $email, fullName: $fullName)
  }
`;

// Combined query for dashboard page
export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    me {
      id
      email
      fullName
      balance
      availableBalance
      wallet {
        address
      }
    }
    myInvestments {
      id
      amount
      status
      durationMonths
    }
    myROI {
      date
      profitAmount
    }
    myTransactions(limit: 5) {
      id
      type
      amount
      description
      createdAt
    }
  }
`;

// Extended me query with wallet
export const GET_ME_WITH_WALLET = gql`
  query GetMeWithWallet {
    me {
      id
      email
      fullName
      role
      balance
      availableBalance
      wallet {
        address
        pathIndex
      }
    }
  }
`;

// ROI data for charts
export const GET_MY_ROI = gql`
  query GetMyROI {
    myROI {
      date
      profitAmount
    }
  }
`;

// Admin mutation
export const ADMIN_DISTRIBUTE_PROFIT = gql`
  mutation AdminDistributeProfit($amount: Float!) {
    adminDistributeProfit(amount: $amount)
  }
`;
