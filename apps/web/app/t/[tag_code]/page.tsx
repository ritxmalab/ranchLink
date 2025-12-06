import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

interface PageProps {
  params: {
    tag_code: string
  }
}

/**
 * Tag scan route: /t/[tag_code]
 * 
 * Flow:
 * 1. If tag not found → 404
 * 2. If tag not attached to animal:
 *    - If user is authenticated and owns ranch → Show "Attach to animal" form
 *    - Else → Show "Tag not yet attached" message
 * 3. If tag attached → Redirect to /a/[public_id]
 */
export default async function TagScanPage({ params }: PageProps) {
  const { tag_code } = params
  const supabase = getSupabaseServerClient()

  // Fetch device/tag with related data
  // Use devices table for v0.9 compatibility (will use tags after migration)
  const { data: tag, error: tagError } = await supabase
    .from('devices')
    .select(`
      *,
      animals (
        public_id,
        tag_id,
        species,
        breed
      ),
      owners (
        id,
        basename,
        email
      )
    `)
    .eq('tag_id', tag_code)
    .single()

  if (tagError || !tag) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tag Not Found</h1>
          <p className="text-[var(--c4)] mb-8">Tag code "{tag_code}" does not exist.</p>
          <a href="/" className="btn-primary">
            Go Home
          </a>
        </div>
      </div>
    )
  }

  // If tag is attached to an animal, redirect to animal card
  if (tag.public_id) {
    redirect(`/a/${tag.public_id}`)
  }

  // Tag exists but not attached - show attachment UI
  // For v1.0, we'll show a simple message
  // In future, add authentication and form here
  return (
    <div className="min-h-screen bg-[var(--bg)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold mb-4">Tag: {tag_code}</h1>
          
          <div className="space-y-4 mb-6">
            <div>
              <span className="text-[var(--c4)]">Status:</span>{' '}
              <span className="font-semibold capitalize">{tag.status}</span>
            </div>
            {tag.token_id && (
              <div>
                <span className="text-[var(--c4)]">Token ID:</span>{' '}
                <span className="font-mono">#{tag.token_id}</span>
                {tag.metadata?.contract_address && (
                  <a
                    href={`https://basescan.org/token/${tag.metadata.contract_address}?a=${tag.token_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-[var(--c2)] hover:underline"
                  >
                    View on Basescan
                  </a>
                )}
              </div>
            )}
            {tag.owner_id && tag.owners && (
              <div>
                <span className="text-[var(--c4)]">Owner:</span>{' '}
                <span className="font-semibold">{tag.owners.basename || tag.owners.email}</span>
              </div>
            )}
          </div>

          {tag.status === 'printed' || tag.status === 'in_inventory' || tag.status === 'assigned' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold mb-2">Tag Not Yet Attached</h2>
              <p className="text-sm text-[var(--c4)] mb-4">
                This tag has not been attached to an animal yet.
              </p>
              {tag.owner_id ? (
                <p className="text-sm text-[var(--c4)]">
                  This tag is assigned to an owner. Use the claim flow to attach it to an animal.
                </p>
              ) : (
                <p className="text-sm text-[var(--c4)]">
                  This tag is available. Use the claim flow to activate it.
                </p>
              )}
              <a href={`/start?token=${tag.claim_token || ''}`} className="btn-primary mt-4 inline-block">
                Claim This Tag
              </a>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-[var(--c4)]">
                Tag status: {tag.status}. Please contact support if you need assistance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

