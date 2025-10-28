
import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, Trees, TestTube2, MessageSquare, Image as ImageIcon, UploadCloud, Loader2, Sparkles, Home } from 'lucide-react';

import type { TreeData, TreeCondition, TreeAnalysisResult, ProximityToBuilding } from '../types';
import { TreeCondition as TreeConditionEnum } from '../types';

interface DataCollectionFormProps {
  onAddTree: (treeData: Omit<TreeData, 'id' | 'carbon' | 'ecosystemServices'>) => void;
  onAnalyzeImage: (base64Image: string, notes: string) => Promise<TreeAnalysisResult | null>;
  isAnalyzing: boolean;
}

const compressImage = (file: File, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    };
    reader.onerror = (error) => reject(error);
  });
};


export const DataCollectionForm: React.FC<DataCollectionFormProps> = ({ onAddTree, onAnalyzeImage, isAnalyzing }) => {
  const [species, setSpecies] = useState('');
  const [dbh, setDbh] = useState('');
  const [height, setHeight] = useState('');
  const [condition, setCondition] = useState<TreeCondition>(TreeConditionEnum.HEALTHY);
  const [proximityToBuilding, setProximityToBuilding] = useState<ProximityToBuilding>('None');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSpecies('');
    setDbh('');
    setHeight('');
    setCondition(TreeConditionEnum.HEALTHY);
    setProximityToBuilding('None');
    setNotes('');
    setPhoto(null);
    setLatitude('');
    setLongitude('');
    setError(null);
    const fileInput = document.getElementById('tree-photo-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
        },
        () => {
          setError('Tidak dapat mengambil lokasi Anda. Harap masukkan secara manual atau izinkan akses lokasi.');
        }
      );
    } else {
      setError('Geolocation tidak didukung oleh browser Anda.');
    }
  }, []);

  useEffect(() => {
    if (!latitude && !longitude) {
      getCurrentLocation();
    }
  }, [latitude, longitude, getCurrentLocation]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setError(null);
        const compressedBase64 = await compressImage(file);
        setPhoto(compressedBase64);
        const analysisResult = await onAnalyzeImage(compressedBase64.split(',')[1], notes);
        if (analysisResult) {
          setSpecies(analysisResult.species);
          setCondition(analysisResult.condition);
          setDbh(analysisResult.estimatedDbh > 0 ? String(analysisResult.estimatedDbh) : '');
          setHeight(analysisResult.estimatedHeight > 0 ? String(analysisResult.estimatedHeight) : '');
          if (analysisResult.latitude && analysisResult.longitude) {
            setLatitude(String(analysisResult.latitude));
            setLongitude(String(analysisResult.longitude));
          } else {
            getCurrentLocation(); // Fallback to device GPS if not found in image
          }
        }
      } catch (err) {
        console.error(err);
        setError('Tidak dapat memproses gambar. Silakan coba yang lain.');
      }
    }
  }, [onAnalyzeImage, notes, getCurrentLocation]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!photo || !species || !dbh || !height || !latitude || !longitude) {
      setError('Harap isi semua kolom yang wajib diisi dan unggah foto.');
      return;
    }

    const treeData = {
      species,
      dbh: parseFloat(dbh),
      height: parseFloat(height),
      condition,
      proximityToBuilding,
      notes,
      photo,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      inventoryDate: new Date().toISOString(),
    };
    onAddTree(treeData);
    resetForm();
  };

  const InputField = ({ id, label, icon: Icon, ...props }: any) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input id={id} className="block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2.5 transition-all duration-300" {...props} />
      </div>
    </div>
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>}
        
        <div>
          <label htmlFor="tree-photo-upload" className="block text-sm font-medium text-gray-700 mb-1.5">Foto Pohon (Analisis Berbasis AI <Sparkles className="inline h-4 w-4 text-yellow-500" />)</label>
          <div className="mt-1 flex justify-center items-center w-full rounded-lg border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 hover:border-green-400 transition-colors duration-300">
            <div className="space-y-1 text-center">
              {photo ? (
                <img src={photo} alt="Tree preview" className="mx-auto h-48 w-auto rounded-lg object-cover shadow-md" />
              ) : (
                 <div className="flex flex-col items-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                     <div className="flex text-sm text-gray-600 mt-2">
                        <label htmlFor="tree-photo-upload" className="relative cursor-pointer rounded-md bg-white font-medium text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 hover:text-green-500">
                          <span>Unggah file</span>
                          <input id="tree-photo-upload" name="tree-photo-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                        </label>
                        <p className="pl-1">atau seret dan lepas</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG hingga 10MB</p>
                 </div>
              )}
            </div>
          </div>
          {isAnalyzing && (
            <div className="mt-2 flex items-center justify-center text-sm text-green-600">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>AI sedang menganalisis foto Anda, harap tunggu...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField id="species" label="Jenis Pohon" icon={Trees} type="text" value={species} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpecies(e.target.value)} placeholder="contoh: Jati, Pinus" required />
          <InputField id="dbh" label="Diameter (DBH) dalam cm" icon={TestTube2} type="number" step="0.1" value={dbh} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbh(e.target.value)} placeholder="50" required />
          <InputField id="height" label="Tinggi Total dalam meter" icon={TestTube2} type="number" step="0.1" value={height} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeight(e.target.value)} placeholder="25" required />
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1.5">Kondisi</label>
            <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value as TreeCondition)} className="mt-1 block w-full rounded-lg border-gray-300 py-2.5 pl-3 pr-10 text-base focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm" required>
              {Object.values(TreeConditionEnum).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField id="latitude" label="Lintang" icon={MapPin} type="number" step="any" value={latitude} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLatitude(e.target.value)} placeholder="34.0522" required />
            <InputField id="longitude" label="Bujur" icon={MapPin} type="number" step="any" value={longitude} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLongitude(e.target.value)} placeholder="-118.2437" required />
        </div>

         <div>
          <label htmlFor="proximity" className="block text-sm font-medium text-gray-700 mb-1.5">Jarak ke Bangunan</label>
           <div className="relative">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
               <Home className="h-5 w-5 text-gray-400" />
            </div>
            <select id="proximity" value={proximityToBuilding} onChange={(e) => setProximityToBuilding(e.target.value as ProximityToBuilding)} className="block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2.5 transition-all duration-300" required>
                <option value="None">Tidak Ada / Tidak Berlaku</option>
                <option value="Near">Dekat (&lt;15m, memberikan keteduhan)</option>
                <option value="Far">Jauh (&gt;15m)</option>
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">Catatan Tambahan</label>
          <div className="relative">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pt-2.5">
               <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="block w-full rounded-lg border-gray-300 pl-10 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2.5 transition-all duration-300" placeholder="contoh: dekat air mancur, ada sarang lebah..."></textarea>
          </div>
        </div>

        <div>
          <button type="submit" disabled={isAnalyzing} className="flex w-full justify-center items-center rounded-lg border border-transparent bg-green-600 py-3 px-4 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300 transition-all duration-300 transform hover:scale-105 disabled:scale-100">
            {isAnalyzing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Menganalisis...</> : <><UploadCloud className="mr-2 h-5 w-5" /> Tambahkan Pohon ke Inventaris</>}
          </button>
        </div>
      </form>
    </div>
  );
};
