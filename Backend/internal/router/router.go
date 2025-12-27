package router

import (
	"github.com/go-chi/chi"
)

func MainRoutes() *chi.Mux {
	apiroute := chi.NewRouter()
	apiroute.Route("/api", func(r chi.Router) {
		r.Mount("/users", UserRoutes())
		r.Mount("/products", ProductRoutes())

	})

	return apiroute
}
