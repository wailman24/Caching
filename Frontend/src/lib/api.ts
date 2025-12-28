// @ts-ignore - Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export interface ApiResponse<T = any> {
  code: number
  message: string | any
  data?: T
  token?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Load token from localStorage
    const authStore = localStorage.getItem('auth-store')
    if (authStore) {
      try {
        const parsed = JSON.parse(authStore)
        if (parsed.state?.token) {
          this.token = parsed.state.token
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    let data: any
    try {
      data = await response.json()
    } catch (e) {
      // If response is not JSON, create a simple error
      throw new Error(`Invalid response format: ${response.status}`)
    }
    
    if (!response.ok) {
      // Preserve the error response structure
      const errorObj = new Error(data.message || `HTTP error! status: ${response.status}`)
      ;(errorObj as any).response = data
      ;(errorObj as any).status = response.status
      throw errorObj
    }

    return data
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post<{ id: number; email: string; name: string }>('/users/login', {
      email,
      password,
    })
    return response
  },

  signup: async (name: string, email: string, password: string) => {
    const response = await apiClient.post<{ id: number; email: string; name: string }>('/users/create', {
      name,
      email,
      password,
    })
    return response
  },
}

// Product API
export const productAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get<Array<{ id: number; name: string; price: string }>>('/products/all')
      console.log('ProductAPI.getAll response:', response)
      return response
    } catch (error) {
      console.error('ProductAPI.getAll error:', error)
      throw error
    }
  },

  getById: async (id: number) => {
    const response = await apiClient.get<{ id: number; name: string; price: string }>(`/products/getbyid/${id}`)
    return response
  },

  create: async (product: { name: string; price: string }) => {
    const response = await apiClient.post<{ id: number; name: string; price: string }>('/products/create', product)
    return response
  },

  update: async (product: { id: number; name: string; price: string }) => {
    const response = await apiClient.put<{ id: number; name: string; price: string }>('/products/update', product)
    return response
  },
}
