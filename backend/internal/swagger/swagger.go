package swagger

import (
	_ "embed"
	"net/http"

	"github.com/go-chi/chi/v5"
)

//go:embed openapi.json
var openAPISpec []byte

const swaggerIndexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FinTracker Pro - API & Schema Documentation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/favicon-32x32.png" sizes="32x32" />
  <style>
    body {
      margin: 0;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .topbar { display: none !important; }
    .ft-head {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-bottom: 1px solid #334155;
      padding: 16px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ft-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ft-badge {
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      color: white;
      font-weight: 800;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 1rem;
    }
    .ft-text h1 {
      margin: 0;
      font-size: 1.25rem;
      color: #f8fafc;
      font-weight: 700;
    }
    .ft-text p {
      margin: 2px 0 0;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .ft-links a {
      color: #38bdf8;
      text-decoration: none;
      font-size: 0.85rem;
      margin-left: 12px;
      padding: 6px 12px;
      border: 1px solid #334155;
      border-radius: 6px;
      background: #0f172a;
    }
    .ft-links a:hover {
      border-color: #38bdf8;
      color: #f8fafc;
    }
    .swagger-ui {
      max-width: 1280px;
      margin: 0 auto;
      padding: 20px;
    }
    .swagger-ui .info .title { color: #f8fafc !important; }
    .swagger-ui .info p, .swagger-ui .info li { color: #cbd5e1 !important; }
    .swagger-ui .scheme-container {
      background: #1e293b !important;
      border: 1px solid #334155;
      border-radius: 8px;
    }
    .swagger-ui select {
      background: #0f172a !important;
      color: #f8fafc !important;
      border: 1px solid #475569 !important;
      border-radius: 6px !important;
    }
    .swagger-ui .opblock {
      border-radius: 8px !important;
      border: 1px solid #334155 !important;
      margin-bottom: 10px !important;
      background: rgba(30, 41, 59, 0.5) !important;
    }
    .swagger-ui .opblock-tag {
      color: #38bdf8 !important;
      border-bottom: 1px solid #334155 !important;
    }
    .swagger-ui .opblock .opblock-summary-path {
      color: #f8fafc !important;
      font-weight: 600 !important;
    }
    .swagger-ui .opblock .opblock-summary-description {
      color: #94a3b8 !important;
    }
    .swagger-ui section.models {
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      background: #1e293b !important;
    }
    .swagger-ui section.models h4 {
      color: #f8fafc !important;
      border-bottom: 1px solid #334155 !important;
    }
    .swagger-ui .model-box {
      background: #0f172a !important;
    }
    .swagger-ui .model-title {
      color: #34d399 !important;
    }
    .swagger-ui table.model {
      color: #cbd5e1 !important;
    }
    .swagger-ui .prop-type {
      color: #38bdf8 !important;
    }
    .swagger-ui .filter .operation-filter-input {
      background: #0f172a !important;
      color: #f8fafc !important;
      border: 1px solid #475569 !important;
      border-radius: 6px !important;
      padding: 6px 12px !important;
    }
  </style>
</head>
<body>
  <div class="ft-head">
    <div class="ft-title">
      <div class="ft-badge">FT</div>
      <div class="ft-text">
        <h1>FinTracker Pro - Swagger Engine</h1>
        <p>Interactive OpenAPI 3.0 Documentation & Schemas for Frontend</p>
      </div>
    </div>
    <div class="ft-links">
      <a href="/swagger/doc.json" target="_blank">OpenAPI JSON</a>
      <a href="/" target="_blank">Back to Web App</a>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/swagger/doc.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        displayRequestDuration: true,
        tryItOutEnabled: true
      });
    };
  </script>
</body>
</html>`

// RegisterRoutes registers Swagger UI and JSON specification endpoints
func RegisterRoutes(r chi.Router) {
	// Raw OpenAPI 3.0 JSON specification
	r.Get("/swagger/doc.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(openAPISpec)
	})

	r.Get("/swagger/openapi.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(openAPISpec)
	})

	// Swagger UI Interactive Webpage
	r.Get("/swagger", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/swagger/index.html", http.StatusMovedPermanently)
	})

	r.Get("/swagger/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/swagger/index.html", http.StatusMovedPermanently)
	})

	r.Get("/swagger/index.html", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(swaggerIndexHTML))
	})

	// Shortcut /docs
	r.Get("/docs", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/swagger/index.html", http.StatusMovedPermanently)
	})
	r.Get("/docs/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/swagger/index.html", http.StatusMovedPermanently)
	})
}
