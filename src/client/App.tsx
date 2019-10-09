import * as React from 'react';
import { List, Skeleton, Avatar, Layout, Upload, Icon, Button } from 'antd';
import { IFile } from '../interfaces';
import { UploadChangeParam } from 'antd/lib/upload';
import { Player } from './Player';
import useStoreon from 'storeon/react';
import { IState, IEvents } from './store';

export function isMedia(file: IFile) {
  return /\.(mp3|wav|ogg)$/.test(file.url);
}

export function isImage(item: IFile) {
  return /\.(png|jpg|jpeg|bmp)$/.test(item.url);
}

function renderContent(item: IFile) {
  if (isMedia(item)) {
    return <Player url={item.url} />;
  }
  if (isImage(item)) {
    return null;
  }
}

function renderAvatar(item: IFile) {
  if (isMedia(item)) {
    return <Avatar icon="audio" />;
  }
  if (isImage(item)) {
    return <Avatar src={item.url} />;
  }
  if (/\.pdf$/.test(item.url)) {
    return <Avatar icon="file-pdf" />;
  }
  return <Avatar icon="file-unknown" />;
}

export function App() {
  const { dispatch, files } = useStoreon<IState, IEvents>('files');

  return (
    <Layout>
      <Layout.Content style={{ padding: '0 50px' }}>
        <Upload.Dragger
          name="file"
          action="/file-upload"
          showUploadList={false}
          onChange={info => {
            if (info.file.status === 'done') {
                const res = info.file.response;
                const newFile:IFile = {
                    id: res.id,
                    name: res.filename,
                    url: res.url
                };
                dispatch('add', newFile);
            }
          }}
        >
          <p className="ant-upload-drag-icon">
            <Icon type="inbox" />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload. Strictly prohibit from
            uploading company data or other band files
          </p>
        </Upload.Dragger>

        <List
          className=""
          dataSource={files}
          renderItem={item => (
            <List.Item actions={[
              <Button icon='delete' shape='round' onClick={() => dispatch('remove', item)}>Remove</Button>
            ]}>
              <Skeleton avatar title={false} active loading={false}>
                <List.Item.Meta
                  avatar={renderAvatar(item)}
                  title={
                    <a href={item.url} target="_blank">
                      {item.name}
                    </a>
                  }
                />
                {renderContent(item)}
              </Skeleton>
            </List.Item>
          )}
        />
      </Layout.Content>
    </Layout>
  );
}
