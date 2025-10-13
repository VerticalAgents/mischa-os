import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Token público do Mapbox
const MAPBOX_TOKEN = 'pk.eyJ1IjoibHVjY2FtaWxsZXRvIiwiYSI6ImNtZ3Bkc2txZTJiNHQya29qN2N0azZqbGwifQ.l_osvQeh-cxxof4ndAQ6jA';

// Cache de coordenadas em memória
const geocodeCache = new Map<string, [number, number] | null>();

interface Cliente {
  id: string;
  nome: string;
  endereco_entrega: string;
  link_google_maps?: string;
  contato_telefone?: string;
  status_cliente?: string;
  representante_id?: number;
}

interface Representante {
  id: number;
  nome: string;
}

const Mapas = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedRepresentante, setSelectedRepresentante] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { toast } = useToast();
  const markers = useRef<mapboxgl.Marker[]>([]);
  const isAddingMarkers = useRef(false);

  useEffect(() => {
    fetchClientes();
    fetchRepresentantes();
    getUserLocation();
  }, []);

  // Debounce do search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filtragem memoizada
  const filteredClientes = useMemo(() => {
    let filtered = clientes;
    
    // Filter by representante
    if (selectedRepresentante !== 'all') {
      filtered = filtered.filter(cliente => 
        cliente.representante_id?.toString() === selectedRepresentante
      );
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(cliente => 
        cliente.status_cliente === selectedStatus
      );
    }
    
    // Filter by search term
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(cliente => 
        cliente.nome.toLowerCase().includes(term) ||
        cliente.endereco_entrega?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [debouncedSearchTerm, clientes, selectedRepresentante, selectedStatus]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, endereco_entrega, link_google_maps, contato_telefone, status_cliente, representante_id')
        .eq('ativo', true)
        .not('endereco_entrega', 'is', null)
        .neq('endereco_entrega', '');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os clientes.',
        variant: 'destructive',
      });
    }
  };

  const fetchRepresentantes = async () => {
    try {
      const { data, error } = await supabase
        .from('representantes')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setRepresentantes(data || []);
    } catch (error) {
      console.error('Erro ao buscar representantes:', error);
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

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.log('Não foi possível obter localização:', error);
        }
      );
    }
  };

  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    // Verificar cache primeiro
    if (geocodeCache.has(address)) {
      return geocodeCache.get(address)!;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=BR&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const coords = data.features[0].center as [number, number];
        geocodeCache.set(address, coords);
        return coords;
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
    }
    
    geocodeCache.set(address, null);
    return null;
  };

  const initializeMap = () => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Usar localização do usuário ou centralizar em Porto Alegre
    const center: [number, number] = userLocation || [-51.2177, -30.0346];
    const zoom = userLocation ? 12 : 10;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Adicionar marcadores após o mapa carregar
    map.current.on('load', () => {
      addMarkersToMap();
    });
  };

  const addMarkersToMap = async () => {
    if (!map.current || isAddingMarkers.current) return;
    
    isAddingMarkers.current = true;

    // Limpar marcadores existentes
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Processar clientes em lotes para não travar
    const batchSize = 10;
    const clientesWithCoords: Array<{ cliente: Cliente; coords: [number, number] }> = [];

    for (let i = 0; i < filteredClientes.length; i += batchSize) {
      const batch = filteredClientes.slice(i, i + batchSize);
      
      const results = await Promise.all(
        batch.map(async (cliente) => {
          let coordinates: [number, number] | null = null;

          // Primeiro tenta extrair do link do Google Maps
          if (cliente.link_google_maps) {
            coordinates = extractCoordinatesFromGoogleMaps(cliente.link_google_maps);
          }

          // Se não conseguiu, tenta geocodificar o endereço
          if (!coordinates && cliente.endereco_entrega) {
            coordinates = await geocodeAddress(cliente.endereco_entrega);
          }

          return coordinates ? { cliente, coords: coordinates } : null;
        })
      );

      clientesWithCoords.push(...results.filter(Boolean) as Array<{ cliente: Cliente; coords: [number, number] }>);
    }

    // Adicionar todos os marcadores de uma vez
    if (!map.current) {
      isAddingMarkers.current = false;
      return;
    }

    const statusColors: Record<string, string> = {
      'ATIVO': '#10b981',      // Verde
      'INATIVO': '#ef4444',    // Vermelho
      'STANDBY': '#a855f7',    // Roxo
      'EM_ANALISE': '#3b82f6', // Azul
      'A_ATIVAR': '#eab308',   // Amarelo
    };

    clientesWithCoords.forEach(({ cliente, coords }) => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.backgroundColor = statusColors[cliente.status_cliente || 'ATIVO'] || '#3b82f6';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">${cliente.nome}</h3>
          <p style="font-size: 12px; margin-bottom: 4px;">${cliente.endereco_entrega}</p>
          ${cliente.contato_telefone ? `<p style="font-size: 12px;">Tel: ${cliente.contato_telefone}</p>` : ''}
          <p style="font-size: 11px; color: #666; margin-top: 4px;">Status: ${cliente.status_cliente?.replace('_', ' ') || 'ATIVO'}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Ajustar zoom para mostrar todos os marcadores
    if (markers.current.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.current.forEach(marker => {
        const lngLat = marker.getLngLat();
        bounds.extend([lngLat.lng, lngLat.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }

    isAddingMarkers.current = false;
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
        
        <span className="text-sm text-muted-foreground">
          {filteredClientes.length} cliente(s)
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        <Select value={selectedRepresentante} onValueChange={setSelectedRepresentante}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Representante" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os representantes</SelectItem>
            {representantes.map((rep) => (
              <SelectItem key={rep.id} value={rep.id.toString()}>
                {rep.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ATIVO">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Ativo
              </div>
            </SelectItem>
            <SelectItem value="INATIVO">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                Inativo
              </div>
            </SelectItem>
            <SelectItem value="STANDBY">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                Standby
              </div>
            </SelectItem>
            <SelectItem value="EM_ANALISE">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Em análise
              </div>
            </SelectItem>
            <SelectItem value="A_ATIVAR">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                A ativar
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div 
          ref={mapContainer} 
          className="w-full h-[calc(100vh-280px)]"
        />
      </Card>
    </div>
  );
};

export default Mapas;
