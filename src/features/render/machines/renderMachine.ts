import { setup, assign } from 'xstate';

export const renderMachine = setup({
  types: {
    context: {} as { count: number },
    events: {} as 
      | { type: 'inc' }
      | { type: 'dec' }
  },
  actions: {
    increment: assign({
      count: ({ context }) => context.count + 1
    }),
    decrement: assign({
      count: ({ context }) => context.count - 1
    })
  }
}).createMachine({
  context: { count: 0 },
  on: {
    inc: { actions: 'increment' },
    dec: { actions: 'decrement' }
  }
})
