import { motion } from 'framer-motion';
import { FileText, Loader2 } from 'lucide-react';

interface FileLoadingOverlayProps {
  fileName: string;
  fileSize: string;
}

export function FileLoadingOverlay({ fileName, fileSize }: FileLoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
      >
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative mb-4"
          >
            <FileText className="w-16 h-16 text-blue-500" />
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-6 h-6 text-blue-600" />
            </motion.div>
          </motion.div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
            正在加载文件
          </h3>
          
          <div className="text-sm text-gray-500 text-center mb-4">
            <p className="font-medium text-gray-700">{fileName}</p>
            <p>{fileSize}</p>
          </div>

          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: "0%" }}
              animate={{
                width: ["0%", "30%", "60%", "80%", "90%"],
              }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                times: [0, 0.2, 0.4, 0.6, 0.8],
              }}
            />
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            请稍候，正在准备文件...
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
} 