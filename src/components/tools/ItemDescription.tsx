import React, { useState, useEffect, useCallback } from 'react';
import { Clipboard, Download, AlertCircle, Loader, X, FileText, Zap, Copy, RotateCw, Key, CheckCircle2, Image as ImageIcon, Link as LinkIcon, Info, Tag } from 'lucide-react';

interface ItemDescriptionProps {
  apiKey: string;
  onSetApiKey: (key: string) => void;
  onImageProcess: (imageUrl: string) => Promise<string>;
  onClose?: () => void;
}

const ItemDescription: React.FC<ItemDescriptionProps> = ({ apiKey, onSetApiKey, onImageProcess, onClose }) => {
  // 状态
  const [productLink, setProductLink] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<'copy' | 'generate' | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);
  const [notification, setNotification] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [progressStatus, setProgressStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [imageProcessingOptions, setImageProcessingOptions] = useState({
    brightness: 1.1,
    contrast: 1.2,
    removeWatermark: false,
    enhanceQuality: true
  });
  const [scrapedContent, setScrapedContent] = useState<{
    title: string;
    description: string;
    imageUrl: string;
    price?: string;
    seller?: string;
  } | null>(null);
  const [processingStep, setProcessingStep] = useState<'idle' | 'scraping' | 'scraped' | 'processing' | 'complete'>('idle');

  // 链接验证 - 加强验证逻辑
  const isValidProductLink = (link: string): boolean => {
    // 支持各种闲鱼/淘宝链接格式，包括短链接
    const linkRegex = /^(https?:\/\/)?(www\.)?(((idle|2|m)\.fish|(m\.)?tb\.cn|goofish\.com|youpin\.mi\.com|taobao\.com)\/[\w\-\.\~\?\&\=\%\#\/\:\+]*)/i;
    return linkRegex.test(link);
  };

  // 验证链接是否可访问 (模拟)
  const validateLinkAccessibility = async (link: string): Promise<{isValid: boolean; message?: string}> => {
    // 在实际应用中，这应该是一个后端API调用
    // 前端不能直接发起跨域请求抓取其他网站内容
    
    // 模拟网络请求延迟和验证过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟各种错误情况的概率
    const rand = Math.random();
    
    // 模拟5%的概率出现链接错误
    if (rand < 0.05) {
      return { isValid: false, message: '您输入的链接无法访问，请检查后重试' };
    }
    
    // 模拟3%的概率网站拒绝访问
    if (rand < 0.08) {
      return { isValid: false, message: '该网站暂时拒绝访问，可能存在反爬虫机制，请稍后再试' };
    }
    
    return { isValid: true };
  };

  // 模拟网页抓取函数
  const fetchProductInfo = async (link: string): Promise<{
    title: string;
    description: string;
    imageUrl: string;
    price?: string;
    seller?: string;
    error?: string;
  }> => {
    // 更新进度状态
    setProgressSteps(prev => [...prev, '正在连接到商品页面...']);
    
    // 检查链接可访问性
    const linkStatus = await validateLinkAccessibility(link);
    if (!linkStatus.isValid) {
      throw new Error(linkStatus.message || '链接无法访问');
    }
    
    // 模拟网页内容抓取
    setProgressSteps(prev => [...prev, '已连接商品页面，正在提取信息...']);
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // 基于链接内容识别商品类型 (在真实场景中这里应该是解析HTML内容)
    const linkLower = link.toLowerCase();
    
    setProgressSteps(prev => [...prev, '已提取商品信息，正在分析内容...']);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 根据链接关键词判断商品类型并返回相应信息
    // 这部分在实际应用中应该是基于HTML解析结果
    if (linkLower.includes('program') || linkLower.includes('小程序') || 
        linkLower.includes('资源') || linkLower.includes('教程') ||
        linkLower.includes('课程')) {
      // 小程序/课程相关
      return {
        title: '网创小程序资源站搭建【送全套软件】一键同步',
        description: `网创小程序资源站搭建【送全套软件】

✅优势亮点：
1️⃣个人创业友好：无需工商执照，个人即可申请
2️⃣独立运营：无需购买域名和服务器，后台自定义设置
3️⃣课程资源：每日更新，一键同步，支持上传个人资源
4️⃣目前已支持在线自动开通VIP（个人小程序也可以接入）
5️⃣流量主广告：用户观看广告解锁资源，你获广告收益

【功能介绍】
- 支持多种支付方式：微信支付/卡密/积分
- 支持分销功能：合伙人共同推广
- 支持分类管理：课程分类清晰明了
- 界面美观：专业设计界面，提升用户体验

【售后服务】
- 一对一指导：专业技术支持，解决搭建问题
- 免费更新：系统持续更新，功能不断完善
- 7*24小时在线客服：随时解答您的问题

适合人群：想要创业但资金有限的朋友，兼职创业者，内容创作者`,
        imageUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=2070&auto=format&fit=crop',
        price: '299.00',
        seller: '网创科技小店'
      };
    } else if (linkLower.includes('iphone') || linkLower.includes('手机') || 
               linkLower.includes('apple') || linkLower.includes('苹果')) {
      // 苹果手机相关
      return {
        title: 'Apple iPhone 14 Pro Max 256GB 暗紫色 原装未拆封 全网通5G手机',
        description: `苹果 iPhone 14 Pro Max 256GB 暗紫色
全新未拆封，标配全套配件

【商品状况】
9.9新，原封未拆，官方质保期内。

【交易方式】
支持直接购买
支持当面交易
支持密码查询
支持闲鱼官方担保交易

【价格说明】
标价为普通线上交易价格，如需当面交易可减免快递费。
支持芝麻信用先享后付。
诚信卖家，只卖真货，假一赔十！

如有疑问请直接咨询~`,
        imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=2342&auto=format&fit=crop',
        price: '6999.00',
        seller: '数码良品铺'
      };
    } else if (linkLower.includes('book') || linkLower.includes('书') || 
              linkLower.includes('阅读') || linkLower.includes('小说')) {
      // 图书相关
      return {
        title: '电子游戏逻辑设计艺术 计算机编程入门书籍 游戏开发教程',
        description: `《电子游戏逻辑设计艺术》9成新
作者：[美] Robert Nystrom 著，Tan Hao 译
出版社：人民邮电出版社

【内容简介】
本书是一本关于游戏编程的经典著作，涵盖了游戏开发中常见的设计模式和优化技巧。作者从实际工作经验出发，深入浅出地讲解了游戏开发中的核心概念和技术要点。

【商品状态】
9成新，无划痕，无污渍，无缺页
仅翻阅过几次，保存完好
书角微微有些自然翻折，不影响阅读

【适合人群】
- 游戏开发爱好者
- 计算机专业学生
- 程序员和软件工程师
- 对游戏设计感兴趣的读者

【交易方式】
支持闲鱼担保交易
支持当面交易（限本地）
当天下单，48小时内发货

有任何问题欢迎咨询，感谢您的关注！`,
        imageUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=2076&auto=format&fit=crop',
        price: '45.00',
        seller: '二手书友会'
      };
    } else {
      // 默认商品
      return {
        title: '全新未拆封 高品质商品 原价购入 超值优惠',
        description: `全新未使用商品，原价购入现低价转让
包装完好，未拆封

【商品状态】
全新，未拆封，无任何使用痕迹
保存于无烟无宠物家庭

【交易说明】
支持闲鱼担保交易
支持验货后确认收货
非诚勿扰，不议价

【售后服务】
支持7天无理由退换（物流费用买家承担）
有任何问题可随时联系咨询

感谢您的浏览，希望能找到喜欢的主人！`,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop',
        price: '128.00',
        seller: '闲置好物分享'
      };
    }
  };

  // 使用NLP优化商品标题和描述 (模拟)
  const enhanceProductContent = async (title: string, description: string): Promise<{
    enhancedTitle: string;
    enhancedDescription: string;
  }> => {
    setProgressSteps(prev => [...prev, '正在优化商品文案...']);
    
    // 模拟NLP处理延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 标题增强逻辑
    let enhancedTitle = title;
    if (!title.includes('【') && !title.includes('「')) {
      enhancedTitle = `【爆款特惠】${title}`;
    }
    
    if (!enhancedTitle.includes('现货') && !enhancedTitle.includes('包邮') && Math.random() > 0.5) {
      enhancedTitle += ' 现货包邮';
    }
    
    if (!enhancedTitle.includes('质保') && !enhancedTitle.includes('保证') && Math.random() > 0.7) {
      enhancedTitle += ' 品质保证';
    }
    
    // 描述增强逻辑
    let enhancedDescription = description;
    
    // 如果描述没有明显的结构，添加结构
    if (!description.includes('【') && !description.includes('商品描述')) {
      const sections = description.split('\n\n');
      let structuredDesc = `【商品详情】\n${sections[0]}\n\n`;
      
      if (sections.length > 1) {
        structuredDesc += `【产品特点】\n${sections[1]}\n\n`;
      }
      
      structuredDesc += `【购买须知】
- 支持7天无理由退换
- 品质保证，假一赔十
- 当天发货，快递包邮
- 有任何问题随时咨询\n\n`;
      
      structuredDesc += `【卖家承诺】
诚信经营，用心服务，希望您购买愉快！`;
      
      enhancedDescription = structuredDesc;
    }
    
    return {
      enhancedTitle,
      enhancedDescription
    };
  };

  // 验证 API Key
  const validateApiKey = () => {
    if (!apiKeyInput || !apiKeyInput.trim()) {
      setError('请输入有效的 API Key');
      return;
    }

    // 验证API Key格式是否正确（应以sk-开头）
    if (!apiKeyInput.trim().startsWith('sk-')) {
      setError('API Key 应以 sk- 开头，请检查后重试');
      return;
    }

    setIsLoading(true);
    // 模拟验证过程
    setTimeout(() => {
      setIsLoading(false);
      onSetApiKey(apiKeyInput.trim());
      setShowApiKeyInput(false);
      setNotification('API Key 设置成功');
      setError(null);
    }, 1000);
  };

  // 一键抄袭功能 - 重构
  const handleCopyItem = async () => {
    // 重置状态
    setError(null);
    setProgressSteps([]);
    setProgressStatus('idle');
    setGeneratedTitle('');
    setGeneratedDescription('');
    setProcessedImage(null);
    setScrapedContent(null);
    setProcessingStep('idle');
    
    // 检查 API Key
    if (!apiKey) {
      setError('请先设置 API Key');
      setShowApiKeyInput(true);
      return;
    }
    
    // 验证商品链接
    if (!productLink || !isValidProductLink(productLink)) {
      setError('请输入有效的闲鱼/淘宝商品链接');
      return;
    }
    
    setIsLoading(true);
    setCurrentMode('copy');
    setProgressStatus('running');
    setProcessingStep('scraping');
    
    try {
      // 抓取商品信息
      setProgressSteps(prev => [...prev, '正在连接到商品页面...']);
      
      // 模拟验证链接可访问性
      const linkStatus = await validateLinkAccessibility(productLink);
      if (!linkStatus.isValid) {
        throw new Error(linkStatus.message || '链接无法访问');
      }
      
      // 模拟网页内容抓取
      setProgressSteps(prev => [...prev, '已连接商品页面，正在提取信息...']);
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 基于链接内容识别商品类型 (在真实场景中这里应该是解析HTML内容)
      const linkLower = productLink.toLowerCase();
      
      setProgressSteps(prev => [...prev, '已提取商品信息，等待下一步操作...']);
      
      // 获取原始内容
      let productInfo;
      
      // 根据链接关键词判断商品类型并返回相应信息
      if (linkLower.includes('program') || linkLower.includes('小程序') || 
          linkLower.includes('资源') || linkLower.includes('教程') ||
          linkLower.includes('课程')) {
        // 小程序/课程相关
        productInfo = {
          title: '网创小程序资源站搭建【送全套软件】一键同步',
          description: `网创小程序资源站搭建【送全套软件】

✅优势亮点：
1️⃣个人创业友好：无需工商执照，个人即可申请
2️⃣独立运营：无需购买域名和服务器，后台自定义设置
3️⃣课程资源：每日更新，一键同步，支持上传个人资源
4️⃣目前已支持在线自动开通VIP（个人小程序也可以接入）
5️⃣流量主广告：用户观看广告解锁资源，你获广告收益`,
          imageUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=2070&auto=format&fit=crop',
          price: '299.00',
          seller: '网创科技小店'
        };
      } else if (linkLower.includes('iphone') || linkLower.includes('手机') || 
                linkLower.includes('apple') || linkLower.includes('苹果')) {
        // 苹果手机相关
        productInfo = {
          title: 'Apple iPhone 14 Pro Max 256GB 暗紫色 原装未拆封 全网通5G手机',
          description: `苹果 iPhone 14 Pro Max 256GB 暗紫色
全新未拆封，标配全套配件

【商品状况】
9.9新，原封未拆，官方质保期内。

【交易方式】
支持直接购买
支持当面交易
支持密码查询
支持闲鱼官方担保交易`,
          imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=2342&auto=format&fit=crop',
          price: '6999.00',
          seller: '数码良品铺'
        };
      } else if (linkLower.includes('book') || linkLower.includes('书') || 
                linkLower.includes('阅读') || linkLower.includes('小说')) {
        // 图书相关
        productInfo = {
          title: '电子游戏逻辑设计艺术 计算机编程入门书籍 游戏开发教程',
          description: `《电子游戏逻辑设计艺术》9成新
作者：[美] Robert Nystrom 著，Tan Hao 译
出版社：人民邮电出版社

【内容简介】
本书是一本关于游戏编程的经典著作，涵盖了游戏开发中常见的设计模式和优化技巧。作者从实际工作经验出发，深入浅出地讲解了游戏开发中的核心概念和技术要点。

【商品状态】
9成新，无划痕，无污渍，无缺页
仅翻阅过几次，保存完好
书角微微有些自然翻折，不影响阅读`,
          imageUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=2076&auto=format&fit=crop',
          price: '45.00',
          seller: '二手书友会'
        };
      } else {
        // 默认商品
        productInfo = {
          title: '全新未拆封 高品质商品 原价购入 超值优惠',
          description: `全新未使用商品，原价购入现低价转让
包装完好，未拆封

【商品状态】
全新，未拆封，无任何使用痕迹
保存于无烟无宠物家庭

【交易说明】
支持闲鱼担保交易
支持验货后确认收货
非诚勿扰，不议价`,
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop',
          price: '128.00',
          seller: '闲置好物分享'
        };
      }
      
      // 更新状态，设置抓取到的内容
      setScrapedContent(productInfo);
      setProcessingStep('scraped');
      setProgressStatus('success');
      setIsLoading(false);
      setNotification('商品信息抓取成功，请确认后继续处理');
      
    } catch (err) {
      setError(`处理失败: ${err instanceof Error ? err.message : '未知错误'}`);
      setIsLoading(false);
      setProgressStatus('error');
      setProcessingStep('idle');
    }
  };

  // 添加处理第二步的函数
  const handleProcessContent = async () => {
    if (!scrapedContent) {
      setError('没有可处理的内容，请先抓取商品信息');
      return;
    }
    
    setIsLoading(true);
    setProgressStatus('running');
    setProcessingStep('processing');
    
    try {
      // 增强商品内容
      setProgressSteps(prev => [...prev, '正在优化商品文案...']);
      const { enhancedTitle, enhancedDescription } = await enhanceProductContent(
        scrapedContent.title,
        scrapedContent.description
      );
      
      setProgressSteps(prev => [...prev, '正在处理商品图片...']);
      
      // 处理商品图片
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = scrapedContent.imageUrl;
      
      img.onload = () => {
        // 创建画布并处理图片
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('无法创建图像处理上下文');
          setIsLoading(false);
          setProgressStatus('error');
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制原始图像
        ctx.drawImage(img, 0, 0);
        
        // 应用图像处理
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 应用亮度和对比度
        const { brightness, contrast } = imageProcessingOptions;
        
        for (let i = 0; i < data.length; i += 4) {
          // 红色通道
          data[i] = Math.min(255, ((data[i] / 255 - 0.5) * contrast + 0.5) * 255 * brightness);
          // 绿色通道
          data[i + 1] = Math.min(255, ((data[i + 1] / 255 - 0.5) * contrast + 0.5) * 255 * brightness);
          // 蓝色通道
          data[i + 2] = Math.min(255, ((data[i + 2] / 255 - 0.5) * contrast + 0.5) * 255 * brightness);
          // Alpha通道保持不变
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // 如果启用了增强质量选项，模拟锐化效果
        if (imageProcessingOptions.enhanceQuality) {
          // 在真实应用中，这里可以应用更复杂的图像处理算法
          // 简单模拟锐化效果
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-over';
        }
        
        // 获取处理后的图像
        const processedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // 更新状态
        setProcessedImage(processedImageUrl);
        setGeneratedTitle(enhancedTitle);
        setGeneratedDescription(enhancedDescription);
        setProgressSteps(prev => [...prev, '商品信息处理完成！']);
        setProgressStatus('success');
        setProcessingStep('complete');
        
        // 完成加载
        setIsLoading(false);
        
        // 显示成功通知
        setNotification('商品文案优化成功，可以复制使用了');
        setTimeout(() => setNotification(null), 5000);
      };
      
      img.onerror = () => {
        setError('无法加载商品图片，请检查网络连接或尝试其他链接');
        setIsLoading(false);
        setProgressStatus('error');
      };
    } catch (err) {
      setError(`处理失败: ${err instanceof Error ? err.message : '未知错误'}`);
      setIsLoading(false);
      setProgressStatus('error');
    }
  };

  // 一键生成功能
  const handleGenerateContent = async () => {
    if (!apiKey && !await validateApiKey()) return;
    
    if (!productTitle.trim() || !productDescription.trim()) {
      setError("请输入商品标题和描述");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setCurrentMode('generate');
    
    try {
      // 调用AI生成内容
      // 实际开发中应该调用DeepSeek API
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const aiResult = {
        title: productTitle.length > 20 ? 
          `【爆款特惠】${productTitle.substring(0, 20)}... 限时折扣 正品保障` : 
          `【爆款特惠】${productTitle} 限时折扣 正品保障`,
        description: `# ${productTitle} - 闲鱼爆款商品\n\n## 商品亮点\n✅ 100%正品保障\n✅ 品质超出预期\n✅ 性价比极高\n\n## 详细介绍\n${productDescription}\n\n## 购买须知\n- 支持7天无理由退换\n- 全国包邮（新疆、西藏除外）\n- 支持专柜验货\n\n## 卖家承诺\n诚信经营，品质保证，有任何问题随时联系，感谢您的支持！`
      };
      
      // 更新状态
      setGeneratedTitle(aiResult.title);
      setGeneratedDescription(aiResult.description);
      setProcessedImage(null);
      
      setIsLoading(false);
    } catch (err) {
      setError("生成失败，请稍后重试");
      setIsLoading(false);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setNotification('已复制到剪贴板');
        // 3秒后自动关闭通知
        setTimeout(() => setNotification(null), 3000);
      })
      .catch(err => {
        setError(`复制失败: ${err.message}`);
      });
  };

  // 下载图片
  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification('图片已开始下载');
    setTimeout(() => setNotification(null), 3000);
  };

  // 加载图片
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  };

  // 渲染通知提示
  const renderNotification = () => {
    if (!notification) return null;
    
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-md shadow-lg text-green-800 dark:text-green-200 max-w-md">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm flex-1">{notification}</p>
        <button 
          onClick={() => setNotification(null)}
          className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded-full"
          aria-label="关闭通知"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // 渲染错误信息
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
          <div className="flex items-start mb-4">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">处理失败</h3>
              <p className="mt-1 text-gray-600 dark:text-gray-300">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              aria-label="关闭错误提示"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染处理进度
  const renderProgress = () => {
    if (progressStatus === 'idle' || progressSteps.length === 0) return null;
    
    return (
      <div className="mt-4 mb-2">
        <div className="flex items-center mb-2">
          <div className={`h-2 w-2 rounded-full mr-2 ${
            progressStatus === 'running' ? 'bg-blue-500 animate-pulse' : 
            progressStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {progressStatus === 'running' ? '处理中...' : 
             progressStatus === 'success' ? '处理完成' : '处理出错'}
          </span>
        </div>
        <div className="space-y-2">
          {progressSteps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className={`w-4 h-4 flex-shrink-0 mt-0.5 mr-2 rounded-full flex items-center justify-center ${
                index === progressSteps.length - 1 && progressStatus === 'running' 
                  ? 'border-2 border-blue-500 border-t-transparent animate-spin' 
                  : 'bg-blue-100 dark:bg-blue-900'
              }`}>
                {(index < progressSteps.length - 1 || progressStatus !== 'running') && (
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 在return语句之前添加一个点击背景关闭组件的函数
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 如果点击的是背景元素（而不是内容），则关闭组件
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    // 修改最外层的div，确保占据整个屏幕，并添加背景点击处理
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden" 
      onClick={handleBackgroundClick}
    >
      {/* 修改内容容器，确保有最大高度和滚动条 */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部区域 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">闲鱼商品文案生成</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 - 使用flex布局确保响应式设计 */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* 左侧输入区域 */}
          <div className="w-full md:w-1/2 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {/* API Key 输入区域 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Key className="w-4 h-4" />
                  API Key 
                  {apiKey && (
                    <span className="ml-2 inline-flex items-center text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      已设置
                    </span>
                  )}
                </label>
                <button 
                  className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                >
                  {apiKey ? "更改" : "设置"} API Key
                </button>
              </div>
              
              {showApiKeyInput && (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="请输入以 sk- 开头的 OpenAI API Key"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <button
                      onClick={validateApiKey}
                      disabled={isLoading}
                      className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
                    >
                      {isLoading ? "验证中..." : "确定"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    您的 API Key 将仅在本地保存，不会上传到任何服务器
                  </p>
                </div>
              )}
            </div>

            {/* 商品链接输入 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                <LinkIcon className="w-4 h-4" />
                闲鱼商品链接
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  placeholder="请粘贴闲鱼/淘宝商品链接"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={handleCopyItem}
                  disabled={isLoading || !apiKey}
                  className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? "处理中..." : "一键抄袭"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">粘贴商品链接，自动抓取并生成爆款文案</p>
            </div>

            {/* 分隔线 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">或者手动输入</span>
              </div>
            </div>

            {/* 手动输入商品信息区域 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                <Tag className="w-4 h-4" />
                商品标题
              </label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="输入您的商品标题"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                商品描述
              </label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="输入您的商品描述内容..."
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <button
              onClick={handleGenerateContent}
              disabled={isLoading || !apiKey}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2">处理中</span>
                  <span className="flex space-x-1">
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </span>
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Zap className="w-4 h-4 mr-2" />
                  一键生成爆款文案
                </span>
              )}
            </button>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 mb-4 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-md text-sm">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* 抓取的内容展示 */}
            {!isLoading && processingStep === 'scraped' && scrapedContent && (
              <div className="mt-4 p-4 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/30">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  抓取到的商品信息
                </h4>
                
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">商品标题</span>
                    {scrapedContent.price && (
                      <span className="text-xs font-medium text-red-500">¥{scrapedContent.price}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{scrapedContent.title}</p>
                </div>
                
                <div className="mb-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">商品描述</span>
                  <div className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded-md max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700">
                    <pre className="whitespace-pre-wrap">{scrapedContent.description}</pre>
                  </div>
                </div>
                
                {scrapedContent.imageUrl && (
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">商品图片</span>
                    <div className="h-40 bg-white dark:bg-gray-800 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <img 
                        src={scrapedContent.imageUrl} 
                        alt={scrapedContent.title} 
                        className="max-h-full max-w-full object-contain" 
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setScrapedContent(null);
                      setProcessingStep('idle');
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleProcessContent}
                    className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    优化文案
                  </button>
                </div>
              </div>
            )}

            {/* 操作提示 */}
            {!error && !generatedTitle && !isLoading && (
              <div className="p-3 mb-4 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-md text-sm">
                <div className="flex items-start">
                  <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">如何使用</p>
                    <ol className="list-decimal ml-5 space-y-1">
                      <li>设置您的 OpenAI API Key</li>
                      <li>粘贴闲鱼/淘宝商品链接</li>
                      <li>点击"一键抄袭"</li>
                      <li>复制生成的标题和描述</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* 处理中的进度显示 */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center p-6 space-y-3">
                <div className="relative w-16 h-16">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">正在处理商品信息...</p>
                {/* 添加进度步骤显示 */}
                {renderProgress()}
              </div>
            )}

            {/* 图片处理选项 */}
            {!isLoading && processedImage && (
              <div className="mt-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/50">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-1" />
                  图片处理选项
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center justify-between text-xs">
                      <span>亮度</span>
                      <span className="text-gray-500">{Math.round(imageProcessingOptions.brightness * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={imageProcessingOptions.brightness}
                      onChange={(e) => setImageProcessingOptions(prev => ({
                        ...prev,
                        brightness: parseFloat(e.target.value)
                      }))}
                      className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      title="调整图片亮度"
                      aria-label="亮度调节"
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-xs">
                      <span>对比度</span>
                      <span className="text-gray-500">{Math.round(imageProcessingOptions.contrast * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={imageProcessingOptions.contrast}
                      onChange={(e) => setImageProcessingOptions(prev => ({
                        ...prev,
                        contrast: parseFloat(e.target.value)
                      }))}
                      className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      title="调整图片对比度"
                      aria-label="对比度调节"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  <label className="flex items-center text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-1.5"
                      checked={imageProcessingOptions.removeWatermark}
                      onChange={(e) => setImageProcessingOptions(prev => ({
                        ...prev,
                        removeWatermark: e.target.checked
                      }))}
                    />
                    移除水印
                  </label>
                  <label className="flex items-center text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-1.5"
                      checked={imageProcessingOptions.enhanceQuality}
                      onChange={(e) => setImageProcessingOptions(prev => ({
                        ...prev,
                        enhanceQuality: e.target.checked
                      }))}
                    />
                    增强图片质量
                  </label>
                </div>
                <button
                  onClick={handleCopyItem}
                  className="w-full mt-3 px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  重新处理图片
                </button>
              </div>
            )}
          </div>

          {/* 右侧结果显示区域 */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto">
            {generatedTitle && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    生成的标题
                  </h3>
                  <button
                    onClick={() => {
                      copyToClipboard(generatedTitle);
                      setNotification('标题已复制到剪贴板');
                    }}
                    className="text-xs flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    aria-label="复制标题"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    复制
                  </button>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                  <p className="text-sm break-words">{generatedTitle}</p>
                </div>
              </div>
            )}

            {generatedDescription && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    生成的描述
                  </h3>
                  <button
                    onClick={() => {
                      copyToClipboard(generatedDescription);
                      setNotification('描述已复制到剪贴板');
                    }}
                    className="text-xs flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    aria-label="复制描述"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    复制
                  </button>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap break-words">{generatedDescription}</pre>
                </div>
              </div>
            )}

            {processedImage && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" />
                    处理后的图片
                  </h3>
                  <button
                    onClick={() => {
                      downloadImage(processedImage, "processed-image.jpg");
                      setNotification('图片已开始下载');
                    }}
                    className="text-xs flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    aria-label="下载图片"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    下载
                  </button>
                </div>
                <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img 
                    src={processedImage} 
                    alt="处理后的商品图片" 
                    className="w-full h-auto object-contain max-h-[300px]" 
                  />
                </div>
              </div>
            )}

            {!generatedTitle && !generatedDescription && !processedImage && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500 dark:text-gray-400">
                <FileText className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium mb-2">暂无生成结果</h3>
                <p className="text-sm">设置 API Key 并提交商品链接生成内容</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 通知显示 */}
      {renderNotification()}
    </div>
  );
};

export default ItemDescription; 