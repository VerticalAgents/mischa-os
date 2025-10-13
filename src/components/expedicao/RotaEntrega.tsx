import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibHVjY2FtaWxsZXRvIiwiYSI6ImNtZ3Bkc2txZTJiNHQya29qN2N0azZqbGwifQ.l_osvQeh-cxxof4ndAQ6jA';

const geocodeCache = new Map<string, [number, number] | null>();

interface Cliente {
  id: string;
  nome: string;
  endereco_entrega: string;
  link_google_maps?: string;
  contato_telefone?: string;
  data_proxima_reposicao?: string;
}

export const RotaEntrega = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
      el.style.backgroundColor = '#10b981'; // Verde para entregas confirmadas

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rota de Entrega</h2>
          <p className="text-sm text-muted-foreground">
            Visualize os clientes com agendamento confirmado para a data selecionada
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

      <Card className="overflow-hidden">
        <div 
          ref={mapContainer} 
          className="w-full h-[calc(100vh-280px)]"
        />
      </Card>
    </div>
  );
};
