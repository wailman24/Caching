package repositories

import (
	"context"
	"errors"

	"github.com/wailman24/Caching.git/internal/models"
	"gorm.io/gorm"
)

type UserRepositorie struct {
	db *gorm.DB
}

func NewUserRepositorie(db *gorm.DB) *UserRepositorie {
	return &UserRepositorie{db: db}
}

var ErrEmailAlreadyExists = errors.New("email already exists")

func (ur *UserRepositorie) CreateUser(ctx context.Context, user *models.User) error {
	// Check if user with this email already exists
	var existingUser models.User
	err := ur.db.WithContext(ctx).Where("email = ?", user.Email).First(&existingUser).Error
	if err == nil {
		// User with this email already exists
		return ErrEmailAlreadyExists
	}
	if err != gorm.ErrRecordNotFound {
		// Some other error occurred
		return err
	}

	// Email doesn't exist, create the user
	err = ur.db.WithContext(ctx).Create(user).Error
	if err != nil {
		// Check if it's a duplicate key error from database
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return ErrEmailAlreadyExists
		}
		return err
	}

	return nil
}

func (ur *UserRepositorie) GetUserByEmail(ctx context.Context, user *models.UserLogin) (*models.UserLogin, error) {
	// Get full user data including name
	var fullUser models.User
	err := ur.db.WithContext(ctx).Where("email = ?", user.Email).First(&fullUser).Error
	if err != nil {
		return nil, err
	}

	// Return UserLogin with name included
	result := &models.UserLogin{
		ID:       fullUser.ID,
		Name:     fullUser.Name,
		Email:    fullUser.Email,
		Password: fullUser.Password,
	}

	return result, nil
}
