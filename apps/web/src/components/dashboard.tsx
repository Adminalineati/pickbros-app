import type { DashboardRespuesta } from '@pickbros/types';
import { DailyChallenge } from '@/components/daily-challenge';
import { FeaturedEvents } from '@/components/featured-events';
import { Header } from '@/components/header';
import { MissionCard } from '@/components/mission-card';
import { ProBanner } from '@/components/pro-banner';
import { RankingCard } from '@/components/ranking-card';

export function Dashboard({ data }: { data: DashboardRespuesta }) {
  return (
    <div className="space-y-8">
      <Header
        saludo={data.usuario.saludo}
        rango={data.rango.nombre}
        nivel={data.rango.nivel}
        pickCoins={data.pickCoins}
        pickets={data.pickets}
        rachaDias={data.rachaDias}
      />
      <DailyChallenge challenge={data.challengeDelDia} />
      <FeaturedEvents eventos={data.eventosDestacados} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RankingCard ranking={data.rankingSemanal} />
        <MissionCard misiones={data.misiones} />
      </div>
      <ProBanner />
    </div>
  );
}
