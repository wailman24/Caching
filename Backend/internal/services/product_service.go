package services

import (
	"context"

	"github.com/wailman24/Caching.git/internal/models"
)

type ProductRepository interface {
	GetAllProducts(ctx context.Context) ([]models.Product, error)
	CreateProduct(ctx context.Context, product *models.Product) error
	GetProductByID(ctx context.Context, id uint) (*models.Product, error)
	UpdateProduct(ctx context.Context, product *models.Product) error
}

type ProductService struct {
	repo ProductRepository
}

func NewProductService(repo ProductRepository) *ProductService {
	return &ProductService{
		repo: repo,
	}
}

func (ps *ProductService) GetAllProducts(ctx context.Context) ([]models.Product, error) {
	return ps.repo.GetAllProducts(ctx)
}

func (ps *ProductService) CreateProduct(ctx context.Context, product *models.Product) error {
	return ps.repo.CreateProduct(ctx, product)
}

func (ps *ProductService) GetProductByID(ctx context.Context, id uint) (*models.Product, error) {
	return ps.repo.GetProductByID(ctx, id)
}

func (ps *ProductService) UpdateProduct(ctx context.Context, product *models.Product) error {
	return ps.repo.UpdateProduct(ctx, product)
}
