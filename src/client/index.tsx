import * as React from 'react';
import * as ReactDom from 'react-dom';
import { App } from './App';
import StoreContext from 'storeon/react/context';
import store, { getFiles } from './store';

if (!getFiles()) {
  store.dispatch('load');
}

ReactDom.render(
  <StoreContext.Provider value={store}>
    <App />
  </StoreContext.Provider>,
  document.getElementById('root')
);
