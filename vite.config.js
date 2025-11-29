import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/MyBlog/', // <--- 这里的名字必须和你的 GitHub 仓库名完全一致，前后都要有斜杠！
})