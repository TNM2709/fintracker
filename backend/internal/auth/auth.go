package auth

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

type contextKey string

const (
	UserIDKey   contextKey = "userID"
	UsernameKey contextKey = "username"
	UserRoleKey contextKey = "userRole"
)

var (
	ErrInvalidToken   = errors.New("invalid or malformed token")
	ErrTokenExpired   = errors.New("token has expired")
	ErrInvalidHash    = errors.New("invalid password hash format")
	ErrUnauthorized   = errors.New("unauthorized access")
	ErrForbiddenAdmin = errors.New("admin privileges required")
)

type JWTClaims struct {
	Sub      string `json:"sub"` // User ID
	Username string `json:"username"`
	Role     string `json:"role"` // "admin" | "user"
	Exp      int64  `json:"exp"`
	Iat      int64  `json:"iat"`
}

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "fintracker-high-performance-enterprise-jwt-secret-key-2026"
	}
	return []byte(secret)
}

// ==================== PASSWORD HASHING ====================

// HashPassword hashes a plaintext password with a cryptographically secure random salt using PBKDF2-HMAC-SHA256
func HashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("generating salt: %w", err)
	}

	iterations := 10000
	hash := pbkdf2SHA256([]byte(password), salt, iterations, 32)

	return fmt.Sprintf("pbkdf2:sha256:%d:%s:%s",
		iterations,
		hex.EncodeToString(salt),
		hex.EncodeToString(hash),
	), nil
}

// CheckPassword verifies a plaintext password against a stored PBKDF2 hash
func CheckPassword(password, encodedHash string) bool {
	parts := strings.Split(encodedHash, ":")
	if len(parts) != 5 || parts[0] != "pbkdf2" || parts[1] != "sha256" {
		return false
	}

	iterations, err := strconv.Atoi(parts[2])
	if err != nil || iterations <= 0 {
		return false
	}

	salt, err := hex.DecodeString(parts[3])
	if err != nil {
		return false
	}

	expectedHash, err := hex.DecodeString(parts[4])
	if err != nil {
		return false
	}

	computedHash := pbkdf2SHA256([]byte(password), salt, iterations, len(expectedHash))
	return subtle.ConstantTimeCompare(computedHash, expectedHash) == 1
}

// pbkdf2SHA256 implements standard PBKDF2 with HMAC-SHA256
func pbkdf2SHA256(password, salt []byte, iter, keyLen int) []byte {
	prf := hmac.New(sha256.New, password)
	hashLen := prf.Size()
	numBlocks := (keyLen + hashLen - 1) / hashLen
	var result []byte

	for block := 1; block <= numBlocks; block++ {
		// U_1 = PRF(password, salt || INT_32_BE(block))
		prf.Reset()
		prf.Write(salt)
		var blockBytes [4]byte
		blockBytes[0] = byte(block >> 24)
		blockBytes[1] = byte(block >> 16)
		blockBytes[2] = byte(block >> 8)
		blockBytes[3] = byte(block)
		prf.Write(blockBytes[:])
		u := prf.Sum(nil)

		// T_block = U_1
		t := make([]byte, hashLen)
		copy(t, u)

		// XOR with U_2 ... U_iter
		for i := 2; i <= iter; i++ {
			prf.Reset()
			prf.Write(u)
			u = prf.Sum(nil)
			for j := 0; j < hashLen; j++ {
				t[j] ^= u[j]
			}
		}

		result = append(result, t...)
	}

	return result[:keyLen]
}

// ==================== JSON WEB TOKEN (JWT HS256) ====================

// GenerateJWT creates a signed JWT token valid for the specified duration
func GenerateJWT(userID, username, role string, duration time.Duration) (string, error) {
	now := time.Now().Unix()
	claims := JWTClaims{
		Sub:      userID,
		Username: username,
		Role:     role,
		Exp:      now + int64(duration.Seconds()),
		Iat:      now,
	}

	headerJSON := `{"alg":"HS256","typ":"JWT"}`
	headerEnc := base64.RawURLEncoding.EncodeToString([]byte(headerJSON))

	claimsBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	claimsEnc := base64.RawURLEncoding.EncodeToString(claimsBytes)

	unsignedToken := headerEnc + "." + claimsEnc

	mac := hmac.New(sha256.New, getJWTSecret())
	mac.Write([]byte(unsignedToken))
	sig := mac.Sum(nil)
	sigEnc := base64.RawURLEncoding.EncodeToString(sig)

	return unsignedToken + "." + sigEnc, nil
}

// ParseAndValidateJWT validates the JWT signature and expiration
func ParseAndValidateJWT(tokenStr string) (*JWTClaims, error) {
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return nil, ErrInvalidToken
	}

	unsignedPart := parts[0] + "." + parts[1]
	providedSig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, ErrInvalidToken
	}

	mac := hmac.New(sha256.New, getJWTSecret())
	mac.Write([]byte(unsignedPart))
	expectedSig := mac.Sum(nil)

	if !hmac.Equal(providedSig, expectedSig) {
		return nil, ErrInvalidToken
	}

	claimsJSON, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, ErrInvalidToken
	}

	var claims JWTClaims
	if err := json.Unmarshal(claimsJSON, &claims); err != nil {
		return nil, ErrInvalidToken
	}

	if time.Now().Unix() > claims.Exp {
		return nil, ErrTokenExpired
	}

	return &claims, nil
}

// ==================== CONTEXT HELPERS ====================

func GetUserIDFromContext(ctx context.Context) string {
	if val := ctx.Value(UserIDKey); val != nil {
		if s, ok := val.(string); ok {
			return s
		}
	}
	return ""
}

func GetUsernameFromContext(ctx context.Context) string {
	if val := ctx.Value(UsernameKey); val != nil {
		if s, ok := val.(string); ok {
			return s
		}
	}
	return ""
}

func GetUserRoleFromContext(ctx context.Context) string {
	if val := ctx.Value(UserRoleKey); val != nil {
		if s, ok := val.(string); ok {
			return s
		}
	}
	return ""
}

// ==================== HTTP MIDDLEWARES ====================

// AuthMiddleware inspects Bearer token.
// If optional is true, unauthenticated requests proceed as guest (empty UserID in context).
// If optional is false, unauthenticated requests are rejected with 401 Unauthorized.
func AuthMiddleware(optional bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			tokenStr := ""

			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
			} else if qToken := r.URL.Query().Get("token"); qToken != "" {
				tokenStr = qToken
			}

			if tokenStr == "" {
				if optional {
					// Proceed as guest
					next.ServeHTTP(w, r)
					return
				}
				http.Error(w, `{"error":"Unauthorized: Authentication token is required"}`, http.StatusUnauthorized)
				return
			}

			claims, err := ParseAndValidateJWT(tokenStr)
			if err != nil {
				if optional {
					// Invalid token on optional route falls back to guest
					next.ServeHTTP(w, r)
					return
				}
				http.Error(w, fmt.Sprintf(`{"error":"Unauthorized: %s"}`, err.Error()), http.StatusUnauthorized)
				return
			}

			// Attach claims to context
			ctx := context.WithValue(r.Context(), UserIDKey, claims.Sub)
			ctx = context.WithValue(ctx, UsernameKey, claims.Username)
			ctx = context.WithValue(ctx, UserRoleKey, claims.Role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAdmin verifies that the authenticated user possesses the "admin" role
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role := GetUserRoleFromContext(r.Context())
		if role != "admin" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"error":"Forbidden: Administrator privileges required"}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}
