import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Token público do Mapbox
const MAPBOX_TOKEN = 'pk.eyJ1IjoibHVjY2FtaWxsZXRvIiwiYSI6ImNtZ3Bkc2txZTJiNHQya29qN2N0azZqbGwifQ.l_osvQeh-cxxof4ndAQ6jA';

interface Cliente {
  id: string;
  nome: string;
  endereco_entrega: string;
  link_google_maps?: string;
  contato_telefone?: string;
  status_cliente?: string;
}

const Mapas = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredClientes(
        clientes.filter(cliente => 
          cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.endereco_entrega?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredClientes(clientes);
    }
  }, [searchTerm, clientes]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, endereco_entrega, link_google_maps, contato_telefone, status_cliente')
        .eq('ativo', true)
        .not('endereco_entrega', 'is', null)
        .neq('endereco_entrega', '');

      if (error) throw error;
      setClientes(data || []);
      setFilteredClientes(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os clientes.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (clientes.length > 0 && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [clientes]);

  const extractCoordinatesFromGoogleMaps = (link: string): [number, number] | null => {
    try {
      // Tenta extrair coordenadas de diversos formatos de link do Google Maps
      const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,  // @lat,lng
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // !3dlat!4dlng
        /q=(-?\d+\.\d+),(-?\d+\.\d+)/, // q=lat,lng
      ];

      for (const pattern of patterns) {
        const match = link.match(pattern);
        if (match) {
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          if (!isNaN(lat) && !isNaN(lng)) {
            return [lng, lat]; // Mapbox usa [lng, lat]
          }
        }
      }
    } catch (error) {
      console.error('Erro ao extrair coordenadas:', error);
    }
    return null;
  };

  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=BR&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].center as [number, number];
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
    }
    return null;
  };

  const initializeMap = async () => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Centralizar no Brasil
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-51.2177, -30.0346], // Porto Alegre, RS
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Adicionar marcadores para cada cliente
    await addMarkersToMap();
  };

  const addMarkersToMap = async () => {
    if (!map.current) return;

    // Limpar marcadores existentes
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    for (const cliente of filteredClientes) {
      let coordinates: [number, number] | null = null;

      // Primeiro tenta extrair do link do Google Maps
      if (cliente.link_google_maps) {
        coordinates = extractCoordinatesFromGoogleMaps(cliente.link_google_maps);
      }

      // Se não conseguiu, tenta geocodificar o endereço
      if (!coordinates && cliente.endereco_entrega) {
        coordinates = await geocodeAddress(cliente.endereco_entrega);
      }

      if (coordinates && map.current) {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        // Cor baseada no status
        const statusColors: Record<string, string> = {
          'Ativo': '#10b981',
          'Inativo': '#ef4444',
          'Pendente': '#f59e0b',
        };
        el.style.backgroundColor = statusColors[cliente.status_cliente || 'Ativo'] || '#3b82f6';

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${cliente.nome}</h3>
            <p style="font-size: 12px; margin-bottom: 4px;">${cliente.endereco_entrega}</p>
            ${cliente.contato_telefone ? `<p style="font-size: 12px;">Tel: ${cliente.contato_telefone}</p>` : ''}
            <p style="font-size: 11px; color: #666; margin-top: 4px;">Status: ${cliente.status_cliente || 'Ativo'}</p>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat(coordinates)
          .setPopup(popup)
          .addTo(map.current);

        markers.current.push(marker);
      }
    }

    // Ajustar zoom para mostrar todos os marcadores
    if (markers.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.current.forEach(marker => {
        const lngLat = marker.getLngLat();
        bounds.extend([lngLat.lng, lngLat.lat]);
      });
      map.current?.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  };

  useEffect(() => {
    if (filteredClientes.length > 0 && map.current) {
      addMarkersToMap();
    }
  }, [filteredClientes]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Mapas de Clientes</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredClientes.length} cliente(s)
          </span>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div 
          ref={mapContainer} 
          className="w-full h-[calc(100vh-200px)]"
        />
      </Card>
    </div>
  );
};

export default Mapas;
