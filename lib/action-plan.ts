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

function extractResources(text: string): ActionPlanResource[] {
  const urls = Array.from(text.matchAll(/https?:\/\/[^\s)]+/g)).map((match) => match[0]);
  return Array.from(new Set(urls)).slice(0, 4).map((url, index) => ({
    label: `Fuente ${index + 1}`,
    url,
  }));
}

function summaryFrom(text: string): string {
  const first = text
    .split('\n')
    .map((line) => cleanLine(line))
    .find((line) => line.length > 40 && !line.startsWith('http'));

  return first?.slice(0, 150) ?? 'Acciones priorizadas por Hermes según tu perfil, ubicación y contexto de riesgo.';
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

  const items = text
    .split('\n')
    .filter(isActionLine)
    .map(cleanLine)
    .filter((line, index, arr) => arr.indexOf(line) === index)
    .slice(0, 9)
    .map<ActionPlanItem>((line, index) => ({
      id: `action-${Date.now()}-${index}`,
      text: line,
      phase: phaseFor(line),
    }));

  const phases = new Set(items.map((item) => item.phase));
  if (items.length < 3 || phases.size < 2) return null;

  return {
    id: `plan-${Date.now()}`,
    title: 'Plan de acción familiar',
    summary: summaryFrom(text),
    createdAt: new Date().toISOString(),
    items,
    resources: extractResources(text),
  };
}
