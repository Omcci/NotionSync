import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
    const { githubToken } = req.query
    if (!githubToken || typeof githubToken !== 'string') {
        return res.status(400).json({ error: 'GitHub token is required' })
    }

    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `token ${githubToken}`,
                'User-Agent': 'NotionSync-App'
            },
        })
        if (!response.ok) {
            const errorText = await response.text()
            console.error('GitHub API error:', errorText)
            return res.status(response.status).json({
                error: `GitHub API error: ${response.status}`,
                details: errorText
            })
        }

        const userData = await response.json()
        res.status(200).json({
            success: true,
            user: userData.login,
            scopes: response.headers.get('x-oauth-scopes'),
            rateLimit: {
                limit: response.headers.get('x-ratelimit-limit'),
                remaining: response.headers.get('x-ratelimit-remaining'),
                reset: response.headers.get('x-ratelimit-reset')
            }
        })
    } catch (error: any) {
        console.error('Error testing GitHub token:', error)
        res.status(500).json({ error: error.message })
    }
} 