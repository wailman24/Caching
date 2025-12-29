package db

import (
	"log"
	"os"
	"time"

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

	if user == "" || dbname == "" || password == "" {
		log.Fatal("Missing MySQL environment variables. Please check MYSQL_USER, MYSQL_DATABASE, MYSQL_PASSWORD")
	}

	dsn := user + ":" + password + "@tcp(db:3306)/" + dbname + "?charset=utf8mb4&parseTime=True&loc=Local"
	
	// Retry connection logic (MySQL might not be ready immediately)
	var db *gorm.DB
	var err error
	maxRetries := 10
	retryDelay := 3 * time.Second

	for i := 0; i < maxRetries; i++ {
		db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err == nil {
			log.Println("Connected to MySQL database successfully")
			Db = db
			return
		}
		
		if i < maxRetries-1 {
			log.Printf("Failed to connect to database (attempt %d/%d): %v. Retrying in %v...", i+1, maxRetries, err, retryDelay)
			time.Sleep(retryDelay)
		}
	}

	log.Fatalf("Failed to connect to database after %d attempts: %v", maxRetries, err)
}
