package models

type Product struct {
	ID    uint   `json:"id" redis:"id" gorm:"primaryKey;autoIncrement" `
	Name  string `json:"name" redis:"name" gorm:"size:100;unique" validate:"required"`
	Price string `json:"price" redis:"price" gorm:"size:100" validate:"required"`
}
