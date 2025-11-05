// middleware.ts
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const FIREBASE_ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`

// Fungsi ambil public key dari Firebase
async function getKey(kid: string): Promise<CryptoKey> {
  const res = await fetch(JWKS_URL)
  if (!res.ok) throw new Error('Failed to fetch JWKS keys')
  const jwks = await res.json()
  const key = jwks.keys.find((key: any) => key.kid === kid)
  if (!key) throw new Error('Public key not found')

  return await crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )
}

export async function middleware(request: Request) {
  const url = new URL(request.url)
  const { pathname } = url

  const tokenCookie = (request as any).cookies.get('__session')
  const token = typeof tokenCookie === 'string' ? tokenCookie : tokenCookie?.value

  const publicPaths = ['/', '/install' , '/signin', '/forgot-password', '/daftar']
  const isPublic = publicPaths.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(publicPath + '/')
  )

  // 🛑 Tidak ada token, dan halaman bukan public → redirect ke /signin
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // ✅ Ada token dan sedang di /signin → redirect sesuai role
  if (token && pathname === '/signin' || token && pathname === '/') {
    try {
      const [headerB64] = token.split('.')
      const headerJson = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf8'))
      const key = await getKey(headerJson.kid)

      const { payload } = await jwtVerify(token, key, {
        issuer: FIREBASE_ISSUER,
        audience: FIREBASE_PROJECT_ID,
      })

      const role = payload.role || 'user'


      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else if (role === 'collector') {
        return NextResponse.redirect(new URL('/collector', request.url))
      } else if (role === 'user') {
        return NextResponse.redirect(new URL('/user', request.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Failed to verify token on signin redirect:', error)
      return NextResponse.redirect(new URL('/signin', request.url))
    }
  }

  // ✅ Token tersedia → validasi dan cek akses
  if (token) {
    try {
      const [headerB64] = token.split('.')
      const headerJson = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf8'))
      const key = await getKey(headerJson.kid)

      const { payload } = await jwtVerify(token, key, {
        issuer: FIREBASE_ISSUER,
        audience: FIREBASE_PROJECT_ID,
      })

      const role = payload.role || 'user'

      // 🛑 Halaman admin tapi bukan admin
      if (pathname.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      // 🛑 Halaman collector tapi bukan collector
      if (pathname.startsWith('/collector') && role !== 'collector') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      // 🛑 Halaman user tapi bukan user
      if (pathname.startsWith('/user') && role !== 'user') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      
      // ✅ Tambahan: Jika ingin admin juga bisa akses collector
      // if (pathname.startsWith('/collector') && !['admin', 'collector'].includes(role)) {
      //   return NextResponse.redirect(new URL('/unauthorized', request.url))
      // }

    } catch (error) {
      console.error('Token invalid or expired:', error)
      return NextResponse.redirect(new URL('/signin', request.url))
    }
  }

  return NextResponse.next()
}

// Match semua path kecuali static assets & API
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpg|api).*)'],
}
