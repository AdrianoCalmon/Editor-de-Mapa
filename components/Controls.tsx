import React from 'react';
import type { MapContent } from '../types.ts';

interface Font {
  className: string;
  style: string;
}

interface ControlsProps {
  content: MapContent;
  onContentChange: <K extends keyof MapContent>(key: K, value: MapContent[K]) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onDownload: () => void;
  onShare: () => void;
  onReset: () => void;
  isDownloading: boolean;
  isSharing: boolean;
  fonts: Record<string, Font>;
  selectedFont: string;
  onFontChange: (fontName: string) => void;
  mapSource: 'image' | 'address' | 'coordinates' | 'gps';
  onMapSourceChange: (source: 'image' | 'address' | 'coordinates' | 'gps') => void;
  onGenerateMapFromAddress: () => void;
  isGeneratingMap: boolean;
  hasMapContent: boolean;
  coordinateString: string;
  onCoordinateStringChange: (value: string) => void;
  onGenerateMapFromCoordinates: () => void;
  onGenerateMapFromGps: () => void;
  isGettingGps: boolean;
}

const InputField: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({ label, value, onChange }) => (
    <div className="flex-1 min-w-[100px]">
        <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition"
        />
    </div>
);


const Controls: React.FC<ControlsProps> = ({ 
    content, onContentChange, onFileChange, onRemoveImage, onDownload, onShare, onReset, 
    isDownloading, isSharing, fonts, selectedFont, onFontChange,
    mapSource, onMapSourceChange, onGenerateMapFromAddress, isGeneratingMap,
    hasMapContent, coordinateString, onCoordinateStringChange, onGenerateMapFromCoordinates,
    onGenerateMapFromGps, isGettingGps
}) => {
    const addressIsFilled = !!(content.bottomText || content.topRightLine1 || content.topRightLine2);
    
    return (
        <div className="space-y-3">
            <header className="mb-3">
                 <h1 className="text-xl font-black text-brand-green">Editor de Mapa</h1>
                 <p className="text-sm text-gray-500">Personalize os textos e o mapa.</p>
            </header>

             <div className="space-y-1.5 p-2.5 bg-white rounded-lg border border-gray-200">
                <h2 className="text-md font-bold text-gray-700">Fonte</h2>
                <select
                    value={selectedFont}
                    onChange={(e) => onFontChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition"
                >
                    {Object.keys(fonts).map(fontName => (
                        <option key={fontName} value={fontName}>{fontName}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2.5 p-2.5 bg-white rounded-lg border border-gray-200">
                <h2 className="text-md font-bold text-gray-700">Detalhes do Mapa</h2>
                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Número do Mapa</label>
                    <div className="flex items-center">
                        <span className="px-3 py-1.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-md text-gray-600 font-semibold text-sm">Nº</span>
                        <input
                            type="text"
                            value={content.topLeftLine2}
                            onChange={(e) => onContentChange('topLeftLine2', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-r-md shadow-sm text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <InputField label="Bairro" value={content.topRightLine1} onChange={(e) => onContentChange('topRightLine1', e.target.value)} />
                    <InputField label="Cidade" value={content.topRightLine2} onChange={(e) => onContentChange('topRightLine2', e.target.value)} />
                </div>
                <InputField label="Endereço" value={content.bottomText} onChange={(e) => onContentChange('bottomText', e.target.value)} />
            </div>

            <div className="space-y-1.5 p-2.5 bg-white rounded-lg border border-gray-200">
                <h2 className="text-md font-bold text-gray-700">Origem do Mapa</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="mapSource"
                            value="image"
                            checked={mapSource === 'image'}
                            onChange={() => onMapSourceChange('image')}
                            className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300"
                        />
                        <span className="text-sm">Imagem</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="mapSource"
                            value="address"
                            checked={mapSource === 'address'}
                            onChange={() => onMapSourceChange('address')}
                            className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300"
                        />
                        <span className="text-sm">Endereço</span>
                    </label>
                     <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="mapSource"
                            value="coordinates"
                            checked={mapSource === 'coordinates'}
                            onChange={() => onMapSourceChange('coordinates')}
                            className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300"
                        />
                        <span className="text-sm">Coordenadas</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="mapSource"
                            value="gps"
                            checked={mapSource === 'gps'}
                            onChange={() => onMapSourceChange('gps')}
                            className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300"
                        />
                        <span className="text-sm">GPS</span>
                    </label>
                </div>
            </div>

            {mapSource === 'image' && (
                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                    <label className="block w-full cursor-pointer bg-slate-50 border border-gray-300 rounded-md shadow-sm text-center p-2.5 hover:bg-gray-100 transition">
                        <span className="text-brand-green font-semibold text-sm">Escolher arquivo</span>
                        <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                    </label>
                    {content.mapImage && (
                        <button
                            onClick={onRemoveImage}
                            className="w-full bg-red-500 text-white font-bold py-1.5 px-4 rounded-lg shadow-md hover:bg-red-600 transition-all duration-300 text-sm mt-2"
                        >
                            Apagar Imagem
                        </button>
                    )}
                </div>
            )}

            {mapSource === 'address' && (
                <div className="space-y-2 p-2.5 bg-white rounded-lg border border-gray-200">
                    <h2 className="text-md font-bold text-gray-700">Gerar por Endereço</h2>
                    <p className="text-xs text-gray-500">
                        Use os campos de detalhes do mapa para gerar.
                    </p>
                    <button
                        onClick={onGenerateMapFromAddress}
                        // Fix: Corrected typo from 'addressIsfilled' to 'addressIsFilled'.
                        disabled={isGeneratingMap || !addressIsFilled}
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center mt-1 text-sm"
                    >
                        {isGeneratingMap ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Gerando...
                            </>
                        ) : (
                        'Gerar Mapa'
                        )}
                    </button>
                    {!addressIsFilled && <p className="text-xs text-center text-red-500 mt-1">Preencha o endereço para gerar.</p>}
                </div>
            )}

            {mapSource === 'coordinates' && (
                <div className="space-y-1.5 p-2.5 bg-white rounded-lg border border-gray-200">
                    <h2 className="text-md font-bold text-gray-700">Gerar por Coordenadas</h2>
                    <p className="text-xs text-gray-500">
                        Use o formato: latitude, longitude.
                    </p>
                    <input
                        type="text"
                        value={coordinateString}
                        onChange={(e) => onCoordinateStringChange(e.target.value)}
                        placeholder="-8.05428, -34.8813"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition"
                    />
                    <button
                        onClick={onGenerateMapFromCoordinates}
                        disabled={!coordinateString.trim()}
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center mt-1.5 text-sm"
                    >
                        Gerar Mapa
                    </button>
                </div>
            )}
            
            {mapSource === 'gps' && (
                <div className="space-y-2 p-2.5 bg-white rounded-lg border border-gray-200">
                    <h2 className="text-md font-bold text-gray-700">Gerar por GPS</h2>
                    <p className="text-xs text-gray-500">
                        Use a localização atual do seu dispositivo.
                    </p>
                    <button
                        onClick={onGenerateMapFromGps}
                        disabled={isGettingGps}
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center mt-1 text-sm"
                    >
                        {isGettingGps ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Obtendo Localização...
                            </>
                        ) : (
                        'Gerar Mapa'
                        )}
                    </button>
                </div>
            )}


            <div className="pt-2 space-y-2">
                 <button
                    onClick={onDownload}
                    disabled={isDownloading || !hasMapContent}
                    className="w-full bg-brand-green text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center text-sm"
                >
                    {isDownloading ? (
                         <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Baixando...
                         </>
                    ) : (
                       'Baixar Imagem'
                    )}
                </button>
                {navigator.share && (
                    <button
                        onClick={onShare}
                        disabled={isSharing || !hasMapContent}
                        className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center text-sm"
                    >
                        {isSharing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Compartilhando...
                            </>
                        ) : (
                           'Compartilhar Imagem'
                        )}
                    </button>
                )}
                 <button
                    onClick={onReset}
                    className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-600 transition-all duration-300 text-sm"
                >
                    Resetar
                </button>
                 {!hasMapContent && <p className="text-xs text-center text-red-500 mt-1">Importe ou gere um mapa para continuar.</p>}
            </div>
        </div>
    );
};

export default Controls;