'use client'

import { ReactNode, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Cookies from 'js-cookie'
import { useRouter } from 'next/router'
import Link from 'next/link'
import useUserStore from '../src/store/useUserStore'
import DarkModeToggle from '../components/DarkModeToggle'

interface MainLayoutProps {
  children: ReactNode
  title?: string
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null)

  const clearUser = useUserStore((state) => state.clearUser)
  const user = useUserStore((state) => state.user)

  const router = useRouter()

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(prev => !prev)
    } else {
      setSidebarCollapsed(prev => !prev)
    }
  }

  const sidebarWidth = sidebarCollapsed ? 'w-18' : 'w-64'
  const mainMarginLeft = sidebarCollapsed ? 'md:ml-18' : 'md:ml-64'

  const handleLogout = async () => {
    try {
      await signOut(auth)
      clearUser()
      Cookies.remove('__session')
      Cookies.remove('__role')
      router.push('/signin')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const rawMenuItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: '📊', // grafik dashboard
      role: ['admin'],
    },
    {
      label: 'Dashboard',
      href: '/collector',
      icon: '📋', // clipboard
      role: ['collector'],
    },
    {
      label: 'Dashboard',
      href: '/user',
      icon: '📈', // grafik naik
      role: ['user'],
    },
    {
      label: 'User Management',
      icon: '👤', // orang
      role: ['admin'],
      subItems: [
        { label: 'Lists', href: '/admin/user-lists' },
        { label: 'Audit Log', href: '/admin/audit-log' },
      ],
    },
    {
      label: 'Vest Order Calculator',
      href: '/admin/debtors',
      icon: '💳', // kartu kredit / piutang
      role: ['admin'],
    },
    {
      label: 'Bulk upload',
      href: '/admin/upload-file',
      icon: '💳', // kartu kredit / piutang
      role: ['admin'],
    },

  ]


  const menuItems = rawMenuItems.filter(item =>
    !item.role || (user?.role && item.role.includes(user.role))
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow flex items-center px-4 h-14 fixed top-0 left-0 right-0 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="ml-4 font-semibold text-lg text-gray-800 dark:text-white">Dashboard</h1>

        <div className="ml-auto flex items-center gap-4 relative">
          <DarkModeToggle />

          <div>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <span className="text-sm text-gray-800 dark:text-white">{user?.name || 'User'}</span>
              <img
                src={user?.avatar || 'https://i.pravatar.cc/40'}
                alt="avatar"
                className="rounded-full w-8 h-8 object-cover"
              />
              <svg
                className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded shadow-md z-50">
                <Link href="/profile" className="block px-4 py-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Profile</Link>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Overlay */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      ></div>

      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-gray-900 fixed top-14 bottom-0 z-40 shadow-lg flex flex-col transition-transform duration-300 ease ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${sidebarWidth}`}
      >
        <nav className="flex-1 overflow-y-auto space-y-1 p-2">
          {menuItems.map(({ label, href, icon, subItems }) => (
            <div key={label} className="group relative">
              {subItems ? (
                <>
                  <button
                    onClick={() => setOpenSubMenu(openSubMenu === label ? null : label)}
                    className="flex items-center justify-between w-full px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded"
                  >
                    <div className="flex items-center">
                      <span className="text-lg">{icon}</span>
                      {!sidebarCollapsed && <span className="ml-3">{label}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="ml-auto">{openSubMenu === label ? '▲' : '▼'}</span>
                    )}
                  </button>

                  {openSubMenu === label && !sidebarCollapsed && (
                    <div className="ml-8 mt-1 space-y-1 bg-white dark:bg-gray-900 px-2 py-2 rounded shadow transition-all">
                      {subItems.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block px-3 py-1 text-sm text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  {sidebarCollapsed && (
                    <div className="absolute left-full top-2 hidden group-hover:block z-50">
                      <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded shadow-lg p-2 w-44 space-y-1">
                        {subItems.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="block px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={href || '#'}
                  className="flex items-center px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <span className="text-lg">{icon}</span>
                  {!sidebarCollapsed && <span className="ml-3">{label}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 absolute bottom-0 w-full"
        >
          <svg
            className={`w-6 h-6 mx-auto text-gray-600 dark:text-gray-300 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-6 mt-14 transition-all duration-300 ease ${mainMarginLeft}`}>
        {children}
      </main>
    </div>
  )
}
