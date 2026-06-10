import { createContext } from 'react'
import { useGlobalState } from './utils/auth'
import './app.scss'

// 全局上下文（供页面使用）
export const GlobalContext = createContext<any>(null)

function App({ children }: { children: React.ReactNode }) {
  const state = useGlobalState()
  return (
    <GlobalContext.Provider value={state}>
      {children}
    </GlobalContext.Provider>
  )
}

export default App
