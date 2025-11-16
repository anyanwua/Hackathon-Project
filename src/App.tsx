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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-8 relative overflow-x-hidden">
      {/* Header */}
      <div className="w-full max-w-3xl mx-auto mb-8 text-center animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-purple-600 via-pink-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
          MindGene OS
        </h1>
        <p className="text-lg md:text-xl text-slate-600 font-normal max-w-2xl mx-auto">
          See how your habits shape your biology.
        </p>
      </div>

      <div className="w-full max-w-3xl mx-auto relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 animate-fade-in-up card-hover border border-slate-100/50">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
              Daily Check-In
            </h2>
            <div className="mt-4 w-24 h-1.5 bg-gradient-to-r from-purple-400 via-pink-400 via-blue-400 to-cyan-400 mx-auto rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sleep Hours */}
            <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <label htmlFor="sleepHours" className="block text-base font-semibold text-indigo-700 mb-3 flex items-center gap-3">
                <span className="text-2xl">😴</span>
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Sleep Hours</span>
              </label>
              <input
                id="sleepHours"
                type="number"
                min="0"
                max="12"
                step="0.5"
                value={formData.sleepHours}
                onChange={(e) => handleChange('sleepHours', parseFloat(e.target.value) || 0)}
                className="w-full px-6 py-4 text-base border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-200/50 focus:border-indigo-400 outline-none bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm hover:shadow-md"
                required
              />
            </div>

            {/* Stress Level */}
            <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <label htmlFor="stressLevel" className="block text-base font-semibold text-red-700 mb-3 flex items-center gap-3">
                <span className="text-2xl">😰</span>
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Stress Level</span>
              </label>
              <select
                id="stressLevel"
                value={formData.stressLevel}
                onChange={(e) => handleChange('stressLevel', parseInt(e.target.value))}
                className="w-full px-6 py-4 text-base border-2 border-red-200 rounded-xl focus:ring-4 focus:ring-red-200/50 focus:border-red-400 outline-none bg-red-50/50 hover:bg-red-50 hover:border-red-300 cursor-pointer shadow-sm hover:shadow-md"
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
              <label htmlFor="screenTimeHours" className="block text-base font-semibold text-blue-700 mb-3 flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Screen Time Hours</span>
              </label>
              <input
                id="screenTimeHours"
                type="number"
                min="0"
                max="16"
                step="0.5"
                value={formData.screenTimeHours}
                onChange={(e) => handleChange('screenTimeHours', parseFloat(e.target.value) || 0)}
                className="w-full px-6 py-4 text-base border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-200/50 focus:border-blue-400 outline-none bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 shadow-sm hover:shadow-md"
                required
              />
            </div>

            {/* Exercise Minutes */}
            <div className="animate-slide-in" style={{ animationDelay: '0.4s' }}>
              <label htmlFor="exerciseMinutes" className="block text-base font-semibold text-green-700 mb-3 flex items-center gap-3">
                <span className="text-2xl">💪</span>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Exercise Minutes</span>
              </label>
              <input
                id="exerciseMinutes"
                type="number"
                min="0"
                max="180"
                step="1"
                value={formData.exerciseMinutes}
                onChange={(e) => handleChange('exerciseMinutes', parseInt(e.target.value) || 0)}
                className="w-full px-6 py-4 text-base border-2 border-green-200 rounded-xl focus:ring-4 focus:ring-green-200/50 focus:border-green-400 outline-none bg-green-50/50 hover:bg-green-50 hover:border-green-300 shadow-sm hover:shadow-md"
                required
              />
            </div>

            {/* Mood Level */}
            <div className="animate-slide-in" style={{ animationDelay: '0.5s' }}>
              <label htmlFor="moodLevel" className="block text-base font-semibold text-yellow-700 mb-3 flex items-center gap-3">
                <span className="text-2xl">😊</span>
                <span className="bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent">Mood Level</span>
              </label>
              <select
                id="moodLevel"
                value={formData.moodLevel}
                onChange={(e) => handleChange('moodLevel', parseInt(e.target.value))}
                className="w-full px-6 py-4 text-base border-2 border-yellow-200 rounded-xl focus:ring-4 focus:ring-yellow-200/50 focus:border-yellow-400 outline-none bg-yellow-50/50 hover:bg-yellow-50 hover:border-yellow-300 cursor-pointer shadow-sm hover:shadow-md"
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
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white font-bold text-lg py-5 px-8 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group mt-10"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <span>Analyze My Biology</span>
                <span className="group-hover:translate-x-2 transition-transform duration-300 text-xl">→</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {result && (
            <div className="mt-10 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 border border-slate-100/50 animate-fade-in-up card-hover">
              {/* Large bold score and category */}
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
                  Biological Impact Score: <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-count-up inline-block">{result.score}/100</span>
                </h2>
                <div className={`inline-block px-5 py-2 rounded-full text-sm font-semibold mb-6 animate-count-up ${
                  result.category === 'Low' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-2 border-emerald-200' :
                  result.category === 'Moderate' ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-2 border-amber-200' :
                  'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border-2 border-rose-200'
                }`} style={{ animationDelay: '0.2s' }}>
                  {result.category}
                </div>
                
                {/* Horizontal progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-6 md:h-7 mb-6 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full animate-progress-fill ${
                      result.category === 'Low' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                      result.category === 'Moderate' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                      'bg-gradient-to-r from-rose-400 to-rose-500'
                    }`}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="mb-8 bg-slate-50 rounded-xl p-6 border border-slate-200">
                <p className="text-slate-700 text-base md:text-lg leading-relaxed text-center">
                  {result.message}
                </p>
              </div>

              {/* Persona section */}
              <div className="border-t-2 border-purple-200 pt-8 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-blue-50/50 rounded-xl p-6">
                <div className="text-center mb-4">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-3">
                    {result.persona}
                  </div>
                </div>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed text-center">
                  {result.personaDescription}
                </p>
              </div>

              {/* What If Simulation */}
              <div className="border-t-2 border-slate-200 pt-8 mt-8">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 text-center">
                  What If Simulation
                </h3>
                
                <div className="mb-6">
                  <label htmlFor="simulatedSleepHours" className="block text-base font-medium text-slate-700 mb-4 text-center">
                    What if I change my sleep hours?
                  </label>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-sm text-slate-600 font-medium w-12">3h</span>
                    <input
                      id="simulatedSleepHours"
                      type="range"
                      min="3"
                      max="10"
                      step="0.5"
                      value={simulatedSleepHours}
                      onChange={(e) => setSimulatedSleepHours(parseFloat(e.target.value))}
                      className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-sm text-slate-600 font-medium w-12 text-right">10h</span>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-semibold text-blue-600">{simulatedSleepHours} hours</span>
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
                    <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-xl p-6 border border-slate-200">
                      {/* Current vs Simulated Score */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                          <div className="text-sm text-slate-600 mb-2 font-medium">Current Score</div>
                          <div className="text-3xl font-bold text-slate-800">{result.score}</div>
                          <div className="text-xs text-slate-500 mt-2">({formData.sleepHours}h sleep)</div>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                          <div className="text-sm text-slate-600 mb-2 font-medium">Simulated Score</div>
                          <div className={`text-3xl font-bold ${
                            simulatedResult.score > result.score ? 'text-rose-600' :
                            simulatedResult.score < result.score ? 'text-emerald-600' :
                            'text-slate-800'
                          }`}>
                            {simulatedResult.score}
                          </div>
                          <div className="text-xs text-slate-500 mt-2">({simulatedSleepHours}h sleep)</div>
                        </div>
                      </div>

                      {/* Change message */}
                      <div className="bg-white rounded-xl p-5 text-center border border-slate-100">
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                          If you slept <span className="font-semibold text-blue-600">{simulatedSleepHours} hours</span> tonight, your score would change from <span className="font-semibold">{result.score}</span> to <span className={`font-semibold ${
                            simulatedResult.score > result.score ? 'text-rose-600' :
                            simulatedResult.score < result.score ? 'text-emerald-600' :
                            'text-slate-800'
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
