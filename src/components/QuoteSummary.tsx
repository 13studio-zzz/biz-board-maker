import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FileImage, Download, Upload } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { QuoteResult } from '@/lib/pricing';

interface Props {
  quote: QuoteResult;
  sets: number;
  projectName: string;
  clientName: string;
  onImportQuote?: (data: ImportedQuoteData) => void;
}

export interface ImportedQuoteData {
  projectName: string;
  clientName: string;
  sets: number;
  selections: Record<string, any>;
  customItemsMap: Record<string, any[]>;
}

interface ExportData extends ImportedQuoteData {
  exportDate: string;
  version: number;
}

const QuoteSummary = ({ quote, sets, projectName, clientName, onImportQuote }: Props) => {
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

  const exportAsJson = () => {
    const data: ExportData = {
      projectName,
      clientName,
      sets,
      selections: (window as any).__quoteSelections || {},
      customItemsMap: (window as any).__quoteCustomItems || {},
      exportDate: new Date().toISOString(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `견적_${projectName || '보드게임'}_${sets}세트.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importFromJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as ExportData;
          if (data.version && onImportQuote) {
            onImportQuote({
              projectName: data.projectName || '',
              clientName: data.clientName || '',
              sets: data.sets || 10,
              selections: data.selections || {},
              customItemsMap: data.customItemsMap || {},
            });
          }
        } catch {
          alert('유효하지 않은 견적 파일입니다.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
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

      <div className="px-5 pb-4 space-y-2 no-print">
        {hasItems && (
          <div className="flex gap-2">
            <button
              onClick={exportAsImage}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <FileImage className="w-4 h-4" /> 이미지 저장
            </button>
            <button
              onClick={exportAsJson}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-card-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" /> 견적 내보내기
            </button>
          </div>
        )}
        <button
          onClick={importFromJson}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-dashed border-border text-muted-foreground text-sm hover:bg-muted transition-colors"
        >
          <Upload className="w-4 h-4" /> 견적 불러오기
        </button>
      </div>
    </motion.div>
  );
};

export default QuoteSummary;