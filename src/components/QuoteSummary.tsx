import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FileImage } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { QuoteResult } from '@/lib/pricing';

interface Props {
  quote: QuoteResult;
  sets: number;
  projectName: string;
  clientName: string;
}

const QuoteSummary = ({ quote, sets, projectName, clientName }: Props) => {
  const formatW = (n: number) => `₩${n.toLocaleString()}`;
  const summaryRef = useRef<HTMLDivElement>(null);

  const exportAsImage = async () => {
    if (!summaryRef.current) return;
    const canvas = await html2canvas(summaryRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `견적서_${projectName || '보드게임'}_${sets}세트.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const hasItems = quote.items.length > 0 || quote.customItems.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-lg border border-border bg-card sticky top-20"
    >
      <div ref={summaryRef} className="p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-card-foreground">견적서</h2>
          <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString('ko-KR')}</span>
        </div>
        {(projectName || clientName) && (
          <div className="text-xs text-muted-foreground mb-3 space-y-0.5">
            {projectName && <p>프로젝트: {projectName}</p>}
            {clientName && <p>고객: {clientName}</p>}
          </div>
        )}
        <p className="text-xs text-muted-foreground mb-4">
          {sets <= 10 ? '🔧 소량 핸드메이드' : sets <= 100 ? '⚙️ 반자동 공정' : '🏭 소규모 양산'}
          {' · '}{sets}세트
        </p>

        {!hasItems ? (
          <p className="text-sm text-muted-foreground py-8 text-center">구성품을 선택해주세요</p>
        ) : (
          <>
            <div className="space-y-2.5 mb-4">
              {quote.items.map((item, i) => (
                <div key={i} className="text-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-card-foreground font-medium truncate mr-2">
                      {item.name} <span className="text-muted-foreground text-xs font-normal">({item.option})</span>
                    </span>
                    <span className="font-semibold text-card-foreground whitespace-nowrap">{formatW(item.subtotal)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {item.size && (
                      <span className="text-xs text-muted-foreground">📐 {item.size}</span>
                    )}
                    {item.coating && (
                      <span className="text-xs text-muted-foreground">✨ {item.coating}</span>
                    )}
                    {item.material && (
                      <span className="text-xs text-muted-foreground">📄 {item.material}</span>
                    )}
                    {item.finishing && (
                      <span className="text-xs text-muted-foreground">📋 {item.finishing}</span>
                    )}
                    {item.magnetLock && (
                      <span className="text-xs text-muted-foreground">🧲 자석 여닫이</span>
                    )}
                    {item.stickerAttach && (
                      <span className="text-xs text-muted-foreground">🏷️ 스티커 부착</span>
                    )}
                  </div>
                </div>
              ))}
              {quote.customItems.map((ci, i) => (
                <div key={`c-${i}`} className="flex justify-between text-sm">
                  <span className="text-card-foreground truncate mr-2">
                    {ci.name || '(미입력)'} <span className="text-muted-foreground text-xs">(직접입력)</span>
                  </span>
                  <span className="font-semibold text-card-foreground whitespace-nowrap">{formatW(ci.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>재료비</span><span>{formatW(quote.breakdown.materialCost)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>공임비</span><span>{formatW(quote.breakdown.laborCost)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>셋업비</span><span>{formatW(quote.breakdown.setupCost)}</span>
              </div>
              {quote.customTotal > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>직접입력 합계</span><span>{formatW(quote.customTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>마진 ({Math.round(quote.margin * 100)}%)</span><span>{formatW(quote.breakdown.marginAmount)}</span>
              </div>
            </div>

            <div className="border-t border-border mt-3 pt-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-muted-foreground">총 견적가 ({sets}세트)</p>
                  <p className="text-xl font-bold text-primary">{formatW(quote.total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">세트당 단가</p>
                  <p className="text-base font-bold text-card-foreground">{formatW(quote.unitPrice)}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-md bg-muted text-xs text-muted-foreground">
              <p className="font-medium mb-1">참고사항</p>
              <ul className="space-y-0.5">
                <li>• 디자인 복잡도에 따라 변동 가능</li>
                <li>• 셋업비는 최초 1회 발생</li>
                <li>• VAT 별도</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {hasItems && (
        <div className="px-5 pb-4 flex gap-2 no-print">
          <button
            onClick={exportAsImage}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <FileImage className="w-4 h-4" /> 이미지 저장
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default QuoteSummary;
