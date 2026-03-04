# Planarity & Graph Embedding Visualization

A web-based interactive module for **topological graph theory**

- Check it out live at https://unleqit.github.io/TopologicalGraphTheoryVisualizer

Core features of the project include:

- Test whether a graph is **planar** (Boyer–Myrvold algorithm).
- Compute a **planar embedding/layout** if possible (Chrobak–Payne algorithm).
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

Below is the purpose of the different folders (TODO: change to fix new structure):

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
Due to lack of testing devices, configurations for other browsers such as Safari will not be provided.

# Licensing

See `LICENSES_THIRD_PARTY.txt` for third party licenses (currently: small part of `networkx` Python module v2.7.1 source code, which can be found [here](https://networkx.org/documentation/networkx-2.7.1/_modules/networkx/algorithms/planar_drawing.html) ).
