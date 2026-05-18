import type { ActionPlan, ActionPlanItem, ActionPlanResource } from '@/components/app/action-plan-panel';

const ACTION_WORDS = [
  'prepara',
  'revisa',
  'guarda',
  'carga',
  'llama',
  'mueve',
  'evacua',
  'evitar',
  'compra',
  'ubica',
  'contacta',
  'mantén',
  'asegura',
  'lleva',
  'verifica',
  'define',
  'sal',
];

const USER_PLAN_INTENT_WORDS = [
  'plan',
  'qué hago',
  'que hago',
  'qué debo hacer',
  'que debo hacer',
  'acciones',
  'ayúdame a actuar',
  'ayudame a actuar',
  'prepararme',
  'preparar',
  'evacuar',
  'evacuación',
  'evacuacion',
  'albergue',
  'refugio',
];

const CONTEXT_ONLY_PREFIXES = [
  'ubicación principal',
  'ubicacion principal',
  'grupo familiar',
  'condición médica',
  'condicion médica',
  'condicion medica',
  'vehículo disponible',
  'vehiculo disponible',
  'riesgo actual',
  'estado de precipitación',
  'estado de precipitacion',
  'alertas oficiales',
  'puntos de interés',
  'puntos de interes',
  'hospitales',
  'farmacias',
  'supermercados',
];

function cleanLine(line: string): string {
  return line
    .replace(/^\s*[-*•]\s*/, '')
    .replace(/^\s*\d+[.)]\s*/, '')
    .replace(/\*\*/g, '')
    .trim();
}

function userAskedForPlan(userMessage: string): boolean {
  const lower = userMessage.toLowerCase();
  return USER_PLAN_INTENT_WORDS.some((word) => lower.includes(word));
}

function hasStructuredPlanShape(text: string): boolean {
  const lower = text.toLowerCase();
  const phaseHits = [
    'ahora mismo',
    'próximas 24',
    'proximas 24',
    'si el escenario empeora',
    'si empeora',
    'evac',
  ].filter((phrase) => lower.includes(phrase)).length;

  return phaseHits >= 2;
}

function phaseFor(text: string): ActionPlanItem['phase'] {
  const lower = text.toLowerCase();
  if (
    lower.includes('si empeora') ||
    lower.includes('evac') ||
    lower.includes('salir') ||
    lower.includes('sal de') ||
    lower.includes('refugio') ||
    lower.includes('albergue')
  ) {
    return 'Si empeora';
  }
  if (
    lower.includes('mañana') ||
    lower.includes('próxim') ||
    lower.includes('antes de') ||
    lower.includes('mantén') ||
    lower.includes('ten listo') ||
    lower.includes('prepara')
  ) {
    return 'Preparación';
  }
  return 'Ahora';
}

function isActionLine(line: string): boolean {
  const clean = cleanLine(line);
  if (clean.length < 18 || clean.length > 180) return false;
  const lower = clean.toLowerCase();
  if (CONTEXT_ONLY_PREFIXES.some((prefix) => lower.startsWith(prefix))) return false;

  return (
    /^\s*(?:[-*•]|\d+[.)])\s+/.test(line) ||
    ACTION_WORDS.some((word) => lower.includes(word))
  );
}

function normalizeUrl(url: string): string {
  return url.replace(/[),.;\]]+$/g, '');
}

function cleanResourceText(text: string): string {
  return text
    .replace(/^\s*[-*•]\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/^_+|_+$/g, '')
    .trim();
}

function resourceKindFor(label: string, description: string, url: string): ActionPlanResource['kind'] {
  const searchable = `${label} ${description} ${url}`.toLowerCase();
  if (/(albergue|refugio|evacuaci[oó]n|shelter)/.test(searchable)) return 'shelter';
  if (/(secretar[ií]a|gesti[oó]n de riesgos|sgr|ecu[-\s]?911|gob\.ec|municipio|alcald[ií]a|prefectura)/.test(searchable)) {
    return 'official';
  }
  if (/(hospital|cl[ií]nica|farmacia|salud|medicina)/.test(searchable)) return 'health';
  if (/(supermercado|abastecimiento|agua|alimento|v[ií]veres|market)/.test(searchable)) {
    return 'supply';
  }
  return 'resource';
}

function addResource(
  resources: Map<string, ActionPlanResource>,
  url: string,
  label: string,
  description = '',
) {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl || resources.has(normalizedUrl)) return;

  const cleanLabel = cleanResourceText(label).replace(/\s+[—-]\s*$/, '');
  const cleanDescription = cleanResourceText(description).slice(0, 170);

  resources.set(normalizedUrl, {
    label: cleanLabel || new URL(normalizedUrl).hostname.replace(/^www\./, ''),
    url: normalizedUrl,
    description: cleanDescription,
    kind: resourceKindFor(cleanLabel, cleanDescription, normalizedUrl),
  });
}

function extractResources(text: string): ActionPlanResource[] {
  const resources = new Map<string, ActionPlanResource>();
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    const boldResult = line.match(/^\s*[-*•]?\s*\*\*([^*]+)\*\*\s*[—-]\s*(https?:\/\/[^\s)]+)/);
    const plainResult = line.match(/^\s*[-*•]?\s*([^—\n]+?)\s*[—-]\s*(https?:\/\/[^\s)]+)/);
    const result = boldResult ?? plainResult;

    if (!result) return;

    const nextLine = lines[index + 1] ?? '';
    const description =
      /^(\s{2,}|\s*$)/.test(nextLine) && !/https?:\/\//.test(nextLine)
        ? nextLine
        : '';
    addResource(resources, result[2], result[1], description);
  });

  Array.from(text.matchAll(/https?:\/\/[^\s)]+/g)).forEach((match) => {
    const url = normalizeUrl(match[0]);
    if (resources.has(url)) return;
    addResource(resources, url, new URL(url).hostname.replace(/^www\./, ''));
  });

  return Array.from(resources.values()).slice(0, 5);
}

function summaryFrom(text: string): string {
  const first = text
    .split('\n')
    .map((line) => cleanLine(line))
    .find((line) => line.length > 40 && !line.startsWith('http'));

  return first?.slice(0, 150) ?? 'Acciones priorizadas por Hermes según tu perfil, ubicación y contexto de riesgo.';
}

function buildPlan(text: string, minItems: number): ActionPlan | null {
  const items = text
    .split('\n')
    .filter(isActionLine)
    .map(cleanLine)
    .filter((line, index, arr) => arr.indexOf(line) === index)
    .slice(0, 12)
    .map<ActionPlanItem>((line, index) => ({
      id: `action-${Date.now()}-${index}`,
      text: line,
      phase: phaseFor(line),
    }));

  if (items.length < minItems) return null;

  return {
    id: `plan-${Date.now()}`,
    title: 'Plan de acción familiar',
    summary: summaryFrom(text),
    createdAt: new Date().toISOString(),
    items,
    resources: extractResources(text),
  };
}

export function actionPlanFromHermesText(text: string, userMessage: string): ActionPlan | null {
  const lower = text.toLowerCase();
  const looksLikePlan =
    hasStructuredPlanShape(text) &&
    (
      lower.includes('plan') ||
      lower.includes('acciones') ||
      lower.includes('evac') ||
      lower.includes('refugio') ||
      lower.includes('albergue')
    );

  if (!userAskedForPlan(userMessage) || !looksLikePlan) return null;

  const plan = buildPlan(text, 3);
  if (!plan) return null;
  const phases = new Set(plan.items.map((item) => item.phase));
  if (phases.size < 2) return null;
  return plan;
}

export function forcedActionPlanFromHermesText(text: string): ActionPlan | null {
  return buildPlan(text, 2);
}

export const PLAN_MODE_INSTRUCTION =
  '\n\n(El ciudadano activó el modo plan de acción en la interfaz. ' +
  'Entrega ya el plan estructurado en los tres bloques exactos — "Ahora mismo", ' +
  '"Próximas 24 horas", "Si el escenario empeora" — con acciones específicas, ' +
  'y cierra con la sección "Recursos verificados" con URLs completas.)';
