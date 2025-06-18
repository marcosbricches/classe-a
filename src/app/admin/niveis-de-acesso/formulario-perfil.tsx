'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Tipos
interface PerfilAcesso {
  id: string;
  nome: string;
  descricao?: string;
  status: 'ativo' | 'inativo';
  data_criacao: string;
  data_modificacao: string;
  permissoes: PermissaoTela[];
  usuarios_vinculados: number;
}

interface PermissaoTela {
  tela: string;
  modulo: string;
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  exportar?: boolean;
}

interface TelaSistema {
  nome: string;
  modulo: string;
  tipo_permissoes: ('visualizar' | 'criar' | 'editar' | 'excluir' | 'exportar')[];
}

interface Props {
  perfilInicial?: PerfilAcesso | null;
  modoEdicao: boolean;
  telasDisponiveis: TelaSistema[];
  carregandoTelas: boolean;
  onPerfilSalvo: () => void;
  onCancelar: () => void;
}

// API Mock
const apiMock = {
  criarPerfil: async (dados: Omit<PerfilAcesso, 'id' | 'data_criacao' | 'data_modificacao' | 'usuarios_vinculados'>): Promise<PerfilAcesso> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simular erro de nome duplicado
    if (dados.nome.toLowerCase() === 'administrador') {
      throw new Error('Já existe um perfil com este nome');
    }

    const novoPerfil: PerfilAcesso = {
      ...dados,
      id: Date.now().toString(),
      data_criacao: new Date().toISOString(),
      data_modificacao: new Date().toISOString(),
      usuarios_vinculados: 0
    };

    return novoPerfil;
  },

  atualizarPerfil: async (id: string, dados: Partial<PerfilAcesso>): Promise<PerfilAcesso> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id,
      nome: dados.nome || 'Perfil Atualizado',
      descricao: dados.descricao,
      status: dados.status || 'ativo',
      data_criacao: '2024-01-15T10:00:00Z',
      data_modificacao: new Date().toISOString(),
      permissoes: dados.permissoes || [],
      usuarios_vinculados: dados.usuarios_vinculados || 0
    };
  }
};

export default function FormularioPerfil({
  perfilInicial,
  modoEdicao,
  telasDisponiveis,
  carregandoTelas,
  onPerfilSalvo,
  onCancelar
}: Props) {
  // Valores iniciais seguros
  const valoresIniciais = useMemo(() => ({
    nome: perfilInicial?.nome || '',
    descricao: perfilInicial?.descricao || '',
    status: perfilInicial?.status || 'ativo',
    permissoes: perfilInicial?.permissoes || []
  }), [perfilInicial]);
  
  // Estados
  const [dados, setDados] = useState(valoresIniciais);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<'dados' | 'permissoes'>('dados');
  
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
    setEtapaAtual('dados');
  }, [valoresIniciais]);

  // Validação em tempo real após primeira tentativa
  useEffect(() => {
    if (tentouEnviar) {
      validarFormulario();
    }
  }, [dados, tentouEnviar]);

  // Organizar telas por módulo
  const telasPorModulo = useMemo(() => {
    const grupos: Record<string, TelaSistema[]> = {};
    
    telasDisponiveis.forEach(tela => {
      if (!grupos[tela.modulo]) {
        grupos[tela.modulo] = [];
      }
      grupos[tela.modulo].push(tela);
    });
    
    return grupos;
  }, [telasDisponiveis]);

  // Obter permissão atual para uma tela
  const obterPermissaoTela = useCallback((nomeTela: string, modulo: string) => {
    return dados.permissoes.find(p => p.tela === nomeTela && p.modulo === modulo) || {
      tela: nomeTela,
      modulo: modulo,
      visualizar: false,
      criar: false,
      editar: false,
      excluir: false,
      exportar: false
    };
  }, [dados.permissoes]);

  // Validação do formulário
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
    
    // Descrição opcional mas com limite
    if (dados.descricao && dados.descricao.length > 255) {
      novosErros.descricao = 'Descrição não pode ter mais de 255 caracteres';
    }
    
    // Ao menos uma permissão deve estar ativa
    const temPermissaoAtiva = dados.permissoes.some(p => 
      p.visualizar || p.criar || p.editar || p.excluir || p.exportar
    );
    
    if (!temPermissaoAtiva) {
      novosErros.permissoes = 'Selecione ao menos uma permissão';
    }
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }, [dados]);

  // Handler para mudança de campos básicos
  const handleChange = useCallback((campo: string, valor: string) => {
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

  // Handler para mudança de permissões
  const handlePermissaoChange = useCallback((tela: string, modulo: string, tipoPermissao: string, valor: boolean) => {
    setDados(prev => {
      const novasPermissoes = [...prev.permissoes];
      const index = novasPermissoes.findIndex(p => p.tela === tela && p.modulo === modulo);
      
      if (index >= 0) {
        novasPermissoes[index] = {
          ...novasPermissoes[index],
          [tipoPermissao]: valor
        };
      } else {
        novasPermissoes.push({
          tela,
          modulo,
          visualizar: tipoPermissao === 'visualizar' ? valor : false,
          criar: tipoPermissao === 'criar' ? valor : false,
          editar: tipoPermissao === 'editar' ? valor : false,
          excluir: tipoPermissao === 'excluir' ? valor : false,
          exportar: tipoPermissao === 'exportar' ? valor : false
        });
      }
      
      return { ...prev, permissoes: novasPermissoes };
    });
    
    // Limpar erro de permissões se existir
    if (erros.permissoes) {
      setErros(prev => {
        const novos = { ...prev };
        delete novos.permissoes;
        return novos;
      });
    }
  }, [erros.permissoes]);

  // Selecionar todas as permissões
  const handleSelecionarTodas = useCallback(() => {
    const todasPermissoes: PermissaoTela[] = telasDisponiveis.map(tela => ({
      tela: tela.nome,
      modulo: tela.modulo,
      visualizar: tela.tipo_permissoes.includes('visualizar'),
      criar: tela.tipo_permissoes.includes('criar'),
      editar: tela.tipo_permissoes.includes('editar'),
      excluir: tela.tipo_permissoes.includes('excluir'),
      exportar: tela.tipo_permissoes.includes('exportar')
    }));
    
    setDados(prev => ({ ...prev, permissoes: todasPermissoes }));
  }, [telasDisponiveis]);

  // Limpar todas as permissões
  const handleLimparTodas = useCallback(() => {
    setDados(prev => ({ ...prev, permissoes: [] }));
  }, []);

  // Selecionar permissões de um módulo
  const handleSelecionarModulo = useCallback((modulo: string) => {
    const telasDoModulo = telasDisponiveis.filter(t => t.modulo === modulo);
    const permissoesModulo: PermissaoTela[] = telasDoModulo.map(tela => ({
      tela: tela.nome,
      modulo: tela.modulo,
      visualizar: tela.tipo_permissoes.includes('visualizar'),
      criar: tela.tipo_permissoes.includes('criar'),
      editar: tela.tipo_permissoes.includes('editar'),
      excluir: tela.tipo_permissoes.includes('excluir'),
      exportar: tela.tipo_permissoes.includes('exportar')
    }));
    
    setDados(prev => {
      // Remover permissões existentes do módulo
      const permissoesSemModulo = prev.permissoes.filter(p => p.modulo !== modulo);
      // Adicionar novas permissões do módulo
      return { ...prev, permissoes: [...permissoesSemModulo, ...permissoesModulo] };
    });
  }, [telasDisponiveis]);

  // Navegar entre etapas
  const handleProximaEtapa = useCallback(() => {
    setTentouEnviar(true);
    
    if (validarFormulario()) {
      setEtapaAtual('permissoes');
    } else {
      toast.error('Corrija os erros antes de continuar');
    }
  }, [validarFormulario]);

  const handleEtapaAnterior = useCallback(() => {
    setEtapaAtual('dados');
  }, []);

  // Submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!montadoRef.current) return;
    
    setTentouEnviar(true);
    
    if (!validarFormulario()) {
      toast.error('Corrija os erros antes de continuar');
      return;
    }
    
    setSalvando(true);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setSalvando(false);
        toast.error('Tempo de salvamento excedido. Tente novamente.');
      }
    }, 10000);
    
    try {
      if (modoEdicao && perfilInicial) {
        await apiMock.atualizarPerfil(perfilInicial.id, dados);
        if (montadoRef.current) {
          toast.success('Perfil atualizado com sucesso');
        }
      } else {
        await apiMock.criarPerfil(dados);
        if (montadoRef.current) {
          toast.success('Perfil criado com sucesso');
        }
      }
      
      if (montadoRef.current) {
        onPerfilSalvo();
      }
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      if (montadoRef.current) {
        if (error.message.includes('nome')) {
          setErros(prev => ({ ...prev, nome: error.message }));
        }
        toast.error(error.message || 'Falha ao salvar perfil. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setSalvando(false);
      }
    }
  }, [dados, validarFormulario, modoEdicao, perfilInicial, onPerfilSalvo]);

  // Classes para feedback visual
  const getFieldClass = useCallback((campo: string) => {
    return erros[campo] ? 'border-red-500' : '';
  }, [erros]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Indicador de progresso */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center ${etapaAtual === 'dados' ? 'text-blue-600' : 'text-green-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            etapaAtual === 'dados' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-green-100 border-2 border-green-600'
          }`}>
            {etapaAtual === 'dados' ? '1' : <LucideIcons.Check className="w-4 h-4" />}
          </div>
          <span className="ml-2 font-medium">Dados Básicos</span>
        </div>
        
        <div className={`w-20 h-0.5 ${etapaAtual === 'permissoes' ? 'bg-blue-200' : 'bg-gray-200'}`}></div>
        
        <div className={`flex items-center ${etapaAtual === 'permissoes' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            etapaAtual === 'permissoes' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100 border-2 border-gray-300'
          }`}>
            2
          </div>
          <span className="ml-2 font-medium">Permissões</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Etapa 1: Dados Básicos */}
        {etapaAtual === 'dados' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LucideIcons.FileText className="mr-2 h-5 w-5" />
                {modoEdicao ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="nome">Nome do Perfil</Label>
                <Input
                  id="nome"
                  value={dados.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className={getFieldClass('nome')}
                  disabled={salvando}
                  placeholder="Ex: Gestor de Frota, Financeiro, Marketing..."
                />
                {erros.nome && (
                  <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição (Opcional)</Label>
                <Textarea
                  id="descricao"
                  value={dados.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  className={getFieldClass('descricao')}
                  disabled={salvando}
                  placeholder="Descrição detalhada do perfil e suas responsabilidades..."
                  rows={3}
                />
                {erros.descricao && (
                  <p className="text-red-500 text-sm mt-1">{erros.descricao}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {dados.descricao?.length || 0}/255 caracteres
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancelar}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleProximaEtapa}
                  disabled={salvando}
                >
                  Próximo: Permissões
                  <LucideIcons.ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: Permissões */}
        {etapaAtual === 'permissoes' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LucideIcons.Shield className="mr-2 h-5 w-5" />
                  Configurar Permissões
                </CardTitle>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelecionarTodas}
                    disabled={carregandoTelas}
                  >
                    <LucideIcons.CheckSquare className="mr-1 h-3 w-3" />
                    Selecionar Todas
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLimparTodas}
                    disabled={carregandoTelas}
                  >
                    <LucideIcons.Square className="mr-1 h-3 w-3" />
                    Limpar Todas
                  </Button>
                </div>
                {erros.permissoes && (
                  <p className="text-red-500 text-sm">{erros.permissoes}</p>
                )}
              </CardHeader>
              <CardContent>
                {carregandoTelas ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    <p className="ml-4 text-gray-500">Carregando telas disponíveis...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(telasPorModulo).map(([modulo, telas]) => (
                      <div key={modulo} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">{modulo}</h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelecionarModulo(modulo)}
                          >
                            <LucideIcons.CheckSquare className="mr-1 h-3 w-3" />
                            Selecionar Módulo
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {telas.map(tela => {
                            const permissaoAtual = obterPermissaoTela(tela.nome, tela.modulo);
                            
                            return (
                              <div key={`${tela.modulo}-${tela.nome}`} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                                <div className="font-medium">{tela.nome}</div>
                                <div className="flex items-center space-x-4">
                                  {tela.tipo_permissoes.map(tipoPermissao => (
                                    <label key={tipoPermissao} className="flex items-center space-x-2 cursor-pointer">
                                      <Checkbox
                                        checked={!!permissaoAtual[tipoPermissao as keyof PermissaoTela]}
                                        onCheckedChange={(checked) => {
                                          handlePermissaoChange(tela.nome, tela.modulo, tipoPermissao, !!checked);
                                        }}
                                      />
                                      <span className="text-sm capitalize">{tipoPermissao}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleEtapaAnterior}
                disabled={salvando}
              >
                <LucideIcons.ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              
              <div className="space-x-2">
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
                  disabled={salvando || carregandoTelas}
                >
                  {salvando ? (
                    <>
                      <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <LucideIcons.Save className="mr-2 h-4 w-4" />
                      {modoEdicao ? 'Atualizar Perfil' : 'Criar Perfil'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}