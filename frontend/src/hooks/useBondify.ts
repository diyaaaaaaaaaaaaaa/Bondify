import { useWeb3 } from '../contexts/Web3Context';

export const useBondify = () => {
  const {
    account,
    isConnected,
    connectWallet,
    bondBalance,
    usdcBalance,
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
    usdcBalance,
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