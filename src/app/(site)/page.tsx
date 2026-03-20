import Link from 'next/link'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
            Free Decision Tool
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Find the right property management software.<br />
            <span className="text-indigo-600">In 2 minutes.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            Answer a few questions about your portfolio and we will match you with the best software for your exact situation. No sales calls. No AI guesswork. Just a clear recommendation with a full explanation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/wizard"
              className="bg-indigo-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors text-lg"
            >
              Find My Software →
            </Link>
            <Link
              href="/vendors"
              className="bg-white text-gray-700 font-semibold px-8 py-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors text-lg"
            >
              Browse All Software
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Answer questions', desc: 'Tell us about your portfolio size, property types, budget, and must-have features.' },
              { step: '2', title: 'We run the logic', desc: 'Our deterministic decision engine evaluates every vendor against your exact requirements.' },
              { step: '3', title: 'Get your match', desc: 'Receive a ranked list of vendors with a full explanation of why each one suits you.' },
            ].map(item => (
              <div key={item.step} className="bg-white rounded-2xl p-8 border border-gray-100">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Why PropertyManageWiz</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Deterministic logic, not AI guesswork', desc: 'Every recommendation is produced by structured rules, not a language model. The same inputs always produce the same output.' },
              { title: 'We cover 55+ vendors', desc: 'From budget solo-landlord tools to enterprise platforms, every major option is in our database.' },
              { title: 'Full transparency', desc: 'We show you exactly why each vendor was recommended or excluded. No black box.' },
              { title: 'Disclosure: we earn referral commissions', desc: 'We are transparent about how we make money. Commissions never influence our recommendations — vendors cannot pay to rank higher.' },
            ].map(item => (
              <div key={item.title} className="flex gap-4 p-6 rounded-2xl border border-gray-100">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to find your software?</h2>
          <p className="text-indigo-200 mb-8">Takes 2 minutes. No email required.</p>
          <Link
            href="/wizard"
            className="bg-white text-indigo-600 font-semibold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors text-lg inline-block"
          >
            Start the Decision Wizard →
          </Link>
        </div>
      </section>
    </div>
  )
}
