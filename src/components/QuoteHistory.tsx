import { useState, useRef, useEffect } from 'react';
import { Quote } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Eye, Download, Search, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QuotePreview } from './QuotePreview';
import { formatCurrency } from '../lib/formatters';
import { useReactToPrint } from 'react-to-print';
import { db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface QuoteHistoryProps {
  quotes: Quote[];
  onEdit: (quote: Quote) => void;
}

export function QuoteHistory({ quotes, onEdit }: QuoteHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [quoteToDownload, setQuoteToDownload] = useState<Quote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Effect to handle the download once the hidden component is rendered
  useEffect(() => {
    if (quoteToDownload && downloadRef.current) {
      // Small delay to ensure React has finished rendering the QuotePreview
      const timer = setTimeout(() => {
        const htmlContent = downloadRef.current?.innerHTML;
        
        if (!htmlContent || htmlContent.trim() === "" || htmlContent.length < 500) {
          // If still empty or too small, it might not be ready
          return;
        }

        const fullHtml = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ORÇAMENTO - ${quoteToDownload.clientName.toUpperCase()}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
              body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
              .no-print { display: none; }
              @media print {
                body { background: white; }
                .no-print { display: none; }
              }
            </style>
            <script>
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      brand: {
                        blue: '#4B76A8',
                        'blue-dark': '#2D4A6D',
                        green: '#22C55E',
                      }
                    }
                  }
                }
              }
            </script>
          </head>
          <body class="bg-zinc-100 p-4 sm:p-8 flex justify-center min-h-screen">
            <div class="w-full max-w-[210mm] bg-white shadow-lg p-[10mm] sm:p-[20mm] min-h-[297mm]">
              ${htmlContent}
            </div>
            <div class="fixed bottom-6 right-6 no-print flex gap-2">
              <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-3 rounded-full shadow-xl hover:bg-blue-700 transition-all font-bold flex items-center gap-2">
                <span>Imprimir / Salvar PDF</span>
              </button>
            </div>
          </body>
          </html>
        `;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ORÇAMENTO - ${quoteToDownload.clientName.toUpperCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Arquivo HTML gerado com sucesso!');
        setQuoteToDownload(null); // Reset after download
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [quoteToDownload]);

  const handleDelete = async () => {
    if (!quoteToDelete?.id) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'quotes', quoteToDelete.id));
      toast.success('Orçamento excluído com sucesso!');
      setQuoteToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir orçamento');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: downloadRef,
    documentTitle: quoteToDownload ? `ORÇAMENTO - ${quoteToDownload.clientName.toUpperCase()}` : 'ORÇAMENTO',
    onAfterPrint: () => setQuoteToDownload(null),
  });

  const triggerDownload = (quote: Quote) => {
    toast.info('Preparando arquivo para download...');
    setQuoteToDownload(quote);
  };

  const filteredQuotes = quotes.filter(q => 
    q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-brand-green/10 text-brand-green hover:bg-brand-green/20 border-brand-green/20">Aprovado</Badge>;
      case 'rejected': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Recusado</Badge>;
      default: return <Badge className="bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 border-brand-blue/20">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">Histórico de Orçamentos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Gerencie e visualize todos os orçamentos criados.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input 
                placeholder="Buscar cliente ou serviço..." 
                className="pl-9 h-9 text-sm" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="border-t sm:border border-zinc-200 overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="font-semibold text-zinc-900 whitespace-nowrap">Data</TableHead>
                  <TableHead className="font-semibold text-zinc-900 whitespace-nowrap">Cliente</TableHead>
                  <TableHead className="font-semibold text-zinc-900 whitespace-nowrap hidden md:table-cell">Serviço</TableHead>
                  <TableHead className="font-semibold text-zinc-900 whitespace-nowrap">Valor</TableHead>
                  <TableHead className="font-semibold text-zinc-900 whitespace-nowrap hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right font-semibold text-zinc-900 whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                      Nenhum orçamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map(quote => (
                    <TableRow key={quote.id} className="hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="text-xs sm:text-sm text-zinc-600 whitespace-nowrap">
                        {quote.createdAt?.toDate ? format(quote.createdAt.toDate(), 'dd/MM/yy', { locale: ptBR }) : 'Recent'}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-900 text-xs sm:text-sm max-w-[120px] truncate sm:max-w-none">
                        {quote.clientName}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600 hidden md:table-cell">{quote.serviceType}</TableCell>
                      <TableCell className="font-mono font-medium text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency(quote.totalAmount)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{getStatusBadge(quote.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5 sm:gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedQuote(quote)} title="Visualizar">
                            <Eye className="h-3.5 w-3.5 text-zinc-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => triggerDownload(quote)} title="Download PDF">
                            <Download className="h-3.5 w-3.5 text-zinc-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(quote)} title="Editar">
                            <Pencil className="h-3.5 w-3.5 text-zinc-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => setQuoteToDelete(quote)} title="Excluir">
                            <Trash2 className="h-3.5 w-3.5 text-zinc-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Hidden container for direct download - using off-screen positioning instead of h-0/hidden */}
      <div 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: 0, 
          width: '210mm',
          opacity: 0,
          pointerEvents: 'none'
        }}
      >
        <div ref={downloadRef}>
          {quoteToDownload && <QuotePreview quote={quoteToDownload} hideToolbar />}
        </div>
      </div>

      <Dialog open={!!selectedQuote} onOpenChange={(open) => !open && setSelectedQuote(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          {selectedQuote && <QuotePreview quote={selectedQuote} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!quoteToDelete} onOpenChange={(open) => !open && setQuoteToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Excluir Orçamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o orçamento de <span className="font-bold text-zinc-900">{quoteToDelete?.clientName}</span>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setQuoteToDelete(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir Orçamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
