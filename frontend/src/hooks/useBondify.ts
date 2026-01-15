import { useWeb3 } from '../contexts/Web3Context';

export const useBondify = () => {
  const {
    account,
    isConnected,
    connectWallet,
    bondBalance,
    currencyBalance, // Changed from usdcBalance
    claimableYield,
    yieldRate,
    handleMint,
    handleClaim,
    redeemTokens,
    refreshBalances,
    transactionStatus,
    isVerified,
    isCorrectNetwork
  } = useWeb3();

  return {
    // Data
    account,
    isConnected,
    bondBalance,
    currencyBalance, // Return as currencyBalance
    claimableYield,
    yieldRate,
    isVerified,
    isCorrectNetwork,
    transactionStatus,

    // Actions
    connectWallet,
    mintBond: handleMint,
    claimYield: handleClaim,
    redeemTokens,
    refresh: refreshBalances
  };
};