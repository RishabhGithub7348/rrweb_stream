import { useEffect, useRef, useState } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import type { eventWithTime } from '@rrweb/types';
import SocketService from '../lib/socketService';

// Custom styles for fullscreen player
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
    // Initial event to set up the viewer
    const initialEvent: eventWithTime = {
      type: 4, // Full snapshot
      data: {
        href: window.location.href,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timestamp: Date.now(),
    };

    eventsRef.current = [initialEvent];
    console.log(eventsRef.current)

    if (containerRef.current) {
      // Initialize the rrweb player
      const player = new rrwebPlayer({
        target: containerRef.current,
        props: {
          events: eventsRef.current,
          width: window.innerWidth,
          height: window.innerHeight,
          autoPlay: true,
          speed: 1,
          showController: false,
          UNSAFE_replayCanvas: true, // Enable canvas replay
          liveMode: true,
          mouseTail: true,
          showWarning: false
        },
      });

      playerRef.current = player;

      // Handle incoming events including canvas mutations
      socket.on('record-event', (event: eventWithTime) => {
        if (playerRef.current) {
          // Add the event to our event list
          eventsRef.current.push({
            ...event,
            timestamp: Date.now(),
          });
          
          // Add the event to the player
          // The player will automatically handle canvas mutations
          playerRef.current.getReplayer().addEvent({
            ...event,
            timestamp: Date.now(),
          });
        }
      });

      socket.emit('start-viewing');
      setIsViewerConnected(true);

      // Handle window resizing
      const handleResize = () => {
        if (playerRef.current) {
          playerRef.current.triggerResize();
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
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
  console.log(eventsRef.current)

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