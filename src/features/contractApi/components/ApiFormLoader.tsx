import { useMutation, useQuery } from "@tanstack/react-query"
import { createApiClient } from "../contract/apiClient"
import { ApiForm } from "./ApiForm"
import { AoContractClient } from "@/features/ao/lib/aoContractClient"

interface ApiFormLoaderProps {
  contractClient: AoContractClient
  methodName: string
}

export function ApiFormLoader({ contractClient, methodName }: ApiFormLoaderProps) {
  const api = useQuery({
    queryKey: ['api', contractClient.processId],
    queryFn: async () => {
      const apiClient = createApiClient(contractClient)
      return apiClient.readApi()
    },
  })

  const message = useMutation({
    mutationKey: ['message', contractClient.processId, methodName],
    mutationFn: async (data: object) => {
      // TODO
      // Wait 2 seconds
      console.log('data', data)
      const formData = data.formData as Record<string, string | number>
      const tags = Object.entries(formData).map(([name, value]) => ({ name, value: value.toString() }))
      console.log('tags', tags)
      await contractClient.message({
        tags,
      })
      // await new Promise((resolve) => setTimeout(resolve, 2000))
    },
  })

  if (api.isLoading) {
    return <div>Loading...</div>
  }

  if (api.data === undefined) {
    return <div>No data.</div>
  }

  return (
    <ApiForm
      methodSchema={api.data[methodName]}
      onSubmitted={(data) => {
        console.log('onSubmitted')
        message.mutateAsync(data)
      }}
      isDisabled={!message.isIdle || message.isSuccess}
      isSubmitting={message.isPending}
    />
  )
}
