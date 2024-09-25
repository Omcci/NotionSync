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
    // Given the commit message and code changes below, provide a bullet-point summary highlighting:
    // - The purpose of the commit based on the commit message
    // - What functions or methods were added, deleted, or modified according to the code diff
    // - Any significant changes in logic or functionality
    Based on the series of commits and code changes below, provide a cohesive summary. Please format the summary with clear section headings and bullet points where applicable additionnaly to bold words if necessary, to make it easy to read. Address the following:
    1- Overall Purpose of the changes: What is the main objective of this series of commits?
    2- Key Code Changes: Summarize the significant changes made across files and functions. Identify any key files, methods, or components that were added, modified, or removed.
    3- Logic Improvements: How have these changes impacted the overall logic of the application? Highlight any optimizations or bug fixes.
    4- Impact on Performance and User Experience: What is the cumulative effect of these changes on the system’s performance or user experience?

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
