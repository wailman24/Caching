import { useState } from 'react'
import { toast } from 'sonner'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Product } from '@/types'
import { useCacheStore, getAvailableProducts } from '@/store/cacheStore'
import { formatBytes } from '@/lib/utils'
import { 
  MoreHorizontal, 
  Search, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Pencil,
  Database,
  Loader2,
  ArrowUpDown,
  Package,
  Zap,
  Clock,
} from 'lucide-react'
import { ProductDialog } from './ProductDialog'

export function ProductTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const { 
    getCachedProducts, 
    getProduct, 
    deleteProduct, 
    loadingProducts 
  } = useCacheStore()
  
  const products = getCachedProducts()
  const availableProducts = getAvailableProducts()

  const handleFetchProduct = async (id: string, name: string) => {
    setLoadingId(id)
    const result = await getProduct(id)
    setLoadingId(null)
    
    if (result) {
      // Check if it was a hit or miss based on whether it was already in cache
      const wasInCache = products.some(p => p.id === id)
      if (wasInCache) {
        toast.success('Cache Hit!', {
          description: `${name} retrieved instantly from cache`,
          duration: 3000,
        })
      } else {
        toast.warning('Cache Miss', {
          description: `${name} fetched from database (1s delay)`,
          duration: 3000,
        })
      }
    }
  }

  const handleDelete = (product: Product) => {
    deleteProduct(product.id)
    toast.error('Product Evicted', {
      description: `${product.name} removed from cache`,
      duration: 3000,
    })
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.getValue('name')}</p>
            <p className="text-xs text-muted-foreground font-mono">{row.original.id}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-full bg-secondary text-xs font-medium">
          {row.getValue('category')}
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const price = parseFloat(row.getValue('price'))
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(price)
        return <span className="font-mono font-medium">{formatted}</span>
      },
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = row.getValue('stock') as number
        return (
          <span className={`font-mono ${stock < 10 ? 'text-red-500' : stock < 25 ? 'text-orange-500' : 'text-green-500'}`}>
            {stock} units
          </span>
        )
      },
    },
    {
      accessorKey: 'accessCount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          <Zap className="mr-2 h-4 w-4" />
          Hits
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${Math.min((row.original.accessCount / 10) * 100, 100)}%` }}
            />
          </div>
          <span className="text-sm font-mono">{row.original.accessCount}</span>
        </div>
      ),
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatBytes(row.original.size)}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const product = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(product)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete from Cache
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  const uncachedProducts = availableProducts.filter(
    p => !products.some(cached => cached.id === p.id)
  )

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Cached Products
              <span className="ml-2 px-2 py-0.5 text-xs font-normal bg-primary/10 text-primary rounded-full">
                {products.length} items
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                  onChange={(event) =>
                    table.getColumn('name')?.setFilterValue(event.target.value)
                  }
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Fetch from DB section */}
          {uncachedProducts.length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Fetch from Database</span>
                <span className="text-xs text-muted-foreground">(Simulates 1s delay on cache miss)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {uncachedProducts.map(product => (
                  <Button
                    key={product.id}
                    variant="outline"
                    size="sm"
                    disabled={loadingProducts.has(product.id) || loadingId === product.id}
                    onClick={() => handleFetchProduct(product.id, product.name)}
                    className="text-xs"
                  >
                    {(loadingProducts.has(product.id) || loadingId === product.id) ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        {product.name}
                      </>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Database className="w-8 h-8 opacity-50" />
                        <p>No products in cache</p>
                        <p className="text-xs">Fetch products from the database to populate the cache</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ProductDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
      />
      
      {editingProduct && (
        <ProductDialog 
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          product={editingProduct}
        />
      )}
    </>
  )
}

