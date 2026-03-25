import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-lg font-bold text-gray-900">
              PropertyManage<span className="text-violet-500">Wiz</span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 max-w-sm">
              The deterministic decision engine for property management software. Answer a few questions and get a tailored recommendation — no AI hallucinations, no affiliate bias.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tools</h3>
            <ul className="space-y-3">
              <li><Link href="/wizard" className="text-sm text-gray-500 hover:text-gray-900">Find My Software</Link></li>
              <li><Link href="/vendors" className="text-sm text-gray-500 hover:text-gray-900">Vendors</Link></li>
              <li><Link href="/compare" className="text-sm text-gray-500 hover:text-gray-900">Compare Tools</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Guides</h3>
            <ul className="space-y-3">
              <li><Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900">All Guides</Link></li>
              <li><Link href="/blog/how-to-choose" className="text-sm text-gray-500 hover:text-gray-900">How to Choose</Link></li>
              <li><Link href="/blog/pricing-guide" className="text-sm text-gray-500 hover:text-gray-900">Pricing Guide</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">&copy; 2026 PropertyManageWiz. All rights reserved.</p>
          <p className="text-xs text-gray-400">We may earn commissions from vendor referrals. This does not affect our recommendations.</p>
        </div>
      </div>
    </footer>
  )
}
