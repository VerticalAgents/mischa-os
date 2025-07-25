
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NovaConfirmacaoReposicaoTab from "@/components/agendamento/NovaConfirmacaoReposicaoTab";

export default function ConfirmacaoReposicao() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Confirmação de Reposição</CardTitle>
        </CardHeader>
        <CardContent>
          <NovaConfirmacaoReposicaoTab />
        </CardContent>
      </Card>
    </div>
  );
}
