import { useMutation, useQuery } from "@tanstack/react-query";
import { SchemaForm } from "./SchemaForm";
import { AoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { createSchemaClient } from "../contract/schemaClient";
import { SchemaExternalMethod } from "../contract/model";

interface SchemaFormLoaderProps {
  aoContractClientForProcess: AoContractClientForProcess;
  schemaProcessId: string;
  isExternal: boolean;
  methodName: string;
  onComplete?: (isSuccess: boolean) => void;
}

export function SchemaFormLoader({
  aoContractClientForProcess,
  schemaProcessId,
  isExternal,
  methodName,
  onComplete,
}: SchemaFormLoaderProps) {
  // TODO: Conditional based on isExternal
  const schema = useQuery({
    queryKey: [isExternal ? "schemaExternal" : "schema", schemaProcessId],
    queryFn: async () => {
      const schemaClient = createSchemaClient(
        aoContractClientForProcess(schemaProcessId),
      );
      return isExternal
        ? await schemaClient.readSchemaExternal()
        : await schemaClient.readSchema();
    },
  });

  const maybeMethodSchema = schema.data?.[methodName] as
    | SchemaExternalMethod
    | undefined;

  const messageTarget = isExternal
    ? maybeMethodSchema?.Target
    : schemaProcessId;

  const message = useMutation({
    mutationKey: ["message", messageTarget, methodName],
    mutationFn: async (data: object) => {
      if (messageTarget === undefined)
        throw Error(`No schema for ${methodName}`);

      console.log("data", data);
      const formData = data.formData as Record<string, string | number>;
      const tags = Object.entries(formData).map(([name, value]) => {
        const maybeComment =
          maybeMethodSchema?.Schema.Tags.properties?.[name]?.$comment;
        if (maybeComment && typeof value === "number") {
          console.log(`Found comment: ${maybeComment} for tag: ${name}`);
          try {
            const multiplier = parseInt(maybeComment);
            const processedTag = {
              name,
              value: (value * multiplier).toString(),
            };
            console.log("multplied tag: ", processedTag);
            return processedTag;
          } catch (e) {
            console.error(
              `Failed to parse comment as integer: ${maybeComment}`,
            );
          }
        }

        return {
          name,
          value: value.toString(),
        };
      });
      console.log("tags", tags);

      console.log(`Sending message to ${messageTarget} with tags:`, tags);

      const targetContractClient = aoContractClientForProcess(messageTarget);
      await targetContractClient.message({ tags });
    },
    onSettled: (_, error) => {
      const isSuccess = !error;
      onComplete?.(isSuccess);
    },
  });

  if (schema.isLoading) {
    return <div>Loading...</div>;
  }

  if (schema.data === undefined) {
    return <div>No data.</div>;
  }

  return (
    <SchemaForm
      methodSchema={schema.data[methodName]}
      onSubmitted={(data) => {
        console.log("onSubmitted");
        message.mutateAsync(data);
      }}
      isDisabled={!message.isIdle || message.isSuccess}
      isSubmitting={message.isPending}
    />
  );
}
