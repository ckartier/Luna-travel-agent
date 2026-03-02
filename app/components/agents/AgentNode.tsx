'use client';

import { ReactNode } from 'react';
import { useNodeStore } from '@/app/store/uiStore';
import { motion } from 'framer-motion';

interface AgentNodeProps {
    id: string;
    title: string;
    subtitle: string;
    icon: ReactNode;
    position: { x: string, y: string };
    isCenter?: boolean;
}

export default function AgentNode({ id, title, subtitle, icon, position, isCenter = false }: AgentNodeProps) {
    const { activeNode, setActiveNode } = useNodeStore();
    const isActive = activeNode === id || isCenter;

    if (isCenter) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute z-20 cursor-pointer pointer-events-auto"
                style={{ top: position.y, left: position.x, transform: 'translate(-50%, -50%)' }}
                onClick={() => setActiveNode(id)}
            >
                <div className="relative rounded-full bg-white shadow-glow p-2 flex-center flex-col w-48 h-48 border-[3px] border-blue-400 backdrop-blur-md">
                    {/* Inner glow and rings could go here, but keeping it clean to match image */}
                    <div className="mb-2 bg-blue-50 p-3 rounded-full text-blue-800">
                        {icon}
                    </div>
                    <h3 className="font-extrabold text-blue-900 tracking-wide text-lg text-center leading-tight">{title}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 text-center">{subtitle}</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: activeNode === id ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 cursor-pointer pointer-events-auto transition-all"
            style={{ top: position.y, left: position.x, transform: 'translate(-50%, -50%)' }}
            onClick={() => setActiveNode(id)}
        >
            <div className={`glass-pill px-5 py-3 flex items-center gap-4 hover:shadow-lg transition-shadow border-2 ${activeNode === id ? 'border-blue-400' : 'border-white'}`}>
                <div className="p-2.5 rounded-full bg-gray-50/80 text-gray-700 shadow-sm border border-gray-100 flex-shrink-0">
                    {icon}
                </div>
                <div className="flex flex-col pr-2">
                    <h3 className="font-bold text-sm tracking-wide text-gray-900">{title}</h3>
                    <p className="text-[11px] text-gray-500 font-medium">{subtitle}</p>
                </div>
            </div>
        </motion.div>
    );
}
