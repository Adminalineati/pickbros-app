import type { DashboardRespuesta } from '@pickbros/types';
import Image from 'next/image';
import { DailyChallenge } from '@/components/daily-challenge';
import { FeaturedEvents } from '@/components/featured-events';
import { Header } from '@/components/header';
import { MissionCard } from '@/components/mission-card';
import { ProBanner } from '@/components/pro-banner';
import { RankingCard } from '@/components/ranking-card';

const picksterImage = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/assets/pickster/pickster-panel-oscuro.png`;

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
      <section
        className="relative min-h-32 overflow-hidden rounded-2xl border border-primary-blue/25 bg-surface shadow-[0_0_28px_color-mix(in_srgb,var(--primary-blue)_10%,transparent)] lg:hidden"
        aria-label="Consejo de Pickster"
      >
        <Image
          src={picksterImage}
          alt=""
          fill
          sizes="(max-width: 1023px) 100vw, 0px"
          className="object-cover object-[72%_24%] opacity-85"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/5" />
        <div className="relative z-10 max-w-[68%] p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-blue">
            Pickster está contigo
          </p>
          <p className="mt-1 font-display text-xl uppercase text-text-primary sm:text-2xl">
            Analiza. Decide. Gana.
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Tu contexto del día, listo para el próximo pick.
          </p>
        </div>
      </section>
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
