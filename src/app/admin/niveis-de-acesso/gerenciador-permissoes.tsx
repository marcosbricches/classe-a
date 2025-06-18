'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

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
  perfil: PerfilAcesso;
  telasDisponiveis: TelaSistema[];
  carregandoTelas: boolean;
  onPermissoesAtualizadas: () => void;
  onCancelar: () => void;
}

// API Mock
const apiMock = {
  atualizarPermissoes: async (perfilId: string, permissoes: PermissaoTela[]): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
};

export default function GerenciadorPermissoes({
  perfil,
  telasDisponiveis,
  carregandoTelas,
  onPermissoesAtualizadas,
  onCancelar
}: Props) {
  // Estados
  const [permissoes, setPermissoes] = useState<PermissaoTela[]>(perfil.permissoes || []);
  const [salvando, setSalvando] = useState(false);
  const [filtroModulo, setFiltroModulo] = useState('todos');
  const [buscaTela, setBuscaTela] = useState('');
  
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  // Resetar permissões quando perfil muda
  useEffect(() => {
    setPermissoes(perfil.permissoes || []);
  }, [perfil.permissoes]);

  // Obter módulos disponíveis
  const modulosDisponiveis = useMemo(() => {
    const modulos = Array.from(new Set(telasDisponiveis.map(t => t.modulo)));
    return modulos.sort();
  }, [telasDisponiveis]);

  // Filtrar telas
  const telasFiltradas = useMemo(() => {
    let telas = telasDisponiveis;
    
    if (filtroModulo !== 'todos') {
      telas = telas.filter(t => t.modulo === filtroModulo);
    }
    
    if (buscaTela) {
      telas = telas.filter(t => 
        t.nome.toLowerCase().includes(buscaTela.toLowerCase()) ||
        t.modulo.toLowerCase().includes(buscaTela.toLowerCase())
      );
    }
    
    return telas;
  }, [telasDisponiveis, filtroModulo, buscaTela]);

  // Organizar telas filtradas por módulo
  const telasPorModulo = useMemo(() => {
    const grupos: Record<string, TelaSistema[]> = {};
    
    telasFiltradas.forEach(tela => {
      if (!grupos[tela.modulo]) {
        grupos[tela.modulo] = [];
      }
      grupos[tela.modulo].push(tela);
    });
    
    return grupos;
  }, [telasFiltradas]);

  // Obter permissão atual para uma tela
  const obterPermissaoTela = useCallback((nomeTela: string, modulo: string) => {
    return permissoes.find(p => p.tela === nomeTela && p.modulo === modulo) || {
      tela: nomeTela,
      modulo: modulo,
      visualizar: false,
      criar: false,
      editar: false,
      excluir: false,
      exportar: false
    };
  }, [permissoes]);

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const totalTelas = telasDisponiveis.length;
    const telasComPermissao = permissoes.filter(p => 
      p.visualizar || p.criar || p.editar || p.excluir || p.exportar
    ).length;
    
    let totalPermissoes = 0;
    let permissoesAtivas = 0;
    
    permissoes.forEach(p => {
      if (p.visualizar) { totalPermissoes++; permissoesAtivas++; }
      if (p.criar) { totalPermissoes++; permissoesAtivas++; }
      if (p.editar) { totalPermissoes++; permissoesAtivas++; }
      if (p.excluir) { totalPermissoes++; permissoesAtivas++; }
      if (p.exportar) { totalPermissoes++; permissoesAtivas++; }
    });
    
    return {
      totalTelas,
      telasComPermissao,
      totalPermissoes,
      permissoesAtivas
    };
  }, [permissoes, telasDisponiveis]);

  // Handler para mudança de permissões
  const handlePermissaoChange = useCallback((tela: string, modulo: string, tipoPermissao: string, valor: boolean) => {
    setPermissoes(prev => {
      const novasPermissoes = [...prev];
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
      
      return novasPermissoes;
    });
  }, []);

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
    
    setPermissoes(todasPermissoes);
  }, [telasDisponiveis]);

  // Limpar todas as permissões
  const handleLimparTodas = useCallback(() => {
    setPermissoes([]);
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
    
    setPermissoes(prev => {
      // Remover permissões existentes do módulo
      const permissoesSemModulo = prev.filter(p => p.modulo !== modulo);
      // Adicionar novas permissões do módulo
      return [...permissoesSemModulo, ...permissoesModulo];
    });
    }, [telasDisponiveis]);

  // Limpar permissões de um módulo
  const handleLimparModulo = useCallback((modulo: string) => {
    setPermissoes(prev => prev.filter(p => p.modulo !== modulo));
  }, []);

  // Submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!montadoRef.current) return;
    
    // Validar se tem ao menos uma permissão
    const temPermissaoAtiva = permissoes.some(p => 
      p.visualizar || p.criar || p.editar || p.excluir || p.exportar
    );
    
    if (!temPermissaoAtiva) {
      toast.error('Selecione ao menos uma permissão');
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
      await apiMock.atualizarPermissoes(perfil.id, permissoes);
      if (montadoRef.current) {
        toast.success('Permissões atualizadas com sucesso');
        onPermissoesAtualizadas();
      }
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      if (montadoRef.current) {
        toast.error('Falha ao salvar permissões. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setSalvando(false);
      }
    }
  }, [permissoes, perfil.id, onPermissoesAtualizadas]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header com informações do perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <LucideIcons.Shield className="mr-2 h-5 w-5" />
                Gerenciar Permissões: {perfil.nome}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {perfil.descricao || 'Nenhuma descrição disponível'}
              </p>
            </div>
            <Badge variant={perfil.status === 'ativo' ? 'default' : 'secondary'}>
              {perfil.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{estatisticas.telasComPermissao}</div>
              <div className="text-sm text-gray-600">Telas com Acesso</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{estatisticas.permissoesAtivas}</div>
              <div className="text-sm text-gray-600">Permissões Ativas</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{perfil.usuarios_vinculados}</div>
              <div className="text-sm text-gray-600">Usuários Vinculados</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{modulosDisponiveis.length}</div>
              <div className="text-sm text-gray-600">Módulos Disponíveis</div>
            </div>
          </div>

          {/* Filtros e ações */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative">
                <LucideIcons.Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar tela..."
                  value={buscaTela}
                  onChange={(e) => setBuscaTela(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              
              <select
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos os Módulos</option>
                {modulosDisponiveis.map(modulo => (
                  <option key={modulo} value={modulo}>{modulo}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelecionarTodas}
                disabled={carregandoTelas || salvando}
              >
                <LucideIcons.CheckSquare className="mr-1 h-3 w-3" />
                Selecionar Todas
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLimparTodas}
                disabled={carregandoTelas || salvando}
              >
                <LucideIcons.Square className="mr-1 h-3 w-3" />
                Limpar Todas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissões por módulo */}
      <form onSubmit={handleSubmit}>
        {carregandoTelas ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="ml-4 text-gray-500">Carregando telas disponíveis...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.keys(telasPorModulo).length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-16">
                    <LucideIcons.Search className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-xl font-medium mb-2">Nenhuma tela encontrada</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                      Nenhuma tela corresponde aos filtros aplicados. Tente ajustar os critérios de busca.
                    </p>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => {
                        setBuscaTela('');
                        setFiltroModulo('todos');
                      }}
                    >
                      <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
                      Limpar Filtros
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              Object.entries(telasPorModulo).map(([modulo, telas]) => (
                <Card key={modulo}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <LucideIcons.Folder className="mr-2 h-4 w-4" />
                        {modulo}
                        <Badge variant="outline" className="ml-2">
                          {telas.length} telas
                        </Badge>
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelecionarModulo(modulo)}
                          disabled={salvando}
                        >
                          <LucideIcons.CheckSquare className="mr-1 h-3 w-3" />
                          Selecionar Módulo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleLimparModulo(modulo)}
                          disabled={salvando}
                        >
                          <LucideIcons.Square className="mr-1 h-3 w-3" />
                          Limpar Módulo
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Header da tabela */}
                      <div className="grid grid-cols-6 gap-4 p-3 bg-gray-50 rounded font-medium text-sm">
                        <div>Tela</div>
                        <div className="text-center">Visualizar</div>
                        <div className="text-center">Criar</div>
                        <div className="text-center">Editar</div>
                        <div className="text-center">Excluir</div>
                        <div className="text-center">Exportar</div>
                      </div>
                      
                      {/* Linhas da tabela */}
                      {telas.map(tela => {
                        const permissaoAtual = obterPermissaoTela(tela.nome, tela.modulo);
                        
                        return (
                          <div key={`${tela.modulo}-${tela.nome}`} className="grid grid-cols-6 gap-4 p-3 border rounded hover:bg-gray-50 transition-colors">
                            <div className="font-medium flex items-center">
                              {tela.nome}
                            </div>
                            
                            {/* Checkboxes de permissões */}
                            {(['visualizar', 'criar', 'editar', 'excluir', 'exportar'] as const).map(tipoPermissao => (
                              <div key={tipoPermissao} className="flex justify-center">
                                {tela.tipo_permissoes.includes(tipoPermissao) ? (
                                  <Checkbox
                                    checked={!!permissaoAtual[tipoPermissao]}
                                    onCheckedChange={(checked) => {
                                      handlePermissaoChange(tela.nome, tela.modulo, tipoPermissao, !!checked);
                                    }}
                                    disabled={salvando}
                                  />
                                ) : (
                                  <div className="w-4 h-4 bg-gray-100 rounded border flex items-center justify-center">
                                    <LucideIcons.Minus className="h-2 w-2 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            disabled={salvando}
          >
            <LucideIcons.ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <Button
            type="submit"
            disabled={salvando || carregandoTelas}
          >
            {salvando ? (
              <>
                <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando Permissões...
              </>
            ) : (
              <>
                <LucideIcons.Save className="mr-2 h-4 w-4" />
                Salvar Permissões
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}