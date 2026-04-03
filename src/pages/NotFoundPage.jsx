import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ background:'var(--bg)' }}>
      <div className="max-w-md">
        <div className="font-display font-black text-8xl text-blue-tint mb-2 select-none">404</div>
        <div className="text-5xl mb-6">🗺️</div>
        <h1 className="font-display font-bold text-2xl text-[#0D1B3E] mb-3">This page got lost in transit</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">The page you're looking for doesn't exist or has been moved. Let's get you back to exploring.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/')} className="btn-primary text-sm">Go Home</button>
          <button onClick={() => navigate('/browse')} className="btn-outline text-sm">Browse Experiences</button>
        </div>
      </div>
    </div>
  )
}
