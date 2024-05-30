import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { LoginMenu } from './LoginMenu';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query';
import { Toaster } from '@/components/ui/sonner';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'login/LoginMenu',
  component: LoginMenu,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onConnect: fn(), onDisconnect: fn() },
  // wrap in TanStack QueryProvider
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <>
          <Story />
          <Toaster />
        </>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof LoginMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const WithFakeWallet: Story = {
  args: {
    localWallet: {
      type: "Keyfile",
      anonymous: true,
      address: 'fakeAddress',
      signer: async () => ({})
    }
  }
};
