# 🧪 API Testing Guide

This guide explains how to test Next.js API routes in your application.

## 📋 Overview

API route testing ensures your backend endpoints work correctly, handle errors gracefully, and return the expected responses.

## 🛠️ Setup

### Dependencies

- `node-mocks-http`: Mocks Next.js request/response objects
- `jest`: Testing framework
- `@testing-library/jest-dom`: Additional matchers

### Installation

```bash
npm install --save-dev node-mocks-http
```

## 📝 Test Structure

### Basic API Test Template

```typescript
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/your-endpoint'

describe('/api/your-endpoint', () => {
  it('handles GET requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toMatchObject({
      // your expected data
    })
  })
})
```

## 🎯 Testing Patterns

### 1. **HTTP Method Testing**

```typescript
it('returns 405 for unsupported methods', async () => {
  const { req, res } = createMocks({
    method: 'PUT',
  })

  await handler(req, res)

  expect(res._getStatusCode()).toBe(405)
  expect(res._getHeaders()).toHaveProperty('allow')
})
```

### 2. **Query Parameters**

```typescript
it('handles query parameters', async () => {
  const { req, res } = createMocks({
    method: 'GET',
    query: {
      token: 'test-token',
      repos: JSON.stringify([{ owner: 'test', name: 'repo' }]),
    },
  })

  await handler(req, res)
  // assertions...
})
```

### 3. **Request Body**

```typescript
it('handles POST with body', async () => {
  const { req, res } = createMocks({
    method: 'POST',
    body: {
      githubToken: 'test-token',
      repos: [{ owner: 'test', name: 'repo' }],
    },
  })

  await handler(req, res)
  // assertions...
})
```

### 4. **Headers**

```typescript
it('uses authorization header', async () => {
  const { req, res } = createMocks({
    method: 'GET',
    headers: {
      authorization: 'Bearer test-token',
    },
  })

  await handler(req, res)
  // assertions...
})
```

### 5. **Error Handling**

```typescript
it('handles missing required parameters', async () => {
  const { req, res } = createMocks({
    method: 'GET',
    query: {
      // missing required params
    },
  })

  await handler(req, res)

  expect(res._getStatusCode()).toBe(400)
  const data = JSON.parse(res._getData())
  expect(data.error).toContain('required')
})
```

## 🔧 Mocking External APIs

### Mocking Fetch

```typescript
// Mock fetch globally
global.fetch = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

it('handles external API calls', async () => {
  // Mock successful response
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: 'test' }),
  })

  // Mock error response
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
  })

  // Mock network error
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
})
```

### Mocking Multiple API Calls

```typescript
it('handles multiple API calls', async () => {
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => commits,
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => userDetails,
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => commitDiff,
    })
})
```

## 🧹 Environment Variables

### Testing with Environment Variables

```typescript
describe('/api/config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('uses environment variables', async () => {
    process.env.GITHUB_TOKEN = 'test-token'

    // Import after setting env vars
    const handler = (await import('@/pages/api/config')).default

    // test...
  })
})
```

## 📊 Response Testing

### Status Codes

```typescript
expect(res._getStatusCode()).toBe(200) // Success
expect(res._getStatusCode()).toBe(400) // Bad Request
expect(res._getStatusCode()).toBe(401) // Unauthorized
expect(res._getStatusCode()).toBe(405) // Method Not Allowed
expect(res._getStatusCode()).toBe(500) // Internal Server Error
```

### Response Data

```typescript
const data = JSON.parse(res._getData())

// Exact match
expect(data).toEqual(expectedData)

// Partial match
expect(data).toMatchObject({
  message: 'OK',
  timestamp: expect.any(Number),
})

// Array testing
expect(Array.isArray(data)).toBe(true)
expect(data.length).toBeGreaterThan(0)

// Property testing
expect(data).toHaveProperty('results')
expect(data.results).toHaveLength(1)
```

### Headers

```typescript
expect(res._getHeaders()).toHaveProperty('allow')
expect(res._getHeaders().allow).toEqual(['GET', 'POST'])
```

## 🚀 Running Tests

### Run All API Tests

```bash
npm test -- --testPathPattern=api
```

### Run Specific API Test

```bash
npm test -- --testPathPattern=health
```

### Run with Coverage

```bash
npm run test:coverage -- --testPathPattern=api
```

## 📁 File Organization

```
src/__tests__/api/
├── health.test.ts          # Health check endpoint
├── config.test.ts          # Configuration endpoint
├── commits.test.ts         # Commits endpoint
├── auth.test.ts            # Authentication endpoints
└── README.md              # This guide
```

## 🎯 Best Practices

### 1. **Test All HTTP Methods**

- Test supported methods (GET, POST, etc.)
- Test unsupported methods (should return 405)

### 2. **Test Error Scenarios**

- Missing required parameters
- Invalid data formats
- External API failures
- Network errors

### 3. **Test Edge Cases**

- Empty arrays/objects
- Large payloads
- Special characters in data

### 4. **Mock External Dependencies**

- Never make real API calls in tests
- Mock all external services
- Test both success and failure scenarios

### 5. **Clean Up**

- Reset mocks between tests
- Clean up environment variables
- Avoid test pollution

## 🔍 Debugging

### View Response Data

```typescript
console.log('Status:', res._getStatusCode())
console.log('Headers:', res._getHeaders())
console.log('Data:', JSON.parse(res._getData()))
```

### Mock Debugging

```typescript
// Check if fetch was called
expect(global.fetch).toHaveBeenCalledWith(
  'https://api.github.com/repos/test/repo/commits',
  expect.objectContaining({
    headers: expect.objectContaining({
      Authorization: 'token test-token',
    }),
  })
)
```

## 📚 Examples

See the existing test files for complete examples:

- `health.test.ts` - Simple GET endpoint
- `config.test.ts` - GET/POST with environment variables
- `commits.test.ts` - Complex API with external calls

## 🚨 Common Issues

### 1. **Module Caching**

```typescript
// Solution: Reset modules and re-import
jest.resetModules()
const handler = (await import('@/pages/api/config')).default
```

### 2. **Environment Variables**

```typescript
// Solution: Set env vars before importing
process.env.TEST_VAR = 'value'
const handler = (await import('@/pages/api/config')).default
```

### 3. **Async/Await**

```typescript
// Always await the handler
await handler(req, res)
```

### 4. **Response Format**

```typescript
// Parse JSON response
const data = JSON.parse(res._getData())
```

---

**Happy Testing! 🧪✨**
