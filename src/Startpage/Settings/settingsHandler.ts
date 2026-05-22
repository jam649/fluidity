import {
  linkGroup,
  Theme,
  Search as SearchType,
  links,
  searchSettings,
  themes,
} from "../../data/data"

export const Search = {
  get: () => {
    const lsSearch = localStorage.getItem("search-settings")
    if (lsSearch) return Search.parse(lsSearch)
    return undefined
  },
  getWithFallback: () => {
    try {
      return Search.get() ?? searchSettings
    } catch {
      console.error(
        "Your currently applied search settings appear to be corrupted."
      )
      return searchSettings
    }
  },

  set: (searchSettings: SearchType) =>
    localStorage.setItem("search-settings", JSON.stringify(searchSettings)),

  parse: (searchSettings: string) => JSON.parse(searchSettings) as SearchType,
}

export const Themes = {
  get: () => {
    const lsThemes = localStorage.getItem("themes")
    if (lsThemes) return JSON.parse(lsThemes) as Theme[]
    return undefined
  },
  getWithFallback: () => {
    try {
      return Themes.get() ?? themes
    } catch {
      console.error("Your currently applied themes appear to be corrupted.")
      return themes
    }
  },

  set: (themes: Theme[]) =>
    localStorage.setItem("themes", JSON.stringify(themes)),

  add: (theme: Theme) => {
    const lsThemes = Themes.get()
    if (lsThemes) Themes.set([...lsThemes, theme])
    else Themes.set([theme])
  },

  remove: (name: string) => {
    const lsThemes = Themes.get()
    if (lsThemes) Themes.set(lsThemes.filter(theme => theme.name !== name))
  },

  parse: (theme: string) => JSON.parse(theme) as Theme,
}

const linkGroupsKey = "link-groups"
export const Links = {
  getRaw: () => localStorage.getItem(linkGroupsKey),
  get: () => {
    const lsLinks = localStorage.getItem(linkGroupsKey)
    if (lsLinks) return Links.parse(lsLinks)
    return undefined
  },
  getWithFallback: () => {
    try {
      return Links.get() ?? links
    } catch {
      console.error("Your currently applied links appear to be corrupted.")
      return links
    }
  },

  set: (themes: linkGroup[]) =>
    localStorage.setItem(linkGroupsKey, JSON.stringify(themes)),

  parse: (linkGroups: string) => JSON.parse(linkGroups) as linkGroup[],
}

const STORAGE_KEYS = ["search-settings", "themes", "link-groups", "design"] as const
const EXPORT_FORMAT = "fluidity-settings-v1"
const SYNC_URL = "/api/state"
const SYNC_TIMEOUT_MS = 4000

interface SettingsBundle {
  format: typeof EXPORT_FORMAT
  exportedAt?: string
  settings: Record<string, unknown>
}

function readBundleFromLocalStorage(): SettingsBundle {
  const settings: Record<string, unknown> = {}
  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      try {
        settings[key] = JSON.parse(raw)
      } catch {
        // skip corrupted key
      }
    }
  }
  return {
    format: EXPORT_FORMAT,
    exportedAt: new Date().toISOString(),
    settings,
  }
}

function applyBundleToLocalStorage(bundle: SettingsBundle) {
  for (const key of STORAGE_KEYS) {
    const value = bundle.settings[key]
    if (value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }
}

export const Sync = {
  fetchFromServer: async (signal?: AbortSignal): Promise<boolean> => {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), SYNC_TIMEOUT_MS)
    const combined = signal
      ? AbortSignal.any([signal, ctl.signal])
      : ctl.signal
    try {
      const res = await fetch(SYNC_URL, { signal: combined, credentials: "same-origin" })
      if (!res.ok) {
        console.warn(`[sync] GET failed: ${res.status}`)
        return false
      }
      const data = (await res.json()) as Partial<SettingsBundle>
      if (data.format !== EXPORT_FORMAT || !data.settings) {
        console.warn("[sync] server returned unexpected format")
        return false
      }
      if (Object.keys(data.settings).length === 0) return false
      applyBundleToLocalStorage(data as SettingsBundle)
      return true
    } catch (err) {
      console.warn("[sync] fetch error:", err)
      return false
    } finally {
      clearTimeout(timer)
    }
  },

  pushToServer: async (): Promise<void> => {
    const bundle = readBundleFromLocalStorage()
    const res = await fetch(SYNC_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bundle),
      credentials: "same-origin",
    })
    if (!res.ok) {
      throw new Error(`server responded ${res.status}`)
    }
  },
}

export const Backup = {
  exportToFile: () => {
    const bundle = readBundleFromLocalStorage()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const stamp = new Date().toISOString().replace(/[:.]/g, "-")
    a.href = url
    a.download = `fluidity-settings-${stamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  importFromFile: async (file: File) => {
    const text = await file.text()
    const parsed = JSON.parse(text) as Partial<SettingsBundle>
    if (parsed.format !== EXPORT_FORMAT || !parsed.settings) {
      throw new Error(
        `Not a Fluidity settings file (expected format "${EXPORT_FORMAT}").`
      )
    }
    applyBundleToLocalStorage(parsed as SettingsBundle)
  },
}

export const Design = {
  get: () => {
    const lsDesign = localStorage.getItem("design")
    if (lsDesign) return Themes.parse(lsDesign)
    return undefined
  },
  getWithFallback: () => {
    try {
      return (
        Design.get() ??
        themes.find(theme => theme.name === "DeathAndMilk") ??
        themes[0]!
      )
    } catch {
      console.error("Your currently applied design appears to be corrupted.")
      return themes[0]!
    }
  },

  set: (design: Theme) =>
    localStorage.setItem("design", JSON.stringify(design)),
}
