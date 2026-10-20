import { useRef, useState } from 'react';
import './AmbientMedia.css';

function AmbientMedia() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [videoUnavailable, setVideoUnavailable] = useState(false);

  const togglePlayback = () => {
    const video = videoRef.current;

    if (!video || videoUnavailable) return;

    if (video.paused) {
      video.play().catch(error => {
        console.error('Background video playback failed:', error.message);
        setVideoUnavailable(true);
        setIsPlaying(false);
      });
      return;
    }

    video.pause();
  };

  return (
    <>
      <div className="ambient-media" aria-hidden="true">
        <video
          ref={videoRef}
          className="ambient-media-video"
          src="/videos/industrial-maintenance.mp4"
          poster="/videos/industrial-maintenance-poster.jpg"
          autoPlay={isPlaying}
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setVideoUnavailable(true)}
        />
        <div className="ambient-media-scrim" />
      </div>
      <div className="ambient-media-controls">
        <span className="ambient-media-credit">
          {videoUnavailable ? 'Still image · Pexels' : 'Background footage · Pexels'}
        </span>
        <a
          className="ambient-media-source"
          href="https://www.pexels.com/video/a-man-in-a-green-jacket-is-working-on-a-large-piece-of-metal-16048819/"
          target="_blank"
          rel="noreferrer"
        >
          Source
        </a>
        <button
          type="button"
          onClick={togglePlayback}
          disabled={videoUnavailable}
          aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
        >
          <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span>
          {isPlaying ? 'Pause motion' : 'Play motion'}
        </button>
      </div>
    </>
  );
}

export default AmbientMedia;
