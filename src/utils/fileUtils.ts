import { FileItem } from '../types/file';

let cachedStructure: FileItem[] | null = null;

// 判断是否为开发环境
const isDev = import.meta.env.DEV;

// 获取文件的实际路径
export function getAssetPath(filePath: string) {
  // 确保路径以 src/data 开头
  const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  if (!normalizedPath.startsWith('src/data')) {
    console.warn('File path should start with src/data:', filePath);
  }
  
  // 开发环境：使用原始路径
  if (isDev) {
    return normalizedPath;
  }
  
  // 生产环境：将 src/data 替换为 assets/data
  return normalizedPath.replace('src/data', 'assets/data');
}

// 获取文件的预览路径
export function getPreviewPath(filePath: string) {
  const path = getAssetPath(filePath);
  
  // 开发环境：所有文件都添加 ?raw 查询参数
  if (isDev) {
    return path + '?raw';
  }
  
  return path;
}

export async function getFileStructure(path: string): Promise<FileItem[]> {
  try {
    // 如果已经缓存了文件结构，直接返回
    if (cachedStructure) {
      return cachedStructure;
    }

    // 从静态 JSON 文件获取文件结构
    const response = await fetch('/file-structure.json');
    if (!response.ok) {
      throw new Error('Failed to fetch file structure');
    }
    
    // 缓存文件结构
    cachedStructure = await response.json();
    return cachedStructure;
  } catch (error) {
    console.error('Error fetching file structure:', error);
    return [];
  }
} 