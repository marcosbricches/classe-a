'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

// Reutilizando tipos do arquivo principal
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

interface Props {
  onEditarPerfil: (perfil: PerfilAcesso) => void;
  onGerenciarPermissoes: (perfil: PerfilAcesso) => void;
}

// API Mock (mesma do arquivo principal)
const apiMock = {
  listarPerfis: async (pagina: number, porPagina: number, filtros: any): Promise<{ perfis: PerfilAcesso[], total: number }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const perfisBase: PerfilAcesso[] = [
      {
        id: '1',
        nome: 'Administrador',
        descricao: 'Acesso total ao sistema',
        status: 'ativo',
        data_criacao: '2024-01-15T10:00:00Z',
        data_modificacao: '2024-01-15T10:00:00Z',
        usuarios_vinculados: 3,
        permissoes: [
          { tela: 'Dashboard', modulo: 'Admin', visualizar: true, criar: true, editar: true, excluir: true, exportar: true },
          { tela: 'Usuários', modulo: 'Admin', visualizar: true, criar: true, editar: true, excluir: true },
          { tela: 'Perfis de Acesso', modulo: 'Admin', visualizar: true, criar: true, editar: true, excluir: true }
        ]
      },
      {
        id: '2',
        nome: 'Gestor de Frota',
        descricao: 'Gerenciamento completo da frota de veículos',
        status: 'ativo',
        data_criacao: '2024-01-16T14:30:00Z',
        data_modificacao: '2024-02-10T09:15:00Z',
        usuarios_vinculados: 5,
        permissoes: [
          { tela: 'Dashboard', modulo: 'Admin', visualizar: true, criar: false, editar: false, excluir: false, exportar: true },
          { tela: 'Veículos', modulo: 'Frota', visualizar: true, criar: true, editar: true, excluir: false },
          { tela: 'Manutenção', modulo: 'Frota', visualizar: true, criar: true, editar: true, excluir: true }
        ]
      },
      {
        id: '3',
        nome: 'Financeiro',
        descricao: 'Acesso aos módulos financeiros e relatórios',
        status: 'ativo',
        data_criacao: '2024-01-20T11:45:00Z',
        data_modificacao: '2024-01-20T11:45:00Z',
        usuarios_vinculados: 2,
        permissoes: [
          { tela: 'Contas a Receber', modulo: 'Financeiro', visualizar: true, criar: true, editar: true, excluir: false },
          { tela: 'Contas a Pagar', modulo: 'Financeiro', visualizar: true, criar: true, editar: true, excluir: false },
          { tela: 'Relatórios Financeiros', modulo: 'Financeiro', visualizar: true, criar: false, editar: false, excluir: false, exportar: true }
        ]
      },
      {
        id: '4',
        nome: 'Operacional Inativo',
        descricao: 'Perfil para operação (temporariamente inativo)',
        status: 'inativo',
        data_criacao: '2024-02-01T16:20:00Z',
        data_modificacao: '2024-02-15T08:30:00Z',
        usuarios_vinculados: 0,
        permissoes: [
          { tela: 'Contratos', modulo: 'Contratos', visualizar: true, criar: false, editar: true, excluir: false },
          { tela: 'Motoristas', modulo: 'Operacional', visualizar: true, criar: false, editar: true, excluir: false }
        ]
      }
    ];

    // Aplicar filtros
    let perfisFiltrados = perfisBase;

    if (filtros.termo) {
      perfisFiltrados = perfisFiltrados.filter(perfil =>
        perfil.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        (perfil.descricao && perfil.descricao.toLowerCase().includes(filtros.termo.toLowerCase()))
      );
    }

    if (filtros.status !== 'todos') {
      perfisFiltrados = perfisFiltrados.filter(perfil => perfil.status === filtros.status);
    }

    // Paginação
    const inicio = (pagina - 1) * porPagina;
    const fim = inicio + porPagina;
    const perfisPaginados = perfisFiltrados.slice(inicio, fim);

    return {
      perfis: perfisPaginados,
      total: perfisFiltrados.length
    };
  },

  excluirPerfil: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular erro para perfil em uso
    if (id === '1' || id === '2') {
      throw new Error('Não é possível excluir perfil que possui usuários vinculados');
    }
  },

  alterarStatusPerfil: async (id: string, novoStatus: 'ativo' | 'inativo'): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
  }
};

// Funções utilitárias defensivas
const formatarData = (dataString: string | undefined): string => {
  if (!dataString) return 'N/A';
  
  try {
    const data = new Date(dataString);
    
    if (isNaN(data.getTime())) {
      return 'Data inválida';
    }
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro de formato';
  }
};

const contarPermissoes = (permissoes: PermissaoTela[]): { total: number, ativas: number } => {
  if (!Array.isArray(permissoes)) return { total: 0, ativas: 0 };
  
  try {
    let total = 0;
    let ativas = 0;
    
    permissoes.forEach(permissao => {
      if (permissao.visualizar) { total++; ativas++; }
      if (permissao.criar) { total++; ativas++; }
      if (permissao.editar) { total++; ativas++; }
      if (permissao.excluir) { total++; ativas++; }
      if (permissao.exportar) { total++; ativas++; }
      
      // Contar permissões possíveis não ativas
      if (!permissao.visualizar) total++;
      if (!permissao.criar) total++;
      if (!permissao.editar) total++;
      if (!permissao.excluir) total++;
      if (permissao.exportar !== undefined && !permissao.exportar) total++;
    });
    
    return { total, ativas };
  } catch (error) {
    console.error('Erro ao contar permissões:', error);
    return { total: 0, ativas: 0 };
  }
};

const truncarTexto = (texto: string | undefined, limite: number = 100): string => {
  if (!texto) return 'N/A';
  
  try {
    if (texto.length <= limite) return texto;
    return texto.slice(0, limite) + '...';
  } catch (error) {
    console.error('Erro ao truncar texto:', error);
    return texto || 'Erro';
  }
};

// Modal de confirmação
function ConfirmacaoModal({
  show,
  titulo,
  mensagem,
  onConfirmar,
  onCancelar,
  labelConfirmar = "Confirmar",
  labelCancelar = "Cancelar",
  variante = "default"
}: {
  show: boolean;
  titulo: string;
  mensagem: string;
  onConfirmar: () => Promise<void>;
  onCancelar: () => void;
  labelConfirmar?: string;
  labelCancelar?: string;
  variante?: "default" | "destructive";
}) {
  const [processando, setProcessando] = useState(false);
  const montadoRef = useRef(true);
  
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);
  
  const handleConfirmar = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setProcessando(true);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setProcessando(false);
        toast.error('Tempo excedido. Tente novamente.');
      }
    }, 5000);
    
    try {
      await onConfirmar();
    } catch (error) {
      console.error('Erro na confirmação:', error);
      if (montadoRef.current) {
        toast.error('Falha na operação. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setProcessando(false);
      }
    }
  }, [onConfirmar]);
  
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onCancelar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p>{mensagem}</p>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancelar}
            disabled={processando}
          >
            {labelCancelar}
          </Button>
          <Button
            variant={variante === "destructive" ? "destructive" : "default"}
            onClick={handleConfirmar}
            disabled={processando}
          >
            {processando ? (
              <>
                <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              labelConfirmar
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ListagemPerfis({ onEditarPerfil, onGerenciarPermissoes }: Props) {
  // Estados
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [totalPerfis, setTotalPerfis] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina] = useState(10);
  const [filtros, setFiltros] = useState({
    termo: '',
    status: 'todos'
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [perfilParaExcluir, setPerfilParaExcluir] = useState<PerfilAcesso | null>(null);
  const [alterandoStatus, setAlterandoStatus] = useState<string | null>(null);
  
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Verificar filtros aplicados
  const filtrosAplicados = useMemo(() => {
    return filtros.termo !== '' || filtros.status !== 'todos';
  }, [filtros]);

  // Total de páginas
  const totalPaginas = Math.ceil(totalPerfis / itensPorPagina);

  // Carregar dados
  const carregarDados = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregando(true);
    setErro(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregando(false);
        setErro('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 5000);
    
    try {
      const { perfis, total } = await apiMock.listarPerfis(pagina, itensPorPagina, filtros);
      if (montadoRef.current) {
        setPerfis(perfis);
        setTotalPerfis(total);
      }
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar perfis. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregando(false);
      }
    }
  }, [pagina, itensPorPagina, filtros]);

  // Efeito para carregar dados
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Handlers de filtros
  const handleFiltroChange = useCallback((campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPagina(1);
  }, []);

  const handleLimparFiltros = useCallback(() => {
    setFiltros({
      termo: '',
      status: 'todos'
    });
    setPagina(1);
  }, []);

  // Handler de paginação
  const handlePaginaChange = useCallback((novaPagina: number) => {
    setPagina(Math.max(1, Math.min(novaPagina, totalPaginas)));
  }, [totalPaginas]);

  // Handler de exclusão
  const handleExcluirPerfil = useCallback(async () => {
    if (!perfilParaExcluir || !montadoRef.current) return;
    
    try {
      await apiMock.excluirPerfil(perfilParaExcluir.id);
      if (montadoRef.current) {
        toast.success('Perfil excluído com sucesso');
        setPerfilParaExcluir(null);
        carregarDados();
      }
    } catch (error: any) {
      console.error('Erro ao excluir perfil:', error);
      if (montadoRef.current) {
        toast.error(error.message || 'Falha ao excluir perfil');
      }
    }
  }, [perfilParaExcluir, carregarDados]);

  // Handler de alteração de status
  const handleAlterarStatus = useCallback(async (perfil: PerfilAcesso) => {
    if (!montadoRef.current) return;
    
    setAlterandoStatus(perfil.id);
    const novoStatus = perfil.status === 'ativo' ? 'inativo' : 'ativo';
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setAlterandoStatus(null);
        toast.error('Tempo excedido. Tente novamente.');
      }
    }, 5000);
    
    try {
      await apiMock.alterarStatusPerfil(perfil.id, novoStatus);
      if (montadoRef.current) {
        toast.success(`Perfil ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso`);
        carregarDados();
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      if (montadoRef.current) {
        toast.error('Falha ao alterar status do perfil');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setAlterandoStatus(null);
      }
    }
  }, [carregarDados]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <LucideIcons.Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={filtros.termo}
                onChange={e => handleFiltroChange('termo', e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select
              value={filtros.status}
              onValueChange={valor => handleFiltroChange('status', valor)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={handleLimparFiltros}
              disabled={!filtrosAplicados}
            >
              <LucideIcons.X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estados de UI */}
      {carregando && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="ml-4 text-gray-500">Carregando perfis...</p>
        </div>
      )}

      {!carregando && erro && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-700 mb-4">{erro}</p>
          <Button onClick={carregarDados}>
            <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      )}

      {!carregando && !erro && (!perfis || perfis.length === 0) && (
        <div className="text-center py-16">
          <LucideIcons.Shield className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">Nenhum perfil encontrado</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {filtrosAplicados 
              ? 'Nenhum perfil corresponde aos filtros aplicados. Tente ajustar os critérios de busca.'
              : 'Não existem perfis de acesso cadastrados. Crie o primeiro perfil para começar.'
            }
          </p>
          
          {filtrosAplicados ? (
            <Button onClick={handleLimparFiltros} variant="outline">
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          ) : (
            <Button onClick={() => {}}>
              <LucideIcons.Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Perfil
            </Button>
          )}
        </div>
      )}

      {/* Lista de perfis */}
      {!carregando && !erro && perfis && perfis.length > 0 && (
        <div className="space-y-4">
          {perfis.map((perfil) => (
            <Card key={perfil.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{perfil.nome}</h3>
                      <Badge 
                        variant={perfil.status === 'ativo' ? 'default' : 'secondary'}
                        className={perfil.status === 'ativo' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {perfil.status}
                      </Badge>
                      
                      {perfil.usuarios_vinculados > 0 && (
                        <Badge variant="outline">
                          <LucideIcons.Users className="mr-1 h-3 w-3" />
                          {perfil.usuarios_vinculados} usuários
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">
                      {truncarTexto(perfil.descricao, 150)}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>
                        <LucideIcons.Calendar className="inline mr-1 h-3 w-3" />
                        Criado: {formatarData(perfil.data_criacao)}
                      </span>
                      
                      <span>
                        <LucideIcons.Shield className="inline mr-1 h-3 w-3" />
                        {contarPermissoes(perfil.permissoes).ativas} permissões ativas
                      </span>
                      
                      {perfil.data_modificacao !== perfil.data_criacao && (
                        <span>
                          <LucideIcons.Clock className="inline mr-1 h-3 w-3" />
                          Modificado: {formatarData(perfil.data_modificacao)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-6">
                    {/* Toggle de status */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={perfil.status === 'ativo'}
                        onCheckedChange={() => handleAlterarStatus(perfil)}
                        disabled={alterandoStatus === perfil.id}
                      />
                      {alterandoStatus === perfil.id && (
                        <LucideIcons.Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                    
                    {/* Botões de ação */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGerenciarPermissoes(perfil)}
                    >
                      <LucideIcons.Shield className="mr-1 h-3 w-3" />
                      Permissões
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditarPerfil(perfil)}
                    >
                      <LucideIcons.Pencil className="mr-1 h-3 w-3" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPerfilParaExcluir(perfil)}
                      disabled={perfil.usuarios_vinculados > 0}
                      className={perfil.usuarios_vinculados > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 hover:text-red-600'}
                    >
                      <LucideIcons.Trash2 className="mr-1 h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Mostrando {perfis.length} de {totalPerfis} perfis
              </p>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePaginaChange(pagina - 1)}
                  disabled={pagina <= 1}
                >
                  <LucideIcons.ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPaginas })
                  .map((_, i) => i + 1)
                  .filter((numeroPagina) => {
                    return numeroPagina === 1 || 
                          numeroPagina === totalPaginas || 
                          Math.abs(numeroPagina - pagina) <= 1;
                  })
                  .map((numeroPagina, index, paginasFiltradas) => (
                    <Fragment key={numeroPagina}>
                      {index > 0 && paginasFiltradas[index-1] !== numeroPagina - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <Button
                        variant={pagina === numeroPagina ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePaginaChange(numeroPagina)}
                      >
                        {numeroPagina}
                      </Button>
                    </Fragment>
                  ))
                }
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePaginaChange(pagina + 1)}
                  disabled={pagina >= totalPaginas}
                >
                  <LucideIcons.ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <ConfirmacaoModal
        show={!!perfilParaExcluir}
        titulo="Confirmar Exclusão"
        mensagem={`Tem certeza que deseja excluir o perfil "${perfilParaExcluir?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirmar={handleExcluirPerfil}
        onCancelar={() => setPerfilParaExcluir(null)}
        labelConfirmar="Excluir"
        variante="destructive"
      />
    </div>
  );
}