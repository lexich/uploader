import createStore, { Module, StoreonEvents } from 'storeon';
import { IFile } from '../interfaces';

export interface IState {
  files: IFile[];
}

export interface IEvents extends StoreonEvents<IState> {
  add: IFile;
  remove: IFile;
  save: IState;
}

const initModule: Module<IState, IEvents> = store => {
  store.on('@init', () => ({
    files: (window as any).FILES as IFile[]
  }));
  store.on('add', (state, data) => {
    return { ...state, files: state.files.concat(data) };
  });
  store.on('save', (state, newState) => {
    return newState;
  });
  store.on('remove', async (state, data) => {
    try {
      await fetch(`/file-remove?fileid=${data.id}`, { method: 'delete' });
      const files = state.files.filter(it => it.id !== data.id);
      store.dispatch('save', { ...state, files });
    } catch (err) {}
  });
};

export default createStore<IState>([
  process.env.NODE_ENV !== 'production' && require('storeon/devtools/logger'),
  initModule
]);
