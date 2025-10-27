// lib/pusherClient.ts
import Pusher from 'pusher-js'

export const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  authEndpoint: '/api/pusher/auth', // kalau pakai private channel
})
