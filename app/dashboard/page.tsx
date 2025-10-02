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
    <main className="bg-[#17132A] min-h-screen flex items-center justify-center dashboard-center">
      <div
        className="
          flex flex-col items-center
          w-full max-w-[600px]
          px-4 sm:px-0 dashboard-center
        "
      >
        <Button onClick={goToClass} className="w-full mb-4">
          Go To Class
        </Button>
        <div className="w-full bg-white border-8 border-white rounded-lg shadow-xl overflow-hidden">
          <iframe
            src="/chromatic-tuner/tune1.html"
            id="tuner-frame"
            className="w-full h-[500px]"
          ></iframe>
        </div>
        <TunerTourMount />
      </div>
    </main>
  )
}
