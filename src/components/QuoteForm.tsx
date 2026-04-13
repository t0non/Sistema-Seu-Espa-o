import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Quote, QuoteItem, ServiceType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { IMaskInput } from 'react-imask';
import { formatCurrency, parseCurrency } from '../lib/formatters';

interface QuoteFormProps {
  serviceTypes: ServiceType[];
  onSuccess: () => void;
  quoteToEdit?: Quote | null;
  onCancel?: () => void;
}

export function QuoteForm({ serviceTypes, onSuccess, quoteToEdit, onCancel }: QuoteFormProps) {
  const [clientName, setClientName] = useState(quoteToEdit?.clientName || '');
  const [clientEmail, setClientEmail] = useState(quoteToEdit?.clientEmail || '');
  const [selectedType, setSelectedType] = useState<string>('');
  const [manualServiceType, setManualServiceType] = useState(quoteToEdit?.serviceType || '');
  const [items, setItems] = useState<QuoteItem[]>(quoteToEdit?.items || []);
  const [discountAmount, setDiscountAmount] = useState<number>(quoteToEdit?.discountAmount || 0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(quoteToEdit?.discountType || 'fixed');
  const [customFields, setCustomFields] = useState<Record<string, string>>(quoteToEdit?.customFields || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (quoteToEdit) {
      setClientName(quoteToEdit.clientName);
      setClientEmail(quoteToEdit.clientEmail || '');
      setItems(quoteToEdit.items);
      setCustomFields(quoteToEdit.customFields || {});
      setDiscountAmount(quoteToEdit.discountAmount || 0);
      setDiscountType(quoteToEdit.discountType || 'fixed');
      setManualServiceType(quoteToEdit.serviceType);
      
      // Find the service type ID based on the name
      const type = serviceTypes.find(t => t.name === quoteToEdit.serviceType);
      if (type) setSelectedType(type.id);
    }
  }, [quoteToEdit, serviceTypes]);

  const currentType = serviceTypes.find(t => t.id === selectedType);

  useEffect(() => {
    if (currentType && !quoteToEdit) {
      // Initialize custom fields from template
      const fields: Record<string, string> = {};
      currentType.defaultFields.forEach(f => fields[f] = '');
      setCustomFields(fields);
      
      // Initialize items from template
      const defaultItems = currentType.defaultItems.map(desc => ({
        id: Math.random().toString(36).substr(2, 9),
        description: desc,
        subDescription: '',
        quantity: 1,
        price: 0,
        total: 0
      }));
      setItems(defaultItems);
      setManualServiceType(currentType.name);
    }
  }, [selectedType, currentType]);

  const addItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      subDescription: '',
      quantity: 1,
      price: 0,
      total: 0
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.total = updated.quantity * updated.price;
        }
        return updated;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const calculatedDiscount = discountType === 'percentage' 
    ? (subtotal * (discountAmount / 100)) 
    : discountAmount;
  const totalAmount = Math.max(0, subtotal - calculatedDiscount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualServiceType) return toast.error('Informe o tipo de serviço');
    if (items.length === 0) return toast.error('Adicione pelo menos um item');

    setIsSubmitting(true);
    try {
      const quoteData: Partial<Quote> = {
        clientName,
        clientEmail,
        serviceType: manualServiceType,
        items,
        discountAmount,
        discountType,
        totalAmount,
        customFields,
      };

      if (quoteToEdit?.id) {
        await updateDoc(doc(db, 'quotes', quoteToEdit.id), {
          ...quoteData,
          updatedAt: serverTimestamp(),
        });
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        const newQuote: Quote = {
          ...quoteData as Quote,
          status: 'pending',
          createdAt: serverTimestamp(),
          createdBy: 'anonymous',
        };
        await addDoc(collection(db, 'quotes'), newQuote);
        toast.success('Orçamento criado com sucesso!');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(quoteToEdit ? 'Erro ao atualizar orçamento' : 'Erro ao criar orçamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-xs sm:text-sm">Nome do Cliente</Label>
              <Input 
                id="clientName" 
                value={clientName} 
                onChange={e => setClientName(e.target.value)} 
                placeholder="Ex: João Silva" 
                required 
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="text-xs sm:text-sm">Email (Opcional)</Label>
              <Input 
                id="clientEmail" 
                type="email" 
                value={clientEmail} 
                onChange={e => setClientEmail(e.target.value)} 
                placeholder="joao@exemplo.com" 
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Tipo de Serviço</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manualServiceType" className="text-xs sm:text-sm">Tipo de Serviço (Ex: Limpeza Pós-Obra)</Label>
              <Input 
                id="manualServiceType" 
                value={manualServiceType} 
                onChange={e => setManualServiceType(e.target.value)} 
                placeholder="Ex: Limpeza Pós-Obra" 
                required 
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Carregar Modelo (Opcional)</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Selecione um modelo para preencher" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {currentType && currentType.defaultFields.map(field => {
              const isCPF = field.toUpperCase().includes('CPF');
              const isCNPJ = field.toUpperCase().includes('CNPJ');
              
              return (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field} className="text-xs sm:text-sm">{field}</Label>
                  {(isCPF || isCNPJ) ? (
                    <IMaskInput
                      mask={isCPF ? '000.000.000-00' : '00.000.000/0000-00'}
                      className="flex h-9 sm:h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={customFields[field] || ''}
                      onAccept={(value: string) => setCustomFields({ ...customFields, [field]: value })}
                      placeholder={isCPF ? '000.000.000-00' : '00.000.000/0000-00'}
                    />
                  ) : (
                    <Input 
                      id={field} 
                      value={customFields[field] || ''} 
                      onChange={e => setCustomFields({ ...customFields, [field]: e.target.value })} 
                      className="h-9 sm:h-10 text-sm"
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6">
          <div>
            <CardTitle className="text-base sm:text-lg">Itens do Orçamento</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Liste os serviços e materiais incluídos.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Adicionar Item
          </Button>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-0 sm:pt-0">
          <div className="overflow-x-auto border-t sm:border-none border-zinc-100">
            <Table>
              <TableHeader className="bg-zinc-50 sm:bg-transparent">
                <TableRow>
                  <TableHead className="w-[300px] min-w-[200px] text-xs uppercase tracking-wider">Descrição e Detalhes</TableHead>
                  <TableHead className="w-[80px] text-xs uppercase tracking-wider">Qtd</TableHead>
                  <TableHead className="w-[140px] text-xs uppercase tracking-wider">Preço Unit.</TableHead>
                  <TableHead className="w-[120px] text-xs uppercase tracking-wider">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} className="hover:bg-zinc-50/50">
                    <TableCell className="space-y-1.5 py-3">
                      <Input 
                        value={item.description} 
                        onChange={e => updateItem(item.id, 'description', e.target.value)} 
                        placeholder="Título do serviço"
                        className="font-medium h-8 text-sm"
                      />
                      <Input 
                        value={item.subDescription || ''} 
                        onChange={e => updateItem(item.id, 'subDescription', e.target.value)} 
                        placeholder="Detalhes adicionais (opcional)"
                        className="text-[10px] h-7 text-zinc-500"
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                        className="w-16 h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <Input 
                        value={formatCurrency(item.price)} 
                        onChange={e => {
                          const numericValue = parseCurrency(e.target.value);
                          updateItem(item.id, 'price', numericValue);
                        }} 
                        className="w-28 h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-sm py-3">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-zinc-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col border-t border-zinc-100 bg-zinc-50/50 p-4 sm:p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between w-full gap-6">
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Aplicar Desconto</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={discountAmount} 
                  onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)} 
                  className="w-24 h-9 text-sm"
                />
                <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">R$ Fixo</SelectItem>
                    <SelectItem value="percentage">% Porcentagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-right space-y-2 w-full lg:w-auto">
              <div className="flex justify-between lg:justify-end gap-8 text-sm text-zinc-500">
                <span className="font-medium">Subtotal:</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {calculatedDiscount > 0 && (
                <div className="flex justify-between lg:justify-end gap-8 text-sm text-brand-green font-semibold">
                  <span>Desconto Aplicado:</span>
                  <span className="font-mono">- {formatCurrency(calculatedDiscount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-zinc-200/60 lg:border-none">
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-black">Total Final do Orçamento</p>
                <p className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pb-8">
        {onCancel && (
          <Button type="button" variant="outline" size="lg" onClick={onCancel} className="gap-2 w-full sm:w-auto px-8 h-11 sm:h-12">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        )}
        <Button type="submit" size="lg" className="gap-2 w-full sm:w-auto px-10 h-11 sm:h-12 bg-brand-blue hover:bg-brand-blue-dark shadow-lg shadow-brand-blue/20" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {quoteToEdit ? 'Atualizar Orçamento' : 'Finalizar e Salvar'}
        </Button>
      </div>
    </form>
  );
}
