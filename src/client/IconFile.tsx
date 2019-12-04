import * as React from 'react';
import { IFile } from '../interfaces';
import { Avatar } from 'antd';
import { isMedia, isImage } from './utils';

export interface IIconFileProps {
  className?: string;
  file: IFile;
}

export default function IconFile({ file, className }: IIconFileProps) {
  if (isMedia(file)) {
    return <Avatar className={className} icon="audio" />;
  }
  if (isImage(file)) {
    return <Avatar className={className} src={file.url} />;
  }
  if (/\.pdf$/.test(file.url)) {
    return <Avatar className={className} icon="file-pdf" />;
  }
  return <Avatar className={className} icon="file-unknown" />;
}
