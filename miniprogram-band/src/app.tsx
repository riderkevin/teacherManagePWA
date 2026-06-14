import { createContext } from 'react'
import './app.scss'

// 全局上下文（供页面使用）
export const GlobalContext = createContext<any>(null)

function App({ children }: { children: React.ReactNode }) {
  return (
    <GlobalContext.Provider value={{}}>
      {children}
    </GlobalContext.Provider>
  )
}

export default App
