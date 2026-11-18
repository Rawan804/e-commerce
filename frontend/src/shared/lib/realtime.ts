/**
 * shared/lib/realtime.ts
 *
 * The only place that creates the WebSocket (Laravel Echo + Reverb) connection.
 *
 * Private channels need authorisation: before subscribing, Echo calls the
 * authorizer below, which POSTs { socket_id, channel_name } to
 * /api/v1/broadcasting/auth through `apiClient` — so the JWT is attached
 * (and refreshed) exactly like any other API call. The backend answers 403
 * if the user is not allowed on that channel.
 */

import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { env } from '@/shared/config/env'
import { apiClient } from '@/shared/lib/apiClient'

;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

let echo: Echo<'reverb'> | null = null

export function getEcho(): Echo<'reverb'> {
  echo ??= new Echo({
    broadcaster: 'reverb',
    key: env.reverb.key,
    wsHost: env.reverb.host,
    wsPort: env.reverb.port,
    wssPort: env.reverb.port,
    forceTLS: env.reverb.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (error: Error | null, authData: { auth: string } | null) => void,
      ) => {
        apiClient
          .post<{ auth: string }>('/broadcasting/auth', {
            socket_id: socketId,
            channel_name: channel.name,
          })
          .then((data) => { callback(null, data) })
          .catch((error: unknown) => {
            callback(error instanceof Error ? error : new Error('Channel authorisation failed.'), null)
          })
      },
    }),
  })
  return echo
}

/** Call on logout so the next user does not reuse the previous user's subscriptions. */
export function disconnectRealtime(): void {
  echo?.disconnect()
  echo = null
}
