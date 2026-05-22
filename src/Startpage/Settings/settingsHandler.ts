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

interface SettingsBundle {
  format: typeof EXPORT_FORMAT
  exportedAt: string
  settings: Record<string, unknown>
}

export const Backup = {
  exportToFile: () => {
    const settings: Record<string, unknown> = {}
    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key)
      if (raw !== null) settings[key] = JSON.parse(raw)
    }
    const bundle: SettingsBundle = {
      format: EXPORT_FORMAT,
      exportedAt: new Date().toISOString(),
      settings,
    }
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
    for (const key of STORAGE_KEYS) {
      const value = parsed.settings[key]
      if (value !== undefined) {
        localStorage.setItem(key, JSON.stringify(value))
      }
    }
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
