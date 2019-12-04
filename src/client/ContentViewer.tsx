import * as React from 'react';
import { Button } from 'antd';
import { IFile } from '../interfaces';
import { Player } from './Player';
import { isMedia, isImage } from './utils';
import styles from './ContentViewer.module.css';

export interface IContentViewerProps {
  file: IFile;
  onClose?(): void;
}

export default class ContentViewer extends React.Component<
  IContentViewerProps,
  {}
> {
  render() {
    const { onClose } = this.props;
    const content = this.renderContent() || <div>No Content</div>;
    const closeBtn = !onClose ? null : (
      <Button
        className={styles.Close}
        shape="round"
        icon="close"
        type="link"
        onClick={onClose}
      />
    );
    return (
      <div className={styles.Main}>
        {closeBtn}
        {content}
      </div>
    );
  }

  renderContent() {
    const { file } = this.props;
    if (isMedia(file)) {
      return <Player url={file.url} isPlaying={true} />;
    }
    if (isImage(file)) {
      return <img src={file.url} />;
    }
    return null;
  }
}
