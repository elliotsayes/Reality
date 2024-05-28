import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const hashHistory = createHashHistory()

const router = createRouter({ routeTree, history: hashHistory })
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
