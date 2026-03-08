// 보드게임 주문제작 견적 산출 시스템
// 소량(1~10): 완전 핸드메이드 - 높은 공임비
// 중량(11~100): 반자동 - 중간 공임비  
// 대량(101~1000): 소규모 양산 - 낮은 단가

export interface ComponentOption {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  options: SubOption[];
}

export interface SubOption {
  id: string;
  label: string;
  description: string;
  basePrice: number; // 1개 기준 원가 (원)
  setupCost: number; // 초기 셋업비 (금형, 디자인 등)
  laborMinutes: number; // 1개당 수작업 소요시간(분)
}

export interface QuoteItem {
  componentId: string;
  optionId: string;
  quantity?: number; // 카드 장수 등 내부 수량
}

export interface QuoteResult {
  items: QuoteLineItem[];
  subtotal: number;
  laborCost: number;
  setupCost: number;
  margin: number;
  total: number;
  unitPrice: number;
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
  materialCost: number;
  laborCost: number;
  setupCost: number;
  subtotal: number;
}

// 수량 구간별 할인율 (대량일수록 단가 하락)
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

// 소량 핸드메이드 할증 (수작업 비중 증가)
function getHandmadeSurcharge(sets: number): number {
  if (sets <= 3) return 2.5; // 완전 수작업
  if (sets <= 10) return 1.8;
  if (sets <= 30) return 1.4;
  if (sets <= 50) return 1.15;
  if (sets <= 100) return 1.0;
  return 0.9; // 대량은 공정 효율화
}

// 시간당 공임비 (원)
const LABOR_RATE_PER_HOUR = 25000;

// 마진율
function getMarginRate(sets: number): number {
  if (sets <= 10) return 0.40;
  if (sets <= 50) return 0.35;
  if (sets <= 100) return 0.30;
  if (sets <= 500) return 0.25;
  return 0.20;
}

export function calculateQuote(
  items: QuoteItem[],
  sets: number,
  components: ComponentOption[]
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
    const materialPerSet = opt.basePrice * qty * volumeDiscount;
    const laborPerSet = (opt.laborMinutes * qty / 60) * LABOR_RATE_PER_HOUR * handmadeSurcharge;
    const setupForAll = opt.setupCost; // 셋업비는 총 1회

    const totalMaterialForSets = materialPerSet * sets;
    const totalLaborForSets = laborPerSet * sets;

    lineItems.push({
      name: comp.name,
      option: opt.label,
      materialCost: Math.round(totalMaterialForSets),
      laborCost: Math.round(totalLaborForSets),
      setupCost: Math.round(setupForAll),
      subtotal: Math.round(totalMaterialForSets + totalLaborForSets + setupForAll),
    });

    totalMaterial += totalMaterialForSets;
    totalLabor += totalLaborForSets;
    totalSetup += setupForAll;
  }

  const subtotal = totalMaterial + totalLabor + totalSetup;
  const marginAmount = subtotal * marginRate;
  const total = Math.round(subtotal + marginAmount);

  return {
    items: lineItems,
    subtotal: Math.round(subtotal),
    laborCost: Math.round(totalLabor),
    setupCost: Math.round(totalSetup),
    margin: marginRate,
    total,
    unitPrice: Math.round(total / sets),
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
    description: '게임 박스. 소량은 수작업 재단+조립, 대량은 금형 제작.',
    options: [
      { id: 'pkg-basic', label: '기본 싸바리 박스 (소형)', description: '200×200×50mm, 아트지 인쇄 + 골판지', basePrice: 3500, setupCost: 50000, laborMinutes: 20 },
      { id: 'pkg-medium', label: '중형 싸바리 박스', description: '300×300×80mm, 아트지 인쇄 + 골판지 + 내부 칸막이', basePrice: 6000, setupCost: 80000, laborMinutes: 35 },
      { id: 'pkg-large', label: '대형 프리미엄 박스', description: '400×300×100mm, 고급 코팅 + 자석 잠금 + 내부 EVA', basePrice: 12000, setupCost: 150000, laborMinutes: 60 },
      { id: 'pkg-sleeve', label: '슬리브형 박스', description: '속박스 + 겉슬리브, 고급감', basePrice: 8000, setupCost: 100000, laborMinutes: 40 },
    ],
  },
  {
    id: 'board',
    name: '보드판 (게임판)',
    category: '보드',
    icon: '🗺️',
    description: '메인 게임판. 접이식/1장 평판/퍼즐형 선택.',
    options: [
      { id: 'board-fold2', label: '2단 접이식', description: '400×400mm 펼침, 2mm 회색판지 + 양면 인쇄 + 천테이프', basePrice: 4000, setupCost: 40000, laborMinutes: 25 },
      { id: 'board-fold4', label: '4단 접이식', description: '500×500mm 펼침, 2.5mm 판지 + 양면 인쇄 + 천테이프 접합', basePrice: 7000, setupCost: 60000, laborMinutes: 40 },
      { id: 'board-flat', label: '평판형 (1장)', description: '300×300mm, 3mm MDF 또는 하드보드 + UV 인쇄', basePrice: 5500, setupCost: 35000, laborMinutes: 15 },
      { id: 'board-puzzle', label: '퍼즐형 타일보드', description: '6조각 결합형, 각 150×150mm, 퍼즐 다이컷', basePrice: 9000, setupCost: 90000, laborMinutes: 50 },
      { id: 'board-neoprene', label: '네오프렌 매트', description: '500×500mm, 고무 매트 + 풀컬러 승화전사', basePrice: 15000, setupCost: 120000, laborMinutes: 10 },
    ],
  },
  {
    id: 'cards',
    name: '카드',
    category: '카드',
    icon: '🃏',
    description: '게임 카드. 장당 단가 적용, 수량(장수) 입력 필요.',
    options: [
      { id: 'card-standard', label: '표준 카드 (63×88mm)', description: '300g 아트지, 양면 컬러, 무광 코팅', basePrice: 120, setupCost: 30000, laborMinutes: 0.3 },
      { id: 'card-mini', label: '미니 카드 (44×67mm)', description: '300g 아트지, 양면 컬러', basePrice: 90, setupCost: 25000, laborMinutes: 0.25 },
      { id: 'card-tarot', label: '타로 사이즈 (70×120mm)', description: '350g 아트지, 양면 컬러, 유광 코팅', basePrice: 180, setupCost: 35000, laborMinutes: 0.4 },
      { id: 'card-linen', label: '리넨 엠보 카드', description: '320g 리넨지, 양면 컬러, 리넨 엠보 가공', basePrice: 200, setupCost: 40000, laborMinutes: 0.35 },
    ],
  },
  {
    id: 'dice',
    name: '주사위',
    category: '소품',
    icon: '🎲',
    description: '주사위. 소량은 기성품 커스텀 각인, 대량은 금형 제작.',
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
    description: '플레이어 말. 나무/아크릴/3D프린팅 선택.',
    options: [
      { id: 'meeple-wood', label: '원목 미플 (기본형)', description: '25mm, 자작나무 레이저컷 + 도색', basePrice: 800, setupCost: 15000, laborMinutes: 5 },
      { id: 'meeple-acrylic', label: '아크릴 스탠디', description: '30mm, 투명 아크릴 + UV 인쇄 + 받침대', basePrice: 1200, setupCost: 25000, laborMinutes: 8 },
      { id: 'meeple-3d', label: '3D 프린팅 피규어', description: '레진 3D프린팅, 40mm, 수작업 도색', basePrice: 5000, setupCost: 0, laborMinutes: 30 },
      { id: 'meeple-plastic', label: '사출 플라스틱 말', description: '금형 사출, 단색, 30mm', basePrice: 300, setupCost: 500000, laborMinutes: 1 },
    ],
  },
  {
    id: 'money',
    name: '게임 지폐',
    category: '소품',
    icon: '💵',
    description: '게임 내 화폐. 장당 단가, 수량 입력.',
    options: [
      { id: 'money-paper', label: '종이 지폐', description: '120g 모조지, 단면 컬러, 재단', basePrice: 30, setupCost: 15000, laborMinutes: 0.1 },
      { id: 'money-coated', label: '코팅 지폐', description: '200g 아트지, 양면 컬러, 무광 코팅', basePrice: 60, setupCost: 20000, laborMinutes: 0.15 },
      { id: 'money-plastic', label: '플라스틱 지폐', description: 'PVC 소재, 양면 컬러, 내구성 우수', basePrice: 150, setupCost: 40000, laborMinutes: 0.2 },
    ],
  },
  {
    id: 'token',
    name: '토큰 / 칩',
    category: '소품',
    icon: '🪙',
    description: '점수 토큰, 자원 토큰 등. 개당 단가.',
    options: [
      { id: 'token-cardboard', label: '판지 토큰 (펀칭)', description: '2mm 회색판지, 양면 인쇄 + 다이컷 펀칭', basePrice: 80, setupCost: 50000, laborMinutes: 0.5 },
      { id: 'token-wood', label: '원목 토큰', description: '직경 20mm, 원형, 레이저각인 또는 인쇄', basePrice: 300, setupCost: 20000, laborMinutes: 3 },
      { id: 'token-acrylic', label: '아크릴 토큰', description: '직경 25mm, 3mm 아크릴, UV인쇄', basePrice: 500, setupCost: 25000, laborMinutes: 2 },
      { id: 'token-metal', label: '금속 코인', description: '직경 25mm, 아연합금, 양면 각인 + 에나멜', basePrice: 2000, setupCost: 200000, laborMinutes: 1 },
    ],
  },
  {
    id: 'manual',
    name: '매뉴얼 (규칙서)',
    category: '인쇄물',
    icon: '📖',
    description: '게임 규칙 설명서.',
    options: [
      { id: 'manual-single', label: '단면 시트 (A4)', description: 'A4 양면 컬러, 3단 접지', basePrice: 200, setupCost: 10000, laborMinutes: 2 },
      { id: 'manual-booklet4', label: '소책자 (8p)', description: 'A5 크기, 8페이지, 중철 제본', basePrice: 800, setupCost: 25000, laborMinutes: 5 },
      { id: 'manual-booklet8', label: '소책자 (16p)', description: 'A5 크기, 16페이지, 중철 제본', basePrice: 1500, setupCost: 35000, laborMinutes: 8 },
      { id: 'manual-premium', label: '프리미엄 북 (32p+)', description: 'A5 크기, 32페이지, 무선 제본 + 고급지', basePrice: 3000, setupCost: 50000, laborMinutes: 12 },
    ],
  },
  {
    id: 'extras',
    name: '기타 구성품',
    category: '기타',
    icon: '🧩',
    description: '타이머, 연필, 봉투, 지퍼백 등.',
    options: [
      { id: 'extra-sandbag', label: '지퍼백 (소품용)', description: '소품 분류용 PE 지퍼백', basePrice: 50, setupCost: 0, laborMinutes: 0.5 },
      { id: 'extra-timer', label: '모래시계 (30초/1분)', description: '기성품 모래시계', basePrice: 1500, setupCost: 0, laborMinutes: 1 },
      { id: 'extra-pencil', label: '연필 + 점수기록지', description: '미니 연필 + 점수 기록지 50매', basePrice: 800, setupCost: 10000, laborMinutes: 3 },
      { id: 'extra-tray', label: '카드 트레이 / 정리함', description: '진공 성형 PET 트레이', basePrice: 2000, setupCost: 80000, laborMinutes: 5 },
    ],
  },
];
