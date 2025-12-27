import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Product } from '@/types'
import { useCacheStore } from '@/store/cacheStore'
import { productSchema, ProductFormData } from '@/lib/validations'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
}

const categories = ['Electronics', 'Audio', 'Wearables', 'Gaming', 'Accessories']

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addProduct, updateProduct } = useCacheStore()
  const isEditing = !!product

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      price: product?.price || 0,
      category: product?.category || '',
      stock: product?.stock || 0,
    },
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        price: product.price,
        category: product.category,
        stock: product.stock,
      })
    } else {
      reset({
        name: '',
        price: 0,
        category: '',
        stock: 0,
      })
    }
  }, [product, reset])

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true)
    try {
      if (isEditing && product) {
        await updateProduct(product.id, data)
        toast.success('Product Updated', {
          description: `${data.name} has been updated in the cache`,
        })
      } else {
        await addProduct(data)
        toast.success('Product Added', {
          description: `${data.name} has been added to the cache`,
        })
      }
      onOpenChange(false)
      reset()
    } catch {
      toast.error('Operation failed', {
        description: 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the product information in the cache.' 
              : 'Add a new product directly to the cache.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="MacBook Pro 16&quot;"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="999.99"
                {...register('price', { valueAsNumber: true })}
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                placeholder="50"
                {...register('stock', { valueAsNumber: true })}
                className={errors.stock ? 'border-red-500' : ''}
              />
              {errors.stock && (
                <p className="text-sm text-red-500">{errors.stock.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              {...register('category')}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                errors.category ? 'border-red-500' : 'border-input'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                isEditing ? 'Update Product' : 'Add Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

