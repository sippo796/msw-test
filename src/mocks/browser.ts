import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function enableMocking() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: false,
    })
    console.log('🎭 MSW started successfully!')
  } catch (error) {
    console.error('❌ MSW failed to start:', error)
  }
}