import { useState, useRef } from 'react';
import { Quote } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  const [quoteToDownload, setQuoteToDownload] = useState<Quote | null>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      try {
        await deleteDoc(doc(db, 'quotes', id));
        toast.success('Orçamento excluído com sucesso!');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir orçamento');
      }
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: downloadRef,
    documentTitle: quoteToDownload ? `ORÇAMENTO - ${quoteToDownload.clientName.toUpperCase()}` : 'ORÇAMENTO',
    onAfterPrint: () => setQuoteToDownload(null),
  });

  const triggerDownload = (quote: Quote) => {
    setQuoteToDownload(quote);
    // Give time for the component to render in the off-screen container
    setTimeout(() => {
      if (downloadRef.current) {
        handlePrint();
      } else {
        toast.error('Erro ao preparar o documento para download');
      }
    }, 500);
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
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Histórico de Orçamentos</CardTitle>
              <CardDescription>Gerencie e visualize todos os orçamentos criados.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input 
                placeholder="Buscar cliente ou serviço..." 
                className="pl-9" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="font-semibold text-zinc-900">Data</TableHead>
                  <TableHead className="font-semibold text-zinc-900">Cliente</TableHead>
                  <TableHead className="font-semibold text-zinc-900">Serviço</TableHead>
                  <TableHead className="font-semibold text-zinc-900">Valor</TableHead>
                  <TableHead className="font-semibold text-zinc-900">Status</TableHead>
                  <TableHead className="text-right font-semibold text-zinc-900">Ações</TableHead>
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
                      <TableCell className="text-sm text-zinc-600">
                        {quote.createdAt?.toDate ? format(quote.createdAt.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : 'Recent'}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-900">{quote.clientName}</TableCell>
                      <TableCell className="text-sm text-zinc-600">{quote.serviceType}</TableCell>
                      <TableCell className="font-mono font-medium">
                        {formatCurrency(quote.totalAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedQuote(quote)} title="Visualizar">
                            <Eye className="h-4 w-4 text-zinc-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => triggerDownload(quote)} title="Download PDF">
                            <Download className="h-4 w-4 text-zinc-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(quote)} title="Editar">
                            <Pencil className="h-4 w-4 text-zinc-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => quote.id && handleDelete(quote.id)} title="Excluir" className="hover:text-red-600">
                            <Trash2 className="h-4 w-4 text-zinc-500" />
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
    </div>
  );
}
