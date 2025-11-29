import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Folder, FileText, ArrowLeft, 
  Cpu, Zap, Github, Mail, Globe,
  ChevronRight, Hash, Layers, RefreshCw, Disc,
  ExternalLink, User, Code
} from 'lucide-react';
import ReactMarkdown from 'react-markdown'; 

// ==========================================
// 🔴 用户配置区 (请在此修改你的信息)
// ==========================================
const USER_INFO = {
  name: "YaoYao-Pig",
  avatar: "https://github.com/YaoYao-Pig.png", // 自动抓取 GitHub 头像
  school: "ECNU",
  email: "s20020515@163.com",
  bio: "Game Developer",
  intro: "On my student card, I am a student. In my mind, I want to be a game developer. But in my heart, I am a gamer."
};

const PROJECTS_DATA = [
  { 
    id: 1, 
    name: "YaoYaoPigStudyNote", 
    desc: "核心知识库 / 个人笔记系统", 
    tech: ["Markdown", "Git", "Knowledge"],
    link: "https://github.com/YaoYao-Pig/YaoYaoPigStudyNote"
  },
  { 
    id: 2, 
    name: "Dx12Render", 
    desc: "基于DX12的图形学渲染流程学习", 
    tech: ["Dx12", "Compute Graph", "PBR"],
    link: "https://github.com/YaoYao-Pig/Dx12Render"
  },
  { 
    id: 3, 
    name: "SimpleLockStepFrameWork", 
    desc: "基于自己实现的帧同步框架和确定性碰撞的简单动作游戏Demo", 
    tech: ["Unity", "LockStep", "物理碰撞"],
    link: "https://github.com/YaoYao-Pig/SimpleLockStepFrameWork"
  },
  // 复制上面的块添加更多项目...
];
// --- 模拟数据 (备份用) ---
const MOCK_FILE_SYSTEM = {
  name: "root",
  type: "folder",
  children: [
    { name: "系统提示", type: "file", content: "# ERROR 404\n\n连接神经元网络失败，正在使用模拟数据。" },
    { name: "C#", type: "folder", children: [
        { name: "Create C#多态.md", type: "file", content: "# C# 多态性\n\n多态性是OOP的三大支柱之一..." }
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
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    const interval = setInterval(draw, 33);
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { clearInterval(interval); window.removeEventListener('resize', handleResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full opacity-10 pointer-events-none z-0" />;
};

// --- 组件: 故障文字效果 ---
const GlitchText = ({ text, className = "", as: Component = "h1" }) => (
  <div className={`relative inline-block group ${className}`}>
    <Component className="relative z-10">{text}</Component>
    <Component className="absolute top-0 left-0 -z-10 w-full h-full text-[#ff003c] opacity-0 group-hover:opacity-70 animate-pulse translate-x-[2px]">{text}</Component>
    <Component className="absolute top-0 left-0 -z-10 w-full h-full text-[#00f0ff] opacity-0 group-hover:opacity-70 animate-pulse -translate-x-[2px]">{text}</Component>
  </div>
);

// --- 组件: 面包屑导航 (修复补全) ---
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
  const [activeTab, setActiveTab] = useState('home'); // home, blog, projects
  const [currentPath, setCurrentPath] = useState([]); 
  const [currentNode, setCurrentNode] = useState(null);
  const [fileSystem, setFileSystem] = useState(MOCK_FILE_SYSTEM); 
  const [viewState, setViewState] = useState('list'); 
  const [loading, setLoading] = useState(true);

  const BASE_URL = import.meta.env.BASE_URL;

  // 初始化加载数据
  useEffect(() => {
    async function initSystem() {
      try {
        const response = await fetch(`${BASE_URL}structure.json`);
        if (!response.ok) throw new Error("Offline");
        const data = await response.json();
        setFileSystem(data);
        setCurrentNode(data);
        setCurrentPath([data]);
      } catch (err) {
        setFileSystem(MOCK_FILE_SYSTEM);
        setCurrentNode(MOCK_FILE_SYSTEM);
        setCurrentPath([MOCK_FILE_SYSTEM]);
      } finally {
        setTimeout(() => setLoading(false), 1500);
      }
    }
    initSystem();
  }, []);

  // 文件点击逻辑
  const handleNodeClick = async (node) => {
    if (node.type === 'folder') {
      setCurrentPath([...currentPath, node]);
      setCurrentNode(node);
    } else {
      setViewState('read');
      if (!node.content && node.path) {
        try {
            // FIX: 修复 URL 编码问题 (处理 C# 中的 #)
            // 我们需要把路径按 / 分割，对每一段进行编码，再重新拼接
            const encodedPath = node.path.split('/').map(segment => encodeURIComponent(segment)).join('/');
            
            const res = await fetch(`${BASE_URL}content/${encodedPath}`);
            
            // FIX: 检查响应状态，如果是 404 则抛出错误，避免将 404 HTML 当作 Markdown 渲染
            if (!res.ok) {
                throw new Error(`HTTP Error: ${res.status}`);
            }

            const text = await res.text();
            setCurrentNode({ ...node, content: text });
        } catch (e) {
            console.error("Fetch Error:", e);
            setCurrentNode({ 
                ...node, 
                content: `# ERROR 404 / ${e.message}\n\n**读取失败：**\n\n1. 请检查该文件是否包含特殊字符。\n2. 确保 GitHub Pages 已更新。\n3. 原文路径: \`${node.path}\`` 
            });
        }
      } else {
        setCurrentNode(node);
      }
    }
  };

  // 修复：返回逻辑
  const handleReturn = () => {
    setViewState('list');
    // 返回时，重置当前节点为路径中的最后一个文件夹
    if (currentPath.length > 0) {
      setCurrentNode(currentPath[currentPath.length - 1]);
    }
  };

  // 面包屑导航
  const handleBreadcrumbClick = (index) => {
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
    setCurrentNode(newPath[newPath.length - 1]);
    setViewState('list');
  };

  if (loading) return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center font-mono text-[#00ff41]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Cpu size={64} /></motion.div>
      <p className="mt-4 text-xl animate-pulse">SYSTEM INITIALIZING...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ff003c] selection:text-white overflow-x-hidden">
      <MatrixRain />
      <div className="fixed inset-0 pointer-events-none z-50 bg-[length:100%_2px,3px_100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" />

      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 w-full h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#333] z-40 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <Terminal className="text-[#00ff41]" />
          <GlitchText text="YAOYAO_PIG.sys" className="font-bold font-mono text-xl tracking-tighter" />
        </div>
        
        {/* 菜单 TAB */}
        <nav className="hidden md:flex items-center space-x-1">
          {['HOME', 'BLOG', 'PROJECTS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-6 py-2 font-mono text-sm transition-all border border-transparent ${
                activeTab === tab.toLowerCase() 
                ? 'text-[#050505] bg-[#00ff41] border-[#00ff41] font-bold' 
                : 'text-gray-400 hover:text-[#00ff41] hover:border-[#333]'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex items-center space-x-4 text-sm font-mono">
           <a href="[https://github.com/YaoYao-Pig](https://github.com/YaoYao-Pig)" target="_blank" className="hover:text-[#00f0ff]"><Github size={18} /></a>
        </div>
      </header>

      <main className="relative pt-24 pb-12 px-4 md:px-12 max-w-7xl mx-auto z-10 min-h-screen">
        
        <AnimatePresence mode="wait">
          
          {/* ================= HOME PAGE ================= */}
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center"
            >
              <div className="relative mb-8 group">
                 <div className="absolute inset-0 bg-[#00ff41] rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                 <img 
                   src={USER_INFO.avatar} 
                   alt="Avatar" 
                   className="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-[#333] group-hover:border-[#00ff41] transition-colors object-cover"
                 />
                 <div className="absolute -bottom-2 -right-2 bg-[#050505] border border-[#00ff41] text-[#00ff41] px-2 py-1 text-xs font-mono">
                   LV.99
                 </div>
              </div>
              
              <GlitchText text={USER_INFO.name} as="h1" className="text-5xl md:text-7xl font-black mb-4 tracking-tighter italic" />
              
              <div className="font-mono text-[#00f0ff] mb-8 text-sm md:text-base tracking-widest uppercase">
                {USER_INFO.bio}
              </div>

              <div className="bg-[#0a0a0a]/80 border border-[#333] p-6 max-w-2xl w-full mb-10 text-gray-300 font-mono text-sm leading-relaxed relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#ff003c]"></div>
                <p>root@system:~$ {USER_INFO.intro}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span className="flex items-center"><User size={12} className="mr-1"/> {USER_INFO.school}</span>
                  <span className="flex items-center"><Mail size={12} className="mr-1"/> {USER_INFO.email}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                <button 
                  onClick={() => setActiveTab('blog')}
                  className="flex-1 py-4 bg-[#00ff41] text-black font-bold font-mono hover:bg-[#fff] transition-colors border-b-4 border-[#00cc33] active:border-0 active:translate-y-1"
                >
                  ACCESS KNOWLEDGE BASE
                </button>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className="flex-1 py-4 bg-transparent border border-[#333] text-white font-bold font-mono hover:border-[#00f0ff] hover:text-[#00f0ff] transition-colors"
                >
                  DEPLOYED PROJECTS
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= BLOG PAGE ================= */}
          {activeTab === 'blog' && (
            <motion.div
              key="blog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
               <div className="flex justify-between items-end mb-6 border-b border-[#333] pb-4">
                <div className="flex-1">
                  <Breadcrumbs path={currentPath} onNavigate={handleBreadcrumbClick} />
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-gray-200">
                    {currentNode.name === 'root' ? '/ROOT_DIRECTORY' : currentNode.name}
                  </h2>
                </div>
                <Layers className="text-[#333] w-12 h-12 hidden md:block" />
              </div>

              {viewState === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentNode.children && currentNode.children.length > 0 ? (
                    currentNode.children.map((node, index) => (
                      <motion.div
                        key={node.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleNodeClick(node)}
                        className="cursor-pointer bg-[#0a0a0a] border border-[#333] p-6 hover:border-[#00ff41] group relative overflow-hidden"
                      >
                         <div className="flex items-center justify-between mb-4">
                           {node.type === 'folder' 
                             ? <Folder className="text-[#00ff41] group-hover:scale-110 transition-transform"/> 
                             : <FileText className="text-[#00f0ff] group-hover:scale-110 transition-transform"/>}
                           <div className="text-xs font-mono text-[#333] group-hover:text-[#00ff41]">
                             {Math.floor(Math.random() * 500)} KB
                           </div>
                         </div>
                         <h3 className="text-lg font-bold font-mono text-gray-200 group-hover:text-[#00ff41] truncate">
                           {node.name}
                         </h3>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center border border-dashed border-[#333] text-gray-600 font-mono">
                      [EMPTY SECTOR]
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#0a0a0a] border border-[#333] p-8 md:p-12 relative shadow-2xl min-h-[60vh]">
                  <button 
                    onClick={handleReturn}
                    className="mb-8 flex items-center space-x-2 text-[#00ff41] hover:text-white transition-colors font-mono uppercase text-sm border border-[#00ff41] px-4 py-2 inline-block w-auto"
                  >
                    <ArrowLeft size={16} /> <span>RETURN TO MATRIX</span>
                  </button>

                  <div className="prose prose-invert prose-green max-w-none font-sans">
                    <h1 className="text-3xl font-bold mb-6 text-white border-b border-[#333] pb-4">
                      {currentNode.name.replace('.md', '')}
                    </h1>
                    
                    <div className="text-gray-300 leading-relaxed font-mono text-sm md:text-base">
                       {currentNode.content ? (
                          <ReactMarkdown 
                            components={{
                              code({node, inline, className, children, ...props}) {
                                return !inline ? (
                                  <div className="bg-black p-4 rounded border border-[#333] my-4 relative group">
                                    <code className="text-sm text-gray-300 whitespace-pre-wrap" {...props}>{children}</code>
                                  </div>
                                ) : (
                                  <code className="bg-[#333] text-[#00ff41] px-1 rounded mx-1" {...props}>{children}</code>
                                )
                              },
                              // 修复：图片路径处理
                              img: ({src, alt}) => {
                                 let finalSrc = src;
                                 if (src && !src.startsWith('http') && !src.startsWith('/')) {
                                     // 获取当前文件所在的目录路径
                                     const currentDir = currentNode.path.substring(0, currentNode.path.lastIndexOf('/'));
                                     const cleanSrc = src.replace(/^\.\//, ''); // 移除开头的 ./
                                     finalSrc = `${BASE_URL}content/${currentDir ? currentDir + '/' : ''}${cleanSrc}`;
                                 }
                                 return (
                                    <div className="my-6 border border-[#333] p-2 bg-black inline-block">
                                       <img src={finalSrc} alt={alt} className="max-w-full h-auto" onError={(e) => e.target.style.display='none'}/>
                                       {alt && <p className="text-center text-xs text-gray-500 mt-2 font-mono">{alt}</p>}
                                    </div>
                                 );
                              }
                            }}
                          >
                            {currentNode.content}
                          </ReactMarkdown>
                       ) : (
                         <div className="flex items-center space-x-2 text-[#ff003c] animate-pulse">
                            <RefreshCw className="animate-spin" /><span>DOWNLOADING...</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ================= PROJECTS PAGE ================= */}
          {activeTab === 'projects' && (
             <motion.div
               key="projects"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
             >
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-10 text-right text-gray-200">
                  DEPLOYED_PROJECTS <Disc className="inline-block ml-2 animate-spin" />
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {PROJECTS_DATA.map((project) => (
                    <motion.div
                       key={project.id}
                       whileHover={{ scale: 1.02, rotate: 1 }}
                       className="bg-[#0f0f0f] border-2 border-[#333] p-6 relative group cursor-pointer"
                       onClick={() => window.open(project.link, '_blank')}
                    >
                       {/* 磁带风格装饰 */}
                       <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#ff003c] via-[#ffff00] to-[#00f0ff] opacity-50"></div>
                       <div className="flex justify-between items-start mb-4 mt-2">
                         <div className="bg-[#333] text-white text-xs px-2 py-1 font-mono rounded">Tape No.00{project.id}</div>
                         <ExternalLink size={16} className="text-[#00ff41] opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                       
                       <h3 className="text-2xl font-bold font-mono text-white mb-2 group-hover:text-[#00f0ff] transition-colors">
                         {project.name}
                       </h3>
                       <p className="text-gray-400 font-mono text-sm mb-6 h-10 line-clamp-2">
                         {project.desc}
                       </p>

                       <div className="flex flex-wrap gap-2 mt-auto">
                         {project.tech.map(t => (
                           <span key={t} className="text-xs border border-[#333] px-2 py-1 text-gray-500 group-hover:border-[#00ff41] group-hover:text-[#00ff41] transition-colors">
                             {t}
                           </span>
                         ))}
                       </div>
                       
                       {/* 底部孔装饰 */}
                       <div className="flex justify-center space-x-8 mt-6">
                          <div className="w-8 h-8 rounded-full border-2 border-[#333] bg-black animate-spin-slow"></div>
                          <div className="w-8 h-8 rounded-full border-2 border-[#333] bg-black animate-spin-slow"></div>
                       </div>
                    </motion.div>
                  ))}
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 w-full h-2 bg-[#00ff41] z-50 opacity-50" />
    </div>
  );
}