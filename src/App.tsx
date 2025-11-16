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
  const [simulatedSleepHours, setSimulatedSleepHours] = useState<number>(8)

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
    // Set simulation slider to current sleep hours
    setSimulatedSleepHours(formData.sleepHours)
  }

  const handleChange = (field: keyof FormData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20 animate-fade-in-up">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              MindGene OS
            </h1>
            <p className="text-lg text-gray-600 font-medium">Daily Check-In</p>
            <div className="mt-4 w-24 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sleep Hours */}
            <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <label htmlFor="sleepHours" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                <span className="text-indigo-600">😴</span>
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white hover:border-gray-300"
                required
              />
            </div>

            {/* Stress Level */}
            <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <label htmlFor="stressLevel" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                <span className="text-red-500">😰</span>
                Stress Level
              </label>
              <select
                id="stressLevel"
                value={formData.stressLevel}
                onChange={(e) => handleChange('stressLevel', parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white hover:border-gray-300 cursor-pointer"
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
            <div className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
              <label htmlFor="screenTimeHours" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                <span className="text-blue-500">📱</span>
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white hover:border-gray-300"
                required
              />
            </div>

            {/* Exercise Minutes */}
            <div className="animate-slide-in" style={{ animationDelay: '0.4s' }}>
              <label htmlFor="exerciseMinutes" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                <span className="text-green-500">💪</span>
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white hover:border-gray-300"
                required
              />
            </div>

            {/* Mood Level */}
            <div className="animate-slide-in" style={{ animationDelay: '0.5s' }}>
              <label htmlFor="moodLevel" className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                <span className="text-yellow-500">😊</span>
                Mood Level
              </label>
              <select
                id="moodLevel"
                value={formData.moodLevel}
                onChange={(e) => handleChange('moodLevel', parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white hover:border-gray-300 cursor-pointer"
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
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-lg py-4 px-6 rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group mt-8"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>Analyze My Biology</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {result && (
            <div className="mt-8 bg-gradient-to-br from-white to-indigo-50/30 rounded-3xl shadow-2xl p-6 md:p-8 border border-indigo-100/50 animate-fade-in-up">
              {/* Large bold score and category */}
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">
                  Biological Impact Score: <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{result.score}/100</span>
                </h2>
                <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-6 ${
                  result.category === 'Low' ? 'bg-green-100 text-green-700' :
                  result.category === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {result.category}
                </div>
                
                {/* Horizontal progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-5 md:h-6 mb-6 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${
                      result.category === 'Low' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      result.category === 'Moderate' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                <p className="text-gray-700 text-base md:text-lg leading-relaxed text-center font-medium">
                  {result.message}
                </p>
              </div>

              {/* Persona section */}
              <div className="border-t-2 border-indigo-200 pt-8 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-2xl p-6">
                <div className="text-center mb-4">
                  <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                    {result.persona}
                  </div>
                </div>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed text-center font-medium">
                  {result.personaDescription}
                </p>
              </div>

              {/* What If Simulation */}
              <div className="border-t-2 border-indigo-200 pt-8 mt-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  What If Simulation
                </h3>
                
                <div className="mb-6">
                  <label htmlFor="simulatedSleepHours" className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                    What if I change my sleep hours?
                  </label>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-gray-600 font-medium w-12">3h</span>
                    <input
                      id="simulatedSleepHours"
                      type="range"
                      min="3"
                      max="10"
                      step="0.5"
                      value={simulatedSleepHours}
                      onChange={(e) => setSimulatedSleepHours(parseFloat(e.target.value))}
                      className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-sm text-gray-600 font-medium w-12 text-right">10h</span>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-bold text-indigo-600">{simulatedSleepHours} hours</span>
                  </div>
                </div>

                {(() => {
                  const simulatedResult = calculateImpactScore(
                    simulatedSleepHours,
                    formData.stressLevel,
                    formData.screenTimeHours,
                    formData.exerciseMinutes,
                    formData.moodLevel
                  )
                  
                  return (
                    <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl p-6 border border-purple-100">
                      {/* Current vs Simulated Score */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 shadow-md">
                          <div className="text-sm text-gray-600 mb-1">Current Score</div>
                          <div className="text-3xl font-bold text-gray-800">{result.score}</div>
                          <div className="text-xs text-gray-500 mt-1">({formData.sleepHours}h sleep)</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-md">
                          <div className="text-sm text-gray-600 mb-1">Simulated Score</div>
                          <div className={`text-3xl font-bold ${
                            simulatedResult.score > result.score ? 'text-red-600' :
                            simulatedResult.score < result.score ? 'text-green-600' :
                            'text-gray-800'
                          }`}>
                            {simulatedResult.score}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">({simulatedSleepHours}h sleep)</div>
                        </div>
                      </div>

                      {/* Change message */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center">
                        <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                          If you slept <span className="font-bold text-indigo-600">{simulatedSleepHours} hours</span> tonight, your score would change from <span className="font-bold">{result.score}</span> to <span className={`font-bold ${
                            simulatedResult.score > result.score ? 'text-red-600' :
                            simulatedResult.score < result.score ? 'text-green-600' :
                            'text-gray-800'
                          }`}>{simulatedResult.score}</span>.
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
