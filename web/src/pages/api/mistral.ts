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

  const promptTemplate =
    process.env.NEXT_PUBLIC_MISTRAL_PROMPT || 'Default prompt content'

  const prompt = promptTemplate
    ?.replace('{COMBINED_COMMIT_MESSAGE}', combinedCommitMessage)
    .replace('{COMBINED_DIFF}', combinedDiff)
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
