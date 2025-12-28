import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCacheStore } from '@/store/cacheStore'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Cpu, LogOut, User, Activity, Zap } from 'lucide-react'

export function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { metrics } = useCacheStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-white tracking-tight">Cache Simulator</h1>
            <p className="text-xs text-green-400 font-mono">v1.0.0</p>
          </div>
        </div>

        {/* Live Stats */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-sm font-mono text-green-500">
              {(metrics.hitRate * 100).toFixed(1)}% Hit Rate
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-mono text-muted-foreground">
              {metrics.totalRequests} Requests
            </span>
          </div>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={user?.avatar} alt={user?.name || user?.email || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

