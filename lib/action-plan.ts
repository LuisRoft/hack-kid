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

function cleanLine(line: string): string {
  return line
    .replace(/^\s*[-*•]\s*/, '')
    .replace(/^\s*\d+[.)]\s*/, '')
    .replace(/\*\*/g, '')
    .trim();
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

export function actionPlanFromHermesText(text: string): ActionPlan | null {
  const lower = text.toLowerCase();
  const looksLikePlan =
    lower.includes('plan') ||
    lower.includes('acciones') ||
    lower.includes('evac') ||
    lower.includes('refugio') ||
    lower.includes('albergue') ||
    lower.includes('riesgo');

  if (!looksLikePlan) return null;

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

  if (items.length < 3) return null;

  return {
    id: `plan-${Date.now()}`,
    title: 'Plan de acción familiar',
    summary: summaryFrom(text),
    createdAt: new Date().toISOString(),
    items,
    resources: extractResources(text),
  };
}
