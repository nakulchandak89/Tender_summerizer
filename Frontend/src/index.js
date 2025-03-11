import React from 'react';
import ReactDOM from 'react-dom';
import App from './app'; // Updated import path
import Header from './Components/header';

ReactDOM.render(
  <React.StrictMode>
    <Header />
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
