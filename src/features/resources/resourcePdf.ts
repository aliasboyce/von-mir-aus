import { PdfDoc, hexToRgb } from '../../services/pdf/pdfBuilder';
import { AROUSAL_BANDS } from '../polyvagal/arousalBands';
import { SKILL_CATEGORY_ZONE_COLOR } from './resourceMeta';
import type { Resource } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';

interface Row {
  label?: string;
  value?: string;
}

function rows(doc: PdfDoc, title: string, items: Row[], opts: { box?: boolean } = {}) {
  const filled = items.filter((r) => r.value && r.value.trim());
  if (filled.length === 0) return;
  doc.heading(title, 2);
  for (const r of filled) {
    if (r.label) {
      doc.paragraph(`${r.label}: ${r.value}`, { size: 11, indent: 10, gap: 3 });
    } else {
      doc.paragraph(r.value as string, { size: 11, indent: 10, gap: 3 });
    }
  }
  if (opts.box) doc.space(2);
}

/**
 * "Das PDF erstellen von Skills funktioniert nicht"-Fund — builds the
 * real PDF file for one Skill or Hilfsmittel (all structured sections
 * when present, otherwise just its plain description), see
 * services/pdf/pdfBuilder.ts for why this no longer goes through
 * window.print().
 */
export function buildResourcePdf(resource: Resource, categoryLabel: string, t: TranslationDictionary, neededHilfsmittel: string[] = []): Uint8Array {
  const r = t.resources;
  const doc = new PdfDoc('von mir aus');
  const catColor = hexToRgb(SKILL_CATEGORY_ZONE_COLOR[resource.category] ?? '#5a6b5e');

  doc.heading(resource.title, 1);
  const subtitle = resource.skillDetails?.subtitle ?? resource.hilfsmittelDetails?.subtitle;
  if (subtitle) doc.paragraph(subtitle, { size: 12, italic: true, color: [90, 90, 90], gap: 2 });
  doc.paragraph(categoryLabel, { size: 10, bold: true, color: catColor, gap: 8 });

  const zoneIds = resource.skillDetails?.zoneIds ?? resource.hilfsmittelDetails?.zoneIds ?? [];
  if (zoneIds.length > 0) {
    const names = zoneIds
      .map((id) => AROUSAL_BANDS.find((b) => b.id === id))
      .filter(Boolean)
      .map((b) => t.polyvagal.arousalZones[(b as (typeof AROUSAL_BANDS)[number]).labelKey as keyof typeof t.polyvagal.arousalZones].label);
    doc.paragraph(`${r.zonePickerLabel} ${names.join(', ')}`, { size: 10, color: [90, 90, 90], gap: 8 });
  }

  if (resource.description) doc.paragraph(resource.description, { size: 11, gap: 8 });

  const s = resource.skillDetails;
  if (s) {
    rows(doc, r.skillSection1Title, [
      { label: r.skillAnspannungsbereichLabel, value: s.anspannungsbereich },
      { label: r.skillAusloeserLabel, value: s.ausloeser },
      { label: r.skillFruehwarnzeichenLabel, value: s.fruehwarnzeichen },
    ]);
    rows(doc, r.skillSection2Title, [{ value: s.wirkung }, { label: r.skillWirkungsdauerLabel, value: s.wirkungsdauer }]);
    if (s.schritte && s.schritte.length > 0) {
      doc.heading(r.skillSection3Title, 2);
      s.schritte.forEach((step, i) => doc.paragraph(`${i + 1}.  ${step}`, { size: 11, indent: 10, gap: 3 }));
    }
    rows(doc, r.skillSection4Title, [
      { label: r.skillGegenanzeigenLabel, value: s.gegenanzeigen },
      { label: r.skillAlternativeLabel, value: s.unterwegsAlternative },
    ]);
  }

  const h = resource.hilfsmittelDetails;
  if (h) {
    rows(doc, r.hilfsmittelSection1Title, [{ value: h.beruhigungTrost }, { value: h.fokusAblenkung }, { value: h.ventilAnspannung }]);
    rows(doc, r.hilfsmittelSection2Title, [
      { label: r.hilfsmittelAnspannungsbereichLabel, value: h.anspannungsbereich },
      { label: r.hilfsmittelAlarmLabel, value: h.alarmSituation },
    ]);
    rows(doc, r.hilfsmittelSection3Title, [
      { label: r.hilfsmittelDauerLabel, value: h.dauer },
      { label: r.hilfsmittelMethodeLabel, value: h.methode },
      { label: r.hilfsmittelAusschlussLabel, value: h.ausschlusskriterium },
    ]);
    rows(doc, r.hilfsmittelSection4Title, [
      { label: r.hilfsmittelPlatzZuhauseLabel, value: h.platzZuhause },
      { label: r.hilfsmittelPlatzUnterwegsLabel, value: h.platzUnterwegs },
    ]);
    rows(doc, r.hilfsmittelSection5Title, [{ value: h.bereitschaft }]);
  }

  if (neededHilfsmittel.length > 0) {
    rows(doc, r.skillketteDetailHilfsmittelLabel, [{ value: neededHilfsmittel.join(', ') }]);
  }

  if (resource.link) rows(doc, 'Link', [{ value: resource.link }]);
  if (resource.note) rows(doc, 'Notiz', [{ value: resource.note }]);

  return doc.toBytes();
}
