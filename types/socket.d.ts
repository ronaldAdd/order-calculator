import type { Server as NetServer } from 'net'
import type { Server as HTTPServer } from 'http'
import type { Socket } from 'net'
import type { NextApiResponse } from 'next'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      httpServer: HTTPServer
      wss?: import('ws').Server
    }
  }
}
