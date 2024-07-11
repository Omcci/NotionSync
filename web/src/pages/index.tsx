import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

const Home = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-50 dark:bg-gray-900">
      <header className="w-full max-w-5xl text-center text-sm font-mono">
        <p className="mb-6 text-4xl font-bold text-gray-800 dark:text-gray-100">
          Welcome to NotionSync
        </p>
        <div className="flex justify-center items-center border-b border-gray-300 dark:border-gray-700 py-4">
          <span className="text-gray-600 dark:text-gray-300">
            Get started by going to{' '}
            <code className="font-bold text-gray-900 dark:text-gray-100">
              <Link href="/dashboardv0">dashboard</Link>
            </code>
          </span>
        </div>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Documentation &rarr;
            </CardTitle>
            <CardDescription className="mt-2 text-base text-gray-600 dark:text-gray-300">
              Find in-depth information about Next.js features and API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="https://nextjs.org/docs">Learn More</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              GitHub Repository &rarr;
            </CardTitle>
            <CardDescription className="mt-2 text-base text-gray-600 dark:text-gray-300">
              Explore the source code and contribute to the project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="https://github.com/Omcci/NotionSync">Explore</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

export default Home
