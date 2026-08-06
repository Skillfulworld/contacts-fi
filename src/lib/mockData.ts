export const MOCK_CONTACTS = [
  {
    id: '1',
    name: 'Alice Johnson',
    defaultProvider: 'Bitget Wallet',
    color: 'bg-purple-500',
    initials: 'AJ',
    notes: 'Primary agent for DeFi operations.',
    wallets: [
      {
  id: 'w1',
  provider: 'Bitget Wallet',
  name: 'Main Wallet',
  address: '0xd787C011AE6d457B97Bf8D67e0BE85b149b01AB5',
  isDefault: true
},
      { id: 'w2', provider: 'MetaMask', name: 'Secondary', address: '0x12A...9B2C', isDefault: false }
    ],
    health: ['Verified', 'EOA Wallet', 'Active'],
    transactions: [
      { id: 't1', type: 'sent', amount: '150.00 USDC', date: '2 hours ago', status: 'Success' },
      { id: 't2', type: 'received', amount: '50.00 USDC', date: 'Yesterday', status: 'Success' }
    ]
  },
  {
    id: '2',
    name: 'Bob Smith',
    defaultProvider: 'MetaMask',
    color: 'bg-blue-500',
    initials: 'BS',
    notes: 'Software engineer at Arc Network.',
    wallets: [
      { id: 'w3', provider: 'MetaMask', name: 'Bob-ETH', address: '0x3D2...F512', isDefault: true }
    ],
    health: ['Smart Contract', 'Fresh Wallet'],
    transactions: [
      { id: 't3', type: 'received', amount: '1,200.00 USDC', date: 'Oct 28', status: 'Success' }
    ]
  },
  {
    id: '3',
    name: 'Charlie Davis',
    defaultProvider: 'Phantom',
    color: 'bg-orange-500',
    initials: 'CD',
    notes: 'Early tester for Contacts-Fi.',
    wallets: [
      { id: 'w4', provider: 'Phantom', name: 'Solana Dev', address: '9xJk...Lp09', isDefault: true }
    ],
    health: ['Exchange', 'Verified'],
    transactions: []
  }
];

export const ALL_TRANSACTIONS = [
  { id: 't1', type: 'sent', amount: '150.00 USDC', contact: 'Alice Johnson', date: '2 hours ago', status: 'Success', wallet: 'Bitget Wallet' },
  { id: 't2', type: 'received', amount: '50.00 USDC', contact: 'Alice Johnson', date: 'Yesterday', status: 'Success', wallet: 'Bitget Wallet' },
  { id: 't3', type: 'received', amount: '1,200.00 USDC', contact: 'Bob Smith', date: 'Oct 28', status: 'Success', wallet: 'MetaMask' },
  { id: 't4', type: 'sent', amount: '10.50 USDC', contact: 'Unknown', date: 'Oct 25', status: 'Failed', wallet: 'Bitget Wallet' }
];
