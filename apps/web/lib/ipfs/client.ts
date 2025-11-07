// Pin JSON to IPFS using Pinata
export async function pinJSON(data: any): Promise<string> {
  const jwt = process.env.PINATA_JWT
  if (!jwt) {
    throw new Error('Missing PINATA_JWT environment variable')
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Pinata pinJSONToIPFS failed: ${response.status} ${errorText}`)
  }

  const result = await response.json()
  return result.IpfsHash
}

// Get IPFS URL (gateway)
export function getIPFSUrl(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`
}

// Pin animal metadata
export async function pinAnimalMetadata(animal: any): Promise<string> {
  const metadata = {
    name: animal.animal_name || animal.name,
    description: `RanchLink animal tag for ${animal.animal_name}`,
    image: animal.photo_url || '',
    attributes: [
      { trait_type: 'Breed', value: animal.breed || 'Unknown' },
      { trait_type: 'Species', value: animal.species || 'Cattle' },
      { trait_type: 'Public ID', value: animal.public_id },
    ],
    external_url: `${process.env.NEXT_PUBLIC_APP_URL}/a?id=${animal.public_id}`,
  }
  return pinJSON(metadata)
}

