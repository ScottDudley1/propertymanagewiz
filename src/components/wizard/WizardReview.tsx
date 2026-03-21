'use client'

import type { WizardQuestion, WizardAnswers } from '@/lib/types'

function formatAnswer(
  question: WizardQuestion,
  value: string | string[] | undefined
): string {
  if (!value || (Array.isArray(value) && value.length === 0)) return 'Skipped'
  const options = question.options || []
  if (Array.isArray(value)) {
    return value
      .map((v) => options.find((o) => o.value === v)?.label || v)
      .join(', ')
  }
  return options.find((o) => o.value === value)?.label || value
}

export default function WizardReview({
  questions,
  answers,
  onEdit,
  onSubmit,
  onBack,
}: {
  questions: WizardQuestion[]
  answers: WizardAnswers
  onEdit: (stepIndex: number) => void
  onSubmit: () => void
  onBack: () => void
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Review your answers
      </h2>
      <p className="text-gray-500 mb-8">
        Check everything looks right before we find your match.
      </p>

      <div className="space-y-3 mb-10">
        {questions.map((q, i) => {
          const key = q.question_key as keyof WizardAnswers
          const value = answers[key]
          const display = formatAnswer(q, value as string | string[] | undefined)
          const isSkipped = display === 'Skipped'

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onEdit(i)}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors flex justify-between items-start gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {q.question_text}
                </p>
                <p
                  className={`text-sm mt-0.5 ${isSkipped ? 'text-gray-300 italic' : 'text-violet-600'}`}
                >
                  {display}
                </p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap mt-1">
                Edit
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-gray-300 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-600 transition-colors"
        >
          Get My Recommendations →
        </button>
      </div>
    </div>
  )
}
