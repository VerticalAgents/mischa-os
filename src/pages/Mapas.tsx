import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Filter, ChevronDown } from 'lucide-react';
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
  const [selectedRepresentantes, setSelectedRepresentantes] = useState<number[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
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
    
    // Filter by representantes
    if (selectedRepresentantes.length > 0) {
      filtered = filtered.filter(cliente => 
        cliente.representante_id && selectedRepresentantes.includes(cliente.representante_id)
      );
    }
    
    // Filter by status
    if (selectedStatus.length > 0) {
      filtered = filtered.filter(cliente => 
        cliente.status_cliente && selectedStatus.includes(cliente.status_cliente)
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
  }, [debouncedSearchTerm, clientes, selectedRepresentantes, selectedStatus]);

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
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-48 justify-between">
              Representantes
              {selectedRepresentantes.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedRepresentantes.length}
                </Badge>
              )}
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3">
            <div className="space-y-2">
              {representantes.map((rep) => (
                <div key={rep.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rep-${rep.id}`}
                    checked={selectedRepresentantes.includes(rep.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRepresentantes([...selectedRepresentantes, rep.id]);
                      } else {
                        setSelectedRepresentantes(selectedRepresentantes.filter(id => id !== rep.id));
                      }
                    }}
                  />
                  <label
                    htmlFor={`rep-${rep.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {rep.nome}
                  </label>
                </div>
              ))}
              {selectedRepresentantes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setSelectedRepresentantes([])}
                >
                  Limpar
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-48 justify-between">
              Status
              {selectedStatus.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedStatus.length}
                </Badge>
              )}
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-ativo"
                  checked={selectedStatus.includes('ATIVO')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatus([...selectedStatus, 'ATIVO']);
                    } else {
                      setSelectedStatus(selectedStatus.filter(s => s !== 'ATIVO'));
                    }
                  }}
                />
                <label htmlFor="status-ativo" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  Ativo
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-inativo"
                  checked={selectedStatus.includes('INATIVO')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatus([...selectedStatus, 'INATIVO']);
                    } else {
                      setSelectedStatus(selectedStatus.filter(s => s !== 'INATIVO'));
                    }
                  }}
                />
                <label htmlFor="status-inativo" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  Inativo
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-standby"
                  checked={selectedStatus.includes('STANDBY')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatus([...selectedStatus, 'STANDBY']);
                    } else {
                      setSelectedStatus(selectedStatus.filter(s => s !== 'STANDBY'));
                    }
                  }}
                />
                <label htmlFor="status-standby" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  Standby
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-analise"
                  checked={selectedStatus.includes('EM_ANALISE')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatus([...selectedStatus, 'EM_ANALISE']);
                    } else {
                      setSelectedStatus(selectedStatus.filter(s => s !== 'EM_ANALISE'));
                    }
                  }}
                />
                <label htmlFor="status-analise" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  Em análise
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-ativar"
                  checked={selectedStatus.includes('A_ATIVAR')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatus([...selectedStatus, 'A_ATIVAR']);
                    } else {
                      setSelectedStatus(selectedStatus.filter(s => s !== 'A_ATIVAR'));
                    }
                  }}
                />
                <label htmlFor="status-ativar" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  A ativar
                </label>
              </div>
              {selectedStatus.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setSelectedStatus([])}
                >
                  Limpar
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

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
