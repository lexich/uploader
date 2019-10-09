import * as React from 'react';
import * as ReactDom from 'react-dom';
import { App } from './App';
import StoreContext from 'storeon/react/context';
import store from './store';

ReactDom.render(
  <StoreContext.Provider value={store}>
    <App />
  </StoreContext.Provider>,
  document.getElementById('root')
);
