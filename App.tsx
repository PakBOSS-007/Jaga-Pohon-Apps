
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Trees, Camera, Map as MapIcon, BarChart3, Download, Loader2 } from 'lucide-react';

import type { TreeData, AppView, TreeAnalysisResult } from './types';
import { DataCollectionForm } from './components/DataCollectionForm';
import { MapDisplay } from './components/MapDisplay';
import { Dashboard } from './components/Dashboard';
import { analyzeTreeImage } from './services/geminiService';
import { calculateCarbonMetrics } from './services/carbonCalculator';
import { calculateEcosystemServices } from './services/ecosystemServiceCalculator';
import { generatePdfReport } from './services/pdfGenerator';
import { initialTrees } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('form');
  
  // Muat pohon dari localStorage saat render awal, kembali ke initialTrees
  const [trees, setTrees] = useState<TreeData[]>(() => {
    try {
      const savedTreesJSON = localStorage.getItem('treeInventoryData');
      if (savedTreesJSON) {
        const savedTrees = JSON.parse(savedTreesJSON);
        if (Array.isArray(savedTrees)) {
          return savedTrees;
        }
      }
    } catch (e) {
      console.error("Could not load trees from localStorage", e);
      localStorage.removeItem('treeInventoryData'); // Hapus data yang rusak
    }
    return initialTrees;
  });

  // Simpan pohon ke localStorage setiap kali berubah
  useEffect(() => {
    try {
      localStorage.setItem('treeInventoryData', JSON.stringify(trees));
    } catch (e) {
      console.error("Could not save trees to localStorage", e);
    }
  }, [trees]);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);


  const handleAddTree = useCallback((newTreeData: Omit<TreeData, 'id' | 'carbon' | 'ecosystemServices'>) => {
    const carbonMetrics = calculateCarbonMetrics(newTreeData.dbh, newTreeData.height);
    const ecosystemServices = calculateEcosystemServices(newTreeData.dbh, newTreeData.proximityToBuilding);
    const newTree: TreeData = {
      ...newTreeData,
      id: Date.now(),
      carbon: carbonMetrics,
      ecosystemServices: ecosystemServices,
    };
    setTrees(prevTrees => [newTree, ...prevTrees]);
    setView('dashboard');
  }, []);

  const handleImageAnalysis = useCallback(async (base64Image: string, notes: string): Promise<TreeAnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeTreeImage(base64Image, notes);
      return result;
    } catch (err) {
      console.error("Image analysis failed:", err);
      setError("Gagal menganalisis gambar dengan AI. Harap periksa kunci API Anda dan coba lagi.");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);
  
  const handleGenerateReport = async () => {
      setIsGeneratingReport(true);
      setError(null);
      try {
        await generatePdfReport(trees, '#species-chart-container');
      } catch (e) {
        console.error("Failed to generate PDF report:", e);
        setError("Tidak dapat membuat laporan PDF.");
      } finally {
        setIsGeneratingReport(false);
      }
    };


  const NavButton = useMemo(() => ({
    targetView,
    icon: Icon,
    label
  }: {
    targetView: AppView,
    icon: React.ElementType,
    label: string
  }) => (
    <button
      onClick={() => setView(targetView)}
      className={`flex-1 flex flex-col sm:flex-row items-center justify-center p-2 sm:p-3 space-x-2 rounded-full transition-all duration-300 text-sm font-medium ${
        view === targetView
          ? 'bg-green-600 text-white shadow-lg scale-105'
          : 'bg-white text-gray-600 hover:bg-green-100 hover:text-green-700'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  ), [view]);

  const renderContent = () => {
    switch (view) {
      case 'form':
        return <DataCollectionForm onAddTree={handleAddTree} onAnalyzeImage={handleImageAnalysis} isAnalyzing={isAnalyzing} />;
      case 'map':
        return <MapDisplay trees={trees} />;
      case 'dashboard':
        return <Dashboard trees={trees} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-green-50/50 font-sans flex flex-col">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Trees className="h-8 w-8 text-green-600" />
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Inventarisasi Pohon & Karbon</h1>
          </div>
          {trees.length > 0 && (
             <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 disabled:bg-blue-300 disabled:scale-100"
              >
                {isGeneratingReport ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                <span className="hidden sm:inline text-sm font-medium">{isGeneratingReport ? 'Membuat...' : 'Unduh Laporan'}</span>
            </button>
          )}
        </div>
      </header>
      
      <main 
        className="flex-grow container mx-auto p-4 flex flex-col"
        onFocusCapture={(e) => {
          if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            setIsInputFocused(true);
          }
        }}
        onBlurCapture={() => {
          setIsInputFocused(false);
        }}
      >
         {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md fade-in" role="alert">
            <p className="font-bold">Kesalahan</p>
            <p>{error}</p>
          </div>
        )}
        <div key={view} className="fade-in">
          {renderContent()}
        </div>
      </main>

      {!isInputFocused && (
        <footer className="sticky bottom-0 bg-white/80 backdrop-blur-lg shadow-[0_-2px_10px_rgba(0,0,0,0.05)] p-2 z-20">
          <div className="container mx-auto px-2">
              <div className="flex justify-around items-center bg-gray-100 p-1.5 rounded-full gap-2 shadow-inner">
                  <NavButton targetView="form" icon={Camera} label="Tambah Pohon" />
                  <NavButton targetView="map" icon={MapIcon} label="Tampilan Peta" />
                  <NavButton targetView="dashboard" icon={BarChart3} label="Dasbor" />
              </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
