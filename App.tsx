import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Controls from './components/Controls.tsx';
import EditorCanvas from './components/EditorCanvas.tsx';
import type { MapContent } from './types.ts';

// This is needed for TypeScript to recognize the global variable from the CDN script
declare const htmlToImage: any;

/*
  Adriano Calmon da Silva Queiroz - 2025
*/

const fonts = {
  'Montserrat': { className: 'font-montserrat', style: "'Montserrat', sans-serif" },
  'Lato': { className: 'font-lato', style: "'Lato', sans-serif" },
  'Noto Sans': { className: 'font-noto-sans', style: "'Noto Sans', sans-serif" },
  'Nunito Sans': { className: 'font-nunito-sans', style: "'Nunito Sans', sans-serif" },
  'Open Sans': { className: 'font-open-sans', style: "'Open Sans', sans-serif" },
  'Poppins': { className: 'font-poppins', style: "'Poppins', sans-serif" },
  'Roboto': { className: 'font-roboto', style: "'Roboto', sans-serif" },
  'Source Sans Pro': { className: 'font-source-sans-pro', style: "'Source Sans Pro', sans-serif" },
};

const blankContent: MapContent = {
    topLeftLine1: 'Mapa',
    topLeftLine2: '',
    topRightLine1: '',
    topRightLine2: '',
    bottomText: '',
    mapImage: null,
};


function App() {
    const [content, setContent] = useState<MapContent>(blankContent);
    const [selectedFont, setSelectedFont] = useState('Montserrat');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [mapSource, setMapSource] = useState<'image' | 'address' | 'coordinates' | 'gps'>('image');
    const [isGeneratingMap, setIsGeneratingMap] = useState(false);
    const [isGettingGps, setIsGettingGps] = useState(false);
    const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lon: number } | null>(null);
    const [coordinateString, setCoordinateString] = useState('');
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fontUrl = 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Montserrat:wght@400;700;900&family=Noto+Sans:wght@400;700&family=Nunito+Sans:wght@400;700;900&family=Open+Sans:wght@400;700&family=Poppins:wght@400;700;900&family=Roboto:wght@400;700;900&family=Source+Sans+Pro:wght@400;700&display=swap';
    
        const embedFonts = async () => {
            try {
                const cssResponse = await fetch(fontUrl);
                if (!cssResponse.ok) throw new Error('Falha ao buscar o CSS da fonte.');
                let cssText = await cssResponse.text();
    
                const fontUrls = cssText.match(/url\(https?:\/\/[^)]+\)/g) || [];
    
                const fontPromises = fontUrls.map(async (urlMatch) => {
                    const fontFileUrl = urlMatch.replace(/url\((['"]?)(.*?)\1\)/, '$2');
                    try {
                        const fontResponse = await fetch(fontFileUrl);
                        if (!fontResponse.ok) return { originalUrl: urlMatch, dataUrl: null };
                        const blob = await fontResponse.blob();
                        return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                resolve({ originalUrl: urlMatch, dataUrl: `url(${reader.result})` });
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                    } catch (error) {
                        console.error(`Falha ao buscar/embutir fonte: ${fontFileUrl}`, error);
                        return { originalUrl: urlMatch, dataUrl: null };
                    }
                });
    
                const embeddedFonts = await Promise.all(fontPromises as Promise<{originalUrl: string; dataUrl: string | null;}>[]);
    
                for (const { originalUrl, dataUrl } of embeddedFonts) {
                    if (dataUrl) {
                        cssText = cssText.replace(originalUrl, dataUrl);
                    }
                }
    
                const styleElement = document.createElement('style');
                styleElement.textContent = cssText;
                document.head.appendChild(styleElement);
    
            } catch (error) {
                console.error('Erro ao embutir fontes:', error);
                // Como fallback, adiciona a tag de link original para que as fontes funcionem na tela.
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = fontUrl;
                document.head.appendChild(link);
            }
        };
    
        embedFonts();
    }, []); // Executa apenas uma vez na montagem do componente

    const handleContentChange = useCallback(<K extends keyof MapContent>(key: K, value: MapContent[K]) => {
        setContent(prev => ({ ...prev, [key]: value }));
    }, []);
    
    const handleFontChange = useCallback((fontName: string) => {
        if (fonts[fontName]) {
            setSelectedFont(fontName);
        }
    }, []);

    const handleMapSourceChange = useCallback((source: 'image' | 'address' | 'coordinates' | 'gps') => {
        setMapSource(source);
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setContent(prev => ({ ...prev, mapImage: reader.result as string }));
                setMapCoordinates(null);
                setMapSource('image');
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleRemoveImage = useCallback(() => {
        setContent(prev => ({ ...prev, mapImage: null }));
        setMapCoordinates(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    }, []);

    const handleReset = useCallback(() => {
        setContent(blankContent);
        setMapCoordinates(null);
        setMapSource('image');
        setCoordinateString('');
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    }, []);

    const handleGenerateMapFromAddress = useCallback(async () => {
        const { bottomText, topRightLine1, topRightLine2 } = content;
        const address = [bottomText, topRightLine1, topRightLine2]
            .filter(Boolean)
            .join(', ');
    
        if (!address) {
            alert('Por favor, preencha os campos de endereço, bairro e cidade para gerar o mapa.');
            return;
        }
    
        setIsGeneratingMap(true);
        
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error('A chave da API do Gemini não está configurada.');

            const prompt = `Encontre as coordenadas geográficas (latitude e longitude) para o local a seguir. A informação principal para a busca é o 'Endereço'. Use 'Bairro' e 'Cidade' como informações de apoio para garantir a precisão. Dê prioridade máxima ao 'Endereço'. Endereço: "${bottomText}", Bairro: "${topRightLine1}", Cidade: "${topRightLine2}". Responda apenas com um objeto JSON com as chaves "latitude" e "longitude".`;
    
            const ai = new GoogleGenAI({ apiKey });
            const geoResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            latitude: { type: Type.NUMBER },
                            longitude: { type: Type.NUMBER },
                        },
                        required: ["latitude", "longitude"],
                    },
                },
            });
            
            const resultJson = JSON.parse(geoResponse.text);
            const latitude = parseFloat(resultJson.latitude);
            const longitude = parseFloat(resultJson.longitude);

            if (isNaN(latitude) || isNaN(longitude)) {
                throw new Error("Não foi possível obter coordenadas válidas para o endereço fornecido.");
            }
            
            setContent(prev => ({ ...prev, mapImage: null }));
            setMapCoordinates({ lat: latitude, lon: longitude });

        } catch (error) {
            console.error('Erro ao gerar coordenadas:', error);
            alert(`Erro ao obter localização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setIsGeneratingMap(false);
        }
    }, [content]);

    const handleGenerateMapFromCoordinates = useCallback(() => {
        if (!coordinateString) {
            alert('Por favor, insira as coordenadas.');
            return;
        }
    
        const parts = coordinateString.split(',').map(part => part.trim());
        if (parts.length !== 2) {
            alert('Formato de coordenadas inválido. Use o formato "latitude, longitude".');
            return;
        }
    
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
    
        if (isNaN(lat) || isNaN(lon)) {
            alert('Coordenadas inválidas. Latitude e longitude devem ser números.');
            return;
        }
    
        setContent(prev => ({ ...prev, mapImage: null }));
        setMapCoordinates({ lat, lon });
    }, [coordinateString]);

    const handleGenerateMapFromGps = useCallback(() => {
        if (!navigator.geolocation) {
            alert('A geolocalização não é suportada por este navegador.');
            return;
        }

        if (!window.isSecureContext) {
            alert('A geolocalização está disponível apenas em conexões seguras (HTTPS).');
            return;
        }

        setIsGettingGps(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setContent(prev => ({ ...prev, mapImage: null }));
                setMapCoordinates({ lat: latitude, lon: longitude });
                setIsGettingGps(false);
            },
            (error) => {
                console.error(`Erro ao obter localização GPS (código ${error.code}): ${error.message}`);
                let errorMessage = "Ocorreu um erro desconhecido ao obter a localização.";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Você negou a permissão para a localização.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "A informação de localização não está disponível. Verifique as configurações do seu dispositivo.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "A requisição para obter a localização expirou.";
                        break;
                }
                alert(errorMessage);
                setIsGettingGps(false);
            }
        );
    }, []);

    const captureCanvasAsPng = useCallback(async (): Promise<string> => {
        const node = canvasRef.current;
        if (!node) throw new Error('A área de visualização não está pronta.');
    
        try {
            const targetWidth = 1200;
            // Get the actual on-screen width of the element to calculate the required scale factor.
            const sourceWidth = node.offsetWidth;
            
            // The pixelRatio is the multiplier to scale the source width up to the target width.
            const pixelRatio = targetWidth / sourceWidth;
    
            const options = {
                // By specifying a pixelRatio, we are telling the library to create an image
                // that is 'pixelRatio' times larger than the on-screen element.
                // This effectively creates a high-resolution "screenshot" of the current view,
                // preserving the exact composition seen in the editor.
                pixelRatio,
                cacheBust: true,
                allowTaint: true,
                useCORS: true,
            };
    
            return await htmlToImage.toPng(node, options);
        } catch (error) {
            console.error("Oops, algo deu errado!", error);
            throw new Error("Falha ao preparar a imagem para captura. Verifique se a imagem do mapa pode ser acessada corretamente.");
        }
    }, []);


    const handleDownload = useCallback(async () => {
        if (!content.mapImage && !mapCoordinates) {
            alert('Por favor, importe ou gere uma imagem de mapa primeiro.');
            return;
        }
        setIsDownloading(true);
        try {
            const dataUrl = await captureCanvasAsPng();
            const mapNumber = content.topLeftLine2?.trim();
            const filename = mapNumber ? `mapa_${mapNumber.replace(/[^a-z0-9]/gi, '_')}.png` : 'mapa_personalizado.png';
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Oops, algo deu errado!', error);
            alert(`Falha ao gerar a imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setIsDownloading(false);
        }
    }, [content.topLeftLine2, mapCoordinates, content.mapImage, captureCanvasAsPng]);

    const handleShare = useCallback(async () => {
        if (!content.mapImage && !mapCoordinates) {
            alert('Por favor, importe ou gere uma imagem de mapa primeiro.');
            return;
        }
        if (!navigator.share) {
            alert('O seu navegador não suporta a função de compartilhamento.');
            return;
        }

        setIsSharing(true);
        try {
            const dataUrl = await captureCanvasAsPng();
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const mapNumber = content.topLeftLine2?.trim();
            const filename = mapNumber ? `mapa_${mapNumber.replace(/[^a-z0-9]/gi, '_')}.png` : 'mapa_personalizado.png';
            const file = new File([blob], filename, { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Mapa Personalizado - ${mapNumber || ''}`,
                    text: 'Veja o mapa que eu criei com o Gerador de Mapa!',
                });
            } else {
                alert('Não é possível compartilhar esta imagem neste dispositivo.');
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                 console.error('Erro ao compartilhar:', error);
                 alert(`Falha ao compartilhar a imagem: ${error.message}`);
            }
        } finally {
            setIsSharing(false);
        }
    }, [content.topLeftLine2, mapCoordinates, content.mapImage, captureCanvasAsPng]);

    return (
        <div className="font-roboto min-h-screen flex flex-col md:flex-row text-gray-800">
            <aside className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 bg-white p-4 md:p-6 shadow-lg md:h-screen md:overflow-y-auto">
                <Controls 
                    content={content}
                    onContentChange={handleContentChange}
                    onFileChange={handleFileChange}
                    onRemoveImage={handleRemoveImage}
                    onDownload={handleDownload}
                    onShare={handleShare}
                    onReset={handleReset}
                    isDownloading={isDownloading}
                    isSharing={isSharing}
                    fonts={fonts}
                    selectedFont={selectedFont}
                    onFontChange={handleFontChange}
                    mapSource={mapSource}
                    onMapSourceChange={handleMapSourceChange}
                    onGenerateMapFromAddress={handleGenerateMapFromAddress}
                    isGeneratingMap={isGeneratingMap}
                    hasMapContent={!!content.mapImage || !!mapCoordinates}
                    coordinateString={coordinateString}
                    onCoordinateStringChange={setCoordinateString}
                    onGenerateMapFromCoordinates={handleGenerateMapFromCoordinates}
                    onGenerateMapFromGps={handleGenerateMapFromGps}
                    isGettingGps={isGettingGps}
                />
            </aside>
            <main className="flex-1 p-4 md:p-8 flex items-center justify-center bg-slate-100">
                 <EditorCanvas 
                    content={content}
                    canvasRef={canvasRef}
                    font={fonts[selectedFont]}
                    mapCoordinates={mapCoordinates}
                />
            </main>
        </div>
    );
}

export default App;