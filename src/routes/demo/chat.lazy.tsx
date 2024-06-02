import { Button } from '@/components/ui/button'
import AnonymousLoader from '@/features/ao/test/components/AnonymousLoader'
import { Chat } from '@/features/chat/components/Chat'
import { createChatClientForProcess } from '@/features/chat/contract/chatClient'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createLazyFileRoute('/demo/chat')({
  component: ChatDemo,
})

// Replace with your test Process Id
const chatProcessId = "a1C-TCUNUKCaEup0BiCXNwcVWxOVOiRBfmKuBZwPWZg";

export default function ChatDemo() {
  const [enabled, setEnabled] = useState(false)

  return (
    <AnonymousLoader>
      {(wallet) => (
        <div className='relative'>
          <Button
            onClick={() => setEnabled(!enabled)}
          >
            Toggle Client ({enabled ? 'Enabled' : 'Disabled'})
          </Button>
          <div className='absolute right-0 top-0 bottom-0'>
              <Chat
                userAddress={wallet.address}
                chatClient={enabled 
                  ? createChatClientForProcess(wallet)(chatProcessId)
                  : undefined}
                onUserMessageSent={() => {
                  console.log("User message sent");
                }}
              />
          </div>
        </div>
      )}
    </AnonymousLoader>
  )
}
