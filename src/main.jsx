/**
 * main.jsx — the entry point for the entire app.
 *
 * When the browser loads index.html, that file has a single empty <div id="root">
 * waiting for us. This file's job is to find that div and tell React to take
 * it over and render our App component inside it.
 *
 * After this file runs, everything you see on screen is being managed by React.
 */

// React's StrictMode is a development-only wrapper. It intentionally double-runs
// some things (like effects) to help catch bugs early. It has zero effect in
// production builds — Vite strips it. Always wrap your root in StrictMode.
import { StrictMode } from 'react';

// `createRoot` is the modern React 18 way to mount a React app onto a DOM node.
// It replaces the old ReactDOM.render() API and enables concurrent features.
import { createRoot } from 'react-dom/client';

// Our top-level App component. The .jsx extension is required by Vite's
// resolver because we want it to know this file contains JSX.
import App from './App.jsx';

// Step 1: Find the empty <div id="root"> in index.html.
// Step 2: Hand it to React via createRoot().
// Step 3: Tell React to render our App component inside it.
//
// .render() is the call that actually paints something to the screen. Everything
// we ever see is the result of this single render call (and the re-renders
// React schedules afterward when state changes).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
