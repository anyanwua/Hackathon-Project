import { useState } from 'react'
import { calculateImpactScore, type Result } from './scoring'

interface FormData {
  sleepHours: number
  stressLevel: number
  screenTimeHours: number
  exerciseMinutes: number
  moodLevel: number
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    sleepHours: 8,
    stressLevel: 3,
    screenTimeHours: 6,
    exerciseMinutes: 30,
    moodLevel: 3
  })
  const [result, setResult] = useState<Result | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const calculatedResult = calculateImpactScore(
      formData.sleepHours,
      formData.stressLevel,
      formData.screenTimeHours,
      formData.exerciseMinutes,
      formData.moodLevel
    )
    setResult(calculatedResult)
  }

  const handleChange = (field: keyof FormData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            MindGene OS — Daily Check-In
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sleep Hours */}
            <div>
              <label htmlFor="sleepHours" className="block text-sm font-medium text-gray-700 mb-2">
                Sleep Hours
              </label>
              <input
                id="sleepHours"
                type="number"
                min="0"
                max="12"
                step="0.5"
                value={formData.sleepHours}
                onChange={(e) => handleChange('sleepHours', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
            </div>

            {/* Stress Level */}
            <div>
              <label htmlFor="stressLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Stress Level
              </label>
              <select
                id="stressLevel"
                value={formData.stressLevel}
                onChange={(e) => handleChange('stressLevel', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              >
                <option value={1}>1 - Very Low</option>
                <option value={2}>2 - Low</option>
                <option value={3}>3 - Moderate</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Very High</option>
              </select>
            </div>

            {/* Screen Time */}
            <div>
              <label htmlFor="screenTimeHours" className="block text-sm font-medium text-gray-700 mb-2">
                Screen Time Hours
              </label>
              <input
                id="screenTimeHours"
                type="number"
                min="0"
                max="16"
                step="0.5"
                value={formData.screenTimeHours}
                onChange={(e) => handleChange('screenTimeHours', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
            </div>

            {/* Exercise Minutes */}
            <div>
              <label htmlFor="exerciseMinutes" className="block text-sm font-medium text-gray-700 mb-2">
                Exercise Minutes
              </label>
              <input
                id="exerciseMinutes"
                type="number"
                min="0"
                max="180"
                step="1"
                value={formData.exerciseMinutes}
                onChange={(e) => handleChange('exerciseMinutes', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              />
            </div>

            {/* Mood Level */}
            <div>
              <label htmlFor="moodLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Mood Level
              </label>
              <select
                id="moodLevel"
                value={formData.moodLevel}
                onChange={(e) => handleChange('moodLevel', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              >
                <option value={1}>1 - Very Low</option>
                <option value={2}>2 - Low</option>
                <option value={3}>3 - Moderate</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Very High</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg py-4 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Analyze My Biology
            </button>
          </form>

          {result && (
            <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 md:p-8">
              {/* Large bold score and category */}
              <div className="text-center mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  Biological Impact Score: {result.score}/100 — {result.category}
                </h2>
                
                {/* Horizontal progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 md:h-5 mb-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      result.category === 'Low' ? 'bg-green-500' :
                      result.category === 'Moderate' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <p className="text-gray-700 text-base md:text-lg leading-relaxed text-center">
                  {result.message}
                </p>
              </div>

              {/* Persona section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="text-center mb-3">
                  <div className="text-2xl md:text-3xl font-bold text-indigo-600 mb-2">
                    {result.persona}
                  </div>
                </div>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed text-center">
                  {result.personaDescription}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
