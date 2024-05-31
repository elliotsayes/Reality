import { Button } from '@/components/ui/button'
import { truncateAddress } from '@/features/arweave/lib/utils'
import { Login } from '@/features/login/components/Login'
import { createProfileClientForProcess } from '@/features/profile/contract/profileClient'
import { Renderer } from '@/features/render/components/Renderer'
import { createVerseClientForProcess } from '@/features/verse/contract/verseClient'
import { createLazyFileRoute, useParams } from '@tanstack/react-router'

const profileProcessId = import.meta.env.VITE_PROFILE_PROCESS_ID as string;

const versePathRegex = /^verse\/([a-zA-Z0-9_-]{43})$/

export const Route = createLazyFileRoute('/app/$')({
  component: VerseId,
})

function VerseId() {
  const { _splat } = useParams({
    // Not sure why I have to do this but whatever
    select: (params) => ({ 
      _splat: Object.prototype.hasOwnProperty.call(params, '_splat')
        ? String((params as Record<'_splat', string>)._splat)
        : '',
    }),
    strict: false,
  })

  let verseId = undefined;
  if (_splat.startsWith('verse/')) {
    const match = versePathRegex.exec(_splat)
    if (match) {
      verseId = match[1]
    } else {
      return (
        <div>
          Invalid verse ID
        </div>
      )
    }
  }

  return (
    <Login>
      {(wallet, disconnect) => (
        <div>
          <div className='flex flex-row gap-4 items-baseline fixed top-0 right-0 py-2 px-2'>
            <p>Wallet: <span className='font-mono text-sm text-muted-foreground'>{truncateAddress(wallet.address)}</span></p>
            <Button
              onClick={disconnect}
              size={'sm'}
              variant={'secondary'}
            >
              Log out
            </Button>
          </div>
          <div className='fixed top-14 right-0 left-0 bottom-0'>
            <Renderer
              profileClient={createProfileClientForProcess(wallet)(profileProcessId)}
              verseClientForProcess={createVerseClientForProcess(wallet)}
              verseId={verseId}
            />
          </div>
        </div>
      )}
    </Login>
  )
}
