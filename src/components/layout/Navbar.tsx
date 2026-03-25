import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">PropertyManage<span className="text-violet-500">Wiz</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/wizard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Find Software</Link>
            <Link href="/vendors" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Vendors</Link>
            <Link href="/compare" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Compare</Link>
            <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Guides</Link>
          </nav>
          <Link
            href="/wizard"
            className="bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-violet-600 transition-colors"
          >
            Find My Software
          </Link>
        </div>
      </div>
    </header>
  )
}
