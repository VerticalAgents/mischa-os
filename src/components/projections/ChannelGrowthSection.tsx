
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Channel } from '@/types/projections';

interface ChannelGrowthSectionProps {
  channelsData: Array<{
    channel: Channel;
    revenue: number;
    percentage: number;
    volume?: number;
    variableCosts?: number;
    margin?: number;
    marginPercent?: number;
  }>;
  updateGrowthFactor: (channel: Channel, type: 'percentage' | 'absolute', value: number) => void;
  getGrowthValue: (channel: Channel) => { type: 'percentage' | 'absolute'; value: number };
}

export function ChannelGrowthSection({ 
  channelsData, 
  updateGrowthFactor, 
  getGrowthValue 
}: ChannelGrowthSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projeção por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {channelsData.map((channelData) => {
            const growth = getGrowthValue(channelData.channel);
            return (
              <div key={channelData.channel} className="grid grid-cols-3 gap-4 items-center">
                <div>{channelData.channel}</div>
                <div>
                  <select
                    value={growth.type}
                    onChange={(e) => 
                      updateGrowthFactor(
                        channelData.channel, 
                        e.target.value as 'percentage' | 'absolute', 
                        growth.value
                      )
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="percentage">% de crescimento</option>
                    <option value="absolute">Unidades</option>
                  </select>
                </div>
                <div>
                  <Input
                    type="number"
                    value={growth.value}
                    onChange={(e) => 
                      updateGrowthFactor(
                        channelData.channel, 
                        growth.type, 
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
