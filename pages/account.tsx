import { useState } from 'react';
import Layout from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Head from 'next/head';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { TrendingUp, UserPlus, MessageCircle, Wallet } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

import { Pencil, X, Check } from 'lucide-react';
import { useSignMessage } from '@privy-io/react-auth';

const mockENS = 'myaccount.fluxpool.eth';
const mockAddress = '0x0000...0000';
const mockProfile = {
  avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=myaccount.fluxpool.eth`,
  twitter: '@myaccount',
  description: 'This is your FluxPool account profile. You can manage your smart wallet and see your ENS info here.',
  website: 'https://fluxpool.xyz',
  email: 'me@fluxpool.xyz',
  location: 'Internet',
  github: 'myaccount',
  telegram: '@myaccount',
};

// --- Mock Data and Columns (reuse from TradingData) ---
function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
interface Trade {
  id: number;
  timestamp: Date;
  marketCap: string;
  amount: string;
  txHash: string;
  ens?: string;
  type: 'buy' | 'sell';
  price: string;
}
function randomTxHash() {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}
const tradeColumns: ColumnDef<Trade>[] = [
  { accessorKey: 'timestamp', header: () => 'Time', cell: ({ row }) => timeAgo(row.original.timestamp) },
  { accessorKey: 'type', header: () => 'Type', cell: ({ row }) => <span className={row.original.type === 'buy' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{row.original.type.toUpperCase()}</span> },
  { accessorKey: 'amount', header: () => 'Amount (ETH)' },
  { accessorKey: 'price', header: () => 'Price (USD)', cell: ({ row }) => `$${row.original.price}` },
  { accessorKey: 'marketCap', header: () => 'Market Cap' },
  { accessorKey: 'txHash', header: () => 'Transaction Hash', cell: ({ row }) => <span className="font-mono text-xs text-blue-400">{row.original.txHash.slice(0, 8) + '...' + row.original.txHash.slice(-6)}</span> },
];
function randomAmount() { return (Math.random() * 10).toFixed(3); }
function randomType() { return Math.random() > 0.5 ? 'buy' : 'sell'; }
function randomPrice() { return (2400 + Math.random() * 100).toFixed(2); }
function randomMarketCap() { const n = Math.floor(Math.random() * 100_000_000) + 1_000_000; return `$${n.toLocaleString()}`; }
function randomAddress() { return '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''); }
const mockTrades: Trade[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  timestamp: new Date(Date.now() - Math.floor(Math.random() * 60 * 60 * 1000)),
  marketCap: randomMarketCap(),
  amount: randomAmount(),
  txHash: randomTxHash(),
  type: randomType() as 'buy' | 'sell',
  price: randomPrice(),
}));

export default function AccountPage() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, ready, authenticated } = usePrivy();
  const { signMessage } = useSignMessage();
  // Editable profile state
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState({
    description: mockProfile.description,
    twitter: mockProfile.twitter,
    website: mockProfile.website,
    location: mockProfile.location,
    github: mockProfile.github,
    telegram: mockProfile.telegram,
  });
  const [savedFields, setSavedFields] = useState(fields);
  const [saving, setSaving] = useState(false);
  const handleFieldChange = (key: string, value: string) => {
    setFields(f => ({ ...f, [key]: value }));
  };
  const handleEdit = () => setEditing(true);
  const handleCancel = () => {
    setFields(savedFields);
    setEditing(false);
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const message = `Confirming update to my Fluxpool profile:\n${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
      await signMessage({ message });
      setSavedFields(fields);
      setEditing(false);
    } catch (err) {
      alert('Signature required to update profile.');
    } finally {
      setSaving(false);
    }
  };
  // Mock PnL and stats
  const pnl = Math.random() > 0.5 ? `+$${(Math.random() * 10000).toFixed(2)}` : `-$${(Math.random() * 10000).toFixed(2)}`;
  const followers = Math.floor(Math.random() * 1000);
  const following = Math.floor(Math.random() * 500);
  const userAddress = user?.wallet?.address || mockAddress;
  const handleGenerateWallet = () => {
    setLoading(true);
    setTimeout(() => {
      setWallet('0xFAKE1234...WALLET');
      setLoading(false);
    }, 1200);
  };
  return (
    <Layout accountId={mockENS} appName="My Account" navbarItems={[]}> 
      <Head>
        <title>My Account | FluxPool</title>
      </Head>
      <div className="flex flex-col items-center w-full">
        
      </div>
      <div className="flex flex-col md:flex-row gap-8 w-full mx-auto min-h-screen py-12 px-4 md:px-12">
        {/* Left: Profile Info */}
        <div className="w-full md:w-[35%] flex flex-col items-center md:items-start space-y-6">
          <Card className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-lg shadow-2xl rounded-2xl border-0">
            <CardContent className="flex flex-col items-center md:items-start space-y-4 p-6">
              <Avatar className="w-28 h-28 mb-2">
                <AvatarImage src={mockProfile.avatar} alt={mockENS} />
                <AvatarFallback>{mockENS.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-2xl font-bold text-gray-200">{mockENS}</span>
              <Badge variant="default" className="text-xs text-gray-400">{userAddress}</Badge>
              <span className="text-xs text-gray-400">{mockProfile.email}</span>
              <Button onClick={handleGenerateWallet} disabled={loading || !!wallet} className="w-full mt-2 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                {wallet ? 'Wallet Generated' : loading ? 'Generating...' : 'Generate Privy Smart Wallet'}
              </Button>
              {wallet && (
                <div className="w-full text-center mt-2">
                  <span className="text-green-500 font-mono text-sm text-gray-200">{wallet}</span>
                  <div className="text-xs text-gray-400 mt-1">(Mock wallet address)</div>
                </div>
              )}
              <Separator className="my-2 bg-muted" />
              <div className="w-full space-y-1">
                <ProfileFieldBlock
                  label="Description"
                  value={fields.description}
                  savedValue={savedFields.description}
                  editing={editing}
                  onChange={v => handleFieldChange('description', v)}
                />
                <ProfileFieldBlock
                  label="Twitter"
                  value={fields.twitter}
                  savedValue={savedFields.twitter}
                  editing={editing}
                  onChange={v => handleFieldChange('twitter', v)}
                />
                <ProfileFieldBlock
                  label="Website"
                  value={fields.website}
                  savedValue={savedFields.website}
                  editing={editing}
                  onChange={v => handleFieldChange('website', v)}
                />
                <ProfileFieldBlock
                  label="Location"
                  value={fields.location}
                  savedValue={savedFields.location}
                  editing={editing}
                  onChange={v => handleFieldChange('location', v)}
                />
                <ProfileFieldBlock
                  label="GitHub"
                  value={fields.github}
                  savedValue={savedFields.github}
                  editing={editing}
                  onChange={v => handleFieldChange('github', v)}
                />
                <ProfileFieldBlock
                  label="Telegram"
                  value={fields.telegram}
                  savedValue={savedFields.telegram}
                  editing={editing}
                  onChange={v => handleFieldChange('telegram', v)}
                />
              </div>
              <div className="flex gap-2 mt-3 w-full justify-end">
                {!editing && (
                  <Button size="sm" variant="outline" onClick={handleEdit} className="text-violet-400 border-violet-400/40">Edit</Button>
                )}
                {editing && (
                  <>
                    <Button size="sm" variant="default" onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className="text-gray-400 border-gray-400/40">Cancel</Button>
                  </>
                )}
              </div>
              <Separator className="my-2 bg-muted" />
              <div className="flex gap-4 text-xs text-gray-400">
                <span><b>{followers}</b> Followers</span>
                <span><b>{following}</b> Following</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>PnL: <span className={pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'}>{pnl}</span></span>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Right: Activity Feed */}
        <div className="flex flex-col space-y-6 w-full md:w-[65%]">
          <Card className="w-full rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-200">Trading Activity</h3>
              </div>
              <DataTable columns={tradeColumns} data={mockTrades} />
            </CardContent>
          </Card>
          <Card className="w-full rounded-2xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-200">Friends</h3>
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=fakefriend${i}`} />
                      <AvatarFallback>FF{i+1}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs mt-1 text-gray-200">friend{i+1}.fluxpool.eth</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function ProfileFieldBlock({ label, value, savedValue, editing, onChange }: {
  label: string;
  value: string;
  savedValue: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between w-full gap-1">
      <span className="text-muted-foreground text-sm text-gray-400 min-w-[80px] flex-shrink-0">{label}</span>
      {editing ? (
        <input
          className="rounded bg-white/10 border border-white/20 px-2 py-1 text-white text-sm flex-1 min-w-0"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus={label === 'Description'}
        />
      ) : (
        <div className="flex flex-row-reverse items-center gap-1 flex-1">
          {label === 'Description' ? (
            <span className="text-sm font-medium text-right whitespace-pre-line break-words max-w-[60%] text-gray-200 flex-1">{savedValue}</span>
          ) : (
            <span className="text-sm font-medium text-right truncate max-w-[60%] text-gray-200 flex-1">{savedValue}</span>
          )}
        </div>
      )}
    </div>
  );
}