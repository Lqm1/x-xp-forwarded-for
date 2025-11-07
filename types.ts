export interface Xp {
  navigator_properties: NavigatorProperties
  created_at: number
}

export interface NavigatorProperties {
  hasBeenActive: "true" | "false"
  userAgent: string
  webdriver: "true" | "false"
}
