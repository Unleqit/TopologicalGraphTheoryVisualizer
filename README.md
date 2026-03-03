# Planarity & Graph Embedding Visualization

A web-based interactive module for **topological graph theory**, allowing users to:

- Test whether a graph is **planar** (Boyer–Myrvold algorithm).
- Compute a **planar embedding/layout** if possible.
- Visualize graphs using **Three.js**.
- Input graphs via **adjacency matrices** or **adjacency lists**.

This project is built with **TypeScript**, **Three.js**, and **Pyodide**.

---

## Features

- **Step-based interface** for learning about graph planarity and embeddings.
- **Dynamic graph input** with tabs for adjacency matrices or lists.
- **Real-time layout computation** using the `networkx` Python module via Pyodide.
- **Three.js visualization** with smooth rendering and interactive camera (TBD?).
- **Preserved input** across steps, allowing experimentation without losing data.

---

## Project Structure

As we intend for this app to be hostable and runnable in as many environments as possible, we did not create a dedicated backend for the app, but rather baked the whole business and application logic into this web app.

Below is the purpose of the different folders:

- `dist`: This is where the bundled outputs go, which will be served to your browser
- `node_modules`: node_modules
- `public`: Contains all HTML files
- `src`: Here are all CSS/JS/TS files, which need to be bundled by Webpack
- `.gitignore`: Git-related rules
- `.prettierrc`: Formatting-related rules
- `eslint.config.js`: Linting-related rules
- `package.json`: Contains scripts (e.g. `dev` from `npm run dev`), package info and dependencies
- `tsconfig.json`: TypeScript-related rules
- `webpack.config.js`: Webpack-related rules

---

## Setting up a development environment

The following lines assume you already have `node` installed on your system. If not, install it via your distro's package manager (Linux) or by installing a node version manager (e.g. `nvm`) in Windows.

This project was built with `node v20.19.6`; it might work with other versions as well.

A specific version of node may be obtained and selected for execution by running `nvm install 20.19.6 && nvm use 20.19.6` or similar in your terminal.

If you use VS Code and prefer using/debugging with Firefox, install this extension: `firefox-devtools.vscode-firefox-debug`.
Afterwards, run:

```bash
git clone git@github.com:Unleqit/TopologicalGraphTheoryVisualizer.git
cd TopologicalGraphTheoryVisualizer
npm i
npm run dev
```

After that, press F5 to start the project in your preferred browser (there are launch configurations available for Firefox and Chrome).
Breakpoints should work out of the box.

# Running the application

You don't need to have `node` installed to just run the app and view its contents, but this way you won't be able to make changes.
For this, navigate into the `dist` folder in the project root and serve its contents via a local webserver.

You may use `serve` (npm module) or `http.server` from python for this, although there are other alternatives.

Example usage:

- `python -m http.server 8080`
- `serve . -l 8080`

After running this command, open your browser and navigate to `http://localhost:8080`.

Note: Do NOT just open the index.html (or any other .html file) directly with your browser; this will not work, as WebGL and WebAssembly, which our app is reliant upon, are usually prohibited file urls.
