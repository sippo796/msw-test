import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: '田中太郎', email: 'tanaka@example.com' },
      { id: 2, name: '佐藤花子', email: 'sato@example.com' },
      { id: 3, name: '鈴木一郎', email: 'suzuki@example.com' },
    ])
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params
    const users = [
      { id: 1, name: '田中太郎', email: 'tanaka@example.com', age: 28 },
      { id: 2, name: '佐藤花子', email: 'sato@example.com', age: 32 },
      { id: 3, name: '鈴木一郎', email: 'suzuki@example.com', age: 25 },
    ]
    
    const user = users.find(u => u.id === Number(id))
    
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json(user)
  }),

  http.post('/api/users', async ({ request }) => {
    const newUser = await request.json() as { name: string; email: string }
    
    return HttpResponse.json(
      {
        id: Math.floor(Math.random() * 1000) + 4,
        ...newUser,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),
]