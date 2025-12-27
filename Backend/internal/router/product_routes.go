package router

import (
	"github.com/go-chi/chi"
	"github.com/wailman24/Caching.git/internal/handlers"
	"github.com/wailman24/Caching.git/internal/repositories"
	"github.com/wailman24/Caching.git/internal/services"
	"github.com/wailman24/Caching.git/pkg/cache"
	"github.com/wailman24/Caching.git/pkg/db"
)

func ProductRoutes() *chi.Mux {
	r := chi.NewRouter()
	prodRepo := repositories.NewProductRepositorie(db.Db, cache.Rdb)
	prodServ := services.NewProductService(prodRepo)
	h := handlers.NewProductHandler(prodServ)
	r.Get("/all", h.GetAllProducts)
	r.Get("/getbyid/{id}", h.GetProductByID)
	r.Post("/create", h.CreateProduct)
	r.Put("/update", h.UpdateProduct)
	return r
}
