/*
  # 添加文件处理进度列

  1. 更改
    - 为 files 表添加 progress 列，用于跟踪文件处理进度
    - 设置默认值为25（表示上传完成的初始状态）
    - 添加值范围检查（0-100）

  2. 数据迁移
    - 根据现有的 processing_status 设置初始进度值
*/

-- 添加 progress 列
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS progress numeric 
  DEFAULT 25 
  CHECK (progress >= 0 AND progress <= 100);

-- 更新现有记录的进度
UPDATE files 
SET progress = CASE 
  WHEN processing_status = 'completed' THEN 100
  WHEN processing_status = 'error' THEN 0
  ELSE 25
END;