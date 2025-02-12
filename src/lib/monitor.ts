export const monitor = {
  error(error: Error, context?: Record<string, any>) {
    console.error(error, context);
    
    // 可以在这里添加更多监控逻辑
    // 例如发送到监控服务
  },
  
  timing(name: string, duration: number) {
    console.log(`Timing: ${name} took ${duration}ms`);
  },
};