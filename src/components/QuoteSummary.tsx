import { motion } from 'framer-motion';
import type { QuoteResult } from '@/lib/pricing';

interface Props {
  quote: QuoteResult;
  sets: number;
}

const QuoteSummary = ({ quote, sets }: Props) => {
  const formatW = (n: number) => `₩${n.toLocaleString()}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl border border-border bg-card p-6 shadow-elevated sticky top-6"
    >
      <h2 className="text-lg font-bold text-card-foreground mb-1">견적 요약</h2>
      <p className="text-xs text-muted-foreground mb-4">
        {sets <= 10 ? '🔧 소량 핸드메이드 제작' : sets <= 100 ? '⚙️ 반자동 제작 공정' : '🏭 소규모 양산 공정'}
        {' · '}{sets}세트
      </p>

      {quote.items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">구성품을 선택해주세요</p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {quote.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-card-foreground">{item.name} <span className="text-muted-foreground text-xs">({item.option})</span></span>
                <span className="font-medium text-card-foreground">{formatW(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>재료비</span><span>{formatW(quote.breakdown.materialCost)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>공임비 (수작업)</span><span>{formatW(quote.breakdown.laborCost)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>셋업비 (초기비용)</span><span>{formatW(quote.breakdown.setupCost)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>마진 ({Math.round(quote.margin * 100)}%)</span><span>{formatW(quote.breakdown.marginAmount)}</span>
            </div>
          </div>

          <div className="border-t border-border mt-3 pt-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground">총 견적가 ({sets}세트)</p>
                <p className="text-2xl font-bold text-primary">{formatW(quote.total)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">세트당 단가</p>
                <p className="text-lg font-bold text-card-foreground">{formatW(quote.unitPrice)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-secondary text-xs text-secondary-foreground">
            <p className="font-medium mb-1">📋 견적 참고사항</p>
            <ul className="space-y-0.5 text-muted-foreground">
              <li>• 실제 견적은 디자인 복잡도에 따라 변동 가능</li>
              <li>• 셋업비는 최초 1회만 발생</li>
              <li>• {sets <= 10 ? '소량 주문은 100% 수작업으로 공임비 비중이 높습니다' : sets <= 100 ? '중량 주문은 반자동 공정이 적용됩니다' : '대량 주문은 양산 공정으로 단가가 절감됩니다'}</li>
              <li>• VAT 별도</li>
            </ul>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default QuoteSummary;
