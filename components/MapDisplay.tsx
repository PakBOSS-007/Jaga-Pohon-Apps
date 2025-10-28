
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Leaf, Droplets, Wind, DollarSign } from 'lucide-react';
import type { TreeData } from '../types';

// Fix for default marker icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapDisplayProps {
  trees: TreeData[];
}

export const MapDisplay: React.FC<MapDisplayProps> = ({ trees }) => {
  const center: L.LatLngExpression = trees.length > 0 ? [trees[0].latitude, trees[0].longitude] : [34.0522, -118.2437];

  const StatItem = ({ icon: Icon, value, label }: { icon: React.ElementType, value: string, label: string }) => (
    <div className="flex items-center space-x-2">
        <Icon className="h-4 w-4 text-green-600 flex-shrink-0" />
        <span className="text-sm text-gray-700">{value} <span className="text-gray-500">{label}</span></span>
    </div>
  );

  return (
    <div className="h-[calc(100vh-200px)] md:h-[calc(100vh-160px)] w-full rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {trees.map(tree => (
          <Marker key={tree.id} position={[tree.latitude, tree.longitude]}>
            <Popup>
              <div className="w-72 font-sans">
                <img src={tree.photo} alt={tree.species} className="w-full h-32 object-cover rounded-t-lg" />
                <div className="p-3">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{tree.species}</h3>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p><strong>Kondisi:</strong> {tree.condition}</p>
                    <p><strong>DBH:</strong> {tree.dbh} cm, <strong>Tinggi:</strong> {tree.height} m</p>
                  </div>

                  <div className="space-y-1.5 border-t border-gray-200 pt-2">
                     <h4 className="font-semibold text-sm text-gray-600">Manfaat Eko Tahunan:</h4>
                     <StatItem icon={Leaf} value={`${tree.carbon.co2Sequestrated.toFixed(2)} kg`} label="CO₂" />
                     <StatItem icon={Droplets} value={`${tree.ecosystemServices.stormwaterInterceptedLiters.toFixed(0)} L`} label="Air Hujan" />
                     <StatItem icon={Wind} value={`${tree.ecosystemServices.airPollutionRemovedGrams.toFixed(2)} g`} label="Polutan" />
                     <StatItem icon={DollarSign} value={`Rp ${tree.ecosystemServices.annualMonetaryValue.total.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`} label="Nilai Est./thn" />
                  </div>
                 
                   {tree.notes && <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200"><em>{tree.notes}</em></p>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};