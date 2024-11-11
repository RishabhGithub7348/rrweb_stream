/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import * as rrweb from 'rrweb';
import SocketService from '../lib/socketService';

const Recorder: React.FC = () => {
  const socket = SocketService.getInstance();
  const eventsBufferRef = useRef<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Buffer to batch events for better performance
    const flushEvents = () => {
      if (eventsBufferRef.current.length > 0) {
        socket.emit('record-events', eventsBufferRef.current);
        eventsBufferRef.current = [];
      }
    };

    // Periodically flush events
    const flushInterval = setInterval(flushEvents, 100);

    // Initialize recording with optimized canvas support
    const stopRecord = rrweb.record({
      emit: (event) => {
        // Add event to buffer
        eventsBufferRef.current.push(event);
        
        // If buffer gets too large, flush immediately
        if (eventsBufferRef.current.length >= 50) {
          flushEvents();
        }
      },
      recordCanvas: true,
      sampling: {
        canvas: 50, // Capture canvas every 50ms
        scroll: 150, // Reduce scroll event frequency
        media: 800, // Sample media less frequently
      },
      checkoutEveryNms: 10, // Check for updates every 10ms
      blockClass: 'no-record',
      inlineStylesheet: true,
      // Optimize data collection
      collectFonts: false, // Skip font collection
    });

    socket.emit('start-broadcasting');

    return () => {
      if(!stopRecord) return;

      stopRecord();
      clearInterval(flushInterval);
    };
  }, [socket]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
    <h2 className="text-xl font-bold mb-4">Broadcasting...</h2>
    <div className="mb-4">
      <video
        ref={videoRef}
        controls
        className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
        style={{ backgroundColor: '#000' }}
      >
        <source
          src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
    <p className="text-gray-600">
      Your screen is being recorded and broadcasted to viewers
    </p>
  </div>
  );
};

export default Recorder