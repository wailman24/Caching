package tokens

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
)

func CreateToken(user_id int) (string, error) {
	// Try to load .env file, but don't fail if it doesn't exist
	// (variables might be set via environment or docker-compose)
	_ = godotenv.Load()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256,
		jwt.MapClaims{
			"user_id": user_id,
			"exp":     time.Now().Add(time.Hour * 24).Unix(),
		})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
