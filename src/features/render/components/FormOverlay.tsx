import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AoContractClientForProcess } from '@/features/ao/lib/aoContractClient'
import { truncateAddress } from '@/features/arweave/lib/utils'
import { SchemaFormLoader } from '@/features/schema/components/SchemaFormLoader'
import { queryClient } from '@/lib/query'
import { QueryClientProvider } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface FormOverlayProps {
  aoContractClientForProcess: AoContractClientForProcess
  schemaProcessId: string
  isExternal: boolean
  methodName: string
  close: () => void
}

export function FormOverlay({ aoContractClientForProcess, schemaProcessId, isExternal, methodName, close }: FormOverlayProps) {
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
          <SchemaFormLoader
            aoContractClientForProcess={aoContractClientForProcess}
            schemaProcessId={schemaProcessId}
            isExternal={isExternal}
            methodName={methodName}
            onComplete={() => {
              // TODO: Show external process Id?
              toast(`'${methodName}' message sent to ${truncateAddress(schemaProcessId)}`)
              close()
            }}
          />
        </CardContent>
      </Card>
    </QueryClientProvider>
  )
}
