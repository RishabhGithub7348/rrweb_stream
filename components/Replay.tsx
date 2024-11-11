/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { eventWithTime } from '@rrweb/types';
import SocketService from '../lib/socketService';

const Viewer: React.FC = () => {
  const [isViewerConnected, setIsViewerConnected] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<eventWithTime[]>([]);
  const socket = SocketService.getInstance();

  useEffect(() => {
    // Initial event setup
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
      // Initialize player with optimized settings
      const player = new rrwebPlayer({
        target: containerRef.current,
        props: {
          events: eventsRef.current,
          width: window.innerWidth,
          height: window.innerHeight,
          autoPlay: true,
          speed: 1,
          showController: false,
          UNSAFE_replayCanvas: true,
          liveMode: true,
          mouseTail: {
            duration: 500,
            lineCap: 'round',
            lineWidth: 3,
            strokeStyle: '#ff5722'
          },
          // Optimize performance
          skipInactive: true,
          showWarning: false,
          triggerFocus: false,
        },
      });

      playerRef.current = player;

      // Handle batched events
      const handleEvents = (events: eventWithTime[]) => {
        if (!playerRef.current) return;

        events.forEach(event => {
          eventsRef.current.push({
            ...event,
            timestamp: Date.now(),
          });
          
          playerRef.current.getReplayer().addEvent({
            ...event,
            timestamp: Date.now(),
          });
        });
      };

      // Set up socket listeners
      socket.on('record-events', handleEvents);
      socket.emit('start-viewing');
      setIsViewerConnected(true);

      // Handle window resizing
      const handleResize = () => {
        if (playerRef.current) {
          playerRef.current.triggerResize();
        }
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);

      return () => {
        socket.off('record-events');
        resizeObserver.disconnect();
        if (playerRef.current) {
          playerRef.current.getReplayer().destroy();
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

export default Viewer