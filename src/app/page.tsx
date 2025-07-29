'use client'

import { useState, useEffect } from 'react'

interface User {
  id: number
  name: string
  email: string
  age?: number
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '' })
  const [message, setMessage] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async (id: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${id}`)
      const data = await response.json()
      setSelectedUser(data)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    if (!newUser.name || !newUser.email) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })
      const data = await response.json()
      setMessage(`ユーザー「${data.name}」を作成しました！`)
      setNewUser({ name: '', email: '' })
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          MSW Sample App
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              ユーザー一覧
            </h2>
            
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '読み込み中...' : 'ユーザー取得'}
            </button>
            
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => fetchUser(user.id)}
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              ユーザー詳細
            </h2>
            
            {selectedUser ? (
              <div className="space-y-2">
                <div><strong>ID:</strong> {selectedUser.id}</div>
                <div><strong>名前:</strong> {selectedUser.name}</div>
                <div><strong>メール:</strong> {selectedUser.email}</div>
                {selectedUser.age && (
                  <div><strong>年齢:</strong> {selectedUser.age}歳</div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">ユーザーを選択してください</p>
            )}
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">
              新規ユーザー作成
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名前</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="田中太郎"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">メール</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tanaka@example.com"
                />
              </div>
              
              <button
                onClick={createUser}
                disabled={loading || !newUser.name || !newUser.email}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? '作成中...' : 'ユーザー作成'}
              </button>
              
              {message && (
                <div className="text-green-600 font-medium">{message}</div>
              )}
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">
              MSW Status
            </h2>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ Fetch API Mock 起動済み</li>
              <li>✅ カスタムモックハンドラー設定完了</li>
              <li>✅ モックAPI (/api/users) 動作中</li>
              <li>🎯 MSW・Service Worker完全不要！</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
