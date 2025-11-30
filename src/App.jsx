import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Folder, FileText, ArrowLeft, 
  Cpu, Zap, Github, Mail,
  ChevronRight, Hash, Layers, RefreshCw, Disc,
  ExternalLink, User, List, AlignRight, Eye, EyeOff
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
  intro: "On my student card, I am a student. \nIn my mind, I want to be a game developer. \nBut in my heart, I am a gamer."
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
const MOCK_FILE_SYSTEM = {
  name: "root",
  type: "folder",
  children: [
    { name: "System", type: "file", content: "# ERROR 404\n\n连接神经元网络失败。" }
  ]
};

// --- 工具：生成 URL 安全的 ID ---
const generateId = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '');
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

const GlitchText = ({ text, className = "", as: Component = "h1" }) => (
  <div className={`relative inline-block group ${className}`}>
    <Component className="relative z-10">{text}</Component>
    <Component className="absolute top-0 left-0 -z-10 w-full h-full text-[#ff003c] opacity-0 group-hover:opacity-70 animate-pulse translate-x-[2px]">{text}</Component>
    <Component className="absolute top-0 left-0 -z-10 w-full h-full text-[#00f0ff] opacity-0 group-hover:opacity-70 animate-pulse -translate-x-[2px]">{text}</Component>
  </div>
);

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

// --- 目录组件 ---
const TableOfContents = ({ markdown }) => {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    const lines = markdown.split('\n');
    const extracted = [];
    lines.forEach(line => {
      // 匹配 # 标题
      const match = line.match(/^(#{1,3})\s+(.*)$/);
      if (match) {
        extracted.push({
          level: match[1].length,
          text: match[2].trim(),
          id: generateId(match[2].trim())
        });
      }
    });
    setHeadings(extracted);
  }, [markdown]);

  const scrollToId = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className="hidden xl:block w-64 ml-8 sticky top-24 max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="flex items-center space-x-2 mb-4 text-[#00ff41] font-bold font-mono border-b border-[#333] pb-2">
        <AlignRight size={18} />
        <span>NAVIGATION</span>
      </div>
      <div className="space-y-2 border-l border-[#333] pl-4">
        {headings.map((h, i) => (
          <div 
            key={i} 
            onClick={() => scrollToId(h.id)}
            className={`cursor-pointer hover:text-[#00ff41] transition-colors text-sm font-mono text-gray-400
              ${h.level === 1 ? 'font-bold mt-4 mb-2' : ''}
              ${h.level === 2 ? 'pl-2' : ''}
              ${h.level === 3 ? 'pl-4 text-xs' : ''}
            `}
          >
            {h.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [currentPath, setCurrentPath] = useState([]); 
  const [currentNode, setCurrentNode] = useState(null);
  const [fileSystem, setFileSystem] = useState(MOCK_FILE_SYSTEM); 
  const [viewState, setViewState] = useState('list'); 
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true); // 滤镜开关

  const BASE_URL = import.meta.env.BASE_URL;

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

  const handleNodeClick = async (node) => {
    if (node.type === 'folder') {
      setCurrentPath([...currentPath, node]);
      setCurrentNode(node);
    } else {
      setViewState('read');
      if (!node.content && node.path) {
        try {
            const encodedPath = node.path.split('/').map(segment => encodeURIComponent(segment)).join('/');
            const res = await fetch(`${BASE_URL}content/${encodedPath}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            setCurrentNode({ ...node, content: text });
        } catch (e) {
            setCurrentNode({ ...node, content: `# ERROR 404\n读取失败: ${node.name}` });
        }
      } else {
        setCurrentNode(node);
      }
    }
  };

  const handleReturn = () => {
    setViewState('list');
    if (currentPath.length > 0) {
      setCurrentNode(currentPath[currentPath.length - 1]);
    }
  };

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
      {showFilters && <MatrixRain />}
      {showFilters && <div className="fixed inset-0 pointer-events-none z-50 bg-[length:100%_2px,3px_100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" />}

      <header className="fixed top-0 left-0 w-full h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#333] z-40 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <Terminal className="text-[#00ff41]" />
            <GlitchText text="YAOYAO_PIG.sys" className="font-bold font-mono text-xl tracking-tighter" />
          </div>
          {/* 滤镜开关按钮 */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 rounded hover:bg-[#333] text-gray-500 hover:text-[#00ff41] transition-colors"
            title={showFilters ? "Disable VFX" : "Enable VFX"}
          >
            {showFilters ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        
        <nav className="hidden md:flex items-center space-x-1">
          {['HOME', 'BLOG', 'PROJECTS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-6 py-2 font-mono text-sm transition-all border border-transparent ${
                activeTab === tab.toLowerCase() ? 'text-[#050505] bg-[#00ff41] font-bold' : 'text-gray-400 hover:text-[#00ff41]'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="flex items-center space-x-4"><Github size={18} className="cursor-pointer hover:text-[#00f0ff]"/></div>
      </header>

      <main className="relative pt-24 pb-12 px-4 md:px-12 max-w-7xl mx-auto z-10 min-h-screen">
        <AnimatePresence mode="wait">
          
          {/* HOME */}
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center justify-center min-h-[70vh] text-center">
              <div className="relative mb-8 group">
                 <div className="absolute inset-0 bg-[#00ff41] rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                 <img src={USER_INFO.avatar} alt="Avatar" className="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-[#333] group-hover:border-[#00ff41] transition-colors object-cover"/>
              </div>
              <GlitchText text={USER_INFO.name} as="h1" className="text-5xl md:text-7xl font-black mb-4 italic" />
              <div className="font-mono text-[#00f0ff] mb-8 tracking-widest">{USER_INFO.bio}</div>
              <div className="bg-[#0a0a0a]/80 border border-[#333] p-6 max-w-2xl w-full mb-10 text-gray-300 font-mono text-sm leading-relaxed border-l-4 border-l-[#ff003c]">
                <p>root@system:~$ {USER_INFO.intro}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setActiveTab('blog')} className="px-8 py-3 bg-[#00ff41] text-black font-bold font-mono hover:bg-white">ENTER BLOG</button>
              </div>
            </motion.div>
          )}

          {/* BLOG */}
          {activeTab === 'blog' && (
            <motion.div key="blog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
              <div className="flex justify-between items-end mb-6 border-b border-[#333] pb-4">
                <div className="flex-1">
                  <Breadcrumbs path={currentPath} onNavigate={handleBreadcrumbClick} />
                  <h2 className="text-3xl md:text-5xl font-black uppercase italic text-gray-200">{currentNode.name === 'root' ? '/ROOT' : currentNode.name}</h2>
                </div>
              </div>

              {viewState === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentNode.children?.map((node, index) => (
                    <motion.div
                      key={node.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNodeClick(node)}
                      className="cursor-pointer bg-[#0a0a0a] border border-[#333] p-6 hover:border-[#00ff41] group"
                    >
                       <div className="flex justify-between mb-4">
                         {node.type === 'folder' ? <Folder className="text-[#00ff41]"/> : <FileText className="text-[#00f0ff]"/>}
                       </div>
                       <h3 className="text-lg font-bold font-mono text-gray-200 group-hover:text-[#00ff41] truncate">{node.name}</h3>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-start gap-8">
                  {/* 阅读区域 */}
                  <div className="flex-1 bg-[#0a0a0a] border border-[#333] p-8 md:p-12 shadow-2xl min-w-0">
                    <button onClick={handleReturn} className="mb-8 flex items-center space-x-2 text-[#00ff41] hover:text-white font-mono text-sm border border-[#00ff41] px-4 py-2 inline-block">
                      <ArrowLeft size={16} /> <span>BACK</span>
                    </button>
                    <div className="prose prose-invert prose-green max-w-none font-sans prose-headings:font-bold prose-h1:text-[#00ff41] prose-h1:border-b prose-h1:border-[#333] prose-h1:pb-4 prose-a:text-[#00f0ff]">
                      <ReactMarkdown 
                        components={{
                          h1: ({children}) => <h1 id={generateId(children)} className="text-4xl mt-8 mb-6 relative pl-4 border-l-4 border-[#00ff41]">{children}</h1>,
                          h2: ({children}) => <h2 id={generateId(children)} className="text-3xl mt-8 mb-4 text-[#e0e0e0] flex items-center"><span className="text-[#ff003c] mr-2">##</span>{children}</h2>,
                          h3: ({children}) => <h3 id={generateId(children)} className="text-2xl mt-6 mb-3 text-gray-300 flex items-center"><span className="text-[#00f0ff] mr-2">###</span>{children}</h3>,
                          
                          // 引用块美化
                          blockquote: ({children}) => (
                            <div className="my-6 border-l-4 border-[#ff003c] bg-[#ff003c]/10 p-4 rounded-r font-mono text-gray-300 italic relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJyZ2JhKDI1NSwgMCwgNjAsIDAuMDUpIiAvPgo8L3N2Zz4=')] opacity-50 pointer-events-none"></div>
                              <Zap size={16} className="text-[#ff003c] mb-2 inline-block mr-2" />
                              <span className="font-bold text-[#ff003c] not-italic">SYSTEM ALERT:</span>
                              <div className="mt-1">{children}</div>
                            </div>
                          ),

                          // 代码块美化 (区分 Inline 和 Block)
                          code({node, inline, className, children, ...props}) {
                            // 1. 如果是 Inline 代码 (行内 `code`)
                            if (inline) {
                              return (
                                <code className="bg-[#333]/50 text-[#00ff41] px-1.5 py-0.5 rounded font-mono text-sm border border-[#333]/50" {...props}>
                                  {children}
                                </code>
                              );
                            }
                            
                            // 2. 如果是 Block 代码 (```block```)
                            return (
                              <div className="my-6 rounded-lg overflow-hidden border border-[#333] bg-[#050505] shadow-lg">
                                {/* 终端头部 */}
                                <div className="bg-[#1a1a1a] px-4 py-2 flex items-center justify-between border-b border-[#333]">
                                  <div className="flex space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono">TERMINAL</div>
                                </div>
                                <div className="p-4 overflow-x-auto">
                                  <code className="text-sm font-mono text-gray-300 whitespace-pre-wrap" {...props}>{children}</code>
                                </div>
                              </div>
                            );
                          },
                          
                          // 图片路径修复
                          img: ({src, alt}) => {
                             let finalSrc = src;
                             if (src && !src.startsWith('http') && !src.startsWith('/')) {
                                 const currentDir = currentNode.path.substring(0, currentNode.path.lastIndexOf('/'));
                                 const cleanSrc = src.replace(/^\.\//, '');
                                 finalSrc = `${BASE_URL}content/${currentDir ? currentDir + '/' : ''}${cleanSrc}`;
                             }
                             return (
                                <div className="my-8 border-2 border-[#333] p-1 bg-[#1a1a1a] inline-block shadow-[0_0_15px_rgba(0,255,65,0.1)]">
                                   <img src={finalSrc} alt={alt} className="max-w-full h-auto block" onError={(e) => e.target.style.display='none'}/>
                                   {alt && <p className="text-center text-xs text-[#00ff41] mt-2 font-mono uppercase tracking-widest border-t border-[#333] pt-2">{alt}</p>}
                                </div>
                             );
                          }
                        }}
                      >
                        {currentNode.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* 侧边目录 */}
                  {currentNode.content && <TableOfContents markdown={currentNode.content} />}
                </div>
              )}
            </motion.div>
          )}

          {/* PROJECTS */}
          {activeTab === 'projects' && (
             <motion.div key="projects" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-10 text-right text-gray-200">PROJECTS</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {PROJECTS_DATA.map((project) => (
                    <motion.div key={project.id} whileHover={{ scale: 1.02, rotate: 1 }} className="bg-[#0f0f0f] border-2 border-[#333] p-6 relative group cursor-pointer" onClick={() => window.open(project.link, '_blank')}>
                       <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#ff003c] via-[#ffff00] to-[#00f0ff] opacity-50"></div>
                       <h3 className="text-2xl font-bold font-mono text-white mb-2 group-hover:text-[#00f0ff] mt-4">{project.name}</h3>
                       <p className="text-gray-400 font-mono text-sm mb-6">{project.desc}</p>
                       <div className="flex flex-wrap gap-2">{project.tech.map(t => <span key={t} className="text-xs border border-[#333] px-2 py-1 text-gray-500 group-hover:text-[#00ff41]">{t}</span>)}</div>
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