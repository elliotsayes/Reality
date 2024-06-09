import { useMutation, useQuery } from "@tanstack/react-query"
import { SchemaForm } from "./SchemaForm"
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient"
import { createSchemaClient } from "../contract/schemaClient"

interface SchemaFormLoaderProps {
  aoContractClientForProcess: AoContractClientForProcess
  schemaProcessId: string
  isExternal: boolean
  methodName: string
  onComplete?: () => void
}

export function SchemaFormLoader({ aoContractClientForProcess, schemaProcessId, isExternal, methodName, onComplete }: SchemaFormLoaderProps) {
  const schema = useQuery({
    queryKey: ['schemaExternal', schemaProcessId],
    queryFn: async () => {
      const schemaClient = createSchemaClient(aoContractClientForProcess(schemaProcessId))
      return schemaClient.readSchemaExternal()
    },
  })

  const messageTarget = isExternal
    ? schema.data?.[methodName]?.Target
    : schemaProcessId

  const message = useMutation({
    mutationKey: ['message', messageTarget, methodName],
    mutationFn: async (data: object) => {
      if (messageTarget === undefined) throw Error(`No schema for ${methodName}`)

      console.log('data', data)
      const formData = data.formData as Record<string, string | number>
      const tags = Object.entries(formData).map(([name, value]) => ({ name, value: value.toString() }))
      console.log('tags', tags)

      console.log(`Sending message to ${messageTarget} with tags:`, tags)

      const targetContractClient = aoContractClientForProcess(messageTarget)
      await targetContractClient.message({ tags })
      onComplete?.()
    },
  })

  if (schema.isLoading) {
    return <div>Loading...</div>
  }

  if (schema.data === undefined) {
    return <div>No data.</div>
  }

  return (
    <SchemaForm
      methodSchema={schema.data[methodName]}
      onSubmitted={(data) => {
        console.log('onSubmitted')
        message.mutateAsync(data)
      }}
      isDisabled={!message.isIdle || message.isSuccess}
      isSubmitting={message.isPending}
    />
  )
}
