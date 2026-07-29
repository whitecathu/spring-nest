import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ChangeEvent as ReactChangeEvent,
} from 'react';
import gsap from 'gsap';
import {
  ArrowLeft,
  Camera,
  Download,
  RotateCcw,
  SunMedium,
  Contrast,
  Palette,
  Upload,
  FlipHorizontal,
  X,
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

type FilterPreset = 'none' | 'grayscale' | 'highContrast' | 'brighten';

interface FilterSettings {
  brightness: number;
  contrast: number;
  grayscale: number;
}

const PRESETS: Record<FilterPreset, FilterSettings> = {
  none: { brightness: 100, contrast: 100, grayscale: 0 },
  grayscale: { brightness: 100, contrast: 100, grayscale: 100 },
  highContrast: { brightness: 100, contrast: 150, grayscale: 0 },
  brighten: { brightness: 130, contrast: 110, grayscale: 0 },
};

export default function Scanner({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [activePreset, setActivePreset] = useState<FilterPreset>('none');
  const [customSettings, setCustomSettings] = useState<FilterSettings>({
    brightness: 100,
    contrast: 100,
    grayscale: 0,
  });
  const [showCustom, setShowCustom] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError('');

    if (!window.isSecureContext) {
      setCameraActive(false);
      setHasCamera(true);
      setCameraError(
        t(
          '浏览器要求在 HTTPS 或 localhost 环境下使用相机。你仍可上传图片进行扫描。',
          'Camera access requires HTTPS or localhost. You can still upload an image to scan.',
        ),
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraActive(false);
      setHasCamera(false);
      setCameraError(
        t(
          '当前浏览器不支持摄像头访问，请改用图片上传。',
          'This browser does not support camera access. Please upload an image instead.',
        ),
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setHasCamera(true);
    } catch (error) {
      stopCamera();
      const name = error instanceof DOMException ? error.name : '';
      const denied = name === 'NotAllowedError' || name === 'SecurityError';
      const missing = name === 'NotFoundError' || name === 'OverconstrainedError';
      const blocked = name === 'NotReadableError' || name === 'AbortError';

      setCameraActive(false);
      setHasCamera(!missing);
      if (denied) {
        setCameraError(
          t(
            '相机权限被拒绝或被权限策略拦截。请在浏览器地址栏允许相机，或上传图片继续。',
            'Camera permission was denied or blocked by policy. Allow camera access in the browser, or upload an image instead.',
          ),
        );
      } else if (missing) {
        setCameraError(
          t(
            '未检测到可用摄像头，请上传图片继续。',
            'No available camera was detected. Please upload an image instead.',
          ),
        );
      } else if (blocked) {
        setCameraError(
          t(
            '摄像头暂时无法打开，可能被其他应用占用。请关闭占用后重试，或上传图片继续。',
            'The camera could not be opened, possibly because another app is using it. Close that app and retry, or upload an image.',
          ),
        );
      } else {
        setCameraError(
          t(
            '无法访问相机。你可以重试，或上传图片继续。',
            'Cannot access the camera. You can retry or upload an image instead.',
          ),
        );
      }
    }
  }, [facingMode, stopCamera, t]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: ReactChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setActivePreset('none');
    setCustomSettings({ brightness: 100, contrast: 100, grayscale: 0 });
    setShowCustom(false);
    startCamera();
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  useEffect(() => {
    if (!capturedImage && hasCamera) {
      startCamera();
    }
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyPreset = (preset: FilterPreset) => {
    setActivePreset(preset);
    setCustomSettings(PRESETS[preset]);
  };

  const getFilterString = (): string => {
    const s = activePreset === 'none' && !showCustom ? PRESETS.none : customSettings;
    return `brightness(${s.brightness}%) contrast(${s.contrast}%) grayscale(${s.grayscale}%)`;
  };

  const handleDownload = () => {
    if (!capturedImage) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.filter = getFilterString();
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      const link = document.createElement('a');
      link.download = `scan-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = capturedImage;
  };

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button
        onClick={() => {
          stopCamera();
          onBack();
        }}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <div
        className="bg-surface-container-high rounded-3xl p-6 shadow-lg border border-surface-variant/30"
      >
        <h2 className="text-2xl font-bold text-on-surface text-center mb-2">
          {t('轻量扫描仪', 'Lite Scanner')}
        </h2>
        <p className="text-sm text-secondary text-center mb-6">
          {t(
            '拍摄或上传文档，调整滤镜后下载',
            'Capture or upload a document, adjust filters, and download',
          )}
        </p>

        <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden mb-4">
          {!capturedImage ? (
              <div
                key="camera"
                className="w-full h-full"
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-low">
                    {hasCamera ? (
                      <>
                        <Camera className="w-12 h-12 text-secondary/40 mb-3" />
                        <button
                          onClick={startCamera}
                          className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold text-sm"
                        >
                          {t('打开相机', 'Open Camera')}
                        </button>
                      </>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-secondary/40 mb-3" />
                        <p className="max-w-[260px] px-4 text-center text-sm leading-relaxed text-secondary mb-3">
                          {cameraError || t('无法访问相机', 'Cannot access camera')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            onClick={startCamera}
                            className="px-5 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold text-sm"
                          >
                            {t('重试相机', 'Retry Camera')}
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-5 py-3 bg-primary text-on-primary rounded-full font-semibold text-sm flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            {t('上传图片', 'Upload Image')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {cameraActive && (
                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                    <button
                      onClick={handleFlipCamera}
                      className="p-3 bg-black/40 backdrop-blur-sm text-white rounded-full hover:bg-black/60 transition-colors"
                      aria-label={t('翻转相机', 'Flip camera')}
                    >
                      <FlipHorizontal className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCapture}
                      className="w-16 h-16 bg-white rounded-full border-4 border-primary shadow-lg hover:scale-105 active:scale-95 transition-transform"
                      aria-label={t('拍照', 'Capture')}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-black/40 backdrop-blur-sm text-white rounded-full hover:bg-black/60 transition-colors"
                      aria-label={t('上传图片', 'Upload')}
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                key="preview"
                className="w-full h-full relative"
              >
                <img
                  src={capturedImage}
                  alt={t('扫描预览', 'Scan preview')}
                  className="w-full h-full object-contain transition-all duration-300"
                  style={{ filter: getFilterString() }}
                />
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setActivePreset('none');
                  }}
                  className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-sm text-white rounded-full hover:bg-black/60 transition-colors"
                  aria-label={t('关闭', 'Close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {capturedImage && (
          <div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {(['none', 'grayscale', 'highContrast', 'brighten'] as FilterPreset[]).map(
                (preset) => {
                  const labels: Record<FilterPreset, [string, string]> = {
                    none: ['原图', 'Original'],
                    grayscale: ['黑白', 'B&W'],
                    highContrast: ['高对比', 'Hi-Con'],
                    brighten: ['增亮', 'Brighten'],
                  };
                  const [zh, en] = labels[preset];
                  return (
                    <button
                      key={preset}
                      onClick={() => applyPreset(preset)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                        activePreset === preset && !showCustom
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
                      }`}
                    >
                      {t(zh, en)}
                    </button>
                  );
                },
              )}
              <button
                onClick={() => setShowCustom(!showCustom)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  showCustom
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
                }`}
              >
                {t('自定义', 'Custom')}
              </button>
            </div>

            {showCustom && (
              <div
                className="space-y-3 mb-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-secondary">
                      <SunMedium className="w-4 h-4" />
                      {t('亮度', 'Brightness')}
                    </label>
                    <span className="text-sm font-bold text-on-surface tabular-nums">
                      {customSettings.brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    value={customSettings.brightness}
                    onChange={(e) => {
                      setActivePreset('none');
                      setCustomSettings((s) => ({
                        ...s,
                        brightness: parseInt(e.target.value, 10),
                      }));
                    }}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-secondary">
                      <Contrast className="w-4 h-4" />
                      {t('对比度', 'Contrast')}
                    </label>
                    <span className="text-sm font-bold text-on-surface tabular-nums">
                      {customSettings.contrast}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    value={customSettings.contrast}
                    onChange={(e) => {
                      setActivePreset('none');
                      setCustomSettings((s) => ({
                        ...s,
                        contrast: parseInt(e.target.value, 10),
                      }));
                    }}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-secondary">
                      <Palette className="w-4 h-4" />
                      {t('灰度', 'Grayscale')}
                    </label>
                    <span className="text-sm font-bold text-on-surface tabular-nums">
                      {customSettings.grayscale}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={customSettings.grayscale}
                    onChange={(e) => {
                      setActivePreset('none');
                      setCustomSettings((s) => ({
                        ...s,
                        grayscale: parseInt(e.target.value, 10),
                      }));
                    }}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t('重拍', 'Retake')}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('下载 PNG', 'Download PNG')}
              </button>
            </div>
          </div>
        )}

        {!capturedImage && !cameraActive && hasCamera && (
          <div className="mt-2 flex flex-col gap-3">
            {cameraError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-600 dark:bg-red-900/20 dark:text-red-300">
                {cameraError}
              </p>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {t('上传图片', 'Upload Image')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
