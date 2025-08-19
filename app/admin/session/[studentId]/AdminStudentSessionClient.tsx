'use client'
import { useParams } from 'next/navigation'
import SessionView from '../../../../components/SessionView'

export default function AdminStudentSessionPage() {
  const { studentId } = useParams<{ studentId: string }>()
  return <SessionView studentId={studentId} isAdmin />
}