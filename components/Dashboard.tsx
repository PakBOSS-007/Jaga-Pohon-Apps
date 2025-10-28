
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Trees, Droplets, Wind, DollarSign, ClipboardCopy } from 'lucide-react';

import type { TreeData } from '../types';
import { TreeCondition } from '../types';

interface DashboardProps {
  trees: TreeData[];
}

export const Dashboard: React.FC<DashboardProps> = ({ trees }) => {
  const [copyStatus, setCopyStatus] = useState('Salin untuk Sheets');

  const stats = useMemo(() => {
    if (trees.length === 0) {
        return { 
            totalTrees: 0, 
            totalCarbon: 0,
            totalStormwater: 0,
            totalPollution: 0,
            totalMonetaryValue: 0,
            speciesData: [],
            monetaryBreakdown: [],
            carbonByConditionData: [],
        };
    }
    const totalTrees = trees.length;
    const totalCarbon = trees.reduce((acc, tree) => acc + tree.carbon.co2Sequestrated, 0);
    const totalStormwater = trees.reduce((acc, tree) => acc + tree.ecosystemServices.stormwaterInterceptedLiters, 0);
    const totalPollution = trees.reduce((acc, tree) => acc + tree.ecosystemServices.airPollutionRemovedGrams, 0);
    const totalMonetaryValue = trees.reduce((acc, tree) => acc + tree.ecosystemServices.annualMonetaryValue.total, 0);

    const totalValueCarbon = trees.reduce((acc, tree) => acc + tree.ecosystemServices.annualMonetaryValue.carbon, 0);
    const totalValueStormwater = trees.reduce((acc, tree) => acc + tree.ecosystemServices.annualMonetaryValue.stormwater, 0);
    const totalValueAirQuality = trees.reduce((acc, tree) => acc + tree.ecosystemServices.annualMonetaryValue.airQuality, 0);
    const totalValueEnergy = trees.reduce((acc, tree) => acc + tree.ecosystemServices.annualMonetaryValue.energy, 0);

    const speciesCount: { [key: string]: number } = trees.reduce((acc, tree) => {
      acc[tree.species] = (acc[tree.species] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    const speciesData = Object.entries(speciesCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const monetaryBreakdown = [
        { name: 'Penyimpanan Karbon', value: totalValueCarbon },
        { name: 'Manajemen Air Hujan', value: totalValueStormwater },
        { name: 'Kualitas Udara', value: totalValueAirQuality },
        { name: 'Penghematan Energi', value: totalValueEnergy },
    ].filter(item => item.value > 0);

    const carbonByCondition = trees.reduce((acc, tree) => {
        const condition = tree.condition;
        if (!acc[condition]) {
            acc[condition] = 0;
        }
        acc[condition] += tree.carbon.co2Sequestrated;
        return acc;
    }, {} as { [key in TreeCondition]?: number });

    const conditionOrder: TreeCondition[] = [TreeCondition.HEALTHY, TreeCondition.DAMAGED, TreeCondition.DEAD];
    const carbonByConditionData = conditionOrder
        .map(condition => ({
            name: condition,
            co2: carbonByCondition[condition] ? parseFloat(carbonByCondition[condition]!.toFixed(2)) : 0,
        }))
        .filter(item => item.co2 > 0);

    return { totalTrees, totalCarbon, totalStormwater, totalPollution, totalMonetaryValue, speciesData, monetaryBreakdown, carbonByConditionData };
  }, [trees]);

  const downloadCSV = () => {
    const headers = "ID,Spesies,DBH (cm),Tinggi (m),Kondisi,Jarak ke Bangunan,Lintang,Bujur,Tanggal Inventaris,Biomassa (kg),Karbon Tersimpan (kg),CO2 Tersekap (kg),Air Hujan Dicegat (L/thn),Polusi Udara Dihilangkan (g/thn),Nilai Tahunan (Rp),Catatan\n";
    const rows = trees.map(t => 
      [
        t.id,
        `"${t.species.replace(/"/g, '""')}"`,
        t.dbh,
        t.height,
        t.condition,
        t.proximityToBuilding,
        t.latitude,
        t.longitude,
        t.inventoryDate,
        t.carbon.biomass.toFixed(2),
        t.carbon.carbonStored.toFixed(2),
        t.carbon.co2Sequestrated.toFixed(2),
        t.ecosystemServices.stormwaterInterceptedLiters.toFixed(2),
        t.ecosystemServices.airPollutionRemovedGrams.toFixed(2),
        t.ecosystemServices.annualMonetaryValue.total.toFixed(0),
        `"${t.notes.replace(/"/g, '""')}"`
      ].join(',')
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "data_inventaris_pohon_lengkap.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyForSheets = () => {
    const headers = "ID\tSpesies\tDBH (cm)\tTinggi (m)\tKondisi\tJarak ke Bangunan\tLintang\tBujur\tTanggal Inventaris\tBiomassa (kg)\tKarbon Tersimpan (kg)\tCO2 Tersekap (kg)\tAir Hujan Dicegat (L/thn)\tPolusi Udara Dihilangkan (g/thn)\tNilai Tahunan (Rp)\tCatatan\n";
    const rows = trees.map(t => 
      [
        t.id,
        t.species,
        t.dbh,
        t.height,
        t.condition,
        t.proximityToBuilding,
        t.latitude,
        t.longitude,
        t.inventoryDate,
        t.carbon.biomass.toFixed(2),
        t.carbon.carbonStored.toFixed(2),
        t.carbon.co2Sequestrated.toFixed(2),
        t.ecosystemServices.stormwaterInterceptedLiters.toFixed(2),
        t.ecosystemServices.airPollutionRemovedGrams.toFixed(2),
        t.ecosystemServices.annualMonetaryValue.total.toFixed(0),
        t.notes
      ].join('\t')
    ).join('\n');

    navigator.clipboard.writeText(headers + rows).then(() => {
        setCopyStatus('Berhasil disalin!');
        setTimeout(() => setCopyStatus('Salin untuk Sheets'), 2000);
    }, () => {
        setCopyStatus('Gagal menyalin');
        setTimeout(() => setCopyStatus('Salin untuk Sheets'), 2000);
    });
  };


  const StatCard = ({ title, value, unit, icon: Icon, delay }: { title: string, value: string, unit: string, icon: React.ElementType, delay: number }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 fade-in-item" style={{ animationDelay: `${delay}ms` }}>
        <div className="bg-green-100 p-3 rounded-full">
            <Icon className="h-6 w-6 text-green-700" />
        </div>
        <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value} <span className="text-base font-medium text-gray-600">{unit}</span></p>
        </div>
    </div>
  );

  const COLORS = ['#16a34a', '#f97316', '#3b82f6', '#facc15'];
  const CONDITION_COLORS = {
    [TreeCondition.HEALTHY]: '#16a34a', // green-600
    [TreeCondition.DAMAGED]: '#f59e0b', // amber-500
    [TreeCondition.DEAD]: '#6b7280',    // gray-500
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pohon" value={stats.totalTrees.toString()} unit="pohon" icon={Trees} delay={0} />
        <StatCard title="Air Hujan Dicegah" value={(stats.totalStormwater / 1000).toFixed(2)} unit="kL/thn" icon={Droplets} delay={100} />
        <StatCard title="Polutan Dihilangkan" value={(stats.totalPollution / 1000).toFixed(2)} unit="kg/thn" icon={Wind} delay={200} />
        <StatCard title="Total Nilai Tahunan" value={`Rp ${stats.totalMonetaryValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`} unit="/thn" icon={DollarSign} delay={300} />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md fade-in-item" style={{ animationDelay: '400ms' }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Spesies</h3>
            <div id="species-chart-container" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                {stats.speciesData.length > 0 ? (
                    <BarChart data={stats.speciesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontFamily: 'Poppins', fontSize: 12 }} />
                    <YAxis tick={{ fontFamily: 'Poppins', fontSize: 12 }}/>
                    <Tooltip contentStyle={{ fontFamily: 'Poppins', borderRadius: '0.5rem' }} />
                    <Legend wrapperStyle={{ fontFamily: 'Poppins' }} />
                    <Bar dataKey="value" fill="#16a34a" name="Jumlah Pohon" radius={[4, 4, 0, 0]} />
                    </BarChart>
                ) : <div className="flex items-center justify-center h-full"><p className="text-center text-gray-500">Tidak ada data untuk ditampilkan. Tambahkan pohon untuk memulai!</p></div>}
            </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md fade-in-item" style={{ animationDelay: '500ms' }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rincian Nilai Tahunan</h3>
            <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                    {stats.monetaryBreakdown.length > 0 ? (
                        <PieChart>
                             <Pie data={stats.monetaryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                                {stats.monetaryBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`} contentStyle={{ fontFamily: 'Poppins', borderRadius: '0.5rem' }}/>
                            <Legend wrapperStyle={{ fontFamily: 'Poppins', fontSize: 12 }} />
                        </PieChart>
                    ) : <div className="flex items-center justify-center h-full"><p className="text-center text-gray-500">Tidak ada data nilai yang tersedia.</p></div>}
                </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md fade-in-item" style={{ animationDelay: '600ms' }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Karbon Tersekap berdasarkan Kondisi</h3>
            <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                    {stats.carbonByConditionData.length > 0 ? (
                        <BarChart data={stats.carbonByConditionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fontFamily: 'Poppins', fontSize: 12 }} />
                            <YAxis tick={{ fontFamily: 'Poppins', fontSize: 12 }} unit=" kg" />
                            <Tooltip
                                contentStyle={{ fontFamily: 'Poppins', borderRadius: '0.5rem' }}
                                formatter={(value: number) => [`${value.toLocaleString('id-ID')} kg`, 'CO₂ Tersekap']}
                            />
                            <Bar dataKey="co2" name="CO₂ Tersekap" radius={[4, 4, 0, 0]}>
                                {stats.carbonByConditionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CONDITION_COLORS[entry.name as TreeCondition]} />
                                ))}
                            </Bar>
                        </BarChart>
                    ) : <div className="flex items-center justify-center h-full"><p className="text-center text-gray-500">Tidak ada data karbon untuk ditampilkan.</p></div>}
                </ResponsiveContainer>
            </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-md fade-in-item" style={{ animationDelay: '700ms' }}>
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Data Inventaris Lengkap</h3>
            <div className="flex items-center space-x-2">
                 <button
                    onClick={copyForSheets}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                  >
                    <ClipboardCopy className="h-5 w-5" />
                    <span className="text-sm font-medium">{copyStatus}</span>
                </button>
                <button
                    onClick={downloadCSV}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
                  >
                    <Download className="h-5 w-5" />
                    <span className="text-sm font-medium">Ekspor ke CSV</span>
                </button>
            </div>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Spesies</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">DBH (cm)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CO₂ (kg/thn)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nilai (Rp/thn)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kondisi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trees.length > 0 ? trees.map(tree => (
                <tr key={tree.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tree.species}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tree.dbh}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tree.carbon.co2Sequestrated.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">Rp {tree.ecosystemServices.annualMonetaryValue.total.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tree.condition}</td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">Tidak ada data pohon yang tersedia.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
