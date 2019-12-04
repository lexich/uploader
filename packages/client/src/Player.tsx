import * as React from 'react';
import { Button, Slider } from 'antd';
import ReactPlayer, { SourceProps } from 'react-player';
import { SliderValue } from 'antd/lib/slider';
import styles from './Player.module.css';

export interface IPlayerProps {
  url: string | string[] | SourceProps[] | MediaStream;
  isPlaying?: boolean;
}

export interface IProgress {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

export interface IPlayerState extends IProgress {
  isPlaying: boolean;
  playProgress: number;
  loadProgress: number;
  volume: number;
}

function timeFormatter(aTime: number) {
  const time = Math.round(aTime);
  const min = Math.round(time / 60);
  const sec = time % 60;
  return (min < 10 ? `0${min}` : `${min}`) + ':' + (sec < 10 ? `0${sec}`: `${sec}`);
}

export class Player extends React.Component<IPlayerProps, IPlayerState> {
  state: IPlayerState = {
    isPlaying: !!this.props.isPlaying,
    played: 0,
    loaded: 0,
    playedSeconds: 0,
    loadedSeconds: 0,
    playProgress: 0,
    loadProgress: 0,
    volume: 0.05
  };

  render() {
    const { url } = this.props;
    const { isPlaying,  loadedSeconds, playedSeconds, volume } = this.state;
    const playBtn = !isPlaying ? (
      <Button shape="round" icon="caret-right" onClick={this.onPlay} />
    ) : (
      <Button shape="round" icon="pause" onClick={this.onPause} />
    );

    const Player = (
      <ReactPlayer
        ref={this.setPlayer}
        onProgress={this.handleProgress}
        playing={isPlaying}
        url={url}
        volume={volume}
        width="0"
        height="0"
      />
    );
    const max = this.max();
    return (
      <div className={styles.Main}>
        {Player}
        {playBtn}
        &nbsp;
        <Slider
          onChange={this.onChangePlay}
          tipFormatter={timeFormatter}
          value={playedSeconds}
          min={0}
          max={max}
          tooltipVisible={true}
          marks={{
            [loadedSeconds]: '',
            [max]: timeFormatter(max)
          }}
          style={{
            width: '100%',
            cursor: 'pointer',
            padding: '4px 10px 0 15px'
          }}
        />
      </div>
    );
  }

  private max() {
    const { loadedSeconds, loaded } = this.state;
    return loaded ? loadedSeconds / loaded : 0;
  }

  private onChangePlay = (value: SliderValue) => {
    const { player } = this;
    if (!player) {
      return;
    }
    if (Array.isArray(value)) {
      return;
    }

    player.seekTo(value, 'seconds');
  };

  private player: ReactPlayer | null = null;
  setPlayer = (player: ReactPlayer | null) => (this.player = player);
  onPlay = () => this.setState({ isPlaying: true });
  onPause = () => this.setState({ isPlaying: false });
  handleProgress = (state: IProgress) => {
    this.setState({
      ...state,
      playProgress: Math.round(state.played * 100),
      loadProgress: Math.round(state.loaded * 100)
    });
  };
}
