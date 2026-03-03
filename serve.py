import http.server
import socketserver
import mimetypes
import os

PORT = 8080
DIST_DIR = "./dist"

# Force proper MIME types
mimetypes.add_type("application/wasm", ".wasm")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("application/octet-stream", ".bin")

os.chdir(DIST_DIR)

class MyRequestHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        ext = os.path.splitext(path)[1]
        if ext == ".wasm":
            return "application/wasm"
        elif ext == ".js":
            return "text/javascript"
        elif ext == ".css":
            return "text/css"
        elif ext in [".html", ".htm"]:
            return "text/html"
        return super().guess_type(path)

    def end_headers(self):
        # prevent caching (optional)
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

Handler = MyRequestHandler

with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT} from {os.getcwd()}")
    httpd.serve_forever()
