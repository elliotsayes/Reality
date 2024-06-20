import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react';

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({
      to: '/app',
    })
  }, [navigate])

  return null;
}
