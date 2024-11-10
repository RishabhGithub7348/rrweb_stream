/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import * as rrweb from 'rrweb'; // Importing rrweb as a namespace
import { RRWebPluginCanvasWebRTCRecord } from '@rrweb/rrweb-plugin-canvas-webrtc-record';
import SocketService from '../lib/socketService';

const Recorder: React.FC = () => {
  const webRTCRecordPluginRef = useRef<any>(null);
  const socket = SocketService.getInstance();
  const videoRef = useRef<HTMLVideoElement>(null);


  useEffect(() => {
    // Handle incoming canvas IDs from viewers
    socket.on('canvas-id', (canvasId: string) => {
      if (webRTCRecordPluginRef.current) {
        webRTCRecordPluginRef.current.setupStream(canvasId);
      }
    });

    // Handle incoming WebRTC signals from viewers
    socket.on('viewer-signal', (signal: any) => {
      if (webRTCRecordPluginRef.current) {
        webRTCRecordPluginRef.current.signalReceive(signal);
      }
    });

    // Initialize recording
    const webRTCRecordPlugin = new RRWebPluginCanvasWebRTCRecord({
      signalSendCallback: (msg: any) => {
        socket.emit('broadcaster-signal', msg);
      },
    });

    webRTCRecordPluginRef.current = webRTCRecordPlugin;

    const stopRecord = rrweb.record({
      emit: (event) => {
        socket.emit('record-event', event);
      },
      plugins: [webRTCRecordPlugin.initPlugin()],
      recordCanvas: false,
    });

    // Notify server that we're starting to broadcast
    socket.emit('start-broadcasting');

    return () => {
      if(!stopRecord) return;
      stopRecord();
      socket.off('canvas-id');
      socket.off('viewer-signal');
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
