import { useState, useEffect } from 'react';
import { auth, loginWithGoogle, logout, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { Quote, ServiceType } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuoteForm } from './components/QuoteForm';
import { QuoteHistory } from './components/QuoteHistory';
import { Logo } from './components/Logo';
import { LogIn, LogOut, Plus, History, Settings } from 'lucide-react';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'quotes'),
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quotesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quote[];
      setQuotes(quotesData);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;

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
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, 'serviceTypes'), (snapshot) => {
      const types = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceType[];
      setServiceTypes(types);
    });

    return unsubscribe;
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8 text-center"
        >
          <div className="space-y-4">
            <Logo className="mx-auto h-24 w-24" />
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter text-brand-blue-dark">Seu Espaço</h1>
              <p className="text-zinc-500">Limpeza Pós Obras • Orçamentos Profissionais</p>
            </div>
          </div>
          <Card className="border-zinc-200 shadow-xl overflow-hidden">
            <div className="h-2 bg-brand-blue" />
            <CardHeader>
              <CardTitle>Bem-vindo</CardTitle>
              <CardDescription>Faça login para começar a gerenciar seus orçamentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={loginWithGoogle} className="w-full gap-2 bg-brand-blue hover:bg-brand-blue-dark" size="lg">
                <LogIn className="h-5 w-5" />
                Entrar com Google
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <Toaster position="top-right" />
      
      {/* Navigation */}
      <header className="sticky top-0 z-10 border-b border-brand-blue/20 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-brand-blue-dark leading-none">Seu Espaço</span>
              <span className="text-[10px] uppercase tracking-widest text-brand-green font-bold">Limpeza Pós Obras</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <img src={user.photoURL || ''} className="h-8 w-8 rounded-full border border-zinc-200" alt="User" referrerPolicy="no-referrer" />
              <span className="text-sm font-medium">{user.displayName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="bg-zinc-100 p-1">
              <TabsTrigger value="history" className="gap-2" onClick={() => setQuoteToEdit(null)}>
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                <Plus className="h-4 w-4" />
                {quoteToEdit ? 'Editar Orçamento' : 'Novo Orçamento'}
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2" onClick={() => setQuoteToEdit(null)}>
                <Settings className="h-4 w-4" />
                Modelos
              </TabsTrigger>
            </TabsList>
            
            {activeTab === 'history' && (
              <Button onClick={() => setActiveTab('new')} className="gap-2 bg-brand-blue hover:bg-brand-blue-dark">
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
                  user={user} 
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

