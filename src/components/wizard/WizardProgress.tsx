'use client'

export default function WizardProgress({
  totalSteps,
  currentStep,
  phase,
}: {
  totalSteps: number
  currentStep: number
  phase: 'questions' | 'review' | 'results'
}) {
  const progressPercent =
    phase === 'results'
      ? 100
      : phase === 'review'
        ? ((totalSteps) / (totalSteps + 1)) * 100
        : ((currentStep) / (totalSteps + 1)) * 100

  return (
    <div className="mb-8">
      {/* Mobile: simple text + bar */}
      <div className="sm:hidden">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {phase === 'results'
              ? 'Results'
              : phase === 'review'
                ? 'Review'
                : `Step ${currentStep + 1} of ${totalSteps}`}
          </span>
          <span className="text-sm text-gray-400">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop: step dots */}
      <div className="hidden sm:flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                i < currentStep && phase === 'questions'
                  ? 'bg-violet-500 text-white'
                  : i === currentStep && phase === 'questions'
                    ? 'bg-white border-2 border-violet-500 text-violet-600'
                    : phase === 'review' || phase === 'results'
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`w-4 h-0.5 mx-0.5 ${
                  i < currentStep || phase !== 'questions'
                    ? 'bg-violet-500'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
        {/* Review dot */}
        <div className="flex items-center">
          <div
            className={`w-4 h-0.5 mx-0.5 ${
              phase === 'review' || phase === 'results'
                ? 'bg-violet-500'
                : 'bg-gray-200'
            }`}
          />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              phase === 'review'
                ? 'bg-white border-2 border-violet-500 text-violet-600'
                : phase === 'results'
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            R
          </div>
        </div>
      </div>
    </div>
  )
}
