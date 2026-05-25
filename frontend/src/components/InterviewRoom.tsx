import React, { useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useProctoring } from '../hooks/useProctoring';

const WS_URL = 'ws://localhost:8000/ws/interview';

export const InterviewRoom: React.FC = () => {
  const { videoRef, telemetry, isInitializing, error } = useProctoring();
  const lastSentTimeRef = useRef<number>(0);

  const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    onOpen: () => console.log('WebSocket connected'),
    onClose: () => console.log('WebSocket disconnected'),
  });

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Connected',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Disconnected',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  useEffect(() => {
    // Send telemetry to backend every 1 second
    if (telemetry && readyState === ReadyState.OPEN) {
      const now = Date.now();
      if (now - lastSentTimeRef.current >= 1000) {
        sendJsonMessage({
          type: 'telemetry',
          data: telemetry
        });
        lastSentTimeRef.current = now;
      }
    }
  }, [telemetry, readyState, sendJsonMessage]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-background text-foreground">
      {/* Central Content Area (Placeholder for AI Avatar/Chat) */}
      <div className="flex flex-col items-center justify-center max-w-2xl text-center space-y-6 px-4">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
           {/* Placeholder Icon for AI */}
           <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
           </svg>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">AI Interview in Progress</h1>
        <p className="text-muted-foreground text-lg">
          Please speak clearly and look directly at the camera. Our AI agent is listening.
        </p>

        {/* Debug UI for Development */}
        <div className="mt-8 p-4 rounded-xl border border-border bg-muted/30 w-full text-left text-sm font-mono flex flex-col space-y-2">
           <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Socket Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${readyState === ReadyState.OPEN ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {connectionStatus}
              </span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Proctoring:</span>
              <span className={error ? 'text-red-500' : isInitializing ? 'text-yellow-600' : 'text-green-600'}>
                {error ? 'Error' : isInitializing ? 'Initializing Models...' : 'Active'}
              </span>
           </div>
           {telemetry && !isInitializing && !error && (
             <div className="pt-2 border-t border-border mt-2 space-y-1 text-xs text-muted-foreground">
               <div className="flex justify-between"><span>Looking Away:</span> <span className={telemetry.isLookingAway ? 'text-red-500' : 'text-foreground'}>{telemetry.isLookingAway ? 'Yes' : 'No'}</span></div>
               <div className="flex justify-between"><span>Talking:</span> <span className="text-foreground">{telemetry.isTalking ? 'Yes' : 'No'}</span></div>
               <div className="flex justify-between"><span>Faces Detected:</span> <span className="text-foreground">{telemetry.faceCount}</span></div>
             </div>
           )}
        </div>
      </div>

      {/* Discrete Corner Video Element for Candidate Webcam */}
      <div className="absolute bottom-6 right-6 w-48 aspect-video bg-muted rounded-xl overflow-hidden shadow-elevated border border-border/50 ring-1 ring-black/5">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover transform scale-x-[-1]" 
          autoPlay 
          playsInline 
          muted 
        />
        {isInitializing && !error && (
           <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
             <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
           </div>
        )}
        {error && (
           <div className="absolute inset-0 flex items-center justify-center bg-background/90 px-2 text-center">
             <span className="text-xs text-red-500 font-medium">{error}</span>
           </div>
        )}
      </div>
    </div>
  );
};
