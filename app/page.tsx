import { TripCalculator } from "@/components/trip-calculator"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">United Flight Attendant Trip Calculator</h1>
      <TripCalculator />
    </main>
  )
}
