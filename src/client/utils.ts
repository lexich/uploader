import { IFile } from '../interfaces';

export function isMedia(file: IFile) {
  return /\.(mp3|wav|ogg)$/.test(file.url);
}

export function isImage(item: IFile) {
  return /\.(png|jpg|jpeg|bmp)$/.test(item.url);
}

export function isViewable(item: IFile) {
  return isMedia(item) || isImage(item);
}
