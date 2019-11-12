import createStore, { Module, StoreonEvents } from 'storeon';
import { IFile } from '../interfaces';

export interface IState {
  files: IFile[];
}

export interface IEvents extends StoreonEvents<IState> {
  add: IFile;
  remove: IFile;
  save: IState;
  load: undefined;
}

export function getFiles() {
  return (window as any).FILES as (IFile[] | undefined);
}

const initModule: Module<IState, IEvents> = store => {
  store.on('@init', () => ({
    files: getFiles() || []
  }));
  store.on('add', (state, data) => {
    return { ...state, files: state.files.concat(data) };
  });
  store.on('save', (_state, newState) => {
    return newState;
  });
  store.on('load', async state => {
    try {
      const resp = await fetch('/files', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      const files: IFile[] = await resp.json();
      store.dispatch('save', { ...state, files });
    } catch (_) {}
  });
  store.on('remove', async (state, data) => {
    try {
      await fetch(`/file-remove?fileid=${data.id}`, {
        method: 'post',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      const files = state.files.filter(it => it.id !== data.id);
      store.dispatch('save', { ...state, files });
    } catch (err) {}
  });
};

export default createStore<IState>([
  process.env.NODE_ENV !== 'production' && require('storeon/devtools/logger'),
  initModule
]);
