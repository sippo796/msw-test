# MSW + Next.js basePath 問題の解決方法

## 問題の概要

Next.jsで`basePath`を設定している場合、MSW (Mock Service Worker) が正常に動作しない問題が発生します。

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  basePath: '/base',
  assetPrefix: '/base',
};
```

この設定により、アプリケーションは `http://localhost:3000/base` でアクセスできるようになりますが、MSWのService Workerファイルのパス解決に問題が生じます。

## 試行した解決方法と結果

### 1. Service Workerパスの調整 ❌

```typescript
// 試行1: basePathに合わせてService Workerパスを調整
await worker.start({
  serviceWorker: {
    url: '/base/mockServiceWorker.js',
  },
})
```

**結果**: `404 Not Found` - Service Workerファイルが見つからない

### 2. Next.js rewrites機能の使用 ❌

```typescript
// next.config.ts
async rewrites() {
  return [
    {
      source: '/mockServiceWorker.js',
      destination: '/base/mockServiceWorker.js',
    },
  ];
}
```

**結果**: 依然として404エラーが発生

### 3. MSW v2 Client-side Interceptor方式 ❌

```typescript
// mode: 'browser'を指定してService Workerを回避する試み
await worker.start({
  mode: 'browser',
  onUnhandledRequest: 'bypass',
})
```

**結果**: MSW v2でも内部的にService Workerが必要で、同じ404エラーが発生

### 4. Service Workerスコープの調整 ❌

```typescript
await worker.start({
  serviceWorker: {
    url: '/base/mockServiceWorker.js',
    options: {
      scope: '/base/',
    },
  },
})
```

**結果**: スコープを調整しても根本的なパス問題は解決せず

## 最終的な解決方法: カスタムFetch Mock ✅

MSWを完全に使用せず、`window.fetch`を直接オーバーライドする方法で解決しました。

### 実装方法

#### 1. カスタムFetch Mockの作成

```typescript
// src/mocks/fetchMock.ts
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
    
    // URLからパス部分だけを抽出（basePathの影響を除去）
    let path = fullUrl
    try {
      const urlObj = new URL(fullUrl, window.location.origin)
      path = urlObj.pathname
    } catch {
      path = fullUrl
    }
    
    const key = `${method.toUpperCase()}:${path}`

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

      return response
    }

    // モックが見つからない場合は元のfetchを呼び出す
    return originalFetch(input, init)
  }

  console.log('🎭 Fetch mocking enabled!')
}
```

#### 2. Providerでの初期化

```typescript
// src/app/providers.tsx
'use client'

import { useEffect } from 'react'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('../mocks/fetchMock').then(({ enableFetchMocking }) => {
        enableFetchMocking()
      })
    }
  }, [])

  return <>{children}</>
}
```

#### 3. App Layoutでの適用

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MSWProvider>
          {children}
        </MSWProvider>
      </body>
    </html>
  );
}
```

## メリット

1. **Service Worker不要**: ファイル配置やパス解決の問題を完全に回避
2. **basePath対応**: Next.jsのbasePathの影響を受けない
3. **軽量**: MSWよりもシンプルで軽量
4. **デバッグ容易**: コンソールでリクエスト/レスポンスを直接確認可能
5. **柔軟性**: TypeScriptの型安全性を活用してモックデータを管理

## デメリット

1. **MSWの高度な機能が使えない**: MSWのGraphQL対応、ネットワーク遅延シミュレーションなど
2. **手動実装**: パターンマッチングやレスポンス生成を自前で実装する必要
3. **維持コスト**: MSWのようなエコシステムがないため、機能追加は自前で対応

## 結論

Next.jsの`basePath`を使用する場合、MSWは現時点では実用的ではありません。Service Workerのパス解決問題が根本的な原因であり、複数の回避策を試みましたがいずれも失敗しました。

カスタムFetch Mockによる解決方法は、シンプルなAPIモックには十分実用的で、basePathの制約を受けない確実な方法です。

## 使用方法

```bash
# 開発サーバー起動
npm run dev:mock

# アクセス
http://localhost:3000/base
```

ブラウザのコンソールで「🎭 Fetch mocking enabled!」メッセージが確認できれば、モックが正常に動作しています。