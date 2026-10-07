/**
 * On-chain transaction indexer for Arc Mainnet.
 * Reads USDC Transfer events and SettleXPoints CheckedIn events
 * for a given wallet address and upserts them into Supabase.
 *
 * Called server-side only (API routes / background jobs).
 */
import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem'
import { supabaseAdmin } from './supabase'

const ARC_MAINNET_RPC = 'https://rpc.mainnet.arc.io'
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const
const SETTLEX_POINTS_ADDRESS = '0xaf75c1b6EDeE3Cf03FF1282145dD7878EcFfB7B0' as const
const ARC_CHAIN_ID = 5042

// Look back up to ~7 days of blocks (Arc ~1s block time = ~604800 blocks)
const MAX_LOOKBACK_BLOCKS = 604_800n

const client = createPublicClient({
  transport: http(ARC_MAINNET_RPC),
  chain: {
    id: ARC_CHAIN_ID,
    name: 'Arc Mainnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: { default: { http: [ARC_MAINNET_RPC] } },
  },
})

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
)

const CHECKED_IN_EVENT = parseAbiItem(
  'event CheckedIn(address indexed user, uint256 day, uint256 points, uint256 streak, uint256 totalPoints, uint256 timestamp)'
)

export async function indexWalletTransactions(walletAddress: string) {
  const wallet = walletAddress.toLowerCase()

  try {
    const latestBlock = await client.getBlockNumber()
    const fromBlock = latestBlock > MAX_LOOKBACK_BLOCKS
      ? latestBlock - MAX_LOOKBACK_BLOCKS
      : 0n

    // Fetch outgoing USDC transfers (sends)
    const sendLogs = await client.getLogs({
      address: USDC_ADDRESS,
      event: TRANSFER_EVENT,
      args: { from: wallet as `0x${string}` },
      fromBlock,
      toBlock: latestBlock,
    })

    // Fetch incoming USDC transfers (receives)
    const receiveLogs = await client.getLogs({
      address: USDC_ADDRESS,
      event: TRANSFER_EVENT,
      args: { to: wallet as `0x${string}` },
      fromBlock,
      toBlock: latestBlock,
    })

    // Fetch check-in events
    const checkInLogs = await client.getLogs({
      address: SETTLEX_POINTS_ADDRESS,
      event: CHECKED_IN_EVENT,
      args: { user: wallet as `0x${string}` },
      fromBlock,
      toBlock: latestBlock,
    })

    const rows: Record<string, unknown>[] = []

    for (const log of sendLogs) {
      const block = await client.getBlock({ blockNumber: log.blockNumber })
      const amount = parseFloat(formatUnits(log.args.value ?? 0n, 6))
      rows.push({
        wallet_address: wallet,
        tx_hash: log.transactionHash,
        chain_id: ARC_CHAIN_ID,
        tx_type: 'send',
        amount,
        token_symbol: 'USDC',
        from_address: log.args.from?.toLowerCase(),
        to_address: log.args.to?.toLowerCase(),
        block_number: Number(log.blockNumber),
        block_timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
        status: 'success',
      })
    }

    for (const log of receiveLogs) {
      // Skip self-sends and contract interactions already captured
      if (log.args.from?.toLowerCase() === wallet) continue
      const block = await client.getBlock({ blockNumber: log.blockNumber })
      const amount = parseFloat(formatUnits(log.args.value ?? 0n, 6))
      rows.push({
        wallet_address: wallet,
        tx_hash: log.transactionHash,
        chain_id: ARC_CHAIN_ID,
        tx_type: 'receive',
        amount,
        token_symbol: 'USDC',
        from_address: log.args.from?.toLowerCase(),
        to_address: log.args.to?.toLowerCase(),
        block_number: Number(log.blockNumber),
        block_timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
        status: 'success',
      })
    }

    for (const log of checkInLogs) {
      const block = await client.getBlock({ blockNumber: log.blockNumber })
      rows.push({
        wallet_address: wallet,
        tx_hash: log.transactionHash,
        chain_id: ARC_CHAIN_ID,
        tx_type: 'checkin',
        amount: 0.01,
        token_symbol: 'USDC',
        from_address: wallet,
        to_address: SETTLEX_POINTS_ADDRESS.toLowerCase(),
        block_number: Number(log.blockNumber),
        block_timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
        status: 'success',
        metadata: {
          points: Number(log.args.points ?? 0n),
          streak: Number(log.args.streak ?? 0n),
          totalPoints: Number(log.args.totalPoints ?? 0n),
        },
      })
    }

    if (rows.length === 0) return

    // Upsert — ignore duplicates by (tx_hash, chain_id)
    const { error } = await supabaseAdmin
      .from('onchain_transactions')
      .upsert(rows, { onConflict: 'tx_hash,chain_id', ignoreDuplicates: true })

    if (error) console.error('indexer upsert error', error)
  } catch (err) {
    console.error('indexer error for', wallet, err)
  }
}
