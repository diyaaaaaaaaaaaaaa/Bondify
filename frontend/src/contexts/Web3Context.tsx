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

// Minimal ABIs
const BOND_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function transfer(address to, uint256 value) returns (bool)"
];
const USDC_ABI = ["function balanceOf(address) view returns (uint256)"];
const YIELD_ABI = ["function claimYield()", "function calculateClaimableYield(address) view returns (uint256)", "function yieldRateBps() view returns (uint256)"];

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  isVerified: boolean;
  bondBalance: string;
  currencyBalance: string; // Renamed from usdcBalance
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
  if (!context) throw new Error('useWeb3 must be used within Web3Provider');
  return context;
};

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVerified, setIsVerified] = useState(true); 
  const [bondBalance, setBondBalance] = useState('0');
  
  // RUPEE SIMULATION: 50,000 eINR (Digital Rupees) forced balance
  const [currencyBalance, setCurrencyBalance] = useState('50000.00'); 
  
  const [claimableYield, setClaimableYield] = useState('0');
  const [yieldRate, setYieldRate] = useState('7.25'); 
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');

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
        await fetchUserData(accounts[0]);
        setTransactionStatus('');
      }
    } catch (e) { console.error(e); setTransactionStatus(''); }
  };

  const fetchUserData = async (userAddress: string) => {
    if (!window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const bondToken = new Contract(CONTRACTS.bondToken, BOND_TOKEN_ABI, provider);
      const yieldDistributor = new Contract(CONTRACTS.yieldDistributor, YIELD_ABI, provider);
      
      try {
        const bondBal = await bondToken.balanceOf(userAddress);
        setBondBalance(formatUnits(bondBal, 18));
      } catch (e) { console.log("Using default bond balance"); }

      // Force high rupee balance for demo
      setCurrencyBalance('50000.00'); 

      // Fetch Yield
      try {
        const claimable = await yieldDistributor.calculateClaimableYield(userAddress);
        setClaimableYield(formatUnits(claimable, 6));
        const rate = await yieldDistributor.yieldRateBps();
        setYieldRate((Number(rate) / 100).toFixed(2));
      } catch (e) {
        setYieldRate('7.25');
      }

    } catch (e) { console.error("Error fetching data, using defaults"); }
  };

  const handleMint = async (amount: string) => {
    if (!isConnected) { alert('Connect Wallet'); return; }
    
    // DEMO SIMULATION for fast, reliable hackathon presentation
    try {
      setTransactionStatus('APPROVING...');
      await new Promise(r => setTimeout(r, 1000));
      
      setTransactionStatus('MINTING...');
      // We skip the real transaction call to ensure demo success without needing actual gas/owner permissions
      
      setTransactionStatus('CONFIRMING...');
      await new Promise(r => setTimeout(r, 1500));
      
      setTransactionStatus('SUCCESS!');
      
      // Update local state to reflect the "Purchase" immediately
      setBondBalance((prev) => {
        const current = parseFloat(prev);
        // Assuming 1 Bond Token = ₹100. So Amount / 100 = New Tokens
        const added = parseFloat(amount) / 100; 
        return (current + added).toString();
      });

      // Update Currency Balance (Simulate spending Rupees)
      setCurrencyBalance((prev) => {
        const current = parseFloat(prev);
        return (current - parseFloat(amount)).toFixed(2);
      });

    } catch (error: any) {
      console.error(error);
      setTransactionStatus('ERROR');
    }
    
    setTimeout(() => {
        setTransactionStatus('');
    }, 3000);
  };

  const handleClaim = async () => {
    if (!isConnected) return;
    setTransactionStatus('CLAIMING...');
    await new Promise(r => setTimeout(r, 2000));
    setTransactionStatus('CLAIMED!');
    setTimeout(() => setTransactionStatus(''), 2000);
  };

  const redeemTokens = async (amount: string) => {
    setTransactionStatus('REDEEMING...');
    await new Promise(r => setTimeout(r, 2000));
    setTransactionStatus('SUCCESS!');
    
    setBondBalance((prev) => {
      const current = parseFloat(prev);
      const redeemed = parseFloat(amount);
      return Math.max(0, current - redeemed).toString();
    });

    // Refund the rupees (Simulate getting money back)
    setCurrencyBalance((prev) => {
      const current = parseFloat(prev);
      const refund = parseFloat(amount) * 100; // 1 Token = ₹100
      return (current + refund).toFixed(2);
    });
    
    setTimeout(() => setTransactionStatus(''), 2000);
    return true;
  };

  const refreshBalances = async () => { if (account) await fetchUserData(account); };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accs: string[]) => {
        if (accs.length) { setAccount(accs[0]); fetchUserData(accs[0]); }
        else { setIsConnected(false); setAccount(null); }
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