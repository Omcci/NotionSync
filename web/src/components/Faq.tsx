import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'

const Faq = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>What is NotionSync?</AccordionTrigger>
          <AccordionContent>
            NotionSync is a tool that helps you automatically sync your GitHub
            commits with Notion. It keeps your project management up-to-date by
            integrating commit messages and branch updates directly into your
            Notion pages.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>How does NotionSync work?</AccordionTrigger>
          <AccordionContent>
            NotionSync connects to your GitHub repositories and monitors for new
            commits. When a new commit is detected, it fetches the commit
            details and updates your Notion workspace with this information.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Can I contribute to NotionSync?</AccordionTrigger>
          <AccordionContent>
            NotionSync is an open-source project. You can explore the source
            code, report issues, and contribute to the project by visiting our
            GitHub repository.
          </AccordionContent>
          
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default Faq
