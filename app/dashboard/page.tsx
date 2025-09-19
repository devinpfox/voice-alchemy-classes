'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import TunerTourMount from '@/components/TunerTourMount'

export default function DashboardPage() {
  const router = useRouter()

  const goToClass = () => {
    router.push('/session')
  }

  return (
    <main className="p-8 bg-[#17132A] min-h-screen flex items-center justify-center ">
      <div className="flex flex-col items-center ear-training-section" style={{ width: '600px', maxWidth: '100%' }}>
        <Button onClick={goToClass} className="w-full mb-4">
          Go To Class
        </Button>
        <iframe
          src="/chromatic-tuner/tune1.html"
          id="tuner-frame"      
          className="w-full h-[500px] border-8 border-white rounded-lg shadow-xl bg-white"
        ></iframe>
      <TunerTourMount />
      </div>
    </main>
  )
}
