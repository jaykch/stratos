import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, Users, Wallet, BarChart3, Trophy, Share2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { getENSorAddress } from "@/lib/ens";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

// Helper for time ago
function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// Generate a random Ethereum transaction hash
function randomTxHash() {
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

// Generate a random market cap
function randomMarketCap() {
  const n = Math.floor(Math.random() * 100_000_000) + 1_000_000;
  return `$${n.toLocaleString()}`;
}

// Generate a random amount
function randomAmount() {
  return (Math.random() * 10).toFixed(3);
}

// Generate a random type
function randomType() {
  return Math.random() > 0.5 ? "buy" : "sell";
}

// Generate a random price
function randomPrice() {
  return (2400 + Math.random() * 100).toFixed(2);
}

// Trade type
interface Trade {
  id: number;
  timestamp: Date;
  marketCap: string;
  amount: string;
  txHash: string;
  ens?: string;
  type: "buy" | "sell";
  price: string;
}

const tradeColumns: ColumnDef<Trade>[] = [
  {
    accessorKey: "timestamp",
    header: () => "Time",
    cell: ({ row }) => timeAgo(row.original.timestamp),
  },
  {
    accessorKey: "type",
    header: () => "Type",
    cell: ({ row }) => (
      <span className={row.original.type === "buy" ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
        {row.original.type.toUpperCase()}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: () => "Amount (ETH)",
    cell: ({ row }) => row.original.amount,
  },
  {
    accessorKey: "price",
    header: () => "Price (USD)",
    cell: ({ row }) => `$${row.original.price}`,
  },
  {
    accessorKey: "marketCap",
    header: () => "Market Cap",
    cell: ({ row }) => row.original.marketCap,
  },
  {
    accessorKey: "ens",
    header: () => "User Address",
    cell: ({ row }) => {
      const ens = row.original.ens;
      // If ENS is present, show as link, else show a fake address
      if (ens) {
        return (
          <Link href={`/profile/${ens}`} className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors font-mono text-xs">
            {ens}
          </Link>
        );
      } else {
        // Fallback: show a fake address
        return <span className="font-mono text-xs text-gray-400">0x{row.original.txHash.slice(2, 10)}...{row.original.txHash.slice(-6)}</span>;
      }
    },
  },
  {
    accessorKey: "txHash",
    header: () => "Transaction Hash",
    cell: ({ row }) => {
      const txHash = row.original.txHash;
      return (
        <span className="font-mono text-xs text-blue-400">{txHash.slice(0, 8) + "..." + txHash.slice(-6)}</span>
      );
    },
  },
];

// List of ridiculous and humorous fake ENS names (now .fluxpool.eth)
const fakeENSNames = [
  "rugpullmaster.fluxpool.eth", "rektwizard.fluxpool.eth", "notyourkeys.fluxpool.eth", "vitalikbuterinbutnot.fluxpool.eth", "sushiswapfan.fluxpool.eth", "defi_dj.fluxpool.eth", "gwei_boi.fluxpool.eth", "hodlmybeer.fluxpool.eth", "ape4life.fluxpool.eth", "fomo.soon.fluxpool.eth", "paperhands.fluxpool.eth", "diamondhandz.fluxpool.eth", "gasguzzler.fluxpool.eth", "ponziplay.fluxpool.eth", "exitliquidity.fluxpool.eth", "safemoonbag.fluxpool.eth", "yolotrader.fluxpool.eth", "gmgn.fluxpool.eth", "to_the_moon.fluxpool.eth", "rektagain.fluxpool.eth", "whalealert.fluxpool.eth"
];

// --- Spot, Curve, Limit Positions Columns ---
interface Position {
  id: number;
  symbol: string;
  type: string;
  size: string;
  entry: string;
  current: string;
  pnl: string;
  pnlPercent: string;
  curve?: string; // Add curve field
}
const spotColumns: ColumnDef<Position>[] = [
  { accessorKey: "symbol", header: () => "Symbol" },
  { accessorKey: "type", header: () => "Type" },
  { accessorKey: "size", header: () => "Size" },
  { accessorKey: "entry", header: () => "Entry" },
  { accessorKey: "current", header: () => "Current" },
  { accessorKey: "pnl", header: () => "PnL", cell: ({ row }) => <span className={row.original.pnl.startsWith("+") ? "text-green-400" : "text-red-400"}>{row.original.pnl}</span> },
  { accessorKey: "pnlPercent", header: () => "%" },
  // Add Close column
  {
    id: "close",
    header: () => "",
    cell: ({ row }) => (
      <Button
        size="sm"
        className="bg-purple-500/20 text-white border border-purple-400/20 shadow rounded-lg px-3 py-1 hover:bg-purple-500/40 transition-all"
        onClick={() => alert(`Close position: ${row.original.symbol} (id: ${row.original.id})`)}
      >
        Close
      </Button>
    ),
    enableSorting: false,
  },
];
// Curve columns: add curve name as first column
const curveColumns: ColumnDef<Position>[] = [
  { accessorKey: "curve", header: () => "Curve" },
  ...spotColumns,
];

// --- Holders Columns ---
interface Holder {
  id: number;
  address: string;
  holding: string;
  avgBuy: string;
  avgSold: string;
  positionSize: string;
  ethBalance: string;
  pnl: string;
  soldPercent: number;
}
// Helper for colored progress bar
function ColoredProgress({ value, positive }: { value: number; positive: boolean }) {
  return (
    <div className="flex-1">
      <Progress
        value={value}
        className={`h-3 bg-white/20 border border-white/20 shadow-inner rounded-full`}
        style={{}}
        children={<div className={`h-full w-full flex-1 rounded-full ${positive ? 'bg-green-400' : 'bg-red-400'} bg-opacity-80 shadow-md transition-all`} style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />}
      />
    </div>
  );
}
const holdersColumns: ColumnDef<Holder>[] = [
  { accessorKey: "address", header: () => "Address", cell: ({ row }) => (
    <Link href={`/profile/${row.original.address}`} className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors">
      {row.original.address}
    </Link>
  ) },
  { accessorKey: "avgBuy", header: () => "Avg Buy" },
  { accessorKey: "avgSold", header: () => "Avg Sold" },
  { accessorKey: "positionSize", header: () => "Position Size" },
  { accessorKey: "ethBalance", header: () => "ETH Balance" },
  { accessorKey: "pnl", header: () => "PnL", cell: ({ row }) => <span className={row.original.pnl.startsWith("+") ? "text-green-400" : "text-red-400"}>{row.original.pnl}</span> },
  { accessorKey: "soldPercent", header: () => "Sold %", cell: ({ row }) => (
    <div className="flex items-center space-x-2 w-40">
      <ColoredProgress value={row.original.soldPercent} positive={row.original.pnl.startsWith("+")} />
      <span className="text-xs text-gray-400 w-8 text-left">{row.original.positionSize}</span>
    </div>
  ) },
];

// --- Top Traders Columns ---
interface TopTrader {
  rank: number;
  wallet: string;
  balance: string;
  bought: string;
  sold: string;
  pnl: string;
  pnlPercent: string;
  remaining: string;
}
const topTradersColumns: ColumnDef<TopTrader>[] = [
  { accessorKey: "rank", header: () => "#" },
  { accessorKey: "wallet", header: () => "Wallet", cell: ({ row }) => (
    <Link href={`/profile/${row.original.wallet}`} className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors">
      {row.original.wallet}
    </Link>
  ) },
  { accessorKey: "balance", header: () => "ETH Balance" },
  { accessorKey: "bought", header: () => "Bought (Avg Buy)" },
  { accessorKey: "sold", header: () => "Sold (Avg Sell)" },
  { accessorKey: "pnl", header: () => "PnL", cell: ({ row }) => <span className={row.original.pnl.startsWith("+") ? "text-green-400" : "text-red-400"}>{row.original.pnl}</span> },
  { accessorKey: "pnlPercent", header: () => "%", cell: ({ row }) => <span className={row.original.pnlPercent.startsWith("+") ? "text-green-400" : "text-red-400"}>{row.original.pnlPercent}</span> },
];

// --- Mock Data ---
const mockSpotPositions: Position[] = [
  { id: 1, symbol: "ETH/USDT", type: "Long", size: "2.45 ETH", entry: "$2,400.00", current: "$2,450.00", pnl: "+$122.50", pnlPercent: "+2.08%" },
  { id: 2, symbol: "BTC/USDT", type: "Short", size: "0.15 BTC", entry: "$43,200.00", current: "$43,000.00", pnl: "+$30.00", pnlPercent: "+0.46%" },
  { id: 3, symbol: "UNI/USDT", type: "Long", size: "150 UNI", entry: "$6.50", current: "$7.85", pnl: "+$202.50", pnlPercent: "+20.77%" },
];
const mockCurveNames = ["Uniswap V3", "Curve.fi", "Balancer", "SushiSwap", "PancakeSwap"];
const mockCurvePositions = mockSpotPositions.map((p, i) => ({ ...p, type: "Curve", curve: mockCurveNames[i % mockCurveNames.length] }));

const mockHolders: Holder[] = Array.from({ length: 10 }, (_, i) => {
  const sold = Math.floor(Math.random() * 100);
  const holding = 100 - sold;
  const ens = fakeENSNames[Math.floor(Math.random() * fakeENSNames.length)] || `trader${i}.fluxpool.eth`;
  // Alternate positive/negative PnL for realism
  const isNegative = i % 3 === 0;
  return {
    id: i + 1,
    address: ens,
    holding: `${holding} ETH`,
    avgBuy: `$${(2000 + Math.random() * 1000).toFixed(2)}`,
    avgSold: `$${(2000 + Math.random() * 1000).toFixed(2)}`,
    positionSize: `${(Math.random() * 100).toFixed(2)} ETH`,
    ethBalance: `${(Math.random() * 100).toFixed(2)}`,
    pnl: (isNegative ? "-" : "+") + "$" + (Math.random() * 10000).toFixed(2),
    soldPercent: sold,
  };
});

const mockTopTraders: TopTrader[] = Array.from({ length: 20 }, (_, i) => {
  const rank = i + 1;
  // Use a random fake ENS name or fallback
  const wallet = fakeENSNames[i % fakeENSNames.length] || `trader${i}.fluxpool.eth`;
  const balance = (Math.random() * 500).toFixed(2);
  const bought = `$${(Math.random() * 10000).toFixed(2)}K (${(Math.random() * 1000).toFixed(1)}M / ${Math.floor(Math.random() * 10) + 1})`;
  const sold = `$${(Math.random() * 20000).toFixed(2)}K (${(Math.random() * 1000).toFixed(1)}M / ${Math.floor(Math.random() * 100) + 1})`;
  let pnl, pnlPercent;
  if (i < 5) {
    // Top 5 always positive
    pnl = "+$" + (Math.random() * 10000 + 1000).toFixed(2);
    pnlPercent = "+" + (Math.random() * 30 + 10).toFixed(2) + "%";
  } else {
    const isPositive = Math.random() > 0.2;
    pnl = (isPositive ? "+" : "-") + "$" + (Math.random() * 10000).toFixed(2);
    pnlPercent = (isPositive ? "+" : "-") + (Math.random() * 30).toFixed(2) + "%";
  }
  const remaining = `$${(Math.random() * 5000).toFixed(1)} (${Math.floor(Math.random() * 100)}%)`;
  return { rank, wallet, balance, bought, sold, pnl, pnlPercent, remaining };
});

export { topTradersColumns, mockTopTraders };
export default function TradingData() {
  const [tab, setTab] = useState("trades");
  const [trades, setTrades] = useState<Trade[]>([]);
  const tradeId = useRef(1);

  // --- Broadcast Modal State (now inside component) ---
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastPos, setBroadcastPos] = useState<Position | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastConfirmed, setBroadcastConfirmed] = useState(false);

  function openBroadcast(pos: Position) {
    setBroadcastPos(pos);
    setBroadcastOpen(true);
    setBroadcastMsg('');
    setBroadcastConfirmed(false);
  }
  function closeBroadcast() {
    setBroadcastOpen(false);
    setBroadcastPos(null);
    setBroadcastMsg('');
    setBroadcastConfirmed(false);
  }
  function handleBroadcast() {
    if (broadcastPos && broadcastMsg.trim()) {
      const prev = JSON.parse(localStorage.getItem('fluxpool-broadcasts') || '[]');
      prev.push({
        pos: broadcastPos,
        message: broadcastMsg,
        time: new Date().toISOString(),
      });
      localStorage.setItem('fluxpool-broadcasts', JSON.stringify(prev));
      setBroadcastConfirmed(true);
      setTimeout(() => {
        closeBroadcast();
      }, 1500);
    }
  }

  // Add Share column to spot and curve columns
  const shareColumn = {
    id: 'share',
    header: () => '',
    cell: ({ row }: any) => (
      <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={() => openBroadcast(row.original)}>
        <Share2 className="h-4 w-4" />
      </Button>
    ),
    enableSorting: false,
  };
  const spotColumnsWithShare = [...spotColumns, shareColumn];
  const curveColumnsWithShare = [...curveColumns, shareColumn];

  // Helper to create a fake trade
  function createFakeTrade(id: number): Trade {
    const txHash = randomTxHash();
    const type = randomType() as "buy" | "sell";
    let ens: string | undefined = undefined;
    if (Math.random() < 0.17) {
      ens = fakeENSNames[Math.floor(Math.random() * fakeENSNames.length)];
    }
    return {
      id,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 60 * 1000)), // up to 1 min ago
      marketCap: randomMarketCap(),
      amount: randomAmount(),
      txHash,
      type,
      price: randomPrice(),
      ens,
    };
  }

  useEffect(() => {
    // Prefill with 20 trades
    setTrades(Array.from({ length: 20 }, (_, i) => createFakeTrade(i + 1)).reverse());
    tradeId.current = 21;
  }, []);

  // Add a new fake trade every 1-3 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    function addTrade() {
      const trade = createFakeTrade(tradeId.current++);
      setTrades((prev) => [trade, ...prev.slice(0, 49)]); // keep max 50
      timeout = setTimeout(addTrade, 1000 + Math.random() * 2000);
    }
    addTrade();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col flex-1 px-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full flex flex-col flex-1 min-h-0">
        <TabsList className="grid w-full grid-cols-5 gap-1 text-xs h-9 bg-violet-500/30 backdrop-blur-lg shadow-2xl rounded-2xl text-white">
          <TabsTrigger value="trades" className="px-2 py-1 h-8 text-white hover:bg-violet-500/40 focus:bg-violet-500/50 rounded-xl transition-colors"> <TrendingUp className="h-3 w-3 mr-1" /> Trades </TabsTrigger>
          <TabsTrigger value="spot" className="px-2 py-1 h-8 text-white hover:bg-violet-500/40 focus:bg-violet-500/50 rounded-xl transition-colors"> <BarChart3 className="h-3 w-3 mr-1" /> Spot Positions </TabsTrigger>
          <TabsTrigger value="curve" className="px-2 py-1 h-8 text-white hover:bg-violet-500/40 focus:bg-violet-500/50 rounded-xl transition-colors"> <Wallet className="h-3 w-3 mr-1" /> Curve Positions </TabsTrigger>
          <TabsTrigger value="holders" className="px-2 py-1 h-8 text-white hover:bg-violet-500/40 focus:bg-violet-500/50 rounded-xl transition-colors"> <Users className="h-3 w-3 mr-1" /> Holders </TabsTrigger>
          <TabsTrigger value="traders" className="px-2 py-1 h-8 text-white hover:bg-violet-500/40 focus:bg-violet-500/50 rounded-xl transition-colors"> <Trophy className="h-3 w-3 mr-1" /> Top Traders </TabsTrigger>
        </TabsList>

        <TabsContent value="trades" className="mt-4 flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-h-0">
            <DataTable columns={tradeColumns} data={trades} />
          </div>
        </TabsContent>
        <TabsContent value="spot" className="mt-4 flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-h-0">
            <DataTable columns={spotColumnsWithShare} data={mockSpotPositions} />
          </div>
        </TabsContent>
        <TabsContent value="curve" className="mt-4 flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-h-0">
            <DataTable columns={curveColumnsWithShare} data={mockCurvePositions} />
          </div>
        </TabsContent>
        <TabsContent value="holders" className="mt-4 flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-h-0">
            <DataTable columns={holdersColumns} data={mockHolders} />
          </div>
        </TabsContent>
        <TabsContent value="traders" className="mt-4 flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-h-0">
            <DataTable columns={topTradersColumns} data={mockTopTraders} />
          </div>
        </TabsContent>
      </Tabs>
      {/* Broadcast Modal */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-lg border-0 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><Share2 className="h-5 w-5" /> Share Position as Broadcast</DialogTitle>
          </DialogHeader>
          {broadcastConfirmed ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-green-400 text-2xl mb-2">Broadcast shared!</div>
              <div className="text-gray-300 text-sm">Your position has been shared as a broadcast.</div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 mt-2">
                <textarea
                  className="w-full rounded-lg bg-white/10 text-white p-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none min-h-[80px]"
                  placeholder={`Share your thoughts about ${broadcastPos?.symbol || ''}...`}
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  maxLength={240}
                  disabled={broadcastConfirmed}
                />
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{broadcastMsg.length}/240</span>
                  <DialogClose asChild>
                    <Button variant="ghost" className="text-gray-400" disabled={broadcastConfirmed}>Cancel</Button>
                  </DialogClose>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleBroadcast} disabled={!broadcastMsg.trim() || broadcastConfirmed} className="bg-gradient-to-br from-violet-500/60 to-fuchsia-500/60 text-white font-semibold shadow">Share Broadcast</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 