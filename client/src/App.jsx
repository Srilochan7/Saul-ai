import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <h1 className="text-3xl font-bold text-white underline decoration-sky-500">
        Hello Tailwind CSS + React!
      </h1>
    </div>
  )
}

export default App
