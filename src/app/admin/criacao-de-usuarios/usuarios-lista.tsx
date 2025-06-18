'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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

interface UsuariosListaProps {
  usuarios: Usuario[];
  setores: Setor[];
  carregando: boolean;
  erro: string | null;
  onNovoUsuario: () => void;
  onEditarUsuario: (usuario: Usuario) => void;
  onAlterarStatus: (usuarioId: string, novoStatus: 'ativo' | 'inativo') => Promise<void>;
  onRecarregar: () => void;
}

export default function UsuariosLista({
  usuarios,
  setores,
  carregando,
  erro,
  onNovoUsuario,
  onEditarUsuario,
  onAlterarStatus,
  onRecarregar
}: UsuariosListaProps) {
  // Estados de filtros e busca
  const [filtros, setFiltros] = useState({
    termo: '',
    status: 'todos',
    setor: 'todos'
  });
  
  // Estados de paginação
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina] = useState(10);
  
  // Estados de controle
  const [modalConfirmacao, setModalConfirmacao] = useState<{
    show: boolean;
    usuario?: Usuario;
    acao?: 'ativar' | 'desativar';
  }>({ show: false });
  const [alterandoStatus, setAlterandoStatus] = useState<string | null>(null);
  
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Funções utilitárias
  const gerarIniciaisNome = useCallback((nome: string | undefined): string => {
    if (!nome) return '??';
    
    try {
      const partesNome = nome.trim().split(' ').filter(parte => parte.length > 0);
      
      if (partesNome.length === 0) return '??';
      if (partesNome.length === 1) {
        return partesNome[0].substring(0, 2).toUpperCase();
      }
      
      const primeiraLetra = partesNome[0][0] || '?';
      const ultimaLetra = partesNome[partesNome.length - 1][0] || '?';
      
      return (primeiraLetra + ultimaLetra).toUpperCase();
    } catch (error) {
      console.error('Erro ao gerar iniciais:', error);
      return '??';
    }
  }, []);

  const formatarData = useCallback((dataString: string | undefined): string => {
    if (!dataString) return 'N/A';
    
    try {
      const data = new Date(dataString);
      
      if (isNaN(data.getTime())) {
        return 'Data inválida';
      }
      
      return data.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Erro de formato';
    }
  }, []);

  const formatarTelefone = useCallback((telefone: string | undefined): string => {
    if (!telefone) return 'N/A';
    
    try {
      // Remove tudo que não é número
      const apenasNumeros = telefone.replace(/\D/g, '');
      
      if (apenasNumeros.length === 0) return 'Telefone inválido';
      
      // Formatação para telefone brasileiro com DDI
      if (apenasNumeros.length === 13 && apenasNumeros.startsWith('55')) {
        const ddd = apenasNumeros.slice(2, 4);
        const numero = apenasNumeros.slice(4);
        if (numero.length === 9) {
          return `+55 ${ddd} ${numero.slice(0, 5)}-${numero.slice(5)}`;
        } else if (numero.length === 8) {
          return `+55 ${ddd} ${numero.slice(0, 4)}-${numero.slice(4)}`;
        }
      }
      
      return telefone;
    } catch (error) {
      console.error('Erro ao formatar telefone:', error);
      return telefone || 'Erro de formato';
    }
  }, []);

  // Filtrar e paginar usuários
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usuario => {
      const matchTermo = !filtros.termo || 
        usuario.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        usuario.email.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        usuario.cargo.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        usuario.id.includes(filtros.termo);
      
      const matchStatus = filtros.status === 'todos' || usuario.status === filtros.status;
      const matchSetor = filtros.setor === 'todos' || usuario.setor === filtros.setor;
      
      return matchTermo && matchStatus && matchSetor;
    });
  }, [usuarios, filtros]);

  const totalItens = usuariosFiltrados.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  const indiceInicial = (pagina - 1) * itensPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indiceInicial, indiceInicial + itensPorPagina);

  const filtrosAplicados = useMemo(() => {
    return filtros.termo !== '' || 
           filtros.status !== 'todos' || 
           filtros.setor !== 'todos';
  }, [filtros]);

  // Handlers
  const handleFiltroChange = useCallback((campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPagina(1);
  }, []);

  const handleLimparFiltros = useCallback(() => {
    setFiltros({
      termo: '',
      status: 'todos',
      setor: 'todos'
    });
    setPagina(1);
  }, []);

  const handlePaginaChange = useCallback((novaPagina: number) => {
    setPagina(Math.max(1, Math.min(novaPagina, totalPaginas)));
  }, [totalPaginas]);

  const handleSolicitarAlteracaoStatus = useCallback((usuario: Usuario) => {
    const acao = usuario.status === 'ativo' ? 'desativar' : 'ativar';
    setModalConfirmacao({ show: true, usuario, acao });
  }, []);

  const handleConfirmarAlteracaoStatus = useCallback(async () => {
    if (!modalConfirmacao.usuario || !modalConfirmacao.acao) return;
    
    const { usuario, acao } = modalConfirmacao;
    const novoStatus = acao === 'ativar' ? 'ativo' : 'inativo';
    
    setAlterandoStatus(usuario.id);
    
    try {
      await onAlterarStatus(usuario.id, novoStatus);
      setModalConfirmacao({ show: false });
    } catch (error) {
      // Erro já tratado pelo componente pai
    } finally {
      if (montadoRef.current) {
        setAlterandoStatus(null);
      }
    }
  }, [modalConfirmacao, onAlterarStatus]);

  const handleCancelarAlteracao = useCallback(() => {
    setModalConfirmacao({ show: false });
  }, []);

  // Renderização de estados
  if (carregando) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="ml-4 text-gray-500">Carregando usuários...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erro ao carregar usuários</h3>
        <p className="text-gray-700 mb-4">{erro}</p>
        <Button onClick={onRecarregar}>
          <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="relative flex-1">
              <LucideIcons.Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, nome, email ou cargo..."
                value={filtros.termo}
                onChange={e => handleFiltroChange('termo', e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Filtro Status */}
            <Select
              value={filtros.status}
              onValueChange={valor => handleFiltroChange('status', valor)}
            >
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Filtro Setor */}
            <Select
              value={filtros.setor}
              onValueChange={valor => handleFiltroChange('setor', valor)}
            >
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Setores</SelectItem>
                {setores.map(setor => (
                  <SelectItem key={setor.id} value={setor.nome}>
                    {setor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Ações */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleLimparFiltros}
                disabled={!filtrosAplicados}
              >
                <LucideIcons.RotateCcw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              
              <Button onClick={onNovoUsuario}>
                <LucideIcons.Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      {usuariosFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <LucideIcons.Users className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">
            {filtrosAplicados ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {filtrosAplicados 
              ? 'Nenhum usuário corresponde aos filtros aplicados. Tente ajustar os critérios de busca.'
              : 'Não existem usuários cadastrados no momento. Adicione o primeiro usuário para começar.'
            }
          </p>
          
          {filtrosAplicados ? (
            <Button onClick={handleLimparFiltros} variant="outline">
              <LucideIcons.RotateCcw className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          ) : (
            <Button onClick={onNovoUsuario}>
              <LucideIcons.Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Usuário
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {usuariosPaginados.map(usuario => (
            <Card key={usuario.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={usuario.foto} alt={usuario.nome} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {gerarIniciaisNome(usuario.nome)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Informações principais */}
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{usuario.nome}</h3>
                        
                        {/* Badge de Status */}
                        <Badge variant={usuario.status === 'ativo' ? 'default' : 'destructive'}>
                          {usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        
                        {/* Badge de Nível de Acesso */}
                        {usuario.nivel_acesso ? (
                          <Badge variant="outline">
                            {usuario.nivel_acesso}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            <LucideIcons.AlertCircle className="h-3 w-3 mr-1" />
                            Sem Acesso
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1">
                        <p>{usuario.cargo} • {usuario.setor}</p>
                        <p>{usuario.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações secundárias e ações */}
                  <div className="flex items-center space-x-6">
                    {/* Informações adicionais */}
                    <div className="text-sm text-gray-500 text-right">
                      <p>Tel: {formatarTelefone(usuario.telefone)}</p>
                      <p>ID: {usuario.id}</p>
                      {usuario.data_contratacao && (
                        <p>Contratação: {formatarData(usuario.data_contratacao)}</p>
                      )}
                    </div>
                    
                    {/* Ações */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditarUsuario(usuario)}
                      >
                        <LucideIcons.Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant={usuario.status === 'ativo' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleSolicitarAlteracaoStatus(usuario)}
                        disabled={alterandoStatus === usuario.id}
                      >
                        {alterandoStatus === usuario.id ? (
                          <LucideIcons.Loader2 className="h-4 w-4 animate-spin" />
                        ) : usuario.status === 'ativo' ? (
                          <LucideIcons.UserX className="h-4 w-4" />
                        ) : (
                          <LucideIcons.UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {usuariosFiltrados.length > 0 && totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {indiceInicial + 1} a {Math.min(indiceInicial + itensPorPagina, totalItens)} de {totalItens} usuários
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

      {/* Modal de Confirmação */}
      <Dialog open={modalConfirmacao.show} onOpenChange={(open) => !open && handleCancelarAlteracao()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalConfirmacao.acao === 'ativar' ? 'Ativar' : 'Desativar'} Usuário
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Tem certeza que deseja{' '}
              <strong>
                {modalConfirmacao.acao === 'ativar' ? 'ativar' : 'desativar'}
              </strong>{' '}
              o usuário <strong>{modalConfirmacao.usuario?.nome}</strong>?
            </p>
            
            {modalConfirmacao.acao === 'desativar' && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700">
                  <LucideIcons.AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Atenção:</span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  O login do usuário será bloqueado automaticamente e ele não conseguirá acessar o sistema.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelarAlteracao}
              disabled={alterandoStatus !== null}
            >
              Cancelar
            </Button>
            <Button
              variant={modalConfirmacao.acao === 'ativar' ? 'default' : 'destructive'}
              onClick={handleConfirmarAlteracaoStatus}
              disabled={alterandoStatus !== null}
            >
              {alterandoStatus !== null ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                `${modalConfirmacao.acao === 'ativar' ? 'Ativar' : 'Desativar'} Usuário`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}