import { Button } from '@/components/ui/button'
import { Login } from '@/features/login/components/Login'
import { Renderer } from '@/features/render/components/Renderer'
import { createVerseClientForProcess } from '@/features/verse/contract/verseClient'
import { createLazyFileRoute, useParams } from '@tanstack/react-router'

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
        <>
          <p>Logged in as: {wallet.address}</p>
          <Button onClick={disconnect}>Log out</Button>
          <Renderer
            verseClientForProcess={createVerseClientForProcess(wallet)}
            verseId={verseId}
          />
        </>
      )}
    </Login>
  )
}
