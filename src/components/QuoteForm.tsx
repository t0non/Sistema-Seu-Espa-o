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
    }
  }, [quoteToEdit, serviceTypes]);

  const handleModelSelect = (id: string) => {
    if (!id) return;
    const type = serviceTypes.find(t => t.id === id);
    if (type) {
      // Initialize custom fields from template
      const fields: Record<string, string> = {};
      type.defaultFields.forEach(f => fields[f] = '');
      setCustomFields(fields);
      
      // Initialize items from template
      const defaultItems = type.defaultItems.map(desc => ({
        id: Math.random().toString(36).substr(2, 9),
        description: desc,
        subDescription: '',
        quantity: 1,
        price: 0,
        total: 0
      }));
      setItems(defaultItems);
      setManualServiceType(type.name);
      
      toast.info(`Modelo "${type.name}" carregado.`);
    }
    // Clear selection so it doesn't show the ID and allows re-selection
    setSelectedType('');
  };

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
              <Select value={selectedType} onValueChange={handleModelSelect}>
                <SelectTrigger className="h-9 sm:h-10 text-sm w-full">
                  <SelectValue placeholder="Selecione um modelo para preencher" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {Object.keys(customFields).map(field => {
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
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <div className="space-y-1">
            <CardTitle className="text-lg sm:text-xl font-bold text-zinc-900">Itens do Orçamento</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Liste os serviços e materiais incluídos.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2 h-9">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar Item</span>
            <span className="sm:hidden">Item</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-0 sm:pt-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-zinc-100">
                  <TableHead className="w-[40%] text-xs uppercase tracking-wider font-bold text-zinc-500">Descrição e Detalhes</TableHead>
                  <TableHead className="w-[10%] text-xs uppercase tracking-wider font-bold text-zinc-500 text-center">Qtd</TableHead>
                  <TableHead className="w-[20%] text-xs uppercase tracking-wider font-bold text-zinc-500">Preço Unit.</TableHead>
                  <TableHead className="w-[20%] text-xs uppercase tracking-wider font-bold text-zinc-500">Total</TableHead>
                  <TableHead className="w-[10%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} className="hover:bg-zinc-50/30 border-zinc-100">
                    <TableCell className="py-4 space-y-2">
                      <Input 
                        value={item.description} 
                        onChange={e => updateItem(item.id, 'description', e.target.value)} 
                        placeholder="Título do serviço"
                        className="font-medium h-9 text-sm border-zinc-200 focus:border-brand-blue focus:ring-brand-blue/10"
                      />
                      <Input 
                        value={item.subDescription || ''} 
                        onChange={e => updateItem(item.id, 'subDescription', e.target.value)} 
                        placeholder="Detalhes adicionais (opcional)"
                        className="text-xs h-8 text-zinc-500 border-zinc-100 bg-zinc-50/30"
                      />
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                        className="w-full h-9 text-sm text-center border-zinc-200"
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <Input 
                        value={formatCurrency(item.price)} 
                        onChange={e => {
                          const numericValue = parseCurrency(e.target.value);
                          updateItem(item.id, 'price', numericValue);
                        }} 
                        className="w-full h-9 text-sm border-zinc-200"
                      />
                    </TableCell>
                    <TableCell className="py-4 font-semibold text-sm text-zinc-900">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden divide-y divide-zinc-100">
            {items.length === 0 && (
              <div className="p-8 text-center text-zinc-400 text-sm italic">
                Nenhum item adicionado ainda.
              </div>
            )}
            {items.map((item, index) => (
              <div key={item.id} className="p-4 space-y-4 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500">
                    {index + 1}
                  </span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-zinc-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-zinc-400 font-bold">Descrição</Label>
                    <Input 
                      value={item.description} 
                      onChange={e => updateItem(item.id, 'description', e.target.value)} 
                      placeholder="Título do serviço"
                      className="font-medium h-10 text-sm"
                    />
                    <Input 
                      value={item.subDescription || ''} 
                      onChange={e => updateItem(item.id, 'subDescription', e.target.value)} 
                      placeholder="Detalhes adicionais"
                      className="text-xs h-9 text-zinc-500 bg-zinc-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase text-zinc-400 font-bold">Quantidade</Label>
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase text-zinc-400 font-bold">Preço Unitário</Label>
                      <Input 
                        value={formatCurrency(item.price)} 
                        onChange={e => {
                          const numericValue = parseCurrency(e.target.value);
                          updateItem(item.id, 'price', numericValue);
                        }} 
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-zinc-50">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Subtotal do Item</span>
                    <span className="text-base font-bold text-zinc-900">{formatCurrency(item.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col border-t border-zinc-100 bg-zinc-50/30 p-4 sm:p-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between w-full gap-8">
            <div className="flex flex-col gap-3 w-full max-w-sm">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-black">Configurar Desconto</Label>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-200 shadow-sm">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">
                    {discountType === 'fixed' ? 'R$' : '%'}
                  </span>
                  <Input 
                    type="number" 
                    value={discountAmount} 
                    onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)} 
                    className="pl-9 h-10 text-sm border-none focus-visible:ring-0 bg-transparent"
                    placeholder="0,00"
                  />
                </div>
                <div className="w-px h-6 bg-zinc-200" />
                <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                  <SelectTrigger className="w-[140px] h-10 text-xs font-bold border-none focus:ring-0 bg-transparent uppercase tracking-wider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed" className="text-xs font-bold">VALOR FIXO</SelectItem>
                    <SelectItem value="percentage" className="text-xs font-bold">PORCENTAGEM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-right space-y-4 w-full lg:w-auto bg-white/50 p-6 rounded-2xl border border-zinc-100 lg:border-none lg:p-0 lg:bg-transparent">
              <div className="space-y-2">
                <div className="flex justify-between lg:justify-end items-center gap-12">
                  <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Subtotal</span>
                  <span className="text-lg font-mono text-zinc-600">{formatCurrency(subtotal)}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between lg:justify-end items-center gap-12">
                    <span className="text-xs uppercase tracking-widest text-brand-green font-bold">Desconto</span>
                    <span className="text-lg font-mono text-brand-green">-{formatCurrency(calculatedDiscount)}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-zinc-200/60 lg:border-none">
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.3em] font-black mb-1">Total do Orçamento</p>
                <p className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tighter">
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
