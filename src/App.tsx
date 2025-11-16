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
            <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Your Results</h2>
              
              <div className="text-center mb-6">
                <div className="inline-block">
                  <div className="text-5xl font-bold text-indigo-600 mb-2">{result.score}</div>
                  <div className="text-sm text-gray-600">Biological Impact Score</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Category</div>
                  <div className={`text-xl font-semibold ${
                    result.category === 'High' ? 'text-green-600' :
                    result.category === 'Moderate' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {result.category}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Persona</div>
                  <div className="text-xl font-semibold text-indigo-600">
                    {result.persona}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <div className="text-sm text-gray-600 mb-2">Persona Description</div>
                <div className="text-gray-800 leading-relaxed">
                  {result.personaDescription}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Message</div>
                <div className="text-gray-800 leading-relaxed">
                  {result.message}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
