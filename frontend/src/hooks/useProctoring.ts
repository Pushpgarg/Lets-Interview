import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface TelemetryData {
  faceCount: number;
  isLookingAway: boolean;
  isTalking: boolean;
  timestamp: number;
}

export function useProctoring() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const initMediaPipe = useCallback(async () => {
    try {
      // Use CDN to load WASM files strictly as requested
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: false,
        runningMode: "VIDEO",
        numFaces: 1
      });
      
    } catch (err) {
      console.error("Failed to initialize MediaPipe Face Landmarker:", err);
      setError("Failed to load computer vision models.");
    }
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false // Audio proctoring would be separate or handled by the main interview voice stream
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', () => setIsInitializing(false));
      }
    } catch (err) {
      console.error("Failed to access webcam:", err);
      setError("Camera access denied or unavailable.");
      setIsInitializing(false);
    }
  }, []);

  const processVideoFrame = useCallback(() => {
    if (!videoRef.current || !faceLandmarkerRef.current) return;
    
    const video = videoRef.current;
    
    // Only process if video is playing and we have a new frame
    if (video.currentTime !== lastVideoTimeRef.current && video.readyState >= 2) {
      lastVideoTimeRef.current = video.currentTime;
      
      const startTimeMs = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
      
      let faceCount = 0;
      let isLookingAway = true;
      let isTalking = false;

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        faceCount = results.faceLandmarks.length;
        isLookingAway = false; // Simple heuristic: face is detected
        
        // Estimate "isTalking" based on distance between upper and lower inner lips
        const landmarks = results.faceLandmarks[0];
        if (landmarks && landmarks.length > 14) {
           const upperLip = landmarks[13];
           const lowerLip = landmarks[14];
           if (upperLip && lowerLip) {
             const dy = lowerLip.y - upperLip.y;
             const dx = lowerLip.x - upperLip.x;
             const distance = Math.sqrt(dx * dx + dy * dy);
             // A threshold to determine if mouth is open significantly
             isTalking = distance > 0.02;
           }
        }
      }

      setTelemetry({
        faceCount,
        isLookingAway,
        isTalking,
        timestamp: Date.now()
      });
    }
    
    animationFrameRef.current = requestAnimationFrame(processVideoFrame);
  }, []);

  useEffect(() => {
    const setup = async () => {
      await initMediaPipe();
      await startWebcam();
    };
    setup();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initMediaPipe, startWebcam]);

  // Start processing loop once initialized
  useEffect(() => {
    if (!isInitializing && !error) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrame);
    }
  }, [isInitializing, error, processVideoFrame]);

  return {
    videoRef,
    telemetry,
    isInitializing,
    error
  };
}
