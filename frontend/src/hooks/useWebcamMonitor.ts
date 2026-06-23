import { useEffect, useRef, useState } from 'react';
import { incrementWarning } from '../services/examService';
import { useToast } from '../context/ToastContext';

interface UseWebcamMonitorProps {
  examId: string;
  active: boolean;
  onBlock: () => void;
  onWarning: (warningsCount: number) => void;
  getCurrentAnswers: () => { questionId: string; selectedAnswer: string }[];
}

export const useWebcamMonitor = ({
  examId,
  active,
  onBlock,
  onWarning,
  getCurrentAnswers,
}: UseWebcamMonitorProps) => {
  const toast = useToast();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRef = useRef(active);
  const answersRef = useRef(getCurrentAnswers);

  // Keep refs up to date to prevent closure capture issues
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    answersRef.current = getCurrentAnswers;
  }, [getCurrentAnswers]);

  // Request webcam access
  useEffect(() => {
    if (!active) {
      stopCamera();
      return;
    }

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false, // video only for proctoring
        });
        setStream(mediaStream);
        setCameraActive(true);
        setError(null);
      } catch (err: any) {
        console.error('Webcam access error:', err);
        setError('Camera access is mandatory for this exam. Please enable permissions.');
        toast.error('Proctoring Error: Camera access denied!');
        triggerViolation('cameraOff', 'high');
      }
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, [active]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  const triggerViolation = async (eventType: 'tabSwitch' | 'faceNotDetected' | 'multipleFaces' | 'cameraOff', severity: 'low' | 'medium' | 'high') => {
    if (!activeRef.current) return;

    try {
      const currentAnswers = answersRef.current();
      const res = await incrementWarning(examId, eventType, severity, currentAnswers);
      
      onWarning(res.warnings);

      if (res.blocked) {
        toast.error('EXAM BLOCKED: Too many proctoring violations!');
        onBlock();
      } else {
        toast.warning(res.message);
      }
    } catch (err: any) {
      console.error('Failed to log proctor violation:', err);
    }
  };

  // Monitor tab switches & focus
  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.warning('Warning: Tab switching is strictly prohibited!');
        triggerViolation('tabSwitch', 'high');
      }
    };

    const handleWindowBlur = () => {
      // Small timeout to ignore self-focus triggers
      setTimeout(() => {
        if (!document.hasFocus() && activeRef.current) {
          toast.warning('Warning: Maintain window focus during the exam!');
          triggerViolation('tabSwitch', 'medium');
        }
      }, 300);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [active, examId]);

  // Monitor Fullscreen exits
  useEffect(() => {
    if (!active) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        toast.warning('Warning: You exited fullscreen mode! This exam must be taken in fullscreen.');
        triggerViolation('tabSwitch', 'medium');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [active, examId]);

  // Monitor camera track status (if student disables webcam hardware)
  useEffect(() => {
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const handleTrackEnded = () => {
      toast.error('Warning: Proctor camera feed went offline!');
      setCameraActive(false);
      triggerViolation('cameraOff', 'high');
    };

    videoTrack.addEventListener('ended', handleTrackEnded);
    
    // Check state periodically
    const interval = setInterval(() => {
      if (activeRef.current && (!videoTrack.enabled || videoTrack.readyState === 'ended')) {
        toast.error('Warning: Proctor camera is disabled!');
        triggerViolation('cameraOff', 'high');
      }
    }, 5000);

    return () => {
      videoTrack.removeEventListener('ended', handleTrackEnded);
      clearInterval(interval);
    };
  }, [stream, active, examId]);

  return {
    stream,
    cameraActive,
    error,
    triggerMockFaceNotDetected: () => triggerViolation('faceNotDetected', 'low'),
    triggerMockMultipleFaces: () => triggerViolation('multipleFaces', 'medium'),
  };
};
