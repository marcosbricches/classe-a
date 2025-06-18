'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast, Toaster } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import ListagemPerfis from './listagem-perfis'
import FormularioPerfil from './formulario-perfil'
import GerenciadorPermissoes from './gerenciador-permissoes'

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

// API Mock
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

  obterTelasDisponiveis: async (): Promise<TelaSistema[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      { nome: 'Dashboard', modulo: 'Admin', tipo_permissoes: ['visualizar', 'exportar'] },
      { nome: 'Usuários', modulo: 'Admin', tipo_permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { nome: 'Perfis de Acesso', modulo: 'Admin', tipo_permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { nome: 'Veículos', modulo: 'Frota', tipo_permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { nome: 'Manutenção', modulo: 'Frota', tipo_permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { nome: 'Clientes', modulo: 'Cadastros', tipo_permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { nome: 'Fornecedores', modulo: 'Cadastros', tipo_permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { nome: 'Contratos', modulo: 'Contratos', tipo_permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { nome: 'Motoristas', modulo: 'Operacional', tipo_permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { nome: 'Contas a Receber', modulo: 'Financeiro', tipo_permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { nome: 'Contas a Pagar', modulo: 'Financeiro', tipo_permissoes: ['visualizar', 'criar', 'editar', 'excluir'] },
      { nome: 'Relatórios Financeiros', modulo: 'Financeiro', tipo_permissoes: ['visualizar', 'exportar'] }
    ];
  },

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
    
    // Simular perfil atualizado
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

export default function NiveisAcessoPage() {
  // Estados globais
  const [abaSelecionada, setAbaSelecionada] = useState<'listagem' | 'formulario' | 'permissoes'>('listagem');
  const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilAcesso | null>(null);
  const [telasDisponiveis, setTelasDisponiveis] = useState<TelaSistema[]>([]);
  const [carregandoTelas, setCarregandoTelas] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    carregarTelasDisponiveis();
    
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregar telas disponíveis
  const carregarTelasDisponiveis = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoTelas(true);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoTelas(false);
        toast.error('Tempo excedido ao carregar telas. Tente novamente.');
      }
    }, 5000);
    
    try {
      const telas = await apiMock.obterTelasDisponiveis();
      if (montadoRef.current) {
        setTelasDisponiveis(telas);
      }
    } catch (error) {
      console.error('Erro ao carregar telas:', error);
      if (montadoRef.current) {
        toast.error('Falha ao carregar telas disponíveis.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoTelas(false);
      }
    }
  }, []);

  // Handlers de navegação
  const handleCriarNovo = useCallback(() => {
    setPerfilSelecionado(null);
    setModoEdicao(false);
    setAbaSelecionada('formulario');
  }, []);

  const handleEditarPerfil = useCallback((perfil: PerfilAcesso) => {
    setPerfilSelecionado(perfil);
    setModoEdicao(true);
    setAbaSelecionada('formulario');
  }, []);

  const handleGerenciarPermissoes = useCallback((perfil: PerfilAcesso) => {
    setPerfilSelecionado(perfil);
    setAbaSelecionada('permissoes');
  }, []);

  const handleVoltarListagem = useCallback(() => {
    setAbaSelecionada('listagem');
    setPerfilSelecionado(null);
    setModoEdicao(false);
  }, []);

  const handlePerfilSalvo = useCallback(() => {
    toast.success('Perfil salvo com sucesso');
    setAbaSelecionada('listagem');
    setPerfilSelecionado(null);
    setModoEdicao(false);
  }, []);

  const handlePermissoesAtualizadas = useCallback(() => {
    toast.success('Permissões atualizadas com sucesso');
    setAbaSelecionada('listagem');
    setPerfilSelecionado(null);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Níveis de Acesso</h1>
          <p className="text-gray-600">
            Gerencie perfis de acesso e permissões dos usuários do sistema
          </p>
        </div>
        
        {abaSelecionada === 'listagem' && (
          <Button onClick={handleCriarNovo}>
            <LucideIcons.Plus className="mr-2 h-4 w-4" />
            Novo Perfil
          </Button>
        )}
        
        {abaSelecionada !== 'listagem' && (
          <Button variant="outline" onClick={handleVoltarListagem}>
            <LucideIcons.ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        )}
      </div>

      {/* Navegação por abas */}
      <div className="flex space-x-1 mb-6 border-b">
        <button
          onClick={() => setAbaSelecionada('listagem')}
          className={`px-4 py-2 rounded-t-lg transition-colors ${
            abaSelecionada === 'listagem'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <LucideIcons.List className="inline mr-2 h-4 w-4" />
          Listagem
        </button>
        
        {(abaSelecionada === 'formulario' || abaSelecionada === 'permissoes') && (
          <>
            <button
              onClick={() => setAbaSelecionada('formulario')}
              className={`px-4 py-2 rounded-t-lg transition-colors ${
                abaSelecionada === 'formulario'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <LucideIcons.FileText className="inline mr-2 h-4 w-4" />
              {modoEdicao ? 'Editar Perfil' : 'Novo Perfil'}
            </button>
            
            {perfilSelecionado && (
              <button
                onClick={() => setAbaSelecionada('permissoes')}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  abaSelecionada === 'permissoes'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <LucideIcons.Shield className="inline mr-2 h-4 w-4" />
                Permissões
              </button>
            )}
          </>
        )}
      </div>

      {/* Conteúdo das abas */}
      {abaSelecionada === 'listagem' && (
        <ListagemPerfis
          onEditarPerfil={handleEditarPerfil}
          onGerenciarPermissoes={handleGerenciarPermissoes}
        />
      )}

      {abaSelecionada === 'formulario' && (
        <FormularioPerfil
          perfilInicial={perfilSelecionado}
          modoEdicao={modoEdicao}
          telasDisponiveis={telasDisponiveis}
          carregandoTelas={carregandoTelas}
          onPerfilSalvo={handlePerfilSalvo}
          onCancelar={handleVoltarListagem}
        />
      )}

      {abaSelecionada === 'permissoes' && perfilSelecionado && (
        <GerenciadorPermissoes
          perfil={perfilSelecionado}
          telasDisponiveis={telasDisponiveis}
          carregandoTelas={carregandoTelas}
          onPermissoesAtualizadas={handlePermissoesAtualizadas}
          onCancelar={handleVoltarListagem}
        />
      )}
    </div>
  );
}