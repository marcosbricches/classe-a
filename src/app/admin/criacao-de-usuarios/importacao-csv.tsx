'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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

interface ImportacaoCSVProps {
  usuarios: Usuario[];
  setores: Setor[];
  cargos: Cargo[];
  niveisAcesso: NivelAcesso[];
  onImportacaoSucesso: (usuariosImportados: Usuario[]) => void;
}

interface UsuarioCSV {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  setor: string;
  status: string;
  nivel_acesso?: string;
  data_nascimento?: string;
  data_contratacao?: string;
  salario_base?: string;
}

interface ResultadoValidacao {
  validos: UsuarioCSV[];
  invalidos: { linha: number; dados: UsuarioCSV; erros: string[] }[];
}

export default function ImportacaoCSV({
  usuarios,
  setores,
  cargos,
  niveisAcesso,
  onImportacaoSucesso
}: ImportacaoCSVProps) {
  // Estados principais
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [dadosCSV, setDadosCSV] = useState<UsuarioCSV[]>([]);
  const [resultadoValidacao, setResultadoValidacao] = useState<ResultadoValidacao | null>(null);
  const [etapa, setEtapa] = useState<'upload' | 'validacao' | 'preview' | 'processando' | 'concluido'>('upload');
  
  const montadoRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  // Gerar CSV template
  const gerarTemplateCSV = useCallback(() => {
    const cabecalho = [
      'nome',
      'email', 
      'telefone',
      'cargo',
      'setor',
      'status',
      'nivel_acesso',
      'data_nascimento',
      'data_contratacao',
      'salario_base'
    ].join(',');
    
    // Adicionar dados existentes
    const linhas = usuarios.map(usuario => [
      `"${usuario.nome}"`,
      `"${usuario.email}"`,
      `"${usuario.telefone}"`,
      `"${usuario.cargo}"`,
      `"${usuario.setor}"`,
      `"${usuario.status}"`,
      `"${usuario.nivel_acesso || ''}"`,
      `"${usuario.data_nascimento || ''}"`,
      `"${usuario.data_contratacao || ''}"`,
      `"${usuario.salario_base || ''}"`
    ].join(','));
    
    // Adicionar algumas linhas em branco para novos usuários
    for (let i = 0; i < 5; i++) {
      linhas.push('""'.repeat(10).split('').join(','));
    }
    
    const csvContent = [cabecalho, ...linhas].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'template_usuarios.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    toast.success('Template CSV baixado com sucesso');
  }, [usuarios]);

  // Processar arquivo CSV
  const processarArquivoCSV = useCallback(async (file: File): Promise<UsuarioCSV[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const linhas = text.split('\n').filter(linha => linha.trim());
          
          if (linhas.length < 2) {
            throw new Error('Arquivo CSV inválido');
          }
          const cabecalho = linhas[0].split(',').map(col => col.replace(/"/g, '').trim());
          const dadosLinhas = linhas.slice(1);
          
          const dados: UsuarioCSV[] = [];
          
          dadosLinhas.forEach((linha, indice) => {
            const valores = linha.split(',').map(val => val.replace(/"/g, '').trim());
            
            if (valores.some(val => val)) { // Pular linhas completamente vazias
              const usuario: UsuarioCSV = {
                nome: valores[0] || '',
                email: valores[1] || '',
                telefone: valores[2] || '',
                cargo: valores[3] || '',
                setor: valores[4] || '',
                status: valores[5] || 'ativo',
                nivel_acesso: valores[6] || '',
                data_nascimento: valores[7] || '',
                data_contratacao: valores[8] || '',
                salario_base: valores[9] || ''
              };
              
              dados.push(usuario);
            }
          });
          
          resolve(dados);
        } catch (error) {
          reject(new Error('Erro ao processar arquivo CSV'));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }, []);

  // Validar dados CSV
  const validarDadosCSV = useCallback((dados: UsuarioCSV[]): ResultadoValidacao => {
    const validos: UsuarioCSV[] = [];
    const invalidos: { linha: number; dados: UsuarioCSV; erros: string[] }[] = [];
    
    dados.forEach((usuario, indice) => {
      const erros: string[] = [];
      
      // Validações obrigatórias
      if (!usuario.nome.trim()) {
        erros.push('Nome é obrigatório');
      } else if (usuario.nome.trim().length < 3) {
        erros.push('Nome deve ter ao menos 3 caracteres');
      }
      
      if (!usuario.email.trim()) {
        erros.push('Email é obrigatório');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.email)) {
        erros.push('Email inválido');
      } else {
        // Verificar duplicidade no CSV
        const duplicadoCSV = dados.find((u, i) => i !== indice && u.email === usuario.email);
        if (duplicadoCSV) {
          erros.push('Email duplicado no arquivo');
        }
        
        // Verificar se já existe no sistema (exceto se for atualização)
        const existeNoSistema = usuarios.find(u => u.email === usuario.email);
        if (existeNoSistema) {
          // Permitir atualização se for o mesmo usuário
          console.log(`Email ${usuario.email} já existe - será atualizado`);
        }
      }
      
      if (!usuario.telefone.trim()) {
        erros.push('Telefone é obrigatório');
      } else {
        const apenasNumeros = usuario.telefone.replace(/\D/g, '');
        if (apenasNumeros.length < 10 || apenasNumeros.length > 13) {
          erros.push('Telefone deve ter entre 10 e 13 dígitos');
        }
      }
      
      if (!usuario.cargo.trim()) {
        erros.push('Cargo é obrigatório');
      } else {
        // Verificar se cargo existe
        const cargoExiste = cargos.some(c => c.nome === usuario.cargo);
        if (!cargoExiste) {
          erros.push(`Cargo "${usuario.cargo}" não encontrado`);
        }
      }
      
      if (!usuario.setor.trim()) {
        erros.push('Setor é obrigatório');
      } else {
        // Verificar se setor existe
        const setorExiste = setores.some(s => s.nome === usuario.setor);
        if (!setorExiste) {
          erros.push(`Setor "${usuario.setor}" não encontrado`);
        }
      }
      
      // Validar status
      if (usuario.status && !['ativo', 'inativo'].includes(usuario.status)) {
        erros.push('Status deve ser "ativo" ou "inativo"');
      }
      
      // Validar nível de acesso se informado
      if (usuario.nivel_acesso) {
        const nivelExiste = niveisAcesso.some(n => n.nome === usuario.nivel_acesso);
        if (!nivelExiste) {
          erros.push(`Nível de acesso "${usuario.nivel_acesso}" não encontrado`);
        }
      }
      
      // Validar datas se informadas
      if (usuario.data_nascimento) {
        const dataNasc = new Date(usuario.data_nascimento);
        if (isNaN(dataNasc.getTime())) {
          erros.push('Data de nascimento inválida');
        }
      }
      
      if (usuario.data_contratacao) {
        const dataContrat = new Date(usuario.data_contratacao);
        if (isNaN(dataContrat.getTime())) {
          erros.push('Data de contratação inválida');
        }
      }
      
      // Validar salário se informado
      if (usuario.salario_base) {
        const salario = parseFloat(usuario.salario_base);
        if (isNaN(salario) || salario < 0) {
          erros.push('Salário deve ser um número válido');
        }
      }
      
      if (erros.length > 0) {
        invalidos.push({ linha: indice + 2, dados: usuario, erros }); // +2 porque linha 1 é cabeçalho
      } else {
        validos.push(usuario);
      }
    });
    
    return { validos, invalidos };
  }, [usuarios, setores, cargos, niveisAcesso]);

  // Handler de upload
  const handleArquivoSelecionado = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }
    
    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo permitido: 5MB');
      return;
    }
    
    setArquivo(file);
    setProcessando(true);
    setProgresso(10);
    setEtapa('validacao');
    
    try {
      const dados = await processarArquivoCSV(file);
      setProgresso(50);
      
      if (dados.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }
      
      setDadosCSV(dados);
      setProgresso(75);
      
      const resultado = validarDadosCSV(dados);
      setResultadoValidacao(resultado);
      setProgresso(100);
      
      setEtapa('preview');
      
      toast.success(`Arquivo processado: ${resultado.validos.length} válidos, ${resultado.invalidos.length} com erro`);
      
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      const mensagem = error instanceof Error ? error.message : 'Erro ao processar arquivo';
      toast.error(mensagem);
      setEtapa('upload');
      setArquivo(null);
    } finally {
      setProcessando(false);
    }
  }, [processarArquivoCSV, validarDadosCSV]);

  // Processar importação
  const handleProcessarImportacao = useCallback(async () => {
    if (!resultadoValidacao || resultadoValidacao.validos.length === 0) {
      toast.error('Nenhum usuário válido para importar');
      return;
    }
    
    setEtapa('processando');
    setProcessando(true);
    setProgresso(0);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setProcessando(false);
        toast.error('Tempo de processamento excedido. Tente novamente.');
        setEtapa('preview');
      }
    }, 30000); // 30 segundos para importação
    
    try {
      const usuariosParaImportar: Usuario[] = [];
      
      for (let i = 0; i < resultadoValidacao.validos.length; i++) {
        const usuarioCSV = resultadoValidacao.validos[i];
        
        // Simular processamento
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const novoUsuario: Usuario = {
          id: Date.now().toString() + i,
          nome: usuarioCSV.nome.trim(),
          email: usuarioCSV.email.trim().toLowerCase(),
          telefone: usuarioCSV.telefone,
          cargo: usuarioCSV.cargo,
          setor: usuarioCSV.setor,
          status: (usuarioCSV.status as 'ativo' | 'inativo') || 'ativo',
          nivel_acesso: usuarioCSV.nivel_acesso || undefined,
          data_nascimento: usuarioCSV.data_nascimento || undefined,
          data_contratacao: usuarioCSV.data_contratacao || undefined,
          salario_base: usuarioCSV.salario_base ? parseFloat(usuarioCSV.salario_base) : undefined,
          beneficios: [],
          historico_profissional: []
        };
        
        usuariosParaImportar.push(novoUsuario);
        
        const percentual = Math.round(((i + 1) / resultadoValidacao.validos.length) * 100);
        setProgresso(percentual);
      }
      
      if (montadoRef.current) {
        onImportacaoSucesso(usuariosParaImportar);
        setEtapa('concluido');
        
        setTimeout(() => {
          if (montadoRef.current) {
            handleReiniciar();
          }
        }, 3000);
      }
      
    } catch (error) {
      console.error('Erro ao importar usuários:', error);
      if (montadoRef.current) {
        toast.error('Erro ao importar usuários. Tente novamente.');
        setEtapa('preview');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setProcessando(false);
      }
    }
  }, [resultadoValidacao, onImportacaoSucesso]);

  // Reiniciar processo
  const handleReiniciar = useCallback(() => {
    setArquivo(null);
    setDadosCSV([]);
    setResultadoValidacao(null);
    setProgresso(0);
    setEtapa('upload');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Estatísticas
  const estatisticas = useMemo(() => {
    if (!resultadoValidacao) return null;
    
    return {
      total: dadosCSV.length,
      validos: resultadoValidacao.validos.length,
      invalidos: resultadoValidacao.invalidos.length,
      percentualValidos: Math.round((resultadoValidacao.validos.length / dadosCSV.length) * 100)
    };
  }, [dadosCSV, resultadoValidacao]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho com instruções */}
      <Alert>
        <LucideIcons.Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Como usar:</strong> Baixe o template CSV, edite com os dados dos usuários e faça o upload. 
          O template já contém os usuários existentes para facilitar a atualização.
        </AlertDescription>
      </Alert>

      {/* Botão para baixar template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LucideIcons.Download className="h-5 w-5" />
            Template CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Baixe o modelo de arquivo CSV com os usuários atuais e campos necessários.
              </p>
              <p className="text-xs text-gray-500">
                Formatos suportados: .csv (máximo 5MB)
              </p>
            </div>
            <Button onClick={gerarTemplateCSV} variant="outline">
              <LucideIcons.Download className="mr-2 h-4 w-4" />
              Baixar Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload de arquivo */}
      {etapa === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LucideIcons.Upload className="h-5 w-5" />
              Upload do Arquivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <LucideIcons.FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecione seu arquivo CSV</h3>
              <p className="text-gray-500 mb-6">
                Arraste e solte ou clique para selecionar o arquivo editado
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleArquivoSelecionado}
                className="hidden"
              />
              
              <Button onClick={() => fileInputRef.current?.click()}>
                <LucideIcons.Upload className="mr-2 h-4 w-4" />
                Selecionar Arquivo CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validação em progresso */}
      {(etapa === 'validacao' || etapa === 'processando') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LucideIcons.Loader2 className="h-5 w-5 animate-spin" />
              {etapa === 'validacao' ? 'Validando Dados' : 'Processando Importação'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progresso} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                {etapa === 'validacao' 
                  ? `Validando dados do arquivo: ${arquivo?.name}`
                  : `Importando ${resultadoValidacao?.validos.length} usuários válidos...`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview dos resultados */}
      {etapa === 'preview' && resultadoValidacao && estatisticas && (
        <div className="space-y-6">
          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LucideIcons.BarChart3 className="h-5 w-5" />
                Resultado da Validação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{estatisticas.total}</p>
                  <p className="text-sm text-blue-700">Total de Linhas</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{estatisticas.validos}</p>
                  <p className="text-sm text-green-700">Usuários Válidos</p>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{estatisticas.invalidos}</p>
                  <p className="text-sm text-red-700">Com Erros</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{estatisticas.percentualValidos}%</p>
                  <p className="text-sm text-gray-700">Taxa de Sucesso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usuários válidos */}
          {resultadoValidacao.validos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <LucideIcons.CheckCircle className="h-5 w-5 text-green-600" />
                    Usuários Válidos ({resultadoValidacao.validos.length})
                  </span>
                  <Badge variant="default">Prontos para importar</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {resultadoValidacao.validos.slice(0, 10).map((usuario, indice) => (
                    <div key={indice} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">{usuario.nome}</p>
                        <p className="text-sm text-gray-600">{usuario.email} • {usuario.cargo}</p>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-700">
                        Válido
                      </Badge>
                    </div>
                  ))}
                  
                  {resultadoValidacao.validos.length > 10 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      E mais {resultadoValidacao.validos.length - 10} usuários válidos...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usuários com erro */}
          {resultadoValidacao.invalidos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucideIcons.AlertTriangle className="h-5 w-5 text-red-600" />
                  Usuários com Erros ({resultadoValidacao.invalidos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto space-y-3">
                  {resultadoValidacao.invalidos.map((item, indice) => (
                    <div key={indice} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">Linha {item.linha}</p>
                          <p className="text-sm text-gray-600">
                            {item.dados.nome || 'Nome não informado'} • {item.dados.email || 'Email não informado'}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {item.erros.length} erro{item.erros.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        {item.erros.map((erro, errIndice) => (
                          <p key={errIndice} className="text-sm text-red-600 flex items-center gap-1">
                            <LucideIcons.X className="h-3 w-3" />
                            {erro}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReiniciar}>
              <LucideIcons.RotateCcw className="mr-2 h-4 w-4" />
              Recomeçar
            </Button>
            
            <div className="flex gap-2">
              {resultadoValidacao.invalidos.length > 0 && (
                <Button variant="outline" onClick={() => toast.info('Corrija os erros no arquivo e tente novamente')}>
                  <LucideIcons.Download className="mr-2 h-4 w-4" />
                  Exportar Erros
                </Button>
              )}
              
              <Button 
                onClick={handleProcessarImportacao}
                disabled={resultadoValidacao.validos.length === 0}
              >
                <LucideIcons.Check className="mr-2 h-4 w-4" />
                Importar {resultadoValidacao.validos.length} Usuários
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Conclusão */}
      {etapa === 'concluido' && (
        <Card>
          <CardContent className="text-center py-12">
            <LucideIcons.CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Importação Concluída!</h3>
            <p className="text-gray-600 mb-6">
              {resultadoValidacao?.validos.length} usuários foram importados com sucesso.
            </p>
            <Button onClick={handleReiniciar}>
              <LucideIcons.Plus className="mr-2 h-4 w-4" />
              Nova Importação
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}