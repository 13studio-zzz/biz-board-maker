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

  const exportAsCsv = () => {
    const BOM = '\uFEFF';
    const rows: string[][] = [];
    
    // Header info
    rows.push(['보드게임 견적서']);
    rows.push(['프로젝트명', projectName || '']);
    rows.push(['고객명', clientName || '']);
    rows.push(['제작 수량', String(sets), '세트']);
    rows.push(['작성일', new Date().toLocaleDateString('ko-KR')]);
    rows.push([]);
    
    // Item header
    rows.push(['구성품', '옵션', '사이즈', '코팅', '재질', '후가공', '자석여닫이', '스티커부착', '소계(₩)']);
    
    // Items
    quote.items.forEach(item => {
      rows.push([
        item.name,
        item.option || '',
        item.size || '',
        item.coating || '',
        item.material || '',
        item.finishing || '',
        item.magnetLock ? 'O' : '',
        item.stickerAttach ? 'O' : '',
        String(item.subtotal),
      ]);
    });
    
    // Custom items
    quote.customItems.forEach(ci => {
      rows.push([
        ci.name || '(미입력)',
        '직접입력',
        '', '', '', '', '', '',
        String(ci.subtotal),
      ]);
    });
    
    rows.push([]);
    rows.push(['재료비', '', '', '', '', '', '', '', String(quote.breakdown.materialCost)]);
    rows.push(['공임비', '', '', '', '', '', '', '', String(quote.breakdown.laborCost)]);
    rows.push(['셋업비', '', '', '', '', '', '', '', String(quote.breakdown.setupCost)]);
    if (quote.customTotal > 0) {
      rows.push(['직접입력 합계', '', '', '', '', '', '', '', String(quote.customTotal)]);
    }
    rows.push([`마진 (${Math.round(quote.margin * 100)}%)`, '', '', '', '', '', '', '', String(quote.breakdown.marginAmount)]);
    rows.push([]);
    rows.push(['총 견적가', '', '', '', '', '', '', '', String(quote.total)]);
    rows.push(['세트당 단가', '', '', '', '', '', '', '', String(quote.unitPrice)]);
    
    // Add raw data for re-import
    rows.push([]);
    rows.push(['---IMPORT_DATA---']);
    const importData: ExportData = {
      projectName,
      clientName,
      sets,
      selections: (window as any).__quoteSelections || {},
      customItemsMap: (window as any).__quoteCustomItems || {},
      exportDate: new Date().toISOString(),
      version: 1,
    };
    rows.push([JSON.stringify(importData)]);
    
    const csvContent = BOM + rows.map(row => 
      row.map(cell => {
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `견적_${projectName || '보드게임'}_${sets}세트.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importFromCsv = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = ev.target?.result as string;
          
          // Try JSON first (backward compat)
          if (file.name.endsWith('.json')) {
            const data = JSON.parse(text) as ExportData;
            if (data.version && onImportQuote) {
              onImportQuote({
                projectName: data.projectName || '',
                clientName: data.clientName || '',
                sets: data.sets || 10,
                selections: data.selections || {},
                customItemsMap: data.customItemsMap || {},
              });
            }
            return;
          }
          
          // CSV: find ---IMPORT_DATA--- marker
          const lines = text.split('\n');
          const markerIdx = lines.findIndex(l => l.trim().includes('---IMPORT_DATA---'));
          if (markerIdx >= 0 && markerIdx + 1 < lines.length) {
            let jsonLine = lines[markerIdx + 1].trim();
            // Remove CSV quoting if present
            if (jsonLine.startsWith('"') && jsonLine.endsWith('"')) {
              jsonLine = jsonLine.slice(1, -1).replace(/""/g, '"');
            }
            const data = JSON.parse(jsonLine) as ExportData;
            if (data.version && onImportQuote) {
              onImportQuote({
                projectName: data.projectName || '',
                clientName: data.clientName || '',
                sets: data.sets || 10,
                selections: data.selections || {},
                customItemsMap: data.customItemsMap || {},
              });
            }
          } else {
            alert('견적 데이터를 찾을 수 없습니다. CSV 파일에 IMPORT_DATA 마커가 필요합니다.');
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
            <div className="space-y-1 mb-4">
              {quote.items.map((item, i) => (
                <div key={i} className="text-sm rounded-md border border-border/50 bg-muted/30 p-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-card-foreground font-medium truncate mr-2">
                      {item.name} <span className="text-muted-foreground text-xs font-normal">({item.option})</span>
                    </span>
                    <span className="font-semibold text-card-foreground whitespace-nowrap">{formatW(item.subtotal)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    <span className="text-xs text-muted-foreground">🔢 {item.quantity}개</span>
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
                <div key={`c-${i}`} className="text-sm rounded-md border border-border/50 bg-muted/30 p-2.5 flex justify-between">
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

            <div className="border-t border-border mt-3 pt-3 space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-muted-foreground">총 견적가 ({sets}세트, VAT 별도)</p>
                  <p className="text-xl font-bold text-blue-600">{formatW(quote.total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">세트당 단가</p>
                  <p className="text-base font-bold text-card-foreground">{formatW(quote.unitPrice)}</p>
                </div>
              </div>
              <div className="flex justify-between items-end pt-1 border-t border-dashed border-border">
                <div>
                  <p className="text-xs text-muted-foreground">VAT 포함가</p>
                  <p className="text-lg font-bold text-card-foreground">{formatW(Math.round(quote.total * 1.1))}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">세트당 (VAT 포함)</p>
                  <p className="text-sm font-bold text-card-foreground">{formatW(Math.round(quote.unitPrice * 1.1))}</p>
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
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#2b2b2b] text-[#c1ff99] text-sm font-medium hover:bg-[#2b2b2b]/90 transition-colors border border-[#2b2b2b]"
            >
              <FileImage className="w-4 h-4" /> 이미지 저장
            </button>
            <button
              onClick={exportAsCsv}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-card-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" /> CSV 내보내기
            </button>
          </div>
        )}
        <button
          onClick={importFromCsv}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-dashed border-border text-muted-foreground text-sm hover:bg-muted transition-colors"
        >
          <Upload className="w-4 h-4" /> 견적 불러오기
        </button>
      </div>
    </motion.div>
  );
};

export default QuoteSummary;