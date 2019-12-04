import * as React from 'react';
import {
  List,
  Skeleton,
  Layout,
  Upload,
  Icon,
  Button,
  Menu,
} from 'antd';
import { IFile } from './interfaces';
import ContentViewer from './ContentViewer';
import IconFile from './IconFile';
import useStoreon from 'storeon/react';
import { IState, IEvents } from './store';
import { isViewable } from './utils';
import styles from './App.module.css';

export function App() {
  const { dispatch, files } = useStoreon<IState, IEvents>('files');
  const { activeFile } = useStoreon<IState, IEvents>('activeFile');
  const content = !activeFile ? null : (
    <ContentViewer file={activeFile} onClose={() => dispatch('active', undefined)} />
  );
  return (
    <Layout>
      <Layout.Header>
        <Menu theme="dark" mode="horizontal" style={{ float: 'right' }}>
          <Menu.Item key="1">
            <a href="/logout">Logout</a>
          </Menu.Item>
        </Menu>
      </Layout.Header>
      <Layout.Content style={{ padding: '0 50px' }}>
        <Upload.Dragger
          name="file"
          action="/file-upload"
          showUploadList={false}
          onChange={info => {
            if (info.file.status === 'done') {
              const res = info.file.response;
              const newFile: IFile = {
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
        { content }
        <List
          className=""
          dataSource={files}
          renderItem={item => (
            <List.Item
              actions={[
                <Button
                  icon="delete"
                  shape="round"
                  onClick={() => dispatch('remove', item)}
                >
                  Remove
                </Button>
              ]}
            >
              <Skeleton avatar title={false} active loading={false}>
                <List.Item.Meta
                  avatar={[
                    <IconFile className={styles.Icon} key={`icon-${item.id}`} file={item} />,
                    <Button
                      key={`button-${item.id}`}
                      shape="circle"
                      icon="eye"
                      disabled={!isViewable(item)}
                      onClick={() => dispatch('active', item)}
                    />
                  ]}
                  title={
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.name}&nbsp;&nbsp;&nbsp;<Icon type="select" />
                    </a>
                  }
                />
              </Skeleton>
            </List.Item>
          )}
        />
      </Layout.Content>
    </Layout>
  );
}
