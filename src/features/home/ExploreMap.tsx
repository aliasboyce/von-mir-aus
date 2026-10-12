import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { MAIN_AREAS, ADDON_GROUPS } from './exploreMapData';

/**
 * "Die Mind-Map passt nicht zum Rest der App. Sie muss sanfter sein, weicher,
 * mehr überblendet, lebendig. Das 'von mir aus' in der Mitte ohne Farbe. Die
 * Karte soll jede einzelne Seite und Funktion zeigen."
 *
 * A soft, living map instead of a hard diagram: a neutral centre, one thread of
 * light running down through the five areas (each a blurred patch of its own
 * colour that bleeds into its neighbours), and EVERY page of the app as a large
 * rounded node inside its area. The add-ons ("Zusätze") are the sixth, neutral
 * branch, grouped by what they are for and each with a one-line hint. Motion is
 * slow and subtle (breathing centre, drifting colour, floating nodes) and stops
 * by itself with the reduce-motion setting.
 */
const ADDON_COLOR = '#9a948a';
const THREAD_STOPS = [...MAIN_AREAS.map((a) => a.color), ADDON_COLOR];

function nodeStyle(color: string, i: number): React.CSSProperties {
  return {
    background: `color-mix(in srgb, var(--color-surface) 84%, ${color} 9%)`,
    border: `1px solid ${color}66`,
    boxShadow: `0 3px 16px ${color}26`,
    animationDelay: `${(i % 5) * -1.3}s`,
    animationDuration: `${6.5 + (i % 4) * 1.2}s`,
    marginTop: i % 2 === 1 ? 10 : 0,
    backdropFilter: 'blur(6px)',
  };
}

export function ExploreMap() {
  const t = useT();
  const sm = t.systemMap;
  const navigate = useNavigate();
  const { settings } = useSettings();

  function scrollTo(id: string) {
    document.getElementById(`explore-branch-${id}`)?.scrollIntoView({ behavior: settings.reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  const jumps = [
    ...MAIN_AREAS.map((a) => ({ id: a.id as string, color: a.color, label: sm.areas[a.id].title })),
    { id: 'addons', color: ADDON_COLOR, label: t.explore.mapAddons },
  ];

  return (
    <div className="explore-map overflow-x-clip">
      <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed mb-5">{t.explore.mapHint}</p>

      {/* the neutral centre */}
      <div className="flex flex-col items-center mb-5">
        <div
          className="map-breathe w-[132px] h-[132px] rounded-full flex items-center justify-center text-center"
          style={{
            background: 'radial-gradient(circle at 50% 42%, var(--color-surface) 0%, var(--color-surface-muted) 100%)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 0 0 14px color-mix(in srgb, var(--color-surface-muted) 55%, transparent), 0 0 0 30px color-mix(in srgb, var(--color-surface-muted) 28%, transparent)',
          }}
        >
          <span className="text-[17px] font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display, inherit)' }}>
            {t.explore.mapCentre}
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-9" role="group" aria-label={t.explore.mapTitle}>
          {jumps.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => scrollTo(j.id)}
              className="rounded-full px-3.5 py-2 text-[13.5px] flex items-center gap-2 text-[var(--color-text)]"
              style={{ background: `color-mix(in srgb, var(--color-surface) 85%, ${j.color} 12%)`, border: `1px solid ${j.color}55` }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: j.color, opacity: 0.85 }} aria-hidden="true" />
              {j.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative pb-6">
        {/* the thread of light that runs through everything */}
        <svg aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 1000" preserveAspectRatio="none" style={{ filter: 'blur(1.5px)', opacity: 0.45 }}>
          <defs>
            <linearGradient id="explore-thread" x1="0" y1="0" x2="0" y2="1">
              {THREAD_STOPS.map((c, i) => (
                <stop key={c} offset={`${(i / (THREAD_STOPS.length - 1)) * 100}%`} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
          <path d="M50 0 C 22 90, 78 170, 50 260 S 24 430, 50 520 S 76 700, 50 790 S 30 920, 50 1000" fill="none" stroke="url(#explore-thread)" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {MAIN_AREAS.map((area, i) => {
          const left = i % 2 === 0;
          return (
            <section key={area.id} id={`explore-branch-${area.id}`} className="relative" style={{ scrollMarginTop: 12, marginTop: i === 0 ? 0 : -6, paddingTop: 22, paddingBottom: 22 }}>
              <div
                aria-hidden="true"
                className="map-drift absolute pointer-events-none"
                style={{
                  inset: '-14px -22px',
                  background: `radial-gradient(ellipse 75% 62% at ${left ? '28%' : '72%'} 46%, ${area.color}44 0%, ${area.color}1c 48%, transparent 76%)`,
                  filter: 'blur(10px)',
                  animationDelay: `${i * -3}s`,
                }}
              />
              <div className="relative">
                <div className="flex items-start gap-3 mb-3" style={{ paddingLeft: left ? 0 : 14, paddingRight: left ? 14 : 0 }}>
                  <span className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[22px]" style={{ background: `${area.color}2e` }}>
                    {area.emoji}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[19px] leading-tight text-[var(--color-text)]">{sm.areas[area.id].title}</h2>
                    <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mt-0.5">{sm.areas[area.id].meaning}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-3 [&>*]:min-w-0" style={{ paddingLeft: left ? 0 : 10, paddingRight: left ? 10 : 0 }}>
                  {area.links.map((l, k) => (
                    <button key={l.key} type="button" onClick={() => navigate(l.to)} className="map-float text-left rounded-[24px] px-3.5 py-3 min-h-[58px] min-w-0 flex items-center gap-2.5" style={nodeStyle(area.color, k + i)}>
                      <span className="text-[21px] flex-shrink-0" aria-hidden="true">
                        {l.emoji}
                      </span>
                      <span className="min-w-0 text-[14.5px] leading-snug text-[var(--color-text)] [overflow-wrap:anywhere]">{sm.areaLinks[l.key as keyof typeof sm.areaLinks]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        <section id="explore-branch-addons" className="relative" style={{ scrollMarginTop: 12, marginTop: -6, paddingTop: 22 }}>
          <div
            aria-hidden="true"
            className="map-drift absolute pointer-events-none"
            style={{ inset: '-14px -22px', background: `radial-gradient(ellipse 80% 62% at 50% 40%, ${ADDON_COLOR}3a 0%, ${ADDON_COLOR}18 50%, transparent 78%)`, filter: 'blur(10px)', animationDelay: '-9s' }}
          />
          <div className="relative">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[22px]" style={{ background: `${ADDON_COLOR}33` }}>
                🧰
              </span>
              <div className="min-w-0">
                <h2 className="text-[19px] leading-tight text-[var(--color-text)]">{t.explore.mapAddons}</h2>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mt-0.5">{t.explore.mapAddonsMeaning}</p>
              </div>
            </div>
            {ADDON_GROUPS.map((g) => (
              <div key={g.labelKey} className="mb-5">
                <p className="text-[14px] font-medium text-[var(--color-text)] mb-2 pl-1">{sm.extraGroupsNew[g.labelKey as keyof typeof sm.extraGroupsNew]}</p>
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                  {g.items.map((item, k) => (
                    <button key={item.titleKey} type="button" onClick={() => navigate(item.to)} className="map-float text-left rounded-[24px] px-3.5 py-3 min-h-[58px] min-w-0 flex items-center gap-2.5" style={{ ...nodeStyle(ADDON_COLOR, k), marginTop: 0 }}>
                      <span className="text-[21px] flex-shrink-0" aria-hidden="true">
                        {item.emoji}
                      </span>
                      <span className="block min-w-0 [overflow-wrap:anywhere]">
                        <span className="block text-[14.5px] leading-snug text-[var(--color-text)]">{sm.extraItems[item.titleKey as keyof typeof sm.extraItems]}</span>
                        <span className="block text-[12px] leading-snug text-[var(--color-text-faint)] mt-0.5">{sm.extraItemHints[item.titleKey as keyof typeof sm.extraItemHints]}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
