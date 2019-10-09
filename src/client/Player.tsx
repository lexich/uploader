import * as React from 'react';
import { Progress, Button } from 'antd';
import ReactPlayer, { SourceProps } from 'react-player';
export interface IPlayerProps {
  url: string | string[] | SourceProps[] | MediaStream;
  isPlaying?: boolean;
}
export interface IPlayerState {
  isPlaying: boolean;
  playProgress: number;
  loadProgress: number;
}

export class Player extends React.Component<IPlayerProps, IPlayerState> {
  state: IPlayerState = {
    isPlaying: !!this.props.isPlaying,
    playProgress: 0,
    loadProgress: 0
  };
  render() {
    const { url } = this.props;
    const { isPlaying, playProgress, loadProgress } = this.state;
    const playBtn = !isPlaying ? (
      <Button shape="round" icon="caret-right" onClick={this.onPlay} />
    ) : (
      <Button shape="round" icon="pause" onClick={this.onPause} />
    );
    return (
      <div style={{ display: 'flex', width: '100%', padding: '30px' }}>
        <ReactPlayer
          onProgress={this.handleProgress}
          playing={isPlaying}
          url={url}
          width="0"
          height="0"
        />
        {playBtn}
        &nbsp;
        <Progress
          style={{
            padding: '4px 10px 0 15px'
          }}
          percent={loadProgress}
          successPercent={playProgress}
          format={this.onFormat}
        />
      </div>
    );
  }
  onFormat = (_percent?: number, successPercent?: number) =>
    `${successPercent}%`;
  onPlay = () => this.setState({ isPlaying: true });
  onPause = () => this.setState({ isPlaying: false });
  handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    this.setState({
      playProgress: Math.round(state.played * 100),
      loadProgress: Math.round(state.loaded * 100)
    });
  };
}
