import { useRef } from 'react';
import { Quote } from '../types';
import { Button } from '@/components/ui/button';
import { Printer, Mail } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../lib/formatters';

interface QuotePreviewProps {
  quote: Quote;
  hideToolbar?: boolean;
}

const COMPANY_LOGO = "https://files.catbox.moe/iqyitd.png";

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
    <div className={`flex flex-col ${hideToolbar ? 'bg-white min-h-screen' : 'bg-zinc-100 h-full'} font-['Inter',sans-serif]`}>
      {/* Toolbar */}
      {!hideToolbar && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border-b border-zinc-200 sticky top-0 z-10 no-print gap-4">
          <h3 className="font-bold text-zinc-900 text-sm sm:text-base">Visualização do Orçamento</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5" onClick={() => handlePrint()}>
              <Printer className="h-4 w-4" />
              <span className="hidden xs:inline">Imprimir / PDF</span>
              <span className="xs:hidden">PDF</span>
            </Button>
            <Button size="sm" className="flex-1 sm:flex-none gap-2 bg-brand-blue hover:bg-brand-blue-dark">
              <Mail className="h-4 w-4" />
              <span className="hidden xs:inline">Enviar por Email</span>
              <span className="xs:hidden">Email</span>
            </Button>
          </div>
        </div>
      )}

      {/* Document Area */}
      <div className={`flex-1 ${hideToolbar ? 'p-0' : 'p-4 sm:p-8 overflow-y-auto'} flex justify-center bg-zinc-100/50`}>
        <div 
          ref={componentRef}
          className={`${hideToolbar ? 'w-full' : 'w-full max-w-[210mm] shadow-xl p-[10mm] sm:p-[20mm]'} bg-white min-h-[297mm] text-zinc-900 print:shadow-none print:p-0 overflow-x-hidden`}
        >
          {/* Main Title Section */}
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-brand-blue-dark uppercase">
              ORÇAMENTO DE {quote.serviceType.toUpperCase()}
            </h1>
            <p className="text-brand-green font-bold tracking-[0.2em] uppercase text-[10px] sm:text-xs mt-1">
              MANUTENÇÃO TÉCNICA E PROFISSIONAL
            </p>
          </div>

          <div className="flex justify-end mb-8">
            <p className="text-xs sm:text-sm font-medium text-zinc-600">
              <span className="font-bold text-zinc-900">Data:</span> {dateStr}
            </p>
          </div>

          {/* Company & Client Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
            <div className="border-l-4 border-brand-blue pl-6 py-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-blue mb-3">Empresa Contratada</h4>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-900">Seu Espaço Limpeza Pós-Obra</p>
                <p className="text-xs text-zinc-600">Valdirene dos Reis Santos</p>
                <p className="text-xs text-zinc-600">CNPJ: 62.495.769/0001-85</p>
              </div>
            </div>
            
            <div className="border-l-4 border-brand-blue pl-6 py-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-blue mb-3">Preparado Para</h4>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-900">{quote.clientName}</p>
                {quote.clientEmail && <p className="text-xs text-zinc-600">{quote.clientEmail}</p>}
                {Object.entries(quote.customFields || {}).map(([key, value]) => value && (
                  <p key={key} className="text-xs text-zinc-600">{value}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Salutation & Intro */}
          <div className="mb-10">
            <p className="text-sm font-bold text-zinc-900 mb-4">
              Prezada {quote.clientName.split(' ')[0]},
            </p>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Apresentamos a proposta para os serviços de {quote.serviceType.toLowerCase()} conforme solicitado:
            </p>
          </div>

          {/* Items Table */}
          <div className="mb-10 overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px] sm:min-w-0">
              <thead>
                <tr className="border-b-2 border-zinc-100">
                  <th className="text-left py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Descrição do Serviço</th>
                  <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Detalhes</th>
                  <th className="text-right py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Valor (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {quote.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-5 pr-4">
                      <p className="font-bold text-sm text-zinc-900">{item.description}</p>
                    </td>
                    <td className="py-5 px-4">
                      {item.subDescription && (
                        <p className="text-[11px] text-zinc-600 leading-relaxed">{item.subDescription}</p>
                      )}
                    </td>
                    <td className="py-5 text-right font-bold text-sm text-zinc-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {/* Subtotal if there's a discount */}
                {(quote.discountAmount || 0) > 0 && (
                  <tr className="border-t border-zinc-100">
                    <td colSpan={2} className="pt-6 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Subtotal</span>
                    </td>
                    <td className="pt-6 text-right">
                      <span className="text-sm font-bold text-zinc-600">
                        {formatCurrency(quote.items.reduce((sum, i) => sum + i.total, 0))}
                      </span>
                    </td>
                  </tr>
                )}
                
                {(quote.discountAmount || 0) > 0 && (
                  <tr>
                    <td colSpan={2} className="py-1 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-green">
                        Desconto {quote.discountType === 'percentage' ? `(${quote.discountAmount}%)` : ''}
                      </span>
                    </td>
                    <td className="py-1 text-right">
                      <span className="text-sm font-bold text-brand-green">
                        - {formatCurrency(
                          quote.discountType === 'percentage' 
                            ? (quote.items.reduce((sum, i) => sum + i.total, 0) * (quote.discountAmount! / 100))
                            : quote.discountAmount!
                        )}
                      </span>
                    </td>
                  </tr>
                )}
                
                <tr>
                  <td colSpan={2} className="pt-6 pb-6 text-right">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-900">Valor Total da Proposta</span>
                  </td>
                  <td className="pt-6 pb-6 text-right">
                    <span className="text-3xl font-black text-brand-blue">{formatCurrency(quote.totalAmount)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-12 pt-10 border-t-4 border-brand-green/20">
            <div className="max-w-2xl space-y-2">
              <div className="flex gap-2">
                <p className="text-[11px] text-zinc-700"><span className="font-bold text-brand-green">Validade da Proposta:</span> 15 dias.</p>
              </div>
              <div className="flex gap-2">
                <p className="text-[11px] text-zinc-700"><span className="font-bold text-brand-green">Itens Inclusos:</span> Mão de obra especializada, produtos e equipamentos profissionais.</p>
              </div>
              <div className="flex gap-2">
                <p className="text-[11px] text-zinc-700"><span className="font-bold text-brand-green">Início:</span> Mediante agendamento prévio.</p>
              </div>
              {quote.notes && (
                <div className="mt-4 p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                  <p className="text-[11px] text-zinc-600 leading-relaxed"><span className="font-bold text-zinc-900 uppercase tracking-tighter mr-1">Observações Adicionais:</span> {quote.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 text-center">
            <p className="text-[9px] text-zinc-300 uppercase tracking-[0.4em] font-medium">Seu Espaço • Limpeza Pós Obras • Excelência em cada detalhe</p>
          </div>
        </div>
      </div>
    </div>
  );
}
