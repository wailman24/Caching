import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { useCacheStore } from '@/store/cacheStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Globe, 
  Camera, 
  Pencil, 
  Save, 
  X,
  Calendar,
  Clock,
  Activity,
  Zap,
  Database,
  Trash2
} from 'lucide-react'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  phone: z.string().max(20).optional(),
  location: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  website: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function Profile() {
  const { user, updateProfile, updateAvatar } = useAuthStore()
  const { metrics, getCachedProducts } = useCacheStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const products = getCachedProducts()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
      location: user?.location || '',
      company: user?.company || '',
      website: user?.website || '',
    },
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Please select an image under 5MB',
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        updateAvatar(base64)
        toast.success('Avatar updated!', {
          description: 'Your profile picture has been changed',
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      const success = await updateProfile(data)
      if (success) {
        toast.success('Profile updated!', {
          description: 'Your changes have been saved',
        })
        setIsEditing(false)
      } else {
        toast.error('Update failed', {
          description: 'Please try again',
        })
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    reset({
      name: user?.name || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
      location: user?.location || '',
      company: user?.company || '',
      website: user?.website || '',
    })
    setIsEditing(false)
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 overflow-hidden">
            {/* Cover Banner */}
            <div className="h-32 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2aC0ydi00aDJ2NHptMC02di00aC0ydjRoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            </div>

            <CardContent className="relative pt-0">
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 mb-6">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-2 right-2 p-2 bg-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/90"
                  >
                    <Camera className="w-4 h-4 text-primary-foreground" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 pb-2">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {/* Profile Form */}
              <form className="space-y-6">
                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Bio
                  </Label>
                  {isEditing ? (
                    <div>
                      <textarea
                        id="bio"
                        {...register('bio')}
                        placeholder="Tell us about yourself..."
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      />
                      {errors.bio && (
                        <p className="text-sm text-red-500 mt-1">{errors.bio.message}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-secondary/30">
                      {user.bio || 'No bio added yet'}
                    </p>
                  )}
                </div>

                {/* Name and Email */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Full Name
                    </Label>
                    {isEditing ? (
                      <div>
                        <Input
                          id="name"
                          {...register('name')}
                          className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm p-3 rounded-lg bg-secondary/30">{user.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      Email Address
                    </Label>
                    <p className="text-sm p-3 rounded-lg bg-secondary/30 text-muted-foreground">
                      {user.email}
                      <span className="ml-2 text-xs text-green-500">(Verified)</span>
                    </p>
                  </div>
                </div>

                {/* Phone and Location */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Phone Number
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="+1 (555) 000-0000"
                      />
                    ) : (
                      <p className="text-sm p-3 rounded-lg bg-secondary/30">
                        {user.phone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Location
                    </Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        {...register('location')}
                        placeholder="City, Country"
                      />
                    ) : (
                      <p className="text-sm p-3 rounded-lg bg-secondary/30">
                        {user.location || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Company and Website */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      Company
                    </Label>
                    {isEditing ? (
                      <Input
                        id="company"
                        {...register('company')}
                        placeholder="Your company"
                      />
                    ) : (
                      <p className="text-sm p-3 rounded-lg bg-secondary/30">
                        {user.company || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      Website
                    </Label>
                    {isEditing ? (
                      <div>
                        <Input
                          id="website"
                          {...register('website')}
                          placeholder="https://example.com"
                        />
                        {errors.website && (
                          <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm p-3 rounded-lg bg-secondary/30">
                        {user.website ? (
                          <a 
                            href={user.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {user.website}
                          </a>
                        ) : (
                          'Not provided'
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Activity Stats Card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Cache Activity
              </CardTitle>
              <CardDescription>
                Your interaction history with the cache system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">Cache Hits</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">{metrics.cacheHits}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-orange-500 font-medium">Cache Misses</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">{metrics.cacheMisses}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-500 font-medium">Evictions</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">{metrics.evictions}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-secondary border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Total Requests</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">{metrics.totalRequests}</p>
                </div>
              </div>

              {/* Hit Rate Progress */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Hit Rate</span>
                  <span className="text-sm font-mono text-green-500">
                    {(metrics.hitRate * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={metrics.hitRate * 100} 
                  className="h-2"
                  indicatorClassName="bg-gradient-to-r from-green-500 to-emerald-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Member since</p>
                  <p className="text-sm font-medium">{formatDate(user.joinedAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Clock className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last active</p>
                  <p className="text-sm font-medium">
                    {user.lastActive ? formatRelativeTime(user.lastActive) : 'Now'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Database className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cached products</p>
                  <p className="text-sm font-medium">{products.length} items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Badge */}
          <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg">
                  {metrics.hitRate >= 0.8 ? 'Cache Master' : 
                   metrics.hitRate >= 0.5 ? 'Cache Expert' : 
                   metrics.hitRate > 0 ? 'Cache Learner' : 'Getting Started'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {metrics.hitRate >= 0.8 ? 'Outstanding cache performance!' : 
                   metrics.hitRate >= 0.5 ? 'Good cache efficiency!' : 
                   metrics.hitRate > 0 ? 'Keep improving your cache usage' : 'Start using the cache to earn badges'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">💡 Pro Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  Frequently accessed data stays in cache longer
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  Cache misses trigger 1s database fetches
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  LRU eviction removes oldest unused items
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

