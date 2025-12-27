package main

import (
	"fmt"
	"net/http"

	"github.com/wailman24/Caching.git/internal/models"
	"github.com/wailman24/Caching.git/internal/router"
	"github.com/wailman24/Caching.git/pkg/cache"
	"github.com/wailman24/Caching.git/pkg/db"
)

func main() {
	db.Connect()
	fmt.Println("connected ... ")
	err := db.Db.AutoMigrate(&models.User{}, &models.Product{})

	if err != nil {
		fmt.Println("Error migrating database:", err)
	} else {
		fmt.Println("Migration completed successfully...")
	}

	cache.ConnectRedis()

	http.ListenAndServe(":8080", router.MainRoutes())
}
