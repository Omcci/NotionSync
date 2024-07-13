import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AccordionItem, Accordion, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'

const Home = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24 bg-gray-50 dark:bg-gray-900 ">
      <header className="w-full max-w-3xl text-sm font-mono">
        <p className="mb-6 text-4xl font-bold text-gray-800 dark:text-gray-100">
          Welcome to NotionSync
        </p>
        <p className="mb-8 text-lg text-gray-600">
          Seamlessly sync your GitHub commits with Notion to keep your project
          management up-to-date and effortless.
        </p>
        <div className="flex  border-b border-gray-300 dark:border-gray-700 py-4">
          <span className="text-gray-600 dark:text-gray-300">
            Get started by going to{' '}
            <code className="font-bold text-gray-900 dark:text-gray-100">
              <Link href="/dashboardv0">dashboard</Link>
            </code>
          </span>
        </div>
      </header>
      <section className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 text-center mt-12">
        <Card className="flex flex-col">
          <Image
            src="/neural.jpg"
            alt="Workflow Image"
            width={400}
            height={200}
            className="rounded-t-lg w-full h-32 object-cover"
          />
          <CardHeader>
            <CardTitle>Automate Your Workflow</CardTitle>
            <CardDescription>
              Automatically sync GitHub commits to Notion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              No more manual updates. Ensure your Notion workspace is always
              up-to-date with the latest changes from your repositories.
            </p>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <Image
            src="/collab.jpg"
            alt="Collaboration Image"
            width={400}
            height={200}
            className="rounded-t-lg w-full h-32 object-cover"
          />
          <CardHeader>
            <CardTitle>Enhance Collaboration</CardTitle>
            <CardDescription>Keep your team on the same page.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">
              Share real-time updates with your team and enhance collaboration
              by integrating commit messages and branch updates directly into
              your Notion pages.
            </p>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <Image
            src="/gh.webp"
            alt="Repository Image"
            width={400}
            height={200}
            className="rounded-t-lg w-full h-32 object-cover"
          />
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
        <Card className="flex flex-col md:col-span-2">
          <Image
            src="/document.jpg"
            alt="Documentation Image"
            width={400}
            height={200}
            className="rounded-t-lg w-full h-32 object-cover"
          />
          <CardHeader>
            <CardTitle>Documentation & Guides</CardTitle>
            <CardDescription>
              Find in-depth information and guides to help you get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/docs">View Documentation</Link>
            </Button>
            <div className="mt-4">
              <Input
                type="text"
                placeholder="Search documentation..."
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="w-full max-w-3xl mt-12">
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-6">FAQ</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>What is NotionSync?</AccordionTrigger>
            <AccordionContent>
              NotionSync is a tool that helps you automatically sync your GitHub commits with Notion. It keeps your project management up-to-date by integrating commit messages and branch updates directly into your Notion pages.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How does NotionSync work?</AccordionTrigger>
            <AccordionContent>
              NotionSync connects to your GitHub repositories and monitors for new commits. When a new commit is detected, it fetches the commit details and updates your Notion workspace with this information.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Can I contribute to NotionSync?</AccordionTrigger>
            <AccordionContent>
              Absolutely! NotionSync is an open-source project. You can explore the source code, report issues, and contribute to the project by visiting our GitHub repository.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </main>
  )
}

export default Home
