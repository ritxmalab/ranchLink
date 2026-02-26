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

// Pin animal metadata with complete traceability data — all field sections from the RanchLink diagram
export async function pinAnimalMetadata(animal: any, ranch?: any): Promise<string> {
  const animalName = animal.animal_name || animal.name || 'Unknown'
  const publicId = animal.public_id || ''

  const attr = (trait: string, value: any) =>
    value !== null && value !== undefined && value !== ''
      ? [{ trait_type: trait, value: String(value) }]
      : []

  const metadata = {
    name: `${animalName} - ${publicId}`,
    description: `RanchLink RWA Tag - Full traceability record for ${animalName}. This NFT represents a physical livestock tag with complete blockchain-verified metadata.`,
    image: animal.photo_url || '',
    attributes: [
      // BASIC
      ...attr('Tag Code', animal.tag_code || animal.tags?.tag_code || ''),
      ...attr('Public ID', publicId),
      ...attr('Species', animal.species || 'Cattle'),
      ...attr('Breed', animal.breed),
      ...attr('Sex', animal.sex),
      ...attr('Birth Year', animal.birth_year),
      ...attr('Size', animal.size),
      ...attr('Status', animal.status || 'active'),
      // IDENTIFICATION
      ...attr('EID', animal.eid),
      ...attr('Secondary ID', animal.secondary_id),
      ...attr('Tattoo', animal.tattoo),
      ...attr('Brand', animal.brand),
      // ADDITIONAL
      ...attr('Owner', animal.owner),
      ...attr('Head Count', animal.head_count),
      ...(animal.labels?.length ? [{ trait_type: 'Labels', value: animal.labels.join(', ') }] : []),
      // CALLFHOOD
      ...attr('Dam ID', animal.dam_id),
      ...attr('Sire ID', animal.sire_id),
      ...attr('Birth Weight (kg)', animal.birth_weight),
      ...attr('Weaning Weight (kg)', animal.weaning_weight),
      ...attr('Weaning Date', animal.weaning_date),
      ...attr('Yearling Weight (kg)', animal.yearling_weight),
      ...attr('Yearling Date', animal.yearling_date),
      // PURCHASE
      ...attr('Seller', animal.seller),
      ...attr('Purchase Price', animal.purchase_price),
      ...attr('Purchase Date', animal.purchase_date),
      // RANCH
      ...(ranch ? [
        ...attr('Ranch Name', ranch.name),
        ...attr('Ranch Contact', ranch.contact_email),
      ] : []),
    ],
    properties: {
      animal: {
        name: animalName,
        species: animal.species,
        breed: animal.breed,
        sex: animal.sex,
        birth_year: animal.birth_year,
        size: animal.size,
        status: animal.status,
        public_id: publicId,
        eid: animal.eid,
        secondary_id: animal.secondary_id,
        tattoo: animal.tattoo,
        brand: animal.brand,
        owner: animal.owner,
        head_count: animal.head_count,
        labels: animal.labels,
        dam_id: animal.dam_id,
        sire_id: animal.sire_id,
        birth_weight: animal.birth_weight,
        weaning_weight: animal.weaning_weight,
        weaning_date: animal.weaning_date,
        yearling_weight: animal.yearling_weight,
        yearling_date: animal.yearling_date,
        seller: animal.seller,
        purchase_price: animal.purchase_price,
        purchase_date: animal.purchase_date,
      },
      ...(ranch ? {
        ranch: {
          name: ranch.name,
          contact_email: ranch.contact_email,
          contact_phone: ranch.phone,
        },
      } : {}),
    },
    external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app'}/a/${publicId}`,
  }
  return pinJSON(metadata)
}
