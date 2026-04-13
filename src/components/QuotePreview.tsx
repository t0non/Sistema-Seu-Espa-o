import { useRef, useEffect } from 'react';
import { Quote } from '../types';
import { Button } from '@/components/ui/button';
import { Printer, Download, Mail, Share2, FileText } from 'lucide-react';
import { Logo } from './Logo';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../lib/formatters';

interface QuotePreviewProps {
  quote: Quote;
  hideToolbar?: boolean;
}

export function QuotePreview({ quote, hideToolbar = false }: QuotePreviewProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `ORÇAMENTO - ${quote.clientName.toUpperCase()}`,
  });

  const dateStr = quote.createdAt?.toDate 
    ? format(quote.createdAt.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className={`flex flex-col ${hideToolbar ? 'bg-white min-h-screen' : 'bg-zinc-100 h-full'}`}>
      {/* Toolbar */}
      {!hideToolbar && (
        <div className="flex items-center justify-between p-4 bg-white border-b border-zinc-200 sticky top-0 z-10">
          <h3 className="font-bold text-zinc-900">Visualização do Orçamento</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5" onClick={() => handlePrint()}>
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </Button>
            <Button size="sm" className="gap-2 bg-brand-blue hover:bg-brand-blue-dark">
              <Mail className="h-4 w-4" />
              Enviar por Email
            </Button>
          </div>
        </div>
      )}

      {/* Document Area */}
      <div className={`flex-1 ${hideToolbar ? 'p-0' : 'p-8 overflow-y-auto'} flex justify-center`}>
        <div 
          ref={componentRef}
          className={`${hideToolbar ? 'w-full' : 'w-full max-w-[210mm] shadow-lg p-[20mm]'} bg-white min-h-[297mm] text-zinc-900 font-sans print:shadow-none print:p-0`}
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-brand-blue pb-8 mb-8">
            <div className="flex items-center gap-4">
              <Logo className="h-20 w-20" />
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-brand-blue-dark">Seu Espaço</h1>
                <p className="text-brand-green font-bold tracking-[0.2em] uppercase text-xs">Limpeza Pós Obras</p>
                <p className="text-[10px] text-zinc-400 mt-1 font-medium">SERVIÇOS ESPECIALIZADOS</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-brand-blue text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-2 inline-block rounded-sm">
                Orçamento #{quote.id?.slice(-6).toUpperCase()}
              </div>
              <p className="text-sm text-zinc-500 font-medium">{dateStr}</p>
            </div>
          </div>

          {/* Intro Text */}
          <div className="mb-10 text-zinc-700 leading-relaxed italic border-l-4 border-brand-green bg-zinc-50 p-6 rounded-r-lg">
            "Conforme solicitado, apresentamos abaixo a proposta detalhada para os serviços de {quote.serviceType.toLowerCase()}. Nossa equipe está comprometida com a excelência e qualidade em cada etapa do processo."
          </div>

          {/* Items Table */}
          <div className="mb-12 overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-brand-blue text-white text-[10px] font-bold uppercase tracking-widest">
                  <th className="text-left p-4">Descrição do Serviço</th>
                  <th className="text-center p-4">Qtd</th>
                  <th className="text-right p-4">Valor Unit.</th>
                  <th className="text-right p-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-brand-blue/5'}>
                    <td className="p-4 border-b border-zinc-100">
                      <p className="font-bold text-sm text-brand-blue-dark">{item.description}</p>
                    </td>
                    <td className="p-4 border-b border-zinc-100 text-center text-sm">{item.quantity}</td>
                    <td className="p-4 border-b border-zinc-100 text-right text-sm">{formatCurrency(item.price)}</td>
                    <td className="p-4 border-b border-zinc-100 text-right font-bold text-sm text-brand-blue">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="p-6 text-right">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total do Orçamento</span>
                  </td>
                  <td className="p-6 text-right bg-brand-blue text-white">
                    <span className="text-2xl font-black">{formatCurrency(quote.totalAmount)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Terms */}
          <div className="grid grid-cols-2 gap-8 mt-auto pt-12 border-t border-zinc-100">
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Validade da Proposta</h5>
              <p className="text-xs text-zinc-500">Este orçamento é válido por 15 dias a partir da data de emissão.</p>
            </div>
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-brand-green">Prazo de Execução</h5>
              <p className="text-xs text-zinc-500">A definir conforme cronograma após a aprovação formal.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-zinc-100 text-center">
            <p className="text-[10px] text-zinc-400 uppercase tracking-[0.3em]">Gerado por Seu Espaço • Limpeza Pós Obras</p>
          </div>
        </div>
      </div>
    </div>
  );
}
