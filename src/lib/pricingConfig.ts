// 수량 구간별 설정 가능한 단가 파라미터

export interface PricingTier {
  maxSets: number; // 이 수량 이하에 적용 (Infinity = 초과분)
  label: string;
  volumeDiscount: number;   // 재료비 할인 배수 (1.0 = 할인 없음)
  handmadeSurcharge: number; // 공임비 배수
  marginRate: number;        // 마진율 (0.40 = 40%)
}

export const DEFAULT_TIERS: PricingTier[] = [
  { maxSets: 3,    label: '1~3',      volumeDiscount: 1.0,  handmadeSurcharge: 2.5,  marginRate: 0.40 },
  { maxSets: 10,   label: '4~10',     volumeDiscount: 0.90, handmadeSurcharge: 1.8,  marginRate: 0.40 },
  { maxSets: 30,   label: '11~30',    volumeDiscount: 0.78, handmadeSurcharge: 1.4,  marginRate: 0.35 },
  { maxSets: 50,   label: '31~50',    volumeDiscount: 0.68, handmadeSurcharge: 1.15, marginRate: 0.35 },
  { maxSets: 100,  label: '51~100',   volumeDiscount: 0.55, handmadeSurcharge: 1.0,  marginRate: 0.30 },
  { maxSets: 300,  label: '101~300',  volumeDiscount: 0.38, handmadeSurcharge: 0.6,  marginRate: 0.25 },
  { maxSets: 500,  label: '301~500',  volumeDiscount: 0.25, handmadeSurcharge: 0.35, marginRate: 0.20 },
  { maxSets: Infinity, label: '501+', volumeDiscount: 0.12, handmadeSurcharge: 0.15, marginRate: 0.15 },
];

export const ADMIN_PASSWORD = 'admin1234';

const STORAGE_KEY = 'boardgame-pricing-tiers';

export function loadTiers(): PricingTier[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as PricingTier[];
      // Restore Infinity
      return parsed.map(t => ({
        ...t,
        maxSets: t.maxSets === null || t.maxSets >= 99999 ? Infinity : t.maxSets,
      }));
    }
  } catch {}
  return DEFAULT_TIERS;
}

export function saveTiers(tiers: PricingTier[]): void {
  // Serialize Infinity as 99999
  const serializable = tiers.map(t => ({
    ...t,
    maxSets: t.maxSets === Infinity ? 99999 : t.maxSets,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export function getTierForSets(sets: number, tiers: PricingTier[]): PricingTier {
  for (const tier of tiers) {
    if (sets <= tier.maxSets) return tier;
  }
  return tiers[tiers.length - 1];
}
