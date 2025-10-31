import React, { useEffect, useRef, useState } from 'react';
import type { MapContent } from '../types';

// Declare the Leaflet global 'L' for TypeScript since it's loaded from a CDN
declare const L: any;

interface Font {
  className: string;
  style: string;
}

interface EditorCanvasProps {
  content: MapContent;
  canvasRef: React.RefObject<HTMLDivElement>;
  font: Font;
  mapCoordinates: { lat: number; lon: number } | null;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ content, canvasRef, font, mapCoordinates }) => {
    const hasMapContent = content.mapImage || mapCoordinates;

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null); // To hold the Leaflet map instance

    const containerWrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Effect to observe the container width and calculate the scale factor
    useEffect(() => {
        const wrapperElement = containerWrapperRef.current;
        if (!wrapperElement) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width } = entry.contentRect;
                // The desktop standard width is 576px (from sm:max-w-xl)
                // We calculate the scale factor relative to this standard.
                const newScale = width / 576;
                setScale(newScale);
            }
        });

        resizeObserver.observe(wrapperElement);

        return () => {
            if (wrapperElement) {
                resizeObserver.unobserve(wrapperElement);
            }
        };
    }, []);


    useEffect(() => {
        // Initialize map when coordinates are available and the container is rendered
        if (mapCoordinates && mapContainerRef.current) {
            // Clean up any existing map instance before creating a new one
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }

            const { lat, lon } = mapCoordinates;

            // Create the map instance
            const map = L.map(mapContainerRef.current, {
                center: [lat, lon],
                zoom: 17,
                zoomControl: false, // Hide zoom controls for a cleaner image
                attributionControl: false, // Hide attribution for a cleaner image
            });

            // Add the default OpenStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            // Store the instance in a ref for cleanup
            mapInstanceRef.current = map;

            // A common fix for Leaflet to ensure tiles render correctly in dynamic containers
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }

        // Cleanup function: remove the map instance when the component unmounts or coordinates change
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [mapCoordinates]); // This effect re-runs whenever the mapCoordinates prop changes


    const baseTitleSizeRem = 3;
    const baseSubtitleSizeRem = 2.2;
    const baseMarginTopRem = 0.5; // mt-2 = 0.5rem

    const titleStyle = { fontSize: `${baseTitleSizeRem * scale}rem` };
    const subtitleStyle = { 
        fontSize: `${baseSubtitleSizeRem * scale}rem`,
        marginTop: `${baseMarginTopRem * scale}rem`,
    };
    const bottomTextStyle = { fontSize: `${baseSubtitleSizeRem * scale}rem` };

    return (
        <div ref={containerWrapperRef} className="w-full max-w-sm sm:max-w-xl shadow-2xl rounded-lg overflow-hidden">
            <div 
                ref={canvasRef}
                className={`w-full aspect-[3/4] bg-white flex flex-col ${font.className}`}
                style={{ fontFamily: font.style }}
            >
                {/* Header */}
                <header className="bg-brand-green h-[16.67%] p-[5%] flex justify-between items-center text-white relative">
                    <div className="text-left">
                        <h1 className="font-bold leading-none" style={titleStyle}>Mapa</h1>
                        <p className="font-normal leading-none" style={subtitleStyle}>{content.topLeftLine2 || <>&nbsp;</>}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="font-bold leading-none" style={titleStyle}>{content.topRightLine1 || <>&nbsp;</>}</h2>
                        <h2 className="font-normal leading-none" style={subtitleStyle}>{content.topRightLine2 || <>&nbsp;</>}</h2>
                    </div>
                </header>

                {/* Map Area */}
                <div 
                    data-map-area="true"
                    className="h-[66.33%] bg-gray-200 relative"
                >
                    {!hasMapContent && (
                        <div className="w-full h-full flex items-center justify-center text-center text-gray-500 p-4">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13v-6m0-4V3m6 17l5.447-2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m0 13v-6m0-4V3m-6 4l6-3m-6 9l6-3" />
                                </svg>
                                <p className="mt-2 font-semibold">Importe ou gere um mapa</p>
                                <p className="text-sm">A imagem ou o mapa aparecerá aqui.</p>
                            </div>
                        </div>
                    )}

                    {content.mapImage && (
                        <img 
                            src={content.mapImage} 
                            alt="Mapa" 
                            className="w-full h-full object-cover absolute top-0 left-0" 
                        />
                    )}

                    {/* This div is the mount point for the Leaflet map */}
                    {mapCoordinates && (
                        <div ref={mapContainerRef} className="w-full h-full" />
                    )}
                   

                    {/* Purple Marker for generated maps */}
                    {mapCoordinates && (
                        <div 
                            className="absolute w-[1.675rem] h-[1.675rem] sm:w-10 sm:h-10" 
                            style={{ 
                                left: '50%', 
                                top: '50%', 
                                transform: 'translate(-50%, -100%)',
                                filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.5))',
                                pointerEvents: 'none', // Allows interaction with the map underneath
                                zIndex: 1000,
                            }}
                        >
                            <svg viewBox="0 0 384 512" fill="#8b5cf6" xmlns="http://www.w3.org/2000/svg">
                                <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67a24 24 0 01-35.464 0zM192 256c35.346 0 64-28.654 64-64s-28.654-64-64-64-64 28.654-64 64 28.654 64 64 64z"/>
                            </svg>
                        </div>
                    )}
                </div>


                {/* Footer */}
                <footer className="bg-white h-[17%] p-[5%] flex items-start justify-start">
                    <p className="w-full text-brand-green font-bold leading-none text-left break-words" style={bottomTextStyle}>
                        {content.bottomText}
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default EditorCanvas;