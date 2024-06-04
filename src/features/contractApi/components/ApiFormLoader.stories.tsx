import type { Meta, StoryObj } from '@storybook/react';
import { ApiFormLoader } from './ApiFormLoader';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import { createAoContractClient } from '@/features/ao/lib/aoContractClient';
import { connect } from '@permaweb/aoconnect';
import AnonymousLoader from '@/features/ao/test/components/AnonymousLoader';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'api/ApiFormLoader',
  component: ApiFormLoader,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {
    //@ts-expect-error provided by decorator
    contractClient: null,
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
                contractClient: createAoContractClient(import.meta.env.VITE_LLAMAASSISTANT_PROCESS_ID, connect(), wallet),
              }}
            />
          )}
        </AnonymousLoader>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof ApiFormLoader>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    methodName: 'Petition',
  },
};
