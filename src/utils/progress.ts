import { throttle } from 'lodash-es';

export interface ProgressHistory {
  timestamp: number;
  progress: number;
  status: string;
}

// 进度历史记录
const progressHistory: Record<string, ProgressHistory[]> = {};

// 添加进度历史记录
export const addProgressHistory = (fileId: string, progress: number, status: string) => {
  if (!progressHistory[fileId]) {
    progressHistory[fileId] = [];
  }
  progressHistory[fileId].push({
    timestamp: Date.now(),
    progress,
    status
  });
};

// 获取进度历史记录
export const getProgressHistory = (fileId: string): ProgressHistory[] => {
  return progressHistory[fileId] || [];
};

// 平滑进度更新函数
export const smoothProgress = (
  currentProgress: number, 
  targetProgress: number, 
  onProgress: (progress: number) => void
): Promise<number> => {
  return new Promise(resolve => {
    const step = (targetProgress - currentProgress) / 10;
    let progress = currentProgress;
    
    const interval = setInterval(() => {
      progress += step;
      if (
        (step > 0 && progress >= targetProgress) || 
        (step < 0 && progress <= targetProgress)
      ) {
        clearInterval(interval);
        onProgress(targetProgress);
        resolve(targetProgress);
      } else {
        onProgress(progress);
      }
    }, 50);
  });
};

// 节流包装的进度更新函数
export const throttledProgress = throttle(
  (progress: number, onProgress: (progress: number) => void) => {
    onProgress(progress);
  }, 
  100,
  { leading: true, trailing: true }
);

// 进度回退处理函数
export const handleProgressError = async (
  currentProgress: number,
  onProgress: (progress: number) => void
): Promise<void> => {
  await smoothProgress(currentProgress, 0, onProgress);
}; 