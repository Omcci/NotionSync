import { NextApiRequest, NextApiResponse } from 'next'
import MistralClient from '@mistralai/mistralai'
import { mistral_prompt, summary_prompt_multiple } from './prompt'

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

  try {
    let prompt: string

    if (commits.length === 1) {
      const commit = commits[0]
      prompt = mistral_prompt(commit.commitMessage, commit.diff)
    } else {
      prompt = summary_prompt_multiple(commits)
    }

    const chatResponse = await client.chat({
      model: 'codestral-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 1000,
    })

    const summary =
      chatResponse.choices[0]?.message?.content || 'No summary generated'

    res.status(200).json({
      summary,
      commitCount: commits.length,
      type: commits.length === 1 ? 'single' : 'multiple',
    })
  } catch (error) {
    console.error('Error generating summary:', error)
    res.status(500).json({
      message: 'Failed to generate summary',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
