import { ProductivityDashboard } from "@/components/productivity-dashboard"
import { extendedUsers } from "@/data/extended-sample-data"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LineChart } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Formular Test Analysis and improvements</h1>
          <Link href="/trends">
            <Button variant="outline" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              View Trends
            </Button>
          </Link>
        </div>
        <ProductivityDashboard users={extendedUsers} />
      </div>
    </main>
  )
}

