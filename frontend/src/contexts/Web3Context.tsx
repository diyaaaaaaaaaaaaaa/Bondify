import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';

// Contract addresses on Avalanche Fuji
const CONTRACTS = {
  identityRegistry: '0x24a20E821A5d8C8aC4C676743c253D765c53bCB2',
  bondToken: '0xBf5b6E65a930589159b78F34B6Cdc820Ff809BdF',
  usdcToken: '0x5425890298aed601595a70AB815c96711a31Bc65',
  yieldDistributor: '0xdC67f40c28A73762e0DffB582254183EfF0f8540',
};

// Avalanche Fuji Chain ID
const FUJI_CHAIN_ID = '0xa869'; // 43113 in hex
const FUJI_CHAIN_ID_DECIMAL = 43113;

// ABIs
const IDENTITY_REGISTRY_ABI = [
  "function isVerified(address user) view returns (bool)",
  "function register(address user)",
  "function totalRegistered() view returns (uint256)",
  "event UserRegistered(address indexed user, uint256 timestamp)"
];

const BOND_TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function bondName() view returns (string)",
  "function maturityDate() view returns (uint256)",
  "function couponRateBps() view returns (uint256)",
  "event BondTokensMinted(address indexed to, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const USDC_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const YIELD_DISTRIBUTOR_ABI = [
  "function claimYield()",
  "function calculateClaimableYield(address user) view returns (uint256)",
  "function depositYield(uint256 amount)",
  "function updateYieldRate(uint256 newRateBps)",
  "function getYieldStats() view returns (uint256 deposited, uint256 claimed, uint256 available, uint256 currentRate)",
  "function totalYieldDeposited() view returns (uint256)",
  "function totalYieldClaimed() view returns (uint256)",
  "function yieldRateBps() view returns (uint256)",
  "event YieldClaimed(address indexed user, uint256 amount, uint256 timestamp)",
  "event YieldDeposited(uint256 amount, uint256 timestamp)"
];

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  isVerified: boolean;
  bondBalance: string;
  usdcBalance: string;
  claimableYield: string;
  yieldRate: string;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  switchToFuji: () => Promise<void>;
  handleMint: (amount: string) => Promise<void>;
  handleClaim: () => Promise<void>;
  redeemTokens: (amount: string) => Promise<boolean>;
  refreshBalances: () => Promise<void>;
  setTransactionStatus: (status: string) => void;
  transactionStatus: string;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [bondBalance, setBondBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [claimableYield, setClaimableYield] = useState('0');
  const [yieldRate, setYieldRate] = useState('0');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');

  // Check if MetaMask is installed
  const checkMetaMask = () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install MetaMask to use this app.');
      return false;
    }
    return true;
  };

  // Check network
  const checkNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const isCorrect = chainId === FUJI_CHAIN_ID;
      setIsCorrectNetwork(isCorrect);
      return isCorrect;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  };

  // Switch to Avalanche Fuji
  const switchToFuji = async () => {
    if (!checkMetaMask()) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: FUJI_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: FUJI_CHAIN_ID,
                chainName: 'Avalanche Fuji Testnet',
                nativeCurrency: {
                  name: 'AVAX',
                  symbol: 'AVAX',
                  decimals: 18,
                },
                rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
                blockExplorerUrls: ['https://testnet.snowtrace.io/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding Fuji network:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!checkMetaMask()) return;

    try {
      setTransactionStatus('CONNECTING...');
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Check network
        const correctNetwork = await checkNetwork();
        if (!correctNetwork) {
          await switchToFuji();
        }

        // Fetch user data
        await fetchUserData(accounts[0]);
        setTransactionStatus('');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setTransactionStatus('');
      alert('Failed to connect wallet. Please try again.');
    }
  };

  // Fetch user data (balances, verification status)
  const fetchUserData = async (userAddress: string) => {
    if (!window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      
      // Initialize contracts (read-only)
      const identityRegistry = new Contract(
        CONTRACTS.identityRegistry,
        IDENTITY_REGISTRY_ABI,
        provider
      );
      const bondToken = new Contract(CONTRACTS.bondToken, BOND_TOKEN_ABI, provider);
      const usdcToken = new Contract(CONTRACTS.usdcToken, USDC_ABI, provider);
      const yieldDistributor = new Contract(
        CONTRACTS.yieldDistributor,
        YIELD_DISTRIBUTOR_ABI,
        provider
      );

      // Fetch verification status
      const verified = await identityRegistry.isVerified(userAddress);
      setIsVerified(verified);

      // Fetch bond balance
      const bondBal = await bondToken.balanceOf(userAddress);
      setBondBalance(formatUnits(bondBal, 18));

      // Fetch USDC balance
      const usdcBal = await usdcToken.balanceOf(userAddress);
      setUsdcBalance(formatUnits(usdcBal, 6)); // USDC has 6 decimals

      // Fetch claimable yield
      const claimable = await yieldDistributor.calculateClaimableYield(userAddress);
      setClaimableYield(formatUnits(claimable, 6));

      // Fetch yield rate
      const rate = await yieldDistributor.yieldRateBps();
      setYieldRate((Number(rate) / 100).toFixed(2)); // Convert bps to percentage

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Refresh balances
  const refreshBalances = async () => {
    if (account) {
      await fetchUserData(account);
    }
  };

  // Handle minting bond tokens
  const handleMint = async (amount: string) => {
    if (!account || !isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!isCorrectNetwork) {
      alert('Please switch to Avalanche Fuji network');
      await switchToFuji();
      return;
    }

    if (!isVerified) {
      alert('Your address is not verified. Please contact admin for KYC verification.');
      return;
    }

    try {
      setTransactionStatus('APPROVING...');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Parse amount (assuming 18 decimals for bond tokens)
      const amountWei = parseUnits(amount, 18);

      // Note: Minting is restricted to owner, so this would fail for regular users
      // In production, users would "buy" bonds by depositing USDC
      // For demo purposes, we'll show the transaction attempt
      const bondToken = new Contract(CONTRACTS.bondToken, BOND_TOKEN_ABI, signer);

      setTransactionStatus('MINTING...');
      const tx = await bondToken.mint(account, amountWei);
      
      setTransactionStatus('CONFIRMING...');
      await tx.wait();

      setTransactionStatus('SUCCESS!');
      setTimeout(() => setTransactionStatus(''), 2000);

      // Refresh balances
      await refreshBalances();

    } catch (error: any) {
      console.error('Error minting tokens:', error);
      setTransactionStatus('');
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction rejected by user');
      } else if (error.message.includes('OwnableUnauthorizedAccount')) {
        alert('Only admin can mint tokens. In production, you would purchase bonds with USDC.');
      } else {
        alert('Transaction failed: ' + (error.reason || error.message));
      }
    }
  };

  // Handle claiming yield
  const handleClaim = async () => {
    if (!account || !isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!isCorrectNetwork) {
      alert('Please switch to Avalanche Fuji network');
      await switchToFuji();
      return;
    }

    if (parseFloat(claimableYield) === 0) {
      alert('No yield available to claim');
      return;
    }

    try {
      setTransactionStatus('CLAIMING...');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const yieldDistributor = new Contract(
        CONTRACTS.yieldDistributor,
        YIELD_DISTRIBUTOR_ABI,
        signer
      );

      const tx = await yieldDistributor.claimYield();
      
      setTransactionStatus('CONFIRMING...');
      await tx.wait();

      setTransactionStatus('CLAIMED!');
      setTimeout(() => setTransactionStatus(''), 2000);

      // Refresh balances
      await refreshBalances();

    } catch (error: any) {
      console.error('Error claiming yield:', error);
      setTransactionStatus('');
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction rejected by user');
      } else {
        alert('Claim failed: ' + (error.reason || error.message));
      }
    }
  };

  // Handle redeeming (burning/returning) bond tokens
  const redeemTokens = async (amount: string) => {
    if (!account || !isConnected) return false;

    try {
      setTransactionStatus('APPROVING...');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const bondToken = new Contract(CONTRACTS.bondToken, BOND_TOKEN_ABI, signer);

      // We will transfer tokens to a "Burn" or "Treasury" address to simulate redemption
      // In a real mainnet app, the contract would have a distinct 'burn' or 'redeem' function
      const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD"; 
      
      setTransactionStatus('REDEEMING...');
      const amountWei = parseUnits(amount, 18);
      
      const tx = await bondToken.transfer(BURN_ADDRESS, amountWei);
      
      setTransactionStatus('CONFIRMING...');
      await tx.wait();

      setTransactionStatus('SUCCESS!');
      setTimeout(() => setTransactionStatus(''), 2000);

      await refreshBalances();
      return true;

    } catch (error: any) {
      console.error('Error redeeming tokens:', error);
      setTransactionStatus('ERROR');
      setTimeout(() => setTransactionStatus(''), 2000);
      return false;
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchUserData(accounts[0]);
        } else {
          setAccount(null);
          setIsConnected(false);
          setIsVerified(false);
          setBondBalance('0');
          setUsdcBalance('0');
          setClaimableYield('0');
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          await checkNetwork();
          await fetchUserData(accounts[0]);
        }
      }
    };

    checkConnection();
  }, []);

  const value: Web3ContextType = {
    account,
    isConnected,
    isVerified,
    bondBalance,
    usdcBalance,
    claimableYield,
    yieldRate,
    isCorrectNetwork,
    connectWallet,
    switchToFuji,
    handleMint,
    handleClaim,
    redeemTokens,
    refreshBalances,
    transactionStatus,
    setTransactionStatus,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

// Hook for accessing contract instances
export const useBondifyContracts = () => {
  const { isConnected } = useWeb3();

  const getContracts = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return {
      identityRegistry: new Contract(
        CONTRACTS.identityRegistry,
        IDENTITY_REGISTRY_ABI,
        signer
      ),
      bondToken: new Contract(CONTRACTS.bondToken, BOND_TOKEN_ABI, signer),
      usdcToken: new Contract(CONTRACTS.usdcToken, USDC_ABI, signer),
      yieldDistributor: new Contract(
        CONTRACTS.yieldDistributor,
        YIELD_DISTRIBUTOR_ABI,
        signer
      ),
      provider,
      signer,
    };
  };

  return { getContracts, isConnected };
};