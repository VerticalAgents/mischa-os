
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCriticalAlerts } from '@/hooks/useCriticalAlerts';
import { AlertTriangle, Package, Truck, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CriticalAlertsSection() {
  const { alerts } = useCriticalAlerts();
  const navigate = useNavigate();

  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-green-700">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Package className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium">Tudo sob controle!</p>
              <p className="text-sm text-green-600">Nenhum alerta crítico no momento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'estoque': return Package;
      case 'entrega': return Truck;
      case 'confirmacao': return Clock;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h2 className="text-2xl font-semibold">Alertas Críticos</h2>
        <Badge variant="destructive" className="ml-2">
          {alerts.length}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((alert) => {
          const IconComponent = getAlertIcon(alert.type);
          
          return (
            <Card
              key={alert.id}
              className={cn(
                "hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4",
                alert.severity === 'critical' && "border-l-red-500",
                alert.severity === 'high' && "border-l-orange-500",
                alert.severity === 'medium' && "border-l-yellow-500",
                alert.severity === 'low' && "border-l-blue-500"
              )}
              onClick={() => navigate(alert.actionRoute)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      getSeverityColor(alert.severity)
                    )}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{alert.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(alert.severity)}>
                    {alert.count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">
                    {alert.actionText}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
