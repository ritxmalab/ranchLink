import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { mintTag as mintTagUnified } from '@/lib/blockchain/mintTag'
import { getDefaultCattleContract } from '@/lib/blockchain/contractRegistry'

/**
 * POST /api/retry-mint
 * Retry minting for a tag that failed to mint initially
 * 
 * Request body:
 * {
 *   tagCode: string (e.g., "RL-001")
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tagCode } = body

    if (!tagCode) {
      return NextResponse.json(
        { error: 'tagCode is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()

    // 1. Get tag from database
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id, tag_code, token_id, mint_tx_hash, contract_address, chain, batch_id, animal_id')
      .eq('tag_code', tagCode)
      .single()

    if (tagError || !tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // 2. Check if tag already has token_id
    if (tag.token_id) {
      return NextResponse.json({
        success: true,
        message: 'Tag already has token_id',
        tag_code: tag.tag_code,
        token_id: tag.token_id,
        mint_tx_hash: tag.mint_tx_hash,
      })
    }

    // 3. Get batch info to generate public_id if needed
    let publicId = `AUS${tag.tag_code.replace('RL-', '').padStart(4, '0')}`
    
    if (tag.batch_id) {
      const { data: batch } = await supabase
        .from('batches')
        .select('name')
        .eq('id', tag.batch_id)
        .single()
      
      // Try to get public_id from animal if tag is attached
      if (tag.animal_id) {
        const { data: animal } = await supabase
          .from('animals')
          .select('public_id')
          .eq('id', tag.animal_id)
          .single()
        
        if (animal?.public_id) {
          publicId = animal.public_id
        }
      }
    }

    // 4. Get contract address
    const contract = await getDefaultCattleContract()
    let contractAddress = contract?.contract_address || process.env.RANCHLINKTAG_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_TAG || ''
    
    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address not configured' },
        { status: 500 }
      )
    }

    // 5. Pre-flight checks
    const checks: string[] = []
    const errors: string[] = []

    // Check environment variables
    if (!process.env.SERVER_WALLET_PRIVATE_KEY) {
      errors.push('Missing SERVER_WALLET_PRIVATE_KEY environment variable')
    } else {
      checks.push('✓ SERVER_WALLET_PRIVATE_KEY is set')
    }

    if (!contractAddress) {
      errors.push('Missing contract address (RANCHLINKTAG_ADDRESS or NEXT_PUBLIC_CONTRACT_TAG)')
    } else {
      checks.push(`✓ Contract address: ${contractAddress}`)
    }

    if (!process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC && !process.env.ALCHEMY_BASE_RPC) {
      errors.push('Missing RPC URL (NEXT_PUBLIC_ALCHEMY_BASE_RPC or ALCHEMY_BASE_RPC)')
    } else {
      checks.push('✓ RPC URL is set')
    }

    // Check wallet balance (if we can)
    try {
      const { createPublicClient, http, formatEther } = await import('viem')
      const { base } = await import('@/lib/blockchain/config')
      const serverWalletAddress = process.env.SERVER_WALLET_ADDRESS || '0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83'
      
      const publicClient = createPublicClient({
        chain: base,
        transport: http(process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC || process.env.ALCHEMY_BASE_RPC || 'https://mainnet.base.org'),
      })

      const balance = await publicClient.getBalance({ address: serverWalletAddress as `0x${string}` })
      const balanceEth = formatEther(balance)
      checks.push(`✓ Server wallet balance: ${balanceEth} ETH`)
      
      // Base mainnet gas is very cheap (~$0.01-0.05 per mint)
      // Minimum balance: 0.0001 ETH should be enough for 1-2 mints
      if (parseFloat(balanceEth) < 0.0001) {
        errors.push(`Insufficient balance: ${balanceEth} ETH (need at least 0.0001 ETH for gas)`)
      } else if (parseFloat(balanceEth) < 0.001) {
        // Warn but don't block if balance is low but above minimum
        checks.push(`⚠️ Low balance: ${balanceEth} ETH (recommended: 0.001+ ETH for multiple mints)`)
      }
    } catch (balanceError: any) {
      console.warn('Could not check wallet balance:', balanceError.message)
      checks.push(`⚠ Could not check balance: ${balanceError.message}`)
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Pre-flight checks failed',
          checks,
          errors,
          tag_code: tag.tag_code,
        },
        { status: 500 }
      )
    }

    // 6. Try to mint
    let tokenId: bigint | null = null
    let mintTxHash: string | null = null
    let cid: string = ''

    try {
      // Pin metadata to IPFS (optional)
      try {
        const { pinAnimalMetadata } = await import('@/lib/ipfs/client')
        cid = await pinAnimalMetadata({
          public_id: publicId,
          tag_code: tag.tag_code,
          batch_name: 'Retry Mint',
          material: 'PETG',
          model: 'BASIC_QR',
          color: 'Default',
          chain: tag.chain || 'BASE',
        })
        checks.push('✓ IPFS metadata pinned')
      } catch (ipfsError: any) {
        console.warn(`IPFS pin failed for ${tag.tag_code}, continuing without CID:`, ipfsError)
        checks.push(`⚠ IPFS pin failed: ${ipfsError.message}`)
        // Continue without CID
      }

      // Mint the NFT
      console.log(`Attempting to mint tag ${tag.tag_code} with publicId ${publicId}...`)
      const mintResult = await mintTagUnified({
        tagCode: tag.tag_code,
        publicId,
        cid,
        assetType: 'cattle',
      })

      tokenId = mintResult.tokenId
      mintTxHash = mintResult.txHash
      checks.push(`✓ Mint transaction sent: ${mintTxHash}`)
      checks.push(`✓ Token ID retrieved: ${tokenId.toString()}`)

      // Update contract_address if different
      if (mintResult.contractAddress && mintResult.contractAddress !== contractAddress) {
        contractAddress = mintResult.contractAddress
        await supabase
          .from('tags')
          .update({ contract_address: contractAddress })
          .eq('id', tag.id)
      }

      // Update tag with token ID and transaction hash
      const { error: updateError } = await supabase
        .from('tags')
        .update({
          token_id: tokenId ? tokenId.toString() : null,
          mint_tx_hash: mintTxHash,
        })
        .eq('id', tag.id)

      if (updateError) {
        console.error('Failed to update tag in database:', updateError)
        checks.push(`⚠ Database update failed: ${updateError.message}`)
      } else {
        checks.push('✓ Tag updated in database')
      }

      return NextResponse.json({
        success: true,
        message: 'Tag minted successfully',
        tag_code: tag.tag_code,
        token_id: tokenId.toString(),
        mint_tx_hash: mintTxHash,
        contract_address: contractAddress,
        basescan_url: `https://basescan.org/token/${contractAddress}?a=${tokenId.toString()}`,
        checks,
      })
    } catch (mintError: any) {
      console.error(`Failed to mint tag ${tag.tag_code}:`, mintError)
      
      // Extract more detailed error information
      let errorMessage = mintError.message || 'Unknown error'
      let errorCode = 'UNKNOWN'
      
      if (mintError.message?.includes('insufficient funds')) {
        errorCode = 'INSUFFICIENT_FUNDS'
        errorMessage = 'Server wallet has insufficient ETH for gas fees'
      } else if (mintError.message?.includes('MINTER_ROLE')) {
        errorCode = 'MINTER_ROLE_MISSING'
        errorMessage = 'Server wallet does not have MINTER_ROLE on the contract'
      } else if (mintError.message?.includes('duplicate') || mintError.message?.includes('already minted')) {
        errorCode = 'DUPLICATE_MINT'
        errorMessage = 'This public_id has already been minted'
      } else if (mintError.message?.includes('network') || mintError.message?.includes('RPC')) {
        errorCode = 'RPC_ERROR'
        errorMessage = 'Failed to connect to blockchain RPC endpoint'
      }
      
      return NextResponse.json(
        {
          error: 'Failed to mint tag',
          error_code: errorCode,
          message: errorMessage,
          tag_code: tag.tag_code,
          checks,
          details: process.env.NODE_ENV === 'development' ? mintError.stack : undefined,
          full_error: process.env.NODE_ENV === 'development' ? String(mintError) : undefined,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Retry mint error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to retry mint',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/retry-mint?tagCode=RL-001
 * Get status of a tag (check if it needs minting)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tagCode = searchParams.get('tagCode')

    if (!tagCode) {
      return NextResponse.json(
        { error: 'tagCode query parameter is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()

    const { data: tag, error } = await supabase
      .from('tags')
      .select('tag_code, token_id, mint_tx_hash, contract_address, chain, status, animal_id')
      .eq('tag_code', tagCode)
      .single()

    if (error || !tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      tag_code: tag.tag_code,
      has_token_id: !!tag.token_id,
      token_id: tag.token_id,
      mint_tx_hash: tag.mint_tx_hash,
      contract_address: tag.contract_address,
      chain: tag.chain,
      status: tag.status,
      is_attached: !!tag.animal_id,
      needs_minting: !tag.token_id,
      on_chain_status: tag.token_id && tag.contract_address ? 'on-chain' : 'off-chain',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to get tag status',
      },
      { status: 500 }
    )
  }
}

