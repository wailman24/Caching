package utils

import (
	"encoding/json"
	"net/http"
)

type ApiResponse struct {
	Code    int         `json:"code"`
	Message interface{} `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Token   string      `json:"token,omitempty"`
}

func JSON(w http.ResponseWriter, status int, message interface{}, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	json.NewEncoder(w).Encode(ApiResponse{
		Code:    status,
		Message: message,
		Data:    data,
	})
}

func Error(w http.ResponseWriter, status int, err error) {
	JSON(w, status, err.Error(), nil)
}

func Success(w http.ResponseWriter, data interface{}) {
	JSON(w, http.StatusOK, "success", data)
}

func WithToken(w http.ResponseWriter, data interface{}, token string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	json.NewEncoder(w).Encode(ApiResponse{
		Code:  http.StatusOK,
		Data:  data,
		Token: token,
	})
}
