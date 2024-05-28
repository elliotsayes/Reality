import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react';

export const Route = createLazyFileRoute('/app/')({
  component: VerseId,
})

function VerseId() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({
      to: '/app/$',
      params: {
        _splat: 'main',
      },
    })
  }, [navigate])

  return null;
}
