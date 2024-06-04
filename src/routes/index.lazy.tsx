import { Link, createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className='fixed top-14 right-0 left-0 bottom-14 flex flex-col justify-center items-center'>
      <div>
        <Link to='/app/$' params={{
          _splat: 'main',
        }} className='text-2xl font-bold text-blue-500 hover:text-blue-700 text-center'>
          <p className='text-7xl font-bold text-foreground'>
            Play
          </p>
          <img src='assets/branding/main_logo_small.png' className='p-8' />
        </Link>
      </div>
    </div>
  )
}
