package router

import (
	"github.com/go-chi/chi"
	"github.com/wailman24/Caching.git/internal/middlewares"
)

func MainRoutes() *chi.Mux {
	apiroute := chi.NewRouter()
	
	// Apply CORS middleware to all routes
	apiroute.Use(middlewares.CORSMiddleware)
	
	apiroute.Route("/api", func(r chi.Router) {
		r.Mount("/users", UserRoutes())
		r.Mount("/products", ProductRoutes())

	})

	return apiroute
}
