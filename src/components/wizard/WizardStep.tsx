'use client'

import type { WizardQuestion } from '@/lib/types'

export default function WizardStep({
  question,
  value,
  onChange,
}: {
  question: WizardQuestion
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
}) {
  const isMulti = question.input_type === 'multi_select'
  const options = question.options || []
  const selectedValues = isMulti
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === 'string'
      ? [value]
      : []

  function handleSelect(optionValue: string) {
    if (isMulti) {
      const current = Array.isArray(value) ? value : []
      if (current.includes(optionValue)) {
        onChange(current.filter((v) => v !== optionValue))
      } else {
        onChange([...current, optionValue])
      }
    } else {
      onChange(optionValue)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {question.question_text}
      </h2>
      {question.question_subtext && (
        <p className="text-gray-500 mb-6">{question.question_subtext}</p>
      )}
      {isMulti && (
        <p className="text-sm text-violet-600 font-medium mb-4">
          Select all that apply
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`relative text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              {isMulti && (
                <span
                  className={`absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-colors ${
                    isSelected
                      ? 'bg-violet-500 border-violet-500 text-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && '✓'}
                </span>
              )}
              <span
                className={`block text-sm font-medium ${
                  isSelected ? 'text-violet-700' : 'text-gray-900'
                }`}
              >
                {option.label}
              </span>
              {option.description && (
                <span className="block text-xs text-gray-400 mt-0.5">
                  {option.description}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {question.help_text && (
        <p className="text-xs text-gray-400 mt-4">{question.help_text}</p>
      )}
    </div>
  )
}
