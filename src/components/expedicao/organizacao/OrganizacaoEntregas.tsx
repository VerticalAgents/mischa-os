import { useExpedicaoUiStore } from '@/hooks/useExpedicaoUiStore';
import { useOrganizacaoEntregas } from './useOrganizacaoEntregas';
import { ListaEntregasPanel } from './ListaEntregasPanel';
import { PreviewTextoPanel } from './PreviewTextoPanel';

export const OrganizacaoEntregas = () => {
  const { filtroData } = useExpedicaoUiStore();
  
  const {
    entregas,
    loading,
    textoGerado,
    toggleSelecao,
    atualizarObservacao,
    atualizarOrdem,
    selecionarTodas,
    desselecionarTodas,
    recarregar
  } = useOrganizacaoEntregas(filtroData);

  return (
    <div className="h-[calc(100vh-12rem)] grid grid-cols-2 gap-4">
      <ListaEntregasPanel
        entregas={entregas}
        loading={loading}
        onToggleSelecao={toggleSelecao}
        onAtualizarObservacao={atualizarObservacao}
        onAtualizarOrdem={atualizarOrdem}
        onSelecionarTodas={selecionarTodas}
        onDesselecionarTodas={desselecionarTodas}
        onRecarregar={recarregar}
      />
      
      <PreviewTextoPanel texto={textoGerado} />
    </div>
  );
};
