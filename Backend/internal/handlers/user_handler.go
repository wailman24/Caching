package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/wailman24/Caching.git/internal/models"
	"github.com/wailman24/Caching.git/internal/utils"
	"github.com/wailman24/Caching.git/tokens"

	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	CreateUser(ctx context.Context, user *models.User) error
	GetUserByEmail(ctx context.Context, user models.UserLogin) (*models.UserLogin, error)
}

type UserHandler struct {
	serv UserService
}

func NewUserHandler(serv UserService) *UserHandler {
	return &UserHandler{
		serv: serv,
	}
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func (uh *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var user models.User
	var validate = validator.New()
	w.Header().Set("Content-Type", "application/json")

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err)
		return
	}

	err = validate.Struct(user)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err)
		return
	}

	hashedpwd, err := HashPassword(user.Password)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, err)
		return
	}

	user.Password = hashedpwd

	err = uh.serv.CreateUser(ctx, &user)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, err)
		return
	}

	utils.Success(w, user)
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (uh *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var user models.UserLogin

	var validate = validator.New()
	w.Header().Set("Content-Type", "application/json")

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err)
		return
	}

	err = validate.Struct(user)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err)
		return
	}

	res, err := uh.serv.GetUserByEmail(ctx, user)
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err)
		return
	}

	if !CheckPasswordHash(user.Password, res.Password) {
		utils.Error(w, http.StatusUnauthorized, err)
		return
	}

	token, err := tokens.CreateToken(int(res.ID))
	if err != nil {
		utils.Error(w, http.StatusBadRequest, err)
		return
	}

	utils.WithToken(w, res, token)
}
