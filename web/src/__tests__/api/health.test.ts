import { createMocks } from 'node-mocks-http'
import healthHandler from '@/pages/api/health'

describe('/api/health', () => {
  it('returns 200 and health status for GET request', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await healthHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toMatchObject({
      message: 'OK',
      environment: expect.any(String),
      version: expect.any(String),
    })
    expect(data.uptime).toBeGreaterThan(0)
    expect(data.timestamp).toBeGreaterThan(0)
  })

  it('returns 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    })

    await healthHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
    const data = JSON.parse(res._getData())
    expect(data.message).toBe('Method not allowed')
  })
})
