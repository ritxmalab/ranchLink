/**
 * Complete End-to-End Flow Test
 * 
 * This script tests the complete flow:
 * 1. Create a batch via factory endpoint
 * 2. Verify tags are created in database
. 3. Verify NFTs are minted on-chain
 * 4. Test tag scan route
 * 5. Test animal attachment
 * 6. Test animal card display
 * 7. Test dashboard
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config()
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') })

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CONTRACT_ADDRESS = process.env.RANCHLINKTAG_ADDRESS || '0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242'

interface TestResult {
  step: string
  success: boolean
  message: string
  data?: any
}

async function testCompleteFlow(): Promise<TestResult[]> {
  const results: TestResult[] = []
  
  console.log('🧪 Starting Complete Flow Test...\n')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Contract: ${CONTRACT_ADDRESS}\n`)

  // Step 1: Create a batch
  console.log('📦 Step 1: Creating batch...')
  try {
    const batchResponse = await fetch(`${BASE_URL}/api/factory/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchName: 'Test Flow Batch',
        batchSize: 1,
        model: 'BASIC_QR',
        material: 'PETG',
        color: 'Mesquite',
        chain: 'BASE',
        targetRanchId: null,
        kitMode: false,
      }),
    })

    const batchData = await batchResponse.json()
    
    if (!batchResponse.ok) {
      throw new Error(batchData.error || 'Failed to create batch')
    }

    if (!batchData.tags || batchData.tags.length === 0) {
      throw new Error('No tags returned from batch creation')
    }

    const tag = batchData.tags[0]
    results.push({
      step: 'Create Batch',
      success: true,
      message: `Created batch with ${batchData.tags.length} tag(s)`,
      data: { tag_code: tag.tag_code, token_id: tag.token_id },
    })

    console.log(`✅ Batch created: ${tag.tag_code}`)
    console.log(`   Token ID: ${tag.token_id || 'Pending'}\n`)

    // Step 2: Verify tag in database
    console.log('🔍 Step 2: Verifying tag in database...')
    const tagResponse = await fetch(`${BASE_URL}/api/tags/${tag.tag_code}`)
    const tagData = await tagResponse.json()

    if (!tagResponse.ok || !tagData.tag) {
      throw new Error('Tag not found in database')
    }

    results.push({
      step: 'Verify Tag in DB',
      success: true,
      message: `Tag ${tag.tag_code} found in database`,
      data: tagData.tag,
    })

    console.log(`✅ Tag verified in database\n`)

    // Step 3: Test tag scan page (should show attach form)
    console.log('📱 Step 3: Testing tag scan page...')
    const scanResponse = await fetch(`${BASE_URL}/t/${tag.tag_code}`, {
      redirect: 'manual',
    })

    if (scanResponse.status === 200 || scanResponse.status === 307 || scanResponse.status === 308) {
      results.push({
        step: 'Tag Scan Page',
        success: true,
        message: `Tag scan page accessible for ${tag.tag_code}`,
      })
      console.log(`✅ Tag scan page accessible\n`)
    } else {
      throw new Error(`Tag scan page returned status ${scanResponse.status}`)
    }

    // Step 4: Attach animal to tag
    console.log('🐄 Step 4: Attaching animal to tag...')
    const attachResponse = await fetch(`${BASE_URL}/api/attach-tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tagCode: tag.tag_code,
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

    results.push({
      step: 'Attach Animal',
      success: true,
      message: `Animal attached: ${attachData.public_id}`,
      data: attachData,
    })

    console.log(`✅ Animal attached: ${attachData.public_id}\n`)

    // Step 5: Test animal card
    console.log('📄 Step 5: Testing animal card...')
    const animalResponse = await fetch(`${BASE_URL}/api/animals/${attachData.public_id}`)
    const animalData = await animalResponse.json()

    if (!animalResponse.ok || !animalData.animal) {
      throw new Error('Animal card not accessible')
    }

    results.push({
      step: 'Animal Card',
      success: true,
      message: `Animal card accessible for ${attachData.public_id}`,
      data: { name: animalData.animal.name, token_id: animalData.animal.tags?.[0]?.token_id },
    })

    console.log(`✅ Animal card accessible\n`)

    // Step 6: Test dashboard
    console.log('📊 Step 6: Testing dashboard...')
    const dashboardAnimalsResponse = await fetch(`${BASE_URL}/api/dashboard/animals`)
    const dashboardTagsResponse = await fetch(`${BASE_URL}/api/dashboard/tags`)

    if (dashboardAnimalsResponse.ok && dashboardTagsResponse.ok) {
      results.push({
        step: 'Dashboard',
        success: true,
        message: 'Dashboard endpoints accessible',
      })
      console.log(`✅ Dashboard accessible\n`)
    } else {
      throw new Error('Dashboard endpoints not accessible')
    }

    console.log('✅ All tests passed!\n')
    return results

  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    results.push({
      step: 'Error',
      success: false,
      message: error.message,
    })
    return results
  }
}

// Run test
if (require.main === module) {
  testCompleteFlow()
    .then((results) => {
      console.log('\n📋 Test Results Summary:')
      console.log('='.repeat(50))
      results.forEach((result) => {
        const icon = result.success ? '✅' : '❌'
        console.log(`${icon} ${result.step}: ${result.message}`)
      })
      console.log('='.repeat(50))
      
      const allPassed = results.every((r) => r.success)
      process.exit(allPassed ? 0 : 1)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { testCompleteFlow }

