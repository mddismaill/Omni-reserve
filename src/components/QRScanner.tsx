import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, X, RefreshCw, AlertTriangle, CheckCircle2, Play, Square } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function QRScanner({ isOpen, onClose, onScanSuccess }: QRScannerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Check and start camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    setScanning(true);
    setCameraPermissionStatus('checking');

    try {
      // Stop any existing streams first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      streamRef.current = stream;
      setCameraPermissionStatus('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required for iOS
        videoRef.current.play();
      }

      // Start the decoding loop
      animationFrameIdRef.current = requestAnimationFrame(scanLoop);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraPermissionStatus('denied');
      setError(t("qr.cameraError"));
      setScanning(false);
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) {
      animationFrameIdRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });

      if (code && code.data) {
        // Successfully scanned!
        onScanSuccess(code.data);
        stopCamera();
        return;
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(scanLoop);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-xs"
      />

      {/* Main Modal container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#16191F] border border-white/10 rounded-3xl p-6 max-w-md w-full relative z-10 shadow-2xl overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4 relative">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white">{t("qr.title")}</h4>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">{t("qr.subtitle")}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="space-y-4 relative">
          {/* Camera Viewfinder container */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#090A0D] border border-white/5 flex items-center justify-center">
            {scanning && (
              <video 
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                muted
                playsInline
              />
            )}
            
            {/* Hidden canvas for decoding frames */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Target scanner overlay box */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-teal-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  {/* Corner brackets decoration */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-teal-400 -mt-0.5 -ml-0.5 rounded-tl-sm" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-teal-400 -mt-0.5 -mr-0.5 rounded-tr-sm" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-teal-400 -mb-0.5 -ml-0.5 rounded-bl-sm" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-teal-400 -mb-0.5 -mr-0.5 rounded-br-sm" />
                  
                  {/* Laser line animation */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-teal-400/80 shadow-[0_0_8px_2px_rgba(20,184,166,0.5)] animate-scan-line" />
                </div>
              </div>
            )}

            {/* State overlays (Errors, Loading, Permission) */}
            {cameraPermissionStatus === 'checking' && (
              <div className="text-center p-4 space-y-2 z-10">
                <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
                <p className="text-xs text-white/70">{t("qr.initializing")}</p>
              </div>
            )}

            {error && (
              <div className="text-center p-6 space-y-3 z-10 max-w-xs">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto animate-bounce" />
                <p className="text-xs text-white/80 leading-relaxed font-semibold">{error}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  {t("common.retry")}
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-white/50 leading-relaxed max-w-xs mx-auto">
            {t("qr.hint")}
          </p>

          <div className="flex gap-2 justify-center pt-2">
            {scanning ? (
              <button
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition border border-red-500/20 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> {t("qr.stop")}
              </button>
            ) : (
              !error && (
                <button
                  onClick={startCamera}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition border border-teal-500/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> {t("qr.start")}
                </button>
              )
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
