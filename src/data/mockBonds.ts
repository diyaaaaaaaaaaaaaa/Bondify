export interface Bond {
  id: string;
  name: string;
  shortName: string;
  interestRate: number;
  maturityPeriod: string;
  maturityYears: number;
  minInvestment: number;
  totalSupply: number;
  available: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  issuer: string;
}

export interface HoldingBond extends Bond {
  tokensOwned: number;
  investedAmount: number;
  yieldEarned: number;
  purchaseDate: string;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'yield' | 'redeem';
  bondName: string;
  amount: number;
  tokens?: number;
  status: 'completed' | 'pending';
  timestamp: string;
  txHash: string;
}

// Available bonds for purchase - these are the bonds users can buy
export const availableBonds: Bond[] = [
  {
    id: 'goi-10y',
    name: 'Government of India 10-Year Treasury Bond',
    shortName: 'GOI 10Y',
    interestRate: 7.1,
    maturityPeriod: '10 Years',
    maturityYears: 10,
    minInvestment: 100,
    totalSupply: 1000000,
    available: 750000,
    riskLevel: 'Low',
    issuer: 'Reserve Bank of India',
  },
  {
    id: 'goi-5y',
    name: 'Government of India 5-Year Treasury Bond',
    shortName: 'GOI 5Y',
    interestRate: 6.8,
    maturityPeriod: '5 Years',
    maturityYears: 5,
    minInvestment: 100,
    totalSupply: 500000,
    available: 320000,
    riskLevel: 'Low',
    issuer: 'Reserve Bank of India',
  },
  {
    id: 'sgb-2024',
    name: 'Sovereign Gold Bond Series III',
    shortName: 'SGB III',
    interestRate: 2.5,
    maturityPeriod: '8 Years',
    maturityYears: 8,
    minInvestment: 500,
    totalSupply: 200000,
    available: 85000,
    riskLevel: 'Medium',
    issuer: 'Reserve Bank of India',
  },
  {
    id: 'rbi-frl',
    name: 'RBI Floating Rate Savings Bond',
    shortName: 'RBI FRL',
    interestRate: 8.05,
    maturityPeriod: '7 Years',
    maturityYears: 7,
    minInvestment: 1000,
    totalSupply: 300000,
    available: 180000,
    riskLevel: 'Low',
    issuer: 'Reserve Bank of India',
  },
  {
    id: 'state-dev',
    name: 'State Development Loan 2029',
    shortName: 'SDL 2029',
    interestRate: 7.5,
    maturityPeriod: '5 Years',
    maturityYears: 5,
    minInvestment: 100,
    totalSupply: 400000,
    available: 290000,
    riskLevel: 'Low',
    issuer: 'State Governments',
  },
  {
    id: 'infra-bond',
    name: 'Infrastructure Development Bond',
    shortName: 'INFRA 2030',
    interestRate: 7.8,
    maturityPeriod: '6 Years',
    maturityYears: 6,
    minInvestment: 250,
    totalSupply: 250000,
    available: 175000,
    riskLevel: 'Medium',
    issuer: 'NABARD',
  },
];

// Empty initial states - data is populated through user actions
export const initialHoldings: HoldingBond[] = [];
export const initialTransactions: Transaction[] = [];
