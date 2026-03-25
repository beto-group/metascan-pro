import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { App, ItemView, WorkspaceLeaf, setIcon } from 'obsidian';

interface DOMNode {
    localName: string;
    id: string;
    className: string;
    width: number;
    height: number;
    innerText: string;
    attributes: string[];
}

export const MetascanDashboard = ({ app }: { app: App }) => {
    const [isInspecting, setIsInspecting] = useState(false);
    const [node, setNode] = useState<DOMNode | null>(null);
    const [logs, setLogs] = useState<string[]>(["PLUGIN_LOADED", "V10_CORE_ACTIVE"]);
    const [copied, setCopied] = useState(false);

    const overlayRef = useRef<HTMLDivElement | null>(null);
    const highlighterRef = useRef<HTMLDivElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const isInspectingRef = useRef(false);

    useEffect(() => { isInspectingRef.current = isInspecting; }, [isInspecting]);

    const addLog = useCallback((m: string) => setLogs(p => [m, ...p].slice(0, 10)), []);

    const TOKENS = {
        primary: 'oklch(65.41% 0.176 285.34)',
        bg: 'oklch(14.5% 0.012 285.34)',
        surface: 'rgba(15, 23, 42, 0.6)',
        border: 'rgba(139, 92, 246, 0.15)',
        textDim: 'oklch(70% 0.01 285.34)',
        textBright: 'oklch(95% 0.005 285.34)',
        accentGold: 'oklch(80% 0.15 85)',
        accentPink: 'oklch(75% 0.18 330)',
        accentGreen: 'oklch(75% 0.18 150)'
    };

    const handleCopy = () => {
        if (!node) return;
        navigator.clipboard.writeText(JSON.stringify(node, null, 2));
        setCopied(true);
        addLog("CLIPBOARD_UPDATED");
        setTimeout(() => setCopied(false), 2000);
    };

    // --- Selection Logic ---
    useEffect(() => {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', zIndex: '999999', display: 'none', cursor: 'crosshair' });
        const highlight = document.createElement('div');
        Object.assign(highlight.style, { position: 'fixed', border: `2px solid ${TOKENS.primary}`, background: 'rgba(139,92,246,0.1)', zIndex: '999998', display: 'none', pointerEvents: 'none', borderRadius: '4px' });
        const tooltip = document.createElement('div');
        Object.assign(tooltip.style, { position: 'fixed', padding: '10px 16px', background: 'rgba(15,23,42,0.95)', border: `1px solid ${TOKENS.border}`, color: '#fff', borderRadius: '10px', fontSize: '11px', zIndex: '1000000', display: 'none', pointerEvents: 'none', fontFamily: 'JetBrains Mono' });
        
        document.body.appendChild(overlay); document.body.appendChild(highlight); document.body.appendChild(tooltip);
        overlayRef.current = overlay; highlighterRef.current = highlight; tooltipRef.current = tooltip;

        const handleMove = (e: MouseEvent) => {
            if (!isInspectingRef.current) return;
            overlay.style.pointerEvents = 'none';
            const t = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
            overlay.style.pointerEvents = 'auto';
            if (t && t !== overlay && t !== highlight && t !== tooltip) {
                const r = t.getBoundingClientRect();
                Object.assign(highlight.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
                tooltip.innerHTML = `<span style="color:${TOKENS.accentPink}">${t.localName}</span><span style="color:${TOKENS.accentGold}">${t.id ? '#'+t.id:''}</span> <div style="font-size:9px; opacity:0.5">${Math.round(r.width)}×${Math.round(r.height)}</div>`;
                Object.assign(tooltip.style, { display: 'block', top: `${e.clientY+20}px`, left: `${e.clientX+20}px` });
            }
        };

        const handleClick = (e: MouseEvent) => {
            if (!isInspectingRef.current) return;
            e.preventDefault(); overlay.style.pointerEvents = 'none';
            const t = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
            overlay.style.pointerEvents = 'auto';
            if (t) {
                const r = t.getBoundingClientRect();
                setNode({ 
                    localName: t.localName, id: t.id, className: t.className, 
                    width: Math.round(r.width), height: Math.round(r.height), 
                    innerText: t.innerText?.substring(0, 300), 
                    attributes: Array.from(t.attributes).map(a => [a.name, a.value]).flat() 
                });
                addLog(`SELECTED_${t.localName.toUpperCase()}`);
            }
            setIsInspecting(false);
        };

        overlay.addEventListener('mousemove', handleMove); overlay.addEventListener('click', handleClick);
        window.addEventListener('keydown', (e) => { if(e.key === 'Escape' && isInspectingRef.current) setIsInspecting(false); }, { capture: true });
        
        return () => { 
            if (overlay.parentNode) document.body.removeChild(overlay); 
            if (highlight.parentNode) document.body.removeChild(highlight); 
            if (tooltip.parentNode) document.body.removeChild(tooltip); 
        };
    }, []);

    useEffect(() => {
        if (overlayRef.current) overlayRef.current.style.display = isInspecting ? 'block' : 'none';
        if (highlighterRef.current && !isInspecting) highlighterRef.current.style.display = 'none';
        if (tooltipRef.current && !isInspecting) tooltipRef.current.style.display = 'none';
    }, [isInspecting]);

    return (
        <div id="metascan-v10-plugin" style={{ height: '100%', background: TOKENS.bg, color: TOKENS.textBright, fontFamily: 'Outfit, sans-serif', display: 'flex', overflow: 'hidden' }}>
            <aside style={{ width: '380px', flexShrink: 0, borderRight: `1px solid ${TOKENS.border}`, background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', height: '100%', backdropFilter: 'blur(20px)' }}>
                <header style={{ padding: '20px 30px', borderBottom: `1px solid ${TOKENS.border}`, display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: isInspecting ? TOKENS.primary : '#4ade80' }} />
                    <span style={{ fontSize: '11px', fontWeight: '900', color: TOKENS.primary, letterSpacing: '2px' }}>METASCAN PRO</span>
                </header>
                <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <button onClick={() => setIsInspecting(!isInspecting)} style={{ padding: '16px', borderRadius: '12px', border: 'none', background: TOKENS.primary, color: '#fff', fontWeight: '900', cursor: 'pointer' }}>
                        {isInspecting ? "STOP SCAN" : "START SCAN"}
                    </button>
                    <div style={{ background: TOKENS.surface, borderRadius: '15px', padding: '20px', border: `1px solid ${TOKENS.border}` }}>
                        <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '15px' }}>TELEMETRY</div>
                        <div style={{ height: '300px', overflowY: 'auto' }}>
                            {logs.map((l, i) => <div key={i} style={{ fontSize: '11px', fontFamily: 'monospace', marginBottom: '8px', opacity: i === 0 ? 1 : 0.3 }}>{l}</div>)}
                        </div>
                    </div>
                </div>
            </aside>
            <main style={{ flex: 1, minWidth: 0, padding: '50px', display: 'flex', flexDirection: 'column', gap: '40px', overflowY: 'auto' }}>
                <h1 style={{ margin: 0, fontSize: '48px', fontWeight: 900 }}>Analysis Layer</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '30px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', minWidth: 0 }}>
                        <section style={{ background: TOKENS.surface, padding: '30px', borderRadius: '20px', border: `1px solid ${TOKENS.border}`, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <span style={{ fontSize: '10px', opacity: 0.5 }}>SNAPSHOT</span>
                                <button onClick={handleCopy} disabled={!node} style={{ background: 'none', border: 'none', color: TOKENS.primary, cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
                                    {copied ? "COPIED" : "COPY JSON"}
                                </button>
                            </div>
                            {node ? (
                                <div style={{ fontSize: '14px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                    <span style={{ color: TOKENS.accentPink }}>&lt;{node.localName}</span> {node.id && <span><span style={{ color: TOKENS.accentGold }}>id</span>=<span style={{ color: TOKENS.accentGreen }}>"{node.id}"</span></span>} <span style={{ color: TOKENS.accentPink }}>&gt;</span>
                                </div>
                            ) : <div style={{ opacity: 0.1 }}>AWAITING_SIGNAL</div>}
                        </section>
                        <section style={{ background: TOKENS.surface, padding: '30px', borderRadius: '20px', border: `1px solid ${TOKENS.border}`, flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '20px' }}>TRACE</div>
                            <pre style={{ margin: 0, fontSize: '11px', color: TOKENS.accentGreen, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {node ? JSON.stringify(node, null, 2) : "// Standby."}
                            </pre>
                        </section>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div style={{ background: TOKENS.surface, padding: '25px', borderRadius: '15px', border: `1px solid ${TOKENS.border}`, textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '10px' }}>WIDTH</div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: TOKENS.primary }}>{node ? node.width : "---"}</div>
                        </div>
                        <div style={{ background: TOKENS.surface, padding: '25px', borderRadius: '15px', border: `1px solid ${TOKENS.border}`, textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '10px' }}>HEIGHT</div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: TOKENS.primary }}>{node ? node.height : "---"}</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
