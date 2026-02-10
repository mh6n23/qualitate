import ProjectList from '@/components/ProjectList';
import Link from 'next/link';

export default function Home() {
  return (
      <main className="min-h-screen bg-gray-50 pt-10">
        <ProjectList />
      </main>
  )
}