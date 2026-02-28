import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
    SERVICE_KEY_PREFIX: process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.substring(0, 20) + '...' : 'MISSING',
    PRIVATE_KEY: process.env.SERVER_WALLET_PRIVATE_KEY ? 'set (' + process.env.SERVER_WALLET_PRIVATE_KEY.substring(0, 6) + '...)' : 'MISSING',
    CONTRACT: process.env.RANCHLINKTAG_ADDRESS || 'MISSING',
    WALLET: process.env.SERVER_WALLET_ADDRESS || 'MISSING',
  })
}
