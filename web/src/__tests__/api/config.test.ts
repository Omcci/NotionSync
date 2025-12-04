import { createMocks } from 'node-mocks-http'

describe('/api/config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns current config on GET request', async () => {
    // Set up environment variables
    process.env.GITHUB_TOKEN = 'test-github-token'
    process.env.NOTION_TOKEN = 'test-notion-token'
    process.env.REPO_NAME = 'test-repo'
    process.env.ORG_NAME = 'test-org'

    // Import the handler after setting environment variables
    const configHandler = (await import('@/pages/api/config')).default

    const { req, res } = createMocks({
      method: 'GET',
    })

    await configHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toEqual({
      githubToken: 'test-github-token',
      notionToken: 'test-notion-token',
      repoName: 'test-repo',
      orgName: 'test-org',
    })
  })

  it('updates config on POST request with valid data', async () => {
    const newConfig = {
      githubToken: 'new-github-token',
      notionToken: 'new-notion-token',
      repoName: 'new-repo',
      orgName: 'new-org',
    }

    const configHandler = (await import('@/pages/api/config')).default

    const { req, res } = createMocks({
      method: 'POST',
      body: newConfig,
    })

    await configHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toEqual(newConfig)
  })

  it('returns 400 when POST request is missing required fields', async () => {
    const invalidConfig = {
      githubToken: 'test-token',
      // Missing other required fields
    }

    const configHandler = (await import('@/pages/api/config')).default

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidConfig,
    })

    await configHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('All fields are required')
  })

  it('returns 405 for unsupported methods', async () => {
    const configHandler = (await import('@/pages/api/config')).default

    const { req, res } = createMocks({
      method: 'PUT',
    })

    await configHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(res._getHeaders()).toHaveProperty('allow')
    expect(res._getHeaders().allow).toEqual(['GET', 'POST'])
  })

  it('handles empty environment variables gracefully', async () => {
    // Clear environment variables
    delete process.env.GITHUB_TOKEN
    delete process.env.NOTION_TOKEN
    delete process.env.REPO_NAME
    delete process.env.ORG_NAME

    const configHandler = (await import('@/pages/api/config')).default

    const { req, res } = createMocks({
      method: 'GET',
    })

    await configHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toEqual({
      githubToken: '',
      notionToken: '',
      repoName: '',
      orgName: '',
    })
  })
})
