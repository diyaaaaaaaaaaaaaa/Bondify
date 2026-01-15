import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';

// Contract addresses on Avalanche Fuji
const CONTRACTS = {
  identityRegistry: '0x24a20E821A5d8C8aC4C676743c253D765c53bCB2',
  bondToken: '0xBf5b6E65a930589159b78F34B6Cdc820Ff809BdF',
  usdcToken: '0x5425890298aed601595a70AB815c96711a31Bc65',
  yieldDistributor: '0xdC67f40c28A73762e0DffB582254183EfF0f8540',
};

const FUJI_CHAIN_ID = '0xa869';

const BOND_TOKEN_ABI = ["function balanceOf(address) view returns (uint256)", "function mint(address to, uint256 amount)", "function transfer(address to, uint256 value) returns (bool)"];
const USDC_ABI = ["function balanceOf(address) view returns (uint256)"];
const YIELD_ABI = ["function claimYield()", "function calculateClaimableYield(address) view returns (uint256)", "function yieldRateBps() view returns (uint256)"];

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  isVerified: boolean;
  bondBalance: string;
  currencyBalance: string;
  claimableYield: string;
  yieldRate: string;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  switchToFuji: () => Promise<void>;
  handleMint: (amount: string) => Promise<void>;
  handleClaim: () => Promise<void>;
  redeemTokens: (amount: string, bondId: string, bondName: string) => Promise<boolean>; // Updated signature
  refreshBalances: () => Promise<void>;
  setTransactionStatus: (status: string) => void;
  transactionStatus: string;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error('useWeb3 must be used within Web3Provider');
  return context;
};

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  
  // Initialize from LocalStorage or Default
  const [bondBalance, setBondBalance] = useState(() => localStorage.getItem('sim_bondBalance') || '0');
  const [currencyBalance, setCurrencyBalance] = useState(() => localStorage.getItem('sim_currencyBalance') || '50000.00');
  
  const [claimableYield, setClaimableYield] = useState('0');
  const [yieldRate, setYieldRate] = useState('7.25');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');

  // Persist balances whenever they change
  useEffect(() => {
    localStorage.setItem('sim_bondBalance', bondBalance);
    localStorage.setItem('sim_currencyBalance', currencyBalance);
  }, [bondBalance, currencyBalance]);

  const checkMetaMask = () => typeof window.ethereum !== 'undefined';

  const checkNetwork = async () => {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const isCorrect = chainId === FUJI_CHAIN_ID;
      setIsCorrectNetwork(isCorrect);
      return isCorrect;
    } catch { return false; }
  };

  const switchToFuji = async () => {
    if (!checkMetaMask()) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: FUJI_CHAIN_ID }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: FUJI_CHAIN_ID,
            chainName: 'Avalanche Fuji Testnet',
            nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
            rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
            blockExplorerUrls: ['https://testnet.snowtrace.io/'],
          }],
        });
      }
    }
  };

  const connectWallet = async () => {
    if (!checkMetaMask()) { alert('Install MetaMask'); return; }
    try {
      setTransactionStatus('CONNECTING...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        const correct = await checkNetwork();
        if (!correct) await switchToFuji();
        // Just use local state for simulation, don't overwrite with 0 from chain
        setTransactionStatus('');
      }
    } catch (e) { console.error(e); setTransactionStatus(''); }
  };

  const handleMint = async (amount: string) => {
    if (!isConnected) { alert('Connect Wallet'); return; }
    try {
      setTransactionStatus('APPROVING...');
      await new Promise(r => setTimeout(r, 800));
      setTransactionStatus('MINTING...');
      await new Promise(r => setTimeout(r, 1000));
      setTransactionStatus('SUCCESS!');
      
      // Update persistent state
      setBondBalance((prev) => {
        const current = parseFloat(prev);
        const added = parseFloat(amount) / 100; 
        return (current + added).toString();
      });

      setCurrencyBalance((prev) => {
        const current = parseFloat(prev);
        return (current - parseFloat(amount)).toFixed(2);
      });

    } catch (error: any) {
      console.error(error);
      setTransactionStatus('ERROR');
    }
    setTimeout(() => setTransactionStatus(''), 3000);
  };

  const handleClaim = async () => {
    if (!isConnected) return;
    setTransactionStatus('CLAIMING...');
    await new Promise(r => setTimeout(r, 1500));
    setTransactionStatus('CLAIMED!');
    setTimeout(() => setTransactionStatus(''), 2000);
  };

  // 1. Ensure the interface at the top includes these 3 arguments:
// redeemTokens: (amount: string, bondId: string, bondName: string) => Promise<boolean>;

// 2. Replace the function inside the Web3Provider component:
const redeemTokens = async (amount: string, bondId: string, bondName: string) => {
  setTransactionStatus('REDEEMING...');
  try {
    // Artificial delay to mimic blockchain speed
    await new Promise(r => setTimeout(r, 2000));

    const redeemedTokens = parseFloat(amount);
    const refundRupees = redeemedTokens * 100; // 1 token = ₹100

    // Update Global Token Balance
    setBondBalance((prev) => {
      const newVal = Math.max(0, parseFloat(prev) - redeemedTokens).toString();
      localStorage.setItem('sim_bondBalance', newVal);
      return newVal;
    });

    // Update Digital Rupee (eINR) Balance
    setCurrencyBalance((prev) => {
      const newVal = (parseFloat(prev) + refundRupees).toFixed(2);
      localStorage.setItem('sim_currencyBalance', newVal);
      return newVal;
    });

    // Log the transaction to history (LocalStorage)
    const stored = localStorage.getItem('bond_holdings');
    const history = stored ? JSON.parse(stored) : [];
    
    const redeemTx = {
      id: bondId,
      name: bondName,
      amount: -redeemedTokens, // Negative value signifies redemption
      timestamp: Date.now(),
      type: 'redeem'
    };
    
    history.push(redeemTx);
    localStorage.setItem('bond_holdings', JSON.stringify(history));

    setTransactionStatus('SUCCESS!');
    setTimeout(() => setTransactionStatus(''), 2000);
    return true;
  } catch (e) {
    console.error("Redeem failed:", e);
    setTransactionStatus('ERROR');
    setTimeout(() => setTransactionStatus(''), 2000);
    return false;
  }
};

  const refreshBalances = async () => { 
    // No-op in simulation mode to prevent overwriting with 0
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accs: string[]) => {
        if (accs.length) setAccount(accs[0]);
        else setIsConnected(false);
      });
    }
  }, []);

  return (
    <Web3Context.Provider value={{
      account, isConnected, isVerified, bondBalance, currencyBalance,
      claimableYield, yieldRate, isCorrectNetwork,
      connectWallet, switchToFuji, handleMint, handleClaim, redeemTokens,
      refreshBalances, transactionStatus, setTransactionStatus
    }}>
      {children}
    </Web3Context.Provider>
  );
};