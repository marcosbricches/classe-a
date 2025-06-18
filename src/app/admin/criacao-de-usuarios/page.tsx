'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast, Toaster } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as LucideIcons from 'lucide-react'

import UsuariosLista from './usuarios-lista'
import UsuarioForm from './usuario-form'
import ImportacaoCSV from './importacao-csv'

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

export default function AdminUsuariosPage() {
  // Estados principais
  const [abaSelecionada, setAbaSelecionada] = useState<'lista' | 'importacao'>('lista');
  const [modalForm, setModalForm] = useState<{ show: boolean; usuario?: Usuario }>({ show: false });
  
  // Estados de dados
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [niveisAcesso, setNiveisAcesso] = useState<NivelAcesso[]>([]);
  
  // Estados de controle
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [carregandoImportacao, setCarregandoImportacao] = useState(false);
  const [erroLista, setErroLista] = useState<string | null>(null);
  
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    carregarDadosIniciais();
    
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // API Mock
  const apiMock = useMemo(() => ({
    listarUsuarios: async (): Promise<Usuario[]> => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return [
        {
          id: '1',
          nome: 'João Silva Santos',
          email: 'joao.silva@classea.com.br',
          telefone: '+55 21 99999-8888',
          cargo: 'Gerente Operacional',
          setor: 'Operações',
          status: 'ativo' as const,
          nivel_acesso: 'Gerente',
          data_nascimento: '1985-03-15',
          data_contratacao: '2020-01-10',
          salario_base: 8500,
          beneficios: [
            { nome: 'Vale Refeição', valor: 600 },
            { nome: 'Plano de Saúde', valor: 450 }
          ],
          historico_profissional: [
            {
              empresa: 'Localiza Rent a Car',
              cargo: 'Supervisor',
              periodo: '2018-2019',
              observacoes: 'Experiência em gestão de frota'
            }
          ]
        },
        {
          id: '2',
          nome: 'Maria Fernanda Costa',
          email: 'maria.costa@classea.com.br',
          telefone: '+55 11 98888-7777',
          cargo: 'Coordenadora Financeira',
          setor: 'Financeiro',
          status: 'ativo' as const,
          nivel_acesso: 'Coordenador',
          data_nascimento: '1990-07-22',
          data_contratacao: '2021-05-15',
          salario_base: 7200,
          beneficios: [
            { nome: 'Vale Refeição', valor: 600 }
          ],
          historico_profissional: []
        },
        {
          id: '3',
          nome: 'Carlos Eduardo Lima',
          email: 'carlos.lima@classea.com.br',
          telefone: '+55 21 97777-6666',
          cargo: 'Analista de Frota',
          setor: 'Operações',
          status: 'inativo' as const,
          data_nascimento: '1992-11-08',
          data_contratacao: '2022-03-01',
          salario_base: 4500,
          beneficios: [],
          historico_profissional: []
        }
      ];
    },

    listarSetores: async (): Promise<Setor[]> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        { id: '1', nome: 'Administração' },
        { id: '2', nome: 'Operações' },
        { id: '3', nome: 'Financeiro' },
        { id: '4', nome: 'Comercial' },
        { id: '5', nome: 'Tecnologia' }
      ];
    },

    listarCargos: async (): Promise<Cargo[]> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        { id: '1', nome: 'Diretor' },
        { id: '2', nome: 'Gerente Operacional' },
        { id: '3', nome: 'Coordenadora Financeira' },
        { id: '4', nome: 'Analista de Frota' },
        { id: '5', nome: 'Assistente Administrativo' },
        { id: '6', nome: 'Atendente' }
      ];
    },

    listarNiveisAcesso: async (): Promise<NivelAcesso[]> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
        { id: '1', nome: 'Administrador' },
        { id: '2', nome: 'Gerente' },
        { id: '3', nome: 'Coordenador' },
        { id: '4', nome: 'Operacional' },
        { id: '5', nome: 'Consulta' }
      ];
    },

    criarUsuario: async (dadosUsuario: Omit<Usuario, 'id'>): Promise<Usuario> => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular verificação de email duplicado
      const emailExiste = usuarios.some(u => u.email === dadosUsuario.email);
      if (emailExiste) {
        throw new Error('Email já cadastrado no sistema');
      }
      
      const novoUsuario: Usuario = {
        ...dadosUsuario,
        id: Date.now().toString()
      };
      
      return novoUsuario;
    },

    atualizarUsuario: async (id: string, dadosUsuario: Partial<Usuario>): Promise<Usuario> => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const usuarioAtual = usuarios.find(u => u.id === id);
      if (!usuarioAtual) {
        throw new Error('Usuário não encontrado');
      }
      
      // Verificar email duplicado apenas se mudou
      if (dadosUsuario.email && dadosUsuario.email !== usuarioAtual.email) {
        const emailExiste = usuarios.some(u => u.email === dadosUsuario.email && u.id !== id);
        if (emailExiste) {
          throw new Error('Email já cadastrado no sistema');
        }
      }
      
      const usuarioAtualizado: Usuario = {
        ...usuarioAtual,
        ...dadosUsuario
      };
      
      return usuarioAtualizado;
    },

    alterarStatusUsuario: async (id: string, novoStatus: 'ativo' | 'inativo'): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const usuario = usuarios.find(u => u.id === id);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
    }
  }), [usuarios]);

  // Carregar dados iniciais
  const carregarDadosIniciais = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoLista(true);
    setErroLista(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoLista(false);
        setErroLista('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 8000);
    
    try {
      const [usuariosData, setoresData, cargosData, niveisData] = await Promise.all([
        apiMock.listarUsuarios(),
        apiMock.listarSetores(),
        apiMock.listarCargos(),
        apiMock.listarNiveisAcesso()
      ]);
      
      if (montadoRef.current) {
        setUsuarios(usuariosData);
        setSetores(setoresData);
        setCargos(cargosData);
        setNiveisAcesso(niveisData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      if (montadoRef.current) {
        setErroLista('Falha ao carregar dados. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoLista(false);
      }
    }
  }, [apiMock]);

  // Handlers
  const handleMudarAba = useCallback((aba: 'lista' | 'importacao') => {
    setAbaSelecionada(aba);
    
    // Carregar dados da aba se necessário
    setTimeout(() => {
      if (montadoRef.current && aba === 'importacao' && !carregandoImportacao) {
        // Preparar dados para importação se necessário
      }
    }, 0);
  }, [carregandoImportacao]);

  const handleNovoUsuario = useCallback(() => {
    setModalForm({ show: true });
  }, []);

  const handleEditarUsuario = useCallback((usuario: Usuario) => {
    setModalForm({ show: true, usuario });
  }, []);

  const handleFecharModal = useCallback(() => {
    setModalForm({ show: false });
  }, []);

  const handleSalvarUsuario = useCallback(async (dadosUsuario: Omit<Usuario, 'id'>, isEdicao: boolean, usuarioId?: string) => {
    try {
      let usuarioSalvo: Usuario;
      
      if (isEdicao && usuarioId) {
        usuarioSalvo = await apiMock.atualizarUsuario(usuarioId, dadosUsuario);
        setUsuarios(prev => prev.map(u => u.id === usuarioId ? usuarioSalvo : u));
        toast.success('Usuário atualizado com sucesso');
      } else {
        usuarioSalvo = await apiMock.criarUsuario(dadosUsuario);
        setUsuarios(prev => [...prev, usuarioSalvo]);
        toast.success('Usuário criado com sucesso');
      }
      
      setModalForm({ show: false });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(mensagem);
      throw error; // Repassar para o formulário tratar
    }
  }, [apiMock]);

  const handleAlterarStatus = useCallback(async (usuarioId: string, novoStatus: 'ativo' | 'inativo') => {
    try {
      await apiMock.alterarStatusUsuario(usuarioId, novoStatus);
      
      setUsuarios(prev => prev.map(u => 
        u.id === usuarioId ? { ...u, status: novoStatus } : u
      ));
      
      const acao = novoStatus === 'ativo' ? 'ativado' : 'desativado';
      toast.success(`Usuário ${acao} com sucesso`);
      
      if (novoStatus === 'inativo') {
        toast.info('Login do usuário foi bloqueado automaticamente');
      }
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao alterar status';
      toast.error(mensagem);
    }
  }, [apiMock]);

  const handleImportacaoSucesso = useCallback((usuariosImportados: Usuario[]) => {
    setUsuarios(prev => {
      // Atualizar usuários existentes e adicionar novos
      const novosUsuarios = [...prev];
      
      usuariosImportados.forEach(importado => {
        const indiceExistente = novosUsuarios.findIndex(u => u.email === importado.email);
        if (indiceExistente >= 0) {
          novosUsuarios[indiceExistente] = importado;
        } else {
          novosUsuarios.push(importado);
        }
      });
      
      return novosUsuarios;
    });
    
    toast.success(`${usuariosImportados.length} usuários processados com sucesso`);
  }, []);

  // Estados para verificação
  const temDados = usuarios.length > 0;
  const temErro = erroLista !== null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Toaster position="bottom-right" />
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários internos, permissões e importações em lote
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LucideIcons.Users className="h-5 w-5" />
            Administração de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={abaSelecionada} onValueChange={(valor) => handleMudarAba(valor as 'lista' | 'importacao')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lista" className="flex items-center gap-2">
                <LucideIcons.List className="h-4 w-4" />
                Lista de Usuários
              </TabsTrigger>
              <TabsTrigger value="importacao" className="flex items-center gap-2">
                <LucideIcons.Upload className="h-4 w-4" />
                Importação CSV
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lista" className="mt-6">
              <UsuariosLista
                usuarios={usuarios}
                setores={setores}
                carregando={carregandoLista}
                erro={erroLista}
                onNovoUsuario={handleNovoUsuario}
                onEditarUsuario={handleEditarUsuario}
                onAlterarStatus={handleAlterarStatus}
                onRecarregar={carregarDadosIniciais}
              />
            </TabsContent>

            <TabsContent value="importacao" className="mt-6">
              <ImportacaoCSV
                usuarios={usuarios}
                setores={setores}
                cargos={cargos}
                niveisAcesso={niveisAcesso}
                onImportacaoSucesso={handleImportacaoSucesso}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      {modalForm.show && (
        <UsuarioForm
          usuario={modalForm.usuario}
          setores={setores}
          cargos={cargos}
          niveisAcesso={niveisAcesso}
          onSalvar={handleSalvarUsuario}
          onCancelar={handleFecharModal}
        />
      )}
    </div>
  );
}