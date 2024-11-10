/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { eventWithTime } from '@rrweb/types';
import { RRWebPluginCanvasWebRTCReplay } from '@rrweb/rrweb-plugin-canvas-webrtc-replay';
import SocketService from '../lib/socketService';

// Add custom styles to hide controller and make player fullscreen
const styles = `
  .rr-player {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .rr-player__frame {
    width: 100% !important;
    height: 100% !important;
  }
  .rr-controller {
    display: none !important;
  }
`;

const Viewer: React.FC = () => {
  const [isViewerConnected, setIsViewerConnected] = useState(false);
  const playerRef = useRef<any>(null);
  const webRTCReplayPluginRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<eventWithTime[]>([]);

  useEffect(() => {
    // Add custom styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const socket = SocketService.getInstance();

  useEffect(() => {
    socket.on('broadcaster-signal', (signal: any) => {
      if (webRTCReplayPluginRef.current) {
        webRTCReplayPluginRef.current.signalReceive(signal);
      }
    });

    const webRTCReplayPlugin = new RRWebPluginCanvasWebRTCReplay({
      canvasFoundCallback: (canvas: HTMLCanvasElement, context: any) => {
        socket.emit('canvas-id', context.id);
      },
      signalSendCallback: (signal: any) => {
        socket.emit('viewer-signal', signal);
      },
    });

    webRTCReplayPluginRef.current = webRTCReplayPlugin;

    const initialEvent: eventWithTime = {
      type: 4,
      data: {
        href: window.location.href,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timestamp: Date.now(),
    };

    eventsRef.current = [initialEvent];

    if (containerRef.current) {
      const player = new rrwebPlayer({
        target: containerRef.current,
        props: {
          events: eventsRef.current,
          width: window.innerWidth,
          height: window.innerHeight,
          autoPlay: true,
          speed: 1,
          showController: false,
          plugins: [webRTCReplayPlugin.initPlugin()],
          UNSAFE_replayCanvas: true,
          liveMode: true,
          mouseTail: true,
          showWarning: false,
        },
      });

      playerRef.current = player;

      const eventHandler = (event: eventWithTime) => {
        if (playerRef.current) {
          eventsRef.current.push({
            ...event,
            timestamp: Date.now(),
          });
          
          playerRef.current.getReplayer().addEvent({
            ...event,
            timestamp: Date.now(),
          });
        }
      };

      socket.on('record-event', eventHandler);
      socket.emit('start-viewing');
      setIsViewerConnected(true);

      const handleResize = () => {
        if (playerRef.current) {
          playerRef.current.triggerResize();
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        socket.off('broadcaster-signal');
        socket.off('record-event');
        window.removeEventListener('resize', handleResize);
        if (playerRef.current) {
          const replayer = playerRef.current.getReplayer();
          if (replayer) {
            replayer.destroy();
          }
        }
        setIsViewerConnected(false);
      };
    }
  }, [socket]);

  return (
    <div ref={containerRef} className="fixed inset-0">
      {!isViewerConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="text-white text-xl">Connecting...</div>
        </div>
      )}
    </div>
  );
};

export default Viewer;