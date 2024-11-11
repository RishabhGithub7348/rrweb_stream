import { useEffect, useRef } from 'react';
import * as rrweb from 'rrweb';
import SocketService from '../lib/socketService';

const Recorder: React.FC = () => {
  const socket = SocketService.getInstance();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Initialize recording with rrweb's built-in canvas recording
    const stopRecord = rrweb.record({
      emit: (event) => {
        // rrweb automatically captures canvas data in the event
        // Canvas data will be in event.data for type 2 (canvas mutation)
        socket.emit('record-event', event);
      },
      recordAfter: "load",
      recordCrossOriginIframes: true,
      recordDOM: true,
      recordCanvas: true, // Enable built-in canvas recording
      sampling: {
        canvas: 100, // Capture canvas every 500ms (adjust as needed)
        mousemove: 50,
        scroll: 150,
      },
      // Use rrweb's built-in canvas mutation observer
      checkoutEveryNms: 10000, // Capture full snapshot every 10 seconds
      blockClass: 'no-record', // Add this class to elements you don't want to record
      // Canvas specific options
      slimDOMOptions: "all",
    });

    // Start broadcasting
    socket.emit('start-broadcasting');

    return () => {
      if (!stopRecord) return;
      stopRecord();
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

export default Recorder;