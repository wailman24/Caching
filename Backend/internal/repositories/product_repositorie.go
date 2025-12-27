package repositories

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/wailman24/Caching.git/internal/models"
	"gorm.io/gorm"
)

type ProductRepositorie struct {
	db    *gorm.DB
	cache *redis.Client
}

func NewProductRepositorie(db *gorm.DB, cache *redis.Client) *ProductRepositorie {
	return &ProductRepositorie{db: db, cache: cache}
}

// --- STRATEGY: WRITE-THROUGH ---
// Used for Create: Save to DB FIRST, then Cache.
func (pr *ProductRepositorie) CreateProduct(ctx context.Context, product *models.Product) error {

	err := pr.db.WithContext(ctx).Create(product).Error
	if err != nil {
		return err
	}

	// 2. Immediate Cache Update
	pKey := fmt.Sprintf("product:%d", product.ID)
	pr.cache.HSet(ctx, pKey, "id", product.ID,
		"name", product.Name,
		"price", product.Price)
	pr.cache.SAdd(ctx, "products:all_ids", product.ID)

	return nil
}

// 2. GET All (Cache-Aside)
func (pr *ProductRepositorie) GetAllProducts(ctx context.Context) ([]models.Product, error) {
	var products []models.Product

	// Get IDs from the Redis Index
	ids, _ := pr.cache.SMembers(ctx, "products:all_ids").Result()
	if len(ids) == 0 {
		// Cache MISS for the set
		fmt.Println("Cache MISS: products:all_ids")

		var products []models.Product
		pr.db.WithContext(ctx).Find(&products)
		for _, p := range products {
			pKey := fmt.Sprintf("product:%d", p.ID)
			pr.cache.HSet(ctx, pKey,
				"id", p.ID,
				"name", p.Name,
				"price", p.Price,
			)
			pr.cache.SAdd(ctx, "products:all_ids", p.ID)
		}
		return products, nil
	}
	//Cache HIT for the set
	fmt.Println("Cache HIT: products:all_ids")

	for _, idStr := range ids {
		id, _ := strconv.Atoi(idStr)
		// Re-use GetByID to benefit from caching per item
		if p, err := pr.GetProductByID(ctx, uint(id)); err == nil {
			products = append(products, *p)
		}
	}

	return products, nil
}

// 2. GET BY ID (Cache-Aside)
func (pr *ProductRepositorie) GetProductByID(ctx context.Context, id uint) (*models.Product, error) {
	var product models.Product
	pKey := fmt.Sprintf("product:%d", id)

	// Check Redis Hash
	err := pr.cache.HGetAll(ctx, pKey).Scan(&product)

	// Redis HGetAll returns an empty map if not found, Scan might not error
	if err == nil && product.ID != 0 {
		fmt.Println("Cache HIT for product:", id)
		return &product, nil
	}

	fmt.Println("Cache MISS for product:", id)
	err = pr.db.WithContext(ctx).First(&product, id).Error
	if err != nil {
		return nil, err
	}

	// Refill Cache
	pr.cache.HSet(ctx, pKey, "id", product.ID,
		"name", product.Name,
		"price", product.Price)
	_, _ = pr.cache.SAdd(ctx, "products:all_ids", product.ID).Result()
	return &product, nil
}

func (pr *ProductRepositorie) UpdateProduct(ctx context.Context, product *models.Product) error {
	lockKey := fmt.Sprintf("lock:product:%d", product.ID)

	// Acquire lock
	// Ensure only one request updates this product at a time
	ok, err := pr.cache.SetNX(ctx, lockKey, "1", 5*time.Second).Result()
	if err != nil || !ok {
		return errors.New("product is being updated, try again")
	}
	defer pr.cache.Del(ctx, lockKey)

	// Update DB (source of truth)
	if err := pr.db.WithContext(ctx).
		Model(&models.Product{}).
		Where("id = ?", product.ID).
		Updates(map[string]interface{}{
			"name":  product.Name,
			"price": product.Price,
		}).Error; err != nil {
		return err
	}

	// Update cache (write-through)
	pKey := fmt.Sprintf("product:%d", product.ID)
	pr.cache.HSet(ctx, pKey,
		"id", product.ID,
		"name", product.Name,
		"price", product.Price,
	)

	return nil
}
