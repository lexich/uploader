import * as React from 'react';
import { Progress, Button } from 'antd';
import ReactPlayer, { SourceProps } from 'react-player';
export interface IPlayerProps {
  url: string | string[] | SourceProps[] | MediaStream;
  isPlaying?: boolean;
}
export interface IPlayerState {
  isPlaying: boolean;
  startLoading: boolean;
  playProgress: number;
  loadProgress: number;
}

export class Player extends React.Component<IPlayerProps, IPlayerState> {
  state: IPlayerState = {
    isPlaying: !!this.props.isPlaying,
    startLoading: false,
    playProgress: 0,
    loadProgress: 0,
  };
  render() {
    const { url } = this.props;
    const { isPlaying, playProgress, loadProgress, startLoading } = this.state;
    const playBtn = !isPlaying ? (
      <Button shape="round" icon="caret-right" onClick={this.onPlay} />
    ) : (
      <Button shape="round" icon="pause" onClick={this.onPause} />
    );
    const Player = !startLoading ? null : (
      <ReactPlayer
          ref={this.setPlayer}
          onProgress={this.handleProgress}
          playing={isPlaying}
          url={url}
          volume={0.05}
          width="0"
          height="0"
        />
    );

    return (
      <div style={{ display: 'flex', width: '100%', padding: '30px' }}>
        { Player }
        { playBtn }
        &nbsp;
        <div ref={this.setProgress} onClick={this.onSeek} style={{ width: '100%', cursor: 'pointer', padding: '4px 10px 0 15px' }}>
          <Progress
            percent={loadProgress}
            successPercent={playProgress}
            format={this.onFormat}
          />
        </div>
      </div>
    );
  }
  private progress: HTMLDivElement | null = null;
  setProgress = (progress: HTMLDivElement | null) => this.progress = progress;
  private player: ReactPlayer | null = null;
  setPlayer = (player: ReactPlayer | null) => this.player = player;
  onSeek = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!this.progress || !this.player) {
      return;
    }
    const { clientX } = e;
    const { width } = this.progress.getBoundingClientRect();
    const persent = clientX / width;
    this.player.seekTo(persent, 'fraction');
  }
  onFormat = (_percent?: number, successPercent?: number) =>
    `${successPercent}%`;
  onPlay = () => this.setState({ isPlaying: true, startLoading: true });
  onPause = () => this.setState({ isPlaying: false });
  handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    this.setState({
      playProgress: Math.round(state.played * 100),
      loadProgress: Math.round(state.loaded * 100),
    });
  };
}
