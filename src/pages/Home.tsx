
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, Tag, Calendar, CheckCircle, Factory, Truck } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background">
      <div className="text-center max-w-4xl px-4">
        <h1 className="text-4xl font-bold mb-4">Sistema de Gestão de Confeitaria</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Gerencie pedidos, clientes, produção e muito mais com nossa plataforma completa.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Button 
            size="lg" 
            className="h-24 flex flex-col items-center justify-center" 
            onClick={() => navigate('/configuracoes')}
          >
            <Settings className="h-8 w-8 mb-2" />
            <span>Configurações</span>
          </Button>
          
          <Button 
            size="lg" 
            className="h-24 flex flex-col items-center justify-center" 
            onClick={() => navigate('/precificacao')}
          >
            <Tag className="h-8 w-8 mb-2" />
            <span>Precificação e Produtos</span>
          </Button>
          
          <Button 
            size="lg" 
            className="h-24 flex flex-col items-center justify-center bg-green-600 hover:bg-green-700" 
            onClick={() => navigate('/agendamento?tab=confirmacao')}
          >
            <CheckCircle className="h-8 w-8 mb-2" />
            <span>Confirmação de Reposição</span>
          </Button>
          
          <Button 
            size="lg" 
            className="h-24 flex flex-col items-center justify-center" 
            onClick={() => navigate('/agendamento')}
          >
            <Calendar className="h-8 w-8 mb-2" />
            <span>Agendamento</span>
          </Button>

          <Button 
            size="lg" 
            className="h-24 flex flex-col items-center justify-center" 
            onClick={() => navigate('/pcp')}
          >
            <Factory className="h-8 w-8 mb-2" />
            <span>PCP</span>
          </Button>

          <Button 
            size="lg" 
            className="h-24 flex flex-col items-center justify-center" 
            onClick={() => navigate('/expedicao')}
          >
            <Truck className="h-8 w-8 mb-2" />
            <span>Expedição</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
