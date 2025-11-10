import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { CanvasArea } from './components/CanvasArea';
import { DownloadIcon, LoaderIcon, ResetIcon, SparklesIcon, ErrorIcon, CheckIcon, PrintIcon } from './components/icons';

interface QueueItem {
  id: string;
  name: string;
  config: {
    headerImage: string;
    activityImage: string;
    headerHeight: number;
  };
  status: 'queued' | 'processing' | 'completed' | 'error';
  result?: string; // dataUrl
}

const App: React.FC = () => {
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [activityImage, setActivityImage] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(25);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (file: File, setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateImageForQueue = useCallback(async (config: QueueItem['config']) => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      throw new Error("Canvas element not found");
    }

    const headerAreaIndicator = canvasElement.querySelector('.header-area-indicator') as HTMLElement;
    const existingActivityImage = canvasElement.querySelector('.activity-image-for-capture') as HTMLImageElement;
    const tempHeader = document.createElement('img');
    const tempActivity = existingActivityImage ? null : document.createElement('img');
    
    try {
      if (headerAreaIndicator) headerAreaIndicator.style.display = 'none';

      // Temporarily set up the canvas with the queue item's config
      if (tempActivity) {
          tempActivity.src = config.activityImage;
          tempActivity.className = "absolute inset-0 w-full h-full object-contain activity-image-for-capture";
          canvasElement.insertBefore(tempActivity, canvasElement.firstChild);
      } else if(existingActivityImage && existingActivityImage.src !== config.activityImage) {
        existingActivityImage.src = config.activityImage;
      }

      tempHeader.src = config.headerImage;
      tempHeader.style.position = 'absolute';
      tempHeader.style.top = '0';
      tempHeader.style.left = '0';
      tempHeader.style.width = '100%';
      tempHeader.style.height = `${config.headerHeight}%`;
      tempHeader.style.objectFit = 'fill';
      
      canvasElement.appendChild(tempHeader);
      
      const canvas = await (window as any).html2canvas(canvasElement, {
        scale: 4,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      return canvas.toDataURL('image/png');

    } finally {
      // Cleanup
      if (tempHeader.parentNode === canvasElement) {
        canvasElement.removeChild(tempHeader);
      }
       if (tempActivity && tempActivity.parentNode === canvasElement) {
        canvasElement.removeChild(tempActivity);
      }
      if (headerAreaIndicator) headerAreaIndicator.style.display = 'block';
    }
  }, []);

  const processQueue = useCallback(async () => {
    const isProcessing = queue.some(item => item.status === 'processing');
    if (isProcessing) return;

    const nextItem = queue.find(item => item.status === 'queued');
    if (nextItem) {
      // Set status to processing
      setQueue(prev => prev.map(item => item.id === nextItem.id ? { ...item, status: 'processing' } : item));
      
      try {
        const dataUrl = await generateImageForQueue(nextItem.config);
        setQueue(prev => prev.map(item =>
          item.id === nextItem.id ? { ...item, status: 'completed', result: dataUrl } : item
        ));
      } catch (error) {
        console.error("Error processing queue item:", error);
        setQueue(prev => prev.map(item =>
          item.id === nextItem.id ? { ...item, status: 'error' } : item
        ));
      }
    }
  }, [queue, generateImageForQueue]);

  useEffect(() => {
    processQueue();
  }, [queue, processQueue]);


  const handleNewActivity = () => {
    const confirmReset = window.confirm("Você tem certeza que deseja começar uma nova atividade? O trabalho atual será perdido.");
    if (confirmReset) {
      setHeaderImage(null);
      setActivityImage(null);
      setHeaderHeight(25);

      const headerInput = document.getElementById('header-upload') as HTMLInputElement;
      if (headerInput) headerInput.value = '';

      const activityInput = document.getElementById('activity-upload') as HTMLInputElement;
      if (activityInput) activityInput.value = '';
    }
  };

  const handleGenerateClick = () => {
    if (!headerImage || !activityImage) {
      alert("Por favor, carregue a imagem do cabeçalho e da atividade.");
      return;
    }
    const newItem: QueueItem = {
      id: Date.now().toString(),
      name: `Atividade ${queue.length + 1}`,
      config: { headerImage, activityImage, headerHeight },
      status: 'queued',
    };
    setQueue(prev => [...prev, newItem]);
  };
  
  const handlePrint = (dataUrl: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.display = 'none';

    const handleLoad = () => {
      if (!iframe.contentWindow) return;

      const handleAfterPrint = () => {
        document.body.removeChild(iframe);
        window.removeEventListener('afterprint', handleAfterPrint);
      };

      window.addEventListener('afterprint', handleAfterPrint);

      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };

    iframe.addEventListener('load', handleLoad);
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Imprimir Atividade</title>
          <style>
            @page { size: A4; margin: 0; }
            body, html { margin: 0; padding: 0; height: 100vh; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; margin: auto; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
        </body>
      </html>
    `);
    doc.close();
  };
  
  const handleDirectPrint = async () => {
    if (!headerImage || !activityImage) {
      alert("Por favor, carregue a imagem do cabeçalho e da atividade.");
      return;
    }
    
    setIsPrinting(true);
    try {
      const config = { headerImage, activityImage, headerHeight };
      const dataUrl = await generateImageForQueue(config);
      handlePrint(dataUrl);
    } catch (error) {
      console.error("Error generating image for printing:", error);
      alert("Ocorreu um erro ao gerar a imagem para impressão. Por favor, tente novamente.");
    } finally {
      setIsPrinting(false);
    }
  };

  const getStatusBadge = (status: QueueItem['status']) => {
    switch (status) {
      case 'queued':
        return <span className="text-xs font-medium mr-2 px-2.5 py-0.5 rounded bg-slate-100 text-slate-800">Na Fila</span>;
      case 'processing':
        return <span className="flex items-center text-xs font-medium mr-2 px-2.5 py-0.5 rounded bg-blue-100 text-blue-800"><LoaderIcon /> <span className="ml-1">Gerando...</span></span>;
      case 'completed':
        return <span className="flex items-center text-xs font-medium mr-2 px-2.5 py-0.5 rounded bg-green-100 text-green-800"><CheckIcon /> <span className="ml-1">Concluído</span></span>;
      case 'error':
        return <span className="flex items-center text-xs font-medium mr-2 px-2.5 py-0.5 rounded bg-red-100 text-red-800"><ErrorIcon /> <span className="ml-1">Erro</span></span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-1/3 xl:w-1/4 bg-white p-6 rounded-2xl shadow-lg h-fit">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-slate-700">Configurações</h2>
            {(headerImage || activityImage) && (
              <button
                onClick={handleNewActivity}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                title="Começar uma nova atividade"
              >
                <ResetIcon />
                <span>Nova Atividade</span>
              </button>
            )}
          </div>

          <div className="space-y-6">
            <FileUpload id="header-upload" label="1. Importar Cabeçalho" onFileSelect={(file) => handleFileChange(file, setHeaderImage)} imageSrc={headerImage} />
            <FileUpload id="activity-upload" label="2. Importar Atividade" onFileSelect={(file) => handleFileChange(file, setActivityImage)} imageSrc={activityImage} />
          </div>
          
          {headerImage && activityImage && (
            <>
              <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-bold text-slate-700 mb-4">3. Ajustar Altura</h3>
                 <label htmlFor="header-height" className="block text-sm font-medium text-slate-600 mb-2">
                  Altura do Cabeçalho: <span className="font-bold">{headerHeight}%</span>
                </label>
                <input
                  id="header-height"
                  type="range"
                  min="10"
                  max="40"
                  value={headerHeight}
                  onChange={(e) => setHeaderHeight(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-bold text-slate-700 mb-4">4. Gerar</h3>
                 <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleGenerateClick} 
                    className="flex-grow bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-slate-400"
                    disabled={isPrinting}
                  >
                    <SparklesIcon />
                    <span className="ml-2">Adicionar à Fila</span>
                  </button>
                  <button 
                      onClick={handleDirectPrint} 
                      disabled={isPrinting}
                      className="flex-shrink-0 bg-white border border-slate-300 text-slate-700 font-bold py-3 px-4 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center disabled:bg-slate-200 disabled:text-slate-500"
                      title="Gerar e Imprimir"
                  >
                      {isPrinting ? <LoaderIcon /> : <PrintIcon />}
                      <span className="ml-2">{isPrinting ? 'Gerando...' : 'Imprimir'}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {queue.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-bold text-slate-700 mb-4">Fila de Geração</h3>
              <ul className="space-y-3">
                {queue.map((item) => (
                  <li key={item.id} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    {item.status === 'completed' && item.result && (
                      <div className="flex items-center gap-3">
                        <a href={item.result} download={`${item.name}.png`} title="Baixar Atividade" className="text-blue-600 hover:text-blue-800">
                          <DownloadIcon />
                        </a>
                        <button onClick={() => handlePrint(item.result!)} title="Imprimir Atividade" className="text-slate-600 hover:text-slate-800">
                          <PrintIcon />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <section className="w-full lg:w-2/3 xl:w-3/4 flex-grow flex items-center justify-center bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
          <CanvasArea ref={canvasRef} headerImage={headerImage} activityImage={activityImage} headerHeight={headerHeight} />
        </section>
      </main>
    </div>
  );
};

export default App;