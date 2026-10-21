
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/geist-mono';
import App from './App';
import { applyTheme, loadTheme } from './lib/theme';
import './index.css';

// 첫 화면이 그려지기 전에 테마를 적용해 색이 깜박이지 않게 한다.
applyTheme(loadTheme());

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
