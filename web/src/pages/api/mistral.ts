import { NextApiRequest, NextApiResponse } from 'next'
import MistralClient from '@mistralai/mistralai'

const mistralToken = process.env.MISTRAL_TOKEN
const client = new MistralClient(mistralToken)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { commits } = req.body

  if (!commits || !Array.isArray(commits) || commits.length === 0) {
    return res.status(400).json({ message: 'No commits provided' })
  }

  const combinedCommitMessage = commits.map((c) => c.commitMessage).join('\n\n')
  const combinedDiff = commits.map((c) => c.diff).join('\n\n')

  const prompt = `
    Based on the series of commits and code changes below, provide a cohesive summary in HTML format.
    Please ensure:
    - Use sentence case for headings (capitalize only the first word in titles).
    - Avoid using uppercase for every word in titles.
    - Provide the output directly in HTML format.
    - Use the following Tailwind CSS classes for headings:
        - <h1 class="text-3xl font-bold"> for the main heading
        - <h2 class="text-2xl font-semibold"> for subheadings
        - <h3 class="text-xl font-medium"> for smaller sections
        - <p class="text-gray-600> for paragraphs
        - <li class="text-gray-600"> for list items
    - Use <ul class="list-disc ml-6"> for bullet points and <strong> to bold key points.
    
    Summary should include:
    - The overall purpose of the changes
    - Key code changes, such as additions, deletions, or modifications
    - Logic improvements, bug fixes, or optimizations made to the application
    - Impact on performance and user experience
    Commit Message: ${combinedCommitMessage}
    Code Changes: ${combinedDiff}
  `
  try {
    const chatResponse = await client.chat({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
    })

    const summary =
      chatResponse.choices[0]?.message?.content || 'No summary generated'

    res.status(200).json({ summary })
  } catch (error) {
    console.error('Error generating summary:', error)
    res.status(500).json({ message: 'Failed to generate summary' })
  }
}
