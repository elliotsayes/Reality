import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AoContractClient } from '@/features/ao/lib/aoContractClient'
import { ApiFormLoader } from '@/features/contractApi/components/ApiFormLoader'
import { queryClient } from '@/lib/query'
import { QueryClientProvider } from '@tanstack/react-query'
import { X } from 'lucide-react'

interface FormOverlayProps {
  contractClient: AoContractClient
  methodName: string
  close: () => void
}

export function FormOverlay({ contractClient, methodName, close }: FormOverlayProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Card>
        <CardHeader className='flex flex-row justify-between items-baseline'>
          <CardTitle>{methodName}</CardTitle>

          <Button
            onClick={close}
            variant={"destructive"}
            size={"sm"}
          >
            <X />
          </Button>
        </CardHeader>
        <CardContent>
          <ApiFormLoader
            contractClient={contractClient}
            methodName={methodName}
            onComplete={close}
          />
        </CardContent>
      </Card>
    </QueryClientProvider>
  )
}
