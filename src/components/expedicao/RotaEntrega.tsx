import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, MapPin, Route } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibHVjY2FtaWxsZXRvIiwiYSI6ImNtZ3Bkc2txZTJiNHQya29qN2N0azZqbGwifQ.l_osvQeh-cxxof4ndAQ6jA';
const FACTORY_ADDRESS = 'R. Cel. Paulino Teixeira, 35 - Rio Branco, Porto Alegre - RS, 90420-160';

const geocodeCache = new Map<string, [number, number] | null>();

interface Cliente {
  id: string;
  nome: string;
  endereco_entrega: string;
  link_google_maps?: string;
  contato_telefone?: string;
  data_proxima_reposicao?: string;
}

interface RoutePoint {
  coordinates: [number, number];
  cliente?: Cliente;
  isFactory?: boolean;
  isFinal?: boolean;
}

export const RotaEntrega = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [enderecoFinal, setEnderecoFinal] = useState<string>('');
  const [rotaOtimizada, setRotaOtimizada] = useState<RoutePoint[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { toast } = useToast();
  const markers = useRef<mapboxgl.Marker[]>([]);
  const isAddingMarkers = useRef(false);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [selectedDate]);

  useEffect(() => {
    if (clientes.length > 0 && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [clientes]);

  useEffect(() => {
    if (clientes.length > 0 && map.current) {
      addMarkersToMap();
    }
  }, [clientes]);

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

  const fetchClientes = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Buscar agendamentos confirmados para a data selecionada
      const { data: agendamentos, error: agendError } = await supabase
        .from('agendamentos_clientes')
        .select('cliente_id')
        .eq('data_proxima_reposicao', dateStr)
        .eq('status_agendamento', 'Agendado');

      if (agendError) throw agendError;

      if (!agendamentos || agendamentos.length === 0) {
        setClientes([]);
        return;
      }

      const clienteIds = agendamentos.map(a => a.cliente_id);

      // Buscar dados dos clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('id, nome, endereco_entrega, link_google_maps, contato_telefone')
        .in('id', clienteIds)
        .eq('ativo', true)
        .not('endereco_entrega', 'is', null)
        .neq('endereco_entrega', '');

      if (clientesError) throw clientesError;
      setClientes(clientesData || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os clientes.',
        variant: 'destructive',
      });
    }
  };

  const extractCoordinatesFromGoogleMaps = (link: string): [number, number] | null => {
    try {
      const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
        /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
      ];

      for (const pattern of patterns) {
        const match = link.match(pattern);
        if (match) {
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          if (!isNaN(lat) && !isNaN(lng)) {
            return [lng, lat];
          }
        }
      }
    } catch (error) {
      console.error('Erro ao extrair coordenadas:', error);
    }
    return null;
  };

  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
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

    const center: [number, number] = userLocation || [-51.2177, -30.0346];
    const zoom = userLocation ? 12 : 10;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      addMarkersToMap();
    });
  };

  const addMarkersToMap = async () => {
    if (!map.current || isAddingMarkers.current) return;
    
    isAddingMarkers.current = true;

    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Se houver rota otimizada, usar a ordem da rota
    if (rotaOtimizada.length > 0) {
      rotaOtimizada.forEach((point, index) => {
        if (!map.current) return;

        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '35px';
        el.style.height = '35px';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '14px';
        el.style.color = 'white';

        if (point.isFactory) {
          el.style.backgroundColor = '#3b82f6'; // Azul para fábrica
          el.innerHTML = '🏭';
        } else if (point.isFinal) {
          el.style.backgroundColor = '#ef4444'; // Vermelho para final
          el.innerHTML = '🏁';
        } else {
          el.style.backgroundColor = '#10b981'; // Verde para paradas
          el.innerHTML = `${index}`;
        }

        let popupContent = '';
        if (point.isFactory) {
          popupContent = `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">🏭 Ponto de Partida</h3>
              <p style="font-size: 12px;">Mischa's Bakery</p>
              <p style="font-size: 11px; color: #3b82f6; margin-top: 4px;">Início da rota</p>
            </div>
          `;
        } else if (point.isFinal) {
          popupContent = `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">🏁 Destino Final</h3>
              <p style="font-size: 11px; color: #ef4444; margin-top: 4px;">Fim da rota</p>
            </div>
          `;
        } else if (point.cliente) {
          popupContent = `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">Parada ${index}: ${point.cliente.nome}</h3>
              <p style="font-size: 12px; margin-bottom: 4px;">${point.cliente.endereco_entrega}</p>
              ${point.cliente.contato_telefone ? `<p style="font-size: 12px;">Tel: ${point.cliente.contato_telefone}</p>` : ''}
              <p style="font-size: 11px; color: #10b981; margin-top: 4px; font-weight: 500;">✓ Agendado</p>
            </div>
          `;
        }

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

        const marker = new mapboxgl.Marker(el)
          .setLngLat(point.coordinates)
          .setPopup(popup)
          .addTo(map.current);

        markers.current.push(marker);
      });
    } else {
      // Modo normal sem rota
      const batchSize = 10;
      const clientesWithCoords: Array<{ cliente: Cliente; coords: [number, number] }> = [];

      for (let i = 0; i < clientes.length; i += batchSize) {
        const batch = clientes.slice(i, i + batchSize);
        
        const results = await Promise.all(
          batch.map(async (cliente) => {
            let coordinates: [number, number] | null = null;

            if (cliente.link_google_maps) {
              coordinates = extractCoordinatesFromGoogleMaps(cliente.link_google_maps);
            }

            if (!coordinates && cliente.endereco_entrega) {
              coordinates = await geocodeAddress(cliente.endereco_entrega);
            }

            return coordinates ? { cliente, coords: coordinates } : null;
          })
        );

        clientesWithCoords.push(...results.filter(Boolean) as Array<{ cliente: Cliente; coords: [number, number] }>);
      }

      if (!map.current) {
        isAddingMarkers.current = false;
        return;
      }

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
        el.style.backgroundColor = '#10b981';

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${cliente.nome}</h3>
            <p style="font-size: 12px; margin-bottom: 4px;">${cliente.endereco_entrega}</p>
            ${cliente.contato_telefone ? `<p style="font-size: 12px;">Tel: ${cliente.contato_telefone}</p>` : ''}
            <p style="font-size: 11px; color: #10b981; margin-top: 4px; font-weight: 500;">✓ Agendado</p>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .setPopup(popup)
          .addTo(map.current);

        markers.current.push(marker);
      });
    }

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

  const calcularRota = async () => {
    if (clientes.length === 0) {
      toast({
        title: 'Nenhum cliente',
        description: 'Não há clientes agendados para esta data.',
        variant: 'destructive',
      });
      return;
    }

    setIsCalculatingRoute(true);

    try {
      // Geocodificar endereço da fábrica
      const factoryCoords = await geocodeAddress(FACTORY_ADDRESS);
      if (!factoryCoords) {
        throw new Error('Não foi possível localizar o endereço da fábrica');
      }

      // Obter coordenadas dos clientes
      const clienteCoords: Array<{ cliente: Cliente; coords: [number, number] }> = [];
      for (const cliente of clientes) {
        let coords: [number, number] | null = null;
        
        if (cliente.link_google_maps) {
          coords = extractCoordinatesFromGoogleMaps(cliente.link_google_maps);
        }
        
        if (!coords && cliente.endereco_entrega) {
          coords = await geocodeAddress(cliente.endereco_entrega);
        }
        
        if (coords) {
          clienteCoords.push({ cliente, coords });
        }
      }

      // Obter coordenadas do endereço final se fornecido
      let finalCoords: [number, number] | null = null;
      if (enderecoFinal.trim()) {
        finalCoords = await geocodeAddress(enderecoFinal);
        if (!finalCoords) {
          toast({
            title: 'Aviso',
            description: 'Não foi possível localizar o endereço final. A rota terminará no último cliente.',
          });
        }
      }

      // Preparar coordenadas para a API de otimização
      const coordinates = [
        factoryCoords,
        ...clienteCoords.map(c => c.coords),
        ...(finalCoords ? [finalCoords] : [])
      ];

      // Chamar API de Optimization do Mapbox
      const coordsString = coordinates.map(c => `${c[0]},${c[1]}`).join(';');
      const response = await fetch(
        `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordsString}?` +
        `source=first&destination=${finalCoords ? 'last' : 'any'}&` +
        `roundtrip=${!finalCoords}&access_token=${MAPBOX_TOKEN}`
      );

      const data = await response.json();

      if (data.code !== 'Ok') {
        throw new Error('Erro ao calcular rota otimizada');
      }

      // Construir ordem de paradas
      const waypoints = data.waypoints;
      const routePoints: RoutePoint[] = [];

      // Adicionar fábrica
      routePoints.push({
        coordinates: factoryCoords,
        isFactory: true,
      });

      // Adicionar clientes na ordem otimizada
      waypoints.forEach((wp: any, index: number) => {
        if (index === 0) return; // Pular primeiro (fábrica)
        if (finalCoords && index === waypoints.length - 1) return; // Pular último se for endereço final
        
        const waypointIndex = wp.waypoint_index - 1; // Ajustar índice
        if (waypointIndex >= 0 && waypointIndex < clienteCoords.length) {
          const clienteData = clienteCoords[waypointIndex];
          routePoints.push({
            coordinates: clienteData.coords,
            cliente: clienteData.cliente,
          });
        }
      });

      // Adicionar destino final se houver
      if (finalCoords) {
        routePoints.push({
          coordinates: finalCoords,
          isFinal: true,
        });
      }

      setRotaOtimizada(routePoints);

      // Desenhar rota no mapa
      if (map.current) {
        const route = data.trips[0];
        
        // Remover rota anterior se existir
        if (map.current.getLayer('route')) {
          map.current.removeLayer('route');
        }
        if (map.current.getSource('route')) {
          map.current.removeSource('route');
        }

        // Adicionar nova rota
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          },
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });
      }

      toast({
        title: 'Rota calculada!',
        description: `Rota otimizada com ${routePoints.length - (finalCoords ? 2 : 1)} paradas.`,
      });

    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível calcular a rota otimizada.',
        variant: 'destructive',
      });
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  useEffect(() => {
    if (map.current && rotaOtimizada.length > 0) {
      addMarkersToMap();
    }
  }, [rotaOtimizada]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rota de Entrega</h2>
          <p className="text-sm text-muted-foreground">
            Visualize e otimize a rota de entregas para a data selecionada
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          <span className="text-sm text-muted-foreground">
            {clientes.length} entrega(s) agendada(s)
          </span>
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                Ponto de Partida (Fábrica)
              </Label>
              <Input 
                value={FACTORY_ADDRESS}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                Destino Final (Opcional)
              </Label>
              <Input 
                placeholder="Digite o endereço final da rota"
                value={enderecoFinal}
                onChange={(e) => setEnderecoFinal(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={calcularRota}
            disabled={isCalculatingRoute || clientes.length === 0}
            className="w-full"
          >
            <Route className="mr-2 h-4 w-4" />
            {isCalculatingRoute ? 'Calculando rota...' : 'Criar Rota Otimizada'}
          </Button>

          {rotaOtimizada.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Route className="h-4 w-4" />
                Ordem de Entregas ({rotaOtimizada.length} paradas)
              </h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {rotaOtimizada.map((point, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-2 bg-background rounded border"
                  >
                    {point.isFactory ? (
                      <>
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                          🏭
                        </div>
                        <div>
                          <p className="font-medium text-sm">Ponto de Partida</p>
                          <p className="text-xs text-muted-foreground">Mischa's Bakery</p>
                        </div>
                      </>
                    ) : point.isFinal ? (
                      <>
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm">
                          🏁
                        </div>
                        <div>
                          <p className="font-medium text-sm">Destino Final</p>
                          <p className="text-xs text-muted-foreground">{enderecoFinal}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                          {index}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{point.cliente?.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">{point.cliente?.endereco_entrega}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div 
          ref={mapContainer} 
          className="w-full h-[calc(100vh-450px)]"
        />
      </Card>
    </div>
  );
};
