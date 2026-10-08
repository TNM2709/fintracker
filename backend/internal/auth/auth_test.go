package auth

import (
	"testing"
	"time"
)

func TestPasswordHashingAndVerification(t *testing.T) {
	rawPassword := "SecurePassword123!"
	hashed, err := HashPassword(rawPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if !CheckPassword(rawPassword, hashed) {
		t.Fatalf("Expected password check to succeed for correct password")
	}

	if CheckPassword("WrongPassword", hashed) {
		t.Fatalf("Expected password check to fail for incorrect password")
	}
}

func TestJWTGenerationAndValidation(t *testing.T) {
	userID := "usr-12345"
	username := "john_doe"
	role := "admin"

	token, err := GenerateJWT(userID, username, role, 1*time.Hour)
	if err != nil {
		t.Fatalf("Failed to generate JWT: %v", err)
	}

	claims, err := ParseAndValidateJWT(token)
	if err != nil {
		t.Fatalf("Failed to parse and validate valid JWT: %v", err)
	}

	if claims.Sub != userID || claims.Username != username || claims.Role != role {
		t.Fatalf("Claims mismatch: got %+v", claims)
	}

	// Test expired token
	expiredToken, err := GenerateJWT(userID, username, role, -1*time.Minute)
	if err != nil {
		t.Fatalf("Failed to generate expired JWT: %v", err)
	}

	_, err = ParseAndValidateJWT(expiredToken)
	if err == nil {
		t.Fatalf("Expected expired token to return error")
	}
}
