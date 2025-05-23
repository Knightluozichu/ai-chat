import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Image, 
  Crop, 
  Filter, 
  Type, 
  RotateCcw,
  RotateCw,
  Shuffle,
  Download,
  X,
  Maximize,
  ArrowLeftRight,
  SlidersHorizontal,
  Eraser,
  ChevronDown,
  Loader,
  Zap,
  UploadCloud,
  Eye,
  Check,
  Wand2,
  Dice1 as Dice,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  ArrowLeft,
  FileText,
  PenTool,
  Folder,
  Files
} from 'lucide-react';
import JSZip from 'jszip';
import ItemDescription from './ItemDescription';

interface ImageEditorProps {
  onClose: () => void;
}

type FilterType = 'normal' | 'vintage' | 'film' | 'blackwhite' | 'fresh' | 'dark' | 'grayscale' | 'sepia' | 'cool' | 'warm' | 'polaroid' | 'blackAndWhite' | 'cinema' | 'duotone' | 'kodachrome' | 'technicolor';
type RandomParamType = 'crop' | 'filter' | 'rotate' | 'brightness' | 'contrast' | 'saturation' | 'vignette' | 'grain' | 'sharpen';

interface ImageParams {
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  filter: {
    type: FilterType;
    intensity: number;
  };
  rotate: number;
  brightness: number;
  contrast: number;
  saturation: number;
  vignette: {
    radius: number;
    opacity: number;
  };
  grain: number;
  sharpen: number;
  chromaAberration: number;
  highlights: {
    hue: number;
    saturation: number;
  };
  shadows: {
    hue: number;
    saturation: number;
  };
}

interface BatchProcessingStatus {
  total: number;
  processed: number;
  currentFile: string;
  isProcessing: boolean;
}

// 随机参数生成辅助函数
const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const getRandomFilter = (): FilterType => {
  const filters: FilterType[] = ['vintage', 'film', 'blackwhite', 'fresh', 'dark'];
  return filters[Math.floor(Math.random() * filters.length)];
};

// 修改随机参数生成函数，确保符合需求规格
const generateRandomParams = (
  originalWidth: number, 
  originalHeight: number, 
  paramTypes?: RandomParamType[]
): Partial<ImageParams> => {
  const params: Partial<ImageParams> = {};
  
  const allParams: RandomParamType[] = paramTypes || [
    'crop', 'filter', 'rotate', 'brightness', 'contrast', 
    'saturation', 'vignette', 'grain', 'sharpen'
  ];
  
  // 如果不指定参数类型，随机选择2-4个参数类型
  const selectedParams: RandomParamType[] = [];
  
  if (!paramTypes) {
    const numParams = Math.floor(Math.random() * 3) + 2; // 2-4个参数
    const shuffledParams = [...allParams].sort(() => Math.random() - 0.5);
    selectedParams.push(...shuffledParams.slice(0, numParams));
  } else {
    selectedParams.push(...paramTypes);
  }
  
  // 依次生成每个参数的随机值
  selectedParams.forEach(param => {
    switch (param) {
      case 'crop':
        // 保留原图80%-95%区域
        const scale = randomInRange(0.8, 0.95);
        const newWidth = originalWidth * scale;
        const newHeight = originalHeight * scale;
        // 位置偏移不超过5%
        const maxOffsetX = Math.min(10, (originalWidth - newWidth) * 0.5);
        const maxOffsetY = Math.min(10, (originalHeight - newHeight) * 0.5);
        const offsetX = randomInRange(-maxOffsetX, maxOffsetX);
        const offsetY = randomInRange(-maxOffsetY, maxOffsetY);
        
        params.crop = {
          x: (originalWidth - newWidth) / 2 + offsetX,
          y: (originalHeight - newHeight) / 2 + offsetY,
          width: newWidth,
          height: newHeight,
        };
        break;
        
      case 'filter':
        params.filter = {
          type: getRandomFilter(),
          intensity: randomInRange(0.5, 0.8) // 50%-80%强度
        };
        break;
        
      case 'rotate':
        // 微小角度旋转 (-3° 到 3°)
        params.rotate = randomInRange(-3, 3);
        break;
        
      case 'brightness':
        // 亮度在 -15 到 15 范围内
        params.brightness = randomInRange(-15, 15);
        break;
        
      case 'contrast':
        // 对比度在 -10 到 15 范围内
        params.contrast = randomInRange(-10, 15);
        break;
        
      case 'saturation':
        // 饱和度在 -0.3 到 0.5 范围内
        params.saturation = randomInRange(-0.3, 0.5);
        break;
        
      case 'vignette':
        params.vignette = {
          radius: randomInRange(10, 50),  // 10-50 半径
          opacity: randomInRange(0.1, 0.3) // 10%-30%不透明度
        };
        break;
        
      case 'grain':
        params.grain = randomInRange(0.05, 0.2); // 5%-20%强度
        break;
        
      case 'sharpen':
        params.sharpen = randomInRange(0.05, 0.3); // 降低锐化强度范围为5%-30%
        break;
    }
  });
  
  return params;
};

// 使用Canvas处理图像的核心函数
const processImageWithCanvas = async (
  img: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
  filter: string,
  params: {
    brightness: number;
    contrast: number;
    saturation: number;
    rotate: number;
    vignette: { opacity: number; spread: number };
    grain: number;
    sharpen: number;
  }
): Promise<string> => {
  return new Promise((resolve) => {
    // 创建Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // 计算裁剪区域
    const cropX = img.width * crop.x;
    const cropY = img.height * crop.y;
    const cropWidth = img.width * crop.width;
    const cropHeight = img.height * crop.height;
    
    // 设置Canvas大小
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    // 应用旋转
    if (params.rotate !== 0) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((params.rotate * Math.PI) / 180);
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height
      );
      ctx.restore();
    } else {
      // 绘制裁剪后的图像
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, canvas.width, canvas.height
      );
    }
    
    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 应用亮度、对比度和饱和度
    for (let i = 0; i < data.length; i += 4) {
      // 获取RGB值
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // 亮度调整
      if (params.brightness !== 0) {
        r += 255 * params.brightness;
        g += 255 * params.brightness;
        b += 255 * params.brightness;
      }
      
      // 对比度调整
      if (params.contrast !== 0) {
        const factor = (259 * (params.contrast + 1)) / (255 * (1 - params.contrast));
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
      }
      
      // 应用饱和度
      if (params.saturation !== 0) {
        const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
        const factor = 1 + params.saturation;  // 直接使用饱和度参数作为因子
        r = Math.min(255, Math.max(0, gray + factor * (r - gray)));
        g = Math.min(255, Math.max(0, gray + factor * (g - gray)));
        b = Math.min(255, Math.max(0, gray + factor * (b - gray)));
      }
      
      // 应用滤镜
      switch (filter) {
        case "grayscale":
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = gray;
          break;
        case "sepia":
          const tr = 0.393 * r + 0.769 * g + 0.189 * b;
          const tg = 0.349 * r + 0.686 * g + 0.168 * b;
          const tb = 0.272 * r + 0.534 * g + 0.131 * b;
          r = tr;
          g = tg;
          b = tb;
          break;
        case "vintage":
          r = r * 0.9 + 25;
          g = g * 0.8 + 20;
          b = b * 0.6 + 10;
          break;
        case "cool":
          r = r * 0.8;
          g = g * 0.9;
          b = b * 1.2;
          break;
        case "warm":
          r = r * 1.1;
          g = g * 0.9;
          b = b * 0.8;
          break;
        default:
          break;
      }
      
      // 限制RGB值在0-255范围内
      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }
    
    // 将处理后的图像数据绘制到Canvas上
    ctx.putImageData(imageData, 0, 0);
    
    // 锐化处理
    if (params.sharpen > 0) {
      // 创建临时画布用于锐化处理
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      
      // 绘制原始图像到临时画布
      tempCtx.drawImage(canvas, 0, 0);
      
      // 应用锐化效果
      ctx.globalAlpha = 1;
      ctx.drawImage(canvas, 0, 0);
      
      // 使用不同的混合模式和适当的透明度来实现锐化效果
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = params.sharpen * 0.5; // 降低锐化强度，避免过度锐化导致图片变黑
      ctx.drawImage(canvas, 0, 0);
      
      // 恢复默认设置
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    
    // 应用晕影效果
    if (params.vignette.opacity > 0) {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, 
        Math.max(canvas.width, canvas.height) * params.vignette.spread
      );
      
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${params.vignette.opacity})`);
      
      ctx.fillStyle = gradient;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
    
    // 应用颗粒感
    if (params.grain > 0) {
      const grainCanvas = document.createElement('canvas');
      grainCanvas.width = canvas.width;
      grainCanvas.height = canvas.height;
      const grainCtx = grainCanvas.getContext('2d')!;
      
      // 生成噪点
      const grainData = grainCtx.createImageData(canvas.width, canvas.height);
      const gData = grainData.data;
      
      for (let i = 0; i < gData.length; i += 4) {
        const noise = Math.random() * 50 - 25;
        gData[i] = gData[i + 1] = gData[i + 2] = noise;
        gData[i + 3] = 255;
      }
      
      grainCtx.putImageData(grainData, 0, 0);
      
      // 应用噪点
      ctx.globalAlpha = params.grain;
      ctx.globalCompositeOperation = 'overlay';
      ctx.drawImage(grainCanvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    
    // 输出处理后的图像
    resolve(canvas.toDataURL('image/png'));
  });
};

const ImageEditor = ({ onClose }: ImageEditorProps) => {
  const [image, setImage] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<string>('');
  const [activeTool, setActiveTool] = useState<'image' | 'description'>('image');
  const [brushSize, setBrushSize] = useState(10);
  const [showComparison, setShowComparison] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [appliedParams, setAppliedParams] = useState<string[]>([]);
  const [changedParam, setChangedParam] = useState<string | null>(null);
  const [navCollapsed, setNavCollapsed] = useState(false); // 导航栏收缩状态
  const [isClosing, setIsClosing] = useState(false); // 关闭动画状态
  const [deepseekApiKey, setDeepseekApiKey] = useState<string>(''); // DeepSeek API Key
  const [isDragging, setIsDragging] = useState(false); // 添加拖拽状态
  
  // 初始化时确保所有属性都有默认值
  const [imageParams, setImageParams] = useState<ImageParams>({
    crop: { x: 0, y: 0, width: 0, height: 0 },
    filter: { type: 'normal', intensity: 0 },
    rotate: 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    vignette: { radius: 0, opacity: 0 },
    grain: 0,
    sharpen: 0,
    chromaAberration: 0,
    highlights: { hue: 0, saturation: 0 },
    shadows: { hue: 0, saturation: 0 }
  });
  
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  
  // 修复下拉菜单的点击外部关闭逻辑
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 批量处理相关状态
  const [batchMode, setBatchMode] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchStatus, setBatchStatus] = useState<BatchProcessingStatus>({
    total: 0,
    processed: 0,
    currentFile: '',
    isProcessing: false
  });
  const [processedImages, setProcessedImages] = useState<{ [key: string]: string }>({});

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (files.length > 1) {
      // 批量模式
      setBatchMode(true);
      setBatchFiles(Array.from(files));
      setBatchStatus({
        total: files.length,
        processed: 0,
        currentFile: '',
        isProcessing: false
      });
    } else {
      // 单文件模式
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImage(dataUrl);
        loadImageSize(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadImageSize = (src: string) => {
    const img = new window.Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      // 初始化裁剪参数为全图
      setImageParams(prev => ({
        ...prev,
        crop: { x: 0, y: 0, width: img.width, height: img.height }
      }));
      originalImageRef.current = img;
    };
    img.src = src;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // 获取所有拖拽的文件
    const items = e.dataTransfer.items;
    const files: File[] = [];
    
    // 递归获取文件夹中的所有文件
    const traverseFileTree = async (item: any, path: string = '') => {
      return new Promise<void>((resolve) => {
        if (item.isFile) {
          item.file((file: File) => {
            if (file.type.startsWith('image/')) {
              files.push(file);
            }
            resolve();
          });
        } else if (item.isDirectory) {
          const dirReader = item.createReader();
          dirReader.readEntries((entries: any[]) => {
            const promises = entries.map(entry => 
              traverseFileTree(entry, path + item.name + '/')
            );
            Promise.all(promises).then(() => resolve());
          });
        }
      });
    };
    
    const processItems = async () => {
      const promises = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
          promises.push(traverseFileTree(item));
        }
      }
      
      await Promise.all(promises);
      
      if (files.length > 0) {
        if (files.length === 1) {
          // 单文件模式
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setImage(dataUrl);
            loadImageSize(dataUrl);
          };
          reader.readAsDataURL(files[0]);
        } else {
          // 批量模式
          setBatchMode(true);
          setBatchFiles(files);
          setBatchStatus({
            total: files.length,
            processed: 0,
            currentFile: '',
            isProcessing: false
          });
        }
      }
    };
    
    processItems();
  };

  // 添加下载功能
  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `processed_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 进度模拟函数 - 取代processImage中的进度模拟部分
  const simulateProgress = () => {
    setProcessingProgress(0);
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 100);
    
    return () => clearInterval(interval);
  };
  
  // 处理参数变更的函数
  const handleParamChange = (param: string, value: number) => {
    setImageParams(prev => {
      const newParams = { ...prev };
      
      // 处理嵌套对象属性
      if (param.includes('.')) {
        const [parent, child] = param.split('.');
        if (parent === 'vignette') {
          newParams.vignette = {
            ...newParams.vignette,
            [child]: value
          };
        }
      } else {
        // 安全地设置属性
        switch(param) {
          case 'brightness':
            newParams.brightness = value;
            break;
          case 'contrast':
            newParams.contrast = value;
            break;
          case 'saturation':
            newParams.saturation = value;
            break;
          case 'rotate':
            newParams.rotate = value;
            break;
          case 'grain':
            newParams.grain = value;
            break;
          case 'sharpen':
            newParams.sharpen = value;
            break;
          default:
            break;
        }
      }
      
      // 高亮显示变更的参数
      setChangedParam(param);
      setTimeout(() => setChangedParam(null), 1000);
      
      return newParams;
    });
  };

  // 处理滤镜变更
  const handleFilterChange = (filterType: string) => {
    setImageParams(prev => ({
      ...prev,
      filter: {
        ...prev.filter,
        type: filterType as FilterType
      }
    }));
  };

  // 处理图像函数 - 应用当前参数
  const processImage = async () => {
    if (!image || isProcessing) return;
    
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // 启动进度模拟
      simulateProgress();
      
      // 创建一个Image对象用于获取图像尺寸
      const img = new window.Image();
      img.src = image;
      
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      // 更新裁剪信息
      setImageParams(prev => ({
        ...prev,
        crop: {
          x: 0,
          y: 0,
          width: 1,
          height: 1
        }
      }));
      
      // 收集应用的参数
      const appliedParamsList: string[] = [];
      
      if (imageParams.brightness !== 0) appliedParamsList.push('亮度');
      if (imageParams.contrast !== 0) appliedParamsList.push('对比度');
      if (imageParams.saturation !== 0) appliedParamsList.push('饱和度');
      if (imageParams.rotate !== 0) appliedParamsList.push('旋转');
      if (imageParams.vignette.opacity > 0) appliedParamsList.push('晕影');
      if (imageParams.grain > 0) appliedParamsList.push('颗粒感');
      if (imageParams.sharpen > 0) appliedParamsList.push('锐化');
      if (imageParams.filter.type !== 'normal') appliedParamsList.push('滤镜');
      
      // 处理图像
      const result = await processImageWithCanvas(
        img,
        { x: 0, y: 0, width: 1, height: 1 },
        imageParams.filter.type,
        {
          brightness: imageParams.brightness / 255,
          contrast: imageParams.contrast / 100,
          saturation: imageParams.saturation / 100,
          rotate: imageParams.rotate,
          vignette: {
            opacity: imageParams.vignette.opacity,
            spread: imageParams.vignette.radius || 0.5
          },
          grain: imageParams.grain / 100,
          sharpen: imageParams.sharpen / 100
        }
      );
      
      // 更新处理后的图像
      setProcessedImage(result);
      setAppliedParams(appliedParamsList);
      
      // 停止进度模拟
      setProcessingProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
      }, 300);
      
    } catch (error) {
      console.error("处理图像时出错:", error);
      setErrorMessage("图像处理失败，请重试");
      setIsProcessing(false);
    }
  };
  
  // 一键去重处理
  const handleOneClickRemoval = async () => {
    if (!image || isProcessing) return;
    
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // 启动进度模拟
      simulateProgress();
      
      // 创建一个Image对象用于获取图像尺寸
      const img = new window.Image();
      img.src = image;
      
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      // 生成随机参数
      const randomParams = generateRandomParams(img.width, img.height);
      
      // 更新状态，设置随机生成的参数
      setImageParams(prev => ({
        ...prev,
        brightness: randomParams.brightness || 0,
        contrast: randomParams.contrast || 0,
        saturation: randomParams.saturation || 0,
        rotate: randomParams.rotate || 0,
        vignette: randomParams.vignette || prev.vignette,
        grain: randomParams.grain || 0,
        sharpen: randomParams.sharpen || 0,
        filter: randomParams.filter || prev.filter,
        crop: randomParams.crop || prev.crop
      }));
      
      // 使用随机参数应用到图像
      const result = await processImageWithCanvas(
        img,
        {
          x: (randomParams.crop?.x || 0) / img.width,
          y: (randomParams.crop?.y || 0) / img.height,
          width: (randomParams.crop?.width || img.width) / img.width,
          height: (randomParams.crop?.height || img.height) / img.height
        },
        randomParams.filter?.type || 'normal',
        {
          brightness: (randomParams.brightness || 0) / 255,
          contrast: (randomParams.contrast || 0) / 100,
          saturation: (randomParams.saturation || 0) / 100,
          rotate: randomParams.rotate || 0,
          vignette: {
            opacity: randomParams.vignette?.opacity || 0,
            spread: (randomParams.vignette?.radius || 0) / 100
          },
          grain: (randomParams.grain || 0) / 100,
          sharpen: (randomParams.sharpen || 0) / 100
        }
      );
      
      // 收集已应用的参数名称
      const applied = [];
      if (randomParams.brightness) applied.push("亮度");
      if (randomParams.contrast) applied.push("对比度");
      if (randomParams.saturation) applied.push("饱和度");
      if (randomParams.rotate) applied.push("旋转");
      if (randomParams.vignette?.opacity) applied.push("晕影");
      if (randomParams.grain) applied.push("颗粒感");
      if (randomParams.sharpen) applied.push("锐化");
      if (randomParams.filter?.type !== 'normal') applied.push("滤镜");
      if (randomParams.crop) applied.push("裁剪");
      
      // 更新处理后的图像
      setProcessedImage(result);
      setAppliedParams(applied);
      
      // 停止进度模拟
      setProcessingProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setShowComparison(true); // 直接显示对比结果
      }, 500);
      
    } catch (error) {
      console.error("一键去重处理出错:", error);
      setErrorMessage("图像处理失败，请重试");
      setIsProcessing(false);
    }
  };
  
  // 随机单参数处理
  const handleRandomizeParam = async (paramType: string) => {
    if (!image || isProcessing) return;
    
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // 创建一个Image对象用于获取图像尺寸
      const img = new window.Image();
      img.src = image;
      
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      
      // 生成特定参数的随机值
      const randomParams = generateRandomParams(img.width, img.height, [paramType as RandomParamType]);
      
      // 更新指定参数
      setImageParams(prev => {
        const newParams = { ...prev };
        
        switch (paramType) {
          case 'brightness':
            newParams.brightness = randomParams.brightness || 0;
            break;
          case 'contrast':
            newParams.contrast = randomParams.contrast || 0;
            break;
          case 'saturation':
            newParams.saturation = randomParams.saturation || 0;
            break;
          case 'rotate':
            newParams.rotate = randomParams.rotate || 0;
            break;
          case 'vignette':
            newParams.vignette = randomParams.vignette || prev.vignette;
            break;
          case 'grain':
            newParams.grain = randomParams.grain || 0;
            break;
          case 'sharpen':
            newParams.sharpen = randomParams.sharpen || 0;
            break;
          case 'filter':
            newParams.filter = randomParams.filter || prev.filter;
            break;
        }
        
        return newParams;
      });
      
      // 高亮显示已更改的参数
      setChangedParam(paramType);
      
      // 使用动画提示用户参数已更改
      const paramElement = document.getElementById(`param-${paramType}`);
      if (paramElement) {
        paramElement.classList.add('param-changed');
        setTimeout(() => {
          paramElement.classList.remove('param-changed');
        }, 1000);
      }
      
      // 延迟重置处理状态，让用户有时间看到变化
      setTimeout(() => {
        setChangedParam(null);
        setIsProcessing(false);
      }, 800);
      
    } catch (error) {
      console.error("随机参数生成出错:", error);
      setErrorMessage("参数生成失败，请重试");
      setIsProcessing(false);
    }
  };
  
  // 查看效果功能
  const handleViewEffect = () => {
    if (!processedImage) {
      setErrorMessage("请先应用参数或进行一键去重处理");
      return;
    }
    
    setShowComparison(true);
  };

  // 安全地显示参数信息
  const safeParamDisplay = useMemo(() => {
    return {
      cropWidth: imageParams.crop?.width || 0,
      filterType: imageParams.filter?.type || 'normal',
      rotate: imageParams.rotate || 0,
      vignetteOpacity: imageParams.vignette?.opacity || 0,
      grain: imageParams.grain || 0
    };
  }, [imageParams]);

  // 确保在文档加载或点击其他地方时关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDropdown && 
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // 添加样式
  useEffect(() => {
    // 添加样式到页面
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .param-slider {
        -webkit-appearance: none;
        width: 100%;
        height: 4px;
        border-radius: 4px;
        background: #e2e8f0;
        outline: none;
      }
      
      .dark .param-slider {
        background: #4b5563;
      }
      
      .param-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .param-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
      }
      
      .param-changed {
        animation: highlight 1s;
      }
      
      @keyframes highlight {
        0% { background-color: rgba(59, 130, 246, 0.2); }
        100% { background-color: transparent; }
      }
    `;
    document.head.appendChild(styleElement);
    
    // 清理函数
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // 渲染导航栏
  const renderNavigation = () => {
    return (
      <div 
        className={`h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex-shrink-0 ${
          navCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="relative p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          {!navCollapsed && (
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">图像工具</h2>
          )}
          <button
            onClick={() => setNavCollapsed(!navCollapsed)}
            className={`p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 ${
              navCollapsed ? 'mx-auto' : 'ml-auto'
            }`}
            title={navCollapsed ? "展开导航" : "收起导航"}
            aria-label={navCollapsed ? "展开导航" : "收起导航"}
          >
            {navCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="py-4">
          <ul>
            <li className="mb-1 px-2">
              <button
                type="button"
                onClick={() => setActiveTool('image')}
                className={`w-full flex items-center px-4 py-3 rounded-md ${
                  navCollapsed ? 'justify-center' : 'justify-start'
                } hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  activeTool === 'image' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                title="图片去重做二创"
              >
                <Image className="w-5 h-5" />
                {!navCollapsed && <span className="ml-3 text-sm font-medium">图片去重做二创</span>}
              </button>
            </li>
            <li className="px-2">
              <button
                type="button"
                onClick={() => setActiveTool('description')}
                className={`w-full flex items-center px-4 py-3 rounded-md ${
                  navCollapsed ? 'justify-center' : 'justify-start'
                } hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  activeTool === 'description' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                title="闲鱼文案"
              >
                <PenTool className="w-5 h-5" />
                {!navCollapsed && <span className="ml-3 text-sm font-medium">闲鱼文案</span>}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  // 渲染右侧顶部工具栏
  const renderTopBar = () => {
    return (
      <div className="h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button
            onClick={handleClose}
            className="mr-4 p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            aria-label="返回"
            title="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {activeTool === 'image' ? '图片去重做二创' : '闲鱼文案'}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            aria-label="帮助文档"
            title="帮助文档"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            aria-label="设置"
            title="设置"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            aria-label="关闭"
            title="关闭图片编辑器"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // 更新渲染编辑区域
  const renderEditArea = () => {
    if (!image && !batchMode) {
      return (
        <div 
          className={`w-full h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors duration-300 ${
            isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`flex flex-col items-center max-w-md mx-auto text-center transition-transform duration-300 ${isDragging ? 'scale-110' : 'scale-100'}`}>
            <UploadCloud className={`w-16 h-16 mb-4 transition-colors duration-300 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="text-base text-gray-600 dark:text-gray-400 mb-2">
              {isDragging ? '释放鼠标上传图片' : '拖拽图片或文件夹到此处，或点击上传'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">支持单张图片或批量上传，支持文件夹</p>
            <div className="flex gap-4">
              <label className="relative px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-all cursor-pointer shadow-sm hover:shadow-md">
                选择图片上传
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                  aria-label="上传单张图片"
                />
              </label>
              <label className="relative px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-all cursor-pointer shadow-sm hover:shadow-md">
                批量上传
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="sr-only"
                  aria-label="批量上传图片"
                />
              </label>
            </div>
          </div>
        </div>
      );
    }

    if (batchMode) {
      return (
        <div className="h-full flex flex-col">
          {/* 批量处理工具栏 */}
          <div className="flex items-center justify-between mb-4 px-4 py-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
            <div className="flex items-center">
              <Files className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                已选择 {batchFiles.length} 个文件
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setBatchMode(false);
                  setBatchFiles([]);
                  setBatchStatus({
                    total: 0,
                    processed: 0,
                    currentFile: '',
                    isProcessing: false
                  });
                }}
                className="px-3 py-2 rounded-md text-sm flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
              >
                <X className="w-4 h-4 mr-1.5" />
                <span>取消</span>
              </button>
              <button
                onClick={processBatchImages}
                className={`px-4 py-2 rounded-md text-sm flex items-center transition-colors shadow-sm ${
                  batchStatus.isProcessing
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
                disabled={batchStatus.isProcessing}
              >
                {batchStatus.isProcessing ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    <span>处理中...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    <span>开始批量处理</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 批量处理进度和文件列表 */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 overflow-hidden flex flex-col">
            {batchStatus.isProcessing && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    正在处理: {batchStatus.currentFile}
                  </span>
                  <span className="text-sm font-medium text-blue-500">
                    {batchStatus.processed + 1} / {batchStatus.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(batchStatus.processed / batchStatus.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {batchFiles.map((file, index) => (
                  <div
                    key={file.name}
                    className={`relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${
                      index < batchStatus.processed ? 'opacity-50' : ''
                    }`}
                  >
                    <img
                      src={processedImages[file.name] || URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-32 object-cover"
                      onLoad={() => {
                        if (!processedImages[file.name]) {
                          URL.revokeObjectURL(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                      <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-center p-2">
                        <p className="text-xs truncate">{file.name}</p>
                        {processedImages[file.name] && (
                          <span className="inline-flex items-center text-xs bg-green-500 px-2 py-1 rounded-full mt-1">
                            <Check className="w-3 h-3 mr-1" />
                            已处理
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between mb-4 px-4 py-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
          <button
            onClick={handleOneClickRemoval}
            className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-sm flex items-center font-medium transition-colors shadow-sm"
            disabled={isProcessing}
            aria-label="一键去重"
            title="一键去重"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            <span>一键去重</span>
          </button>
          <div className="flex space-x-2">
            <button
              onClick={handleViewEffect}
              className={`px-3 py-2 rounded-md text-sm flex items-center transition-colors ${
                !processedImage 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
              }`}
              disabled={!processedImage}
              aria-label="查看效果"
              title={processedImage ? "查看效果" : "请先应用参数"}
            >
              <Eye className="w-4 h-4 mr-1.5" />
              <span>查看效果</span>
            </button>
            <button
              onClick={handleDownload}
              className={`px-3 py-2 rounded-md text-sm flex items-center transition-colors shadow-sm ${
                !processedImage 
                  ? 'bg-green-400 text-white cursor-not-allowed opacity-60' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              disabled={!processedImage}
              aria-label="下载去重图"
              title={processedImage ? "下载去重图" : "请先应用参数"}
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span>下载去重图</span>
            </button>
          </div>
        </div>

        {/* 图片预览区域 */}
        <div className="relative flex-grow border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {showComparison ? (
            <div className="relative h-full w-full">
              <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full overflow-hidden border-r border-white">
                  <img src={image} alt="原图" className="object-contain w-full h-full" />
                  <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    原图
                  </div>
                </div>
                <div className="w-1/2 h-full overflow-hidden">
                  <img src={processedImage || ''} alt="处理后" className="object-contain w-full h-full" />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    处理后
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowComparison(false)}
                className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="关闭对比视图"
                title="关闭对比视图"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowComparison(false)}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                <ArrowLeftRight className="w-4 h-4 mr-1 inline-block" />
                关闭对比
              </button>
            </div>
          ) : (
            <>
              <img
                src={processedImage || image}
                alt="图像预览"
                className="object-contain w-full h-full"
              />
              <div className="absolute top-2 right-2 flex space-x-2">
                <label
                  className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:shadow cursor-pointer text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
                  title="上传新图片"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                    aria-label="上传新图片"
                  />
                  <UploadCloud className="w-5 h-5" />
                </label>
              </div>
            </>
          )}

          {/* 加载提示 */}
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40">
              <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
              <div className="text-white font-medium mb-2">处理中...</div>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {errorMessage && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md shadow-md">
              {errorMessage}
              <button
                onClick={() => setErrorMessage(null)}
                className="ml-2 p-1 hover:bg-red-600 rounded-full"
                aria-label="关闭错误提示"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 应用参数提示 */}
          {appliedParams.length > 0 && !isProcessing && !showComparison && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white text-xs px-3 py-2 rounded-lg shadow-md">
              <div className="font-medium mb-1">已应用：</div>
              <div className="flex flex-wrap gap-1">
                {appliedParams.map((param, i) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-500 bg-opacity-70 rounded-full text-xs">
                    {param}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染参数控制区域
  const renderParamControls = () => {
    if (!image) return null;

    return (
      <div className="p-5 space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <SlidersHorizontal className="w-5 h-5 mr-2 text-blue-500" />
          图像参数调整
        </h3>
        
        {/* 参数分组：光效 */}
        <div className="space-y-5">
          <div className="flex items-center pb-1 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex items-center">
              <SlidersHorizontal className="w-4 h-4 mr-2 text-blue-500" />
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">光效调整</h4>
            </div>
            <button
              onClick={() => {
                handleRandomizeParam('brightness');
                handleRandomizeParam('contrast');
                handleRandomizeParam('saturation');
              }}
              className="p-1 text-gray-500 hover:text-blue-500 flex items-center"
              aria-label="随机调整所有光效参数" 
              title="随机调整所有光效参数"
            >
              <Dice className="w-4 h-4" />
            </button>
          </div>
          
          {/* 亮度 */}
          <div id="param-brightness" className={`${changedParam === 'brightness' ? 'param-changed' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="brightness" className="text-sm font-medium text-gray-700 dark:text-gray-300">亮度</label>
              <div className="flex space-x-1 items-center">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{imageParams.brightness}</span>
                <button 
                  onClick={() => handleRandomizeParam('brightness')}
                  className="p-1 text-gray-500 hover:text-blue-500"
                  aria-label="随机调整亮度"
                  title="随机调整亮度"
                >
                  <Dice className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              id="brightness"
              type="range"
              className="w-full param-slider"
              min="-100" 
              max="100"
              step="1"
              value={imageParams.brightness}
              onChange={e => handleParamChange('brightness', parseInt(e.target.value))}
              aria-label="亮度调整滑块"
            />
          </div>
          
          {/* 对比度 */}
          <div id="param-contrast" className={`${changedParam === 'contrast' ? 'param-changed' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="contrast" className="text-sm font-medium text-gray-700 dark:text-gray-300">对比度</label>
              <div className="flex space-x-1 items-center">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{imageParams.contrast}</span>
                <button 
                  onClick={() => handleRandomizeParam('contrast')}
                  className="p-1 text-gray-500 hover:text-blue-500"
                  aria-label="随机调整对比度"
                  title="随机调整对比度"
                >
                  <Dice className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              id="contrast"
              type="range"
              className="w-full param-slider"
              min="-100"
              max="100"
              step="1"
              value={imageParams.contrast}
              onChange={e => handleParamChange('contrast', parseInt(e.target.value))}
              aria-label="对比度调整滑块"
            />
          </div>
          
          {/* 饱和度 */}
          <div id="param-saturation" className={`${changedParam === 'saturation' ? 'param-changed' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="saturation" className="text-sm font-medium text-gray-700 dark:text-gray-300">饱和度</label>
              <div className="flex space-x-1 items-center">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{imageParams.saturation}</span>
                <button 
                  onClick={() => handleRandomizeParam('saturation')}
                  className="p-1 text-gray-500 hover:text-blue-500"
                  aria-label="随机调整饱和度" 
                  title="随机调整饱和度"
                >
                  <Dice className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              id="saturation"
              type="range"
              className="w-full param-slider"
              min="-100"
              max="100"
              step="1"
              value={imageParams.saturation}
              onChange={e => handleParamChange('saturation', parseInt(e.target.value))}
              aria-label="饱和度调整滑块"
            />
          </div>
        </div>
        
        {/* 参数分组：几何变换 */}
        <div className="space-y-5">
          <div className="flex items-center pb-1 border-b border-gray-200 dark:border-gray-700">
            <Crop className="w-4 h-4 mr-2 text-blue-500" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">几何变换</h4>
          </div>
          
          {/* 旋转 */}
          <div id="param-rotate" className={`${changedParam === 'rotate' ? 'param-changed' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="rotate" className="text-sm font-medium text-gray-700 dark:text-gray-300">旋转</label>
              <div className="flex space-x-1 items-center">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{imageParams.rotate}°</span>
                <button 
                  onClick={() => handleRandomizeParam('rotate')}
                  className="p-1 text-gray-500 hover:text-blue-500"
                  aria-label="随机调整旋转角度"
                  title="随机调整旋转角度"
                >
                  <Dice className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              id="rotate"
              type="range"
              className="w-full param-slider"
              min="-180"
              max="180"
              step="1"
              value={imageParams.rotate}
              onChange={e => handleParamChange('rotate', parseInt(e.target.value))}
              aria-label="旋转角度调整滑块"
            />
          </div>
        </div>
        
        {/* 参数分组：特效 */}
        <div className="space-y-5">
          <div className="flex items-center pb-1 border-b border-gray-200 dark:border-gray-700">
            <Filter className="w-4 h-4 mr-2 text-blue-500" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">特效调整</h4>
          </div>
          
          {/* 暗角 */}
          <div id="param-vignette" className={`${changedParam && changedParam.startsWith('vignette') ? 'param-changed' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="vignette.opacity" className="text-sm font-medium text-gray-700 dark:text-gray-300">暗角强度</label>
              <div className="flex space-x-1 items-center">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{imageParams.vignette.opacity.toFixed(1)}</span>
                <button 
                  onClick={() => handleRandomizeParam('vignette')}
                  className="p-1 text-gray-500 hover:text-blue-500"
                  aria-label="随机调整暗角效果"
                  title="随机调整暗角效果"  
                >
                  <Dice className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              id="vignette.opacity"
              type="range"
              className="w-full param-slider"
              min="0"
              max="1"
              step="0.1"
              value={imageParams.vignette.opacity}
              onChange={e => handleParamChange('vignette.opacity', parseFloat(e.target.value))}
              aria-label="暗角强度调整滑块"
            />
            
            <div className="flex justify-between items-center mt-2 mb-1">
              <label htmlFor="vignette.radius" className="text-sm font-medium text-gray-700 dark:text-gray-300">暗角半径</label>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{imageParams.vignette.radius}</span>
            </div>
            <input
              id="vignette.radius"
              type="range"
              className="w-full param-slider"
              min="0"
              max="100"
              step="1"
              value={imageParams.vignette.radius}
              onChange={e => handleParamChange('vignette.radius', parseInt(e.target.value))}
              aria-label="暗角半径调整滑块"
            />
          </div>
          
          {/* 颗粒感 */}
          <div id="param-grain" className={`${changedParam === 'grain' ? 'param-changed' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="grain" className="text-sm font-medium text-gray-700 dark:text-gray-300">颗粒感</label>
              <div className="flex space-x-1 items-center">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{imageParams.grain.toFixed(2)}</span>
                <button 
                  onClick={() => handleRandomizeParam('grain')}
                  className="p-1 text-gray-500 hover:text-blue-500"
                  aria-label="随机调整颗粒感"
                  title="随机调整颗粒感"
                >
                  <Dice className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              id="grain"
              type="range"
              className="w-full param-slider"
              min="0"
              max="1"
              step="0.05"
              value={imageParams.grain}
              onChange={e => handleParamChange('grain', parseFloat(e.target.value))}
              aria-label="颗粒感调整滑块"
            />
          </div>
          
          {/* 锐化 */}
          <div id="param-sharpen" className={`${changedParam === 'sharpen' ? 'param-changed' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="sharpen" className="text-sm font-medium text-gray-700 dark:text-gray-300">锐化</label>
              <div className="flex space-x-1 items-center">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{imageParams.sharpen}</span>
                <button 
                  onClick={() => handleRandomizeParam('sharpen')}
                  className="p-1 text-gray-500 hover:text-blue-500"
                  aria-label="随机调整锐化效果"
                  title="随机调整锐化效果"
                >
                  <Dice className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              id="sharpen"
              type="range"
              className="w-full param-slider"
              min="0"
              max="0.5" // 降低最大锐化值为0.5
              step="0.05"
              value={imageParams.sharpen}
              onChange={e => handleParamChange('sharpen', parseFloat(e.target.value))}
              aria-label="锐化效果调整滑块"
            />
          </div>
        </div>
        
        {/* 参数分组：滤镜 */}
        <div className="space-y-5">
          <div className="flex items-center pb-1 border-b border-gray-200 dark:border-gray-700">
            <Image className="w-4 h-4 mr-2 text-blue-500" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">滤镜效果</h4>
            <button 
              onClick={() => handleRandomizeParam('filter')}
              className="ml-auto p-1 text-gray-500 hover:text-blue-500"
              aria-label="随机选择滤镜"
              title="随机选择滤镜"
            >
              <Dice className="w-4 h-4" />
            </button>
          </div>
          
          <div id="param-filter" className={`${changedParam === 'filter' ? 'param-changed' : ''}`}>
            <div className="grid grid-cols-3 gap-2">
              {['normal', 'grayscale', 'sepia', 'vintage', 'polaroid', 'blackAndWhite', 'cinema', 'duotone', 'kodachrome', 'technicolor'].map(filter => (
                <button 
                  key={filter} 
                  className={`py-1.5 px-2 text-xs border rounded-md transition ${imageParams.filter.type === filter ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                  onClick={() => handleFilterChange(filter)}
                  aria-label={`应用${filter}滤镜`}
                  title={`应用${filter}滤镜`}
                >
                  {filter === 'normal' ? '无滤镜' : filter}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 参数应用按钮 */}
        <div className="pt-4">
          <button
            onClick={processImage}
            className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-md font-medium transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm flex items-center justify-center"
            disabled={isProcessing || !image}
            aria-label="应用参数到图像"
          >
            {isProcessing ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                <span>应用中...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                <span>应用参数</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // 渲染闲鱼文案工具
  const renderDescriptionTool = () => (
    <ItemDescription 
      apiKey={deepseekApiKey} 
      onSetApiKey={setDeepseekApiKey} 
      onImageProcess={handleExternalImageProcess}
    />
  );

  // 优化关闭函数，添加动画
  const handleClose = () => {
    setIsClosing(true);
    // 等待动画完成后关闭
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 图片处理函数 - 提供给闲鱼文案组件使用
  const handleExternalImageProcess = async (imageUrl: string): Promise<string> => {
    try {
      // 创建一个Image对象用于获取图像尺寸
      const img = new window.Image();
      img.crossOrigin = "anonymous"; // 允许处理跨域图片
      
      // 等待图片加载
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("图片加载失败"));
        img.src = imageUrl;
      });
      
      // 生成随机参数并应用
      const randomParams = generateRandomParams(img.width, img.height);
      
      // 使用随机参数应用到图像
      const result = await processImageWithCanvas(
        img,
        {
          x: (randomParams.crop?.x || 0) / img.width,
          y: (randomParams.crop?.y || 0) / img.height,
          width: (randomParams.crop?.width || img.width) / img.width,
          height: (randomParams.crop?.height || img.height) / img.height
        },
        randomParams.filter?.type || 'normal',
        {
          brightness: (randomParams.brightness || 0) / 255,
          contrast: (randomParams.contrast || 0) / 100,
          saturation: (randomParams.saturation || 0) / 100,
          rotate: randomParams.rotate || 0,
          vignette: {
            opacity: randomParams.vignette?.opacity || 0,
            spread: (randomParams.vignette?.radius || 0) / 100
          },
          grain: (randomParams.grain || 0) / 100,
          sharpen: (randomParams.sharpen || 0) / 100
        }
      );
      
      return result;
    } catch (error) {
      console.error("处理外部图片时出错:", error);
      throw new Error("图片处理失败");
    }
  };

  // 批量处理图片
  const processBatchImages = async () => {
    if (batchStatus.isProcessing || batchFiles.length === 0) return;
    
    try {
      setBatchStatus(prev => ({ ...prev, isProcessing: true }));
      const zip = new JSZip();
      
      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        setBatchStatus(prev => ({
          ...prev,
          processed: i,
          currentFile: file.name
        }));
        
        // 读取文件
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        
        // 创建图片对象
        const img = await new Promise<HTMLImageElement>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.src = dataUrl;
        });
        
        // 生成随机参数
        const randomParams = generateRandomParams(img.width, img.height);
        
        // 处理图片
        const processedDataUrl = await processImageWithCanvas(
          img,
          {
            x: (randomParams.crop?.x || 0) / img.width,
            y: (randomParams.crop?.y || 0) / img.height,
            width: (randomParams.crop?.width || img.width) / img.width,
            height: (randomParams.crop?.height || img.height) / img.height
          },
          randomParams.filter?.type || 'normal',
          {
            brightness: (randomParams.brightness || 0) / 255,
            contrast: (randomParams.contrast || 0) / 100,
            saturation: (randomParams.saturation || 0) / 100,
            rotate: randomParams.rotate || 0,
            vignette: {
              opacity: randomParams.vignette?.opacity || 0,
              spread: (randomParams.vignette?.radius || 0) / 100
            },
            grain: (randomParams.grain || 0) / 100,
            sharpen: (randomParams.sharpen || 0) / 100
          }
        );
        
        // 保存处理后的图片
        setProcessedImages(prev => ({
          ...prev,
          [file.name]: processedDataUrl
        }));
        
        // 将处理后的图片添加到zip
        const imgData = processedDataUrl.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
        zip.file(`processed_${file.name}`, imgData, { base64: true });
      }
      
      // 生成zip文件并下载
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `processed_images_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // 重置状态
      setBatchStatus(prev => ({
        ...prev,
        processed: batchFiles.length,
        isProcessing: false
      }));
      
    } catch (error) {
      console.error('批量处理出错:', error);
      setErrorMessage('批量处理失败，请重试');
      setBatchStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // 渲染主界面
  return (
    <div className={`fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 overflow-hidden flex transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* 左侧导航栏 */}
      {renderNavigation()}
      
      {/* 右侧主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        {renderTopBar()}
        
        {/* 主内容区 */}
        <div className="flex-1 relative overflow-hidden">
          <div 
            className={`absolute inset-0 transition-all duration-300 ${
              activeTool === 'image' 
                ? 'opacity-100 z-10 translate-x-0' 
                : 'opacity-0 -z-10 translate-x-10'
            }`}
            style={{ 
              pointerEvents: activeTool === 'image' ? 'auto' : 'none'
            }}
          >
            <div className="h-full flex flex-col md:flex-row p-4 gap-4">
              {/* 操作区域 - 60%宽度 */}
              <div className="w-full md:w-3/5 h-full">
                {renderEditArea()}
              </div>
              
              {/* 参数控制区域 - 40%宽度 */}
              <div className="w-full md:w-2/5 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full">
                {renderParamControls()}
              </div>
            </div>
          </div>
          
          <div 
            className={`absolute inset-0 transition-all duration-300 ${
              activeTool === 'description' 
                ? 'opacity-100 z-10 translate-x-0' 
                : 'opacity-0 -z-10 -translate-x-10'
            }`}
            style={{ 
              pointerEvents: activeTool === 'description' ? 'auto' : 'none'
            }}
          >
            {renderDescriptionTool()}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .param-slider {
            -webkit-appearance: none;
            width: 100%;
            height: 4px;
            border-radius: 4px;
            background: #e2e8f0;
            outline: none;
          }
          
          .dark .param-slider {
            background: #4b5563;
          }
          
          .param-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .param-slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
          }
          
          .param-changed {
            animation: highlight 1s;
          }
          
          @keyframes highlight {
            0% { background-color: rgba(59, 130, 246, 0.2); }
            100% { background-color: transparent; }
          }
        `
      }} />
    </div>
  );
};

export default ImageEditor; 