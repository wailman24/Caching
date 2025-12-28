package db

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var Db *gorm.DB

func Connect() {
	// Try to load .env file, but don't fail if it doesn't exist
	// (variables might be set via environment or docker-compose)
	_ = godotenv.Load()

	user := os.Getenv("MYSQL_USER")
	dbname := os.Getenv("MYSQL_DATABASE")
	password := os.Getenv("MYSQL_PASSWORD")

	dsn := user + ":" + password + "@tcp(db:3306)/" + dbname + "?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("error opening db")
	}

	Db = db
}
