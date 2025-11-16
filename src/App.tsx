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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4 py-8 relative">
      <div className="w-full max-w-3xl mx-auto relative z-10">
        <div className="bg-white rounded-2xl shadow-lg drop-shadow-xl p-8 md:p-12 animate-fade-in-up">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-slate-800 tracking-tight">
              MindGene OS
            </h1>
            <p className="text-lg text-slate-600 font-normal">Daily Check-In</p>
            <div className="mt-6 w-20 h-1 bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 mx-auto rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Sleep Hours */}
            <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <label htmlFor="sleepHours" className="block text-base font-medium text-slate-700 mb-3 flex items-center gap-2">
                <span className="text-lg">😴</span>
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
                className="w-full px-5 py-4 text-base border-2 border-slate-200 rounded-xl focus:ring-3 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200 bg-slate-50 hover:bg-white hover:border-slate-300 shadow-sm"
                required
              />
            </div>

            {/* Stress Level */}
            <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <label htmlFor="stressLevel" className="block text-base font-medium text-slate-700 mb-3 flex items-center gap-2">
                <span className="text-lg">😰</span>
                Stress Level
              </label>
              <select
                id="stressLevel"
                value={formData.stressLevel}
                onChange={(e) => handleChange('stressLevel', parseInt(e.target.value))}
                className="w-full px-5 py-4 text-base border-2 border-slate-200 rounded-xl focus:ring-3 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200 bg-slate-50 hover:bg-white hover:border-slate-300 cursor-pointer shadow-sm"
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
              <label htmlFor="screenTimeHours" className="block text-base font-medium text-slate-700 mb-3 flex items-center gap-2">
                <span className="text-lg">📱</span>
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
                className="w-full px-5 py-4 text-base border-2 border-slate-200 rounded-xl focus:ring-3 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200 bg-slate-50 hover:bg-white hover:border-slate-300 shadow-sm"
                required
              />
            </div>

            {/* Exercise Minutes */}
            <div className="animate-slide-in" style={{ animationDelay: '0.4s' }}>
              <label htmlFor="exerciseMinutes" className="block text-base font-medium text-slate-700 mb-3 flex items-center gap-2">
                <span className="text-lg">💪</span>
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
                className="w-full px-5 py-4 text-base border-2 border-slate-200 rounded-xl focus:ring-3 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200 bg-slate-50 hover:bg-white hover:border-slate-300 shadow-sm"
                required
              />
            </div>

            {/* Mood Level */}
            <div className="animate-slide-in" style={{ animationDelay: '0.5s' }}>
              <label htmlFor="moodLevel" className="block text-base font-medium text-slate-700 mb-3 flex items-center gap-2">
                <span className="text-lg">😊</span>
                Mood Level
              </label>
              <select
                id="moodLevel"
                value={formData.moodLevel}
                onChange={(e) => handleChange('moodLevel', parseInt(e.target.value))}
                className="w-full px-5 py-4 text-base border-2 border-slate-200 rounded-xl focus:ring-3 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all duration-200 bg-slate-50 hover:bg-white hover:border-slate-300 cursor-pointer shadow-sm"
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
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-lg py-5 px-8 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group mt-10"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>Analyze My Biology</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {result && (
            <div className="mt-10 bg-white rounded-2xl shadow-lg drop-shadow-xl p-8 md:p-10 border border-slate-100 animate-fade-in-up">
              {/* Large bold score and category */}
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
                  Biological Impact Score: <span className="text-blue-600">{result.score}/100</span>
                </h2>
                <div className={`inline-block px-5 py-2 rounded-full text-sm font-semibold mb-6 ${
                  result.category === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                  result.category === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {result.category}
                </div>
                
                {/* Horizontal progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-6 md:h-7 mb-6 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
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
              <div className="border-t-2 border-slate-200 pt-8 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-xl p-6">
                <div className="text-center mb-4">
                  <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
                    {result.persona}
                  </div>
                </div>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed text-center">
                  {result.personaDescription}
                </p>
              </div>

              {/* What If Simulation */}
              <div className="border-t-2 border-slate-200 pt-8 mt-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">
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
