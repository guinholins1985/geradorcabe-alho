import React, { useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { CanvasArea } from './components/CanvasArea';
import { DownloadIcon, NewTabIcon, LoaderIcon, ResetIcon } from './components/icons';

const App: React.FC = () => {
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [activityImage, setActivityImage] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(25); // Default height 25%
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (file: File, setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateImage = useCallback(async (output: 'download' | 'newTab') => {
    const canvasElement = canvasRef.current;
    if (!canvasElement || !headerImage || !activityImage) {
      alert("Por favor, carregue a imagem do cabeçalho e da atividade.");
      return;
    }
    
    setIsLoading(true);

    // Prepare for capture
    const headerAreaIndicator = canvasElement.querySelector('.header-area-indicator') as HTMLElement;
    const tempHeader = document.createElement('img');
    
    try {
      // Hide UI indicator
      if (headerAreaIndicator) headerAreaIndicator.style.display = 'none';

      // Create and style the temporary header for capture
      tempHeader.src = headerImage;
      tempHeader.style.position = 'absolute';
      tempHeader.style.top = '0';
      tempHeader.style.left = '0';
      tempHeader.style.width = '100%';
      tempHeader.style.height = `${headerHeight}%`;
      tempHeader.style.objectFit = 'fill'; // Stretch to fill the area
      tempHeader.id = 'temp-header-for-capture';
      
      // Add header to the canvas for capture
      canvasElement.appendChild(tempHeader);
      
      const canvas = await (window as any).html2canvas(canvasElement, {
        scale: 4, // Higher scale for "4K" quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const dataUrl = canvas.toDataURL('image/png');

      if (output === 'download') {
        const link = document.createElement('a');
        link.download = 'atividade_com_cabecalho.png';
        link.href = dataUrl;
        link.click();
      } else {
        const newWindow = window.open();
        newWindow?.document.write(`<img src="${dataUrl}" style="max-width: 100%; height: auto;" alt="Atividade Gerada" />`);
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      alert("Ocorreu um erro ao gerar a imagem. Tente novamente.");
    } finally {
      // Cleanup: remove temporary header and restore UI indicator
      if (tempHeader.parentNode === canvasElement) {
        canvasElement.removeChild(tempHeader);
      }
      if (headerAreaIndicator) headerAreaIndicator.style.display = 'block';
      setIsLoading(false);
    }
  }, [headerImage, activityImage, headerHeight]);

  const handleNewActivity = () => {
    const confirmReset = window.confirm("Você tem certeza que deseja começar uma nova atividade? O trabalho atual será perdido.");
    if (confirmReset) {
      setHeaderImage(null);
      setActivityImage(null);
      setHeaderHeight(25);

      // Manually reset the file input elements to allow re-uploading the same file
      const headerInput = document.getElementById('header-upload') as HTMLInputElement;
      if (headerInput) headerInput.value = '';

      const activityInput = document.getElementById('activity-upload') as HTMLInputElement;
      if (activityInput) activityInput.value = '';
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
            <FileUpload
              id="header-upload"
              label="1. Importar Cabeçalho"
              onFileSelect={(file) => handleFileChange(file, setHeaderImage)}
              imageSrc={headerImage}
            />
            <FileUpload
              id="activity-upload"
              label="2. Importar Atividade"
              onFileSelect={(file) => handleFileChange(file, setActivityImage)}
              imageSrc={activityImage}
            />
          </div>
          
          {headerImage && activityImage && (
            <>
              <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-bold text-slate-700 mb-4">3. Ajustar Área</h3>
                <div>
                  <label htmlFor="header-height" className="block text-lg font-semibold text-slate-600 mb-3">
                    Altura do Cabeçalho
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      id="header-height"
                      type="range"
                      min="5"
                      max="50"
                      value={headerHeight}
                      onChange={(e) => setHeaderHeight(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-semibold text-slate-600 w-12 text-right">{headerHeight}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-bold text-slate-700 mb-4">4. Exportar Resultado</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => generateImage('download')}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <LoaderIcon /> : <DownloadIcon />}
                    <span className="ml-2">Baixar em PNG (4K)</span>
                  </button>
                  <button
                    onClick={() => generateImage('newTab')}
                    disabled={isLoading}
                    className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <LoaderIcon /> : <NewTabIcon />}
                    <span className="ml-2">Abrir em Nova Aba</span>
                  </button>
                </div>
              </div>
            </>
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