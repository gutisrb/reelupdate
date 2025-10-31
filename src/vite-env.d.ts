/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_MAKE_CREATE_URL: string
  readonly VITE_MAKE_STATUS_URL: string
  readonly VITE_MAKE_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
