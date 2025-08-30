# Chronosplit - Vanilla JS Version

This is the repository for Chronosplit, a 3D web game prototype. This version is built with plain ("vanilla") JavaScript and uses an ES Module import for Three.js directly from a CDN.

## Project Structure

- `index.html`: The main entry point of the application. It contains the HTML structure, the import map for Three.js, and links to the CSS and JavaScript files.
- `main.js`: Contains all the game logic, including the Three.js scene setup and animation loop.
- `style.css`: Contains the styles for the HUD and page layout.

## How to Run

This project does not require any build tools, Node.js, or `npm`.

1.  **Clone the repository.**
2.  **Run a local server.** You need to serve the files from a local server. You cannot just open `index.html` directly in the browser from the filesystem (`file:///...`) because ES Modules have security restrictions (CORS) that prevent them from loading this way.

    A simple way to do this is to use Python's built-in web server. Open your terminal in the project's root directory and run:

    ```bash
    # For Python 3
    python -m http.server
    ```
    Or, if you have Node.js installed, you can use the `serve` package:
    ```bash
    npx serve
    ```
3.  **Open in your browser:** Navigate to the URL provided by the server (usually `http://localhost:8000` or `http://localhost:3000`).
