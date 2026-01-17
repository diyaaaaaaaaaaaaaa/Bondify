import { useState, useCallback } from 'react';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number;
  usdcBalance: number;
}

const generateMockAddress = () => {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
};

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: 0,
    usdcBalance: 0,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockAddress = generateMockAddress();
    setWallet({
      isConnected: true,
      address: mockAddress,
      balance: 0.5 + Math.random() * 2,
      usdcBalance: 10000 + Math.random() * 5000,
    });
    
    setIsConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      isConnected: false,
      address: null,
      balance: 0,
      usdcBalance: 0,
    });
  }, []);

  const updateBalance = useCallback((amount: number) => {
    setWallet(prev => ({
      ...prev,
      usdcBalance: prev.usdcBalance - amount,
    }));
  }, []);

  return {
    ...wallet,
    isConnecting,
    connect,
    disconnect,
    updateBalance,
    shortAddress: wallet.address ? shortenAddress(wallet.address) : null,
  };
};
