import { useState } from 'react';
import { Phone, ChevronDown } from 'lucide-react';

/** Always visible, calm and free of detours: who to call when this page is not enough. Numbers are for Germany. */
export function EmergencyCard({ en }: { en: boolean }) {
  const [more, setMore] = useState(false);
  const L = en
    ? {
        title: 'If this is not enough',
        text: 'Then it is right to talk to a person now. One call is enough – you do not have to explain anything.',
        emergency: 'Emergency 112',
        emergencySub: 'in acute danger',
        tel: 'Telephone counselling',
        telSub: 'free, around the clock',
        doc: 'Medical on-call service 116 117',
        docSub: 'not life-threatening, but you need a doctor',
        more: 'More numbers',
        less: 'Fewer numbers',
        foot: 'Numbers for Germany.',
        extra: [
          ['Violence against women', '116 016', '116016'],
          ['Sexual abuse', '0800 22 55 530', '08002255530'],
          ['Number against grief (children and teens)', '116 111', '116111'],
        ],
      }
    : {
        title: 'Wenn das hier nicht reicht',
        text: 'Dann ist es richtig, jetzt mit einem Menschen zu sprechen. Ein Anruf genügt – du musst nichts erklären.',
        emergency: 'Notruf 112',
        emergencySub: 'bei akuter Gefahr',
        tel: 'Telefonseelsorge',
        telSub: 'kostenlos, rund um die Uhr',
        doc: 'Ärztlicher Bereitschaftsdienst 116 117',
        docSub: 'nicht lebensgefährlich, aber du brauchst ärztliche Hilfe',
        more: 'Weitere Nummern',
        less: 'Weniger Nummern',
        foot: 'Nummern für Deutschland.',
        extra: [
          ['Hilfetelefon Gewalt gegen Frauen', '116 016', '116016'],
          ['Hilfetelefon Sexueller Missbrauch', '0800 22 55 530', '08002255530'],
          ['Nummer gegen Kummer (Kinder und Jugendliche)', '116 111', '116111'],
        ],
      };
  const row = 'flex items-center gap-3 px-4 py-3.5 rounded-[12px] border-2 border-black text-black text-left w-full';
  return (
    <section className="mt-6 w-full text-left" aria-label={L.title} data-testid="crisis-emergency">
      <p className="text-[17px] text-black font-medium mb-1">{L.title}</p>
      <p className="text-[14px] text-black/75 leading-relaxed mb-3">{L.text}</p>
      <div className="flex flex-col gap-2.5">
        <a href="tel:112" className={row} data-testid="crisis-call-112">
          <Phone size={22} className="flex-shrink-0" />
          <span><span className="block text-[17px] font-medium">{L.emergency}</span><span className="block text-[13px] text-black/70">{L.emergencySub}</span></span>
        </a>
        <div className="rounded-[12px] border-2 border-black text-black">
          <a href="tel:08001110111" className="flex items-center gap-3 px-4 py-3.5" data-testid="crisis-call-ts">
            <Phone size={22} className="flex-shrink-0" />
            <span><span className="block text-[17px] font-medium">{L.tel} 0800 111 0 111</span><span className="block text-[13px] text-black/70">{L.telSub}</span></span>
          </a>
          <p className="px-4 pb-3 -mt-1 text-[14px] text-black/80 flex gap-4 flex-wrap">
            <a href="tel:08001110222" className="underline underline-offset-2" data-testid="crisis-call-ts2">0800 111 0 222</a>
            <a href="tel:116123" className="underline underline-offset-2" data-testid="crisis-call-ts3">116 123</a>
          </p>
        </div>
        <a href="tel:116117" className={row} data-testid="crisis-call-116117">
          <Phone size={22} className="flex-shrink-0" />
          <span><span className="block text-[16px] font-medium">{L.doc}</span><span className="block text-[13px] text-black/70">{L.docSub}</span></span>
        </a>
      </div>
      <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="flex items-center gap-1.5 mt-3 text-[14px] text-black/75 underline underline-offset-2" data-testid="crisis-more-numbers">
        <ChevronDown size={16} style={{ transform: more ? 'rotate(180deg)' : undefined }} /> {more ? L.less : L.more}
      </button>
      {more && (
        <div className="flex flex-col gap-2 mt-2" data-testid="crisis-more-list">
          {L.extra.map(([name, shown, tel]) => (
            <a key={tel} href={`tel:${tel}`} className="flex items-center gap-3 px-4 py-3 rounded-[12px] border border-black/30 text-black">
              <Phone size={18} className="flex-shrink-0" />
              <span className="text-[14.5px]">{name} <span className="font-medium">{shown}</span></span>
            </a>
          ))}
        </div>
      )}
      <p className="text-[12px] text-black/55 mt-3">{L.foot}</p>
    </section>
  );
}
