import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Crossover Gen
        </h1>
        <p className="text-center text-gray-600 mb-8">
          3D Printable Speaker Crossover Plate Designer
        </p>
        <div className="flex justify-center">
          <Link href="/designer">
            <Button size="lg">Start Designing</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}