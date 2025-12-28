package models

type User struct {
	ID       uint   `json:"id" gorm:"primaryKey;autoIncrement" `
	Name     string `json:"name" gorm:"size:100" validate:"required"`
	Email    string `json:"email" gorm:"size:100" validate:"required,email"`
	Password string `json:"password" gorm:"size:100" validate:"required"`
}

type UserLogin struct {
	ID       uint   `json:"id" `
	Name     string `json:"name,omitempty"` // Added name field
	Email    string `json:"email"  validate:"required,email"`
	Password string `json:"password" validate:"required"`
}
