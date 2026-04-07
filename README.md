# Planarity & Graph Embedding Visualization

A web-based interactive module for **topological graph theory**

- Check it out live at https://unleqit.github.io/TopologicalGraphTheoryVisualizer

Note: This project is built with **Three.js**, and **Pyodide**, therefore your browser must support and allow JavaScript, WebGL and WebAssembly.

Core features of this project include:

- Test whether a graph is **planar** (Left-Right Planarity algorithm).
- Compute a **planar embedding/layout** if possible (Chrobak–Payne embedding algorithm).
- Visualize graphs, graph embeddings and surfaces using **Three.js**.
- Input graphs represented in **matrix** or **adjacency list** format, or via an **interactive editor**.

---

## Features

- **Step-based interface** for learning about graph planarity and embeddings.
- **Dynamic graph input** with tabs for adjacency matrices or lists.
- **Real-time layout computation** using the `networkx` Python module in the browser via Pyodide.
- **Three.js visualization** with smooth rendering and an interactive camera you can control.
- **Preserved input** across steps, allowing experimentation without losing data.

---

## Project Structure

As we intend for this app to be hostable and runnable in as many environments as possible, we did not create a dedicated backend for the app, but rather baked the whole business and application logic into this web app, which allows us to host it on services like Github pages.

Below is an in-depth explanation of the project structure:

- `dist`: Bundled output files served to your browser
- `node_modules`: Third party modules
- `public`: HTML files for each page
- `src`: Source files that will be bundled by Webpack
  - `algorithms/chrobak-payne`: **Chrobak-Payne** algorithm from **networkx**, ported to TS and modified to output step-wise results
  - `graph`: Planarity testing logic
    - `layout`: Layout-computation logic for planar graphs
  - `pages`: Page logic
    - `intro-page`: "Introduction to topology" page
    - `landing-page`: Menu page
    - `planarity-page`: "Planarity testing & Embedding" page
    - `surface-page`: "Extending to other surfaces" page
  - `scenes`: Implementations for all **Three.js** scenes of the app
    - `intro-scene`: Scenes of the module "Introduction"
    - `graph-scene`: Scenes of the module "Planarity testing & Embedding"
    - `surface-scene`: Scenes of the module "Extending to other surfaces"
      - `coordinate-transform-functions`: Coordinate transformation logic
      - `visualization`: Visualization logic for surfaces and their embeddings
        - `helpers`: Utility methods for visualization
        - `step-definitons`: Reordering steps executed before gluing edges together
          - `k33`: Embdding logic for the **Kuratowski** subgraph $K_{3,3}$
            - `redo`: Forward steps
            - `undo`: Backward steps
        - `types`: Types for visualization
  - `styles`: Style files
  - `ui`: UI-related logic
- `eslintrc.json`: Legacy ESLint config ued to exclude some subdirectories from linting
- `.gitignore`: Git-related rules
- `.prettierrc`: Formatting-related rules
- `eslint.config.js`: Linting-related rules
- `package.json`: Contains scripts (e.g. `dev` from `npm run dev`), package info and dependencies
- `tsconfig.json`: TypeScript-related rules
- `webpack.config.js`: Webpack-related rules used during development
- `webpack.prod.js`: Webpack-related rules used when deploying the app to Github pages

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
Due to lack of testing devices, configurations for other browsers such as Safari will not be provided.

# Licensing

See `LICENSES_THIRD_PARTY.txt` for third party licenses (currently: small part of `networkx` Python module v2.7.1 source code, which can be found [here](https://networkx.org/documentation/networkx-2.7.1/_modules/networkx/algorithms/planar_drawing.html) ).
