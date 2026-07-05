import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import PrincipalDashboard from './src/pages/PrincipalDashboard.jsx';

try {
  console.log("Compiling successful if we reach here");
} catch (err) {
  console.error("Error", err);
}
