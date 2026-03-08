// 보드게임 주문제작 견적 산출 시스템

export interface ComponentOption {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  options: SubOption[];
  allowCustom?: boolean;
  needsSize?: boolean;
  sizeFields?: ('w' | 'h' | 'd')[]; // which size fields to show, defaults to ['w','h','d']
  needsQuantity?: boolean;
  quantityLabel?: string;
  defaultQuantity?: number;
  hasCoating?: boolean;
  hasMaterial?: boolean;
  materialOptions?: { id: string; label: string; priceMultiplier: number }[];
  hasFinishing?: boolean;
  finishingOptions?: { id: string; label: string; priceAdd: number; note?: string }[];
  hasMagnetOption?: boolean;
  magnetPriceAdd?: number;
  hasSticker?: boolean;
  notes?: string[];
  sortOrder: number;
}

export interface SubOption {
  id: string;
  label: string;
  description: string;
  basePrice: number;
  setupCost: number;
  laborMinutes: number;
  note?: string;
  allowedFinishings?: string[];
}

export interface CustomItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Selection {
  optionId: string;
  quantity: number;
  size?: { w: string; h: string; d: string };
  coating?: string;
  material?: string;
  finishing?: string;
  magnetLock?: boolean;
  stickerAttach?: boolean;
}

export interface QuoteItem {
  componentId: string;
  optionId: string;
  quantity?: number;
  size?: { w: string; h: string; d: string };
  coating?: string;
  material?: string;
  finishing?: string;
  magnetLock?: boolean;
  stickerAttach?: boolean;
}

export interface QuoteResult {
  items: QuoteLineItem[];
  customItems: { name: string; unitPrice: number; quantity: number; subtotal: number }[];
  subtotal: number;
  laborCost: number;
  setupCost: number;
  margin: number;
  total: number;
  unitPrice: number;
  customTotal: number;
  breakdown: {
    materialCost: number;
    laborCost: number;
    setupCost: number;
    marginAmount: number;
  };
}

export interface QuoteLineItem {
  name: string;
  option: string;
  quantity: number;
  materialCost: number;
  laborCost: number;
  setupCost: number;
  subtotal: number;
  size?: string;
  coating?: string;
  material?: string;
  finishing?: string;
  magnetLock?: boolean;
  stickerAttach?: boolean;
  sortOrder: number;
}

// 수량 구간별 할인율
function getVolumeDiscount(sets: number): number {
  if (sets <= 3) return 1.0;
  if (sets <= 10) return 0.92;
  if (sets <= 30) return 0.82;
  if (sets <= 50) return 0.72;
  if (sets <= 100) return 0.62;
  if (sets <= 300) return 0.52;
  if (sets <= 500) return 0.45;
  return 0.38;
}

// 소량 핸드메이드 할증
function getHandmadeSurcharge(sets: number): number {
  if (sets <= 3) return 2.5;
  if (sets <= 10) return 1.8;
  if (sets <= 30) return 1.4;
  if (sets <= 50) return 1.15;
  if (sets <= 100) return 1.0;
  return 0.9;
}

const LABOR_RATE_PER_HOUR = 25000;

function getMarginRate(sets: number): number {
  if (sets <= 10) return 0.40;
  if (sets <= 50) return 0.35;
  if (sets <= 100) return 0.30;
  if (sets <= 500) return 0.25;
  return 0.20;
}

const COATING_PRICE: Record<string, number> = {
  none: 0,
  matte: 200,
  glossy: 250,
};

const COATING_LABEL: Record<string, string> = {
  none: '코팅 없음',
  matte: '무광 코팅',
  glossy: '유광 코팅',
};

export function getCoatingLabel(coating?: string): string {
  return coating ? COATING_LABEL[coating] || '' : '';
}

// 싸바리 사이즈 추가금 계산
function getSsabariSizeSurcharge(size?: { w: string; h: string; d: string }): number {
  if (!size) return 0;
  const w = parseInt(size.w) || 0;
  const h = parseInt(size.h) || 0;
  const d = parseInt(size.d) || 0;
  const maxDim = Math.max(w, h);
  const volume = w * h * Math.max(d, 1);

  let surcharge = 0;
  // 대형 사이즈 할증
  if (maxDim > 350) surcharge += 3000;
  if (maxDim > 450) surcharge += 5000;
  // 부피 기준 할증
  if (volume > 5000000) surcharge += 2000;
  if (volume > 10000000) surcharge += 4000;
  // 높이 할증
  if (d > 80) surcharge += 2000;
  if (d > 120) surcharge += 3000;

  return surcharge;
}

export function calculateQuote(
  items: QuoteItem[],
  sets: number,
  components: ComponentOption[],
  customItems: CustomItem[] = []
): QuoteResult {
  const volumeDiscount = getVolumeDiscount(sets);
  const handmadeSurcharge = getHandmadeSurcharge(sets);
  const marginRate = getMarginRate(sets);

  const lineItems: QuoteLineItem[] = [];
  let totalMaterial = 0;
  let totalLabor = 0;
  let totalSetup = 0;

  for (const item of items) {
    const comp = components.find(c => c.id === item.componentId);
    if (!comp) continue;
    const opt = comp.options.find(o => o.id === item.optionId);
    if (!opt) continue;

    const qty = item.quantity || 1;

    // Special fixed pricing for 300g board
    const is300gBoard = comp.id === 'board' && item.material === 'mat-300g';
    if (is300gBoard) {
      const baseFixed = 15000;
      // A3 surcharge: A3 = 297x420, check if either dimension exceeds
      let sizeSurcharge = 0;
      if (item.size) {
        const w = parseInt(item.size.w) || 0;
        const h = parseInt(item.size.h) || 0;
        if (w > 420 || h > 420 || (w > 297 && h > 297)) {
          sizeSurcharge = 10000;
        }
      }
      const unitFixed = baseFixed + sizeSurcharge;
      // First board full price, additional at 50%
      const totalForQty = qty <= 1 ? unitFixed : unitFixed + (qty - 1) * Math.round(unitFixed * 0.5);
      const coatingAdd = comp.hasCoating ? (COATING_PRICE[item.coating || 'none'] || 0) : 0;
      const materialForSets = (totalForQty + coatingAdd * qty) * sets;
      const laborForSets = 0;
      const setupForAll = 0;

      let sizeStr: string | undefined;
      if (item.size) {
        const fields = comp.sizeFields || ['w', 'h'];
        const parts = fields.map(f => item.size![f]).filter(Boolean);
        if (parts.length > 0) sizeStr = parts.join('×') + 'mm';
      }

      lineItems.push({
        name: comp.name,
        option: opt.label,
        quantity: qty,
        materialCost: Math.round(materialForSets),
        laborCost: 0,
        setupCost: 0,
        subtotal: Math.round(materialForSets),
        size: sizeStr,
        coating: comp.hasCoating && item.coating && item.coating !== 'none' ? getCoatingLabel(item.coating) : undefined,
        material: comp.materialOptions?.find(m => m.id === item.material)?.label,
        finishing: undefined,
        magnetLock: false,
        stickerAttach: false,
        sortOrder: comp.sortOrder,
      });

      totalMaterial += materialForSets;
      continue;
    }

    let materialMultiplier = 1;
    if (item.material && comp.materialOptions) {
      const mat = comp.materialOptions.find(m => m.id === item.material);
      if (mat) materialMultiplier = mat.priceMultiplier;
    }

    let finishingAdd = 0;
    if (item.finishing && comp.finishingOptions) {
      const fin = comp.finishingOptions.find(f => f.id === item.finishing);
      if (fin) finishingAdd = fin.priceAdd;
    }

    const coatingAdd = comp.hasCoating ? (COATING_PRICE[item.coating || 'none'] || 0) : 0;
    const magnetAdd = item.magnetLock && comp.magnetPriceAdd ? comp.magnetPriceAdd : 0;

    // Ssabari size surcharge
    const ssabariSurcharge = item.optionId === 'pkg-ssabari' ? getSsabariSizeSurcharge(item.size) : 0;

    const baseUnitPrice = (opt.basePrice * materialMultiplier + finishingAdd + coatingAdd + magnetAdd + ssabariSurcharge);
    const materialPerSet = baseUnitPrice * qty * volumeDiscount;
    const laborPerSet = (opt.laborMinutes * qty / 60) * LABOR_RATE_PER_HOUR * handmadeSurcharge;
    const setupForAll = opt.setupCost;

    const totalMaterialForSets = materialPerSet * sets;
    const totalLaborForSets = laborPerSet * sets;

    // Format size
    let sizeStr: string | undefined;
    if (item.size) {
      const fields = comp.sizeFields || ['w', 'h', 'd'];
      const parts = fields.map(f => item.size![f]).filter(Boolean);
      if (parts.length > 0) sizeStr = parts.join('×') + 'mm';
    }

    lineItems.push({
      name: comp.name,
      option: opt.label,
      quantity: qty,
      materialCost: Math.round(totalMaterialForSets),
      laborCost: Math.round(totalLaborForSets),
      setupCost: Math.round(setupForAll),
      subtotal: Math.round(totalMaterialForSets + totalLaborForSets + setupForAll),
      size: sizeStr,
      coating: comp.hasCoating && item.coating && item.coating !== 'none' ? getCoatingLabel(item.coating) : undefined,
      material: item.material ? comp.materialOptions?.find(m => m.id === item.material)?.label : undefined,
      finishing: item.finishing ? comp.finishingOptions?.find(f => f.id === item.finishing)?.label : undefined,
      magnetLock: item.magnetLock,
      stickerAttach: item.stickerAttach,
      sortOrder: comp.sortOrder,
    });

    totalMaterial += totalMaterialForSets;
    totalLabor += totalLaborForSets;
    totalSetup += setupForAll;
  }

  // Sort by component sortOrder
  lineItems.sort((a, b) => a.sortOrder - b.sortOrder);

  const subtotal = totalMaterial + totalLabor + totalSetup;
  const marginAmount = subtotal * marginRate;

  const customLineItems = customItems.map(ci => ({
    name: ci.name,
    unitPrice: ci.unitPrice,
    quantity: ci.quantity,
    subtotal: ci.unitPrice * ci.quantity * sets,
  }));
  const customTotal = customLineItems.reduce((sum, ci) => sum + ci.subtotal, 0);

  const total = Math.round(subtotal + marginAmount + customTotal);

  return {
    items: lineItems,
    customItems: customLineItems,
    subtotal: Math.round(subtotal),
    laborCost: Math.round(totalLabor),
    setupCost: Math.round(totalSetup),
    margin: marginRate,
    total,
    unitPrice: Math.round(total / sets),
    customTotal: Math.round(customTotal),
    breakdown: {
      materialCost: Math.round(totalMaterial),
      laborCost: Math.round(totalLabor),
      setupCost: Math.round(totalSetup),
      marginAmount: Math.round(marginAmount),
    },
  };
}

// ===== 구성품 데이터 =====
export const BOARD_GAME_COMPONENTS: ComponentOption[] = [
  {
    id: 'package',
    name: '패키지 (박스)',
    category: '포장',
    icon: '📦',
    description: '게임 박스 선택',
    needsSize: true,
    sizeFields: ['w', 'h', 'd'],
    hasCoating: true,
    hasMagnetOption: true,
    magnetPriceAdd: 3000,
    sortOrder: 1,
    options: [
      { id: 'pkg-ssabari', label: '싸바리 박스', description: '아트지 인쇄 + 합지, 사이즈 맞춤 제작', basePrice: 8000, setupCost: 100000, laborMinutes: 40, note: '자석 여닫이 옵션 선택 가능 · 대형 사이즈 시 추가금 발생' },
      { id: 'pkg-ready-s', label: '기성품 박스 (소)', description: '시중 규격 소형 박스', basePrice: 1200, setupCost: 0, laborMinutes: 3 },
      { id: 'pkg-ready-m', label: '기성품 박스 (중)', description: '시중 규격 중형 박스', basePrice: 1800, setupCost: 0, laborMinutes: 5 },
      { id: 'pkg-ready-l', label: '기성품 박스 (대)', description: '시중 규격 대형 박스', basePrice: 2500, setupCost: 0, laborMinutes: 5 },
      { id: 'pkg-minicard', label: '미니카드 박스', description: '카드게임용 소형 박스', basePrice: 2000, setupCost: 20000, laborMinutes: 10 },
      { id: 'pkg-tin', label: '틴케이스', description: '금속 틴케이스, 인쇄 가능', basePrice: 5000, setupCost: 150000, laborMinutes: 10 },
    ],
  },
  {
    id: 'board',
    name: '보드판 (게임판)',
    category: '보드',
    icon: '🗺️',
    description: '메인 게임판',
    needsSize: true,
    sizeFields: ['w', 'h'],
    needsQuantity: true,
    quantityLabel: '보드판 수량',
    defaultQuantity: 1,
    hasCoating: true,
    hasMaterial: true,
    materialOptions: [
      { id: 'mat-300g', label: '300g (스노우/아트지)', priceMultiplier: 0.08 },
      { id: 'mat-1200g', label: '1200g (표지바리)', priceMultiplier: 1.8 },
    ],
    sortOrder: 2,
    options: [
      { id: 'board-fold2', label: '2단 접이식', description: '양면 인쇄 + 천테이프 접합', basePrice: 4000, setupCost: 30000, laborMinutes: 20 },
      { id: 'board-fold4', label: '4단 접이식', description: '양면 인쇄 + 천테이프 접합', basePrice: 7000, setupCost: 45000, laborMinutes: 30 },
      { id: 'board-flat', label: '평판형 (1장)', description: '하드보드 + 인쇄', basePrice: 5500, setupCost: 25000, laborMinutes: 10 },
    ],
    notes: ['💡 300g(스노우/아트지)는 고정 단가 15,000원. A3 초과 시 +10,000원. 추가 수량은 50% 단가 적용.'],
  },
  {
    id: 'cards',
    name: '카드',
    category: '카드',
    icon: '🃏',
    description: '게임 카드 (장수 입력)',
    needsQuantity: true,
    quantityLabel: '카드 장수',
    defaultQuantity: 54,
    allowCustom: true,
    hasCoating: true,
    sortOrder: 3,
    options: [
      { id: 'card-58x88', label: '표준 카드 (58×88mm)', description: '300g 아트지, 양면 컬러', basePrice: 110, setupCost: 30000, laborMinutes: 0.3 },
      { id: 'card-63x88', label: '표준 카드 (63×88mm)', description: '300g 아트지, 양면 컬러', basePrice: 120, setupCost: 30000, laborMinutes: 0.3 },
      { id: 'card-mini', label: '미니 카드 (50×90mm)', description: '300g 아트지, 양면 컬러 (황금열쇠 사이즈)', basePrice: 100, setupCost: 25000, laborMinutes: 0.25 },
      { id: 'card-tarot', label: '타로 사이즈 (70×120mm)', description: '350g 아트지, 양면 컬러', basePrice: 180, setupCost: 35000, laborMinutes: 0.4 },
      { id: 'card-custom', label: '비규격 카드', description: '사이즈 직접 입력', basePrice: 150, setupCost: 40000, laborMinutes: 0.4 },
    ],
    sizeFields: ['w', 'h'],
  },
  {
    id: 'dice',
    name: '주사위',
    category: '소품',
    icon: '🎲',
    description: '주사위 (개수 입력)',
    needsQuantity: true,
    quantityLabel: '주사위 개수',
    defaultQuantity: 2,
    sortOrder: 4,
    options: [
      { id: 'dice-standard', label: '표준 D6 (16mm)', description: '아크릴 기성품, 숫자 각인', basePrice: 500, setupCost: 0, laborMinutes: 2 },
      { id: 'dice-custom', label: '커스텀 각인 D6', description: '16mm, 면별 커스텀 심볼 레이저 각인', basePrice: 1500, setupCost: 30000, laborMinutes: 5 },
      { id: 'dice-wood', label: '원목 주사위', description: '20mm 자작나무, CNC 가공 + 도장', basePrice: 3000, setupCost: 20000, laborMinutes: 15 },
      { id: 'dice-poly', label: '다면체 세트 (D4~D20)', description: '7종 세트, 아크릴 기성품', basePrice: 3500, setupCost: 0, laborMinutes: 3 },
    ],
  },
  {
    id: 'meeple',
    name: '게임말 / 미플',
    category: '소품',
    icon: '♟️',
    description: '플레이어 말 (개수 입력)',
    needsQuantity: true,
    quantityLabel: '말 개수',
    defaultQuantity: 4,
    sortOrder: 5,
    options: [
      { id: 'meeple-thomson-s', label: '합지 톰슨 (30×50mm)', description: '합지 톰슨 다이컷 + 투명 거치대 기본 포함, 판 보유', basePrice: 200, setupCost: 0, laborMinutes: 2 },
      { id: 'meeple-thomson-m', label: '합지 톰슨 (35×50mm)', description: '합지 톰슨 다이컷 + 투명 거치대 기본 포함, 판 보유', basePrice: 250, setupCost: 0, laborMinutes: 2 },
      { id: 'meeple-wood', label: '원목 미플 (기본형)', description: '25mm, 기성품 원목 미플', basePrice: 400, setupCost: 0, laborMinutes: 1 },
      { id: 'meeple-acrylic', label: '아크릴 스탠디 (30mm + 받침대)', description: '스티커 부착 가능', basePrice: 700, setupCost: 15000, laborMinutes: 4 },
      { id: 'meeple-plastic', label: '사출 플라스틱 말', description: '금형 사출, 단색, 30mm', basePrice: 300, setupCost: 500000, laborMinutes: 1, note: '⚠️ 1,000세트 이상 권장. 소량은 기성품 사용을 추천합니다.' },
    ],
    notes: ['💡 합지 톰슨은 투명 거치대가 기본 포함됩니다.'],
  },
  {
    id: 'money',
    name: '게임 지폐',
    category: '소품',
    icon: '💵',
    description: '게임 내 화폐 (장수 입력)',
    needsQuantity: true,
    needsSize: true,
    sizeFields: ['w', 'h'],
    quantityLabel: '지폐 장수',
    defaultQuantity: 60,
    hasCoating: true,
    sortOrder: 6,
    options: [
      { id: 'money-paper', label: '종이 지폐', description: '100g 모조지, 양면 컬러, 재단', basePrice: 30, setupCost: 15000, laborMinutes: 0.1 },
      { id: 'money-coated', label: '코팅 지폐', description: '200g 아트지, 양면 컬러', basePrice: 60, setupCost: 20000, laborMinutes: 0.15 },
    ],
  },
  {
    id: 'token',
    name: '토큰 / 칩',
    category: '소품',
    icon: '🪙',
    description: '점수·자원 토큰 등 (개수 입력)',
    needsQuantity: true,
    needsSize: true,
    sizeFields: ['w', 'h'],
    quantityLabel: '토큰 개수',
    defaultQuantity: 20,
    hasCoating: false,
    hasSticker: true,
    sortOrder: 7,
    options: [
      { id: 'token-plastic', label: '플라스틱 토큰', description: '기성품, 가벼운 소재, 가성비 최고', basePrice: 100, setupCost: 0, laborMinutes: 0.5 },
      { id: 'token-cardboard', label: '판지 토큰 (펀칭)', description: '2mm 회색판지, 양면 인쇄 + 다이컷', basePrice: 80, setupCost: 50000, laborMinutes: 0.5 },
      { id: 'token-wood', label: '원목 토큰', description: '원형, 레이저각인 또는 인쇄', basePrice: 300, setupCost: 20000, laborMinutes: 3 },
      { id: 'token-acrylic', label: '아크릴 토큰', description: '3mm 아크릴, UV인쇄', basePrice: 500, setupCost: 25000, laborMinutes: 2 },
      { id: 'token-metal', label: '금속 코인', description: '아연합금, 양면 각인 + 에나멜', basePrice: 2000, setupCost: 200000, laborMinutes: 1 },
    ],
  },
  {
    id: 'manual',
    name: '매뉴얼 (규칙서)',
    category: '인쇄물',
    icon: '📖',
    description: '게임 규칙 설명서',
    needsSize: true,
    sizeFields: ['w', 'h'],
    hasCoating: true,
    hasFinishing: true,
    finishingOptions: [
      { id: 'fin-single', label: '단면', priceAdd: 0 },
      { id: 'fin-fold', label: '접지', priceAdd: 30 },
      { id: 'fin-leaflet', label: '리플렛', priceAdd: 80 },
      { id: 'fin-staple', label: '중철', priceAdd: 200, note: '⚠️ 중철 제본은 페이지 수가 4의 배수여야 합니다.' },
      { id: 'fin-perfect', label: '무선제본', priceAdd: 500 },
    ],
    sortOrder: 8,
    options: [
      { id: 'manual-basic', label: '기본 매뉴얼', description: '양면 컬러 인쇄', basePrice: 150, setupCost: 5000, laborMinutes: 1.5 },
      { id: 'manual-booklet', label: '소책자 (8~16p)', description: '양면 컬러 인쇄', basePrice: 500, setupCost: 10000, laborMinutes: 3 },
      { id: 'manual-premium', label: '프리미엄 북 (24p+)', description: '고급지, 양면 컬러 인쇄', basePrice: 1200, setupCost: 20000, laborMinutes: 6 },
    ],
  },
  {
    id: 'extras',
    name: '기타 구성품',
    category: '기타',
    icon: '🧩',
    description: '추가 구성품 선택 + 직접 입력 가능',
    allowCustom: true,
    needsQuantity: true,
    quantityLabel: '개수',
    defaultQuantity: 1,
    sortOrder: 9,
    options: [
      { id: 'extra-boxtray', label: '박스 트레이 (종이)', description: '종이 합지 트레이, 간단한 칸 구성', basePrice: 800, setupCost: 15000, laborMinutes: 5 },
      { id: 'extra-pettray', label: 'PET 트레이 (진공성형)', description: '진공 성형 플라스틱 트레이', basePrice: 2500, setupCost: 150000, laborMinutes: 3, note: '⚠️ 1,000세트 이상 권장. 소량은 종이 트레이 사용을 추천합니다.' },
      { id: 'extra-divider', label: '칸막이', description: '골판지 또는 합지 칸막이', basePrice: 1000, setupCost: 20000, laborMinutes: 5 },
      { id: 'extra-timer', label: '모래시계 (30초/1분)', description: '기성품 모래시계', basePrice: 1500, setupCost: 0, laborMinutes: 1 },
      { id: 'extra-marker', label: '보드마카', description: '보드용 마커펜', basePrice: 800, setupCost: 0, laborMinutes: 1 },
      { id: 'extra-other', label: '기타', description: '기타 소품 (직접 입력으로 추가)', basePrice: 500, setupCost: 0, laborMinutes: 2 },
    ],
  },
];
