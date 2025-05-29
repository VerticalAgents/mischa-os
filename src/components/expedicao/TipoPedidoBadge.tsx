
interface TipoPedidoBadgeProps {
  tipo: string;
}

export const TipoPedidoBadge = ({ tipo }: TipoPedidoBadgeProps) => {
  const isAlterado = tipo === "Alterado";
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      isAlterado 
        ? "bg-red-100 text-red-800 border border-red-200" 
        : "bg-green-100 text-green-800 border border-green-200"
    }`}>
      {tipo}
    </span>
  );
};
