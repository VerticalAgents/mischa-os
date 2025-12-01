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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  rota_entrega_id?: number;
}

interface Representante {
  id: number;
  nome: string;
}

interface RotaEntrega {
  id: number;
  nome: string;
}

const Mapas = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [rotas, setRotas] = useState<RotaEntrega[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedRepresentantes, setSelectedRepresentantes] = useState<number[]>([]);
  const [selectedRotas, setSelectedRotas] = useState<number[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['ATIVO', 'EM_ANALISE']);
  const [colorMode, setColorMode] = useState<'status' | 'representante'>('status');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { toast } = useToast();
  const markers = useRef<mapboxgl.Marker[]>([]);
  const isAddingMarkers = useRef(false);

  useEffect(() => {
    fetchClientes();
    fetchRepresentantes();
    fetchRotas();
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
    
    // Filter by rotas
    if (selectedRotas.length > 0) {
      filtered = filtered.filter(cliente => 
        cliente.rota_entrega_id && selectedRotas.includes(cliente.rota_entrega_id)
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
  }, [debouncedSearchTerm, clientes, selectedRepresentantes, selectedRotas, selectedStatus]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, endereco_entrega, link_google_maps, contato_telefone, status_cliente, representante_id, rota_entrega_id')
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

  const fetchRotas = async () => {
    try {
      const { data, error } = await supabase
        .from('rotas_entrega')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setRotas(data || []);
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
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

    // Cores distintas para representantes
    const representanteColors = [
      '#ef4444', // Vermelho
      '#3b82f6', // Azul
      '#10b981', // Verde
      '#f59e0b', // Laranja
      '#a855f7', // Roxo
      '#ec4899', // Rosa
      '#14b8a6', // Teal
      '#8b5cf6', // Violeta
      '#f97316', // Laranja escuro
      '#06b6d4', // Ciano
    ];

    const getRepresentanteColor = (representanteId: number | undefined): string => {
      if (!representanteId) return '#9ca3af'; // Cinza para sem representante
      const index = representantes.findIndex(r => r.id === representanteId);
      return representanteColors[index % representanteColors.length];
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
      
      // Define cor baseado no modo selecionado
      if (colorMode === 'representante') {
        el.style.backgroundColor = getRepresentanteColor(cliente.representante_id);
      } else {
        el.style.backgroundColor = statusColors[cliente.status_cliente || 'ATIVO'] || '#3b82f6';
      }

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
  }, [filteredClientes, colorMode, representantes]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Mapas de Clientes</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Label htmlFor="color-mode" className="text-sm font-medium">
              Colorir por:
            </Label>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${colorMode === 'status' ? 'font-medium' : 'text-muted-foreground'}`}>
                Status
              </span>
              <Switch
                id="color-mode"
                checked={colorMode === 'representante'}
                onCheckedChange={(checked) => setColorMode(checked ? 'representante' : 'status')}
              />
              <span className={`text-sm ${colorMode === 'representante' ? 'font-medium' : 'text-muted-foreground'}`}>
                Representante
              </span>
            </div>
          </div>
          
          <span className="text-sm text-muted-foreground">
            {filteredClientes.length} cliente(s)
          </span>
        </div>
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
              Rotas
              {selectedRotas.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedRotas.length}
                </Badge>
              )}
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3">
            <div className="space-y-2">
              {rotas.map((rota) => (
                <div key={rota.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rota-${rota.id}`}
                    checked={selectedRotas.includes(rota.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRotas([...selectedRotas, rota.id]);
                      } else {
                        setSelectedRotas(selectedRotas.filter(id => id !== rota.id));
                      }
                    }}
                  />
                  <label
                    htmlFor={`rota-${rota.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {rota.nome}
                  </label>
                </div>
              ))}
              {selectedRotas.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setSelectedRotas([])}
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

      <Card className="overflow-hidden relative">
        <div 
          ref={mapContainer} 
          className="w-full h-[calc(100vh-280px)]"
        />
        
        {colorMode === 'representante' && representantes.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg max-h-[300px] overflow-y-auto">
            <h3 className="text-sm font-semibold mb-2">Legenda - Representantes</h3>
            <div className="space-y-1.5">
              {representantes.map((rep, index) => {
                const representanteColors = [
                  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7',
                  '#ec4899', '#14b8a6', '#8b5cf6', '#f97316', '#06b6d4',
                ];
                const color = representanteColors[index % representanteColors.length];
                
                return (
                  <div key={rep.id} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs">{rep.nome}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 pt-1 border-t">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: '#9ca3af' }}
                />
                <span className="text-xs text-muted-foreground">Sem representante</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Mapas;
