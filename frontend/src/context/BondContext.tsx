import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Bond, HoldingBond, Transaction, availableBonds, initialHoldings, initialTransactions } from '@/data/mockBonds';
import { useWallet } from '@/hooks/useWallet';

interface BondContextType {
  // Wallet
  wallet: ReturnType<typeof useWallet>;
  
  // Bonds
  bonds: Bond[];
  holdings: HoldingBond[];
  transactions: Transaction[];
  
  // Portfolio stats
  totalInvested: number;
  totalYieldEarned: number;
  totalTokens: number;
  
  // Actions
  buyBond: (bondId: string, amount: number) => Promise<boolean>;
  redeemTokens: (bondId: string, tokens: number) => Promise<boolean>;
  
  // UI state
  isProcessing: boolean;
}

const BondContext = createContext<BondContextType | undefined>(undefined);

export const BondProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useWallet();
  const [bonds] = useState<Bond[]>(availableBonds);
  const [holdings, setHoldings] = useState<HoldingBond[]>(initialHoldings);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate portfolio stats
  const totalInvested = holdings.reduce((sum, h) => sum + h.investedAmount, 0);
  const totalYieldEarned = holdings.reduce((sum, h) => sum + h.yieldEarned, 0);
  const totalTokens = holdings.reduce((sum, h) => sum + h.tokensOwned, 0);

  const buyBond = useCallback(async (bondId: string, amount: number): Promise<boolean> => {
    if (!wallet.isConnected) return false;
    
    setIsProcessing(true);
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const bond = bonds.find(b => b.id === bondId);
    if (!bond) {
      setIsProcessing(false);
      return false;
    }

    const tokens = Math.floor(amount / bond.minInvestment);
    
    // Update holdings
    setHoldings(prev => {
      const existing = prev.find(h => h.id === bondId);
      if (existing) {
        return prev.map(h => 
          h.id === bondId 
            ? { 
                ...h, 
                tokensOwned: h.tokensOwned + tokens,
                investedAmount: h.investedAmount + amount,
              }
            : h
        );
      } else {
        return [...prev, {
          ...bond,
          tokensOwned: tokens,
          investedAmount: amount,
          yieldEarned: 0,
          purchaseDate: new Date().toISOString().split('T')[0],
        }];
      }
    });

    // Add transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'buy',
      bondName: bond.shortName,
      amount,
      tokens,
      status: 'completed',
      timestamp: new Date().toISOString(),
      txHash: `0x${Array.from({ length: 64 }, () => 
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('')}`,
    };
    
    setTransactions(prev => [newTx, ...prev]);
    wallet.updateBalance(amount);
    
    setIsProcessing(false);
    return true;
  }, [wallet, bonds]);

  const redeemTokens = useCallback(async (bondId: string, tokens: number): Promise<boolean> => {
    if (!wallet.isConnected) return false;
    
    setIsProcessing(true);
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const holding = holdings.find(h => h.id === bondId);
    if (!holding || holding.tokensOwned < tokens) {
      setIsProcessing(false);
      return false;
    }

    const redeemAmount = tokens * holding.minInvestment;
    
    // Update holdings
    setHoldings(prev => 
      prev.map(h => 
        h.id === bondId 
          ? { 
              ...h, 
              tokensOwned: h.tokensOwned - tokens,
              investedAmount: h.investedAmount - redeemAmount,
            }
          : h
      ).filter(h => h.tokensOwned > 0)
    );

    // Add transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'redeem',
      bondName: holding.shortName,
      amount: redeemAmount,
      tokens,
      status: 'completed',
      timestamp: new Date().toISOString(),
      txHash: `0x${Array.from({ length: 64 }, () => 
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('')}`,
    };
    
    setTransactions(prev => [newTx, ...prev]);
    
    setIsProcessing(false);
    return true;
  }, [wallet, holdings]);

  return (
    <BondContext.Provider value={{
      wallet,
      bonds,
      holdings,
      transactions,
      totalInvested,
      totalYieldEarned,
      totalTokens,
      buyBond,
      redeemTokens,
      isProcessing,
    }}>
      {children}
    </BondContext.Provider>
  );
};

export const useBondContext = () => {
  const context = useContext(BondContext);
  if (context === undefined) {
    throw new Error('useBondContext must be used within a BondProvider');
  }
  return context;
};
