import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Folder, FileText, ArrowLeft, 
  Cpu, Zap, Github, 
  ChevronRight, Hash, Layers, RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown'; 

// --- 模拟数据 (备份用) ---
const MOCK_FILE_SYSTEM = {
  name: "root",
  type: "folder",
  children: [
    { name: "系统提示", type: "file", content: "# 欢迎来到 NEO-TERMINAL\n\n如果看到这个文件，说明：\n1. 你正在预览模式\n2. 或者数据抓取失败\n\n请检查 console log 获取更多信息。" },
    { name: "C#", type: "folder", children: [
        { name: "Create C#多态.md", type: "file", content: "# C# 多态性\n\n多态性是OOP的三大支柱之一..." }
    ]},
    { name: "Lua", type: "folder", children: [
        { name: "XLua穿梭成本.md", type: "file", content: "# XLua 穿梭成本优化\n\nC#与Lua交互的性能开销..." }
    ]}
  ]
};

// --- 组件: Matrix 背景动画 ---
const MatrixRain = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0F0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };
    const interval = setInterval(draw, 33);
    
    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
        clearInterval(interval);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full opacity-10 pointer-events-none z-0" />;
};

// --- 组件: 故障文字效果 ---
const GlitchText = ({ text, className = "", as: Component = "h1" }) => {
  return (
    <div className={`relative inline-block group ${className}`}>
      <Component className="relative z-10">{text}</Component>
      <Component className="absolute top-0 left-0 -z-10 w-full h-full text-[#ff003c] opacity-0 group-hover:opacity-70 animate-pulse translate-x-[2px]">
        {text}
      </Component>
      <Component className="absolute top-0 left-0 -z-10 w-full h-full text-[#00f0ff] opacity-0 group-hover:opacity-70 animate-pulse -translate-x-[2px]">
        {text}
      </Component>
    </div>
  );
};

// --- 组件: 文件/文件夹卡片 ---
const NodeCard = ({ node, onClick, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05, type: "spring" }}
      whileHover={{ scale: 1.05, rotate: -1, backgroundColor: "rgba(0, 255, 65, 0.1)" }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(node)}
      className="cursor-pointer border-2 border-[#333] hover:border-[#00ff41] bg-[#0a0a0a] p-6 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
        {node.type === 'folder' ? <Folder className="text-[#00ff41]" /> : <FileText className="text-[#00f0ff]" />}
      </div>
      
      {/* 装饰性角标 */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-[#333] group-hover:bg-[#00ff41] transition-colors" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#333] group-hover:border-[#ff003c] transition-colors" />

      <h3 className="text-xl font-bold font-mono text-white group-hover:text-[#00ff41] truncate mt-4">
        {node.name}
      </h3>
      <p className="text-xs text-gray-500 mt-2 font-mono group-hover:text-[#00f0ff]">
        {node.type === 'folder' ? 'DIR' : 'MD FILE'} // {Math.floor(Math.random() * 100)}KB
      </p>
    </motion.div>
  );
};

// --- 组件: 面包屑导航 ---
const Breadcrumbs = ({ path, onNavigate }) => (
  <div className="flex items-center space-x-2 text-sm font-mono mb-8 text-gray-400 overflow-x-auto">
    <span className="text-[#ff003c] font-bold">root@yaoyao-pig:~/</span>
    {path.map((item, idx) => (
      <React.Fragment key={idx}>
        <motion.span
          whileHover={{ color: "#00ff41", scale: 1.1 }}
          onClick={() => onNavigate(idx)}
          className="cursor-pointer hover:underline whitespace-nowrap"
        >
          {item.name}
        </motion.span>
        {idx < path.length - 1 && <ChevronRight size={14} />}
      </React.Fragment>
    ))}
    <span className="animate-pulse text-[#00ff41]">_</span>
  </div>
);

// --- 主应用 ---
export default function App() {
  const [currentPath, setCurrentPath] = useState([]); 
  const [currentNode, setCurrentNode] = useState(null);
  const [fileSystem, setFileSystem] = useState(MOCK_FILE_SYSTEM); 
  const [viewState, setViewState] = useState('list'); 
  const [loading, setLoading] = useState(true);

  // 获取 Vite 配置的 base 路径
  const BASE_URL = import.meta.env.BASE_URL;

  // 核心逻辑：加载真实数据
  useEffect(() => {
    async function initSystem() {
      try {
        console.log("正在连接神经元网络...");
        // 使用 BASE_URL 拼接路径，确保在子目录下也能找到文件
        const response = await fetch(`${BASE_URL}structure.json`);
        
        if (!response.ok) throw new Error("Local Data Link Offline");
        
        const data = await response.json();
        setFileSystem(data);
        setCurrentNode(data);
        setCurrentPath([data]);
      } catch (err) {
        console.warn("Falling back to simulation mode:", err);
        setFileSystem(MOCK_FILE_SYSTEM);
        setCurrentNode(MOCK_FILE_SYSTEM);
        setCurrentPath([MOCK_FILE_SYSTEM]);
      } finally {
        setTimeout(() => setLoading(false), 1500);
      }
    }
    initSystem();
  }, []);

  const handleNodeClick = async (node) => {
    if (node.type === 'folder') {
      setCurrentPath([...currentPath, node]);
      setCurrentNode(node);
    } else {
      setViewState('read');
      
      if (!node.content && node.path) {
        try {
            // 同样使用 BASE_URL 拼接内容路径
            const res = await fetch(`${BASE_URL}content/${node.path}`);
            const text = await res.text();
            setCurrentNode({ ...node, content: text });
        } catch (e) {
            setCurrentNode({ ...node, content: "# ERROR 404\nDATA CORRUPTED." });
        }
      } else {
        setCurrentNode(node);
      }
    }
  };

  const handleBreadcrumbClick = (index) => {
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
    setCurrentNode(newPath[newPath.length - 1]);
    setViewState('list');
  };

  if (loading) {
     return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center font-mono text-[#00ff41]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Cpu size={64} />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="mt-4 text-xl"
        >
          ESTABLISHING UPLINK...
        </motion.p>
        <div className="mt-2 text-xs text-gray-600">YAOYAO-PIG PROTOCOL V1.0</div>
      </div>
    );
  }

  if (!currentNode) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ff003c] selection:text-white overflow-x-hidden">
      <MatrixRain />
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 w-full h-16 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#333] z-40 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <Terminal className="text-[#00ff41]" />
          <GlitchText text="YAOYAO_PIG.LOG" className="font-bold font-mono text-xl tracking-tighter" />
        </div>
        <div className="flex items-center space-x-6 text-sm font-mono">
          <a href="[https://github.com/YaoYao-Pig](https://github.com/YaoYao-Pig)" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 hover:text-[#00f0ff] transition-colors">
            <Github size={16} /> <span>GITHUB</span>
          </a>
          <div className="hidden md:flex items-center space-x-4">
            <span className="flex items-center text-[#ff003c]"><Zap size={14} className="mr-1" /> ONLINE</span>
            <span className="text-gray-500">MEM: 64TB</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-24 pb-12 px-4 md:px-12 max-w-7xl mx-auto z-10 min-h-screen flex flex-col">
        
        <div className="flex justify-between items-end mb-6 border-b border-[#333] pb-4">
           <div className="flex-1">
             <Breadcrumbs path={currentPath} onNavigate={handleBreadcrumbClick} />
             <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
               {currentNode.name === 'root' ? 'KNOWLEDGE_BASE' : currentNode.name}
             </h2>
           </div>
           <div className="hidden md:block">
             <Layers className="text-[#333] w-16 h-16" />
           </div>
        </div>

        <AnimatePresence mode="wait">
          {viewState === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {currentNode.children && currentNode.children.length > 0 ? (
                currentNode.children.map((node, index) => (
                  <NodeCard 
                    key={node.name} 
                    node={node} 
                    index={index} 
                    onClick={handleNodeClick} 
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-20 border border-dashed border-[#333] text-gray-500 font-mono">
                  <Hash className="mx-auto mb-4 opacity-50" />
                  [EMPTY DIRECTORY]
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="bg-[#0f0f0f] border border-[#333] p-8 md:p-12 relative shadow-2xl"
            >
              <button 
                onClick={() => setViewState('list')}
                className="mb-8 flex items-center space-x-2 text-[#00ff41] hover:text-white transition-colors font-mono uppercase text-sm"
              >
                <ArrowLeft size={16} /> <span>Return to Matrix</span>
              </button>

              <div className="prose prose-invert prose-green max-w-none font-sans">
                <h1 className="text-3xl font-bold mb-6 text-white border-l-4 border-[#00f0ff] pl-4">
                  {currentNode.name.replace('.md', '')}
                </h1>
                
                <div className="text-gray-300 leading-relaxed font-mono text-sm md:text-base">
                   {currentNode.content ? (
                      <ReactMarkdown 
                        components={{
                          code({node, inline, className, children, ...props}) {
                            return !inline ? (
                              <div className="bg-black p-4 rounded border border-[#333] my-4 relative group">
                                <code className="text-sm text-gray-300 break-words whitespace-pre-wrap" {...props}>
                                  {children}
                                </code>
                              </div>
                            ) : (
                              <code className="bg-[#333] text-[#00ff41] px-1 rounded" {...props}>{children}</code>
                            )
                          }
                        }}
                      >
                        {currentNode.content}
                      </ReactMarkdown>
                   ) : (
                     <div className="flex items-center space-x-2 text-[#ff003c] animate-pulse">
                        <RefreshCw className="animate-spin" />
                        <span>DOWNLOADING DATA PACKET...</span>
                     </div>
                   )}
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-[#333] flex justify-between items-center text-xs text-gray-600 font-mono">
                 <span>SECURE CONNECTION</span>
                 <span>AUTHOR: YAOYAO-PIG</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      <footer className="fixed bottom-0 w-full h-2 bg-[#00ff41] z-50 opacity-50" />
    </div>
  );
}
