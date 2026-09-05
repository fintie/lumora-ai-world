import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
const sans=Geist({variable:'--font-geist-sans',subsets:['latin']});const mono=Geist_Mono({variable:'--font-geist-mono',subsets:['latin']});
export const metadata:Metadata={metadataBase:new URL('https://lumora-ai-world.sweet-boot-8960.chatgpt.site'),title:'Lumora · 3D 自主世界实验室',description:'一个持续运行的 3D AI 虚拟聚落，居民会观察、决策、协作并改变世界。',openGraph:{title:'LUMORA · 自主世界实验室',description:'六位 AI 居民在持续运行的 3D 森林聚落中观察、决策、协作并改变世界。',images:['/og.png']},twitter:{card:'summary_large_image',title:'LUMORA · 自主世界实验室',description:'六位 AI 居民在持续运行的 3D 森林聚落中观察、决策、协作并改变世界。',images:['/og.png']}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
