'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as LucideIcons from 'lucide-react'

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  setor: string;
  status: 'ativo' | 'inativo';
  nivel_acesso?: string;
  data_nascimento?: string;
  data_contratacao?: string;
  foto?: string;
  salario_base?: number;
  beneficios: { nome: string; valor: number }[];
  historico_profissional: {
    empresa: string;
    cargo: string;
    periodo: string;
    observacoes: string;
  }[];
}

interface Setor {
  id: string;
  nome: string;
}

interface Cargo {
  id: string;
  nome: string;
}

interface NivelAcesso {
  id: string;
  nome: string;
}

interface UsuarioFormProps {
  usuario?: Usuario;
  setores: Setor[];
  cargos: Cargo[];
  niveisAcesso: NivelAcesso[];
  onSalvar: (dadosUsuario: Omit<Usuario, 'id'>, isEdicao: boolean, usuarioId?: string) => Promise<void>;
  onCancelar: () => void;
}

export default function UsuarioForm({
  usuario,
  setores,
  cargos,
  niveisAcesso,
  onSalvar,
  onCancelar
}: UsuarioFormProps) {
  const isEdicao = !!usuario;

  // Valores iniciais seguros
  const valoresIniciais = useMemo(() => ({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    telefone: usuario?.telefone || '',
    cargo: usuario?.cargo || '',
    setor: usuario?.setor || '',
    status: usuario?.status || 'ativo' as const,
    nivel_acesso: usuario?.nivel_acesso || '',
    data_nascimento: usuario?.data_nascimento || '',
    data_contratacao: usuario?.data_contratacao || '',
    foto: usuario?.foto || '',
    salario_base: usuario?.salario_base || 0,
    beneficios: usuario?.beneficios || [],
    historico_profissional: usuario?.historico_profissional || []
  }), [usuario]);

  // Estados do formulário
  const [dados, setDados] = useState(valoresIniciais);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [abaSelecionada, setAbaSelecionada] = useState('basicos');
  
  // Estados para benefícios
  const [novoBeneficio, setNovoBeneficio] = useState({ nome: '', valor: 0 });
  const [editandoBeneficio, setEditandoBeneficio] = useState<number | null>(null);
  
  // Estados para histórico profissional
  const [novoHistorico, setNovoHistorico] = useState({
    empresa: '',
    cargo: '',
    periodo: '',
    observacoes: ''
  });
  const [editandoHistorico, setEditandoHistorico] = useState<number | null>(null);

  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  // Resetar quando props mudam
  useEffect(() => {
    setDados(valoresIniciais);
    setErros({});
    setTentouEnviar(false);
    setAbaSelecionada('basicos');
  }, [valoresIniciais]);

  // Validação em tempo real após primeira tentativa
  useEffect(() => {
    if (tentouEnviar) {
      validarFormulario();
    }
  }, [dados, tentouEnviar]);

  // Validação completa
  const validarFormulario = useCallback(() => {
    const novosErros: Record<string, string> = {};

    // Nome obrigatório
    if (!dados.nome || dados.nome.trim().length === 0) {
      novosErros.nome = 'Nome é obrigatório';
    } else if (dados.nome.trim().length < 3) {
      novosErros.nome = 'Nome deve ter ao menos 3 caracteres';
    } else if (dados.nome.trim().length > 100) {
      novosErros.nome = 'Nome não pode ter mais de 100 caracteres';
    }

    // Email obrigatório e válido
    if (!dados.email || dados.email.trim().length === 0) {
      novosErros.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
      novosErros.email = 'Email inválido';
    } else if (dados.email.length > 255) {
      novosErros.email = 'Email muito longo';
    }

    // Telefone obrigatório
    if (!dados.telefone || dados.telefone.trim().length === 0) {
      novosErros.telefone = 'Telefone é obrigatório';
    } else {
      const apenasNumeros = dados.telefone.replace(/\D/g, '');
      if (apenasNumeros.length < 10 || apenasNumeros.length > 13) {
        novosErros.telefone = 'Telefone deve ter entre 10 e 13 dígitos';
      }
    }

    // Cargo obrigatório
    if (!dados.cargo || dados.cargo.trim().length === 0) {
      novosErros.cargo = 'Cargo é obrigatório';
    }

    // Setor obrigatório
    if (!dados.setor || dados.setor.trim().length === 0) {
      novosErros.setor = 'Setor é obrigatório';
    }

    // Data de nascimento
    if (dados.data_nascimento) {
      const dataNasc = new Date(dados.data_nascimento);
      const hoje = new Date();
      const idade = hoje.getFullYear() - dataNasc.getFullYear();
      
      if (isNaN(dataNasc.getTime())) {
        novosErros.data_nascimento = 'Data de nascimento inválida';
      } else if (idade < 16 || idade > 80) {
        novosErros.data_nascimento = 'Idade deve estar entre 16 e 80 anos';
      }
    }

    // Data de contratação
    if (dados.data_contratacao) {
      const dataContrat = new Date(dados.data_contratacao);
      const hoje = new Date();
      
      if (isNaN(dataContrat.getTime())) {
        novosErros.data_contratacao = 'Data de contratação inválida';
      } else if (dataContrat > hoje) {
        novosErros.data_contratacao = 'Data de contratação não pode ser futura';
      }
    }

    // Salário base
    if (dados.salario_base && dados.salario_base < 0) {
      novosErros.salario_base = 'Salário não pode ser negativo';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }, [dados]);

  // Handlers de mudança
  const handleChange = useCallback((campo: string, valor: string | number) => {
    setDados(prev => ({ ...prev, [campo]: valor }));
    
    // Limpar erro quando campo é editado
    if (erros[campo]) {
      setErros(prev => {
        const novos = { ...prev };
        delete novos[campo];
        return novos;
      });
    }
  }, [erros]);

  // Handlers de benefícios
  const handleAdicionarBeneficio = useCallback(() => {
    if (!novoBeneficio.nome.trim() || novoBeneficio.valor <= 0) {
      toast.error('Preencha nome e valor do benefício');
      return;
    }
    
    setDados(prev => ({
      ...prev,
      beneficios: [...prev.beneficios, { ...novoBeneficio }]
    }));
    
    setNovoBeneficio({ nome: '', valor: 0 });
    toast.success('Benefício adicionado');
  }, [novoBeneficio]);

  const handleEditarBeneficio = useCallback((indice: number) => {
    const beneficio = dados.beneficios[indice];
    setNovoBeneficio(beneficio);
    setEditandoBeneficio(indice);
  }, [dados.beneficios]);

  const handleSalvarEdicaoBeneficio = useCallback(() => {
    if (!novoBeneficio.nome.trim() || novoBeneficio.valor <= 0) {
      toast.error('Preencha nome e valor do benefício');
      return;
    }
    
    if (editandoBeneficio !== null) {
      setDados(prev => ({
        ...prev,
        beneficios: prev.beneficios.map((b, i) => 
          i === editandoBeneficio ? novoBeneficio : b
        )
      }));
      
      setEditandoBeneficio(null);
      setNovoBeneficio({ nome: '', valor: 0 });
      toast.success('Benefício atualizado');
    }
  }, [novoBeneficio, editandoBeneficio]);

  const handleRemoverBeneficio = useCallback((indice: number) => {
    setDados(prev => ({
      ...prev,
      beneficios: prev.beneficios.filter((_, i) => i !== indice)
    }));
    toast.success('Benefício removido');
  }, []);

  // Handlers de histórico profissional
  const handleAdicionarHistorico = useCallback(() => {
    if (!novoHistorico.empresa.trim() || !novoHistorico.cargo.trim() || !novoHistorico.periodo.trim()) {
      toast.error('Preencha empresa, cargo e período');
      return;
    }
    
    setDados(prev => ({
      ...prev,
      historico_profissional: [...prev.historico_profissional, { ...novoHistorico }]
    }));
    
    setNovoHistorico({ empresa: '', cargo: '', periodo: '', observacoes: '' });
    toast.success('Histórico adicionado');
  }, [novoHistorico]);

  const handleEditarHistorico = useCallback((indice: number) => {
    const historico = dados.historico_profissional[indice];
    setNovoHistorico(historico);
    setEditandoHistorico(indice);
  }, [dados.historico_profissional]);

  const handleSalvarEdicaoHistorico = useCallback(() => {
    if (!novoHistorico.empresa.trim() || !novoHistorico.cargo.trim() || !novoHistorico.periodo.trim()) {
      toast.error('Preencha empresa, cargo e período');
      return;
    }
    
    if (editandoHistorico !== null) {
      setDados(prev => ({
        ...prev,
        historico_profissional: prev.historico_profissional.map((h, i) => 
          i === editandoHistorico ? novoHistorico : h
        )
      }));
      
      setEditandoHistorico(null);
      setNovoHistorico({ empresa: '', cargo: '', periodo: '', observacoes: '' });
      toast.success('Histórico atualizado');
    }
  }, [novoHistorico, editandoHistorico]);

  const handleRemoverHistorico = useCallback((indice: number) => {
    setDados(prev => ({
      ...prev,
      historico_profissional: prev.historico_profissional.filter((_, i) => i !== indice)
    }));
    toast.success('Histórico removido');
  }, []);

  // Submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!montadoRef.current) return;
    
    setTentouEnviar(true);
    
    if (!validarFormulario()) {
      toast.error('Corrija os erros antes de continuar');
      setAbaSelecionada('basicos'); // Voltar para aba de dados básicos
      return;
    }
    
    setSalvando(true);
    
    // Timeout de segurança
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setSalvando(false);
        toast.error('Tempo de salvamento excedido. Tente novamente.');
      }
    }, 10000);
    
    try {
      const dadosParaSalvar: Omit<Usuario, 'id'> = {
        nome: dados.nome.trim(),
        email: dados.email.trim().toLowerCase(),
        telefone: dados.telefone,
        cargo: dados.cargo,
        setor: dados.setor,
        status: dados.status,
        nivel_acesso: dados.nivel_acesso || undefined,
        data_nascimento: dados.data_nascimento || undefined,
        data_contratacao: dados.data_contratacao || undefined,
        foto: dados.foto || undefined,
        salario_base: dados.salario_base || undefined,
        beneficios: dados.beneficios,
        historico_profissional: dados.historico_profissional
      };
      
      await onSalvar(dadosParaSalvar, isEdicao, usuario?.id);
    } catch (error) {
      // Erro já tratado pelo componente pai
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setSalvando(false);
      }
    }
  }, [dados, validarFormulario, onSalvar, isEdicao, usuario?.id]);

  // Classe para feedback visual
  const getFieldClass = useCallback((campo: string) => {
    return erros[campo] ? 'border-red-500' : '';
  }, [erros]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancelar()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdicao ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={abaSelecionada} onValueChange={setAbaSelecionada}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basicos">Dados Básicos</TabsTrigger>
              <TabsTrigger value="profissional">Profissional</TabsTrigger>
              <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
            
            {/* Aba: Dados Básicos */}
            <TabsContent value="basicos" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={dados.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    className={getFieldClass('nome')}
                    disabled={salvando}
                    placeholder="Digite o nome completo"
                  />
                  {erros.nome && (
                    <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={dados.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={getFieldClass('email')}
                    disabled={salvando}
                    placeholder="exemplo@classea.com.br"
                  />
                  {erros.email && (
                    <p className="text-red-500 text-sm mt-1">{erros.email}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={dados.telefone}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                    className={getFieldClass('telefone')}
                    disabled={salvando}
                    placeholder="+55 21 99999-8888"
                  />
                  {erros.telefone && (
                    <p className="text-red-500 text-sm mt-1">{erros.telefone}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={dados.data_nascimento}
                    onChange={(e) => handleChange('data_nascimento', e.target.value)}
                    className={getFieldClass('data_nascimento')}
                    disabled={salvando}
                  />
                  {erros.data_nascimento && (
                    <p className="text-red-500 text-sm mt-1">{erros.data_nascimento}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={dados.status}
                    onValueChange={(valor) => handleChange('status', valor)}
                    disabled={salvando}
                  >
                    <SelectTrigger className={getFieldClass('status')}>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  {erros.status && (
                    <p className="text-red-500 text-sm mt-1">{erros.status}</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Aba: Dados Profissionais */}
            <TabsContent value="profissional" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cargo">Cargo *</Label>
                  <Select
                    value={dados.cargo}
                    onValueChange={(valor) => handleChange('cargo', valor)}
                    disabled={salvando}
                  >
                    <SelectTrigger className={getFieldClass('cargo')}>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {cargos.map(cargo => (
                        <SelectItem key={cargo.id} value={cargo.nome}>
                          {cargo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {erros.cargo && (
                    <p className="text-red-500 text-sm mt-1">{erros.cargo}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="setor">Setor *</Label>
                  <Select
                    value={dados.setor}
                    onValueChange={(valor) => handleChange('setor', valor)}
                    disabled={salvando}
                  >
                    <SelectTrigger className={getFieldClass('setor')}>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {setores.map(setor => (
                        <SelectItem key={setor.id} value={setor.nome}>
                          {setor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {erros.setor && (
                    <p className="text-red-500 text-sm mt-1">{erros.setor}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="nivel_acesso">Nível de Acesso</Label>
                  <Select
                    value={dados.nivel_acesso}
                    onValueChange={(valor) => handleChange('nivel_acesso', valor)}
                    disabled={salvando}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível de acesso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Sem nível de acesso</SelectItem>
                      {niveisAcesso.map(nivel => (
                        <SelectItem key={nivel.id} value={nivel.nome}>
                          {nivel.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!dados.nivel_acesso && (
                    <p className="text-orange-600 text-sm mt-1">
                      ⚠️ Usuário sem nível de acesso não poderá acessar o sistema
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="data_contratacao">Data de Contratação</Label>
                  <Input
                    id="data_contratacao"
                    type="date"
                    value={dados.data_contratacao}
                    onChange={(e) => handleChange('data_contratacao', e.target.value)}
                    className={getFieldClass('data_contratacao')}
                    disabled={salvando}
                  />
                  {erros.data_contratacao && (
                    <p className="text-red-500 text-sm mt-1">{erros.data_contratacao}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="salario_base">Salário Base (R$)</Label>
                  <Input
                    id="salario_base"
                    type="number"
                    step="0.01"
                    min="0"
                    value={dados.salario_base || ''}
                    onChange={(e) => handleChange('salario_base', parseFloat(e.target.value) || 0)}
                    className={getFieldClass('salario_base')}
                    disabled={salvando}
                    placeholder="0.00"
                  />
                  {erros.salario_base && (
                    <p className="text-red-500 text-sm mt-1">{erros.salario_base}</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Aba: Benefícios */}
            <TabsContent value="beneficios" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Benefício</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="beneficio_nome">Nome do Benefício</Label>
                      <Input
                        id="beneficio_nome"
                        value={novoBeneficio.nome}
                        onChange={(e) => setNovoBeneficio(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Ex: Vale Refeição"
                        disabled={salvando}
                      />
                    </div>
                    
                    <div className="w-40">
                      <Label htmlFor="beneficio_valor">Valor (R$)</Label>
                      <Input
                        id="beneficio_valor"
                        type="number"
                        step="0.01"
                        min="0"
                        value={novoBeneficio.valor || ''}
                        onChange={(e) => setNovoBeneficio(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        disabled={salvando}
                      />
                    </div>
                    
                    <Button
                      type="button"
                      onClick={editandoBeneficio !== null ? handleSalvarEdicaoBeneficio : handleAdicionarBeneficio}
                      disabled={salvando}
                    >
                      {editandoBeneficio !== null ? (
                        <>
                          <LucideIcons.Check className="mr-2 h-4 w-4" />
                          Salvar
                        </>
                      ) : (
                        <>
                          <LucideIcons.Plus className="mr-2 h-4 w-4" />
                          Adicionar
                        </>
                      )}
                    </Button>
                    
                    {editandoBeneficio !== null && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditandoBeneficio(null);
                          setNovoBeneficio({ nome: '', valor: 0 });
                        }}
                        disabled={salvando}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Lista de Benefícios */}
              {dados.beneficios.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Benefícios Cadastrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dados.beneficios.map((beneficio, indice) => (
                        <div key={indice} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{beneficio.nome}</p>
                            <p className="text-sm text-gray-500">
                              R$ {beneficio.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditarBeneficio(indice)}
                              disabled={salvando || editandoBeneficio !== null}
                            >
                              <LucideIcons.Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoverBeneficio(indice)}
                              disabled={salvando}
                            >
                              <LucideIcons.Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Aba: Histórico Profissional */}
            <TabsContent value="historico" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Experiência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hist_empresa">Empresa</Label>
                      <Input
                        id="hist_empresa"
                        value={novoHistorico.empresa}
                        onChange={(e) => setNovoHistorico(prev => ({ ...prev, empresa: e.target.value }))}
                        placeholder="Nome da empresa"
                        disabled={salvando}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="hist_cargo">Cargo</Label>
                      <Input
                        id="hist_cargo"
                        value={novoHistorico.cargo}
                        onChange={(e) => setNovoHistorico(prev => ({ ...prev, cargo: e.target.value }))}
                        placeholder="Cargo exercido"
                        disabled={salvando}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="hist_periodo">Período</Label>
                      <Input
                        id="hist_periodo"
                        value={novoHistorico.periodo}
                        onChange={(e) => setNovoHistorico(prev => ({ ...prev, periodo: e.target.value }))}
                        placeholder="Ex: 2020-2022"
                        disabled={salvando}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="hist_observacoes">Observações</Label>
                    <Textarea
                      id="hist_observacoes"
                      value={novoHistorico.observacoes}
                      onChange={(e) => setNovoHistorico(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Descrição das atividades e responsabilidades"
                      disabled={salvando}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={editandoHistorico !== null ? handleSalvarEdicaoHistorico : handleAdicionarHistorico}
                      disabled={salvando}
                    >
                      {editandoHistorico !== null ? (
                        <>
                          <LucideIcons.Check className="mr-2 h-4 w-4" />
                          Salvar Alterações
                        </>
                      ) : (
                        <>
                          <LucideIcons.Plus className="mr-2 h-4 w-4" />
                          Adicionar Experiência
                        </>
                      )}
                    </Button>
                    
                    {editandoHistorico !== null && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditandoHistorico(null);
                          setNovoHistorico({ empresa: '', cargo: '', periodo: '', observacoes: '' });
                        }}
                        disabled={salvando}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Lista de Histórico */}
              {dados.historico_profissional.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Experiências Cadastradas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dados.historico_profissional.map((hist, indice) => (
                        <div key={indice} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{hist.cargo}</h4>
                              <p className="text-sm text-gray-600">{hist.empresa} • {hist.periodo}</p>
                              {hist.observacoes && (
                                <p className="text-sm mt-2">{hist.observacoes}</p>
                              )}
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditarHistorico(indice)}
                                disabled={salvando || editandoHistorico !== null}
                              >
                                <LucideIcons.Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoverHistorico(indice)}
                                disabled={salvando}
                              >
                                <LucideIcons.Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancelar}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                `${isEdicao ? 'Atualizar' : 'Criar'} Usuário`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}