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
    mutationFn: async (formData: object) => {
      // TODO
      // Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000))
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
      onSubmitted={(formData) => {
        console.log('submitted')
        console.log(formData)
        message.mutateAsync(formData)
      }}
      isDisabled={!message.isIdle || message.isSuccess}
      isSubmitting={message.isPending}
    />
  )
}
