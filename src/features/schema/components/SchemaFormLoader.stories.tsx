import type { Meta, StoryObj } from "@storybook/react";
import { SchemaFormLoader } from "./SchemaFormLoader";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import { createAoContractClient } from "@/features/ao/lib/aoContractClient";
import { connect } from "@permaweb/aoconnect";
import AnonymousLoader from "@/features/ao/test/components/AnonymousLoader";
import { fn } from "@storybook/test";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Schema/SchemaFormLoader",
  component: SchemaFormLoader,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/Schema/argtypes
  argTypes: {},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {
    //@ts-expect-error provided by decorator
    schemaContractClient: null,
  },
  // wrap in TanStack QueryProvider
  decorators: [
    (Story, options) => (
      <QueryClientProvider client={queryClient}>
        <AnonymousLoader>
          {(wallet) => (
            <Story
              args={{
                ...options.args,
                aoContractClientForProcess: (processId) =>
                  createAoContractClient(processId, connect(), wallet),
              }}
            />
          )}
        </AnonymousLoader>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof SchemaFormLoader>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    schemaProcessId: import.meta.env.VITE_LLAMAKING_PROCESS_ID,
    methodName: "Petition",
    isExternal: true,
    onComplete: fn,
  },
};
