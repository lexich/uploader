import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from './App';
import StoreContext from 'storeon/react/context';
import store from './store';

ReactDOM.render(
  <StoreContext.Provider value={store}>
    <App />
  </StoreContext.Provider>,
  document.getElementById('mountNode')
);
