package services

import (
	"context"

	"github.com/wailman24/Caching.git/internal/models"
)

type UserRepository interface {
	CreateUser(ctx context.Context, u *models.User) error
	GetUserByEmail(ctx context.Context, user *models.UserLogin) (*models.UserLogin, error)
}

type UserService struct {
	repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
	return &UserService{
		repo: repo,
	}
}

func (us *UserService) CreateUser(ctx context.Context, user *models.User) error {
	err := us.repo.CreateUser(ctx, user)
	if err != nil {
		return err
	}

	return nil
}

func (us *UserService) GetUserByEmail(ctx context.Context, user models.UserLogin) (*models.UserLogin, error) {
	res, err := us.repo.GetUserByEmail(ctx, &user)
	if err != nil {
		return nil, err
	}

	return res, nil
}
