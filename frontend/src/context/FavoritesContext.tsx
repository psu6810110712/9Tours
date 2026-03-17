import { createContext, useContext, type ReactNode } from 'react'
import { useFavorites } from '../hooks/useFavorites'

type FavoritesContextType = ReturnType<typeof useFavorites>

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const value = useFavorites({ autoFetch: true })

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavoritesContext() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavoritesContext ต้องใช้ภายใน FavoritesProvider')
  return ctx
}
