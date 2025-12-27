package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi"
	"github.com/go-playground/validator/v10"
	"github.com/wailman24/Caching.git/internal/models"
	"github.com/wailman24/Caching.git/internal/utils"
)

type ProductService interface {
	GetAllProducts(ctx context.Context) ([]models.Product, error)
	CreateProduct(ctx context.Context, product *models.Product) error
	GetProductByID(ctx context.Context, id uint) (*models.Product, error)
	UpdateProduct(ctx context.Context, product *models.Product) error
}

type ProductHandler struct {
	serv ProductService
}

func NewProductHandler(serv ProductService) *ProductHandler {
	return &ProductHandler{serv: serv}
}

func (ph *ProductHandler) GetAllProducts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	w.Header().Set("Content-Type", "application/json")

	products, err := ph.serv.GetAllProducts(ctx)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, err)
		return
	}

	utils.Success(w, products)
}

func (ph *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var prod models.Product
	var validate = validator.New()
	w.Header().Set("Content-Type", "application/json")

	err := json.NewDecoder(r.Body).Decode(&prod)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err)
		return
	}

	err = validate.Struct(prod)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err)
		return
	}

	err = ph.serv.CreateProduct(ctx, &prod)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, err)
		return
	}

	utils.Success(w, prod)

}

func (ph *ProductHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var prod models.Product
	var validate = validator.New()
	w.Header().Set("Content-Type", "application/json")

	err := json.NewDecoder(r.Body).Decode(&prod)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err)
		return
	}

	err = validate.Struct(prod)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err)
		return
	}

	err = ph.serv.UpdateProduct(ctx, &prod)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, err)
		return
	}

	utils.Success(w, prod)
}

func (ph *ProductHandler) GetProductByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	idparam := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idparam)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	product, err := ph.serv.GetProductByID(ctx, uint(id))
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, err)
		return
	}

	utils.Success(w, product)
}
