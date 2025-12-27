package repositories

import (
	"context"

	"github.com/wailman24/Caching.git/internal/models"
	"gorm.io/gorm"
)

type UserRepositorie struct {
	db *gorm.DB
}

func NewUserRepositorie(db *gorm.DB) *UserRepositorie {
	return &UserRepositorie{db: db}
}

func (ur *UserRepositorie) CreateUser(ctx context.Context, user *models.User) error {

	err := ur.db.WithContext(ctx).Create(user).Error
	if err != nil {
		return err
	}

	return nil
}

func (ur *UserRepositorie) GetUserByEmail(ctx context.Context, user *models.UserLogin) (*models.UserLogin, error) {

	err := ur.db.WithContext(ctx).Raw(`SELECT u.id,u.email, u.password FROM users u where u.email = ?`, user.Email).Scan(user).Error
	if err != nil {
		return nil, err
	}

	return user, err
}
