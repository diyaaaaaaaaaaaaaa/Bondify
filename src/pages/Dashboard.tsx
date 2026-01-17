import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, Shield, Clock, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const {
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
    refreshBalances,
    transactionStatus,
  } = useWeb3();

  const [cursorLabel, setCursorLabel] = useState('CONNECT');
  const [mintAmount, setMintAmount] = useState('100');

  // Update cursor label based on transaction status
  useEffect(() => {
    if (transactionStatus) {
      setCursorLabel(transactionStatus);
    } else if (!isConnected) {
      setCursorLabel('CONNECT');
    } else if (!isCorrectNetwork) {
      setCursorLabel('SWITCH NETWORK');
    } else if (!isVerified) {
      setCursorLabel('NOT VERIFIED');
    } else {
      setCursorLabel('READY');
    }
  }, [transactionStatus, isConnected, isCorrectNetwork, isVerified]);

  const handleBuyBond = async () => {
    await handleMint(mintAmount);
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Custom Cursor Label */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-2">
          <span className="text-white font-mono text-sm tracking-wider">
            {cursorLabel}
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Bondify</h1>
          
          <div className="flex items-center gap-4">
            {isConnected && account ? (
              <>
                {!isCorrectNetwork && (
                  <Button
                    onClick={switchToFuji}
                    variant="destructive"
                    className="gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Switch to Fuji
                  </Button>
                )}
                <Badge variant={isVerified ? 'default' : 'destructive'} className="gap-2">
                  <Shield className="w-3 h-3" />
                  {isVerified ? 'Verified' : 'Not Verified'}
                </Badge>
                <div className="bg-white/10 rounded-lg px-4 py-2">
                  <span className="text-white font-mono text-sm">
                    {formatAddress(account)}
                  </span>
                </div>
              </>
            ) : (
              <Button
                onClick={connectWallet}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Network Warning */}
        {isConnected && !isCorrectNetwork && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-white font-semibold">Wrong Network</p>
                <p className="text-white/70 text-sm">
                  Please switch to Avalanche Fuji Testnet to continue
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Warning */}
        {isConnected && isCorrectNetwork && !isVerified && (
          <div className="mb-6 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-white font-semibold">KYC Verification Required</p>
                <p className="text-white/70 text-sm">
                  Your address needs to be verified by an admin to purchase bonds
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* USDC Balance */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm font-medium">USDC Balance</h3>
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              ${parseFloat(usdcBalance).toFixed(2)}
            </p>
            <p className="text-white/50 text-xs mt-2">Available for investment</p>
          </Card>

          {/* Bond Holdings */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm font-medium">Bond Holdings</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {parseFloat(bondBalance).toFixed(4)}
            </p>
            <p className="text-white/50 text-xs mt-2">GOI 2033 Tokens</p>
          </Card>

          {/* Claimable Yield */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm font-medium">Claimable Yield</h3>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              ${parseFloat(claimableYield).toFixed(2)}
            </p>
            <p className="text-white/50 text-xs mt-2">
              Current Rate: {yieldRate}%
            </p>
          </Card>
        </div>

        {/* Bond Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Available Bonds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GOI 2033 Bond */}
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md border-white/10 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">GOI 2033</h3>
                  <p className="text-white/70 text-sm">Government of India Bond</p>
                </div>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  {yieldRate}% APY
                </Badge>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-white/70 text-sm">Maturity</span>
                  <span className="text-white font-medium">2033</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-sm">Min Investment</span>
                  <span className="text-white font-medium">₹100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-sm">Risk Level</span>
                  <span className="text-green-400 font-medium">Low</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">
                    Amount (tokens)
                  </label>
                  <input
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="100"
                    disabled={!isConnected || !isVerified || !isCorrectNetwork}
                  />
                </div>
                <Button
                  onClick={handleBuyBond}
                  disabled={!isConnected || !isVerified || !isCorrectNetwork}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                >
                  BUY NOW
                </Button>
              </div>
            </Card>

            {/* Yield Claim Card */}
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-md border-white/10 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Claim Yield</h3>
                  <p className="text-white/70 text-sm">Your accumulated returns</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  USDC
                </Badge>
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <p className="text-white/70 text-sm mb-2">Available to Claim</p>
                <p className="text-4xl font-bold text-white">
                  ${parseFloat(claimableYield).toFixed(2)}
                </p>
              </div>

              <Button
                onClick={handleClaim}
                disabled={
                  !isConnected ||
                  !isCorrectNetwork ||
                  parseFloat(claimableYield) === 0
                }
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
              >
                CLAIM YIELD
              </Button>
            </Card>
          </div>
        </div>

        {/* Refresh Button */}
        {isConnected && (
          <div className="text-center">
            <Button
              onClick={refreshBalances}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Refresh Balances
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 backdrop-blur-md bg-white/5 mt-12">
        <div className="container mx-auto px-6 py-6 text-center">
          <p className="text-white/50 text-sm">
            Bondify - Democratizing Access to Government Bonds via Blockchain
          </p>
          <p className="text-white/30 text-xs mt-2">
            Powered by Avalanche Fuji • Secured by WeilChain
          </p>
        </div>
      </footer>
    </div>
  );
}