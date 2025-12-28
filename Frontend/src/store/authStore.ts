import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { authAPI, apiClient } from '@/lib/api'

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
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>
  updateAvatar: (avatarUrl: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: async (email: string, password: string) => {
        try {
          const response = await authAPI.login(email, password)
          
          if (response.code === 200 && response.data && response.token) {
            const userData = response.data as { id: number; email: string; name?: string }
            const user: User = {
              id: userData.id.toString(),
              email: userData.email,
              name: userData.name || userData.email.split('@')[0], // Fallback to email username if name not provided
              joinedAt: Date.now(),
              lastActive: Date.now(),
            }
            
            // Set token in API client
            apiClient.setToken(response.token)
            
            set({
              user,
              isAuthenticated: true,
              token: response.token,
            })
            return true
          }
          
          return false
        } catch (error) {
          console.error('Login error:', error)
          return false
        }
      },

      signup: async (name: string, email: string, password: string) => {
        try {
          const response = await authAPI.signup(name, email, password)
          
          if (response.code === 200 && response.data) {
            const userData = response.data as { id: number; email: string; name: string }
            const user: User = {
              id: userData.id.toString(),
              email: userData.email,
              name: userData.name,
              joinedAt: Date.now(),
              lastActive: Date.now(),
            }
            
            // If token is provided, set it
            if (response.token) {
              apiClient.setToken(response.token)
              set({
                user,
                isAuthenticated: true,
                token: response.token,
              })
            } else {
              set({
                user,
                isAuthenticated: false,
                token: null,
              })
            }
            
            return { success: true }
          }
          
          // Return error message from backend (could be 409 Conflict or other error)
          const errorMessage = typeof response.message === 'string' 
            ? response.message 
            : 'Failed to create account'
          return { success: false, error: errorMessage }
        } catch (error: any) {
          console.error('Signup error:', error)
          // Try to extract error message from response
          let errorMessage = 'An error occurred. Please try again later.'
          if (error?.response?.message) {
            errorMessage = error.response.message
          } else if (error?.message) {
            errorMessage = error.message
          }
          return { success: false, error: errorMessage }
        }
      },

      logout: () => {
        apiClient.setToken(null)
        set({
          user: null,
          isAuthenticated: false,
          token: null,
        })
      },

      updateProfile: async (data: ProfileUpdateData) => {
        const currentUser = get().user
        if (!currentUser) return false
        
        // For now, just update locally since backend doesn't have profile update endpoint
        const updatedUser: User = {
          ...currentUser,
          ...data,
          lastActive: Date.now(),
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
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore token to API client when store is rehydrated
        if (state?.token) {
          apiClient.setToken(state.token)
        }
      },
    }
  )
)
