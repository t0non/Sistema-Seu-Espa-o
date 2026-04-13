import { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, query, onSnapshot, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { Quote, ServiceType } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuoteForm } from './components/QuoteForm';
import { QuoteHistory } from './components/QuoteHistory';
import { Logo } from './components/Logo';
import { Plus, History, Settings } from 'lucide-react';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'quotes'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quotesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quote[];
      setQuotes(quotesData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar orçamentos:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const seedServiceTypes = async () => {
      const snapshot = await getDocs(collection(db, 'serviceTypes'));
      if (snapshot.empty) {
        const types = [
          {
            name: 'Limpeza Pós-Obra',
            defaultFields: ['CNPJ', 'Endereço da Obra', 'Responsável Técnico'],
            defaultItems: [
              'Limpeza de Guarda-Corpo (GC)',
              'Limpeza de Vidros e Esquadrias',
              'Lavagem de Piso Externo',
              'Higienização Interna'
            ]
          },
          {
            name: 'Manutenção Predial',
            defaultFields: ['Condomínio', 'Síndico', 'Prazo Estimado'],
            defaultItems: [
              'Pintura de Fachada',
              'Reparo Hidráulico',
              'Revisão Elétrica'
            ]
          }
        ];
        for (const type of types) {
          await addDoc(collection(db, 'serviceTypes'), type);
        }
      }
    };

    seedServiceTypes();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'serviceTypes'), (snapshot) => {
      const types = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceType[];
      setServiceTypes(types);
    }, (error) => {
      console.error("Erro ao carregar tipos de serviço:", error);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <Toaster position="top-right" />
      
      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-brand-blue/10 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Logo className="h-9 w-9 sm:h-12 sm:w-12 drop-shadow-sm" />
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-tight text-brand-blue-dark leading-none">Seu Espaço</span>
              <span className="text-[9px] sm:text-[11px] uppercase tracking-[0.2em] text-brand-green font-black mt-0.5">Limpeza Pós Obras</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="bg-zinc-200/50 p-1 w-full sm:w-auto grid grid-cols-3 sm:flex rounded-xl">
              <TabsTrigger value="history" className="gap-2 text-xs sm:text-sm font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" onClick={() => setQuoteToEdit(null)}>
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Histórico</span>
                <span className="xs:hidden">Hist.</span>
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2 text-xs sm:text-sm font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">{quoteToEdit ? 'Editar' : 'Novo'}</span>
                <span className="xs:hidden">{quoteToEdit ? 'Edit' : 'Novo'}</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 text-xs sm:text-sm font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" onClick={() => setQuoteToEdit(null)}>
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Modelos</span>
                <span className="xs:hidden">Mod.</span>
              </TabsTrigger>
            </TabsList>
            
            {activeTab === 'history' && (
              <Button onClick={() => setActiveTab('new')} className="gap-2 bg-brand-blue hover:bg-brand-blue-dark w-full sm:w-auto shadow-lg shadow-brand-blue/20 h-10 sm:h-11 font-bold rounded-xl">
                <Plus className="h-4 w-4" />
                Criar Orçamento
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="history" className="mt-0">
                <QuoteHistory 
                  quotes={quotes} 
                  onEdit={(quote) => {
                    setQuoteToEdit(quote);
                    setActiveTab('new');
                  }}
                />
              </TabsContent>
              
              <TabsContent value="new" className="mt-0">
                <QuoteForm 
                  serviceTypes={serviceTypes} 
                  quoteToEdit={quoteToEdit}
                  onCancel={() => {
                    setQuoteToEdit(null);
                    setActiveTab('history');
                  }}
                  onSuccess={() => {
                    setQuoteToEdit(null);
                    setActiveTab('history');
                  }} 
                />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <Card className="border-zinc-200">
                  <CardHeader>
                    <CardTitle>Modelos de Serviço</CardTitle>
                    <CardDescription>Configure os campos personalizados para cada tipo de serviço.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center">
                      <p className="text-zinc-500">Funcionalidade de edição de modelos em breve.</p>
                      <p className="text-xs text-zinc-400 mt-2">Use os modelos padrão por enquanto.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
}

