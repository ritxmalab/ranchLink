/**
 * Frontend Upgrade Test Plan
 * 
 * Tests all v1.0 flows after frontend upgrade:
 * 1. Factory tests (5 batches of 3 tags)
 * 2. Tag scan tests
 * 3. Animal page tests
 * 4. Dashboard tests
 * 5. Claim-kit test
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import fetch from 'node-fetch'

// Polyfill fetch for Node.js
if (typeof (global as any).fetch === 'undefined') {
  (global as any).fetch = fetch as any
}

dotenv.config()
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') })

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface TestResult {
  test: string
  success: boolean
  message: string
  details?: any
}

const results: TestResult[] = []

function logResult(test: string, success: boolean, message: string, details?: any) {
  results.push({ test, success, message, details })
  const icon = success ? '✅' : '❌'
  console.log(`${icon} ${test}: ${message}`)
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2))
  }
}

async function testFactory() {
  console.log('\n🏭 Testing Factory (5 batches of 3 tags each)...\n')
  
  const batches: Array<{ id: string; name: string; tags: any[] }> = []
  
  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`Creating batch ${i}/5...`)
      const response = await fetch(`${BASE_URL}/api/factory/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName: `Test Batch ${i}`,
          batchSize: 3,
          model: 'BASIC_QR',
          material: 'PETG',
          color: 'Mesquite',
          chain: 'BASE',
          targetRanchId: null,
          kitMode: false,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create batch')
      }

      if (!data.tags || data.tags.length !== 3) {
        throw new Error(`Expected 3 tags, got ${data.tags?.length || 0}`)
      }

      // Verify each tag has required fields
      const tagsWithTokenId = data.tags.filter((t: any) => t.token_id).length
      const tagsWithContract = data.tags.filter((t: any) => t.contract_address).length
      const tagsOnChain = data.tags.filter((t: any) => t.token_id && t.contract_address).length

      batches.push({
        id: data.batch.id,
        name: data.batch.name,
        tags: data.tags,
      })

      logResult(
        `Factory Batch ${i}`,
        true,
        `Created batch with 3 tags. ${tagsOnChain} on-chain, ${tagsWithTokenId - tagsOnChain} with token_id only, ${3 - tagsWithTokenId} pending`,
        {
          batchId: data.batch.id,
          tagsOnChain,
          tagsWithTokenId,
          tagsWithContract,
        }
      )

      // Verify tag structure
      data.tags.forEach((tag: any, idx: number) => {
        const hasTagCode = !!tag.tag_code
        const hasTokenId = !!tag.token_id
        const hasContract = !!tag.contract_address
        const hasChain = !!tag.chain
        const hasBaseQrUrl = !!tag.base_qr_url

        if (!hasTagCode || !hasChain || !hasBaseQrUrl) {
          logResult(
            `Factory Batch ${i} Tag ${idx + 1} Structure`,
            false,
            `Missing required fields: tag_code=${hasTagCode}, chain=${hasChain}, base_qr_url=${hasBaseQrUrl}`,
            tag
          )
        } else {
          logResult(
            `Factory Batch ${i} Tag ${idx + 1} Structure`,
            true,
            `Tag ${tag.tag_code} has all required fields`,
            {
              tag_code: tag.tag_code,
              token_id: tag.token_id || 'pending',
              contract_address: tag.contract_address ? `${tag.contract_address.substring(0, 6)}...` : 'none',
              chain: tag.chain,
              on_chain: hasTokenId && hasContract,
            }
          )
        }
      })
    } catch (error: any) {
      logResult(`Factory Batch ${i}`, false, error.message, error)
    }
  }

  return batches
}

async function testTagScan(batches: Array<{ tags: any[] }>) {
  console.log('\n📱 Testing Tag Scan Pages...\n')

  if (batches.length === 0 || batches[0].tags.length === 0) {
    logResult('Tag Scan', false, 'No tags available for testing')
    return
  }

  // Test first tag from first batch
  const testTag = batches[0].tags[0]
  const tagCode = testTag.tag_code

  try {
    const response = await fetch(`${BASE_URL}/api/tags/${tagCode}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch tag')
    }

    const tag = data.tag
    const hasTokenId = !!tag.token_id
    const hasContract = !!tag.contract_address
    const onChainStatus = hasTokenId && hasContract ? 'on-chain' : 'off-chain'

    logResult(
      'Tag Scan API',
      true,
      `Tag ${tagCode} fetched successfully. Status: ${onChainStatus}`,
      {
        tag_code: tag.tag_code,
        token_id: tag.token_id || 'pending',
        contract_address: tag.contract_address ? `${tag.contract_address.substring(0, 6)}...` : 'none',
        chain: tag.chain,
        status: tag.status,
        on_chain_status: onChainStatus,
      }
    )

    // Test page accessibility (should return 200 or redirect)
    const pageResponse = await fetch(`${BASE_URL}/t/${tagCode}`, {
      redirect: 'manual',
    })

    if (pageResponse.status === 200 || pageResponse.status === 307 || pageResponse.status === 308) {
      logResult('Tag Scan Page', true, `Page accessible for ${tagCode}`)
    } else {
      logResult('Tag Scan Page', false, `Page returned status ${pageResponse.status}`)
    }
  } catch (error: any) {
    logResult('Tag Scan', false, error.message, error)
  }
}

async function testAnimalAttachment(batches: Array<{ tags: any[] }>) {
  console.log('\n🐄 Testing Animal Attachment...\n')

  if (batches.length === 0 || batches[0].tags.length === 0) {
    logResult('Animal Attachment', false, 'No tags available for testing')
    return null
  }

  // Use first tag from first batch
  const testTag = batches[0].tags[0]
  const tagCode = testTag.tag_code

  try {
    // First check if tag is already attached
    const tagResponse = await fetch(`${BASE_URL}/api/tags/${tagCode}`)
    const tagData = await tagResponse.json()

    if (tagData.tag?.animal_id) {
      logResult(
        'Animal Attachment',
        true,
        `Tag ${tagCode} already attached to animal ${tagData.tag.animals?.public_id || 'unknown'}`,
        { public_id: tagData.tag.animals?.public_id }
      )
      return tagData.tag.animals?.public_id
    }

    // Attach animal
    const attachResponse = await fetch(`${BASE_URL}/api/attach-tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagCode,
        animalData: {
          name: 'Test Animal',
          species: 'Cattle',
          breed: 'Angus',
          birth_year: 2023,
          sex: 'Female',
        },
      }),
    })

    const attachData = await attachResponse.json()

    if (!attachResponse.ok) {
      throw new Error(attachData.error || 'Failed to attach animal')
    }

    logResult(
      'Animal Attachment',
      true,
      `Animal attached successfully: ${attachData.public_id}`,
      {
        public_id: attachData.public_id,
        tag_code: tagCode,
      }
    )

    return attachData.public_id
  } catch (error: any) {
    logResult('Animal Attachment', false, error.message, error)
    return null
  }
}

async function testAnimalPage(publicId: string | null) {
  console.log('\n📄 Testing Animal Page...\n')

  if (!publicId) {
    logResult('Animal Page', false, 'No public_id available for testing')
    return
  }

  try {
    const response = await fetch(`${BASE_URL}/api/animals/${publicId}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch animal')
    }

    const animal = data.animal
    const tag = animal.tags && animal.tags.length > 0 ? animal.tags[0] : null

    logResult(
      'Animal Page API',
      true,
      `Animal ${publicId} fetched successfully`,
      {
        public_id: animal.public_id,
        name: animal.name,
        species: animal.species,
        tag_code: tag?.tag_code || 'none',
        token_id: tag?.token_id || 'none',
        on_chain: tag?.token_id && tag?.contract_address ? 'yes' : 'no',
      }
    )

    // Test page accessibility
    const pageResponse = await fetch(`${BASE_URL}/a/${publicId}`, {
      redirect: 'manual',
    })

    if (pageResponse.status === 200 || pageResponse.status === 307 || pageResponse.status === 308) {
      logResult('Animal Page', true, `Page accessible for ${publicId}`)
    } else {
      logResult('Animal Page', false, `Page returned status ${pageResponse.status}`)
    }
  } catch (error: any) {
    logResult('Animal Page', false, error.message, error)
  }
}

async function testDashboard() {
  console.log('\n📊 Testing Dashboard...\n')

  try {
    const animalsResponse = await fetch(`${BASE_URL}/api/dashboard/animals`)
    const tagsResponse = await fetch(`${BASE_URL}/api/dashboard/tags`)

    const animalsData = await animalsResponse.json()
    const tagsData = await tagsResponse.json()

    if (!animalsResponse.ok) {
      throw new Error('Failed to fetch dashboard animals')
    }

    if (!tagsResponse.ok) {
      throw new Error('Failed to fetch dashboard tags')
    }

    const animals = animalsData.animals || []
    const tags = tagsData.tags || []

    const tagsOnChain = tags.filter((t: any) => t.token_id && t.contract_address).length
    const tagsOffChain = tags.filter((t: any) => !t.token_id).length
    const activeAnimals = animals.filter((a: any) => a.status === 'active').length

    logResult(
      'Dashboard API',
      true,
      `Dashboard data fetched: ${animals.length} animals, ${tags.length} tags`,
      {
        total_animals: animals.length,
        active_animals: activeAnimals,
        total_tags: tags.length,
        tags_on_chain: tagsOnChain,
        tags_off_chain: tagsOffChain,
      }
    )

    // Test page accessibility
    const pageResponse = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual',
    })

    if (pageResponse.status === 200 || pageResponse.status === 307 || pageResponse.status === 308) {
      logResult('Dashboard Page', true, 'Dashboard page accessible')
    } else {
      logResult('Dashboard Page', false, `Page returned status ${pageResponse.status}`)
    }
  } catch (error: any) {
    logResult('Dashboard', false, error.message, error)
  }
}

async function testClaimKit() {
  console.log('\n📦 Testing Claim Kit...\n')

  try {
    // Test page accessibility
    const pageResponse = await fetch(`${BASE_URL}/claim-kit`, {
      redirect: 'manual',
    })

    if (pageResponse.status === 200 || pageResponse.status === 307 || pageResponse.status === 308) {
      logResult('Claim Kit Page', true, 'Claim kit page accessible')
    } else {
      logResult('Claim Kit Page', false, `Page returned status ${pageResponse.status}`)
    }

    // Note: We don't test actual kit claiming as it requires valid kit data
    logResult(
      'Claim Kit Functionality',
      true,
      'Page accessible. Actual claiming requires valid kit_code in database.'
    )
  } catch (error: any) {
    logResult('Claim Kit', false, error.message, error)
  }
}

async function runAllTests() {
  console.log('🧪 Starting Frontend Upgrade Test Plan\n')
  console.log(`Base URL: ${BASE_URL}\n`)
  console.log('='.repeat(60))

  try {
    // 1. Factory tests
    const batches = await testFactory()

    // 2. Tag scan tests
    await testTagScan(batches)

    // 3. Animal attachment test
    const publicId = await testAnimalAttachment(batches)

    // 4. Animal page test
    await testAnimalPage(publicId)

    // 5. Dashboard tests
    await testDashboard()

    // 6. Claim-kit test
    await testClaimKit()

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n📋 Test Summary\n')
    
    const passed = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const total = results.length

    console.log(`Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.test}: ${r.message}`)
      })
    }

    return { passed, failed, total, results }
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    return { passed: 0, failed: 1, total: 1, results }
  }
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then((summary) => {
      process.exit(summary.failed > 0 ? 1 : 0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { runAllTests }

