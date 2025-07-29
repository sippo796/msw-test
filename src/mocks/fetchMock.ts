type MockResponse = {
  status?: number
  data: any
}

const mockData: Record<string, MockResponse> = {
  'GET:/api/users': {
    data: [
      { id: 1, name: '田中太郎', email: 'tanaka@example.com' },
      { id: 2, name: '佐藤花子', email: 'sato@example.com' },
      { id: 3, name: '鈴木一郎', email: 'suzuki@example.com' },
    ]
  },
  'GET:/api/users/1': {
    data: { id: 1, name: '田中太郎', email: 'tanaka@example.com', age: 28 }
  },
  'GET:/api/users/2': {
    data: { id: 2, name: '佐藤花子', email: 'sato@example.com', age: 32 }
  },
  'GET:/api/users/3': {
    data: { id: 3, name: '鈴木一郎', email: 'suzuki@example.com', age: 25 }
  },
  'POST:/api/users': {
    status: 201,
    data: (body: any) => ({
      id: Math.floor(Math.random() * 1000) + 4,
      ...body,
      createdAt: new Date().toISOString(),
    })
  }
}

export function enableFetchMocking() {
  if (typeof window === 'undefined') return

  const originalFetch = window.fetch

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const fullUrl = input.toString()
    const method = init?.method || 'GET'
    
    // URLからパス部分だけを抽出（basePathを除去）
    let path = fullUrl
    try {
      const urlObj = new URL(fullUrl, window.location.origin)
      path = urlObj.pathname
    } catch {
      path = fullUrl
    }
    
    const key = `${method.toUpperCase()}:${path}`

    console.log(`🎭 Fetch intercepted:`)
    console.log(`  Full URL: ${fullUrl}`)
    console.log(`  Path: ${path}`)
    console.log(`  Key: ${key}`)
    console.log(`  Available keys:`, Object.keys(mockData))

    const mockResponse = mockData[key]
    if (mockResponse) {
      let responseData = mockResponse.data
      
      if (method === 'POST' && typeof responseData === 'function') {
        const body = init?.body ? JSON.parse(init.body as string) : {}
        responseData = responseData(body)
      }

      const response = new Response(JSON.stringify(responseData), {
        status: mockResponse.status || 200,
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log(`✅ Mock response:`, responseData)
      return response
    }

    console.log(`❌ No mock found for: ${key}`)
    // モックが見つからない場合は元のfetchを呼び出す
    return originalFetch(input, init)
  }

  console.log('🎭 Fetch mocking enabled!')
}