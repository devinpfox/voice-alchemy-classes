'use client'
import { useParams } from 'next/navigation'
import SessionView from '../../../../components/SessionView'
import TunerButton from '@/components/TunerButton'
import WarmUpButton from "@/components/WarmUpButton";

export default function AdminStudentSessionPage() {
  const { studentId } = useParams<{ studentId: string }>()
  return (
    <>
      <SessionView studentId={studentId} isAdmin />
      <WarmUpButton />
      <TunerButton /> 
    </>
  )
}