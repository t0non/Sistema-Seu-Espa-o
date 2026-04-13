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
  user: User;
  serviceTypes: ServiceType[];
  onSuccess: () => void;
  quoteToEdit?: Quote | null;
  onCancel?: () => void;
}

export function QuoteForm({ user, serviceTypes, onSuccess, quoteToEdit, onCancel }: QuoteFormProps) {
  const [clientName, setClientName] = useState(quoteToEdit?.clientName || '');
  const [clientEmail, setClientEmail] = useState(quoteToEdit?.clientEmail || '');
  const [selectedType, setSelectedType] = useState<string>('');
  const [items, setItems] = useState<QuoteItem[]>(quoteToEdit?.items || []);
  const [customFields, setCustomFields] = useState<Record<string, string>>(quoteToEdit?.customFields || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (quoteToEdit) {
      setClientName(quoteToEdit.clientName);
      setClientEmail(quoteToEdit.clientEmail || '');
      setItems(quoteToEdit.items);
      setCustomFields(quoteToEdit.customFields || {});
      
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
        quantity: 1,
        price: 0,
        total: 0
      }));
      setItems(defaultItems);
    }
  }, [selectedType, currentType]);

  const addItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
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

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return toast.error('Selecione um tipo de serviço');
    if (items.length === 0) return toast.error('Adicione pelo menos um item');

    setIsSubmitting(true);
    try {
      const quoteData: Partial<Quote> = {
        clientName,
        clientEmail,
        serviceType: currentType?.name || selectedType,
        items,
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
          createdBy: user.uid,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input 
                id="clientName" 
                value={clientName} 
                onChange={e => setClientName(e.target.value)} 
                placeholder="Ex: João Silva" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email (Opcional)</Label>
              <Input 
                id="clientEmail" 
                type="email" 
                value={clientEmail} 
                onChange={e => setClientEmail(e.target.value)} 
                placeholder="joao@exemplo.com" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Tipo de Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modelo de Serviço</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.length === 0 ? (
                    <SelectItem value="default">Limpeza Pós-Obra (Padrão)</SelectItem>
                  ) : (
                    serviceTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {currentType && currentType.defaultFields.map(field => {
              const isCPF = field.toUpperCase().includes('CPF');
              const isCNPJ = field.toUpperCase().includes('CNPJ');
              
              return (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{field}</Label>
                  {(isCPF || isCNPJ) ? (
                    <IMaskInput
                      mask={isCPF ? '000.000.000-00' : '00.000.000/0000-00'}
                      className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={customFields[field] || ''}
                      onAccept={(value: string) => setCustomFields({ ...customFields, [field]: value })}
                      placeholder={isCPF ? '000.000.000-00' : '00.000.000/0000-00'}
                    />
                  ) : (
                    <Input 
                      id={field} 
                      value={customFields[field] || ''} 
                      onChange={e => setCustomFields({ ...customFields, [field]: e.target.value })} 
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Itens do Orçamento</CardTitle>
            <CardDescription>Liste os serviços e materiais incluídos.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Item
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Descrição</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Preço Unit.</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input 
                      value={item.description} 
                      onChange={e => updateItem(item.id, 'description', e.target.value)} 
                      placeholder="Descrição do serviço"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={formatCurrency(item.price)} 
                      onChange={e => {
                        const numericValue = parseCurrency(e.target.value);
                        updateItem(item.id, 'price', numericValue);
                      }} 
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(item.total)}
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-zinc-100 bg-zinc-50/50 p-4">
          <div className="text-right">
            <p className="text-sm text-zinc-500 uppercase tracking-wider font-semibold">Total Geral</p>
            <p className="text-3xl font-bold text-zinc-900">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </CardFooter>
      </Card>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" size="lg" onClick={onCancel} className="gap-2 px-8">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        )}
        <Button type="submit" size="lg" className="gap-2 px-8 bg-brand-blue hover:bg-brand-blue-dark" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {quoteToEdit ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
        </Button>
      </div>
    </form>
  );
}
