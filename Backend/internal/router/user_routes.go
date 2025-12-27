package router

import (
	"github.com/go-chi/chi"
	"github.com/wailman24/Caching.git/internal/handlers"
	"github.com/wailman24/Caching.git/internal/middlewares"
	"github.com/wailman24/Caching.git/internal/repositories"
	"github.com/wailman24/Caching.git/internal/services"
	"github.com/wailman24/Caching.git/pkg/db"
)

func UserRoutes() *chi.Mux {
	r := chi.NewRouter()
	userRepo := repositories.NewUserRepositorie(db.Db)
	userServ := services.NewUserService(userRepo)
	h := handlers.NewUserHandler(userServ)
	r.Post("/login", h.Login)
	r.Post("/create", h.Register)

	r.Group(func(r chi.Router) {
		r.Use(middlewares.AuthMiddleware)
		//r.Post("/create", h.Register)
	})

	return r
}
