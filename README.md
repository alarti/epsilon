# Chronosplit - 3D Web Game

This is the repository for Chronosplit, an infinitely replayable, AI-driven 3D web game built with TypeScript, Vite, and Three.js.

## Project Overview

This project is a 3D runner game featuring procedurally generated levels, dynamic difficulty adjusted by an AI Director, and a reactive narrative system. It is designed to be a lightweight, performant, and highly replayable web experience.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/chronosplit.git
    cd chronosplit
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

To start the local development server with hot-reloading, run the following command:

```bash
npm run dev
```

This will open the application in your default browser, typically at `http://localhost:5173`.

### Building for Production

To create a production-ready build of the application, run:

```bash
npm run build
```

The output files will be located in the `dist/` directory.

## Deployment to GitHub Pages

This project is configured for easy deployment to GitHub Pages.

1.  **Push to GitHub:** Make sure your project is hosted on a GitHub repository.

2.  **Run the Deploy Script:** Use the following command to build the project and deploy it to the `gh-pages` branch:
    ```bash
    npm run deploy
    ```

    This script will:
    - Run `npm run build` to generate the production assets.
    - Use the `gh-pages` package to push the contents of the `dist` directory to the `gh-pages` branch on your repository.

3.  **Configure GitHub Pages:** In your repository settings on GitHub, navigate to the "Pages" section and set the source to the `gh-pages` branch. Your site will be live at `https://your-username.github.io/chronosplit/`.
