import { useEffect, useState } from "react"

import "./base/variables.css"

import { LoadingOverlay } from "./components/LoadingOverlay"
import * as Settings from "./Startpage/Settings/settingsHandler"
import { Startpage } from "./Startpage/Startpage"

const applyColors = () => {
  const root = document.documentElement
  const colors: Record<string, string> =
    Settings.Design.getWithFallback().colors
  Object.keys(colors).forEach(key => {
    root.style.setProperty(key, colors[key] ?? null)
  })
}

const App = () => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    Settings.Sync.fetchFromServer().finally(() => {
      if (cancelled) return
      applyColors()
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) return <LoadingOverlay />
  return <Startpage />
}

export default App
