import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface ProfileUpdateData {
  name?: string
  avatar?: string
  bio?: string
  phone?: string
  location?: string
  company?: string
  website?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>
  updateAvatar: (avatarUrl: string) => void
}

// Simulated user storage
const USERS: Map<string, { user: User; password: string }> = new Map()

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const stored = USERS.get(email)
        
        if (stored && stored.password === password) {
          const updatedUser = {
            ...stored.user,
            lastActive: Date.now(),
          }
          set({
            user: updatedUser,
            isAuthenticated: true,
          })
          return true
        }
        
        // Demo account
        if (email === 'demo@cache.io' && password === 'demo123') {
          const demoUser: User = {
            id: 'demo-user',
            email: 'demo@cache.io',
            name: 'Demo User',
            bio: 'Cache enthusiast and system performance specialist. Love optimizing applications for speed and efficiency.',
            location: 'San Francisco, CA',
            company: 'Cache Systems Inc.',
            website: 'https://cache.io',
            phone: '+1 (555) 123-4567',
            joinedAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
            lastActive: Date.now(),
          }
          set({
            user: demoUser,
            isAuthenticated: true,
          })
          return true
        }
        
        return false
      },

      signup: async (name: string, email: string, password: string) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (USERS.has(email)) {
          return false
        }
        
        const user: User = {
          id: crypto.randomUUID(),
          email,
          name,
          joinedAt: Date.now(),
          lastActive: Date.now(),
        }
        
        USERS.set(email, { user, password })
        
        set({
          user,
          isAuthenticated: true,
        })
        
        return true
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        })
      },

      updateProfile: async (data: ProfileUpdateData) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const currentUser = get().user
        if (!currentUser) return false
        
        const updatedUser: User = {
          ...currentUser,
          ...data,
          lastActive: Date.now(),
        }
        
        // Update in simulated storage
        const stored = USERS.get(currentUser.email)
        if (stored) {
          USERS.set(currentUser.email, { ...stored, user: updatedUser })
        }
        
        set({ user: updatedUser })
        return true
      },

      updateAvatar: (avatarUrl: string) => {
        const currentUser = get().user
        if (!currentUser) return
        
        const updatedUser: User = {
          ...currentUser,
          avatar: avatarUrl,
          lastActive: Date.now(),
        }
        
        set({ user: updatedUser })
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
