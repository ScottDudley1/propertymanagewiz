'use client'

import { useState, useCallback } from 'react'
import type {
  WizardQuestion,
  VendorBundle,
  DecisionRule,
  WizardAnswers,
  ScoredVendor,
  RuleExecutionLogEntry,
} from '@/lib/types'
import { scoreVendors } from '@/lib/scoring-engine'
import { createClient } from '@/lib/supabase'
import WizardProgress from './WizardProgress'
import WizardStep from './WizardStep'
import WizardReview from './WizardReview'
import WizardResults from './WizardResults'

type Phase = 'questions' | 'review' | 'results'

export default function WizardClient({
  questions,
  vendorBundles,
  rules,
}: {
  questions: WizardQuestion[]
  vendorBundles: VendorBundle[]
  rules: DecisionRule[]
}) {
  const [phase, setPhase] = useState<Phase>('questions')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<WizardAnswers>({})
  const [results, setResults] = useState<ScoredVendor[] | null>(null)

  const currentQuestion = questions[step]
  const isLastStep = step === questions.length - 1
  const isRequired = currentQuestion?.is_required ?? false

  // Get the current answer for this question
  const currentValue = currentQuestion
    ? (answers[currentQuestion.question_key as keyof WizardAnswers] as
        | string
        | string[]
        | undefined)
    : undefined

  // Check if current step has a valid answer
  const hasAnswer =
    currentValue !== undefined &&
    currentValue !== '' &&
    (!Array.isArray(currentValue) || currentValue.length > 0)

  const canProceed = !isRequired || hasAnswer

  const handleAnswer = useCallback(
    (value: string | string[]) => {
      if (!currentQuestion) return
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.question_key]: value,
      }))
    },
    [currentQuestion]
  )

  function handleNext() {
    if (isLastStep) {
      setPhase('review')
    } else {
      setStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (phase === 'review') {
      setPhase('questions')
      setStep(questions.length - 1)
    } else if (step > 0) {
      setStep((s) => s - 1)
    }
  }

  function handleEditFromReview(stepIndex: number) {
    setStep(stepIndex)
    setPhase('questions')
  }

  async function handleSubmit() {
    // Run the scoring engine
    const { scoredVendors, ruleLog } = scoreVendors(
      answers,
      vendorBundles,
      rules
    )
    setResults(scoredVendors)
    setPhase('results')

    // Fire-and-forget: save session to Supabase
    try {
      const supabase = createClient()
      const sessionToken = crypto.randomUUID()
      const recommended = scoredVendors
        .filter((sv) => !sv.excluded)
        .slice(0, 3)
        .map((sv) => sv.vendor.id)

      await supabase.from('de_decision_sessions').insert({
        session_token: sessionToken,
        inputs: answers,
        rule_execution_log: ruleLog,
        scored_vendors: scoredVendors.map((sv) => ({
          vendor_id: sv.vendor.id,
          vendor_name: sv.vendor.name,
          score: sv.score,
          excluded: sv.excluded,
          exclusion_reason: sv.exclusion_reason,
        })),
        recommended_vendor_ids: recommended,
      })
    } catch {
      // Session tracking failure should not break the wizard
    }
  }

  function handleStartOver() {
    setPhase('questions')
    setStep(0)
    setAnswers({})
    setResults(null)
  }

  return (
    <div className="bg-white min-h-screen">
      <div
        className={`mx-auto px-4 sm:px-6 lg:px-8 py-12 ${phase === 'results' ? 'max-w-5xl' : 'max-w-3xl'}`}
      >
        {/* Progress */}
        {phase !== 'results' && (
          <WizardProgress
            totalSteps={questions.length}
            currentStep={step}
            phase={phase}
          />
        )}

        {/* Questions phase */}
        {phase === 'questions' && currentQuestion && (
          <div>
            <WizardStep
              question={currentQuestion}
              value={currentValue}
              onChange={handleAnswer}
            />

            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-gray-300 transition-colors"
                >
                  Back
                </button>
              )}
              {!isRequired && !hasAnswer && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-500 font-medium hover:border-gray-300 transition-colors"
                >
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  canProceed
                    ? 'bg-violet-500 text-white hover:bg-violet-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLastStep ? 'Review Answers' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {/* Review phase */}
        {phase === 'review' && (
          <WizardReview
            questions={questions}
            answers={answers}
            onEdit={handleEditFromReview}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        )}

        {/* Results phase */}
        {phase === 'results' && results && (
          <WizardResults
            scoredVendors={results}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  )
}
