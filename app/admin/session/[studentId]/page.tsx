'use client'
import { useParams } from 'next/navigation'
import SessionView from '../../../../components/SessionView'
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminStudentSessionPage() {
  const { studentId } = useParams<{ studentId: string }>()
  return <SessionView studentId={studentId} isAdmin />
}