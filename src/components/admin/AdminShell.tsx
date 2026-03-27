'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Shield,
  MessageSquare,
  MessageCircle,
  Grid3X3,
  CalendarDays,
  Search,
  Blocks,
  Crosshair,
  BookOpen,
  Cpu,
  Database,
} from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'

interface AdminShellProps {
  children: ReactNode
  userEmail: string | null
}

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/blog', icon: FileText, label: 'Blog Manager' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/search-performance', icon: Search, label: 'Search Performance' },
  { href: '/admin/comments', icon: MessageSquare, label: 'Comment Capture' },
  { href: '/admin/blog-comments', icon: MessageCircle, label: 'Blog Comments' },
  { href: '/admin/matrix', icon: Grid3X3, label: 'Content Matrix' },
  { href: '/admin/flywheel', icon: TrendingUp, label: 'Flywheel' },
  { href: '/admin/calendar', icon: CalendarDays, label: 'Content Calendar' },
  { href: '/admin/builder', icon: Blocks, label: 'Template Builder' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
  { href: '/admin/mfa', icon: Shield, label: 'Security (MFA)' },
]

const internalTools = [
  { href: '/admin/niche-tracker', icon: Crosshair, label: 'Niche Tracker' },
  { href: '/admin/niche-engine', icon: Cpu, label: 'Niche Engine' },
  { href: '/admin/decision-engine-plan', icon: BookOpen, label: 'Strategy Plan' },
  { href: '/admin/decision-engine', icon: Database, label: 'Decision Engine' },
]

export function AdminShell({ children, userEmail }: AdminShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="text-xl font-bold text-gray-900">
          PropertyManage<span className="text-violet-500">Wiz</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-4 border-b border-gray-200">
            <Link href="/admin" className="text-xl font-bold text-gray-900">
              PropertyManage<span className="text-violet-500">Wiz</span>
            </Link>
            <p className="text-xs text-gray-500 mt-1">Admin Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-violet-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                </Link>
              )
            })}

            {/* Internal Tools */}
            <div className="pt-3 mt-3 border-t border-gray-200">
              <p className="px-3 pb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Internal Tools</p>
              {internalTools.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-violet-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* User & Logout */}
          <div className="px-3 py-3 border-t border-gray-200">
            {userEmail && (
              <p className="text-xs text-gray-500 mb-2 truncate px-3">{userEmail}</p>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
            <Link href="/">
              <span className="flex items-center gap-3 px-3 py-2 text-sm text-violet-500 hover:underline cursor-pointer">
                &larr; Back to Website
              </span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 bg-white">
        {children}
      </main>
    </div>
  )
}
