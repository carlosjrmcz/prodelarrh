function readRuntimeEnv() {
  const runtimeEnv = window.PRODELAR_RH_ENV || window.__PRODELAR_RH_ENV__ || {};
  const viteEnv = (() => {
    try {
      return Function("return import.meta.env")() || {};
    } catch {
      return {};
    }
  })();
  return { ...viteEnv, ...runtimeEnv };
}

const runtimeEnv = readRuntimeEnv();
const SUPABASE_URL = runtimeEnv.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = runtimeEnv.VITE_SUPABASE_ANON_KEY || runtimeEnv.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_ANON_KEY;
const APP_VERSION = "20260609-supabase-runtime";

if (window.location.protocol === "file:") {
  window.location.replace(`http://127.0.0.1:5180/?r=${APP_VERSION}`);
}

function syncAppVersionUrl() {
  if (window.location.protocol === "file:") return;
  const url = new URL(window.location.href);
  if (url.searchParams.get("r") === APP_VERSION) return;
  url.searchParams.set("r", APP_VERSION);
  window.history.replaceState(null, "", url);
}

syncAppVersionUrl();

function getUrlPage() {
  if (window.location.protocol === "file:") return "";
  return new URL(window.location.href).searchParams.get("page") || "";
}

function pageHref(page) {
  if (page === "portal") return `?r=${APP_VERSION}`;
  return `?r=${APP_VERSION}&page=${encodeURIComponent(page)}`;
}

function updatePageUrl(page, replace = false) {
  if (window.location.protocol === "file:") return;
  const url = new URL(window.location.href);
  url.searchParams.set("r", APP_VERSION);
  if (page && page !== "portal") url.searchParams.set("page", page);
  else url.searchParams.delete("page");
  window.history[replace ? "replaceState" : "pushState"](null, "", url);
}

const supabaseClient =
  window.supabase && supabaseUrl && supabaseKey ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;
const emailQueue = window.createEmailQueue && supabaseClient ? window.createEmailQueue(supabaseClient) : null;
const googleWorkspaceConfig = window.googleWorkspaceConfig || {};
const workspaceStorage = window.createGoogleWorkspaceStorage
  ? window.createGoogleWorkspaceStorage({
      mode: googleWorkspaceConfig.mode || "test",
      edgeFunctionUrl: googleWorkspaceConfig.edgeFunctionUrl || "",
      anonKey: googleWorkspaceConfig.anonKey || supabaseKey,
      rootFolderId: googleWorkspaceConfig.rootFolderId || "",
      sharedDriveId: googleWorkspaceConfig.sharedDriveId || "",
    })
  : null;

const sampleEmployees = [
  {
    id: "EMP-000102",
    name: "Ariana da Costa Machado",
    company: "Colmob",
    department: "Administrativo",
    role: "Gerente de Projetos",
    manager: "Diretoria",
    status: "Ativo",
    admission: "12/12/2022",
    cpf: "00000000007",
    birthDate: "1990-01-01",
    vacation: "Pendente programação",
    timeBank: "OK",
  },
  {
    id: "EMP-000103",
    name: "Cleyciane da Costa Santos",
    company: "Colmob",
    department: "Administrativo",
    role: "Auxiliar Administrativo",
    manager: "Ariana Machado",
    status: "Ativo",
    admission: "01/07/2025",
    cpf: "00000000006",
    birthDate: "1990-01-01",
    vacation: "30 dias",
    timeBank: "09h58",
  },
  {
    id: "EMP-000219",
    name: "Anderson Kaue Lima da Silva",
    company: "Servimec",
    department: "CBTU VLT",
    role: "Auxiliar de Mecânica",
    manager: "Gerlan José da Silva",
    status: "Ativo",
    admission: "20/02/2026",
    cpf: "00000000008",
    birthDate: "1990-01-01",
    vacation: "30 dias",
    timeBank: "Termo pendente",
  },
  {
    id: "EMP-000034",
    name: "Leticia Maria de Oliveira",
    company: "Prodelar",
    department: "Projetos",
    role: "Projetista de Móveis",
    manager: "Coordenação Projetos",
    status: "Ativo",
    admission: "01/06/2019",
    cpf: "00000000009",
    birthDate: "1990-01-01",
    vacation: "01/04 a 15/04",
    timeBank: "OK",
  },
  {
    id: "EMP-000088",
    name: "Cesar Silva dos Santos",
    company: "Colmob",
    department: "Produção",
    role: "Marceneiro",
    manager: "Gerente de Produção",
    status: "Ativo",
    admission: "09/10/2024",
    cpf: "00000000010",
    birthDate: "1990-01-01",
    vacation: "30 dias",
    timeBank: "Compensar",
  },
];

const sampleRequests = [
  {
    protocol: "RH-2026-0001",
    type: "Admissão",
    title: "Admitir auxiliar de produção",
    employee: "Juliana Maria da Silva",
    owner: "RH",
    status: "Aberto",
    sla: "2 dias",
  },
  {
    protocol: "RH-2026-0002",
    type: "Demissão",
    title: "Desligamento com aviso indenizado",
    employee: "Lenilda Januário",
    owner: "Diretoria",
    status: "Aguardando aprovação",
    sla: "Hoje",
  },
  {
    protocol: "RH-2026-0003",
    type: "Férias",
    title: "Programação de férias",
    employee: "Jose Marcelo Lins",
    owner: "Gestor",
    status: "Em análise",
    sla: "4 dias",
  },
  {
    protocol: "RH-2026-0004",
    type: "Ponto",
    title: "Ajuste de ponto esquecido",
    employee: "Cleyciane Santos",
    owner: "Gestor",
    status: "Em execução",
    sla: "1 dia",
  },
  {
    protocol: "RH-2026-0005",
    type: "Documento",
    title: "Solicitação de contracheque",
    employee: "Anderson Kaue",
    owner: "RH",
    status: "Concluído",
    sla: "Finalizado",
  },
];

const sampleDocuments = [
  ["Contracheque Março/2026", "Colaborador", "Privado do colaborador"],
  ["Ficha de registro", "RH", "Restrito RH"],
  ["Previsão de férias", "Líder", "Visível ao líder"],
  ["Termo de banco de horas", "Colaborador", "Assinatura pendente"],
  ["Documentação rescisória", "RH/Jurídico", "Restrito"],
];

const sampleVacationRows = [
  ["Leticia Maria", "Prodelar", "01/06/2024 a 31/05/2025", "30/04/2026", "01/04/2026 a 15/04/2026", "15"],
  ["Jose Marcelo Lins", "Servimec", "01/07/2024 a 30/06/2025", "30/05/2026", "14/05/2026 a 02/06/2026", "30"],
  ["Rubian Carlos", "Colmob", "01/07/2024 a 30/06/2025", "30/05/2026", "Sem programação", "16"],
  ["Ariana Machado", "Colmob", "12/12/2024 a 11/12/2025", "10/11/2026", "Sem programação", "16"],
];

const companies = [
  { key: "Prodelar", code: "PRODELAR", label: "Prodelar", logoClass: "prodelar", logo: "./assets/logo-prodelar.jpg" },
  { key: "Colmob", code: "COLMOB", label: "Colmob", logoClass: "colmob", logo: "./assets/logo-colmob.jpg" },
  { key: "Servimec", code: "SERVIMEC", label: "Servimec", logoClass: "servimec", logo: "./assets/logo-servimec.jpg" },
];

const simulatedProfiles = {
  Colaborador: {
    name: "Cleyciane da Costa Santos",
    profile: "Colaborador",
    company: "Colmob",
    department: "Administrativo",
    scope: "self",
    homePage: "portal",
    description: "Solicita apenas assuntos próprios e acompanha o próprio portal.",
  },
  Supervisor: {
    name: "Luiz Felipe da Silva Rodrigues",
    profile: "Supervisor",
    company: "Prodelar",
    department: "Montagem",
    scope: "supervisor",
    homePage: "portal",
    description: "Abre solicitações da equipe e aprova a primeira camada.",
  },
  Gerente: {
    name: "Ariana da Costa Machado",
    profile: "Gerente",
    company: "Colmob",
    department: "Administrativo",
    scope: "manager",
    homePage: "portal",
    description: "Vê equipes sob supervisores e envia decisões para diretoria.",
  },
  RH: {
    name: "Ana Paula",
    profile: "RH",
    company: "Todas",
    department: "Recursos Humanos",
    scope: "hr",
    homePage: "portal",
    description: "Recebe, executa, confere rotinas e mantém bases do sistema.",
  },
  Diretoria: {
    name: "Carlos Junior",
    profile: "Diretoria",
    company: "Todas",
    department: "Diretoria",
    scope: "director",
    homePage: "portal",
    description: "Acompanha indicadores e decide aprovações finais.",
  },
};

const currentUser = {
  ...simulatedProfiles.RH,
};

const simulationSeedPeople = [
  { name: "Carlos Junior", profile: "Diretoria", company: "Todas", department: "Diretoria", role: "Diretor", cpf: "00000000001", birthDate: "1980-01-01" },
  { name: "Anderson Nascimento", profile: "Diretoria", company: "Todas", department: "Diretoria", role: "Diretor", cpf: "00000000002", birthDate: "1980-01-01" },
  { name: "Ana Paula", profile: "RH", company: "Todas", department: "Recursos Humanos", role: "RH", cpf: "00000000003", birthDate: "1990-01-01" },
  { name: "Ariana da Costa Machado", profile: "Colaborador", company: "Colmob", department: "Administrativo", role: "Gerente de projetos", cpf: "00000000007", birthDate: "1990-01-01" },
  {
    name: "Maria Andressa Lourenco do Nascimento",
    profile: "Gerente",
    company: "Prodelar",
    department: "Pós-venda",
    role: "Gerente de pós-venda e atendimento",
    alias: "Andreza",
    cpf: "00000000004",
    birthDate: "1990-01-01",
  },
  {
    name: "Luiz Felipe da Silva Rodrigues",
    profile: "Supervisor",
    company: "Prodelar",
    department: "Montagem",
    role: "Supervisor de montagem",
    cpf: "00000000005",
    birthDate: "1990-01-01",
  },
  { name: "Cleyciane da Costa Santos", profile: "Colaborador", company: "Colmob", department: "Administrativo", role: "Auxiliar Administrativo", cpf: "00000000006", birthDate: "1990-01-01" },
];

const employeeRequestTypes = [
  ["Atualização cadastral", "Atualizar endereço, telefone, e-mail, dados bancários ou documento pessoal."],
  ["Atestado / afastamento", "Enviar atestado ou comunicar afastamento para validação do RH."],
  ["Férias", "Consultar, sugerir período ou pedir informação sobre férias."],
  ["Benefício", "Solicitar, alterar ou cancelar benefício permitido."],
  ["Contracheque / pagamento", "Solicitar segunda via ou informar dúvida/divergência de pagamento."],
  ["Treinamento", "Enviar certificado ou regularizar treinamento pendente."],
  ["Dúvida ao RH", "Solicitação administrativa simples ao RH."],
];

const leaderRequestTypes = [
  ["Admissão", "Solicitar contratação para a equipe."],
  ["Demissão", "Solicitar desligamento com aprovação obrigatória."],
  ["Férias", "Programar ou validar férias da equipe."],
  ["Ponto", "Aprovar ajuste, banco de horas ou exceção de jornada."],
  ["Documento", "Pedir documento operacional da equipe."],
  ["Movimentação funcional", "Solicitar mudança de função, setor, salário ou líder."],
];

const peopleControlModules = [
  {
    key: "aso",
    title: "ASO",
    fullTitle: "ASO e medicina do trabalho",
    owner: "RH",
    status: "3 vencendo",
    sensitivity: "Restrito",
    receives: false,
    description: "Controle de vencimento e documento ocupacional. Sem prontuário médico.",
    formFields: [
      ["Colaborador", "employee"],
      ["Tipo de exame", "select:Admissional|Periódico|Mudança de função|Retorno ao trabalho|Demissional"],
      ["Data do exame", "date"],
      ["Validade", "date"],
      ["Documento", "file"],
    ],
    history: [["ASO periódico vencendo", "Alan Denis Pereira Silva", "Vence em 30 dias"]],
    executive: "Alertar apenas vencidos, críticos ou sem ASO válido.",
  },
  {
    key: "medical",
    title: "Atestado",
    fullTitle: "Atestados e afastamentos",
    owner: "RH",
    status: "2 em validação",
    sensitivity: "Sensível",
    receives: true,
    receivedRows: [
      ["Atestado recebido pelo RH", "Cleyciane da Costa Santos", "Aguardando validação do RH"],
      ["Atestado entregue ao líder", "Ana Beatriz da Silva Gomes", "Completar período e retorno"],
    ],
    description: "Upload, validação RH, dias afastados e retorno previsto.",
    formFields: [
      ["Colaborador", "employee"],
      ["Tipo", "select:Atestado médico|Afastamento|Retorno ao trabalho|INSS"],
      ["Início", "date"],
      ["Dias", "number"],
      ["Retorno previsto", "date"],
      ["Documento", "file"],
    ],
    history: [["Atestado validado", "Amara Maria da Conceição", "2 dias registrados"]],
    executive: "Ver volume, afastamentos longos e impacto operacional, sem detalhe médico.",
  },
  {
    key: "training",
    title: "Treinamento",
    fullTitle: "Treinamentos e certificações",
    owner: "RH",
    status: "5 pendentes",
    sensitivity: "Operacional",
    receives: true,
    receivedRows: [["Certificado enviado", "Erika Santos", "Aguardando conferência"]],
    description: "Registro de treinamento, certificado, validade e alerta.",
    formFields: [
      ["Colaborador", "employee"],
      ["Treinamento", "text:Ex.: NR-35, integração, reciclagem"],
      ["Obrigatoriedade", "select:Obrigatório|Facultativo|Reciclagem"],
      ["Realização", "date"],
      ["Validade", "date"],
      ["Certificado", "file"],
    ],
    history: [["Treinamento obrigatório pendente", "Equipe de produção", "Alerta programado"]],
    executive: "Ver pendências por empresa/setor e vencimentos relevantes.",
  },
  {
    key: "equipment",
    title: "EPI / Equipamento",
    fullTitle: "EPI e equipamentos",
    owner: "RH",
    status: "4 termos pendentes",
    sensitivity: "Operacional",
    receives: false,
    description: "Entrega, devolução, termo assinado e alerta no desligamento.",
    formFields: [
      ["Colaborador", "employee"],
      ["Item", "text:Ex.: capacete, uniforme, notebook"],
      ["Movimento", "select:Entrega|Troca|Devolução|Pendência"],
      ["Data", "date"],
      ["Termo", "file"],
    ],
    history: [["Termo de EPI pendente", "Produção Prodelar", "4 colaboradores"]],
    executive: "Ver pendências críticas e itens não devolvidos.",
  },
  {
    key: "experience",
    title: "Contrato de experiência",
    fullTitle: "Contratos de experiência 45/90 dias",
    owner: "RH",
    status: "7 a vencer",
    sensitivity: "Gestão",
    receives: false,
    description: "Cadastro, decisão e alerta dos vencimentos de contrato de experiência.",
    formFields: [
      ["Colaborador", "employee"],
      ["Modalidade", "select:45 dias|45 + 45 dias|90 dias|Outro"],
      ["Admissão", "date"],
      ["Fim previsto", "date"],
      ["Parecer", "select:Pendente|Prorrogar|Efetivar|Encerrar contrato"],
      ["Documento/parecer", "file"],
    ],
    history: [["Contrato de experiência a vencer", "Maria Eduarda", "Alerta para RH e liderança"]],
    executive: "Ver vencimentos próximos e decisões atrasadas.",
  },
  {
    key: "benefits",
    title: "Benefício",
    fullTitle: "Benefícios",
    owner: "RH",
    status: "3 solicitações",
    sensitivity: "Restrito RH",
    receives: true,
    receivedRows: [["Solicitação de benefício", "Bruna Sthefanny", "Aguardando análise"]],
    description: "Benefícios permitidos, adesões, alterações e acompanhamento.",
    formFields: [
      ["Colaborador", "employee"],
      ["Benefício", "select:Vale transporte|Vale alimentação|Plano de saúde|Plano odontológico|Seguro de vida|Outro"],
      ["Movimento", "select:Adesão|Alteração|Cancelamento|Pendência"],
      ["Vigência", "date"],
      ["Documento", "file"],
    ],
    history: [["Benefício atualizado", "Ariana da Costa Machado", "Plano registrado"]],
    executive: "Ver solicitações críticas e indicadores consolidados.",
  },
  {
    key: "communications",
    title: "Comunicado",
    fullTitle: "Mural e comunicados",
    owner: "RH",
    status: "1 comunicado ativo",
    sensitivity: "Comunicação",
    receives: false,
    description: "Publicação no app, envio por e-mail quando aplicável e leitura confirmada.",
    formFields: [
      ["Modelo", "select:Comunicado geral|Pagamento realizado|Novo colaborador|Desligamento|Campanha interna|Outro"],
      ["Público", "select:Grupo econômico|Empresa selecionada|Setor|Colaborador específico"],
      ["Canal", "select:App + E-mail|Somente App|Somente E-mail"],
      ["Título", "text:Assunto do comunicado"],
      ["Publicar em", "date"],
    ],
    history: [["Comunicado publicado", "Grupo econômico", "Leitura confirmada ativa"]],
    executive: "Ver alcance e comunicados corporativos.",
  },
  {
    key: "timeline",
    title: "Linha do tempo",
    fullTitle: "Linha do tempo do colaborador",
    owner: "RH",
    status: "Ativa",
    sensitivity: "Auditoria",
    receives: false,
    description: "Histórico completo de eventos relevantes do colaborador.",
    formFields: [["Colaborador", "employee"]],
    history: [["Evento registrado", "Todos os módulos", "Auditoria automática"]],
    executive: "Ver trilha resumida quando houver aprovação ou risco.",
  },
  {
    key: "other",
    title: "Outros controles",
    fullTitle: "Outros controles operacionais do RH",
    owner: "RH",
    status: "Registro livre",
    sensitivity: "Operacional",
    receives: false,
    description: "Lançamentos administrativos que ainda não têm módulo próprio.",
    formFields: [
      ["Colaborador", "employee"],
      ["Tipo de controle", "text:Ex.: advertência operacional, entrega pendente, observação administrativa"],
      ["Data", "date"],
      ["Status", "select:Pendente|Em acompanhamento|Regularizado|Arquivado"],
      ["Observação", "text:Descreva o que o RH precisa acompanhar"],
      ["Documento", "file"],
    ],
    history: [["Acompanhamento administrativo", "Equipe RH", "Registro livre disponível"]],
    executive: "Ver controles excepcionais e pendências sem módulo específico.",
  },
];

const executiveAlerts = [
  ["ASO vencido crítico", "2 colaboradores", "Saúde ocupacional"],
  ["Férias vencidas/próximas", "6 períodos", "DP/RH"],
  ["Afastamentos longos", "1 acompanhamento", "Operacional"],
  ["Experiência vencendo", "7 contratos", "Liderança"],
  ["Solicitações críticas", "1 pendência", "Diretoria"],
];

const requestLanes = ["Aberto", "Aguardando esclarecimento", "Em análise", "Aguardando aprovação", "Em execução", "Concluído", "Reprovado"];
const requestLaneHints = {
  Aberto: "Entrada criada e aguardando triagem",
  "Aguardando esclarecimento": "Solicitante precisa complementar",
  "Em análise": "Responsável atual conferindo dados",
  "Aguardando aprovação": "Supervisor, gerência ou diretoria decide",
  "Em execução": "RH/área responsável executando",
  Concluído: "Finalizado com histórico",
  Reprovado: "Encerrado sem execução",
};

const requestWorkflow = {
  Aberto: {
    owner: "Supervisor",
    next: "Gerência",
    advanceLabel: "Aprovar",
    nextStatus: "Em análise",
    nextOwner: "Gerência",
    nextNext: "Diretoria",
  },
  "Em análise": {
    owner: "Gerência",
    next: "Diretoria",
    advanceLabel: "Aprovar",
    nextStatus: "Aguardando aprovação",
    nextOwner: "Diretoria",
    nextNext: "RH",
  },
  "Aguardando aprovação": {
    owner: "Diretoria",
    next: "RH",
    advanceLabel: "Aprovar para execução",
    nextStatus: "Em execução",
    nextOwner: "RH",
    nextNext: "Conclusão",
  },
  "Em execução": {
    owner: "RH",
    next: "Conclusão",
    advanceLabel: "Concluir",
    nextStatus: "Concluído",
    nextOwner: "Finalizado",
    nextNext: "Arquivo",
  },
  "Aguardando esclarecimento": {
    owner: "Solicitante",
    next: "Responsável anterior",
    advanceLabel: "Responder esclarecimento",
    nextStatus: "Em análise",
    nextOwner: "Responsável anterior",
    nextNext: "Próxima aprovação",
  },
};

const state = {
  page: getUrlPage() || "portal",
  query: "",
  company: "Todas",
  activeProfile: "RH",
  simulatedPerson: "Ana Paula",
  requestCompany: "Prodelar",
  prefillRequestType: "",
  requestReturnPage: "requests",
  pageHistory: [],
  paystubScope: "team",
  paystubNameQuery: "",
  paystubMonth: "",
  paystubYear: "",
  pointScope: "team",
  vacationScope: "team",
  vacationScopeSource: "process",
  vacationStatusFilter: "all",
  vacationQuery: "",
  listLimits: {},
  hierarchyQuery: "",
  masterCreateType: "",
  masterEditKey: "",
  employeeStatusFilter: "Ativo",
  employeeEditId: "",
  selectedEmployeeId: "EMP-000102",
  detailTab: "ficha",
  formMessage: "",
  peopleControlActiveModule: "aso",
  peopleControlMessage: "",
  rhTaskMessage: "",
  rhTaskStatusFilter: "open",
  rhTaskTypeFilter: "all",
  rhTaskEditId: "",
  rhRoutineCompetence: "",
  rhRoutineHistoryOpen: false,
  vacationMessage: "",
  pointMessage: "",
  pointAdjustmentOpen: false,
  authMode: "login",
  authMessage: "",
  authSession: null,
  authChecked: false,
  authUser: null,
  authProfile: null,
  authResetQueue: [],
  authPendingEmployeeId: "",
  dataStatus: supabaseClient ? "Conectando ao Supabase..." : "Modo local",
};

let employees = sampleEmployees;
let requests = sampleRequests;
let documents = sampleDocuments;
let vacationRows = sampleVacationRows;
let vacationForecasts = [];
let registrationCards = [];
let paystubRecords = [];
let employeeTimelineEvents = [];
let vacationSearchDebounce = null;
let lightweightRenderTimer = null;
let renderMemo = {};
let lastRenderedHtml = "";
let runtimeIndexesDirty = true;
let runtimeDataSignature = "";
let employeeIndex = {
  byId: new Map(),
  byName: new Map(),
  byManager: new Map(),
};
let dataIndex = {
  employeesByCompany: new Map(),
  employeesByStatus: new Map(),
  requestsByCompany: new Map(),
  requestsByStatus: new Map(),
  vacationsByCompany: new Map(),
  vacationsByEmployee: new Map(),
  paystubsByEmployee: new Map(),
  paystubsByCompany: new Map(),
};

function rebuildEmployeeIndex() {
  prepareDerivedFields();
  const byId = new Map();
  const byName = new Map();
  const byManager = new Map();
  employees.forEach((employee) => {
    byId.set(employee.id, employee);
    if (employee.dbId) byId.set(employee.dbId, employee);
    byName.set(employee._nameKey, employee);
    const managerKey = employee._managerKey || "";
    if (!byManager.has(managerKey)) byManager.set(managerKey, []);
    byManager.get(managerKey).push(employee);
  });
  employeeIndex = { byId, byName, byManager };
}

function addToIndex(map, key, value) {
  const normalizedKey = normalizeText(key || "");
  if (!map.has(normalizedKey)) map.set(normalizedKey, []);
  map.get(normalizedKey).push(value);
}

function prepareDerivedFields() {
  employees.forEach((employee) => {
    employee._nameKey = normalizeText(employee.name);
    employee._companyKey = normalizeText(employee.company);
    employee._managerKey = normalizeText(employee.manager);
    employee._statusKey = normalizeText(employee.status);
    employee._search = normalizeText(`${employee.name} ${employee.company} ${employee.department} ${employee.role} ${employee.manager} ${employee.id}`);
  });
  requests.forEach((request) => {
    request._companyKey = normalizeText(request.company);
    request._statusKey = normalizeText(request.status);
    request._ownerKey = normalizeText(request.owner);
    request._employeeKey = normalizeText(request.employee);
    request._search = normalizeText(`${request.protocol} ${request.type} ${request.title} ${request.description} ${request.employee} ${request.owner} ${request.company}`);
  });
  vacationForecasts.forEach((row) => {
    const company = row.company_key || row.source_company || row.company || row.company_name;
    row._companyKey = normalizeText(company);
    row._employeeKey = normalizeText(row.employee_name);
    row._search = normalizeText(`${row.employee_name} ${row.employee_code} ${row.registration} ${company} ${row.department} ${row.position}`);
  });
  paystubRecords.forEach((record) => {
    record._companyKey = normalizeText(record.company_name);
    record._employeeKey = normalizeText(record.employee_name);
    record._search = normalizeText(`${record.employee_name} ${record.employee_code} ${record.company_name} ${record.department} ${record.position} ${record.competence_label}`);
  });
}

function rebuildDataIndex() {
  const employeesByCompany = new Map();
  const employeesByStatus = new Map();
  const requestsByCompany = new Map();
  const requestsByStatus = new Map();
  const vacationsByCompany = new Map();
  const vacationsByEmployee = new Map();
  const paystubsByEmployee = new Map();
  const paystubsByCompany = new Map();

  employees.forEach((employee) => {
    addToIndex(employeesByCompany, employee.company, employee);
    addToIndex(employeesByStatus, employee.status, employee);
  });
  requests.forEach((request) => {
    addToIndex(requestsByCompany, request.company, request);
    addToIndex(requestsByStatus, request.status, request);
  });
  vacationForecasts.forEach((row) => {
    addToIndex(vacationsByCompany, row.company_key || row.source_company || row.company || row.company_name, row);
    addToIndex(vacationsByEmployee, row.employee_name, row);
  });
  paystubRecords.forEach((record) => {
    addToIndex(paystubsByEmployee, record.employee_name, record);
    addToIndex(paystubsByCompany, record.company_name, record);
  });

  dataIndex = {
    employeesByCompany,
    employeesByStatus,
    requestsByCompany,
    requestsByStatus,
    vacationsByCompany,
    vacationsByEmployee,
    paystubsByEmployee,
    paystubsByCompany,
  };
}

function rebuildRuntimeIndexes() {
  rebuildEmployeeIndex();
  rebuildDataIndex();
  runtimeIndexesDirty = false;
}

function markRuntimeIndexesDirty() {
  runtimeIndexesDirty = true;
}

function ensureRuntimeIndexes() {
  if (runtimeIndexesDirty) rebuildRuntimeIndexes();
}

function memoValue(key, factory) {
  if (Object.prototype.hasOwnProperty.call(renderMemo, key)) return renderMemo[key];
  renderMemo[key] = factory();
  return renderMemo[key];
}

function indexedByCompany(map, selected, fallbackRows, companyGetter = (row) => row.company) {
  if (!selected || selected === "Todas") return fallbackRows;
  const direct = map.get(normalizeText(selected));
  if (direct) return direct;
  return fallbackRows.filter((row) => matchesCompanyFilter(companyGetter(row), selected));
}

function indexedByEmployee(map, employeeName, fallbackRows, nameGetter) {
  const direct = map.get(normalizeText(employeeName));
  if (direct) return direct;
  return fallbackRows.filter((row) => isSamePerson(nameGetter(row), employeeName));
}

function clearOldPointTestData() {
  const cleanupVersion = "20260520-point-adjustment-clean";
  if (localStorage.getItem("rhPointCleanupVersion") === cleanupVersion) return;
  localStorage.removeItem("rhPointAdjustments");
  localStorage.removeItem("rhMonthlyPointFlow");
  localStorage.setItem("rhPointCleanupVersion", cleanupVersion);
}

const pages = [
  {
    group: "Central",
    items: [
      ["portal", "◎", "Meu portal", ["Colaborador", "Supervisor", "Gerente", "RH", "Diretoria"]],
      ["dashboard", "▦", "Dashboard RH", ["Supervisor", "Gerente", "RH", "Diretoria"]],
      ["requests", "↻", "Solicitações", ["Colaborador", "Supervisor", "Gerente", "RH", "Diretoria"]],
    ],
  },
  {
    group: "Processos",
    items: [
      ["admission", "+", "Admissão", ["Supervisor", "Gerente", "RH", "Diretoria"]],
      ["termination", "×", "Demissão", ["Supervisor", "Gerente", "RH", "Diretoria"]],
      ["vacations", "◷", "Gestão de férias", ["Colaborador", "Supervisor", "Gerente", "RH", "Diretoria"]],
      ["time", "◴", "Ajuste no ponto", ["Colaborador", "Supervisor", "Gerente", "RH", "Diretoria"]],
      ["paystubs", "▤", "Contracheques da equipe", ["Gerente"]],
    ],
  },
  {
    group: "Bases, cadastros e rotinas",
    items: [
      ["peopleControls", "◇", "Controles RH", ["RH", "Diretoria"]],
      ["rhRoutines", "☑", "Rotinas / Importações RH", ["RH", "Diretoria"]],
      ["accounting", "⇪", "Pacote mensal", ["RH", "Diretoria"]],
      ["emails", "✉", "E-mails", ["RH", "Diretoria"]],
      ["masterData", "◎", "Empresas e setores", ["RH", "Diretoria"]],
      ["hierarchy", "⇄", "Hierarquia", ["RH", "Diretoria"]],
      ["employees", "☷", "Colaboradores", ["RH", "Diretoria"]],
      ["baseVacations", "◷", "Base de férias", ["RH", "Diretoria"]],
      ["documents", "▣", "Documentos", ["RH", "Diretoria"]],
    ],
  },
];

const titles = {
  dashboard: ["Dashboard RH", "Mesa de trabalho por perfil: pendências, decisões, rotinas e visão executiva."],
  employees: ["Colaboradores", "Base inicial ativa/inativa para consulta do RH e líderes."],
  employeeForm: ["Novo colaborador", "Cadastro inicial com fallback local enquanto RLS bloqueia gravação pública."],
  requests: ["Solicitações", "Pipeline de tickets entre colaborador, líder, RH e diretoria."],
  requestForm: ["Nova solicitação", "Abertura de ticket operacional para RH, liderança e diretoria."],
  documents: ["Documentos", "Biblioteca controlada por sensibilidade e perfil de acesso."],
  vacations: ["Gestão de férias", "Programação, aprovação e consulta de férias."],
  baseVacations: ["Base de férias", "Base completa de programação de férias para consulta e manutenção do RH."],
  employeeDetail: ["Detalhe do colaborador", "Ficha, documentos e processos em uma linha de rastreabilidade."],
  masterData: ["Cadastros", "Base por empresa de departamentos, cargos e hierarquia."],
  hierarchy: ["Hierarquia", "Vínculo de gestor direto por empresa para permissões, filas e aprovações."],
  admission: ["Admissão", "Requisição de novo colaborador com aprovação antes do RH executar."],
  termination: ["Demissão", "Requisição de desligamento com justificativa, aprovação e execução pelo RH."],
  time: ["Ajuste no ponto", "Ajustes da equipe e validação mensal do ponto antes da folha."],
  portal: ["Meu portal", "Painel do colaborador com solicitações, contracheques, férias e comunicados do RH."],
  rhRoutines: ["Rotinas / Importações RH", "Checklists e importações recorrentes por empresa para manter a base confiável."],
  peopleControls: ["Controles RH", "ASO, atestados, treinamentos, EPI, experiência, benefícios, mural e linha do tempo."],
  accounting: ["Pacote mensal", "Envio rastreável para contabilidade/Mastermaq por competência."],
  paystubs: ["Contracheques", "Processamento do PDF único em arquivos individuais por colaborador."],
  emails: ["Central de e-mails", "Fila transacional para notificações, aprovações, comunicados e portal."],
};

function statusPill(value) {
  const label = String(value ?? "");
  const key = label.toLowerCase();
  const klass =
    key.includes("inativo") || key.includes("desligado") || key.includes("reprovado")
      ? "danger"
      : key.includes("ativo") || key.includes("concluído") || key.includes("ok")
      ? "good"
      : key.includes("aguardando") || key.includes("pendente") || key.includes("compensar")
        ? "warn"
        : key.includes("restrito") || key.includes("bloqueado")
          ? "danger"
          : "info";
  return `<span class="pill ${klass}">${label}</span>`;
}

function companyLogo(company) {
  const item = companies.find((entry) => entry.key === company || entry.code === String(company).toUpperCase()) || companies[0];
  return `<span class="company-logo ${item.logoClass}"><img src="${item.logo}" alt="${item.label}" loading="lazy" decoding="async" /></span>`;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function matchesCompanyFilter(value, filter) {
  const selected = filter || "Todas";
  if (selected === "Todas") return true;
  const company = companies.find((item) => normalizeText(item.key) === normalizeText(selected) || normalizeText(item.code) === normalizeText(selected));
  const allowed = [selected, company?.key, company?.code, company?.label].filter(Boolean).map((item) => normalizeText(item));
  return allowed.includes(normalizeText(value));
}

const initialListLimits = {
  employees: 45,
  vacations: 45,
  baseVacations: 45,
  paystubs: 50,
};

function limitedRows(key, rows) {
  const baseLimit = initialListLimits[key] || 50;
  const limit = state.listLimits[key] || baseLimit;
  return {
    visibleRows: rows.slice(0, limit),
    hiddenCount: Math.max(0, rows.length - limit),
    limit,
  };
}

function showMoreButton(key, hiddenCount) {
  if (!hiddenCount) return "";
  const step = initialListLimits[key] || 50;
  return `<div class="table-footer">
    <button class="btn" data-show-more="${key}">Mostrar mais ${Math.min(step, hiddenCount)}</button>
    <span>${hiddenCount} item(ns) ainda ocultos para manter a tela rápida.</span>
  </div>`;
}

function resetListLimit(key) {
  delete state.listLimits[key];
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const runtimeCacheKey = "rhRuntimeDataCache:v2";
const runtimeCacheTtlMs = 30 * 60 * 1000;
let supabaseLoadInFlight = null;

function applyRuntimeDataCache(cache) {
  if (!cache || !Array.isArray(cache.employees)) return false;
  employees = cache.employees;
  requests = Array.isArray(cache.requests) ? cache.requests : [];
  documents = Array.isArray(cache.documents) ? cache.documents : [];
  vacationForecasts = Array.isArray(cache.vacationForecasts) ? cache.vacationForecasts : [];
  vacationRows = Array.isArray(cache.vacationRows) ? cache.vacationRows : [];
  registrationCards = Array.isArray(cache.registrationCards) ? cache.registrationCards : [];
  paystubRecords = Array.isArray(cache.paystubRecords) ? cache.paystubRecords : [];
  employeeTimelineEvents = Array.isArray(cache.employeeTimelineEvents) ? cache.employeeTimelineEvents : [];
  applySimulationHierarchy();
  rebuildRuntimeIndexes();
  updateRuntimeDataSignature();
  return true;
}

function hydrateRuntimeDataCache() {
  const cache = safeJsonParse(localStorage.getItem(runtimeCacheKey), null);
  const freshEnough = cache?.savedAt && Date.now() - new Date(cache.savedAt).getTime() < runtimeCacheTtlMs;
  if (!freshEnough || !applyRuntimeDataCache(cache)) return false;
  state.dataStatus = `Supabase cache: ${employees.length} colaboradores`;
  return true;
}

function saveRuntimeDataCache() {
  try {
    localStorage.setItem(
      runtimeCacheKey,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        employees,
        requests,
        documents,
        vacationForecasts,
        vacationRows,
        registrationCards,
        paystubRecords,
        employeeTimelineEvents,
      }),
    );
  } catch {
    // O cache local é apenas aceleração de tela; se falhar, o app segue com Supabase.
  }
}

function clearSampleDataForSupabaseBoot() {
  if (!supabaseClient) return;
  const cache = safeJsonParse(localStorage.getItem(runtimeCacheKey), null);
  const freshEnough = cache?.savedAt && Date.now() - new Date(cache.savedAt).getTime() < runtimeCacheTtlMs;
  if (freshEnough) return;
  employees = [];
  requests = [];
  documents = [];
  vacationForecasts = [];
  vacationRows = [];
  registrationCards = [];
  paystubRecords = [];
  employeeTimelineEvents = [];
  markRuntimeIndexesDirty();
  updateRuntimeDataSignature();
}

function runtimeDataPayloadSignature(payload = {}) {
  const employeeRows = payload.employees || employees;
  const requestRows = payload.requests || requests;
  const documentRows = payload.documents || documents;
  const vacationRowsForSignature = payload.vacationForecasts || vacationForecasts;
  const paystubRows = payload.paystubRecords || paystubRecords;
  const timelineRows = payload.employeeTimelineEvents || employeeTimelineEvents;
  const tailOf = (rows) => rows[rows.length - 1] || {};
  const counts = [employeeRows.length, requestRows.length, documentRows.length, vacationRowsForSignature.length, paystubRows.length, timelineRows.length];
  const markers = [
    tailOf(employeeRows).id || "",
    requestRows[0]?.protocol || requestRows[0]?.id || "",
    vacationRowsForSignature[0]?.id || vacationRowsForSignature[0]?.employee_name || "",
    paystubRows[0]?.id || paystubRows[0]?.file_name || "",
    timelineRows[0]?.id || timelineRows[0]?.title || "",
  ];
  return `${counts.join(":")}|${markers.map(normalizeText).join(":")}`;
}

function updateRuntimeDataSignature() {
  runtimeDataSignature = runtimeDataPayloadSignature();
}

function scheduleFreshDataLoad(delay = 0) {
  const load = () => {
    if (document.hidden) {
      const loadWhenVisible = () => {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", loadWhenVisible);
        loadSupabaseData();
      };
      document.addEventListener("visibilitychange", loadWhenVisible);
      return;
    }
    loadSupabaseData();
  };
  if (delay && "requestIdleCallback" in window) {
    window.requestIdleCallback(load, { timeout: delay });
  } else {
    window.setTimeout(load, delay);
  }
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function stableDigitsFromText(value, length = 11) {
  let hash = 0;
  const text = normalizeText(value || "RH");
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return String(hash).padStart(length, "0").slice(-length);
}

function employeeLoginCpf(employee) {
  const cpf = digitsOnly(employee?.cpf || employee?.document || employee?.taxId);
  if (cpf.length >= 6) return cpf.padStart(11, "0").slice(-11);
  const idDigits = digitsOnly(employee?.id || employee?.dbId);
  if (idDigits.length >= 6) return `9${idDigits.slice(-10).padStart(10, "0")}`;
  return `9${stableDigitsFromText(employee?.name, 10)}`;
}

function normalizeDateValue(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split("/");
    return `${year}-${month}-${day}`;
  }
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(4)}-${raw.slice(2, 4)}-${raw.slice(0, 2)}`;
  }
  return raw.slice(0, 10);
}

function formatBirthPassword(value) {
  const normalized = normalizeDateValue(value);
  const [year, month, day] = normalized.split("-");
  if (year && month && day) return `${day}${month}${year}`;
  return "01011990";
}

function simplePasswordHash(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `local-${(hash >>> 0).toString(16)}`;
}

function findEmployeeByCpf(cpf) {
  const normalized = digitsOnly(cpf).padStart(11, "0").slice(-11);
  const explicitMatch = employees.find((employee) => {
    const explicitCpf = digitsOnly(employee?.cpf || employee?.document || employee?.taxId);
    return explicitCpf.length >= 6 && explicitCpf.padStart(11, "0").slice(-11) === normalized;
  });
  if (explicitMatch) return explicitMatch;
  const seed = simulationSeedPeople.find((person) => {
    const seedCpf = digitsOnly(person.cpf);
    return seedCpf.length >= 6 && seedCpf.padStart(11, "0").slice(-11) === normalized;
  });
  if (seed) {
    const realEmployee = employeeIndex.byName.get(normalizeText(seed.name)) || employees.find((employee) => isSamePerson(employee.name, seed.name));
    return { ...(realEmployee || {}), ...seed, id: realEmployee?.id || seed.name, dbId: realEmployee?.dbId || null };
  }
  return employees.find((employee) => employeeLoginCpf(employee) === normalized) || null;
}

function appProfileFromRoleCode(roleCode) {
  const normalized = normalizeText(roleCode);
  if (["RH", "HR", "RH_ADMIN", "ADMIN"].includes(normalized)) return "RH";
  if (["DIRETORIA", "DIRECTOR", "EXECUTIVE"].includes(normalized)) return "Diretoria";
  if (["GESTOR", "GERENTE", "MANAGER"].includes(normalized)) return "Gerente";
  if (["SUPERVISOR", "LIDER", "LEADER"].includes(normalized)) return "Supervisor";
  return "Colaborador";
}

function applyAuthenticatedProfile({ user, profile, employee } = {}) {
  const roleCode = profile?.role_code || user?.user_metadata?.role_code || "colaborador";
  const appProfile = appProfileFromRoleCode(roleCode);
  const employeeRecord = employee || employees.find((item) => item.dbId === profile?.employee_id || normalizeText(item.email) === normalizeText(profile?.email || user?.email));
  const fallbackProfile = simulatedProfiles[appProfile] || simulatedProfiles.Colaborador;
  Object.assign(currentUser, {
    name: profile?.full_name || employeeRecord?.name || user?.user_metadata?.full_name || user?.email || fallbackProfile.name,
    profile: appProfile,
    company: employeeRecord?.company || fallbackProfile.company || "Todas",
    department: employeeRecord?.department || fallbackProfile.department || "Sem setor",
    role: employeeRecord?.role || roleCode || "",
    scope: fallbackProfile.scope || "self",
    homePage: "portal",
    cpf: employeeRecord ? employeeLoginCpf(employeeRecord) : "",
    birthDate: employeeRecord?.birthDate || "",
    authUserId: user?.id || profile?.auth_user_id || profile?.id || "",
    email: profile?.email || user?.email || employeeRecord?.email || "",
  });
  state.activeProfile = appProfile;
  state.simulatedPerson = currentUser.name;
  state.authUser = user || null;
  state.authProfile = profile || null;
  state.formMessage = "";
  state.vacationMessage = "";
  state.pointMessage = "";
  if (currentUser.company !== "Todas") {
    state.company = currentUser.company;
    state.requestCompany = currentUser.company;
  } else {
    state.company = "Todas";
  }
}

async function loadAuthProfile(session) {
  if (!supabaseClient || !session?.user) return null;
  const { data: profile } = await supabaseClient
    .from("hr_profiles")
    .select("*")
    .or(`id.eq.${session.user.id},auth_user_id.eq.${session.user.id}`)
    .maybeSingle();
  let employee = null;
  if (profile?.employee_id) {
    employee = employees.find((item) => item.dbId === profile.employee_id) || null;
    if (!employee) {
      const { data: employeeRow } = await supabaseClient
        .from("hr_employee_directory")
        .select("*")
        .eq("id", profile.employee_id)
        .maybeSingle();
      if (employeeRow) {
        employee = {
          id: employeeRow.employee_code || employeeRow.id,
          dbId: employeeRow.id,
          name: employeeRow.full_name || employeeRow.preferred_name || "Colaborador",
          company: employeeRow.company_name || "Todas",
          department: employeeRow.department_name || "Sem setor",
          role: employeeRow.position_name || "",
          manager: employeeRow.manager_name || employeeRow.supervisor_name || "Sem líder",
          managerEmployeeId: employeeRow.manager_employee_id || "",
          status: mapEmployeeStatus(employeeRow.status),
          admission: formatDate(employeeRow.admission_date),
          cpf: employeeRow.cpf || "",
          birthDate: employeeRow.birth_date || "",
          email: employeeRow.email || "",
          vacation: "Consultar",
          timeBank: "Consultar",
        };
      }
    }
  }
  applyAuthenticatedProfile({ user: session.user, profile, employee });
  return { profile, employee };
}

async function verificarSessao() {
  if (!supabaseClient?.auth) {
    state.authChecked = true;
    return null;
  }
  const { data } = await supabaseClient.auth.getSession();
  state.authSession = data?.session || null;
  if (state.authSession) await loadAuthProfile(state.authSession);
  state.authChecked = true;
  return state.authSession;
}

async function loginWithCPF(cpf, senha) {
  if (!supabaseClient?.auth) return { error: "Supabase Auth indisponível." };
  const loginValue = String(cpf || "").trim();
  const cpfLimpo = digitsOnly(loginValue);
  let email = loginValue.includes("@") ? loginValue : "";
  if (!email) {
    const { data: emp, error: empError } = await supabaseClient
      .from("hr_employees")
      .select("email, full_name, id")
      .or(`cpf.eq.${cpfLimpo},cpf.eq.${cpfLimpo.padStart(11, "0")}`)
      .maybeSingle();
    if (empError || !emp?.email) return { error: "CPF não encontrado no sistema." };
    email = emp.email;
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
  if (error) return { error: "Senha incorreta ou usuário sem acesso." };
  state.authSession = data.session;
  await loadAuthProfile(data.session);
  return { session: data.session, user: data.user, perfil: state.authProfile };
}

async function logout() {
  if (supabaseClient?.auth) await supabaseClient.auth.signOut();
  state.authSession = null;
  state.authUser = null;
  state.authProfile = null;
  state.authChecked = true;
  state.authMode = "login";
  state.authMessage = "Sessão encerrada.";
  state.page = "portal";
}

function shouldForcePasswordChange() {
  return false;
}

function authMessageMarkup() {
  return state.authMessage ? `<div class="auth-message">${escapeHtml(state.authMessage)}</div>` : "";
}

function formatPaystubCompetence(value) {
  if (!value) return "Sem competência";
  const [year, month] = String(value).slice(0, 10).split("-");
  const months = {
    "01": "Janeiro",
    "02": "Fevereiro",
    "03": "Março",
    "04": "Abril",
    "05": "Maio",
    "06": "Junho",
    "07": "Julho",
    "08": "Agosto",
    "09": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro",
  };
  return year && months[month] ? `${months[month]}/${year}` : String(value);
}

function currentMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function shiftMonthKey(monthKey, delta) {
  const [year, month] = String(monthKey || currentMonthKey()).split("-").map(Number);
  const date = new Date(year || new Date().getFullYear(), (month || 1) - 1 + delta, 1);
  return currentMonthKey(date);
}

function routineCompetence() {
  if (!state.rhRoutineCompetence) state.rhRoutineCompetence = currentMonthKey();
  return state.rhRoutineCompetence;
}

function routineCompetenceLabel(monthKey = routineCompetence()) {
  return formatPaystubCompetence(`${monthKey}-01`);
}

function supabaseStoragePublicUrl(bucket, path) {
  if (!bucket || !path || !supabaseClient) return "";
  return supabaseClient.storage.from(bucket).getPublicUrl(path).data?.publicUrl || "";
}

function isSamePerson(a, b) {
  return normalizeText(a) === normalizeText(b);
}

function isLeaderNameMatch(manager, leaderName) {
  const managerText = normalizeText(manager);
  const leaderText = normalizeText(leaderName);
  if (!managerText || !leaderText) return false;
  if (managerText === leaderText || managerText.includes(leaderText) || leaderText.includes(managerText)) return true;
  const managerParts = managerText.split(" ").filter((part) => part.length > 2);
  const leaderParts = leaderText.split(" ").filter((part) => part.length > 2);
  return managerParts.length >= 2 && managerParts.every((part) => leaderParts.includes(part));
}

function containsAny(value, words) {
  const text = normalizeText(value);
  return words.some((word) => text.includes(normalizeText(word)));
}

function ensureSimulationPeople() {
  const existing = new Set(employees.map((employee) => normalizeText(employee.name)));
  const virtualEmployees = simulationSeedPeople
    .filter((person) => !existing.has(normalizeText(person.name)))
    .map((person) => ({
      id: `SIM-${normalizeText(person.name).replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      dbId: null,
      name: person.name,
      company: person.company,
      department: person.department,
      role: person.role,
      manager: person.profile === "Diretoria" ? "Conselho/Diretoria" : person.profile === "RH" ? "Carlos Junior" : "Carlos Junior",
      status: "Ativo",
      admission: "Simulação",
      cpf: person.cpf || "",
      birthDate: person.birthDate || "1990-01-01",
      vacation: "Simulação",
      timeBank: "Simulação",
      simulationOnly: true,
    }));
  employees = [...employees, ...virtualEmployees];
}

function simulatedProfileForEmployee(employee) {
  const seed = simulationSeedPeople.find((person) => isSamePerson(person.name, employee.name));
  if (seed) return seed.profile;
  if (containsAny(employee.name, ["CARLOS JUNIOR", "ANDERSON NASCIMENTO"])) return "Diretoria";
  if (containsAny(employee.name, ["ANA PAULA"])) return "RH";
  if (containsAny(employee.name, ["LUIZ FELIPE", "ANGELO DA GAMA", "LYSIANE", "RUBENON"])) return "Supervisor";
  if (containsAny(employee.name, ["MARIA ANDRESSA", "JOSE JOELLINGTON", "JONATHAN ALEXANDRE"])) return "Gerente";
  return "Colaborador";
}

function employeeWithSimulationHierarchy(employee) {
  const role = normalizeText(employee.role);
  const department = normalizeText(employee.department);
  const name = normalizeText(employee.name);
  const patched = { ...employee };

  if (name.includes("CARLOS JUNIOR") || name.includes("ANDERSON NASCIMENTO")) {
    patched.manager = "Conselho/Diretoria";
    patched.department = "Diretoria";
    patched.role = "Diretor";
    patched.company = "Todas";
    return patched;
  }

  if (name.includes("ANA PAULA")) {
    patched.manager = "Carlos Junior";
    patched.department = "Recursos Humanos";
    patched.role = "RH";
    patched.company = "Todas";
    return patched;
  }

  if (name.includes("ARIANA DA COSTA MACHADO")) {
    patched.manager = "Carlos Junior";
    patched.role = employee.role || "Gerente de projetos";
    return patched;
  }

  if (name.includes("MARIA ANDRESSA") || name.includes("ANDREZA")) {
    patched.manager = "Carlos Junior";
    patched.department = "Pós-venda";
    patched.role = "Gerente de pós-venda e atendimento";
    return patched;
  }

  if (name.includes("LUIZ FELIPE") || name.includes("JEILSON DA SILVA")) {
    patched.manager = "Maria Andressa Lourenco do Nascimento";
    patched.role = "Supervisor de montagem";
    patched.department = department.includes("MONTAGEM") ? employee.department : "Montagem";
    return patched;
  }

  const isMountingOrTechnical =
    containsAny(role, ["MONTADOR", "MONTAGEM", "TECNICO MOBILIARIO", "TÉCNICO MOBILIÁRIO"]) ||
    containsAny(department, ["MONTAGEM"]);

  if (isMountingOrTechnical) {
    patched.manager = "Luiz Felipe da Silva Rodrigues";
  }

  return patched;
}

function applySimulationHierarchy() {
  ensureSimulationPeople();
  employees = employees.map(employeeWithSimulationHierarchy);
  markRuntimeIndexesDirty();
}

function simulationPeopleForCurrentProfile() {
  const seen = new Set();
  const people = employees
    .filter((employee) => simulatedProfileForEmployee(employee) === currentUser.profile)
    .map((employee) => ({
      name: employee.name,
      company: employee.company,
      department: employee.department,
      role: employee.role,
    }));

  simulationSeedPeople
    .filter((person) => person.profile === currentUser.profile)
    .forEach((person) => people.unshift(person));

  return people
    .filter((person) => {
      const key = normalizeText(person.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function applySimulationPerson(personName) {
  const employee = employeeIndex.byName.get(normalizeText(personName)) || employees.find((item) => isSamePerson(item.name, personName));
  const seed = simulationSeedPeople.find((item) => isSamePerson(item.name, personName));
  const source = seed || employee || simulatedProfiles[currentUser.profile];
  currentUser.name = source.name;
  currentUser.company = source.company || currentUser.company;
  currentUser.department = source.department || currentUser.department;
  currentUser.role = source.role || currentUser.role || "";
  currentUser.cpf = employeeLoginCpf(source);
  currentUser.birthDate = source.birthDate || currentUser.birthDate || "";
  state.simulatedPerson = source.name;
  if (currentUser.company !== "Todas") {
    state.company = currentUser.company;
    state.requestCompany = currentUser.company;
  }
}

function visibleEmployeesForRequest() {
  return memoValue(`request-employees:${currentUser.profile}:${normalizeText(currentUser.name)}:${normalizeText(state.requestCompany)}`, () => {
    if (["RH", "Diretoria"].includes(currentUser.profile)) return employees;
    if (currentUser.profile === "Gerente") {
      const directSupervisors = employeesManagedBy(currentUser.name).map((employee) => employee.name);
      return employees.filter(
        (employee) =>
          isLeaderNameMatch(employee.manager, currentUser.name) ||
          directSupervisors.some((supervisor) => isLeaderNameMatch(employee.manager, supervisor)) ||
          (employee.company === state.requestCompany && currentUser.company === "Todas"),
      );
    }
    if (currentUser.profile === "Supervisor") {
      const scoped = employeesManagedBy(currentUser.name).filter((employee) => normalizeText(employee.company) === normalizeText(state.requestCompany));
      return scoped.length ? scoped : employees.filter((employee) => normalizeText(employee.company) === normalizeText(state.requestCompany)).slice(0, 20);
    }
    const own = currentEmployeeRecord();
    return own ? [own] : employees.slice(0, 1);
  });
}

function teamEmployeesForCurrentUser() {
  return memoValue(`team:${currentUser.profile}:${normalizeText(currentUser.name)}`, () => {
    if (currentUser.profile === "Supervisor") {
      return employeesManagedBy(currentUser.name);
    }
    if (currentUser.profile === "Gerente") {
      const directSupervisors = employeesManagedBy(currentUser.name).map((employee) => employee.name);
      return employees.filter(
        (employee) =>
          isLeaderNameMatch(employee.manager, currentUser.name) ||
          directSupervisors.some((supervisor) => isLeaderNameMatch(employee.manager, supervisor)),
      );
    }
    if (currentUser.profile === "RH" || currentUser.profile === "Diretoria") return employees;
    const own = currentEmployeeRecord();
    return own ? [own] : [];
  });
}

function employeesManagedBy(leaderName) {
  const key = normalizeText(leaderName);
  return memoValue(`managed:${key}`, () => {
    const rows = new Map();
    (employeeIndex.byManager.get(key) || []).forEach((employee) => rows.set(employee.id, employee));
    employees
      .filter((employee) => isLeaderNameMatch(employee.manager, leaderName))
      .forEach((employee) => rows.set(employee.id, employee));
    return Array.from(rows.values());
  });
}

function currentEmployeeRecord() {
  const profileEmployeeId = state.authProfile?.employee_id || "";
  if (profileEmployeeId) {
    const byId = employees.find((employee) => employee.dbId === profileEmployeeId || employee.id === profileEmployeeId);
    if (byId) return byId;
  }
  const currentEmail = normalizeText(currentUser.email || state.authUser?.email || state.authProfile?.email || "");
  if (currentEmail) {
    const byEmail = employees.find((employee) => normalizeText(employee.email || "") === currentEmail);
    if (byEmail) return byEmail;
  }
  const currentName = normalizeText(currentUser.name);
  return memoValue(`current:${currentName}`, () => (
    employeeIndex.byName.get(currentName) ||
    employees.find((employee) => {
      const employeeName = normalizeText(employee.name);
      return currentName && (employeeName.includes(currentName) || currentName.includes(employeeName));
    }) ||
    null
  ));
}

function directManagerForLeader(leaderName = currentUser.name) {
  const leader = employees.find((employee) => isSamePerson(employee.name, leaderName));
  if (leader?.manager && !["Sem líder", "Consultar ficha", "Conselho/Diretoria"].includes(leader.manager)) {
    return leader.manager;
  }
  const seed = simulationSeedPeople.find((person) => isSamePerson(person.name, leaderName));
  if (seed?.profile === "Supervisor") return "Maria Andressa Lourenco do Nascimento";
  if (seed?.profile === "Gerente") return "Carlos Junior";
  return "";
}

function profileForPersonName(personName) {
  const employee = employees.find((item) => isSamePerson(item.name, personName));
  if (employee) return simulatedProfileForEmployee(employee);
  const seed = simulationSeedPeople.find((item) => isSamePerson(item.name, personName));
  return seed?.profile || "";
}

function approvalTargetAfterLeader(leaderName) {
  const manager = directManagerForLeader(leaderName);
  const managerProfile = profileForPersonName(manager);
  if (manager && managerProfile === "Gerente") {
    return { owner: manager, next: "Diretoria", status: "Em análise" };
  }
  return { owner: "Diretoria", next: "RH", status: "Aguardando aprovação" };
}

function nextApprovalAfterCurrent(profile = currentUser.profile) {
  if (profile === "Supervisor") {
    return approvalTargetAfterLeader(currentUser.name);
  }
  if (profile === "Gerente") return { owner: "Diretoria", next: "RH", status: "Aguardando aprovação" };
  if (profile === "Diretoria") return { owner: "RH", next: "Conclusão", status: "Em execução" };
  if (profile === "RH") return { owner: "Diretoria", next: "RH", status: "Aguardando aprovação" };
  return { owner: "Supervisor", next: "Gerência", status: "Aberto" };
}

function workflowStepForOwner(owner) {
  const normalized = normalizeText(owner);
  if (normalized.includes("SUPERVISOR")) return "Supervisor";
  if (normalized.includes("GERENCIA") || normalized.includes("GERENTE")) return "Gerência";
  if (normalized.includes("DIRETOR")) return "Diretoria";
  if (normalized === "RH" || normalized.includes("RECURSOS HUMANOS")) return "RH";
  return owner || "Supervisor";
}

function nextWorkflowFromRequest(request) {
  const owner = workflowStepForOwner(request.owner);
  const ownerProfile = profileForPersonName(request.owner);
  if (request.status === "Aberto" && ownerProfile === "Supervisor") {
    const target = approvalTargetAfterLeader(request.owner);
    return { advanceLabel: "Aprovar", nextStatus: target.status, nextOwner: target.owner, nextNext: target.next };
  }
  if (request.status === "Aberto" && ownerProfile === "Gerente") {
    return { advanceLabel: "Aprovar", nextStatus: "Aguardando aprovação", nextOwner: "Diretoria", nextNext: "RH" };
  }
  if (request.status === "Em análise" && ownerProfile === "Gerente") {
    return { advanceLabel: "Aprovar", nextStatus: "Aguardando aprovação", nextOwner: "Diretoria", nextNext: "RH" };
  }
  if (owner === "Supervisor") {
    return { advanceLabel: "Aprovar", nextStatus: "Em análise", nextOwner: "Gerência", nextNext: "Diretoria" };
  }
  if (owner === "Gerência") {
    return { advanceLabel: "Aprovar", nextStatus: "Aguardando aprovação", nextOwner: "Diretoria", nextNext: "RH" };
  }
  if (owner === "Diretoria") {
    return { advanceLabel: "Aprovar para execução", nextStatus: "Em execução", nextOwner: "RH", nextNext: "Conclusão" };
  }
  if (owner === "RH") {
    return { advanceLabel: "Concluir", nextStatus: "Concluído", nextOwner: "Finalizado", nextNext: "Arquivo" };
  }
  return requestWorkflow[request.status] || requestWorkflow.Aberto;
}

function inferredRequestStartForEmployee(employeeName) {
  const employee = employees.find((item) => isSamePerson(item.name, employeeName));
  const profile = employee ? simulatedProfileForEmployee(employee) : "";
  if (profile === "Supervisor") return { owner: "Gerência", next: "Diretoria", status: "Em análise" };
  if (profile === "Gerente") return { owner: "Diretoria", next: "RH", status: "Aguardando aprovação" };
  if (profile === "Diretoria") return { owner: "RH", next: "Conclusão", status: "Em execução" };
  if (profile === "RH") return { owner: "Diretoria", next: "RH", status: "Aguardando aprovação" };
  return null;
}

function immediateLeaderName() {
  const employee = currentEmployeeRecord();
  if (currentUser.profile === "Colaborador") return employee?.manager && employee.manager !== "Sem líder" ? employee.manager : "Supervisor direto";
  if (currentUser.profile === "Supervisor") return directManagerForLeader(currentUser.name) || "Diretoria";
  if (currentUser.profile === "Gerente") return "Diretoria";
  return "RH";
}

function visibleCompaniesForRequest() {
  if (["RH", "Diretoria"].includes(currentUser.profile)) return companies;
  return companies.filter((company) => company.key === currentUser.company);
}

function requestTypesForCurrentUser() {
  if (currentUser.profile === "Colaborador") return employeeRequestTypes;
  if (currentUser.profile === "Diretoria") return [["Aprovação extraordinária", "Registrar decisão ou solicitação estratégica da diretoria."]];
  return leaderRequestTypes;
}

function approvalRouteFor(type) {
  const sensitive = ["Demissão", "Movimentação funcional", "Contracheque / pagamento", "Atestado / afastamento"];
  if (currentUser.profile === "Colaborador") {
    return sensitive.includes(type)
      ? "Colaborador → Supervisor → Gerência → Diretoria → RH"
      : "Colaborador → Supervisor → Gerência → Diretoria";
  }
  if (currentUser.profile === "Supervisor") return "Supervisor → Gerência → Diretoria → RH";
  if (currentUser.profile === "Gerente") return "Gerência → Diretoria → RH";
  if (type === "Aprovação extraordinária") return "Diretoria → RH";
  return "RH/Diretoria → execução com auditoria";
}

function requestKey(request) {
  return request.dbId || request.protocol;
}

function applySavedRequestWorkflow(request) {
  const saved = JSON.parse(localStorage.getItem("rhRequestWorkflow") || "{}");
  const key = requestKey(request);
  const databaseWorkflow = request.rawData?.workflow_owner
    ? {
        owner: request.rawData.workflow_owner,
        next: request.rawData.workflow_next,
        status: request.rawData.workflow_status_label,
        workflowLog: request.rawData.workflow_log,
      }
    : {};
  const patch = request.dbId ? databaseWorkflow : saved[key] || saved[request.protocol] || {};
  const workflow = requestWorkflow[patch.status || request.status] || {};
  const inferred = !patch.owner && request.owner === "Supervisor" ? inferredRequestStartForEmployee(request.employee) : null;
  return {
    ...request,
    owner: patch.owner || inferred?.owner || request.owner || workflow.owner || "Supervisor",
    next: patch.next || inferred?.next || request.next || workflow.next || "Gerência",
    status: patch.status || inferred?.status || request.status,
    workflowLog: patch.workflowLog || request.workflowLog || [],
    returnStatus: patch.returnStatus || request.returnStatus || "",
    returnOwner: patch.returnOwner || request.returnOwner || "",
    returnNext: patch.returnNext || request.returnNext || "",
  };
}

function saveRequestWorkflow(request, patch) {
  const saved = JSON.parse(localStorage.getItem("rhRequestWorkflow") || "{}");
  const key = requestKey(request);
  saved[key] = {
    ...(saved[key] || {}),
    ...patch,
    updated_by: currentUser.name,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem("rhRequestWorkflow", JSON.stringify(saved));
}

function canAccessPage(pageId, profile = currentUser.profile) {
  if (["requestForm", "employeeDetail", "employeeForm"].includes(pageId)) return true;
  if (pageId === "paystubs") return true;
  return pages.some((group) => group.items.some(([id, , , profiles]) => id === pageId && (!profiles || profiles.includes(profile))));
}

function visiblePages() {
  return pages
    .map((group) => ({
      ...group,
      items: group.items.filter(([, , , profiles]) => !profiles || profiles.includes(currentUser.profile)),
    }))
    .filter((group) => group.items.length);
}

function applyProfile(profileKey) {
  const profile = simulatedProfiles[profileKey] || simulatedProfiles.RH;
  Object.assign(currentUser, profile);
  state.activeProfile = profile.profile;
  state.simulatedPerson = profile.name;
  state.formMessage = "";
  state.vacationMessage = "";
  state.pointMessage = "";
  state.pageHistory = [];
  if (!canAccessPage(state.page, profile.profile)) {
    state.page = profile.homePage;
  }
  if (currentUser.company !== "Todas") {
    state.company = currentUser.company;
    state.requestCompany = currentUser.company;
  } else {
    state.company = "Todas";
  }
  applySimulationPerson(profile.name);
}

function simulationPersonOptions() {
  const seen = new Set();
  return [...simulationSeedPeople, ...employees]
    .filter((person) => person?.name)
    .filter((person) => {
      const key = normalizeText(person.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function shell(content) {
  const [title, subtitle] = titles[state.page];
  const groups = visiblePages();
  const topbarBrand =
    currentUser.company && currentUser.company !== "Todas"
      ? companyLogo(currentUser.company)
      : `<img class="topbar-logos" src="./assets/grupo-prodelar-logos.png" alt="Prodelar, Colmob e Servimec" loading="lazy" decoding="async" />`;
  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <img class="brand-logos" src="./assets/grupo-prodelar-logos.png" alt="Prodelar, Colmob e Servimec" loading="eager" decoding="async" />
          <div class="brand-copy"><strong>Recursos Humanos</strong><span>Prodelar · Colmob · Servimec</span></div>
        </div>
        ${groups
          .map(
            (group) => `
          <div class="nav-group">
            <p class="nav-title">${group.group}</p>
            ${group.items
              .map(
                ([id, icon, label]) => `
              <a class="nav-button ${state.page === id ? "active" : ""}" href="${pageHref(id)}" data-nav-page="${id}" onclick="return navigateFromSidebar('${id}')">
                <span class="icon">${icon}</span><span>${label}</span>
              </a>`,
              )
              .join("")}
          </div>`,
          )
          .join("")}
      </aside>
      <main class="main">
        <header class="topbar">
          <div><h1>${title}</h1><p>${subtitle} · ${state.dataStatus}</p></div>
          <div class="actions">
            <div class="identity-lock"><span>Usuário</span><strong>${escapeHtml(currentUser.name)}</strong><small>${escapeHtml(currentUser.profile)}</small></div>
            <div class="topbar-brand">${topbarBrand}</div>
            <button class="btn" data-action="refresh">⟳ Atualizar</button>
            <button class="btn ghost" data-action="logout">Sair</button>
          </div>
        </header>
        <section class="content">${content}</section>
      </main>
    </div>`;
}

function mapEmployeeStatus(status) {
  const labels = {
    active: "Ativo",
    inactive: "Inativo",
    on_leave: "Afastado",
    terminated: "Desligado",
  };
  return labels[status] || status || "Ativo";
}

function employeeStatusToDb(status) {
  const values = {
    Ativo: "active",
    Inativo: "inactive",
    Afastado: "on_leave",
    Desligado: "terminated",
  };
  return values[status] || "active";
}

function formatDate(value) {
  if (!value) return "Sem data";
  const parts = String(value).slice(0, 10).split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

function formatDateTime(value) {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateRange(start, end) {
  if (!start || !end) return "Sem programação";
  return `${formatDate(start)} a ${formatDate(end)}`;
}

function dateInputValue(value) {
  return value ? String(value).slice(0, 10) : "";
}

function dateIsWithinRange(start, end, reference = new Date().toISOString().slice(0, 10)) {
  if (!start || !end) return false;
  const startDate = String(start).slice(0, 10);
  const endDate = String(end).slice(0, 10);
  return startDate <= reference && reference <= endDate;
}

function mapVacationForecastRow(row, index = 0) {
  const employee = row.employee || {};
  const company = employee.company || {};
  const department = employee.department || {};
  const position = employee.position || {};
  const acquisitionLabel =
    row.acquisition_label ||
    (row.acquisition_start && row.acquisition_end ? `${formatDate(row.acquisition_start)} a ${formatDate(row.acquisition_end)}` : "");
  return {
    id: row.id || vacationKey(row) || `vacation-db-${index}`,
    source_file: row.raw_import?.source_file || row.source_file || "Supabase",
    source_company: row.company_key || row.company_code || row.company_name || row.company || company.code || company.name || "",
    source_competence_month: row.source_competence_month || row.raw_import?.source_competence_month || "",
    employee_code: row.employee_code || employee.employee_code || row.raw_import?.employee_code || "",
    registration: row.registration || row.raw_import?.registration || "",
    employee_name: row.employee_name || row.full_name || employee.full_name || "Sem colaborador",
    cpf: row.cpf || employee.cpf || row.raw_import?.cpf || "",
    company_key: row.company_key || row.company_code || row.company_name || row.company || company.code || company.name || "",
    department: row.department || row.department_name || department.name || row.raw_import?.department || "Sem setor",
    position: row.position || row.position_name || position.name || row.raw_import?.position || "Sem cargo",
    acquisition_start: row.acquisition_start || "",
    acquisition_end: row.acquisition_end || "",
    acquisition_label: acquisitionLabel,
    legal_limit_date: row.legal_limit_date || "",
    legal_limit_label: row.legal_limit_label || formatDate(row.legal_limit_date),
    planned_start: row.planned_start || "",
    planned_end: row.planned_end || "",
    balance_days: row.balance_days ?? "",
    status: row.status || "forecast",
    can_edit_until: row.can_edit_until || row.legal_limit_date || "",
    submitted_for_review: Boolean(row.submitted_for_review),
    raw_import: row.raw_import || {},
  };
}

async function loadSupabaseData() {
  if (supabaseLoadInFlight) return supabaseLoadInFlight;
  supabaseLoadInFlight = loadSupabaseDataFresh().finally(() => {
    supabaseLoadInFlight = null;
  });
  return supabaseLoadInFlight;
}

async function loadSupabaseDataFresh() {
  if (!supabaseClient) {
    employees = [];
    requests = [];
    documents = [];
    vacationForecasts = [];
    vacationRows = [];
    registrationCards = [];
    paystubRecords = [];
    employeeTimelineEvents = [];
    applySimulationHierarchy();
    state.dataStatus = "Supabase indisponível";
    renderPage();
    return;
  }

  try {
    const previousSignature = runtimeDataSignature;
    const wasAlreadyConnected = state.dataStatus.startsWith("Supabase conectado");
    const [employeeResult, requestResult, vacationResult, documentResult, employeeDocumentResult, timelineResult] = await Promise.all([
      supabaseClient.from("hr_employee_directory").select("*").order("full_name"),
      supabaseClient
        .from("hr_requests")
        .select("id,protocol_number,status,title,description,due_at,created_at,raw_data,request_type:hr_request_types(name),employee:hr_employees!hr_requests_employee_id_fkey(full_name),company:hr_companies(name)")
        .not("status", "in", "(completed,cancelled,rejected)")
        .order("created_at", { ascending: false }),
      supabaseClient
        .from("hr_vacation_periods")
        .select(
          "id,acquisition_start,acquisition_end,legal_limit_date,balance_days,planned_start,planned_end,status,source_competence_month,raw_import,employee:hr_employees(employee_code,full_name,cpf,company:hr_companies(code,name),department:hr_departments(name),position:hr_positions(name))",
        )
        .order("legal_limit_date"),
      supabaseClient.from("hr_document_types").select("name,category,default_sensitivity").order("category"),
      supabaseClient
        .from("hr_employee_documents")
        .select(
          "id,original_file_name,storage_bucket,storage_path,competence_month,sensitivity,created_at,employee:hr_employees(employee_code,full_name,company:hr_companies(code,name),department:hr_departments(name),position:hr_positions(name)),document_type:hr_document_types(code,name,category)",
        )
        .eq("document_type.code", "paystub")
        .order("competence_month", { ascending: false }),
      supabaseClient
        .from("hr_employee_timeline")
        .select("id,employee_id,event_type,module_name,title,description,status,metadata,created_at,related_table,related_record_id")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const errors = [employeeResult.error, requestResult.error, vacationResult.error, documentResult.error, employeeDocumentResult.error, timelineResult.error].filter(Boolean);
    if (errors.length) {
      employees = [];
      requests = [];
      documents = [];
      vacationForecasts = [];
      vacationRows = [];
      registrationCards = [];
      paystubRecords = [];
      employeeTimelineEvents = [];
      applySimulationHierarchy();
      state.dataStatus = `Supabase conectado, aguardando ajuste de base: ${errors[0].message}`;
      renderPage();
      return;
    }

    employees = (employeeResult.data || []).map((row) => ({
      id: row.employee_code || row.id,
      dbId: row.id,
      name: row.full_name,
      company: row.company_name || "Sem empresa",
      department: row.department_name || "Sem setor",
      role: row.position_name || "Sem cargo",
      manager: row.manager_name || "Sem líder",
      managerEmployeeId: row.manager_employee_id || "",
      status: mapEmployeeStatus(row.status),
      admission: formatDate(row.admission_date),
      cpf: row.cpf || row.document_number || row.tax_id || row.raw_import?.cpf || "",
      birthDate: row.birth_date || row.date_of_birth || row.raw_import?.birth_date || "",
      vacation: "Consultar",
      timeBank: "Consultar",
    }));
    applySimulationHierarchy();

    requests = (requestResult.data || []).map((row) => {
      const raw = row.raw_data || {};
      const rawOwner = raw.workflow_owner || raw.owner || "";
      const statusLabel = raw.workflow_status_label || (row.status === "open" && workflowStepForOwner(rawOwner) === "Diretoria" ? "Aguardando aprovação" : mapRequestStatus(row.status));
      return applySavedRequestWorkflow({
        dbId: row.id,
        protocol: row.protocol_number,
        type: row.request_type?.name || "Solicitação",
        title: row.title,
        description: row.description || "",
        employee: row.employee?.full_name || raw.employee_name || "Sem colaborador",
        owner: raw.workflow_owner || raw.owner || (statusLabel === "Aguardando aprovação" ? "Diretoria" : "Supervisor"),
        company: row.company?.name || raw.company_name || "Prodelar",
        next: raw.workflow_next || (statusLabel === "Aguardando aprovação" ? "RH" : "Gerência"),
        status: statusLabel,
        sla: row.due_at ? formatDate(row.due_at) : "Sem SLA",
        rawData: raw,
        workflowLog: raw.workflow_log || [],
      });
    });

    const supabaseVacationRows = vacationResult.data || [];
    vacationForecasts = supabaseVacationRows.map(mapVacationForecastRow);
    vacationRows = vacationForecasts.map((row) => [
      row.employee_name || "Sem colaborador",
      row.company_key || "Sem empresa",
      `${formatDate(row.acquisition_start)} a ${formatDate(row.acquisition_end)}`,
      formatDate(row.legal_limit_date),
      row.planned_start ? `${formatDate(row.planned_start)} a ${formatDate(row.planned_end)}` : "Sem programação",
      row.balance_days ?? "-",
    ]);

    documents = (documentResult.data || []).map((row) => [
      row.name,
      row.category,
      documentSensitivityLabel(row.default_sensitivity),
    ]);

    registrationCards = [];
    paystubRecords = (employeeDocumentResult.data || [])
      .filter((row) => row.document_type?.code === "paystub")
      .map((row) => ({
        id: row.id,
        employee_code: row.employee?.employee_code || "",
        employee_name: row.employee?.full_name || "Sem colaborador",
        company_name: row.employee?.company?.name || row.employee?.company?.code || "Sem empresa",
        department: row.employee?.department?.name || "Sem setor",
        position: row.employee?.position?.name || "Sem cargo",
        competence: row.competence_month || "",
        competence_label: row.competence_month ? formatPaystubCompetence(row.competence_month) : "Sem competência",
        type: row.document_type?.name || "Contracheque",
        status: row.storage_path ? "Disponível" : "Registrado",
        file_name: row.original_file_name || "",
        file_url: row.storage_path ? supabaseStoragePublicUrl(row.storage_bucket, row.storage_path) : "",
      }));
    employeeTimelineEvents = (timelineResult.data || []).map((row) => ({
      id: row.id,
      employee_id: row.employee_id,
      event_type: row.event_type,
      module_name: row.module_name,
      title: row.title,
      description: row.description || "",
      status: row.status || "",
      metadata: row.metadata || {},
      created_at: row.created_at,
      related_table: row.related_table || "",
      related_record_id: row.related_record_id || "",
    }));
    state.vacationMessage = vacationForecasts.length ? "" : "Nenhuma previsão de férias cadastrada no Supabase.";
    applySimulationHierarchy();
    rebuildRuntimeIndexes();
    updateRuntimeDataSignature();
    state.dataStatus = `Supabase conectado: ${employees.length} colaboradores`;
    saveRuntimeDataCache();
    if (previousSignature && previousSignature === runtimeDataSignature && wasAlreadyConnected && lastRenderedHtml) {
      return;
    }
    renderPage();
  } catch (error) {
    employees = [];
    requests = [];
    documents = [];
    vacationForecasts = [];
    vacationRows = [];
    registrationCards = [];
    paystubRecords = [];
    employeeTimelineEvents = [];
    applySimulationHierarchy();
    state.dataStatus = `Erro de conexão: ${error.message}`;
    renderPage();
  }
}

function vacationKey(record) {
  return [
    record.employee_code || record.employeeName || record.employee_name || "",
    record.company_key || record.company || record.source_company || "",
    record.acquisition_start || "",
    record.acquisition_end || "",
  ].join("|");
}

function mapRequestStatus(status) {
  const labels = {
    open: "Aberto",
    in_analysis: "Em análise",
    waiting_approval: "Aguardando aprovação",
    in_execution: "Em execução",
    completed: "Concluído",
    rejected: "Reprovado",
    waiting_documents: "Aguardando esclarecimento",
    waiting_information: "Aguardando esclarecimento",
  };
  return labels[status] || status || "Aberto";
}

function requestDbStatus(status) {
  const map = {
    Aberto: "open",
    "Em análise": "in_analysis",
    "Aguardando aprovação": "waiting_approval",
    "Aguardando esclarecimento": "waiting_documents",
    "Em execução": "in_execution",
    Concluído: "completed",
    Reprovado: "rejected",
  };
  return map[status] || "open";
}

function documentSensitivityLabel(value) {
  const labels = {
    public_policy: "Política pública",
    employee_private: "Privado do colaborador",
    leader_visible: "Visível ao líder",
    hr_restricted: "Restrito RH",
    legal_restricted: "Restrito jurídico",
  };
  return labels[value] || value || "Sem regra";
}

function dashboard() {
  const team = teamEmployeesForCurrentUser().filter((employee) => employee.status === "Ativo" && !isSamePerson(employee.name, currentUser.name));
  const leaderView = ["Supervisor", "Gerente"].includes(currentUser.profile);
  const executiveView = ["RH", "Diretoria"].includes(currentUser.profile);
  const dashboardCompany = state.company || "Todas";
  const matchesDashboardCompany = (value) => matchesCompanyFilter(value, dashboardCompany);
  const scopedEmployees = leaderView
    ? team
    : indexedByCompany(dataIndex.employeesByCompany, dashboardCompany, employees);
  const scopedRequests = visibleRequests().filter((request) => dashboardCompany === "Todas" || matchesDashboardCompany(request.company));
  const activeEmployees = scopedEmployees.filter((employee) => employee.status === "Ativo").length;
  const teamNames = new Set(team.map((employee) => normalizeText(employee.name)));
  const vacationRowsForDashboard = leaderView
    ? vacationForecasts.filter((row) => teamNames.has(normalizeText(row.employee_name)) && dateIsWithinRange(row.planned_start, row.planned_end))
    : indexedByCompany(dataIndex.vacationsByCompany, dashboardCompany, vacationForecasts, (row) => row.company_key || row.source_company || row.company || row.company_name)
        .filter((row) => dateIsWithinRange(row.planned_start, row.planned_end));
  const vacationEmployees = new Set(
    vacationRowsForDashboard.map((row) => normalizeText(row.employee_name)),
  );
  const openRequests = scopedRequests.filter((request) => !["Concluído", "Reprovado"].includes(request.status)).length;
  const actionable = scopedRequests.filter((request) => canActOnRequest(request));
  const passwordResetQueue = [];
  const pendingActionCount = actionable.length + passwordResetQueue.length;
  const statusCounts = requestLanes.map((lane) => [lane, scopedRequests.filter((request) => request.status === lane).length]);
  const shortcutCards = [
    ["admission", "Admissão", "Abrir requisição de contratação"],
    ["termination", "Demissão", "Solicitar desligamento da equipe"],
    ["vacations", "Gestão de férias", "Programação da equipe"],
    ["time", "Ajuste no ponto", "Fila de ponto da equipe"],
  ];
  return `
    ${executiveView ? dashboardCompanySwitcher(dashboardCompany) : ""}
    <div class="grid metrics">
      ${metric(leaderView ? "Colaboradores da equipe" : "Colaboradores", activeEmployees, leaderView ? "Equipe dentro da sua alçada" : dashboardCompany === "Todas" ? "Ativos nas três empresas" : `Ativos em ${dashboardCompany}`, "☷", leaderView ? "vacations" : "employees")}
      ${metric("Colaboradores de férias", vacationEmployees.size, leaderView ? "Em férias hoje na equipe" : "Em férias hoje", "◷", "vacations")}
      ${metric("Solicitações abertas", openRequests, "Tickets em andamento", "↻", "requests")}
      ${metric("Pendências comigo", pendingActionCount, "Itens que exigem decisão", "!", "requests")}
      ${executiveView ? metric("Folha bruta", "R$ 0", "Última competência importada", "Σ", "accounting") : ""}
      ${executiveView ? metric("Folha bruta média", "R$ 0", "Média dos últimos 3 meses", "Σ", "accounting") : ""}
      ${executiveView ? metric("Alertas críticos", executiveAlerts.length, "ASO, férias, afastamentos e experiência", "!", "peopleControls") : ""}
    </div>
    ${
      executiveView
        ? `<div class="card pad" style="margin-top:16px">
            <div class="section-title"><div><h2>Solicitações por status</h2><p>Visão executiva para saber se o fluxo está andando.</p></div></div>
            <div class="status-strip">
              ${statusCounts.map(([label, count]) => `<button class="status-card" data-page="requests"><strong>${count}</strong><span>${label}</span></button>`).join("")}
            </div>
          </div>`
        : ""
    }
    ${
      currentUser.profile === "RH" && passwordResetQueue.length
        ? `<div class="card pad" style="margin-top:16px">
            <div class="section-title">
              <div><h2>Reset de senha</h2><p>Senhas temporárias aguardando entrega pelo RH.</p></div>
              <span class="pill danger">${passwordResetQueue.length}</span>
            </div>
            <div class="table">
              <div class="tr th"><div>Colaborador</div><div>CPF</div><div>Senha temporária</div><div>Criado em</div></div>
              ${passwordResetQueue.slice(0, 8).map((item) => `
                <div class="tr">
                  <div><strong>${escapeHtml(item.employeeName)}</strong><br><span class="muted">Troca obrigatória no próximo acesso</span></div>
                  <div>${escapeHtml(item.cpf)}</div>
                  <div><strong>${escapeHtml(item.temporaryPassword)}</strong></div>
                  <div>${formatDateTime(item.createdAt)}</div>
                </div>
              `).join("")}
            </div>
          </div>`
        : ""
    }
    <div class="grid two" style="margin-top:16px">
      <div class="card pad clickable" data-page="requests">
        <div class="section-title">
          <div><h2>Minha fila agora</h2><p>O que este perfil precisa despachar</p></div>
          <button class="btn small primary" data-page="requests">Resolver fila</button>
        </div>
        <div class="checklist">
          ${
            passwordResetQueue.slice(0, 3).map((item) =>
              `<div class="check blocked"><span class="box">!</span><div><strong>Reset de senha · ${escapeHtml(item.employeeName)}</strong><br><span>Senha temporária: ${escapeHtml(item.temporaryPassword)} · entregar ao colaborador e orientar troca no acesso.</span></div></div>`,
            ).join("") ||
            ""
          }
          ${
            actionable.slice(0, 5).map((request) =>
              `<div class="check ${request.status === "Aguardando aprovação" ? "blocked" : ""}"><span class="box">!</span><div><strong>${request.protocol} · ${request.title}</strong><br><span>${request.status} com ${request.owner} · próximo ${request.next || "definir"}</span></div></div>`,
            ).join("") || (passwordResetQueue.length ? "" : `<div class="check done"><span class="box">✓</span><div><strong>Nenhuma pendência direta</strong><br><span>Não há itens aguardando ação para o seu usuário.</span></div></div>`)
          }
        </div>
      </div>
      <div class="card pad clickable" data-page="portal">
        <div class="section-title">
          <div><h2>Linha do tempo</h2><p>${executiveView ? "Eventos relevantes de RH, sem anexos sensíveis." : "Reservado para eventos reais do perfil"}</p></div>
        </div>
        ${executiveView ? timeline() : `<div class="empty">Linha do tempo será organizada depois com eventos reais do processo.</div>`}
      </div>
    </div>
    ${
      executiveView
        ? `<div class="grid two" style="margin-top:16px">
            <button class="card pad dashboard-routine-card" data-page="rhRoutines">
              <div class="section-title"><div><h2>Rotinas mensais</h2><p>Importações, conferências e pacotes da competência</p></div></div>
              <strong>5 de 8</strong>
              <small>62% concluído no ciclo atual</small>
            </button>
            <button class="card pad dashboard-routine-card" data-page="rhRoutines">
              <div class="section-title"><div><h2>Rotinas temporárias</h2><p>Tarefas abertas a partir de admissões, desligamentos e pendências</p></div></div>
              <strong>2 abertas</strong>
              <small>Itens avulsos sob acompanhamento do RH</small>
            </button>
          </div>`
        : ""
    }
    ${
      leaderView
        ? `<div class="card pad" style="margin-top:16px">
            <div class="section-title"><div><h2>Atalhos da equipe</h2><p>Acesse os processos operacionais sob sua alçada.</p></div>${statusPill(currentUser.company)}</div>
            <div class="status-strip">
              ${shortcutCards.map(([page, title, detail]) => `<button class="status-card" data-page="${page}"><strong>${title}</strong><span>${detail}</span></button>`).join("")}
            </div>
          </div>`
        : ""
    }`;
}

function dashboardCompanySwitcher(activeCompany) {
  return `<div class="company-switcher dashboard-company-switcher">
    <button class="company-chip dashboard-company-chip ${activeCompany === "Todas" ? "active" : ""}" data-dashboard-company="Todas">
      <strong>Consolidado</strong>
    </button>
    ${companies
      .map(
        (company) => `<button class="company-chip dashboard-company-chip logo-chip ${activeCompany === company.key ? "active" : ""}" data-dashboard-company="${company.key}">
          ${companyLogo(company.key)}
        </button>`,
      )
      .join("")}
  </div>`;
}

function companySwitcher(activeCompany, actionName, consolidatedLabel = "") {
  return `<div class="company-switcher dashboard-company-switcher">
    <button class="company-chip dashboard-company-chip ${activeCompany === "Todas" ? "active" : ""}" data-${actionName}="Todas">
      <strong>Consolidado</strong>
      ${consolidatedLabel ? `<span>${consolidatedLabel}</span>` : ""}
    </button>
    ${companies
      .map(
        (company) => `<button class="company-chip dashboard-company-chip logo-chip ${activeCompany === company.key ? "active" : ""}" data-${actionName}="${company.key}">
          ${companyLogo(company.key)}
        </button>`,
      )
      .join("")}
  </div>`;
}

function lockedCompanyIndicator(companyKey) {
  return `<div class="company-switcher dashboard-company-switcher">
    <div class="company-chip dashboard-company-chip logo-chip locked-company">
      ${companyLogo(companyKey || "Prodelar")}
    </div>
  </div>`;
}

function metric(label, value, detail, icon, page = "portal") {
  const targetPage = page || "portal";
  return `<div class="card metric clickable" data-page="${targetPage}"><div class="label"><span>${label}</span><span>${icon}</span></div><strong>${value}</strong><small>${detail}</small></div>`;
}

function vacationMetric(label, value, detail, filter, icon) {
  const active = (state.vacationStatusFilter || "all") === filter ? "active" : "";
  return `<button class="card metric clickable metric-button ${active}" type="button" data-vacation-filter="${filter}"><div class="label"><span>${label}</span><span>${icon}</span></div><strong>${value}</strong><small>${detail}</small></button>`;
}

function employeesPage() {
  const statusFilter = state.employeeStatusFilter || "Ativo";
  const queryKey = normalizeText(state.query);
  const statusKey = normalizeText(statusFilter);
  const companyRows = indexedByCompany(dataIndex.employeesByCompany, state.company, employees);
  const filtered = companyRows.filter((item) => {
    const matchesQuery = !queryKey || item._search.includes(queryKey);
    const matchesStatus = statusFilter === "Todos" || item._statusKey === statusKey;
    return matchesQuery && matchesStatus;
  });
  const { visibleRows, hiddenCount } = limitedRows("employees", filtered);
  const statusOptions = ["Ativo", "Inativo", "Afastado", "Desligado", "Todos"];
  const statusCounts = statusOptions.reduce((acc, option) => {
    if (option === "Todos") {
      acc[option] = companyRows.length;
      return acc;
    }
    acc[option] = companyRows.filter((item) => item.status === option).length;
    return acc;
  }, {});
  const activeLeaderChoices = employees
    .filter((item) => item.status === "Ativo")
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return `
    ${companySwitcher(state.company, "employee-company")}
    <div class="card employee-filter-panel">
      <div>
        <h2>Colaboradores</h2>
        <p>Por padrão a lista mostra apenas ativos. Inativos ficam separados e aparecem somente no filtro próprio.</p>
      </div>
      <div class="employee-filter-grid">
        <label class="employee-control employee-search-control">
          <span>Buscar</span>
          <input id="search" value="${state.query}" placeholder="Nome, cargo, setor ou empresa" />
        </label>
        <label class="employee-control">
          <span>Status</span>
          <select id="employee-status-filter">
            ${statusOptions.map((status) => `<option value="${status}" ${statusFilter === status ? "selected" : ""}>${status} (${statusCounts[status] || 0})</option>`).join("")}
          </select>
        </label>
        <button class="btn primary employee-new-button" data-action="new-employee">+ Novo colaborador</button>
      </div>
    </div>
    ${state.formMessage ? `<div class="notice form-notice"><strong>Retorno</strong><p>${state.formMessage}</p></div>` : ""}
    <div class="card table-wrap">
      <table>
        <thead><tr><th>Colaborador</th><th>Empresa</th><th>Setor</th><th>Cargo</th><th>Líder</th><th>Férias</th><th>Banco</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>
          ${
            filtered.length
              ? visibleRows
                  .map((e) => {
                    const isEditing = state.employeeEditId === e.id;
                    const leaderOptions = activeLeaderChoices
                      .filter((item) => item.id !== e.id)
                      .map((leader) => `<option value="${leader.dbId || leader.id}" ${normalizeText(e.manager) === normalizeText(leader.name) ? "selected" : ""}>${leader.name}</option>`)
                      .join("");
                    return `<tr>
                <td class="name-cell">
                  ${
                    isEditing
                      ? `<input class="employee-cell-input employee-name-input" data-employee-field="${e.id}:name" value="${escapeHtml(e.name)}" />`
                      : `<strong>${e.name}</strong>`
                  }
                  <span>${e.id} · admissão ${e.admission}</span>
                </td>
                <td>
                  ${
                    isEditing
                      ? `<select class="select employee-cell-input" data-employee-field="${e.id}:company">
                          ${["Prodelar", "Colmob", "Servimec"].map((company) => `<option value="${company}" ${normalizeText(e.company) === normalizeText(company) ? "selected" : ""}>${company}</option>`).join("")}
                        </select>`
                      : e.company
                  }
                </td>
                <td>
                  ${
                    isEditing
                      ? `<input class="employee-cell-input" data-employee-field="${e.id}:department" value="${escapeHtml(e.department)}" />`
                      : e.department
                  }
                </td>
                <td>
                  ${
                    isEditing
                      ? `<input class="employee-cell-input" data-employee-field="${e.id}:role" value="${escapeHtml(e.role)}" />`
                      : e.role
                  }
                </td>
                <td>
                  ${
                    isEditing
                      ? `<select class="select employee-cell-input employee-leader-select" data-employee-field="${e.id}:leader">
                          <option value="">Sem líder</option>
                          ${leaderOptions}
                        </select>`
                      : e.manager
                  }
                </td>
                <td>${e.vacation}</td><td>${statusPill(e.timeBank)}</td>
                <td>
                  ${
                    isEditing
                      ? `<select class="select compact-select" data-employee-status-select="${e.id}">
                          ${["Ativo", "Inativo", "Afastado", "Desligado"].map((status) => `<option value="${status}" ${e.status === status ? "selected" : ""}>${status}</option>`).join("")}
                        </select>`
                      : statusPill(e.status)
                  }
                </td>
                <td>
                  <div class="employee-row-actions">
                    ${
                      isEditing
                        ? `<button class="btn small primary" data-employee-save="${e.id}">Salvar</button>
                           <button class="btn small" data-employee-edit-cancel="${e.id}">Cancelar</button>`
                        : `<button class="btn small" data-employee="${e.id}">Abrir</button>
                           <button class="btn small" data-employee-edit="${e.id}">Editar</button>`
                    }
                  </div>
                </td>
              </tr>`;
                  })
                  .join("")
              : `<tr><td colspan="9"><div class="empty small-empty">Nenhum colaborador ${statusFilter === "Todos" ? "" : statusFilter.toLowerCase()} encontrado neste filtro.</div></td></tr>`
          }
        </tbody>
      </table>
      ${showMoreButton("employees", hiddenCount)}
    </div>`;
}

function employeeDetailPage() {
  const employee = employees.find((item) => item.id === state.selectedEmployeeId || item.dbId === state.selectedEmployeeId) || employees[0];
  if (!employee) {
    return `<div class="empty">Nenhum colaborador carregado ainda.</div>`;
  }
  const initials = employee.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  const tabs = [
    ["ficha", "Ficha"],
    ["documentos", "Documentos"],
    ["historico", "Histórico"],
    ["admissao", "Admissão"],
    ["ferias", "Férias"],
    ["ponto", "Ponto"],
    ["pacote", "Pacote mensal"],
  ];

  return `
    <button class="btn back" data-page="employees">← Voltar para colaboradores</button>
    <div class="profile card pad detail-profile">
      <div><div class="avatar">${initials}</div></div>
      <div>
        <div class="section-title">
          <div><h2>${employee.name}</h2><p>${employee.id} · ${employee.company} · ${employee.department}</p></div>
          ${statusPill(employee.status)}
        </div>
        <div class="field-grid">
          <div class="field"><label>Empresa</label><strong>${employee.company}</strong></div>
          <div class="field"><label>Cargo</label><strong>${employee.role}</strong></div>
          <div class="field"><label>Líder</label><strong>${employee.manager}</strong></div>
          <div class="field"><label>Admissão</label><strong>${employee.admission}</strong></div>
          <div class="field"><label>Férias</label><strong>${employee.vacation}</strong></div>
          <div class="field"><label>Banco de horas</label><strong>${employee.timeBank}</strong></div>
        </div>
      </div>
    </div>
    <div class="tabs">
      ${tabs
        .map(
          ([id, label]) =>
            `<button class="tab ${state.detailTab === id ? "active" : ""}" data-detail-tab="${id}">${label}</button>`,
        )
        .join("")}
    </div>
    ${employeeDetailTab(employee)}
  `;
}

function employeeDetailTab(employee) {
  const renderers = {
    ficha: () => employeeFicha(employee),
    documentos: () => employeeDocuments(employee),
    historico: () => employeeHistory(employee),
    admissao: () => employeeAdmission(employee),
    ferias: () => employeeVacation(employee),
    ponto: () => employeeTime(employee),
    pacote: () => employeeAccounting(employee),
  };
  return (renderers[state.detailTab] || renderers.ficha)();
}

function employeeFicha(employee) {
  const card = employee.registrationCard || registrationCards.find((item) => item.employee_code === employee.id);
  const cardFields = card
    ? `
          <div class="field"><label>CPF</label><strong>${card.cpf || "Não lido"}</strong></div>
          <div class="field"><label>PIS/PASEP</label><strong>${card.pis_pasep || "Não lido"}</strong></div>
          <div class="field"><label>CBO</label><strong>${card.cbo || "Não lido"}</strong></div>
          <div class="field"><label>Salário base</label><strong>${card.base_salary || "Restrito RH"}</strong></div>
          <div class="field"><label>Ficha importada</label><strong>${card.source_file || "Arquivo local"}</strong></div>
          <div class="field"><label>Páginas</label><strong>${(card.source_pages || []).join(", ") || "Não informado"}</strong></div>`
    : "";
  return `
    <div class="grid two">
      <div class="card pad">
        <div class="section-title"><div><h2>Ficha funcional</h2><p>Resumo consultável pelo RH e liderança autorizada</p></div></div>
        <div class="field-grid">
          <div class="field"><label>Código</label><strong>${employee.id}</strong></div>
          <div class="field"><label>Nome</label><strong>${employee.name}</strong></div>
          <div class="field"><label>Status</label><strong>${employee.status}</strong></div>
          <div class="field"><label>Setor</label><strong>${employee.department}</strong></div>
          <div class="field"><label>Jornada</label><strong>44h semanais</strong></div>
          <div class="field"><label>Contrato</label><strong>CLT</strong></div>
          ${cardFields}
        </div>
      </div>
      <div class="card pad">
        <div class="notice"><strong>Regra de privacidade aplicada</strong><p>Esta visão de líder não mostra salário, contracheque, rescisão, ASO, advertência ou documentos pessoais. Esses dados ficam restritos ao RH/diretoria.</p></div>
      </div>
    </div>`;
}

function employeeDocuments() {
  const docRows = [
    ["Solicitação de admissão", "Concluído", "Restrito RH"],
    ["ASO - Atestado de Saúde Ocupacional", "Apto", "Restrito jurídico"],
    ["Contrato de trabalho assinado", "Concluído", "Restrito jurídico"],
    ["Contracheque / holerite", "Disponível", "Privado do colaborador"],
  ];
  return `
    <div class="card pad">
      <div class="section-title"><div><h2>Documentos do fluxo</h2><p>Arquivos vinculados ao cadastro do colaborador</p></div></div>
      <div class="doc-list">
        ${docRows
          .map(([name, status, access]) => `<div class="doc"><div><strong>${name}</strong><span>${access}</span></div>${statusPill(status)}</div>`)
          .join("")}
      </div>
    </div>`;
}

function employeeAdmission() {
  return processPage("Admissão concluída", [
    ["Formulário aprovado pela diretoria", true],
    ["Documentação obrigatória completa", true],
    ["ASO recebido com status apto", true],
    ["Benefícios e cadastros internos", true],
    ["Contrato e termos assinados", true],
    ["Envio à contabilidade", true],
  ]);
}

function employeeVacation(employee) {
  const ownVacations = vacationRows.filter((row) => row[0] === employee.name);
  const rows = ownVacations.length
    ? ownVacations
    : [[employee.name, employee.company, "19/05/2026 a 18/05/2027", "18/04/2028", "01/06/2027 a 30/06/2027", "30"]];
  return `
    <div class="card table-wrap">
      <table>
        <thead><tr><th>Colaborador</th><th>Empresa</th><th>Período aquisitivo</th><th>Data limite</th><th>Previsão</th><th>Saldo dias</th></tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell, index) => `<td>${index === 4 ? statusPill(cell) : cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function employeeTime() {
  return `
    <div class="grid three">
      ${metric("Hora extra autorizada", "60 min", "Aprovada pelo gestor", "+")}
      ${metric("Ajuste de ponto", "08:00", "Entrada corrigida", "◴")}
      ${metric("Saldo mês", "1h", "Competência 05/2026", "↻")}
    </div>
    <div class="card pad" style="margin-top:16px">
      <div class="section-title"><div><h2>Fechamento validado</h2><p>Fluxo colaborador → gestor → DP</p></div>${statusPill("Concluído")}</div>
      <div class="checklist">
        <div class="check done"><span class="box">✓</span><strong>Colaborador solicitou ajuste</strong></div>
        <div class="check done"><span class="box">✓</span><strong>Gestor validou hora extra e ponto</strong></div>
        <div class="check done"><span class="box">✓</span><strong>DP consolidou e enviou à folha</strong></div>
      </div>
    </div>`;
}

function employeeAccounting(employee) {
  return `
    <div class="card pad">
      <div class="section-title"><div><h2>Pacote 05/2026</h2><p>${employee.company} · envio para contabilidade/Mastermaq</p></div>${statusPill("Enviado")}</div>
      <div class="checklist">
        <div class="check done"><span class="box">✓</span><strong>Admissão incluída no pacote</strong></div>
        <div class="check done"><span class="box">✓</span><strong>Documentos obrigatórios anexados</strong></div>
        <div class="check done"><span class="box">✓</span><strong>Férias e ponto conferidos</strong></div>
        <div class="check done"><span class="box">✓</span><strong>Data/hora de envio registrada</strong></div>
      </div>
    </div>`;
}

function employeeHistoryRows(employee) {
  const realTimelineRows = employeeTimelineEvents
    .filter((event) => event.employee_id && (event.employee_id === employee.dbId || event.employee_id === employee.id))
    .map((event) => ({
      date: event.created_at ? formatDateTime(event.created_at) : "Sem data",
      title: event.title || event.event_type || "Evento",
      detail: [event.module_name, event.description, event.status].filter(Boolean).join(" · ") || "Evento registrado no Supabase",
    }));
  const rows = [
    {
      date: employee.admission || "Sem data",
      title: "Admissão",
      detail: `${employee.role || "Cargo não informado"} · ${employee.department || "Setor não informado"}`,
    },
    {
      date: "Hoje",
      title: "Situação cadastral",
      detail: `${employee.status || "Sem status"} · ${employee.company || "Sem empresa"}`,
    },
    {
      date: "Hoje",
      title: "Férias",
      detail: employee.vacation || "Sem programação importada",
    },
    {
      date: "Hoje",
      title: "Ponto / banco de horas",
      detail: employee.timeBank || "Sem registro importado",
    },
  ];
  const peopleEvents = peopleControlEventStore()
    .filter((event) => isSamePerson(event.employeeName, employee.name))
    .map((event) => ({
      date: event.createdAt ? formatDate(event.createdAt) : "Hoje",
      title: event.moduleTitle || "Controle RH",
      detail: event.summary || "Evento lançado em Controles RH",
    }));
  return [...realTimelineRows, ...peopleEvents, ...rows];
}

function employeeHistory(employee) {
  const rows = employeeHistoryRows(employee);
  return `
    <div class="card pad">
      <div class="section-title"><div><h2>Histórico do colaborador</h2><p>Eventos funcionais, documentos, férias, ponto e controles lançados pelo RH</p></div>${statusPill(rows.length)}</div>
      <div class="timeline">
        ${rows.map((row) => `<div class="event"><time>${escapeHtml(row.date)}</time><div><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.detail)}</span></div></div>`).join("")}
      </div>
    </div>`;
}

function toolbar(extraAction = "") {
  return `
    <div class="toolbar">
      <label class="search">⌕ <input id="search" value="${state.query}" placeholder="Buscar por nome, cargo, setor ou empresa" /></label>
      <div class="actions">
        <select class="select" id="company">
          ${["Todas", "Prodelar", "Colmob", "Servimec"].map((c) => `<option ${state.company === c ? "selected" : ""}>${c}</option>`).join("")}
        </select>
        ${extraAction}
      </div>
    </div>`;
}

function employeeFormPage() {
  return `
    <button class="btn back" data-page="employees">← Voltar para colaboradores</button>
    <form class="card pad form-grid" id="employee-form">
      <div class="section-title full"><div><h2>Cadastro inicial</h2><p>Dados mínimos para ativar um colaborador no RH.</p></div></div>
      <label class="form-field"><span>Nome completo</span><input name="name" required placeholder="Ex.: Maria Silva" /></label>
      <label class="form-field"><span>Empresa</span><select name="company"><option>Prodelar</option><option>Colmob</option><option>Servimec</option></select></label>
      <label class="form-field"><span>Setor</span><input name="department" required placeholder="Ex.: Administrativo" /></label>
      <label class="form-field"><span>Cargo</span><input name="role" required placeholder="Ex.: Auxiliar Administrativo" /></label>
      <label class="form-field"><span>Líder</span><input name="manager" placeholder="Ex.: Diretoria" /></label>
      <label class="form-field"><span>Data de admissão</span><input name="admission" type="date" required /></label>
      <label class="form-field full"><span>Observações</span><textarea name="notes" rows="4" placeholder="Contexto da contratação, pendências ou origem do cadastro"></textarea></label>
      <div class="form-actions full">
        <button type="button" class="btn" data-page="employees">Cancelar</button>
        <button class="btn primary" type="submit">Salvar colaborador</button>
      </div>
    </form>`;
}

function requestFormPage() {
  const employee = currentEmployeeRecord();
  const isPortalSelfRequest = state.requestReturnPage === "portal";
  const isEmployee = currentUser.profile === "Colaborador" || isPortalSelfRequest;
  const canChooseCompany = ["RH", "Diretoria"].includes(currentUser.profile) && !isEmployee;
  const requestTypes = isEmployee ? employeeRequestTypes : requestTypesForCurrentUser();
  const requestCompanies = isEmployee ? companies.filter((company) => company.key === (employee?.company || currentUser.company)) : visibleCompaniesForRequest();
  const allowedEmployees = isEmployee ? (employee ? [employee] : []) : visibleEmployeesForRequest();
  const selectedCompany = isEmployee ? employee?.company || currentUser.company : state.requestCompany;
  const selectedType = state.prefillRequestType || requestTypes[0]?.[0] || "Solicitação";
  const formCopy = {
    Admissão: {
      title: "Requisição de admissão",
      subtitle: "Informe candidato, cargo, setor e justificativa para aprovação.",
      titlePlaceholder: "Ex.: Admitir auxiliar de montagem",
      descriptionPlaceholder: "Nome do candidato, cargo pretendido, setor, motivo da contratação e prazo desejado.",
    },
    Demissão: {
      title: "Requisição de desligamento",
      subtitle: "Selecione o colaborador e registre justificativa/contexto antes de enviar para aprovação.",
      titlePlaceholder: "Ex.: Solicitar desligamento de colaborador da equipe",
      descriptionPlaceholder: "Explique motivo, contexto, conversas realizadas, urgência e riscos operacionais.",
    },
    Ponto: {
      title: "Solicitação de ponto",
      subtitle: "Registre ajuste, aprovação ou devolutiva de fechamento mensal.",
      titlePlaceholder: "Ex.: Ajuste de ponto da equipe",
      descriptionPlaceholder: "Informe competência, colaborador/equipe, divergência e decisão esperada.",
    },
    Férias: {
      title: "Solicitação de férias",
      subtitle: "Registre pedido ou alteração de programação de férias.",
      titlePlaceholder: "Ex.: Alteração de programação de férias",
      descriptionPlaceholder: "Informe período desejado, justificativa e impacto na equipe.",
    },
  }[selectedType] || {
    title: "Nova solicitação",
    subtitle: isEmployee ? "Abra uma solicitação para o RH. Seus dados principais já vêm do cadastro." : "Escolha a empresa e o sistema aplica solicitante, equipe permitida e fluxo de aprovação.",
    titlePlaceholder: "Ex.: Programação de férias",
    descriptionPlaceholder: "Descreva a solicitação e anexos esperados",
  };
  return `
    <button class="btn back" data-page="${state.requestReturnPage || "requests"}">← Voltar</button>
    <form class="card pad form-grid" id="request-form">
      <div class="section-title full"><div><h2>${formCopy.title}</h2><p>${formCopy.subtitle}</p></div></div>
      <input type="hidden" name="company" value="${selectedCompany}" />
      <input type="hidden" name="requester" value="${currentUser.name}" />
      <input type="hidden" name="employee" value="${employee?.id || allowedEmployees[0]?.id || ""}" />
      <input type="hidden" name="owner" value="${immediateLeaderName()}" />
      <div class="form-field full ${canChooseCompany ? "" : "hidden-field"}">
        <span>Empresa da solicitação</span>
        <div class="company-picker">
          ${requestCompanies
            .map(
              (company) => `
            <button type="button" class="company-choice ${state.requestCompany === company.key ? "active" : ""}" data-request-company="${company.key}">
              ${companyLogo(company.key)}
              <small>${company.label}</small>
            </button>`,
            )
            .join("")}
        </div>
      </div>
      <div class="request-context full">
        <div><span>Solicitante</span><strong>${currentUser.name}</strong></div>
        <div><span>Área</span><strong>${currentUser.department}</strong></div>
        <div><span>Empresa</span><strong>${selectedCompany}</strong></div>
        <div><span>Líder imediato</span><strong>${immediateLeaderName()}</strong></div>
      </div>
      <label class="form-field"><span>Tipo permitido para este perfil</span><select name="type" id="request-type">${requestTypes.map(([label]) => `<option ${selectedType === label ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label class="form-field ${isEmployee ? "hidden-field" : ""}"><span>Colaborador/equipe permitida</span><select name="employee_select">${allowedEmployees.map((e) => `<option value="${e.id}">${e.name} · ${e.department}</option>`).join("")}</select></label>
      <label class="form-field ${isEmployee ? "hidden-field" : ""}"><span>Responsável atual</span><input name="owner_visible" readonly value="${currentUser.name}" /></label>
      <label class="form-field ${isEmployee ? "hidden-field" : ""}"><span>Próximo fluxo padrão</span><input readonly id="approval-route" value="${approvalRouteFor(requestTypes[0]?.[0] || "Solicitação")}" /></label>
      <label class="form-field full"><span>Título</span><input name="title" required placeholder="${formCopy.titlePlaceholder}" /></label>
      <label class="form-field full"><span>Descrição</span><textarea name="description" rows="5" required placeholder="${formCopy.descriptionPlaceholder}"></textarea></label>
      <label class="form-field full"><span>Anexo opcional</span><input name="attachment" type="file" /></label>
      <div class="form-actions full">
        <button type="button" class="btn" data-page="${state.requestReturnPage || "requests"}">Cancelar</button>
        <button class="btn primary" type="submit">Abrir solicitação</button>
      </div>
    </form>`;
}

function requestsPage() {
  const broadCompanyAccess = ["RH", "Diretoria"].includes(currentUser.profile);
  const activeCompany = broadCompanyAccess ? state.company || "Todas" : currentUser.company || state.company || "Todas";
  const visibleScopedRequests = visibleRequests();
  const scopedRequests = broadCompanyAccess
    ? indexedByCompany(dataIndex.requestsByCompany, activeCompany, visibleScopedRequests)
    : visibleScopedRequests;
  const scopedRequestKeys = new Set(scopedRequests.map(requestKey));
  const companyCounts = {
    Todas: visibleScopedRequests.length,
    ...Object.fromEntries(companies.map((company) => [company.key, indexedByCompany(dataIndex.requestsByCompany, company.key, visibleScopedRequests).length])),
  };
  return `
    ${state.formMessage ? `<div class="notice form-notice"><strong>Retorno</strong><p>${state.formMessage}</p></div>` : ""}
    ${broadCompanyAccess ? companySwitcher(activeCompany, "requests-company", "Todos os tickets") : lockedCompanyIndicator(activeCompany)}
    ${broadCompanyAccess ? `<div class="grid metrics compact-metrics" style="margin-top:16px">
        ${metric("Consolidado", companyCounts.Todas, "Solicitações visíveis neste perfil", "↻")}
        ${companies.map((company) => metric(company.label, companyCounts[company.key] || 0, "Solicitações da empresa", "•")).join("")}
      </div>` : ""}
    <div class="pipeline">
      ${requestLanes
        .map(
          (lane) => `
        <div class="lane lane-${lane.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}">
          <h3>${lane}</h3>
          <small>${requestLaneHints[lane]}</small>
          ${(dataIndex.requestsByStatus.get(normalizeText(lane)) || scopedRequests.filter((request) => request.status === lane))
            .filter((request) => scopedRequestKeys.has(requestKey(request)))
            .map(
              (request) => `
              <div class="ticket">
                <div class="ticket-head"><strong>${request.protocol}</strong>${companyLogo(request.company || "Prodelar")}</div>
                <span>${request.type} · ${request.employee}</span>
                <p>${request.title}</p>
                <div class="ticket-meta"><span>Com: ${request.owner}</span><span>Próximo: ${request.next || "Diretoria"}</span></div>
                <div class="request-flow-mini">
                  ${["Sup.", "Ger.", "Dir.", "RH"].map((step, index) => {
                    const full = ["Supervisor", "Gerência", "Diretoria", "RH"][index];
                    return `<span class="${request.owner === full ? "active" : ""}" title="${full}">${step}</span>`;
                  }).join("")}
                </div>
                ${statusPill(request.sla)}
                ${requestActions(request)}
              </div>`,
            )
            .join("") || `<div class="empty">Sem itens</div>`}
        </div>`,
        )
        .join("")}
    </div>`;
}

function requestActions(request) {
  if (request.status === "Concluído" || request.status === "Reprovado") {
    return `<div class="ticket-actions"><span class="muted">Fluxo encerrado</span></div>`;
  }
  if (!canActOnRequest(request)) {
    return `<div class="ticket-actions"><span class="muted">Acompanhamento: fora da sua alçada atual</span></div>`;
  }

  const workflow = request.status === "Aguardando esclarecimento" ? requestWorkflow["Aguardando esclarecimento"] : nextWorkflowFromRequest(request);
  if (request.status === "Aguardando esclarecimento") {
    return `
      <div class="ticket-actions">
        <button class="btn small primary" data-request-advance="${requestKey(request)}">${workflow.advanceLabel}</button>
      </div>`;
  }
  return `
    <div class="ticket-actions">
      <button class="btn small primary" data-request-advance="${requestKey(request)}">${workflow.advanceLabel}</button>
      <button class="btn small danger" data-request-reject="${requestKey(request)}">Reprovar</button>
      <button class="btn small warn" data-request-info="${requestKey(request)}">Pedir mais informações</button>
    </div>`;
}

function requestInvolvesCurrentUser(request) {
  if (isSamePerson(request.employee, currentUser.name)) return true;
  if (isLeaderNameMatch(request.owner, currentUser.name) || isLeaderNameMatch(request.next, currentUser.name)) return true;
  if ((request.workflowLog || []).some((entry) => isSamePerson(entry.by, currentUser.name))) return true;
  const teamNames = new Set(teamEmployeesForCurrentUser().map((employee) => normalizeText(employee.name)));
  return teamNames.has(normalizeText(request.employee));
}

function requestInvolvesUserWithTeam(request, teamNames) {
  if (isSamePerson(request.employee, currentUser.name)) return true;
  if (isLeaderNameMatch(request.owner, currentUser.name) || isLeaderNameMatch(request.next, currentUser.name)) return true;
  if ((request.workflowLog || []).some((entry) => isSamePerson(entry.by, currentUser.name))) return true;
  return teamNames.has(normalizeText(request.employee));
}

function canActOnRequest(request) {
  if (["Concluído", "Reprovado"].includes(request.status)) return false;
  if (request.status === "Aguardando esclarecimento") {
    return isSamePerson(request.owner, currentUser.name) || currentUser.profile === "RH";
  }
  if (request.status === "Em execução") {
    return currentUser.profile === "RH" && (request.owner === "RH" || isLeaderNameMatch(request.owner, currentUser.name));
  }
  if (currentUser.profile === "RH") return request.owner === "RH" || request.status === "Em execução";
  const ownerStep = workflowStepForOwner(request.owner);
  if (currentUser.profile === "Diretoria") return ownerStep === "Diretoria" || isSamePerson(request.owner, currentUser.name);
  if (currentUser.profile === "Gerente") return ownerStep === "Gerência" || isLeaderNameMatch(request.owner, currentUser.name);
  if (currentUser.profile === "Supervisor") return ownerStep === "Supervisor" || isLeaderNameMatch(request.owner, currentUser.name);
  return isSamePerson(request.owner, currentUser.name);
}

function visibleRequests() {
  return memoValue(`visible-requests:${currentUser.profile}:${normalizeText(currentUser.name)}:${requests.length}`, () => {
    if (currentUser.profile === "RH") return requests;
    if (currentUser.profile === "Diretoria") {
      return requests.filter((request) => request.owner === "Diretoria" || request.status === "Aguardando aprovação" || requestInvolvesCurrentUser(request));
    }
    const teamNames = new Set(teamEmployeesForCurrentUser().map((employee) => normalizeText(employee.name)));
    if (currentUser.profile === "Gerente") {
      return requests.filter((request) => request.owner === "Gerência" || isLeaderNameMatch(request.owner, currentUser.name) || requestInvolvesUserWithTeam(request, teamNames));
    }
    if (currentUser.profile === "Supervisor") {
      return requests.filter((request) => request.owner === "Supervisor" || isLeaderNameMatch(request.owner, currentUser.name) || requestInvolvesUserWithTeam(request, teamNames));
    }
    return requests.filter((request) => isSamePerson(request.employee, currentUser.name) || request.protocol.includes("LOCAL"));
  });
}

function documentsPage() {
  const rows = [
    ["Documentos pessoais", "CPF, RG, CTPS, comprovantes, certidões e dados cadastrais", "Colaborador + RH/Diretoria", "Supervisor e gerente não acessam"],
    ["Documentos admissionais", "Contrato, termos, vale-transporte, responsabilidade e demais formulários", "Colaborador + RH/Diretoria", "Liderança acompanha processo, sem abrir documento"],
    ["Documentos financeiros/salariais", "Contracheque, pensão alimentícia, dados bancários e informes", "Colaborador + RH/Diretoria", "Gerente vê contracheque da equipe por decisão da empresa; supervisor não vê"],
    ["Saúde ocupacional", "ASO e exames como controle documental", "RH/Diretoria", "Sem prontuário ou detalhe médico"],
    ["Atestados e afastamentos", "Arquivo, dias, retorno previsto e validação operacional", "Colaborador + RH", "Liderança vê apenas informação operacional necessária"],
    ["Treinamentos e certificados", "Certificado, validade e pendência", "Colaborador + RH/Diretoria", "Liderança vê pendência operacional da equipe"],
    ["EPI e equipamentos", "Entrega, devolução e termo", "RH/Diretoria", "Liderança acompanha pendência sem documento sensível"],
    ["Comunicados", "Mural, ciência e leitura confirmada", "Todos dentro do escopo", "Sem dados pessoais de terceiros"],
  ];
  return `
    <div class="notice form-notice"><strong>Google Workspace preparado</strong><p>Arquivos pesados ficam no Google Drive/Drive Compartilhado. O Supabase guarda somente metadados: colaborador, competência, tipo, sensibilidade, drive_file_id, drive_folder_id, link, status e auditoria. Modo atual: teste, sem envio real.</p></div>
    <div class="grid metrics" style="margin-bottom:16px">
      ${metric("Armazenamento", "Google Drive", "PDFs, imagens e anexos pesados", "⇪", "documents")}
      ${metric("Banco operacional", "Supabase", "Metadados, permissões e histórico", "☷", "documents")}
      ${metric("Privacidade", "Privado", "Link público só por exceção controlada", "▣", "documents")}
      ${metric("Modo atual", workspaceStorage?.mode === "production" ? "Produção" : "Teste", "Sem upload real até configurar credenciais", "◎", "documents")}
    </div>
    <div class="card table-wrap">
      <table>
        <thead><tr><th>Grupo documental</th><th>Exemplos</th><th>Quem acessa</th><th>Bloqueio / observação</th></tr></thead>
        <tbody>
          ${rows.map(([group, examples, access, block]) => `<tr><td><strong>${group}</strong></td><td>${examples}</td><td>${access}</td><td>${block}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="grid two" style="margin-top:16px">
      <div class="notice"><strong>Supervisor</strong><p>Não acessa documentação pessoal, termos, dados bancários, dados médicos nem contracheques. Acompanha apenas férias, ponto e pendências operacionais da equipe.</p></div>
      <div class="notice"><strong>Gerente</strong><p>Segue as mesmas restrições de documentos pessoais. Por decisão da empresa, pode consultar contracheques da equipe/estrutura, com registro de acesso.</p></div>
    </div>`;
}

function vacationsPage() {
  const employeeView = currentUser.profile === "Colaborador" || (state.vacationScope === "self" && state.vacationScopeSource === "portal");
  const ownEmployee = currentEmployeeRecord();
  const ownEmployeeName = ownEmployee?.name || currentUser.name;
  const supervisorView = currentUser.profile === "Supervisor";
  const managerView = currentUser.profile === "Gerente";
  const showCompanySwitcher = ["RH", "Diretoria"].includes(currentUser.profile);
  const scopedTeam = teamEmployeesForCurrentUser().map((employee) => employee._nameKey || normalizeText(employee.name));
  const vacationQuery = normalizeText(state.vacationQuery);
  const ownEmployeeKey = normalizeText(ownEmployeeName);
  const baseRows = employeeView
    ? indexedByEmployee(dataIndex.vacationsByEmployee, ownEmployeeName, vacationForecasts, (row) => row.employee_name)
    : indexedByCompany(dataIndex.vacationsByCompany, state.company, vacationForecasts, (row) => row.company_key || row.source_company || row.company || row.company_name);
  const profileRows = baseRows.filter((row) => {
    const employeeKey = row._employeeKey || normalizeText(row.employee_name);
    const matchesVacationQuery = !vacationQuery || (row._search || "").includes(vacationQuery);
    const matchesProfile =
      (employeeView && employeeKey === ownEmployeeKey) ||
      (!employeeView && (supervisorView || managerView) && scopedTeam.includes(employeeKey)) ||
      (!employeeView && !supervisorView && !managerView);
    return matchesVacationQuery && matchesProfile;
  });
  const today = new Date().toISOString().slice(0, 10);
  const withoutSchedule = (row) => !row.planned_start || !row.planned_end;
  const submittedForReview = (row) => row.submitted_for_review || row.status === "waiting_review";
  const expiredLimit = (row) => row.legal_limit_date && !row.submitted_for_review && row.legal_limit_date < today;
  const activeVacationFilter = state.vacationStatusFilter || "all";
  const rows = profileRows.filter((row) => {
    if (activeVacationFilter === "withoutSchedule") return withoutSchedule(row);
    if (activeVacationFilter === "submitted") return submittedForReview(row);
    if (activeVacationFilter === "expired") return expiredLimit(row);
    return true;
  });
  const pending = profileRows.filter(withoutSchedule).length;
  const submitted = profileRows.filter(submittedForReview).length;
  const expired = profileRows.filter(expiredLimit).length;
  const showMetrics = !employeeView && !supervisorView;
  const showCompany = !supervisorView;
  const vacationListKey = employeeView ? "vacationsSelf" : "vacations";
  const { visibleRows, hiddenCount } = limitedRows(vacationListKey, rows);

  return `
    ${showCompanySwitcher ? companySwitcher(state.company, "vacation-company") : ""}
    ${state.vacationMessage ? `<div class="notice form-notice"><strong>Retorno</strong><p>${state.vacationMessage}</p></div>` : ""}
    ${showMetrics ? `<div class="grid metrics">
      ${vacationMetric("Colaboradores", profileRows.length, "Base atual importada", "all", "◷")}
      ${vacationMetric("Sem programação", pending, "Gestor precisa indicar datas", "withoutSchedule", "!")}
      ${vacationMetric("Submetidos", submitted, "Aguardando avaliação", "submitted", "↻")}
      ${vacationMetric("Limite vencido", expired, "Exige atenção do RH", "expired", "×")}
    </div>` : ""}
    <div class="notice muted-notice" style="${showMetrics ? "margin-top:16px" : ""}"><strong>${employeeView ? "Minhas férias" : supervisorView ? "Programação de férias da equipe" : "Uso correto da tela"}</strong><p>${employeeView ? "Aqui você consulta a previsão e o histórico dos seus períodos. Quando o RH liberar pedido de férias, a solicitação será aberta pelo menu Solicitações." : supervisorView ? "Edite somente quando necessário, respeitando a data limite. Ao submeter, a programação segue para a próxima aprovação e o colaborador visualiza a alteração no portal." : "Este menu é para gestores consultarem e ajustarem a programação da equipe. Solicitar férias continua no menu Solicitações, em Nova solicitação, tipo Férias. Aqui não existe exclusão: o gestor edita datas e submete para avaliação."}</p></div>
    ${employeeView ? "" : `
      <div class="card pad filter-panel" style="margin-top:16px">
        <div class="field">
          <label>Filtrar por colaborador</label>
          <input id="vacation-search" type="search" value="${state.vacationQuery}" placeholder="Digite o nome, matrícula ou setor" autocomplete="off" />
        </div>
      </div>`}
    <div class="card table-wrap" style="margin-top:16px">
      <table>
        <thead><tr><th>Colaborador</th>${showCompany ? "<th>Empresa / setor</th>" : "<th>Setor</th>"}<th>Período aquisitivo</th><th>Data limite</th><th>Programação</th><th>Saldo</th><th>Status</th>${employeeView ? "" : "<th>Ação</th>"}</tr></thead>
        <tbody>${visibleRows
          .map(
            (row) => {
              const key = vacationKey(row);
              const submittedStatus = row.submitted_for_review || row.status === "waiting_review";
              const limit = row.legal_limit_date || "";
              const plannedEndInvalid = row.planned_end && limit && row.planned_end > limit;
              return `<tr class="${plannedEndInvalid ? "row-danger" : ""}">
                <td class="name-cell"><strong>${row.employee_name || "-"}</strong><span>${row.employee_code || "-"} · ${row.position || "Sem cargo"}</span></td>
                <td>${showCompany ? `${companyLogo(row.company_key || row.source_company || "Prodelar")}<br>` : ""}<span class="muted">${row.department || "Sem setor"}</span></td>
                <td>${row.acquisition_label || formatDateRange(row.acquisition_start, row.acquisition_end)}</td>
                <td><strong>${row.legal_limit_label || formatDate(row.legal_limit_date)}</strong></td>
                <td>
                  <div class="vacation-edit ${employeeView ? "readonly-edit" : ""}">
                    <input type="date" data-vacation-start="${key}" value="${dateInputValue(row.planned_start)}" max="${limit}" ${employeeView ? "disabled" : ""} />
                    <input type="date" data-vacation-end="${key}" value="${dateInputValue(row.planned_end)}" max="${limit}" ${employeeView ? "disabled" : ""} />
                  </div>
                  ${employeeView ? "" : `<small>${plannedEndInvalid ? "Data final ultrapassa o limite." : "A data final deve respeitar o limite."}</small>`}
                </td>
                <td>${row.balance_days ?? "-"}</td>
                <td>${statusPill(submittedStatus ? "Aguardando avaliação" : row.planned_start ? "Editado" : "Pendente")}</td>
                ${employeeView ? "" : `<td><div class="row-actions"><button class="btn small" data-vacation-edit="${key}">Editar</button><button class="btn small primary" data-vacation-submit="${key}">Aprovar</button></div></td>`}
              </tr>`;
            },
          )
          .join("") || `<tr><td colspan="${employeeView ? "7" : "8"}"><div class="empty">${employeeView ? `Nenhuma previsão de férias importada para ${ownEmployeeName}. Cadastre a pessoa como colaboradora real ou importe a previsão mensal vinculada ao nome/matrícula dela.` : "Nenhuma previsão carregada. Use Rotinas RH para importar os PDFs de férias."}</div></td></tr>`}</tbody>
      </table>
      ${showMoreButton(vacationListKey, hiddenCount)}
    </div>`;
}

function hrVacationPayrollPage(sourceRows) {
  const rows = sourceRows
    .filter((row) => row.planned_start && row.planned_end)
    .filter((row) => !isOperationalActionDone("vacationPayroll", vacationKey(row)));
  const history = operationalActionsByScope("vacationPayroll", 15);

  return `
    ${state.vacationMessage ? `<div class="notice form-notice"><strong>Retorno</strong><p>${state.vacationMessage}</p></div>` : ""}
    <div class="card pad">
      <div class="section-title"><div><h2>Férias aprovadas para implantação</h2><p>Programações liberadas pela liderança para o RH lançar na folha/Mastermaq.</p></div></div>
      <div class="request-flow process-flow process-flow-dynamic">
        <span>Liderança aprova</span><span>RH confere</span><span>Enviado para folha</span><span>Arquivo</span>
      </div>
    </div>
    <div class="card table-wrap" style="margin-top:16px">
      <div class="section-title table-title"><div><h2>Fila de férias</h2><p>Cada colaborador sai da fila quando o RH registrar que foi enviado para a folha.</p></div>${statusPill(rows.length)}</div>
      <table>
        <thead><tr><th>Colaborador</th><th>Empresa / setor</th><th>Período aquisitivo</th><th>Programação</th><th>Limite</th><th>Ação</th></tr></thead>
        <tbody>
          ${
            rows
              .map((row) => {
                const key = vacationKey(row);
                return `<tr>
                  <td class="name-cell"><strong>${row.employee_name || "-"}</strong><span>${row.employee_code || "-"} · ${row.position || "Sem cargo"}</span></td>
                  <td>${companyLogo(row.company_key || row.source_company || "Prodelar")}<br><span class="muted">${row.department || "Sem setor"}</span></td>
                  <td>${row.acquisition_label || formatDateRange(row.acquisition_start, row.acquisition_end)}</td>
                  <td><strong>${formatDateRange(row.planned_start, row.planned_end)}</strong></td>
                  <td>${row.legal_limit_label || formatDate(row.legal_limit_date)}</td>
                  <td><button class="btn small primary" data-operational-scope="vacationPayroll" data-operational-key="${key}" data-operational-label="${row.employee_name} foi marcado como enviado para a folha e saiu da fila de férias.">Enviado para folha</button></td>
                </tr>`;
              })
              .join("") || `<tr><td colspan="6"><div class="empty">Nenhuma férias aguardando envio para folha.</div></td></tr>`
          }
        </tbody>
      </table>
    </div>
    <div class="card table-wrap" style="margin-top:16px">
      <div class="section-title table-title"><div><h2>Últimos eventos</h2><p>Registro dos últimos envios de férias para a folha. Apenas consulta, sem desfazer.</p></div>${statusPill(history.length)}</div>
      <table>
        <thead><tr><th>Evento</th><th>Responsável</th><th>Data/hora</th></tr></thead>
        <tbody>
          ${
            history
              .map(
                (item) => `<tr>
                  <td><strong>${item.label || "Férias enviadas para folha"}</strong></td>
                  <td>${item.by || "RH"}</td>
                  <td>${formatDateTime(item.at)}</td>
                </tr>`,
              )
              .join("") || `<tr><td colspan="3"><div class="empty">Nenhum envio registrado ainda.</div></td></tr>`
          }
        </tbody>
      </table>
    </div>`;
}

function baseVacationsPage() {
  const activeCompany = state.company || "Todas";
  const vacationQuery = normalizeText(state.vacationQuery);
  const rows = indexedByCompany(dataIndex.vacationsByCompany, activeCompany, vacationForecasts, (row) => row.company_key || row.source_company || row.company || "").filter((row) => {
    const matchesQuery = !vacationQuery || (row._search || "").includes(vacationQuery);
    return matchesQuery;
  });
  const { visibleRows, hiddenCount } = limitedRows("baseVacations", rows);
  const changedRows = rows.filter((row) => row.status === "edited" || (row.submitted_for_review === false && row.planned_start && row.planned_end));

  return `
    ${state.vacationMessage ? `<div class="notice form-notice"><strong>Retorno</strong><p>${state.vacationMessage}</p></div>` : ""}
    <div class="company-switcher dashboard-company-switcher">
      <button class="company-chip dashboard-company-chip ${activeCompany === "Todas" ? "active" : ""}" data-base-vacation-company="Todas"><strong>Consolidado</strong></button>
      ${companies.map((company) => `<button class="company-chip dashboard-company-chip logo-chip ${activeCompany === company.key ? "active" : ""}" data-base-vacation-company="${company.key}">${companyLogo(company.key)}</button>`).join("")}
    </div>
    <div class="grid metrics" style="margin-top:16px">
      ${metric("Períodos", rows.length, "Base filtrada", "◷")}
      ${metric("Alterados", changedRows.length, "Aguardando envio", "!")}
      ${metric("Empresas", activeCompany === "Todas" ? companies.length : 1, activeCompany === "Todas" ? "Consolidado" : activeCompany, "◎")}
      ${metric("Regra", "Editar e enviar", "Gera aprovação da liderança", "↻")}
    </div>
    <div class="card pad filter-panel" style="margin-top:16px">
      <div class="section-title">
        <div><h2>Base completa de férias</h2><p>Consulta e manutenção do RH. Importação mensal atualiza a base; somente mudanças reais devem ser enviadas para aprovação.</p></div>
        <button class="btn small primary" data-vacation-send-all>Enviar todos alterados</button>
      </div>
      <div class="vacation-filter-row">
        <label class="search vacation-search-field">⌕
          <input id="vacation-search" type="search" value="${state.vacationQuery}" placeholder="Buscar por nome, matrícula, cargo ou setor" autocomplete="off" />
        </label>
      </div>
    </div>
    <div class="card table-wrap" style="margin-top:16px">
      <table>
        <thead><tr><th>Colaborador</th><th>Empresa / setor</th><th>Período aquisitivo</th><th>Data limite</th><th>Programação</th><th>Saldo</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>
          ${
            visibleRows
              .map((row) => {
                const key = vacationKey(row);
                const limit = row.legal_limit_date || "";
                const isChanged = row.status === "edited" || (row.submitted_for_review === false && row.planned_start && row.planned_end);
                return `<tr>
                  <td class="name-cell"><strong>${row.employee_name || "-"}</strong><span>${row.employee_code || "-"} · ${row.position || "Sem cargo"}</span></td>
                  <td>${companyLogo(row.company_key || row.source_company || "Prodelar")}<br><span class="muted">${row.department || "Sem setor"}</span></td>
                  <td>${row.acquisition_label || formatDateRange(row.acquisition_start, row.acquisition_end)}</td>
                  <td><strong>${row.legal_limit_label || formatDate(row.legal_limit_date)}</strong></td>
                  <td><div class="vacation-edit"><input type="date" data-vacation-start="${key}" value="${dateInputValue(row.planned_start)}" max="${limit}" /><input type="date" data-vacation-end="${key}" value="${dateInputValue(row.planned_end)}" max="${limit}" /></div></td>
                  <td>${row.balance_days ?? "-"}</td>
                  <td>${statusPill(row.submitted_for_review ? "Enviado" : isChanged ? "Alterado" : row.planned_start ? "Programado" : "Pendente")}</td>
                  <td><button class="btn small primary" data-vacation-submit="${key}" ${isChanged ? "" : "disabled"}>Enviar</button></td>
                </tr>`;
              })
              .join("") || `<tr><td colspan="8"><div class="empty">Nenhuma previsão de férias encontrada.</div></td></tr>`
          }
        </tbody>
      </table>
      ${showMoreButton("baseVacations", hiddenCount)}
    </div>`;
}

function admissionPage() {
  return leaderProcessRequestPage({
    type: "Admissão",
    title: "Requisição de admissão",
    description: "Solicite a contratação de um novo colaborador para a equipe.",
    fields: [
      ["Nome do candidato / novo colaborador", "Ex.: Maria Silva"],
      ["Cargo pretendido", "Ex.: Auxiliar de montagem"],
      ["Setor / equipe", currentUser.department || "Ex.: Montagem"],
      ["Justificativa", "Explique a necessidade da contratação"],
    ],
  });
}

function terminationPage() {
  return leaderProcessRequestPage({
    type: "Demissão",
    title: "Requisição de desligamento",
    description: "Solicite o desligamento de um colaborador da equipe, com justificativa e contexto.",
    fields: [
      ["Colaborador", "Selecione na solicitação a pessoa da equipe"],
      ["Motivo do desligamento", "Ex.: desempenho, quadro, conduta, término de contrato"],
      ["Contexto do pedido", "Explique o que aconteceu e o que já foi conversado"],
      ["Risco ou urgência", "Informe prazo, impacto operacional ou situação sensível"],
    ],
  });
}

function hrProcessQueuePage({ type, title, description, scope, actionLabel, emptyLabel }) {
  const rows = visibleRequests()
    .filter((request) => request.type === type)
    .filter((request) => !["Concluído", "Reprovado"].includes(request.status))
    .filter((request) => request.owner === "RH" || request.status === "Em execução")
    .filter((request) => !isOperationalActionDone(scope, requestKey(request)));

  return `
    ${state.formMessage ? `<div class="notice form-notice"><strong>Retorno</strong><p>${state.formMessage}</p></div>` : ""}
    <div class="card pad">
      <div class="section-title"><div><h2>${title}</h2><p>${description}</p></div></div>
      <div class="request-flow process-flow process-flow-dynamic">
        <span>Solicitação aprovada</span><span>RH analisa</span><span>Rotina temporária</span><span>Execução e arquivo</span>
      </div>
    </div>
    <div class="card table-wrap" style="margin-top:16px">
      <div class="section-title table-title"><div><h2>Fila de ${type.toLowerCase()}</h2><p>Ao transformar em rotina temporária, o item sai desta mesa e entra no acompanhamento do RH.</p></div>${statusPill(rows.length)}</div>
      <table>
        <thead><tr><th>Protocolo</th><th>Empresa</th><th>Solicitante / colaborador</th><th>Pedido</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>
          ${
            rows
              .map(
                (request) => `<tr>
                  <td><strong>${request.protocol}</strong></td>
                  <td>${companyLogo(request.company || "Prodelar")}</td>
                  <td><strong>${request.employee || request.requester || "Sem colaborador"}</strong><br><span class="muted">Com ${request.owner}</span></td>
                  <td><strong>${request.title}</strong><br><span class="muted">${request.description || "Sem descrição complementar"}</span></td>
                  <td>${statusPill(request.status)}</td>
                  <td><button class="btn small primary" data-operational-scope="${scope}" data-operational-key="${requestKey(request)}" data-operational-label="${request.protocol} foi transformado em rotina temporária de ${type.toLowerCase()} e saiu da fila operacional.">${actionLabel}</button></td>
                </tr>`,
              )
              .join("") || `<tr><td colspan="6"><div class="empty">${emptyLabel}</div></td></tr>`
          }
        </tbody>
      </table>
    </div>`;
}

function processFlowForCurrentProfile(type) {
  if (currentUser.profile === "Supervisor") return [`Supervisor solicita`, "Gerente valida", "Diretoria aprova", "RH executa"];
  if (currentUser.profile === "Gerente") return [`Gerente solicita`, "Diretoria aprova", "RH executa"];
  if (currentUser.profile === "Diretoria") return [`Diretoria solicita`, "RH executa"];
  if (currentUser.profile === "RH") return [`RH solicita`, "Diretoria valida", "RH executa"];
  return ["Colaborador solicita", "Liderança valida", "RH executa"];
}

function leaderProcessRequestPage({ type, title, description, fields }) {
  const steps = processFlowForCurrentProfile(type);
  const manager = directManagerForLeader(currentUser.name) || "Sem gerente definido";
  const canChooseCompany = ["RH", "Diretoria"].includes(currentUser.profile);
  const selectedCompany = canChooseCompany ? state.requestCompany || companies[0].key : currentUser.company;
  const teamOptions = visibleEmployeesForRequest().filter((employee) => matchesCompanyFilter(employee.company, selectedCompany));
  const isTermination = type === "Demissão";
  return `
    <div class="card pad">
      <div class="section-title"><div><h2>Fluxo da ${type.toLowerCase()}</h2><p>${steps.join(" → ")}.</p></div>${statusPill("Processo")}</div>
      <div class="request-flow process-flow process-flow-dynamic">
        ${steps.map((step) => `<span>${step}</span>`).join("")}
      </div>
    </div>
    <div class="card pad" style="margin-top:16px">
      <div class="section-title"><div><h2>${title}</h2><p>${description}</p></div>${statusPill("Requisição")}</div>
      <form id="request-form" class="process-request-form">
        <input type="hidden" name="type" value="${type}" />
        ${canChooseCompany ? "" : `<input type="hidden" name="company" value="${selectedCompany}" />`}
        <div class="request-context">
          <div><span>Requerente</span><strong>${currentUser.name}</strong></div>
          ${
            canChooseCompany
              ? `<label class="inline-context-field"><span>Empresa</span><select name="company">${companies.map((company) => `<option value="${company.key}" ${selectedCompany === company.key ? "selected" : ""}>${company.label}</option>`).join("")}</select></label>`
              : `<div><span>Empresa</span><strong>${selectedCompany}</strong></div>`
          }
          <div><span>Área / função</span><strong>${currentUser.department} · ${currentUser.role || currentUser.profile}</strong></div>
          <div><span>Gerência</span><strong>${manager}</strong></div>
        </div>
        <div class="field-grid" style="margin-top:16px">
          ${
            isTermination
              ? `<label class="form-field"><span>Colaborador</span><select name="employee_select" required>${teamOptions.map((employee) => `<option value="${employee.id}">${employee.name} · ${employee.department}</option>`).join("")}</select></label>
                 <label class="form-field"><span>Motivo do desligamento</span><input name="title" required placeholder="Ex.: desempenho, quadro, conduta ou término de contrato" /></label>
                 <label class="form-field"><span>Risco ou urgência</span><input name="risk" placeholder="Informe prazo, impacto operacional ou situação sensível" /></label>
                 <label class="form-field full"><span>Contexto do pedido</span><textarea name="description" required placeholder="Explique o que aconteceu, o que já foi conversado e a justificativa do desligamento"></textarea></label>`
              : `<label class="form-field"><span>Nome do candidato / novo colaborador</span><input name="title" required placeholder="Ex.: Maria Silva" /></label>
                 <label class="form-field"><span>Cargo pretendido</span><input name="intended_role" required placeholder="Ex.: Auxiliar de montagem" /></label>
                 <label class="form-field"><span>Setor / equipe</span><input name="team" required value="${currentUser.department || ""}" placeholder="Ex.: Montagem" /></label>
                 <label class="form-field full"><span>Justificativa</span><textarea name="description" required placeholder="Explique a necessidade da contratação"></textarea></label>`
          }
        </div>
        <div class="form-actions" style="margin-top:16px">
          <button class="btn primary" type="submit">Enviar requisição</button>
        </div>
      </form>
    </div>`;
}

function processPage(title, items) {
  return `
    <div class="grid two">
      <div class="card pad">
        <div class="section-title"><div><h2>${title}</h2><p>O sistema bloqueia avanço quando houver pendência crítica.</p></div></div>
        <div class="checklist">
          ${items
            .map(
              ([label, done]) =>
                `<div class="check ${done ? "done" : "blocked"}"><span class="box">${done ? "✓" : "!"}</span><strong>${label}</strong></div>`,
            )
            .join("")}
        </div>
      </div>
      <div class="card pad">
        <div class="section-title"><div><h2>Rastreabilidade</h2><p>Registro para defesa operacional e jurídica</p></div></div>
        ${timeline()}
      </div>
    </div>`;
}

function pointFlowNextOwner(profile = currentUser.profile) {
  if (profile === "Supervisor") return "Gerente";
  if (profile === "Gerente") return "Diretoria";
  if (profile === "Diretoria") return "RH";
  if (profile === "RH") return "Concluído";
  return "Supervisor";
}

function pointAdjustmentNextOwner() {
  if (currentUser.profile === "Supervisor") return directManagerForLeader(currentUser.name) || "Diretoria";
  if (currentUser.profile === "Gerente") return "Diretoria";
  if (currentUser.profile === "Diretoria") return "RH";
  if (currentUser.profile === "RH") return "Concluído";
  return immediateLeaderName();
}

function pointRecordKey(employee, competence = "Maio/2026") {
  return `${normalizeText(currentUser.company)}|${normalizeText(employee.id || employee.name)}|${competence}`;
}

function pointPdfFileName(employee, index = 0) {
  return `ponto-${normalizeText(employee.name).toLowerCase().replace(/[^a-z0-9]+/g, "-") || index}.pdf`;
}

function pdfSafeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()\\]/g, " ")
    .slice(0, 90);
}

function simplePdfDataUrl(lines) {
  const contentLines = lines.map((line) => `(${pdfSafeText(line)}) Tj T*`).join("\n");
  const stream = `BT\n/F1 12 Tf\n72 760 Td\n14 TL\n${contentLines}\nET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return `data:application/pdf;base64,${btoa(pdf)}`;
}

function pointPdfHref(row) {
  return simplePdfDataUrl([
    "Espelho de ponto - demonstracao",
    `Colaborador: ${row.employee.name}`,
    `Setor: ${row.employee.department || "Sem setor"}`,
    `Competencia: ${row.competence}`,
    "Arquivo real sera substituido quando o RH importar o fechamento mensal.",
  ]);
}

function pointStore() {
  return JSON.parse(localStorage.getItem("rhMonthlyPointFlow") || "{}");
}

function savePointStore(store) {
  localStorage.setItem("rhMonthlyPointFlow", JSON.stringify(store));
}

function monthlyPointPendingRows() {
  const store = pointStore();
  const competence = "Maio/2026";

  if (currentUser.profile === "Supervisor") {
    const team = teamEmployeesForCurrentUser().filter((employee) => !isSamePerson(employee.name, currentUser.name));
    if (!team.length) return [];
    return team
      .filter((employee) => !isSamePerson(employee.name, currentUser.name))
      .slice(0, 6)
      .map((employee, index) => ({
        key: pointRecordKey(employee, competence),
        employee,
        company: employee.company || currentUser.company,
        competence,
        month: "Maio",
        file: pointPdfFileName(employee, index),
        status: "Aguardando revisão",
      }))
      .filter((row) => !store[row.key]);
  }

  return Object.values(store)
    .filter((record) => record.owner === currentUser.profile && record.status === "pending")
    .map((record) => ({
      key: record.key,
      employee: {
        name: record.employeeName,
        department: record.department,
        role: record.role,
        id: record.employeeId,
      },
      company: record.company || "",
      competence: record.competence,
      month: record.month,
      file: record.file,
      status: "Aguardando revisão",
      previousComment: record.lastComment,
    }));
}

function monthlyPointHistoryRows() {
  return Object.values(pointStore())
    .filter((record) => (record.history || []).some((entry) => entry.byProfile === currentUser.profile))
    .flatMap((record) =>
      (record.history || [])
        .filter((entry) => entry.byProfile === currentUser.profile)
        .map((entry) => ({ ...record, event: entry })),
    )
    .sort((a, b) => String(b.event.at).localeCompare(String(a.event.at)))
    .slice(0, 8);
}

function submitMonthlyPoint(key) {
  const pending = monthlyPointPendingRows().find((row) => row.key === key);
  if (!pending) return;
  const comment = document.querySelector(`[data-point-comment="${CSS.escape(key)}"]`)?.value?.trim() || "";
  const store = pointStore();
  const existing = store[key] || {
    key,
    employeeId: pending.employee.id,
    employeeName: pending.employee.name,
    department: pending.employee.department,
    role: pending.employee.role,
    company: currentUser.company,
    month: pending.month,
    competence: pending.competence,
    file: pending.file,
    history: [],
  };
  const nextOwner = pointFlowNextOwner(currentUser.profile);
  const event = {
    by: currentUser.name,
    byProfile: currentUser.profile,
    action: nextOwner === "Concluído" ? "Executado pelo RH" : `Enviado para ${nextOwner}`,
    comment,
    at: new Date().toISOString(),
  };
  store[key] = {
    ...existing,
    owner: nextOwner,
    status: nextOwner === "Concluído" ? "completed" : "pending",
    lastComment: comment,
    history: [...(existing.history || []), event],
  };
  savePointStore(store);
  state.pointMessage = `${pending.employee.name} saiu do fechamento mensal e foi registrado em últimas movimentações.`;
  renderPage();
}

function pointAdjustmentStore() {
  return JSON.parse(localStorage.getItem("rhPointAdjustments") || "[]");
}

function savePointAdjustmentStore(records) {
  localStorage.setItem("rhPointAdjustments", JSON.stringify(records));
}

function teamPointAdjustmentsForCurrentUser() {
  return pointAdjustmentStore()
    .filter((record) => !["Concluído", "Reprovado"].includes(record.status))
    .filter((record) => isLeaderNameMatch(record.owner, currentUser.name) || (currentUser.profile === "RH" && record.owner === "RH"))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function updatePointAdjustment(id, patch) {
  const updated = pointAdjustmentStore().map((record) => {
    if (record.id !== id) return record;
    return {
      ...record,
      ...patch,
      history: [
        ...(record.history || []),
        {
          by: currentUser.name,
          byProfile: currentUser.profile,
          at: new Date().toISOString(),
          action: patch.status || "Movimentação",
          owner: patch.owner || record.owner,
        },
      ],
    };
  });
  savePointAdjustmentStore(updated);
  state.pointMessage = "Ajuste de ponto movimentado.";
  renderPage();
}

function operationalActionStore() {
  return JSON.parse(localStorage.getItem("rhOperationalActions") || "{}");
}

function saveOperationalActionStore(store) {
  localStorage.setItem("rhOperationalActions", JSON.stringify(store));
}

function operationalActionKey(scope, key) {
  return `${scope}::${key}`;
}

function isOperationalActionDone(scope, key) {
  return Boolean(operationalActionStore()[operationalActionKey(scope, key)]);
}

function operationalActionsByScope(scope, limit = 15) {
  return Object.entries(operationalActionStore())
    .filter(([key]) => key.startsWith(`${scope}::`))
    .map(([key, item]) => ({
      key,
      recordKey: key.slice(`${scope}::`.length),
      ...item,
    }))
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
    .slice(0, limit);
}

function markOperationalAction(scope, key, label) {
  const store = operationalActionStore();
  store[operationalActionKey(scope, key)] = {
    label,
    by: currentUser.name,
    at: new Date().toISOString(),
  };
  saveOperationalActionStore(store);
  state.formMessage = label;
  state.vacationMessage = label;
  state.pointMessage = label;
  renderPage();
}

function ownPointAdjustments() {
  return pointAdjustmentStore()
    .filter((record) => isSamePerson(record.employeeName, currentUser.name))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function handlePointAdjustmentSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const pointDate = normalizeDateInputValue(form.point_date.value);
  const record = {
    id: `PONTO-${Date.now()}`,
    employeeName: currentUser.name,
    company: currentUser.company,
    department: currentUser.department,
    date: pointDate,
    reason: form.point_reason.value,
    entry: form.entry_time.value,
    intervalOut: form.interval_out_time.value,
    intervalReturn: form.interval_return_time.value,
    dayOut: form.day_out_time.value,
    comment: form.point_comment.value.trim(),
    status: "Enviado para liderança",
    owner: immediateLeaderName(),
    createdAt: new Date().toISOString(),
  };
  savePointAdjustmentStore([record, ...pointAdjustmentStore()].slice(0, 100));
  void recordEmployeeTimeline({
    eventType: "ponto",
    moduleName: "ponto",
    title: "Ajuste de ponto solicitado",
    description: `${formatDate(pointDate)} · ${record.reason}`,
    status: record.status,
    metadata: {
      point_adjustment_id: record.id,
      entry: record.entry,
      interval_out: record.intervalOut,
      interval_return: record.intervalReturn,
      day_out: record.dayOut,
    },
  });
  state.pointAdjustmentOpen = false;
  state.pointMessage = "Solicitação de ajuste de ponto enviada para a liderança.";
  renderPage();
}

function formatTimeInputValue(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function formatDateInputValue(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function normalizeDateInputValue(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 8) return value;
  return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
}

function selfPointApprovalFlow() {
  const authorization = immediateLeaderName();
  const validation = directManagerForLeader(authorization) || (authorization === "Diretoria" ? "Diretoria" : "Diretoria");
  return [
    ["Solicitante", currentUser.name],
    ["Autorização", authorization],
    ["Validação", validation],
    ["Execução", "RH"],
  ];
}

function pointAdjustmentForm() {
  return `
    <form id="point-adjustment-form" class="card pad" style="margin-top:16px">
      <div class="section-title">
        <div><h2>Novo ajuste de ponto</h2><p>Preencha somente os horários que precisam ser corrigidos.</p></div>
        ${statusPill("Solicitação")}
      </div>
      <div class="form-grid point-adjustment-grid">
        <label class="form-field"><span>Data</span><input class="date-mask" name="point_date" type="text" inputmode="numeric" maxlength="10" placeholder="20/05/2026" autocomplete="off" required /></label>
        <label class="form-field"><span>Motivo</span>
          <select name="point_reason" required>
            <option value="">Selecione</option>
            <option>Esquecimento de marcação</option>
            <option>Atraso justificado</option>
            <option>Ausência justificada</option>
            <option>Erro no relógio / sistema</option>
            <option>Atestado / afastamento</option>
            <option>Outro motivo</option>
          </select>
        </label>
        <label class="form-field"><span>Alterar entrada</span><input class="time-mask" name="entry_time" type="text" inputmode="numeric" maxlength="5" placeholder="10:20" autocomplete="off" /></label>
        <label class="form-field"><span>Alterar saída para intervalo</span><input class="time-mask" name="interval_out_time" type="text" inputmode="numeric" maxlength="5" placeholder="12:00" autocomplete="off" /></label>
        <label class="form-field"><span>Alterar retorno do intervalo</span><input class="time-mask" name="interval_return_time" type="text" inputmode="numeric" maxlength="5" placeholder="13:00" autocomplete="off" /></label>
        <label class="form-field"><span>Alterar saída do dia</span><input class="time-mask" name="day_out_time" type="text" inputmode="numeric" maxlength="5" placeholder="18:00" autocomplete="off" /></label>
        <label class="form-field full"><span>Comentário / justificativa</span><textarea name="point_comment" rows="4" placeholder="Explique o que aconteceu, se necessário"></textarea></label>
        <div class="form-actions full">
          <button class="btn" type="button" data-action="close-point-adjustment">Cancelar</button>
          <button class="btn primary" type="submit">Enviar ajuste</button>
        </div>
      </div>
    </form>`;
}

function timePage() {
  if (currentUser.profile === "Colaborador" || state.pointScope === "self") {
    const ownPointRequests = ownPointAdjustments();
    const approvalFlow = selfPointApprovalFlow();
    return `
      ${state.pointMessage ? `<div class="notice form-notice"><strong>Retorno</strong><p>${state.pointMessage}</p></div>` : ""}
      <div class="card pad">
        <div class="section-title">
          <div><h2>Solicitação de ajuste de ponto</h2><p>Use este atalho para justificar esquecimento, atraso, ausência ou marcação divergente.</p></div>
          ${statusPill("Ponto")}
        </div>
        <div class="request-context">
          ${approvalFlow.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}
        </div>
        <div class="form-actions" style="margin-top:16px">
          <button class="btn primary" data-action="open-point-adjustment">+ Nova solicitação de ajuste</button>
        </div>
      </div>
      ${state.pointAdjustmentOpen ? pointAdjustmentForm() : ""}
      <div class="card table-wrap" style="margin-top:16px">
        <div class="section-title table-title"><div><h2>Histórico de solicitações</h2><p>Acompanhe os ajustes já enviados para não duplicar pedido.</p></div></div>
        <table>
          <thead><tr><th>Protocolo</th><th>Data</th><th>Motivo</th><th>Ajustes solicitados</th><th>Status</th><th>Com quem está</th></tr></thead>
          <tbody>
            ${
              ownPointRequests
                .map((request) => {
                  const changes = [
                    request.entry ? `Entrada ${request.entry}` : "",
                    request.intervalOut ? `Saída intervalo ${request.intervalOut}` : "",
                    request.intervalReturn ? `Retorno intervalo ${request.intervalReturn}` : "",
                    request.dayOut ? `Saída do dia ${request.dayOut}` : "",
                  ].filter(Boolean).join(" · ") || "Sem horário informado";
                  return `<tr><td><strong>${request.id}</strong></td><td>${formatDate(request.date)}</td><td>${request.reason}</td><td>${changes}${request.comment ? `<br><span class="muted">${request.comment}</span>` : ""}</td><td>${statusPill(request.status)}</td><td>${request.owner}</td></tr>`;
                })
                .join("") || `<tr><td colspan="6"><div class="empty">Nenhuma solicitação de ajuste de ponto enviada ainda.</div></td></tr>`
            }
          </tbody>
        </table>
      </div>`;
  }
  const showCompanySwitcher = ["RH", "Diretoria"].includes(currentUser.profile);
  const pointRequests = visibleRequests()
    .filter((request) => ["Ponto", "Ajuste de ponto"].includes(request.type))
    .filter((request) => !showCompanySwitcher || matchesCompanyFilter(request.company, state.company));
  const directPointAdjustments = teamPointAdjustmentsForCurrentUser()
    .filter((request) => !showCompanySwitcher || matchesCompanyFilter(request.company, state.company));
  const actionablePointRequests = pointRequests
    .filter((request) => canActOnRequest(request))
    .filter((request) => !isOperationalActionDone("pointExecution", requestKey(request)));
  const pointQueueCount = directPointAdjustments.length + actionablePointRequests.length;
  const monthlyPointRows = monthlyPointPendingRows()
    .filter((row) => !showCompanySwitcher || matchesCompanyFilter(row.company || row.employee?.company, state.company));
  const historyRows = monthlyPointHistoryRows();
  const pointQueueHelp =
    currentUser.profile === "RH"
      ? "Solicitações de ajuste de ponto que precisam de tratamento."
      : "Solicitações de ponto da sua alçada.";
  return `
    ${showCompanySwitcher ? companySwitcher(state.company, "point-company") : ""}
    ${state.pointMessage ? `<div class="notice form-notice"><strong>Retorno</strong><p>${state.pointMessage}</p></div>` : ""}
    <div class="card pad">
      <div class="section-title"><div><h2>Fluxo do ajuste de ponto</h2></div>${statusPill("Processo")}</div>
      <div class="request-flow process-flow">
        <span>Colaborador solicita</span><span>Supervisor aprova</span><span>Gerente valida</span><span>RH executa</span>
      </div>
    </div>
    <div class="card pad" style="margin-top:16px">
        <div class="section-title"><div><h2>Fila de ponto</h2><p>${pointQueueHelp}</p></div>${statusPill(pointQueueCount)}</div>
        <div class="checklist">
          ${
            directPointAdjustments
              .map((request) => {
                const changes = [
                  request.entry ? `Entrada ${request.entry}` : "",
                  request.intervalOut ? `Saída intervalo ${request.intervalOut}` : "",
                  request.intervalReturn ? `Retorno intervalo ${request.intervalReturn}` : "",
                  request.dayOut ? `Saída do dia ${request.dayOut}` : "",
                ].filter(Boolean).join(" · ") || "Sem horário informado";
                return `<div class="check blocked"><span class="box">!</span><div><strong>${request.id} · ${request.employeeName}</strong><br><span>${formatDate(request.date)} · ${request.reason} · ${changes}</span>${request.comment ? `<br><span>${request.comment}</span>` : ""}
                  <div class="ticket-actions">
                    <button class="btn small primary" data-point-adjustment-approve="${request.id}">Aprovar</button>
                    <button class="btn small danger" data-point-adjustment-reject="${request.id}">Reprovar</button>
                    <button class="btn small warn" data-point-adjustment-info="${request.id}">Pedir mais informações</button>
                    <span class="muted">Próximo: ${pointAdjustmentNextOwner()}</span>
                  </div>
                </div></div>`;
              })
              .join("") ||
            actionablePointRequests
              .map((request) => `<div class="check blocked"><span class="box">!</span><div><strong>${request.protocol} · ${request.title}</strong><br><span>${request.employee} · ${request.status}</span>${
                currentUser.profile === "RH"
                  ? `<div class="ticket-actions"><button class="btn small primary" data-operational-scope="pointExecution" data-operational-key="${requestKey(request)}" data-operational-label="${request.protocol} foi marcado como enviado para o ponto e saiu da fila operacional.">Enviado para o ponto</button></div>`
                  : requestActions(request)
              }</div></div>`)
              .join("") || `<div class="check done"><span class="box">✓</span><div><strong>Nenhum ajuste aguardando sua decisão</strong><br><span>Quando colaborador ou RH enviar ponto, aparece aqui.</span></div></div>`
          }
        </div>
    </div>
    <div class="card pad point-monthly-card" style="margin-top:16px">
      <div class="section-title"><div><h2>Fechamento mensal recebido do RH</h2><p>Validação da equipe antes da folha.</p></div>${statusPill(monthlyPointRows.length ? "Aguardando envio" : "Sem pendências")}</div>
      <div class="point-monthly-list">
        ${
          monthlyPointRows
            .map(
              (row) => {
                const { key, employee, month, competence, file, status, previousComment } = row;
                return `<div class="point-monthly-item">
                <div class="name-cell"><strong>${employee.name}</strong><span>${employee.department || "Sem setor"} · ${employee.role || "Sem cargo"}</span></div>
                <div class="point-meta"><span>Mês</span><strong>${month}</strong></div>
                <div class="point-meta"><span>Competência</span><strong>${competence}</strong></div>
                <div class="point-file"><a class="btn small" href="${pointPdfHref(row)}" target="_blank" rel="noopener">Visualizar ponto</a></div>
                <div>${statusPill(status)}</div>
                <textarea class="inline-comment point-comment" data-point-comment="${key}" placeholder="Comentários para a próxima alçada ou para o RH">${previousComment || ""}</textarea>
                <button class="btn primary" data-point-submit="${key}">Enviar</button>
              </div>`;
              },
            )
            .join("") || `<div class="empty">Nenhum fechamento mensal aguardando envio nesta alçada.</div>`
        }
      </div>
    </div>
    <div class="card pad" style="margin-top:16px">
      <div class="section-title"><div><h2>Últimas movimentações de ponto</h2><p>Histórico imutável do fechamento mensal enviado por esta alçada.</p></div></div>
      <div class="checklist">
        ${
          historyRows
            .map((record) => `<div class="check done"><span class="box">✓</span><div><strong>${record.employeeName} · ${record.competence}</strong><br><span>${record.event.action} por ${record.event.by}${record.event.comment ? ` · ${record.event.comment}` : ""}</span></div></div>`)
            .join("") || `<div class="empty">Sem movimentações recentes de ponto.</div>`
        }
      </div>
    </div>`;
}

function portalPage() {
  const employeeName = currentUser.name;
  const employeeCompany = currentUser.company;
  const employeeDepartment = currentUser.department;
  const openOwnRequests = requests.filter((request) => isSamePerson(request.employee, currentUser.name) && !["Concluído", "Reprovado"].includes(request.status)).length;
  return `
    <div class="profile card pad">
      <div><div class="avatar">${employeeName.split(" ").slice(0, 2).map((part) => part[0]).join("")}</div></div>
      <div>
        <div class="section-title"><div><h2>${employeeName}</h2><p>Portal do colaborador · visão ${currentUser.profile}</p></div>${statusPill("Ativo")}</div>
        <div class="field-grid">
          <div class="field"><label>Empresa</label><strong>${employeeCompany}</strong></div>
          <div class="field"><label>Área</label><strong>${employeeDepartment}</strong></div>
          <div class="field"><label>Gestor imediato</label><strong>${immediateLeaderName()}</strong></div>
          <div class="field"><label>Solicitações em aberto</label><strong>${openOwnRequests}</strong></div>
        </div>
      </div>
    </div>
    <div class="grid three" style="margin-top:16px">
      <div class="card pad"><div class="section-title"><div><h2>Minhas solicitações</h2><p>Acompanhar pedidos e abrir novo chamado</p></div></div><button class="btn primary" data-action="new-request">+ Nova solicitação</button></div>
      <div class="card pad"><div class="section-title"><div><h2>Meu ponto</h2><p>Solicitar ajuste e acompanhar histórico</p></div></div><button class="btn" data-action="open-self-time">Abrir ajuste no ponto</button></div>
      <div class="card pad"><div class="section-title"><div><h2>Meus contracheques</h2><p>Consulta por mês e ano com anexo para baixar</p></div></div><button class="btn" data-action="open-self-paystubs">Abrir contracheques</button></div>
      <div class="card pad"><div class="section-title"><div><h2>Minhas férias</h2><p>Consulta baseada na base geral de férias</p></div></div><button class="btn" data-action="open-self-vacations">Abrir férias</button></div>
    </div>
    <div class="card pad" style="margin-top:16px">
      <div class="section-title"><div><h2>Comunicados do RH</h2><p>Informativos periódicos para colaboradores</p></div>${statusPill("Informativo")}</div>
      <div class="timeline">
        <div class="event"><time>Hoje</time><div><strong>Atualização de documentos</strong><span>Confira seus dados cadastrais e mantenha telefone e endereço atualizados.</span></div></div>
        <div class="event"><time>Maio/2026</time><div><strong>Previsão de férias importada</strong><span>A base mensal foi atualizada. Consulte seus períodos em Minhas férias.</span></div></div>
      </div>
    </div>`;
}

function accountingPage() {
  return `
    <div class="grid two">
      <div class="card pad">
        <div class="section-title"><div><h2>Competência Março/2026</h2><p>Pacote operacional para contabilidade/Mastermaq</p></div>${statusPill("Em revisão")}</div>
        <div class="checklist">
          <div class="check done"><span class="box">✓</span><strong>Admissões e demissões conferidas</strong></div>
          <div class="check done"><span class="box">✓</span><strong>Horas extras e banco de horas importados</strong></div>
          <div class="check blocked"><span class="box">!</span><strong>Férias pendentes de aprovação</strong></div>
          <div class="check done"><span class="box">✓</span><strong>Rubricas de folha mapeadas para conferência</strong></div>
        </div>
      </div>
      <div class="card pad">
        <div class="section-title"><div><h2>Antes de fechar</h2><p>Atalho para rotina mensal do RH</p></div>${statusPill("Checklist")}</div>
        <div class="checklist compact-checklist">
          <div class="check"><span class="box">1</span><div><strong>Subir fichas funcionais</strong><br><span>Quando houver nova base ou admissão.</span></div></div>
          <div class="check"><span class="box">2</span><div><strong>Subir previsão de férias</strong><br><span>Atualizar as três empresas antes de cobrar líderes.</span></div></div>
          <div class="check"><span class="box">3</span><div><strong>Subir contracheques</strong><br><span>Separar PDF único em arquivos por colaborador.</span></div></div>
          <div class="check"><span class="box">4</span><div><strong>Revisar pendências</strong><br><span>Conferir pasta de pendências e importações rejeitadas.</span></div></div>
        </div>
      </div>
    </div>`;
}

function rhRoutinesPage() {
  const routines = monthlyRhRoutines();
  const directorMode = currentUser.profile === "Diretoria";
  const activeCompany = state.company || "Todas";
  const routineStatus = rhRoutineStatusStore();
  const competence = routineCompetence();
  const competenceLabel = routineCompetenceLabel(competence);
  const companyKeys = companies.map((company) => company.key);
  const countDone = (companyKey) => routines.filter((routine) => routineStatus[rhRoutineKey(companyKey, routine.key, competence)]?.done).length;
  const totalSlots = routines.length * companyKeys.length;
  const totalDone = companyKeys.reduce((sum, companyKey) => sum + countDone(companyKey), 0);
  const activeDone = activeCompany === "Todas" ? totalDone : countDone(activeCompany);
  const activeTotal = activeCompany === "Todas" ? totalSlots : routines.length;
  const pending = Math.max(activeTotal - activeDone, 0);
  const taskRows = rhTasksForCompany(activeCompany);
  const openTasks = taskRows.filter((task) => task.status !== "done").length;

  return `
    <div class="routine-period-bar">
      <div>
        <span>Competência</span>
        <strong>${competenceLabel}</strong>
      </div>
      <div class="period-actions">
        <button class="btn small" data-routine-competence="prev">‹ Mês anterior</button>
        <button class="btn small" data-routine-competence="current">Mês atual</button>
        <button class="btn small" data-routine-competence="next">Próximo mês ›</button>
      </div>
    </div>
    <div class="grid metrics">
      ${metric("Rotinas / importações", `${activeDone} de ${activeTotal}`, activeCompany === "Todas" ? `Consolidado · ${competenceLabel}` : `${activeCompany} · ${competenceLabel}`, "☑")}
      ${metric("Entradas com arquivo", routines.filter((routine) => routine.hasFile).length, "Itens que aceitam arrastar/selecionar", "⇩")}
      ${metric("Pendências", pending, "Ainda sem check neste ciclo", "!")}
      ${metric("Tarefas abertas", openTasks, "Rotina independente do RH", "□")}
    </div>
    <div class="company-switcher dashboard-company-switcher" style="margin-top:16px">
      <button class="company-chip dashboard-company-chip ${activeCompany === "Todas" ? "active" : ""}" data-routine-company="Todas"><strong>Consolidado</strong></button>
      ${companies.map((company) => `<button class="company-chip dashboard-company-chip logo-chip ${activeCompany === company.key ? "active" : ""}" data-routine-company="${company.key}">${companyLogo(company.key)}</button>`).join("")}
    </div>
    <div class="rh-routines-layout">
      <div>
        ${activeCompany === "Todas" ? consolidatedRoutineTable(routines, routineStatus, directorMode, competence) : companyRoutineChecklist(routines, routineStatus, activeCompany, directorMode, competence)}
        ${rhTasksPanel(taskRows, directorMode)}
        ${routineHistoryPanel(routineStatus, routines, activeCompany, competence)}
      </div>
      ${temporaryRoutinesPanel(directorMode)}
    </div>
    <div class="notice" style="margin-top:16px"><strong>Regra do sistema</strong><p>Essas rotinas são tarefas do RH. A diretoria acompanha status e riscos, sem assumir execução operacional nem acessar anexos sensíveis sem necessidade.</p></div>`;
}

function monthlyRhRoutines() {
  return [
    { key: "registration_cards", title: "Fichas funcionais", folder: "production/fichas-funcionais/entrada", hasFile: true, description: "Importar fichas cadastrais e atualizar colaboradores sem duplicar por CPF." },
    { key: "vacation_forecasts", title: "Previsão de férias", folder: "production/ferias/entrada", hasFile: true, description: "Substituir a base mensal e manter histórico por período aquisitivo." },
    { key: "vacation_changes", title: "Alteração mensal de férias", folder: "Módulo Gestão de férias", hasFile: false, description: "Liberar alteração apenas para colaboradores autorizados e acompanhar aprovações." },
    { key: "paystubs", title: "Contracheques", folder: "production/contracheques/entrada", hasFile: true, description: "Separar PDF único, identificar colaborador e liberar acesso por escopo." },
    { key: "monthly_point", title: "Fechamento mensal de ponto", folder: "production/ponto/entrada", hasFile: true, description: "Enviar espelhos de ponto para liderança validar antes da folha." },
    { key: "gross_payroll", title: "Folha bruta", folder: "production/folha-bruta/entrada", hasFile: true, description: "Importar valor bruto, competência, FGTS e INSS para o dashboard." },
    { key: "accounting_package", title: "Pacote mensal para contabilidade", folder: "production/pacote-mensal", hasFile: true, description: "Conferir admissões, desligamentos, férias, ponto e registrar envio." },
    { key: "aso", title: "ASO e exames ocupacionais", folder: "production/aso/entrada", hasFile: true, description: "Controlar documento e vencimento, sem prontuário médico." },
    { key: "medical_leave", title: "Atestados e afastamentos", folder: "production/atestados/entrada", hasFile: true, description: "Validar arquivo, dias e retorno previsto." },
    { key: "training_equipment", title: "Treinamentos, EPI e equipamentos", folder: "production/treinamentos-epi/entrada", hasFile: true, description: "Registrar certificado, validade, entrega, devolução e termo." },
    { key: "communications", title: "Comunicados e benefícios", folder: "Central de e-mails / Mural RH", hasFile: false, description: "Publicar comunicado, acompanhar leitura e configurar benefícios permitidos." },
  ];
}

function rhRoutineStatusStore() {
  return JSON.parse(localStorage.getItem("rhRoutineStatus") || "{}");
}

function saveRhRoutineStatusStore(store) {
  localStorage.setItem("rhRoutineStatus", JSON.stringify(store));
}

function clearOldRoutineTestData() {
  const cleanupVersion = "20260522-routines-imports-merged";
  if (localStorage.getItem("rhRoutineCleanupVersion") === cleanupVersion) return;
  localStorage.removeItem("rhRoutineStatus");
  localStorage.setItem("rhRoutineCleanupVersion", cleanupVersion);
}

function temporaryRoutineClosedStore() {
  return JSON.parse(localStorage.getItem("rhTemporaryRoutineClosed") || "{}");
}

function saveTemporaryRoutineClosedStore(store) {
  localStorage.setItem("rhTemporaryRoutineClosed", JSON.stringify(store));
}

function rhTaskStore() {
  return safeJsonParse(localStorage.getItem("rhTasks"), []);
}

function saveRhTaskStore(tasks) {
  localStorage.setItem("rhTasks", JSON.stringify(tasks.slice(0, 200)));
}

function rhTasksForCompany(companyKey) {
  const statusFilter = state.rhTaskStatusFilter || "open";
  const typeFilter = state.rhTaskTypeFilter || "all";
  return rhTaskStore()
    .filter((task) => companyKey === "Todas" || task.company === companyKey)
    .filter((task) => (statusFilter === "all" ? true : statusFilter === "open" ? task.status !== "done" : task.status === statusFilter))
    .filter((task) => typeFilter === "all" || task.type === typeFilter)
    .sort((a, b) => String(a.status).localeCompare(String(b.status)) || String(a.dueDate || "").localeCompare(String(b.dueDate || "")));
}

function saveRhTask(form) {
  const data = new FormData(form);
  const tasks = rhTaskStore();
  tasks.unshift({
    id: `task-${Date.now()}`,
    title: String(data.get("title") || "").trim(),
    company: String(data.get("company") || state.company || "Todas"),
    type: String(data.get("type") || "general"),
    priority: String(data.get("priority") || "normal"),
    dueDate: String(data.get("dueDate") || ""),
    description: String(data.get("description") || "").trim(),
    status: "pending",
    createdBy: currentUser.name,
    createdAt: new Date().toISOString(),
  });
  saveRhTaskStore(tasks);
  state.rhTaskMessage = "Tarefa criada para acompanhamento do RH.";
  state.rhTaskEditId = "";
}

function updateRhTaskStatus(taskId, status) {
  const tasks = rhTaskStore().map((task) =>
    task.id === taskId
      ? { ...task, status, completedAt: status === "done" ? new Date().toISOString() : task.completedAt || null }
      : task,
  );
  saveRhTaskStore(tasks);
}

function updateRhTask(form, taskId) {
  const data = new FormData(form);
  const tasks = rhTaskStore().map((task) =>
    task.id === taskId
      ? {
          ...task,
          title: String(data.get("title") || "").trim(),
          company: String(data.get("company") || task.company || "Todas"),
          type: String(data.get("type") || task.type || "general"),
          priority: String(data.get("priority") || task.priority || "normal"),
          dueDate: String(data.get("dueDate") || ""),
          description: String(data.get("description") || "").trim(),
          updatedBy: currentUser.name,
          updatedAt: new Date().toISOString(),
        }
      : task,
  );
  saveRhTaskStore(tasks);
  state.rhTaskEditId = "";
  state.rhTaskMessage = "Tarefa atualizada.";
}

function rhTasksPanel(tasks, directorMode) {
  const companyOptions = ["Prodelar", "Colmob", "Servimec"];
  const typeOptions = [
    ["all", "Todos os tipos"],
    ["medical_certificate", "Atestado"],
    ["experience_contract", "Contrato de experiência"],
    ["document", "Documento"],
    ["payroll", "Folha"],
    ["general", "Outros controles"],
  ];
  const statusOptions = [
    ["open", "Abertas"],
    ["pending", "Pendentes"],
    ["in_progress", "Em execução"],
    ["done", "Concluídas"],
    ["all", "Todas"],
  ];
  return `<div class="card pad rh-tasks-panel" style="margin-top:16px">
    <div class="section-title"><div><h2>Tarefas do RH</h2><p>Controle independente para atestados, contratos de experiência e demais pendências operacionais.</p></div>${statusPill(tasks.filter((task) => task.status !== "done").length)}</div>
    ${state.rhTaskMessage ? `<div class="notice form-notice"><strong>Retorno</strong><p>${escapeHtml(state.rhTaskMessage)}</p></div>` : ""}
    <div class="routine-filter-row">
      <label><span>Status</span><select id="rh-task-status-filter">${statusOptions.map(([value, label]) => `<option value="${value}" ${state.rhTaskStatusFilter === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label><span>Tipo</span><select id="rh-task-type-filter">${typeOptions.map(([value, label]) => `<option value="${value}" ${state.rhTaskTypeFilter === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    </div>
    <form class="form-grid compact-task-form" data-rh-task-form>
      <label class="form-field"><span>Tarefa</span><input name="title" required placeholder="Ex.: Avaliar experiência de 60 dias" ${directorMode ? "disabled" : ""} /></label>
      <label class="form-field"><span>Empresa</span><select name="company" ${directorMode ? "disabled" : ""}>${companyOptions.map((company) => `<option ${state.company === company ? "selected" : ""}>${company}</option>`).join("")}</select></label>
      <label class="form-field"><span>Tipo</span><select name="type" ${directorMode ? "disabled" : ""}><option value="medical_certificate">Atestado</option><option value="experience_contract">Contrato de experiência</option><option value="document">Documento</option><option value="payroll">Folha</option><option value="general">Outros controles</option></select></label>
      <label class="form-field"><span>Prioridade</span><select name="priority" ${directorMode ? "disabled" : ""}><option value="normal">Normal</option><option value="high">Alta</option><option value="critical">Crítica</option><option value="low">Baixa</option></select></label>
      <label class="form-field"><span>Prazo</span><input name="dueDate" type="date" ${directorMode ? "disabled" : ""} /></label>
      <label class="form-field full"><span>Observação</span><textarea name="description" rows="2" placeholder="Contexto, responsável ou documento relacionado" ${directorMode ? "disabled" : ""}></textarea></label>
      <div class="form-actions full"><button class="btn primary" type="submit" ${directorMode ? "disabled" : ""}>Criar tarefa</button></div>
    </form>
    <div class="doc-list rh-task-list">
      ${
        tasks.length
          ? tasks.map((task) => rhTaskItem(task, directorMode, companyOptions, typeOptions)).join("")
          : `<div class="empty">Nenhuma tarefa criada para este filtro.</div>`
      }
    </div>
  </div>`;
}

function rhTaskItem(task, directorMode, companyOptions, typeOptions) {
  if (state.rhTaskEditId === task.id) {
    return `<form class="doc rh-task-item rh-task-edit" data-rh-task-edit-form="${task.id}">
      <label><span>Tarefa</span><input name="title" required value="${escapeHtml(task.title)}" ${directorMode ? "disabled" : ""} /></label>
      <label><span>Empresa</span><select name="company" ${directorMode ? "disabled" : ""}>${companyOptions.map((company) => `<option ${task.company === company ? "selected" : ""}>${company}</option>`).join("")}</select></label>
      <label><span>Tipo</span><select name="type" ${directorMode ? "disabled" : ""}>${typeOptions.filter(([value]) => value !== "all").map(([value, label]) => `<option value="${value}" ${task.type === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label><span>Prioridade</span><select name="priority" ${directorMode ? "disabled" : ""}>${["low", "normal", "high", "critical"].map((priority) => `<option value="${priority}" ${task.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}</select></label>
      <label><span>Prazo</span><input name="dueDate" type="date" value="${escapeHtml(task.dueDate || "")}" ${directorMode ? "disabled" : ""} /></label>
      <label class="full"><span>Observação</span><textarea name="description" rows="2" ${directorMode ? "disabled" : ""}>${escapeHtml(task.description || "")}</textarea></label>
      <div class="task-actions full">
        <button class="btn small primary" type="submit" ${directorMode ? "disabled" : ""}>Salvar</button>
        <button class="btn small" type="button" data-rh-task-edit-cancel>Cancelar</button>
      </div>
    </form>`;
  }
  return `<div class="doc rh-task-item">
    <div><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.company)} · ${escapeHtml(task.type)} · ${task.dueDate ? formatDate(task.dueDate) : "Sem prazo"} · ${escapeHtml(task.createdBy || "RH")}</span>${task.description ? `<br><span>${escapeHtml(task.description)}</span>` : ""}</div>
    <div class="task-actions">${statusPill(task.status === "done" ? "Concluído" : task.status === "in_progress" ? "Em execução" : "Pendente")}<button class="btn small" data-rh-task-edit="${task.id}" ${directorMode ? "disabled" : ""}>Editar</button><button class="btn small" data-rh-task-status="${task.id}" data-status="${task.status === "done" ? "pending" : "done"}" ${directorMode ? "disabled" : ""}>${task.status === "done" ? "Reabrir" : "Concluir"}</button></div>
  </div>`;
}

function temporaryRhRoutines() {
  const closed = temporaryRoutineClosedStore();
  return Object.entries(operationalActionStore())
    .filter(([key]) => key.startsWith("admissionRoutine::") || key.startsWith("terminationRoutine::"))
    .filter(([key]) => !closed[key])
    .map(([key, item]) => ({
      key,
      title: key.startsWith("admissionRoutine::") ? "Admissão" : "Demissão",
      detail: item.label || "Rotina temporária criada a partir de processo aprovado.",
      by: item.by || "RH",
      at: item.at ? formatDate(item.at) : "Sem data",
    }));
}

function rhRoutineKey(companyKey, routineKey, competence = routineCompetence()) {
  return `${competence}::${companyKey}::${routineKey}`;
}

function routineStatusCell(status) {
  if (!status?.done) {
    return `<div class="routine-status-cell"><span class="routine-state pending">×</span><span class="muted">${status?.error || "Pendente"}</span></div>`;
  }
  return `<div class="routine-status-cell"><span class="routine-state done">✓</span><span class="muted">${status.fileName || "Executado"}</span></div>`;
}

function consolidatedRoutineTable(routines, routineStatus, directorMode, competence = routineCompetence()) {
  return `<div class="card table-wrap">
    <div class="section-title table-title">
      <div><h2>Rotinas / importações mensais</h2><p>Visão consolidada das três empresas. Para anexar arquivo, selecione uma empresa acima.</p></div>
      <button class="btn small primary" data-routine-execute="Todas" ${directorMode ? "disabled" : ""}>Executar rotinas</button>
    </div>
    <table>
      <thead><tr><th>Rotina / importação</th>${companies.map((company) => `<th>${companyLogo(company.key)}</th>`).join("")}<th>Pasta / observação</th></tr></thead>
      <tbody>
        ${routines
          .map(
            (routine) => `<tr>
              <td><strong>${routine.title}</strong><br><span class="muted">${routine.description}</span></td>
              ${companies.map((company) => `<td>${routineStatusCell(routineStatus[rhRoutineKey(company.key, routine.key, competence)])}</td>`).join("")}
              <td><span class="muted">${routine.folder}</span></td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </div>`;
}

function companyRoutineChecklist(routines, routineStatus, activeCompany, directorMode, competence = routineCompetence()) {
  return `<div class="card table-wrap">
    <div class="section-title table-title">
      <div><h2>Rotinas / importações mensais - ${activeCompany}</h2><p>Arraste/selecione o arquivo da rotina ou execute a busca automática nas pastas de entrada.</p></div>
      <button class="btn small primary" data-routine-execute="${activeCompany}" ${directorMode ? "disabled" : ""}>Executar rotinas</button>
    </div>
    <table>
      <thead><tr><th>Status</th><th>Rotina / importação</th><th>Entrada</th><th>Arquivo / ação</th></tr></thead>
      <tbody>
        ${routines
          .map((routine) => {
            const key = rhRoutineKey(activeCompany, routine.key, competence);
            const status = routineStatus[key];
            return `<tr class="${status?.done ? "routine-row-done" : "routine-row-pending"}">
              <td>${routineStatusCell(status)}</td>
              <td><strong>${routine.title}</strong><br><span class="muted">${routine.description}</span></td>
              <td><span class="muted">${routine.folder}</span></td>
              <td>
                ${
                  routine.hasFile && !directorMode
                    ? `<label class="routine-file-picker ${status?.done ? "done" : "pending"}" data-routine-drop="${routine.key}" data-routine-company="${activeCompany}"><input type="file" data-routine-upload="${routine.key}" data-routine-company="${activeCompany}" />Selecionar arquivo ou arrastar aqui</label>`
                    : `<button class="btn small" data-routine-mark="${routine.key}" data-routine-company="${activeCompany}" ${directorMode ? "disabled" : ""}>Marcar concluído</button>`
                }
              </td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  </div>`;
}

function setRoutineStatus(companyKey, routineKey, status) {
  const store = rhRoutineStatusStore();
  store[rhRoutineKey(companyKey, routineKey)] = {
    ...status,
    competence: routineCompetence(),
    by: currentUser.name,
    at: new Date().toISOString(),
  };
  saveRhRoutineStatusStore(store);
}

function setRoutineFile(companyKey, routineKey, file) {
  setRoutineStatus(companyKey, routineKey, {
    done: true,
    fileName: file.name,
    source: "manual",
  });
}

async function executeRoutineFolderCheck(companyKey) {
  const targetCompanies = companyKey === "Todas" ? companies.map((company) => company.key) : [companyKey];
  const store = rhRoutineStatusStore();
  try {
    const response = await fetch(`/api/rh-routines/check?company=${encodeURIComponent(companyKey)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Verificador local indisponível");
    const payload = await response.json();
    Object.entries(payload.results || {}).forEach(([key, status]) => {
      const parts = key.split("::");
      const statusKey = parts.length === 2 ? rhRoutineKey(parts[0], parts[1]) : key;
      store[statusKey] = {
        ...status,
        competence: routineCompetence(),
        by: currentUser.name,
        at: payload.checkedAt || new Date().toISOString(),
      };
    });
  } catch (error) {
    monthlyRhRoutines().forEach((routine) => {
      targetCompanies.forEach((targetCompany) => {
        store[rhRoutineKey(targetCompany, routine.key)] = {
          done: !routine.hasFile,
          fileName: routine.hasFile ? "" : "Executado pelo painel",
          error: routine.hasFile ? "Não consegui verificar a pasta de entrada. Reinicie o servidor local para ativar a checagem automática." : "",
          competence: routineCompetence(),
          by: currentUser.name,
          at: new Date().toISOString(),
        };
      });
    });
  }
  saveRhRoutineStatusStore(store);
}

function routineHistoryPanel(routineStatus, routines, activeCompany, currentCompetence) {
  const routineTitles = new Map(routines.map((routine) => [routine.key, routine.title]));
  const rows = Object.entries(routineStatus)
    .map(([key, status]) => {
      const parts = key.split("::");
      if (parts.length < 3) return null;
      const [competence, company, routineKey] = parts;
      if (competence === currentCompetence) return null;
      if (activeCompany !== "Todas" && company !== activeCompany) return null;
      return {
        key,
        competence,
        company,
        routineKey,
        title: routineTitles.get(routineKey) || routineKey,
        status,
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.status?.at || b.competence).localeCompare(String(a.status?.at || a.competence)))
    .slice(0, 40);
  return `<div class="card pad routine-history-panel" style="margin-top:16px">
    <div class="section-title">
      <div><h2>Histórico de competências</h2><p>Registros de meses anteriores ficam guardados sem misturar com o ciclo atual.</p></div>
      <button class="btn small" data-routine-history-toggle>${state.rhRoutineHistoryOpen ? "Ocultar" : "Mostrar"}</button>
    </div>
    ${
      state.rhRoutineHistoryOpen
        ? `<div class="doc-list">
            ${
              rows.length
                ? rows.map((row) => `<div class="doc">
                    <div><strong>${escapeHtml(row.title)}</strong><span>${routineCompetenceLabel(row.competence)} · ${escapeHtml(row.company)} · ${row.status?.fileName || "Executado"}</span></div>
                    <div>${statusPill(row.status?.done ? "Concluído" : "Pendente")}</div>
                  </div>`).join("")
                : `<div class="empty">Nenhum histórico anterior para este filtro.</div>`
            }
          </div>`
        : ""
    }
  </div>`;
}

function temporaryRoutinesPanel(directorMode) {
  const temporary = temporaryRhRoutines();
  return `<div class="card pad temporary-routines-panel">
    <div class="section-title">
      <div><h2>Rotinas temporárias</h2><p>Demandas criadas a partir de processos aprovados, como admissões e demissões.</p></div>
      ${statusPill(temporary.length)}
    </div>
    <div class="checklist compact-checklist">
      ${
        temporary
          .map(
            (routine) => `<div class="check blocked temporary-routine-item">
              <span class="box">!</span>
              <div>
                <strong>${routine.title}</strong><br>
                <span>${routine.detail}</span><br>
                <span>Criada por ${routine.by} · ${routine.at}</span>
                <div class="ticket-actions">
                  <button class="btn small primary" data-temporary-routine-close="${routine.key}" ${directorMode ? "disabled" : ""}>Concluir rotina</button>
                </div>
              </div>
            </div>`,
          )
          .join("") || `<div class="empty">Nenhuma rotina temporária aberta. Quando o RH transformar uma admissão ou demissão em rotina, ela aparecerá aqui.</div>`
      }
    </div>
    <div class="notice muted-notice" style="margin-top:14px">
      <strong>Próximo passo</strong>
      <p>Depois podemos abrir cada rotina temporária em checklist próprio: documentos, ASO, termos, acessos, equipamentos e envio à contabilidade.</p>
    </div>
  </div>`;
}

function masterDataPage() {
  const activeCompany = state.company || "Todas";
  const scopedEmployees = employees.filter((employee) => matchesCompanyFilter(employee.company, activeCompany));
  const departments = editableMasterItems(activeCompany, "departments", [...new Set(scopedEmployees.map((employee) => employee.department || "Sem setor"))].sort());
  const roles = editableMasterItems(activeCompany, "roles", [...new Set(scopedEmployees.map((employee) => employee.role || "Sem cargo"))].sort());
  const supervisors = editableMasterItems(
    activeCompany,
    "supervisors",
    scopedEmployees.filter((employee) => simulatedProfileForEmployee(employee) === "Supervisor").map((employee) => employee.name).sort(),
  );
  const managers = editableMasterItems(
    activeCompany,
    "managers",
    scopedEmployees.filter((employee) => simulatedProfileForEmployee(employee) === "Gerente").map((employee) => employee.name).sort(),
  );

  return `
    <div class="company-switcher dashboard-company-switcher">
      <button class="company-chip dashboard-company-chip ${activeCompany === "Todas" ? "active" : ""}" data-master-company="Todas"><strong>Consolidado</strong></button>
      ${companies.map((company) => `<button class="company-chip dashboard-company-chip logo-chip ${activeCompany === company.key ? "active" : ""}" data-master-company="${company.key}">${companyLogo(company.key)}</button>`).join("")}
    </div>
    <div class="grid metrics" style="margin-top:16px">
      ${metric("Departamentos", departments.length, activeCompany === "Todas" ? "Todas as empresas" : activeCompany, "☷")}
      ${metric("Cargos", roles.length, "Cargo não define permissão sozinho", "◎")}
      ${metric("Supervisores", supervisors.length, "Equipe direta", "◷")}
      ${metric("Gerentes", managers.length, "Equipes dos supervisores", "◇")}
    </div>
    <div class="card pad" style="margin-top:16px">
      <div class="section-title table-title"><div><h2>Departamentos, cargos e hierarquia</h2><p>Edite a base da empresa selecionada. Colaboradores continuam no cadastro próprio.</p></div>${statusPill(activeCompany)}</div>
      <div class="master-editor-stack">
        ${masterDataEditor("Departamentos", "departments", departments, activeCompany, "Usados para filtro, liderança e relatórios por empresa.")}
        ${masterDataEditor("Cargos", "roles", roles, activeCompany, "Cargo ajuda na leitura da estrutura, mas permissão vem do vínculo.")}
        ${masterDataEditor("Supervisores", "supervisors", supervisors, activeCompany, "Vê equipe direta, férias e ponto. Não vê documentos nem contracheques.")}
        ${masterDataEditor("Gerentes", "managers", managers, activeCompany, "Vê equipes sob sua gestão e contracheques da estrutura, por decisão da empresa.")}
      </div>
    </div>`;
}

function masterDataStore() {
  return JSON.parse(localStorage.getItem("rhMasterDataEdits") || "{}");
}

function saveMasterDataStore(store) {
  localStorage.setItem("rhMasterDataEdits", JSON.stringify(store));
}

function masterDataKey(company, type) {
  return `${company || "Todas"}::${type}`;
}

function editableMasterItems(company, type, baseItems) {
  const store = masterDataStore();
  const record = store[masterDataKey(company, type)] || { added: [], removed: [] };
  const removed = new Set((record.removed || []).map(normalizeText));
  return [...new Set([...(baseItems || []), ...(record.added || [])])]
    .filter((item) => item && !removed.has(normalizeText(item)))
    .sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
}

function inactiveMasterItems(company, type) {
  const store = masterDataStore();
  const record = store[masterDataKey(company, type)] || { added: [], removed: [] };
  return [...new Set(record.removed || [])].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
}

function masterDataEditor(title, type, items, company, rule) {
  const createOpen = state.masterCreateType === type;
  const inactiveItems = inactiveMasterItems(company, type);
  return `<section class="master-editor-card">
    <div class="master-editor-head">
      <div><h3>${title}</h3><p>${rule}</p></div>
      <div class="master-editor-actions">
        ${statusPill(items.length)}
        <button class="btn small primary" type="button" data-master-create="${type}" data-master-company-name="${company}" ${company === "Todas" ? "disabled" : ""}>Criar</button>
      </div>
    </div>
    ${
      createOpen
        ? `<form class="master-inline-form" data-master-add="${type}" data-master-company-name="${company}">
            <label>
              Novo registro
              <input type="text" name="item" placeholder="Digite o nome do ${masterDataNoun(type)}" autofocus />
            </label>
            <div class="master-form-actions">
              <button class="btn small primary" type="submit">Salvar</button>
              <button class="btn small" type="button" data-master-cancel>Cancelar</button>
            </div>
          </form>`
        : ""
    }
    <div class="master-list">
      ${
        items
          .map(
            (item) => {
              const editKey = `${company}::${type}::${normalizeText(item)}`;
              const editing = state.masterEditKey === editKey;
              return `<div class="master-list-row">
                ${
                  editing
                    ? `<form class="master-row-edit" data-master-edit="${type}" data-master-company-name="${company}" data-master-item="${item}">
                        <input type="text" name="item" value="${escapeHtml(item)}" />
                        <button class="btn small primary" type="submit">Salvar</button>
                        <button class="btn small" type="button" data-master-cancel>Cancelar</button>
                      </form>`
                    : `<div class="master-row-main">
                        <strong>${item}</strong>
                        <span>${masterDataTypeHint(type)}</span>
                      </div>
                      <div class="master-row-actions">
                        <button class="btn small" type="button" data-master-edit-open="${editKey}" ${company === "Todas" ? "disabled" : ""}>Editar</button>
                        <button class="btn small danger" type="button" data-master-remove="${type}" data-master-company-name="${company}" data-master-item="${item}" ${company === "Todas" ? "disabled" : ""}>Inativar</button>
                      </div>`
                }
              </div>`;
            },
          )
          .join("") || `<div class="empty small-empty">Nenhum item cadastrado.</div>`
      }
    </div>
    ${
      inactiveItems.length && company !== "Todas"
        ? `<div class="master-inactive-list">
            <strong>Inativos</strong>
            ${inactiveItems
              .map(
                (item) => `<div class="master-list-row inactive-row">
                  <div class="master-row-main"><strong>${item}</strong><span>Inativo, preservado no histórico</span></div>
                  <div class="master-row-actions"><button class="btn small" type="button" data-master-restore="${type}" data-master-company-name="${company}" data-master-item="${item}">Reativar</button></div>
                </div>`,
              )
              .join("")}
          </div>`
        : ""
    }
    ${company === "Todas" ? `<p class="muted master-editor-note">Selecione uma empresa para editar.</p>` : ""}
  </section>`;
}

function masterDataTypeHint(type) {
  const hints = {
    departments: "Departamento da empresa selecionada",
    roles: "Cargo usado para leitura e filtros",
    supervisors: "Líder de equipe direta",
    managers: "Gestor de supervisores ou área",
  };
  return hints[type] || "Cadastro";
}

function masterDataNoun(type) {
  const nouns = {
    departments: "departamento",
    roles: "cargo",
    supervisors: "supervisor",
    managers: "gerente",
  };
  return nouns[type] || "registro";
}

function addMasterDataItem(company, type, item) {
  const value = String(item || "").trim();
  if (!value || company === "Todas") return;
  const store = masterDataStore();
  const key = masterDataKey(company, type);
  const record = store[key] || { added: [], removed: [] };
  record.added = [...new Set([...(record.added || []), value])];
  record.removed = (record.removed || []).filter((removed) => normalizeText(removed) !== normalizeText(value));
  store[key] = record;
  saveMasterDataStore(store);
  state.masterCreateType = "";
  state.masterEditKey = "";
}

function removeMasterDataItem(company, type, item) {
  if (!item || company === "Todas") return;
  const store = masterDataStore();
  const key = masterDataKey(company, type);
  const record = store[key] || { added: [], removed: [] };
  record.added = (record.added || []).filter((added) => normalizeText(added) !== normalizeText(item));
  record.removed = [...new Set([...(record.removed || []), item])];
  store[key] = record;
  saveMasterDataStore(store);
  state.masterEditKey = "";
}

function restoreMasterDataItem(company, type, item) {
  if (!item || company === "Todas") return;
  const store = masterDataStore();
  const key = masterDataKey(company, type);
  const record = store[key] || { added: [], removed: [] };
  record.removed = (record.removed || []).filter((removed) => normalizeText(removed) !== normalizeText(item));
  store[key] = record;
  saveMasterDataStore(store);
  state.masterEditKey = "";
}

function renameMasterDataItem(company, type, oldItem, newItem) {
  const nextValue = String(newItem || "").trim();
  if (!nextValue || !oldItem || company === "Todas") return;
  removeMasterDataItem(company, type, oldItem);
  addMasterDataItem(company, type, nextValue);
  state.masterEditKey = "";
}

function employeeReportsTo(employee, leader) {
  if (!employee || !leader) return false;
  if (employee.managerEmployeeId && leader.dbId) return employee.managerEmployeeId === leader.dbId;
  return isLeaderNameMatch(employee.manager, leader.name);
}

function hierarchyPage() {
  const activeCompany = state.company || "Todas";
  const activeEmployees = employees.filter((employee) => !["Desligado", "Inativo"].includes(employee.status));
  const scopedEmployees = activeEmployees.filter((employee) => matchesCompanyFilter(employee.company, activeCompany));
  const hierarchySearch = normalizeText(state.hierarchyQuery);
  const leaderRecords = activeEmployees
    .filter((candidate) => candidate.dbId && scopedEmployees.some((employee) => employeeReportsTo(employee, candidate)))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const leaders = leaderRecords.map((leaderRecord) => {
    const directReports = scopedEmployees.filter((employee) => employeeReportsTo(employee, leaderRecord));
    return {
      id: leaderRecord.id,
      dbId: leaderRecord.dbId,
      name: leaderRecord.name,
      company: leaderRecord?.company || activeCompany,
      role: leaderRecord?.role || "Líder",
      manager: leaderRecord?.manager || "Sem próximo gestor",
      directReports,
    };
  });
  const withoutLeader = scopedEmployees.filter((employee) => !employee.manager || ["Sem líder", "Consultar ficha"].includes(employee.manager));
  const directored = scopedEmployees.filter((employee) => isLeaderNameMatch(employee.manager, "Carlos Junior") || isLeaderNameMatch(employee.manager, "Anderson Nascimento"));
  const editableEmployees = scopedEmployees
    .filter((employee) => employee.dbId && !normalizeText(employee.role).includes("DIRETORIA"))
    .filter((employee) => !hierarchySearch || [employee.name, employee.company, employee.department, employee.role, employee.manager].some((value) => normalizeText(value).includes(hierarchySearch)))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const leaderOptions = activeEmployees
    .filter((employee) => employee.dbId)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const companyButtons = `
    <div class="company-switcher dashboard-company-switcher">
      <button class="company-chip dashboard-company-chip ${activeCompany === "Todas" ? "active" : ""}" data-hierarchy-company="Todas"><strong>Consolidado</strong></button>
      ${companies.map((company) => `<button class="company-chip dashboard-company-chip logo-chip ${activeCompany === company.key ? "active" : ""}" data-hierarchy-company="${company.key}">${companyLogo(company.key)}</button>`).join("")}
    </div>`;

  return `
    ${companyButtons}
    ${state.formMessage ? `<div class="notice form-notice" style="margin-top:16px"><strong>Retorno</strong><p>${state.formMessage}</p></div>` : ""}
    <div class="grid metrics" style="margin-top:16px">
      ${metric("Colaboradores", scopedEmployees.length, activeCompany === "Todas" ? "Base consolidada" : activeCompany, "☷")}
      ${metric("Líderes com equipe", leaders.filter((leader) => leader.directReports.length).length, "Gestor direto cadastrado", "⇄")}
      ${metric("Diretoria direta", directored.length, "Respondem a Carlos/Anderson", "◇")}
      ${metric("Sem líder", withoutLeader.length, "Revisar vínculo", "!")}
    </div>
    ${visualOrgChart(leaders, withoutLeader)}
    <div class="card table-wrap hierarchy-card" style="margin-top:16px">
      <div class="section-title table-title"><div><h2>Pendências de liderança</h2><p>Primeiro ajuste: quem está sem líder aparece aqui até receber um vínculo.</p></div>${statusPill(`${withoutLeader.length} pendente(s)`)}</div>
      <table>
        <thead><tr><th>Colaborador</th><th>Empresa</th><th>Setor</th><th>Cargo</th></tr></thead>
        <tbody>
          ${withoutLeader
            .map((employee) => `<tr><td><strong>${employee.name}</strong></td><td>${companyLogo(employee.company)}</td><td>${employee.department}</td><td>${employee.role}</td></tr>`)
            .join("")}
          ${withoutLeader.length ? "" : `<tr><td colspan="4">Todos os colaboradores deste filtro têm líder definido.</td></tr>`}
        </tbody>
      </table>
    </div>
    <div class="card table-wrap hierarchy-card" style="margin-top:16px">
      <div class="section-title table-title">
        <div><h2>Edição rápida de líderes</h2><p>Cada colaborador tem apenas um líder imediato. Ao salvar, o vínculo é gravado no banco e passa a orientar fila, equipe e permissões.</p></div>
        ${statusPill("Editável")}
      </div>
      <div class="hierarchy-filter">
        <div class="field">
          <label>Buscar colaborador, setor ou líder</label>
          <input data-hierarchy-search value="${state.hierarchyQuery}" placeholder="Digite parte do nome, setor ou líder" autocomplete="off" />
        </div>
      </div>
      <table>
        <thead><tr><th>Colaborador</th><th>Empresa / setor</th><th>Líder imediato</th><th>Ação</th></tr></thead>
        <tbody>
          ${editableEmployees
            .map((employee) => {
              const currentLeader = leaderOptions.find((option) => employeeReportsTo(employee, option));
              return `
                <tr>
                  <td><strong>${employee.name}</strong><br><span class="muted">${employee.role}</span></td>
                  <td>${companyLogo(employee.company)}<br><span class="muted">${employee.department}</span></td>
                  <td>
                    <select class="input" data-hierarchy-leader="${employee.dbId}" disabled>
                      <option value="">Sem líder</option>
                      ${leaderOptions
                        .filter((option) => option.dbId !== employee.dbId)
                        .map((option) => `<option value="${option.dbId}" ${currentLeader?.dbId === option.dbId ? "selected" : ""}>${option.name} · ${option.company}</option>`)
                        .join("")}
                    </select>
                  </td>
                  <td><button class="btn small" data-hierarchy-save="${employee.dbId}" data-mode="edit">Editar</button></td>
                </tr>`;
            })
            .join("")}
          ${editableEmployees.length ? "" : `<tr><td colspan="4">Nenhum colaborador ativo para editar neste filtro.</td></tr>`}
        </tbody>
      </table>
    </div>
    <div class="card table-wrap" style="margin-top:16px">
      <div class="section-title table-title"><div><h2>Mapa por líder</h2><p>Lista direta de quem responde para cada gestor. Alterações futuras devem gravar no vínculo do colaborador.</p></div>${statusPill(`${leaders.length} líderes`)}</div>
      <table>
        <thead><tr><th>Líder</th><th>Função</th><th>Próximo gestor</th><th>Equipe direta</th></tr></thead>
        <tbody>
          ${leaders
            .map(
              (leader) => `
            <tr>
              <td><strong>${leader.name}</strong><br><span class="muted">${leader.company}</span></td>
              <td>${leader.role}</td>
              <td>${leader.manager}</td>
              <td><strong>${leader.directReports.length}</strong><br><span class="muted">${leader.directReports.map((employee) => employee.name).slice(0, 8).join(", ") || "Sem equipe direta"}${leader.directReports.length > 8 ? "..." : ""}</span></td>
            </tr>`,
            )
            .join("")}
          ${leaders.length ? "" : `<tr><td colspan="4">Nenhuma liderança mapeada para este filtro.</td></tr>`}
        </tbody>
      </table>
    </div>
	    `;
}

function visualOrgChart(leaders, withoutLeader) {
  const activeLeaders = leaders.filter((leader) => leader.directReports.length).slice(0, 18);
  const currentUserKey = normalizeText(currentUser.name);
  return `<div class="card pad org-chart-card" style="margin-top:16px">
    <div class="section-title"><div><h2>Organograma visual</h2><p>Estrutura por gestor imediato, construída a partir do vínculo de liderança cadastrado.</p></div>${statusPill(`${activeLeaders.length} nós`)}</div>
    <div class="org-chart">
      <div class="org-root"><strong>Diretoria</strong><span>Grupo Prodelar</span></div>
      <div class="org-branches">
        ${
          activeLeaders.length
            ? activeLeaders.map((leader) => `<div class="org-node ${normalizeText(leader.name) === currentUserKey ? "current-user" : ""}">
                <button class="org-leader" data-employee="${leader.dbId || leader.id}"><strong>${escapeHtml(leader.name)}</strong><span>${escapeHtml(leader.role)} · ${escapeHtml(leader.company)}</span></button>
                <div class="org-team">
                  ${leader.directReports.slice(0, 10).map((employee) => `<button class="${normalizeText(employee.name) === currentUserKey ? "current-user" : ""}" data-employee="${employee.dbId || employee.id}">${escapeHtml(employee.name)}<small>${escapeHtml(employee.department || "Sem setor")}</small></button>`).join("")}
                  ${leader.directReports.length > 10 ? `<span>+${leader.directReports.length - 10} colaboradores<small>Equipe direta</small></span>` : ""}
                </div>
              </div>`).join("")
            : `<div class="empty">Nenhum vínculo de liderança para desenhar neste filtro.</div>`
        }
      </div>
      ${withoutLeader.length ? `<div class="org-alert">${withoutLeader.length} colaborador(es) sem líder definido.</div>` : ""}
    </div>
  </div>`;
}

function peopleControlEventStore() {
  return safeJsonParse(localStorage.getItem("rhPeopleControlEvents"), []);
}

function savePeopleControlEventStore(events) {
  localStorage.setItem("rhPeopleControlEvents", JSON.stringify(events.slice(0, 120)));
}

function peopleControlScopedEmployees(activeCompany) {
  return employees
    .filter((employee) => matchesCompanyFilter(employee.company, activeCompany))
    .filter((employee) => employeeStatus(employee) === "Ativo")
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function peopleControlInput(module, [label, type], activeCompany) {
  if (type === "employee") {
    const options = peopleControlScopedEmployees(activeCompany).slice(0, 120);
    return `<label class="field"><span>${label}</span><select data-people-control-employee="${module.key}">
      ${options.map((employee) => `<option value="${employee.name}">${employee.name} · ${employee.department || "Sem setor"}</option>`).join("")}
    </select></label>`;
  }
  if (type === "file") {
    return `<label class="field"><span>${label}</span><span class="routine-file-picker pending"><input type="file" data-people-control-file="${module.key}" />Selecionar arquivo ou arrastar aqui</span></label>`;
  }
  if (type === "date") {
    return `<label class="field"><span>${label}</span><input type="date" data-people-control-field="${module.key}:${label}" /></label>`;
  }
  if (type === "number") {
    return `<label class="field"><span>${label}</span><input type="number" min="0" placeholder="0" data-people-control-field="${module.key}:${label}" /></label>`;
  }
  if (type.startsWith("select:")) {
    const options = type.slice(7).split("|");
    return `<label class="field"><span>${label}</span><select data-people-control-field="${module.key}:${label}">
      ${options.map((option) => `<option>${option}</option>`).join("")}
    </select></label>`;
  }
  const placeholder = type.startsWith("text:") ? type.slice(5) : "";
  return `<label class="field"><span>${label}</span><input type="text" placeholder="${placeholder}" data-people-control-field="${module.key}:${label}" /></label>`;
}

function peopleControlEventsFor(moduleKey) {
  return peopleControlEventStore().filter((event) => event.moduleKey === moduleKey);
}

function peopleControlEventSummaryFromValues(values = {}, fileName = "") {
  const filledValues = Object.entries(values)
    .filter(([, value]) => String(value || "").trim())
    .slice(0, 6)
    .map(([key, value]) => `${key}: ${value}`);
  if (fileName) filledValues.push(`Arquivo: ${fileName}`);
  return filledValues.join(" · ");
}

function savePeopleControlEvent(moduleKey) {
  const module = peopleControlModules.find((item) => item.key === moduleKey) || peopleControlModules[0];
  const employeeSelect = document.querySelector(`[data-people-control-employee="${moduleKey}"]`);
  const employeeName = employeeSelect?.value || currentUser.name;
  const values = {};
  document.querySelectorAll(`[data-people-control-field^="${moduleKey}:"]`).forEach((field) => {
    const key = field.dataset.peopleControlField.split(":").slice(1).join(":");
    values[key] = field.value || "";
  });
  const fileInput = document.querySelector(`[data-people-control-file="${moduleKey}"]`);
  const fileName = fileInput?.files?.[0]?.name || "";
  const summary = peopleControlEventSummaryFromValues(values, fileName);
  const sensitivity = module.sensitivity.toLowerCase();
  const entry = {
    id: `CTRL-${Date.now()}`,
    moduleKey,
    moduleTitle: module.fullTitle,
    employeeName,
    company: state.company || currentUser.company || "Todas",
    by: currentUser.name,
    at: new Date().toISOString(),
    status: sensitivity.includes("sensível") || sensitivity.includes("restrito") ? "Aguardando revisão RH" : "Registrado",
    outputs: "Controle RH + linha do tempo funcional",
    values,
    fileName,
    summary,
  };
  savePeopleControlEventStore([entry, ...peopleControlEventStore()]);
  state.peopleControlMessage = `${module.title} registrado para ${employeeName}. ${summary ? `${summary}. ` : ""}Lançamento salvo na rotina de Controles RH e vinculado à linha do tempo do colaborador.`;
  renderPage();
}

function viewPeopleControlEvent(eventId) {
  const event = peopleControlEventStore().find((item) => item.id === eventId);
  if (!event) {
    state.peopleControlMessage = "Registro não encontrado no histórico local.";
    renderPage();
    return;
  }
  state.peopleControlActiveModule = event.moduleKey || state.peopleControlActiveModule;
  const details = event.summary ? ` Detalhes: ${event.summary}.` : "";
  state.peopleControlMessage = `${event.moduleTitle}: ${event.employeeName} · ${event.status} · ${formatDateTime(event.at)}.${details} ${event.outputs || "Controle RH registrado."}`;
  renderPage();
}

function inactivatePeopleControlEvent(eventId) {
  const events = peopleControlEventStore();
  const updated = events.map((event) =>
    event.id === eventId
      ? {
          ...event,
          status: "Inativado",
          inactive: true,
          inactiveBy: currentUser.name,
          inactiveAt: new Date().toISOString(),
        }
      : event,
  );
  savePeopleControlEventStore(updated);
  state.peopleControlMessage = "Registro inativado no histórico local. A linha do tempo permanece preservada.";
  renderPage();
}

function peopleControlHistoryRows(module) {
  const storedEvents = peopleControlEventsFor(module.key).map((event) => ({
    event: event.moduleTitle || module.fullTitle,
    employee: event.employeeName,
    status: `${event.status} · ${formatDateTime(event.at)}`,
    detail: event.summary || event.fileName || event.outputs || "",
    id: event.id,
    inactive: event.inactive,
  }));
  const seedRows = (module.history || []).map(([event, employee, status]) => ({ event, employee, status }));
  const rows = [...storedEvents, ...seedRows].slice(0, 15);
  return rows
    .map(
      (row) => `
      <tr class="${row.inactive ? "muted-row" : ""}">
        <td><strong>${escapeHtml(row.event)}</strong></td>
        <td>${escapeHtml(row.employee)}</td>
        <td>${escapeHtml(row.status)}${row.detail ? `<br><span class="muted">${escapeHtml(row.detail)}</span>` : ""}</td>
        <td class="row-actions">
          ${
            row.id
              ? `<button class="btn small" type="button" data-people-control-view="${row.id}">Visualizar</button>
                 <button class="btn small danger" type="button" data-people-control-inactivate="${row.id}">Inativar</button>`
              : `<button class="btn small" type="button" disabled>Visualizar</button>`
          }
        </td>
      </tr>`,
    )
    .join("");
}

function peopleControlsPage() {
  const directorMode = currentUser.profile === "Diretoria";
  const activeCompany = ["RH", "Diretoria"].includes(currentUser.profile) ? state.company : currentUser.company;
  const activeModule = peopleControlModules.find((module) => module.key === state.peopleControlActiveModule) || peopleControlModules[0];
  const restrictedModules = peopleControlModules.filter((module) => {
    const sensitivity = module.sensitivity.toLowerCase();
    return sensitivity.includes("sensível") || sensitivity.includes("restrito");
  });
  const storedEvents = peopleControlEventStore();
  const pendingReceived = peopleControlModules.reduce((total, module) => total + (module.receivedRows?.length || 0), 0);
  const modulesWithFile = peopleControlModules.filter((module) => module.formFields?.some(([, type]) => type === "file")).length;
  return `
    ${["RH", "Diretoria"].includes(currentUser.profile) ? companySwitcher(activeCompany, "people-control-company") : lockedCompanyIndicator(activeCompany)}
    ${state.peopleControlMessage ? `<div class="notice" style="margin-top:16px"><strong>Retorno</strong><p>${state.peopleControlMessage}</p></div>` : ""}
    <div class="card pad people-control-workbench" style="margin-top:16px">
      <div class="section-title">
        <div>
          <h2>Controles operacionais do RH</h2>
          <p>Rotina própria para lançar atestados, ASO, contratos de experiência, treinamentos, EPI, benefícios, comunicados e outros controles administrativos.</p>
        </div>
        ${statusPill("Rotina RH")}
      </div>
      <div class="notice muted-notice">
        <strong>Independente do Meu portal</strong>
        <p>Esta tela é do RH. O portal do colaborador apenas consulta ou envia solicitações quando existir fluxo liberado; os lançamentos, validações e acompanhamentos ficam aqui.</p>
      </div>
    </div>
    <div class="grid metrics" style="margin-top:16px">
      ${metric("Alertas críticos", executiveAlerts.length, "ASO, afastamentos e contratos vencendo", "!", "peopleControls")}
      ${metric("Módulos com documento", modulesWithFile, "Lançamentos com anexo ou termo", "▣", "peopleControls")}
      ${metric("Pendências do RH", pendingReceived, "Itens recebidos para validação interna", "↧", "peopleControls")}
      ${metric("Eventos registrados", storedEvents.length, "Histórico local desta rotina", "◎", "peopleControls")}
    </div>
    <div class="card pad" style="margin-top:16px">
      <div class="section-title">
        <div><h2>Módulos de controle</h2><p>Escolha o controle que o RH precisa lançar ou acompanhar. O formulário operacional abre abaixo.</p></div>
        ${statusPill(directorMode ? "Visão diretoria" : "RH")}
      </div>
      <div class="status-strip">
        ${peopleControlModules
          .map(
            (module) => `<button class="status-card people-control-module-card ${activeModule.key === module.key ? "active" : ""}" type="button" data-people-control-module="${module.key}">
              <strong>${module.title}</strong><span>${module.status}</span><em>${activeModule.key === module.key ? "Controle aberto" : "Abrir controle"}</em>
            </button>`,
          )
          .join("")}
      </div>
      <div class="notice muted-notice" style="margin-top:14px">
        <strong>Regra da rotina</strong>
        <p>Todo lançamento fica vinculado ao colaborador, empresa, documento quando houver, status e linha do tempo funcional. Alertas e e-mails entram depois por template.</p>
      </div>
    </div>
    <div id="people-control-panel" class="card pad people-control-panel" style="margin-top:16px">
      <div class="section-title">
        <div><h2>${activeModule.fullTitle}</h2><p>${activeModule.description}</p></div>
        ${statusPill(activeModule.sensitivity)}
      </div>
      ${
        directorMode
          ? `<div class="notice muted-notice"><strong>Diretoria</strong><p>${activeModule.executive}</p></div>`
          : ""
      }
      ${
        activeModule.receives
          ? `<div class="card table-wrap" style="margin-top:14px">
              <div class="section-title compact-title"><div><h2>Pendências recebidas</h2><p>Itens enviados por colaborador/liderança que precisam de validação do RH.</p></div>${statusPill(activeModule.receivedRows?.length || 0)}</div>
              <table>
                <thead><tr><th>Origem</th><th>Colaborador</th><th>Status</th><th>Ação</th></tr></thead>
                <tbody>
                  ${(activeModule.receivedRows || [])
                    .map(
                      ([origin, employee, status]) => `<tr><td><strong>${origin}</strong></td><td>${employee}</td><td>${statusPill(status)}</td><td><button class="btn small" type="button">Validar</button></td></tr>`,
                    )
                    .join("") || `<tr><td colspan="4"><div class="empty">Nenhuma pendência recebida neste módulo.</div></td></tr>`}
                </tbody>
              </table>
            </div>`
          : ""
      }
      ${
        activeModule.key === "timeline"
          ? `<div class="card pad" style="margin-top:14px">
              <div class="section-title"><div><h2>Consultar linha do tempo</h2><p>Localize o colaborador para ver a vida funcional consolidada.</p></div>${statusPill("Consulta")}</div>
              <div class="field-grid routine-fields">${peopleControlInput(activeModule, ["Colaborador", "employee"], activeCompany)}</div>
              ${timeline()}
            </div>`
          : `<div class="card pad" style="margin-top:14px">
              <div class="section-title"><div><h2>Novo lançamento</h2><p>Registro operacional vinculado ao colaborador e à empresa selecionada.</p></div>${statusPill(activeCompany)}</div>
              <div class="field-grid routine-fields">
                ${activeModule.formFields.map((field) => peopleControlInput(activeModule, field, activeCompany)).join("")}
              </div>
              <div class="form-actions">
                <button class="btn primary" type="button" data-people-control-save="${activeModule.key}" ${directorMode ? "disabled" : ""}>Salvar lançamento</button>
              </div>
            </div>`
      }
      <div class="card table-wrap" style="margin-top:14px">
        <div class="section-title compact-title"><div><h2>Histórico/lista do módulo</h2><p>Últimos 15 eventos. Consulta sem desfazer ação.</p></div>${statusPill("Linha do tempo")}</div>
        <table>
          <thead><tr><th>Evento</th><th>Colaborador/público</th><th>Status</th><th>Ação</th></tr></thead>
          <tbody>
            ${peopleControlHistoryRows(activeModule) || `<tr><td colspan="4"><div class="empty">Nenhum evento registrado neste módulo.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
}

function employeePaystubRows(employee = currentUser) {
  const resolvedEmployee = employee === currentUser ? currentEmployeeRecord() || employee : employee;
  const employeeName = resolvedEmployee.name || currentUser.name;
  const employeeId = normalizeText(resolvedEmployee.id || "");
  const rows = indexedByEmployee(dataIndex.paystubsByEmployee, employeeName, paystubRecords, (record) => record.employee_name)
    .filter((record) => {
      const sameCode = employeeId && employeeId === normalizeText(record.employee_code);
      return sameCode || isSamePerson(record.employee_name, employeeName);
    })
    .sort((a, b) => String(b.competence || "").localeCompare(String(a.competence || "")));

  return rows.map((record) => [
    record.employee_name || employeeName,
    record.department || resolvedEmployee.department || currentUser.department,
    record.competence_label || record.competence || "Sem competência",
    record.type || "Mensal",
    record.company_name || resolvedEmployee.company || currentUser.company,
    record.status || "Disponível",
    record.file_name || "",
    record.file_url || "",
  ]);
}

function paystubDownloadCell(file, url) {
  if (!file || !url) return `<span class="muted">Ainda não liberado</span>`;
  return `<a class="btn small pdf-action" href="${encodeURI(url)}" target="_blank" rel="noopener">Abrir PDF</a>`;
}

function paystubCompetenceParts(label) {
  const [month = "", year = ""] = String(label || "").split("/");
  return { month, year };
}

function availablePaystubCompetences() {
  return [...new Set(paystubRecords.map((record) => record.competence_label).filter(Boolean))]
    .sort((a, b) => String(b).localeCompare(String(a)));
}

function paystubsPage() {
  if (currentUser.profile === "Colaborador" || state.paystubScope === "self") {
    return `
      <div class="profile-context">
        <div><strong>Meus contracheques</strong><span>Consulta por período. Cada anexo deve ficar privado para o colaborador logado.</span></div>
        ${statusPill(currentUser.company)}
      </div>
      <div class="card table-wrap">
        <table>
          <thead><tr><th>Competência</th><th>Tipo</th><th>Empresa</th><th>Status</th><th>Anexo</th></tr></thead>
          <tbody>
            ${employeePaystubRows()
              .map(
                ([, , period, type, company, status, file, url]) => `
              <tr>
                <td><strong>${period}</strong></td>
                <td>${type}</td>
                <td>${companyLogo(company)}</td>
                <td>${statusPill(status)}</td>
                <td>${paystubDownloadCell(file, url)}</td>
              </tr>`,
              )
              .join("") || `<tr><td colspan="5"><div class="empty">Nenhum contracheque real encontrado para este colaborador.</div></td></tr>`}
          </tbody>
        </table>
      </div>`;
  }
  if (currentUser.profile === "Supervisor" || currentUser.profile === "Gerente") {
    const team = visibleEmployeesForRequest().filter((employee) => !isSamePerson(employee.name, currentUser.name));
    const competences = availablePaystubCompetences();
    const latestCompetence = competences[0] || "Abril/2026";
    const defaultParts = paystubCompetenceParts(latestCompetence);
    const selectedMonth = state.paystubMonth || defaultParts.month || "Abril";
    const selectedYear = state.paystubYear || defaultParts.year || "2026";
    const selectedCompetence = `${selectedMonth}/${selectedYear}`;
    const nameFilter = normalizeText(state.paystubNameQuery);
    const teamNames = new Set(team.map((employee) => employee._nameKey || normalizeText(employee.name)));
    const latestRows = Array.from(teamNames)
      .flatMap((employeeName) => dataIndex.paystubsByEmployee.get(employeeName) || [])
      .filter((record) => (record.competence_label || record.competence) === selectedCompetence)
      .filter((record) => !nameFilter || (record._search || "").includes(nameFilter));
    const { visibleRows, hiddenCount } = limitedRows("paystubs", latestRows);
    return `
      <div class="card pad paystub-filter-card">
        <div class="section-title"><div><h2>Filtro de contracheques da equipe</h2><p>Pesquise por competência e colaborador. O padrão abre na última competência importada.</p></div>${statusPill(selectedCompetence)}</div>
        <div class="paystub-filter-grid">
          <label class="paystub-control"><span>Mês</span><select id="paystub-month">${["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((month) => `<option ${selectedMonth === month ? "selected" : ""}>${month}</option>`).join("")}</select></label>
          <label class="paystub-control"><span>Ano</span><select id="paystub-year">${["2026", "2025", "2024"].map((year) => `<option ${selectedYear === year ? "selected" : ""}>${year}</option>`).join("")}</select></label>
          <label class="paystub-control paystub-search"><span>Colaborador</span><input id="paystub-name-search" type="search" value="${state.paystubNameQuery}" placeholder="Digite nome ou setor" autocomplete="off" /></label>
          <div class="paystub-control paystub-summary"><span>Equipe</span><strong>${team.length} colaborador(es)</strong></div>
        </div>
      </div>
      <div class="card table-wrap" style="margin-top:16px">
        <table>
          <thead><tr><th>Colaborador</th><th>Setor</th><th>Competência</th><th>Tipo</th><th>Status</th><th>Anexo</th></tr></thead>
          <tbody>
            ${visibleRows
              .map(
                (record) => `
              <tr>
                <td><strong>${record.employee_name}</strong></td>
                <td>${record.department}</td>
                <td>${record.competence_label || record.competence}</td>
                <td>${record.type || "Mensal"}</td>
                <td>${statusPill(record.status || "Disponível")}</td>
                <td>${paystubDownloadCell(record.file_name, record.file_url)}</td>
              </tr>`,
              )
              .join("") || `<tr><td colspan="6"><div class="empty">Nenhum contracheque encontrado para esta pesquisa.</div></td></tr>`}
          </tbody>
        </table>
        ${showMoreButton("paystubs", hiddenCount)}
      </div>`;
  }
  return `
    <div class="grid two">
      <div class="card pad">
        <div class="section-title"><div><h2>Fluxo de produção</h2><p>PDF único entra, arquivos individuais saem por colaborador</p></div>${statusPill("Pronto")}</div>
        <div class="checklist">
          <div class="check done"><span class="box">1</span><div><strong>Pasta de entrada</strong><br><span>production/contracheques/entrada</span></div></div>
          <div class="check done"><span class="box">2</span><div><strong>Processador automático</strong><br><span>scripts/process-paystubs.py</span></div></div>
          <div class="check done"><span class="box">3</span><div><strong>Cadastro automático</strong><br><span>Atualiza production/contracheques/mapas/employee-destinations.csv</span></div></div>
          <div class="check done"><span class="box">4</span><div><strong>Pasta final</strong><br><span>production/contracheques/saida/[empresa]/[setor]/[matricula]</span></div></div>
        </div>
      </div>
      <div class="card pad">
        <div class="section-title"><div><h2>Como executar</h2><p>Comando local do processador</p></div></div>
        <div class="codebox">/Users/home/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/process-paystubs.py</div>
        <div class="notice" style="margin-top:14px"><strong>Segurança</strong><p>Contracheque é privado do colaborador, mas líder autorizado pode acessar os contracheques da própria equipe para apoio operacional. O acesso deve ser registrado em log.</p></div>
      </div>
    </div>
    <div class="card table-wrap" style="margin-top:16px">
      <table>
        <thead><tr><th>Campo do mapa</th><th>Uso</th><th>Exemplo</th></tr></thead>
        <tbody>
          <tr><td><strong>company_name</strong></td><td>Empresa identificada no topo do contracheque</td><td>SERVIMEC</td></tr>
          <tr><td><strong>department</strong></td><td>Departamento/setor do contracheque</td><td>CBTU LOCOMOTIVA</td></tr>
          <tr><td><strong>employee_code</strong></td><td>Matrícula/código para identificar a página</td><td>MATR-0000000127</td></tr>
          <tr><td><strong>cpf</strong></td><td>Identificação alternativa, só dígitos são comparados</td><td>141.634.294-09</td></tr>
          <tr><td><strong>employee_name</strong></td><td>Identificação por nome quando não houver código/CPF</td><td>GERLAN JOSE DA SILVA</td></tr>
          <tr><td><strong>destination_folder</strong></td><td>Pasta onde o PDF individual será salvo</td><td>production/contracheques/saida/SERVIMEC/CBTU-LOCOMOTIVA/MATR-0000000127-GERLAN-JOSE-DA-SILVA</td></tr>
        </tbody>
      </table>
    </div>`;
}

function emailsPage() {
  const templates = [
    ["Documentos pendentes", "Admissão/documentos", "Colaborador", "E-mail + App", "Individual", "Pronto"],
    ["Boas-vindas ao colaborador", "Primeiro dia", "Colaborador", "E-mail + App", "Individual", "Pronto"],
    ["Novo colaborador no grupo", "Admissão coletiva", "Grupo econômico", "E-mail + App", "Coletivo", "Revisão RH"],
    ["Documento vencendo", "CNH, ASO ou documento com validade", "Colaborador/RH", "E-mail + App", "Individual", "Pronto"],
    ["ASO vencendo", "Saúde ocupacional", "RH", "E-mail + App", "Individual", "Revisão RH"],
    ["ASO vencido", "Saúde ocupacional crítica", "RH", "E-mail + App", "Individual", "Revisão RH"],
    ["Férias aprovadas", "Programação aprovada", "Colaborador", "E-mail + App", "Individual", "Pronto"],
    ["Férias alteradas", "Programação alterada", "Colaborador/Líder", "App / E-mail + App", "Individual", "Pronto"],
    ["Férias próximas", "Lembrete antes do início", "Colaborador", "E-mail + App", "Individual", "Pronto"],
    ["Retorno de férias", "Lembrete de retorno", "Colaborador", "E-mail + App", "Individual", "Pronto"],
    ["Pendência de ponto", "Correção ou justificativa", "Colaborador", "E-mail + App", "Individual", "Pronto"],
    ["Ajuste de ponto para aprovação", "Liderança aprova ponto", "Gestor", "E-mail + App", "Individual", "Pronto"],
    ["Atestado pendente", "Validação RH sem detalhe médico", "RH", "E-mail + App", "Individual", "Revisão RH"],
    ["Experiência 45 dias", "Alerta para líder/RH", "Gestor", "E-mail + App", "Individual", "Pronto"],
    ["Experiência 90 dias", "Alerta para líder/RH", "Gestor", "E-mail + App", "Individual", "Pronto"],
    ["Avaliação pendente", "Avaliação de colaborador", "Gestor", "E-mail + App", "Individual", "Pronto"],
    ["Treinamento pendente", "Certificação obrigatória", "Colaborador", "E-mail + App", "Individual", "Pronto"],
    ["Benefício solicitado", "Análise de benefício", "RH", "E-mail + App", "Individual", "Pronto"],
    ["Benefício aprovado", "Resposta ao colaborador", "Colaborador", "App", "Individual", "Pronto"],
    ["Benefício pendente", "Pendência sensível", "Colaborador", "App", "Individual", "Revisão RH"],
    ["Dados bancários pendentes", "Correção de dados", "Colaborador", "E-mail + App", "Individual", "Revisão RH"],
    ["EPI/equipamento pendente", "Entrega ou devolução", "RH", "E-mail + App", "Individual", "Pronto"],
    ["Comunicado do mural", "Mural com leitura confirmada", "Colaboradores", "App", "Coletivo", "Pronto"],
    ["Leitura pendente de comunicado", "Confirmação de leitura", "Colaborador", "App", "Individual", "Pronto"],
    ["Contracheque disponível", "Folha/contracheque", "Colaborador", "E-mail + App", "Individual", "Pronto"],
    ["Pendências de desligamento", "Processo sensível", "Colaborador", "E-mail + App", "Individual", "Revisão RH"],
    ["Desligamento comunicado ao grupo", "Comunicado coletivo cuidadoso", "Grupo econômico", "E-mail + App", "Coletivo", "Revisão RH"],
    ["Validação interna do RH", "Pendência operacional interna", "RH", "E-mail + App", "Individual", "Revisão RH"],
  ];

  return `
    <div class="grid two">
      <div class="card pad">
        <div class="section-title"><div><h2>Fila de envio</h2><p>Disparo real pausado até configurar Google Workspace e Edge Functions</p></div>${statusPill("Pré-configurada")}</div>
        <div class="checklist">
          <div class="check done"><span class="box">✓</span><div><strong>Envio automático pausado</strong><br><span>Solicitações e cadastros não travam enquanto o Google Workspace não for ativado</span></div></div>
          <div class="check done"><span class="box">✓</span><div><strong>Fila real vazia</strong><br><span>Nenhum evento pendente precisa ser liberado no Supabase agora</span></div></div>
          <div class="check done"><span class="box">✓</span><div><strong>email_templates</strong><br><span>Modelos por chave e app_name = recursos_humanos</span></div></div>
          <div class="check done"><span class="box">✓</span><div><strong>Canal definido</strong><br><span>Templates marcados como E-mail, App ou E-mail + App</span></div></div>
          <div class="check done"><span class="box">✓</span><div><strong>Envio individual/coletivo</strong><br><span>Comunicações de grupo ficam separadas dos avisos individuais</span></div></div>
          <div class="check done"><span class="box">✓</span><div><strong>email_events</strong><br><span>Fila pending, waiting_review, processing, sent, failed</span></div></div>
          <div class="check done"><span class="box">✓</span><div><strong>email_delivery_logs</strong><br><span>Histórico de provider, teste, destinatário real e erro</span></div></div>
          <div class="check done"><span class="box">✓</span><div><strong>claim_pending_email_events</strong><br><span>Processamento seguro por lote, sem envio duplicado</span></div></div>
        </div>
      </div>
      <div class="card pad">
        <div class="section-title"><div><h2>Próxima ativação</h2><p>Depende de secrets no Supabase Edge Function</p></div></div>
        <div class="codebox">SUPABASE_SERVICE_ROLE_KEY<br>GOOGLE_WORKSPACE_SENDER_EMAIL<br>GOOGLE_WORKSPACE_CLIENT_ID<br>GOOGLE_WORKSPACE_CLIENT_SECRET<br>GOOGLE_WORKSPACE_REFRESH_TOKEN<br>GOOGLE_DRIVE_SHARED_DRIVE_ID<br>GOOGLE_DRIVE_ROOT_FOLDER_ID<br>GOOGLE_IMPERSONATE_EMAIL<br>EMAIL_TEST_MODE=true</div>
        <div class="notice" style="margin-top:14px"><strong>Regra de segurança</strong><p>O frontend nunca guarda segredo do Google. E-mails e uploads reais passam por Edge Functions do Supabase; o app só recebe links e metadados.</p></div>
      </div>
    </div>
    <div class="card table-wrap" style="margin-top:16px">
      <table>
        <thead><tr><th>Template</th><th>Evento</th><th>Destinatário típico</th><th>Canal</th><th>Envio</th><th>Status</th></tr></thead>
        <tbody>
          ${templates.map(([name, event, recipient, channel, scope, status]) => `<tr><td><strong>${name}</strong></td><td>${event}</td><td>${recipient}</td><td>${channel}</td><td>${scope}</td><td>${statusPill(status)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

function timeline() {
  return `
    <div class="timeline">
      <div class="event"><time>Hoje</time><div><strong>ASO pendente</strong><span>Admissão aguardando status apto.</span></div></div>
      <div class="event"><time>Ontem</time><div><strong>Férias importadas</strong><span>Previsão Prodelar, Colmob e Servimec atualizada.</span></div></div>
      <div class="event"><time>15/03</time><div><strong>Rubricas conferidas</strong><span>Folha sintética lida para cadastro de referência.</span></div></div>
    </div>`;
}

function authPage() {
  return `
    <main class="auth-shell">
      <section class="auth-card">
        <img class="auth-logo" src="./assets/grupo-prodelar-logos.png" alt="Prodelar, Colmob e Servimec" loading="eager" decoding="async" />
        <div>
          <p class="eyebrow">Recursos Humanos</p>
          <h1>Entrar no portal</h1>
          <p>Use CPF cadastrado ou e-mail corporativo e a senha do Supabase Auth.</p>
        </div>
        ${authMessageMarkup()}
        <form id="login-form" class="auth-form">
          <label><span>CPF ou e-mail</span><input name="cpf" autocomplete="username" placeholder="CPF ou e-mail" required /></label>
          <label><span>Senha</span><input name="password" type="password" autocomplete="current-password" placeholder="Senha" required /></label>
          <button class="btn primary" type="submit">Entrar</button>
        </form>
        <div class="auth-note">
          <strong>Acesso de teste:</strong> use os usuários criados no Supabase Auth, como rh@teste.prodelar.
        </div>
      </section>
    </main>`;
}

function passwordChangePage() {
  const employee = currentUser;
  return `
    <main class="auth-shell">
      <section class="auth-card">
        <img class="auth-logo" src="./assets/grupo-prodelar-logos.png" alt="Prodelar, Colmob e Servimec" loading="eager" decoding="async" />
        <div>
          <p class="eyebrow">Primeiro acesso</p>
          <h1>Crie sua senha</h1>
          <p>${escapeHtml(employee?.name || currentUser.name)} precisa confirmar uma senha para continuar. Pode ter a partir de 6 dígitos.</p>
        </div>
        ${authMessageMarkup()}
        <form id="password-change-form" class="auth-form">
          <label><span>Nova senha</span><input name="password" type="password" autocomplete="new-password" minlength="6" required /></label>
          <label><span>Confirmar senha</span><input name="confirm" type="password" autocomplete="new-password" minlength="6" required /></label>
          <button class="btn primary" type="submit">Salvar senha e entrar</button>
          <button class="btn ghost" type="button" data-action="logout">Sair</button>
        </form>
      </section>
    </main>`;
}

function scheduleRenderWithFocus(selector, delay = 180) {
  clearTimeout(lightweightRenderTimer);
  lightweightRenderTimer = setTimeout(() => {
    renderPage();
    const input = document.querySelector(selector);
    input?.focus?.();
    input?.setSelectionRange?.(input.value.length, input.value.length);
  }, delay);
}

function commitAppHtml(html, binder) {
  const app = document.querySelector("#app");
  if (!app) return;
  if (lastRenderedHtml === html && app.innerHTML === html) return;
  app.innerHTML = html;
  lastRenderedHtml = html;
  binder?.();
}

const pageRenderers = {
  dashboard,
  employees: employeesPage,
  employeeForm: employeeFormPage,
  employeeDetail: employeeDetailPage,
  requests: requestsPage,
  requestForm: requestFormPage,
  documents: documentsPage,
  vacations: vacationsPage,
  baseVacations: baseVacationsPage,
  admission: admissionPage,
  termination: terminationPage,
  time: timePage,
  portal: portalPage,
  peopleControls: peopleControlsPage,
  rhRoutines: rhRoutinesPage,
  accounting: accountingPage,
  masterData: masterDataPage,
  hierarchy: hierarchyPage,
  paystubs: paystubsPage,
  emails: emailsPage,
};

function renderPage() {
  ensureRuntimeIndexes();
  renderMemo = {};
  if (!state.authChecked) {
    commitAppHtml(authPage(), bindAuth);
    return;
  }
  if (!state.authSession) {
    commitAppHtml(authPage(), bindAuth);
    return;
  }
  if (shouldForcePasswordChange()) {
    commitAppHtml(passwordChangePage(), bindAuth);
    return;
  }
  if (!canAccessPage(state.page)) {
    state.page = currentUser.homePage;
    updatePageUrl(state.page, true);
  }
  const renderer = pageRenderers[state.page] || pageRenderers[currentUser.homePage] || portalPage;
  try {
    commitAppHtml(shell(renderer()), bind);
  } catch (error) {
    console.error("Erro ao renderizar tela", state.page, error);
    const failedPage = titles[state.page]?.[0] || state.page;
    state.formMessage = `A tela ${failedPage} encontrou um erro e foi recarregada.`;
    state.page = currentUser.homePage;
    const fallbackRenderer = pageRenderers[state.page] || portalPage;
    commitAppHtml(shell(fallbackRenderer()), bind);
  }
}

function timelineEmployeeId(employee = null) {
  if (employee?.dbId) return employee.dbId;
  if (employee?.id && /^[0-9a-f-]{36}$/i.test(employee.id)) return employee.id;
  return currentEmployeeRecord()?.dbId || "";
}

async function recordEmployeeTimeline({
  employee = null,
  employeeId = "",
  eventType,
  moduleName,
  title,
  description = "",
  relatedTable = "",
  relatedRecordId = null,
  status = "",
  metadata = {},
}) {
  if (!supabaseClient || !eventType || !moduleName || !title) return { ok: false, message: "timeline indisponível" };
  const targetEmployeeId = employeeId || timelineEmployeeId(employee);
  if (!targetEmployeeId) return { ok: false, message: "colaborador sem vínculo para timeline" };
  try {
    const { error } = await supabaseClient.from("hr_employee_timeline").insert({
      employee_id: targetEmployeeId,
      event_type: eventType,
      module_name: moduleName,
      title,
      description,
      related_table: relatedTable || null,
      related_record_id: relatedRecordId || null,
      status: status || null,
      metadata: {
        ...metadata,
        actor_name: currentUser.name,
        actor_profile: currentUser.profile,
      },
      created_by: state.authProfile?.id || null,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (error) {
    console.warn("Timeline não gravada", error);
    return { ok: false, message: error.message };
  }
}

function saveVacationEdit(key, patch) {
  const index = vacationForecasts.findIndex((row) => vacationKey(row) === key);
  if (index < 0) return;
  vacationForecasts[index] = { ...vacationForecasts[index], ...patch, status: "edited" };
  markRuntimeIndexesDirty();
  const saved = JSON.parse(localStorage.getItem("rhVacationEdits") || "{}");
  saved[key] = { ...(saved[key] || {}), ...patch, status: "edited" };
  localStorage.setItem("rhVacationEdits", JSON.stringify(saved));
}

function submitVacationForReview(key) {
  const row = vacationForecasts.find((item) => vacationKey(item) === key);
  if (!row) return;

  if (!row.planned_start || !row.planned_end) {
    state.vacationMessage = `Informe data inicial e final para ${row.employee_name}.`;
    renderPage();
    return;
  }

  if (row.planned_start > row.planned_end) {
    state.vacationMessage = `A data inicial não pode ser maior que a data final para ${row.employee_name}.`;
    renderPage();
    return;
  }

  if (row.legal_limit_date && row.planned_end > row.legal_limit_date) {
    state.vacationMessage = `Programação bloqueada: ${row.employee_name} tem limite em ${formatDate(row.legal_limit_date)}.`;
    renderPage();
    return;
  }

  const saved = JSON.parse(localStorage.getItem("rhVacationEdits") || "{}");
  saved[key] = {
    ...(saved[key] || {}),
    planned_start: row.planned_start,
    planned_end: row.planned_end,
    status: "waiting_review",
    submitted_for_review: true,
    submitted_by: currentUser.name,
    submitted_at: new Date().toISOString(),
  };
  localStorage.setItem("rhVacationEdits", JSON.stringify(saved));
  vacationForecasts = vacationForecasts.map((item) => (vacationKey(item) === key ? { ...item, ...saved[key] } : item));
  markRuntimeIndexesDirty();
  state.vacationMessage = `Programação de ${row.employee_name} submetida para avaliação.`;
  void recordEmployeeTimeline({
    employee: employees.find((employee) => isSamePerson(employee.name, row.employee_name)),
    eventType: "ferias",
    moduleName: "ferias",
    title: "Programação de férias submetida",
    description: `${row.planned_start} a ${row.planned_end}`,
    status: "waiting_review",
    metadata: { vacation_key: key, company: row.company_key || row.source_company || row.company || "" },
  });
  renderPage();
}

async function persistRequestWorkflowState(request, patch) {
  if (!supabaseClient) return { ok: false, message: "cliente Supabase indisponível" };
  if (!request.dbId) return { ok: false, message: "solicitação ainda local, sem id do Supabase" };
  const movedAt = new Date().toISOString();
  const latestAction = patch.workflowLog?.at(-1)?.action || "Movimentação";
  const rawData = {
    ...(request.rawData || {}),
    workflow_owner: patch.owner,
    workflow_next: patch.next,
    workflow_status_label: patch.status,
    workflow_log: patch.workflowLog || [],
    workflow_previous_status: request.status,
    workflow_updated_at: movedAt,
    updated_by_name: currentUser.name,
    updated_by_profile: currentUser.profile,
  };
  const dbStatus = requestDbStatus(patch.status);
  const { error } = await supabaseClient
    .from("hr_requests")
    .update({
      status: dbStatus,
      raw_data: rawData,
      completed_at: patch.status === "Concluído" ? new Date().toISOString() : null,
    })
    .eq("id", request.dbId);
  if (error) return { ok: false, message: error.message };

  const history = await supabaseClient.from("hr_request_status_history").insert({
    request_id: request.dbId,
    old_status: requestDbStatus(request.status),
    new_status: dbStatus,
    notes: `${latestAction} por ${currentUser.name}. Próximo: ${patch.owner}.`,
  });
  if (history.error) return { ok: true, message: `movimento gravado; histórico não confirmou: ${history.error.message}` };
  await recordEmployeeTimeline({
    employee: employees.find((employee) => isSamePerson(employee.name, request.employee)),
    eventType: "solicitacao",
    moduleName: "solicitacoes",
    title: `${request.protocol} - ${latestAction}`,
    description: `${request.status} → ${patch.status}. Responsável: ${patch.owner}.`,
    relatedTable: "hr_requests",
    relatedRecordId: request.dbId,
    status: patch.status,
    metadata: { request_type: request.type, next: patch.next },
  });
  return { ok: true, message: "movimento gravado no Supabase" };
}

function workflowPersistenceSuffix(result) {
  if (result?.ok) return result.message ? ` ${result.message}.` : " Movimento gravado no Supabase.";
  return ` Movimento salvo localmente; Supabase não confirmou: ${result?.message || "sem retorno"}.`;
}

async function advanceRequest(key) {
  const request = requests.find((item) => requestKey(item) === key);
  if (!request) return;
  const workflow = request.status === "Aguardando esclarecimento"
    ? {
        advanceLabel: "Responder esclarecimento",
        nextStatus: request.returnStatus || "Em análise",
        nextOwner: request.returnOwner || immediateLeaderName(),
        nextNext: request.returnNext || "Próxima aprovação",
      }
    : nextWorkflowFromRequest(request);
  const workflowLog = [
    ...(request.workflowLog || []),
    {
      from: request.status,
      to: workflow.nextStatus,
      by: currentUser.name,
      at: new Date().toISOString(),
      action: workflow.advanceLabel,
    },
  ];
  const patch = {
    status: workflow.nextStatus,
    owner: workflow.nextOwner,
    next: workflow.nextNext,
    workflowLog,
  };
  saveRequestWorkflow(request, patch);
  requests = requests.map((item) => (requestKey(item) === key ? { ...item, ...patch } : item));
  markRuntimeIndexesDirty();
  const persisted = await persistRequestWorkflowState(request, patch);
  state.formMessage = `${request.protocol} avançou para ${workflow.nextStatus}, com ${workflow.nextOwner}.${workflowPersistenceSuffix(persisted)}`;
  renderPage();
}

async function requestMoreInformation(key) {
  const request = requests.find((item) => requestKey(item) === key);
  if (!request) return;
  const patch = {
    status: "Aguardando esclarecimento",
    owner: request.employee || "Solicitante",
    next: currentUser.name,
    returnStatus: request.status,
    returnOwner: currentUser.name,
    returnNext: request.next || "Próxima aprovação",
    workflowLog: [
      ...(request.workflowLog || []),
      {
        from: request.status,
        to: "Aguardando esclarecimento",
        by: currentUser.name,
        at: new Date().toISOString(),
        action: "Pedir mais informações",
      },
    ],
  };
  saveRequestWorkflow(request, patch);
  requests = requests.map((item) => (requestKey(item) === key ? { ...item, ...patch } : item));
  markRuntimeIndexesDirty();
  const persisted = await persistRequestWorkflowState(request, patch);
  state.formMessage = `${request.protocol} voltou para ${patch.owner} complementar informações.${workflowPersistenceSuffix(persisted)}`;
  renderPage();
}

async function rejectRequest(key) {
  const request = requests.find((item) => requestKey(item) === key);
  if (!request) return;
  const patch = {
    status: "Reprovado",
    owner: currentUser.name,
    next: "Encerrado",
    workflowLog: [
      ...(request.workflowLog || []),
      {
        from: request.status,
        to: "Reprovado",
        by: currentUser.name,
        at: new Date().toISOString(),
        action: "Reprovar",
      },
    ],
  };
  saveRequestWorkflow(request, patch);
  requests = requests.map((item) => (requestKey(item) === key ? { ...item, ...patch } : item));
  markRuntimeIndexesDirty();
  const persisted = await persistRequestWorkflowState(request, patch);
  state.formMessage = `${request.protocol} foi reprovado e encerrado.${workflowPersistenceSuffix(persisted)}`;
  renderPage();
}

function openPage(page) {
  if (page === "imports") page = "rhRoutines";
  if (page === "back") {
    goBack();
    return;
  }
  if (!canAccessPage(page)) {
    state.formMessage = `O perfil ${currentUser.profile} não tem acesso a esta tela. Use uma rotina disponível para o seu usuário.`;
    state.page = currentUser.homePage;
    updatePageUrl(state.page, true);
    renderPage();
    return;
  }
  if (page === "peopleControls") {
    state.peopleControlActiveModule = state.peopleControlActiveModule || "aso";
    state.peopleControlMessage = "";
  }
  if (page === state.page) {
    updatePageUrl(state.page, true);
    renderPage();
    return;
  }
  state.pageHistory = [...(state.pageHistory || []), state.page].slice(-20);
  if (page === "paystubs") state.paystubScope = ["Supervisor", "Gerente"].includes(currentUser.profile) ? "team" : "self";
  if (page === "vacations") {
    state.vacationScope = currentUser.profile === "Colaborador" ? "self" : "team";
    state.vacationScopeSource = "process";
    state.vacationQuery = "";
    state.vacationStatusFilter = "all";
  }
  if (page === "baseVacations") {
    state.vacationQuery = "";
    state.vacationStatusFilter = "all";
  }
  if (page === "time") state.pointScope = currentUser.profile === "Colaborador" ? "self" : "team";
  state.page = page;
  updatePageUrl(state.page);
  renderPage();
}

function navigateFromSidebar(page) {
  openPage(page);
  return false;
}

function goBack() {
  const history = state.pageHistory || [];
  const previous = history.pop();
  state.pageHistory = history;
  state.page = previous && canAccessPage(previous) ? previous : currentUser.homePage;
  updatePageUrl(state.page);
  renderPage();
}

function submitAllVacationChanges() {
  const activeCompany = state.company || "Todas";
  const keys = vacationForecasts
    .filter((row) => matchesCompanyFilter(row.company_key || row.source_company || row.company, activeCompany))
    .filter((row) => row.status === "edited" || (row.submitted_for_review === false && row.planned_start && row.planned_end))
    .map((row) => vacationKey(row));
  keys.forEach((key) => {
    const row = vacationForecasts.find((item) => vacationKey(item) === key);
    if (!row || !row.planned_start || !row.planned_end) return;
    const saved = JSON.parse(localStorage.getItem("rhVacationEdits") || "{}");
    saved[key] = {
      ...(saved[key] || {}),
      planned_start: row.planned_start,
      planned_end: row.planned_end,
      status: "waiting_review",
      submitted_for_review: true,
      submitted_by: currentUser.name,
      submitted_at: new Date().toISOString(),
    };
    localStorage.setItem("rhVacationEdits", JSON.stringify(saved));
    vacationForecasts = vacationForecasts.map((item) => (vacationKey(item) === key ? { ...item, ...saved[key] } : item));
    void recordEmployeeTimeline({
      employee: employees.find((employee) => isSamePerson(employee.name, row.employee_name)),
      eventType: "ferias",
      moduleName: "ferias",
      title: "Programação de férias enviada em lote",
      description: `${row.planned_start} a ${row.planned_end}`,
      status: "waiting_review",
      metadata: { vacation_key: key, company: row.company_key || row.source_company || row.company || "" },
    });
  });
  markRuntimeIndexesDirty();
  state.vacationMessage = keys.length ? `${keys.length} alteração(ões) de férias enviadas para aprovação.` : "Nenhuma alteração pendente para enviar.";
  renderPage();
}

function handleDelegatedAppClick(event, appRoot) {
  const pageTarget = event.target.closest("[data-page]");
  if (pageTarget && appRoot.contains(pageTarget)) {
    event.preventDefault();
    event.stopPropagation();
    const requestedPage = pageTarget.classList.contains("back") ? "back" : pageTarget.dataset.page;
    if (requestedPage === "peopleControls") {
      if (!canAccessPage(requestedPage)) {
        openPage(requestedPage);
        return;
      }
      state.pageHistory = [...(state.pageHistory || []), state.page].slice(-20);
      state.page = "peopleControls";
      state.peopleControlActiveModule = state.peopleControlActiveModule || "aso";
      state.peopleControlMessage = "";
      updatePageUrl(state.page);
      renderPage();
      return;
    }
    openPage(requestedPage);
    return;
  }

  const target = event.target.closest(
    [
      "[data-dashboard-company]",
      "[data-requests-company]",
      "button[data-routine-company]",
      "button[data-routine-competence]",
      "button[data-routine-history-toggle]",
      "[data-master-company]",
      "[data-master-create]",
      "[data-master-cancel]",
      "[data-master-edit-open]",
      "[data-master-remove]",
      "[data-master-restore]",
      "[data-base-vacation-company]",
      "[data-vacation-company]",
      "[data-vacation-filter]",
      "[data-point-company]",
      "[data-people-control-company]",
      "[data-people-control-module]",
      "[data-people-control-save]",
      "[data-people-control-view]",
      "[data-people-control-inactivate]",
      "[data-routine-mark]",
      "[data-routine-execute]",
      "[data-temporary-routine-close]",
      "[data-rh-task-status]",
      "[data-rh-task-edit]",
      "[data-rh-task-edit-cancel]",
      "[data-show-more]",
      "[data-employee]",
      "[data-employee-company]",
      "[data-employee-edit]",
      "[data-employee-edit-cancel]",
      "[data-employee-status-save]",
      "[data-employee-save]",
      "[data-detail-tab]",
      "[data-operational-scope]",
      "[data-action]",
      "[data-request-company]",
      "[data-vacation-submit]",
      "[data-vacation-send-all]",
      "[data-point-submit]",
      "[data-point-adjustment-approve]",
      "[data-point-adjustment-reject]",
      "[data-point-adjustment-info]",
      "[data-request-advance]",
      "[data-request-reject]",
      "[data-request-info]",
    ].join(","),
  );
  if (!target || !appRoot.contains(target)) return;

  const { dataset } = target;
  let handled = true;

  if (dataset.dashboardCompany !== undefined) {
    state.company = dataset.dashboardCompany || "Todas";
    renderPage();
  } else if (dataset.requestsCompany !== undefined) {
    state.company = dataset.requestsCompany || "Todas";
    renderPage();
  } else if (dataset.routineMark !== undefined) {
    const store = rhRoutineStatusStore();
    store[rhRoutineKey(dataset.routineCompany, dataset.routineMark)] = {
      done: true,
      fileName: "Concluído manualmente",
      by: currentUser.name,
      at: new Date().toISOString(),
    };
    saveRhRoutineStatusStore(store);
    renderPage();
  } else if (dataset.routineExecute !== undefined) {
    target.disabled = true;
    target.textContent = "Verificando...";
    executeRoutineFolderCheck(dataset.routineExecute).then(renderPage);
  } else if (dataset.routineCompetence !== undefined) {
    if (dataset.routineCompetence === "prev") state.rhRoutineCompetence = shiftMonthKey(routineCompetence(), -1);
    if (dataset.routineCompetence === "next") state.rhRoutineCompetence = shiftMonthKey(routineCompetence(), 1);
    if (dataset.routineCompetence === "current") state.rhRoutineCompetence = currentMonthKey();
    state.rhTaskMessage = "";
    renderPage();
  } else if (dataset.routineHistoryToggle !== undefined) {
    state.rhRoutineHistoryOpen = !state.rhRoutineHistoryOpen;
    renderPage();
  } else if (dataset.rhTaskStatus !== undefined) {
    updateRhTaskStatus(dataset.rhTaskStatus, dataset.status || "done");
    state.rhTaskMessage = dataset.status === "done" ? "Tarefa concluída." : "Tarefa reaberta.";
    renderPage();
  } else if (dataset.rhTaskEdit !== undefined) {
    state.rhTaskEditId = dataset.rhTaskEdit;
    state.rhTaskMessage = "";
    renderPage();
  } else if (dataset.rhTaskEditCancel !== undefined) {
    state.rhTaskEditId = "";
    renderPage();
  } else if (dataset.routineCompany !== undefined && dataset.routineUpload === undefined && dataset.routineDrop === undefined) {
    state.company = dataset.routineCompany || state.company;
    state.rhTaskEditId = "";
    renderPage();
  } else if (dataset.masterCompany !== undefined) {
    state.company = dataset.masterCompany || "Todas";
    state.masterCreateType = "";
    state.masterEditKey = "";
    renderPage();
  } else if (dataset.masterCreate !== undefined) {
    state.masterCreateType = state.masterCreateType === dataset.masterCreate ? "" : dataset.masterCreate;
    state.masterEditKey = "";
    renderPage();
  } else if (dataset.masterCancel !== undefined) {
    state.masterCreateType = "";
    state.masterEditKey = "";
    renderPage();
  } else if (dataset.masterEditOpen !== undefined) {
    state.masterEditKey = dataset.masterEditOpen || "";
    state.masterCreateType = "";
    renderPage();
  } else if (dataset.masterRemove !== undefined) {
    removeMasterDataItem(dataset.masterCompanyName, dataset.masterRemove, dataset.masterItem);
    renderPage();
  } else if (dataset.masterRestore !== undefined) {
    restoreMasterDataItem(dataset.masterCompanyName, dataset.masterRestore, dataset.masterItem);
    renderPage();
  } else if (dataset.baseVacationCompany !== undefined) {
    state.company = dataset.baseVacationCompany || "Todas";
    resetListLimit("baseVacations");
    renderPage();
  } else if (dataset.vacationCompany !== undefined) {
    state.company = dataset.vacationCompany || "Todas";
    state.vacationStatusFilter = "all";
    resetListLimit("vacations");
    renderPage();
  } else if (dataset.vacationFilter !== undefined) {
    state.vacationStatusFilter = dataset.vacationFilter || "all";
    resetListLimit("vacations");
    renderPage();
  } else if (dataset.pointCompany !== undefined) {
    state.company = dataset.pointCompany || "Todas";
    renderPage();
  } else if (dataset.peopleControlCompany !== undefined) {
    state.company = dataset.peopleControlCompany || "Todas";
    state.peopleControlMessage = "";
    renderPage();
  } else if (dataset.peopleControlModule !== undefined) {
    state.peopleControlActiveModule = dataset.peopleControlModule || "aso";
    state.peopleControlMessage = "";
    renderPage();
    requestAnimationFrame(() => {
      document.getElementById("people-control-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  } else if (dataset.peopleControlSave !== undefined) {
    savePeopleControlEvent(dataset.peopleControlSave);
  } else if (dataset.peopleControlView !== undefined) {
    viewPeopleControlEvent(dataset.peopleControlView);
  } else if (dataset.peopleControlInactivate !== undefined) {
    inactivatePeopleControlEvent(dataset.peopleControlInactivate);
  } else if (dataset.temporaryRoutineClose !== undefined) {
    const store = temporaryRoutineClosedStore();
    store[dataset.temporaryRoutineClose] = {
      done: true,
      by: currentUser.name,
      at: new Date().toISOString(),
    };
    saveTemporaryRoutineClosedStore(store);
    renderPage();
  } else if (dataset.showMore !== undefined) {
    const step = initialListLimits[dataset.showMore] || 50;
    state.listLimits[dataset.showMore] = (state.listLimits[dataset.showMore] || step) + step;
    renderPage();
  } else if (dataset.employee !== undefined) {
    state.selectedEmployeeId = dataset.employee;
    state.detailTab = "ficha";
    state.page = "employeeDetail";
    renderPage();
  } else if (dataset.employeeCompany !== undefined) {
    state.company = dataset.employeeCompany || "Todas";
    state.employeeEditId = "";
    resetListLimit("employees");
    renderPage();
  } else if (dataset.employeeEdit !== undefined) {
    state.employeeEditId = dataset.employeeEdit;
    renderPage();
  } else if (dataset.employeeEditCancel !== undefined) {
    state.employeeEditId = "";
    renderPage();
  } else if (dataset.employeeStatusSave !== undefined) {
    const select = document.querySelector(`[data-employee-status-select="${dataset.employeeStatusSave}"]`);
    if (select) saveEmployeeStatus(dataset.employeeStatusSave, select.value);
  } else if (dataset.employeeSave !== undefined) {
    saveEmployeeDetails(dataset.employeeSave);
  } else if (dataset.detailTab !== undefined) {
    state.detailTab = dataset.detailTab;
    renderPage();
  } else if (dataset.operationalScope !== undefined) {
    markOperationalAction(dataset.operationalScope, dataset.operationalKey, dataset.operationalLabel || "Item registrado e removido da fila operacional.");
  } else if (dataset.action !== undefined) {
    if (dataset.action === "logout") {
      logout().then(renderPage);
    } else if (dataset.action === "refresh") {
      loadSupabaseData();
    } else if (dataset.action === "new-request") {
      state.prefillRequestType = dataset.prefillType || "";
      state.requestReturnPage = state.page || "requests";
      state.page = canAccessPage("requests") ? "requestForm" : currentUser.homePage;
      renderPage();
    } else if (dataset.action === "open-self-time") {
      state.pointScope = "self";
      state.pointAdjustmentOpen = false;
      state.pointMessage = "";
      state.page = "time";
      renderPage();
    } else if (dataset.action === "open-point-adjustment") {
      state.pointAdjustmentOpen = true;
      state.pointMessage = "";
      renderPage();
    } else if (dataset.action === "close-point-adjustment") {
      state.pointAdjustmentOpen = false;
      renderPage();
    } else if (dataset.action === "open-self-paystubs") {
      state.paystubScope = "self";
      state.page = "paystubs";
      renderPage();
    } else if (dataset.action === "open-self-vacations") {
      state.vacationScope = "self";
      state.vacationScopeSource = "portal";
      state.page = "vacations";
      renderPage();
    } else if (dataset.action === "new-employee") {
      state.prefillRequestType = "";
      state.page = "employeeForm";
      renderPage();
    } else {
      handled = false;
    }
  } else if (dataset.requestCompany !== undefined) {
    state.requestCompany = dataset.requestCompany;
    renderPage();
  } else if (dataset.vacationSubmit !== undefined) {
    submitVacationForReview(dataset.vacationSubmit);
  } else if (dataset.vacationSendAll !== undefined) {
    submitAllVacationChanges();
  } else if (dataset.pointSubmit !== undefined) {
    submitMonthlyPoint(dataset.pointSubmit);
  } else if (dataset.pointAdjustmentApprove !== undefined) {
    const nextOwner = pointAdjustmentNextOwner();
    updatePointAdjustment(dataset.pointAdjustmentApprove, {
      status: nextOwner === "Concluído" ? "Concluído" : "Aprovado",
      owner: nextOwner,
    });
  } else if (dataset.pointAdjustmentReject !== undefined) {
    updatePointAdjustment(dataset.pointAdjustmentReject, {
      status: "Reprovado",
      owner: currentUser.name,
    });
  } else if (dataset.pointAdjustmentInfo !== undefined) {
    const record = pointAdjustmentStore().find((item) => item.id === dataset.pointAdjustmentInfo);
    updatePointAdjustment(dataset.pointAdjustmentInfo, {
      status: "Aguardando esclarecimento",
      owner: record?.employeeName || "Solicitante",
    });
  } else if (dataset.requestAdvance !== undefined) {
    advanceRequest(dataset.requestAdvance);
  } else if (dataset.requestReject !== undefined) {
    rejectRequest(dataset.requestReject);
  } else if (dataset.requestInfo !== undefined) {
    requestMoreInformation(dataset.requestInfo);
  } else {
    handled = false;
  }

  if (handled) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function bindAuth() {
  document.querySelectorAll("[data-action='logout']").forEach((button) => {
    button.addEventListener("click", () => {
      logout().then(renderPage);
    });
  });

  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(loginForm);
      const result = await loginWithCPF(form.get("cpf"), form.get("password"));
      if (result?.error) {
        state.authMessage = result.error;
        renderPage();
        return;
      }
      state.page = currentUser.homePage || "portal";
      state.authMessage = `Bem-vindo(a), ${currentUser.name}.`;
      renderPage();
    });
  }

  const passwordForm = document.querySelector("#password-change-form");
  if (passwordForm) {
    passwordForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.authMessage = "A troca de senha agora deve ser feita pelo Supabase Auth.";
      state.page = "portal";
      renderPage();
    });
  }
}

function bind() {
  const appRoot = document.querySelector("#app");
  if (appRoot && !appRoot.dataset.clickDelegated) {
    appRoot.addEventListener("click", (event) => handleDelegatedAppClick(event, appRoot), true);
    appRoot.dataset.clickDelegated = "true";
  }
  document.querySelectorAll("[data-master-add]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      addMasterDataItem(form.dataset.masterCompanyName, form.dataset.masterAdd, data.get("item"));
      renderPage();
    });
  });
  document.querySelectorAll("[data-master-edit]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      renameMasterDataItem(form.dataset.masterCompanyName, form.dataset.masterEdit, form.dataset.masterItem, data.get("item"));
      renderPage();
    });
  });
  document.querySelectorAll("[data-hierarchy-company]").forEach((button) => {
    button.addEventListener("click", () => {
      state.company = button.dataset.hierarchyCompany || "Todas";
      renderPage();
    });
  });
  document.querySelectorAll("[data-hierarchy-search]").forEach((input) => {
    input.addEventListener("input", () => {
      state.hierarchyQuery = input.value;
      scheduleRenderWithFocus("[data-hierarchy-search]");
    });
  });
  document.querySelectorAll("[data-hierarchy-save]").forEach((button) => {
    button.addEventListener("click", async () => {
      const employeeId = button.dataset.hierarchySave;
      const select = document.querySelector(`[data-hierarchy-leader="${employeeId}"]`);
      const employee = employees.find((item) => item.dbId === employeeId);
      const leader = employees.find((item) => item.dbId === select?.value);
      if (!employee) return;

      if (button.dataset.mode === "edit") {
        if (select) select.disabled = false;
        button.dataset.mode = "save";
        button.textContent = "Salvar";
        button.classList.add("primary");
        select?.focus();
        return;
      }

      const previousLabel = button.textContent;
      button.textContent = "Salvando...";
      button.disabled = true;

      if (supabaseClient && employee.dbId) {
        const { error } = await supabaseClient
          .from("hr_employees")
          .update({ manager_employee_id: leader?.dbId || null })
          .eq("id", employee.dbId);

        if (error) {
          state.formMessage = `Não foi possível salvar ${employee.name}: ${error.message}`;
          button.textContent = previousLabel;
          button.disabled = false;
          renderPage();
          return;
        }
      }

      employee.manager = leader?.name || "Sem líder";
      state.formMessage = `${employee.name} agora responde a ${leader?.name || "Sem líder"}.`;
      await loadSupabaseData();
    });
  });
  document.querySelectorAll("[data-routine-upload]").forEach((input) => {
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      setRoutineFile(input.dataset.routineCompany, input.dataset.routineUpload, file);
      renderPage();
    });
  });
  document.querySelectorAll("[data-routine-drop]").forEach((dropzone) => {
    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.classList.add("dragging");
    });
    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragging");
    });
    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragging");
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      setRoutineFile(dropzone.dataset.routineCompany, dropzone.dataset.routineDrop, file);
      renderPage();
    });
  });
  document.querySelectorAll("[data-rh-task-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveRhTask(form);
      renderPage();
    });
  });
  document.querySelectorAll("[data-rh-task-edit-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      updateRhTask(form, form.dataset.rhTaskEditForm);
      renderPage();
    });
  });
  const rhTaskStatusFilter = document.querySelector("#rh-task-status-filter");
  if (rhTaskStatusFilter) {
    rhTaskStatusFilter.addEventListener("change", (event) => {
      state.rhTaskStatusFilter = event.target.value;
      state.rhTaskEditId = "";
      renderPage();
    });
  }
  const rhTaskTypeFilter = document.querySelector("#rh-task-type-filter");
  if (rhTaskTypeFilter) {
    rhTaskTypeFilter.addEventListener("change", (event) => {
      state.rhTaskTypeFilter = event.target.value;
      state.rhTaskEditId = "";
      renderPage();
    });
  }
  const search = document.querySelector("#search");
  if (search) {
    search.addEventListener("input", (event) => {
      state.query = event.target.value;
      resetListLimit("employees");
      scheduleRenderWithFocus("#search");
    });
  }
  const company = document.querySelector("#company");
  if (company) {
    company.addEventListener("change", (event) => {
      state.company = event.target.value;
      resetListLimit("employees");
      resetListLimit("vacations");
      resetListLimit("baseVacations");
      resetListLimit("paystubs");
      renderPage();
    });
  }
  const vacationSearch = document.querySelector("#vacation-search");
  if (vacationSearch) {
    vacationSearch.addEventListener("input", (event) => {
      state.vacationQuery = event.target.value;
      resetListLimit("vacations");
      resetListLimit("baseVacations");
      clearTimeout(vacationSearchDebounce);
      vacationSearchDebounce = setTimeout(() => {
        scheduleRenderWithFocus("#vacation-search", 0);
      }, 250);
    });
  }
  const paystubNameSearch = document.querySelector("#paystub-name-search");
  if (paystubNameSearch) {
    paystubNameSearch.addEventListener("input", (event) => {
      state.paystubNameQuery = event.target.value;
      resetListLimit("paystubs");
      scheduleRenderWithFocus("#paystub-name-search");
    });
  }
  const paystubMonth = document.querySelector("#paystub-month");
  if (paystubMonth) {
    paystubMonth.addEventListener("change", (event) => {
      state.paystubMonth = event.target.value;
      resetListLimit("paystubs");
      renderPage();
    });
  }
  const paystubYear = document.querySelector("#paystub-year");
  if (paystubYear) {
    paystubYear.addEventListener("change", (event) => {
      state.paystubYear = event.target.value;
      resetListLimit("paystubs");
      renderPage();
    });
  }
  const employeeStatusFilter = document.querySelector("#employee-status-filter");
  if (employeeStatusFilter) {
    employeeStatusFilter.addEventListener("change", (event) => {
      state.employeeStatusFilter = event.target.value;
      state.employeeEditId = "";
      resetListLimit("employees");
      renderPage();
    });
  }
  const requestType = document.querySelector("#request-type");
  const approvalRoute = document.querySelector("#approval-route");
  if (requestType && approvalRoute) {
    requestType.addEventListener("change", (event) => {
      approvalRoute.value = approvalRouteFor(event.target.value);
    });
  }
  document.querySelectorAll("[data-vacation-start]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const key = event.target.dataset.vacationStart;
      saveVacationEdit(key, { planned_start: event.target.value, submitted_for_review: false });
      renderPage();
    });
  });
  document.querySelectorAll("[data-vacation-end]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const key = event.target.dataset.vacationEnd;
      saveVacationEdit(key, { planned_end: event.target.value, submitted_for_review: false });
      renderPage();
    });
  });
  const employeeForm = document.querySelector("#employee-form");
  if (employeeForm) {
    employeeForm.addEventListener("submit", handleEmployeeSubmit);
  }
  const requestForm = document.querySelector("#request-form");
  if (requestForm) {
    requestForm.addEventListener("submit", handleRequestSubmit);
  }
  const pointAdjustment = document.querySelector("#point-adjustment-form");
  if (pointAdjustment) {
    pointAdjustment.addEventListener("submit", handlePointAdjustmentSubmit);
  }
  document.querySelectorAll(".time-mask").forEach((input) => {
    input.addEventListener("input", (event) => {
      const formatted = formatTimeInputValue(event.target.value);
      event.target.value = formatted;
      if (formatted.length === 5) {
        const fields = [...document.querySelectorAll(".time-mask, #point-adjustment-form textarea, #point-adjustment-form button[type='submit']")];
        const index = fields.indexOf(event.target);
        fields[index + 1]?.focus?.();
      }
    });
  });
  document.querySelectorAll(".date-mask").forEach((input) => {
    input.addEventListener("input", (event) => {
      const formatted = formatDateInputValue(event.target.value);
      event.target.value = formatted;
      if (formatted.length === 10) {
        document.querySelector("#point-adjustment-form select")?.focus?.();
      }
    });
  });
}

async function handleEmployeeSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const localCode = `LOCAL-${String(Date.now()).slice(-6)}`;
  const employee = {
    id: localCode,
    dbId: null,
    name: form.get("name"),
    company: form.get("company"),
    department: form.get("department"),
    role: form.get("role"),
    manager: form.get("manager") || "Sem líder",
    status: "Ativo",
    admission: formatDate(form.get("admission")),
    vacation: "Sem programação",
    timeBank: "Sem fechamento",
  };

  const persisted = await tryPersistEmployee(form, localCode);
  if (persisted.ok) {
    state.formMessage = `Colaborador gravado no Supabase com código ${persisted.employeeCode}.`;
    void recordEmployeeTimeline({
      employeeId: persisted.employeeId,
      eventType: "admissao",
      moduleName: "colaboradores",
      title: "Cadastro inicial criado",
      description: `Colaborador criado pelo formulário do RH com código ${persisted.employeeCode}.`,
      relatedTable: "hr_employees",
      relatedRecordId: persisted.employeeId,
      status: "active",
    });
    await loadSupabaseData();
    const savedEmployee = employees.find((item) => item.id === persisted.employeeCode);
    state.selectedEmployeeId = savedEmployee?.id || persisted.employeeCode;
    state.page = "employeeForm";
    state.detailTab = "ficha";
    renderPage();
    return;
  }

  state.formMessage =
    `Cadastro não foi gravado. O Supabase bloqueou a operação: ${persisted.message}`;
  state.page = "employeeForm";
  state.detailTab = "ficha";
  renderPage();
}

async function handleRequestSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const selectedEmployeeId = form.get("employee_select") || form.get("employee");
  const selectedEmployee = employees.find((item) => item.id === selectedEmployeeId);
  const attachment = form.get("attachment");
  const requestDescription = [
    form.get("description") ? String(form.get("description")) : "",
    form.get("intended_role") ? `Cargo pretendido: ${form.get("intended_role")}` : "",
    form.get("team") ? `Setor/equipe: ${form.get("team")}` : "",
    form.get("risk") ? `Risco/urgência: ${form.get("risk")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const nextApproval = nextApprovalAfterCurrent(currentUser.profile);
  const collaboratorLeader = selectedEmployee?.manager && !["Sem líder", "Consultar ficha"].includes(selectedEmployee.manager) ? selectedEmployee.manager : "Supervisor";
  const request = {
    protocol: `RH-LOCAL-${String(Date.now()).slice(-5)}`,
    type: form.get("type"),
    title: form.get("title"),
    employee: selectedEmployee?.name || String(form.get("title") || currentUser.name),
    owner: currentUser.profile === "Colaborador" ? collaboratorLeader : nextApproval.owner,
    company: form.get("company") || selectedEmployee?.company || state.requestCompany,
    next: currentUser.profile === "Colaborador" ? "Gerência" : nextApproval.next,
    status: currentUser.profile === "Colaborador" ? "Aberto" : nextApproval.status,
    sla: "Novo",
    description: requestDescription,
    attachmentName: attachment?.name || "",
  };
  if (attachment?.name && workspaceStorage) {
    const storageResult = await workspaceStorage.upload(attachment, {
      employeeId: selectedEmployee?.id || "",
      employeeName: selectedEmployee?.name || currentUser.name,
      company: request.company,
      documentType: request.type,
      sensitivity: request.type === "Atestado / afastamento" ? "sensitive" : "private",
      sharingMode: "private",
    });
    request.attachmentStorage = storageResult.metadata;
  }

  const persisted = await tryPersistRequest(form, request.protocol, request);
  if (persisted.ok) {
    saveRequestWorkflow({ ...request, dbId: persisted.id, protocol: persisted.protocol || request.protocol }, {
      status: request.status,
      owner: request.owner,
      next: request.next,
      requester: currentUser.name,
      requesterProfile: currentUser.profile,
      workflowLog: [
        {
          from: "Criação",
          to: request.status,
          by: currentUser.name,
          at: new Date().toISOString(),
          action: "Abrir solicitação",
        },
      ],
    });
    state.formMessage = `Solicitação gravada no Supabase com protocolo ${persisted.protocol}.`;
    await loadSupabaseData();
    state.page = "requestForm";
    renderPage();
    return;
  }

  state.formMessage =
    `Solicitação não foi gravada. O Supabase bloqueou a operação: ${persisted.message}`;
  state.page = "requestForm";
  renderPage();
}

async function tryPersistEmployee(form, employeeCode) {
  if (!supabaseClient) return { ok: false, message: "cliente Supabase indisponível" };
  try {
    const company = await getOrCreateCompany(String(form.get("company")));
    const department = await getOrCreateDepartment(company.id, String(form.get("department")));
    const position = await getOrCreatePosition(String(form.get("role")));
    const { data, error } = await supabaseClient
      .from("hr_employees")
      .insert({
        company_id: company.id,
        department_id: department.id,
        position_id: position.id,
        employee_code: employeeCode,
        full_name: String(form.get("name")),
        admission_date: form.get("admission") || null,
        status: "active",
        notes: String(form.get("notes") || ""),
        raw_import: { source: "app_form", temporary_code: employeeCode },
      })
      .select("id,employee_code")
      .single();
    if (error) return { ok: false, message: error.message };
    return { ok: true, employeeCode: data.employee_code, employeeId: data.id };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

async function saveEmployeeStatus(employeeId, status) {
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) return;
  const oldStatus = employee.status;
  employees = employees.map((item) => (item.id === employeeId ? { ...item, status } : item));
  markRuntimeIndexesDirty();
  state.employeeEditId = "";
  state.formMessage = `${employee.name} foi marcado como ${status.toLowerCase()}.`;
  renderPage();

  if (!supabaseClient || !employee.dbId) return;
  const { error } = await supabaseClient
    .from("hr_employees")
    .update({ status: employeeStatusToDb(status) })
    .eq("id", employee.dbId);

  if (error) {
    employees = employees.map((item) => (item.id === employeeId ? { ...item, status: oldStatus } : item));
    markRuntimeIndexesDirty();
    state.formMessage = `Status não foi gravado no Supabase: ${error.message}`;
    renderPage();
    return;
  }

  await recordEmployeeTimeline({
    employee,
    eventType: "colaborador",
    moduleName: "colaboradores",
    title: "Status do colaborador atualizado",
    description: `${oldStatus} → ${status}`,
    relatedTable: "hr_employees",
    relatedRecordId: employee.dbId,
    status,
  });
  await loadSupabaseData();
}

async function saveEmployeeDetails(employeeId) {
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) return;
  const readField = (field) => document.querySelector(`[data-employee-field="${employeeId}:${field}"]`)?.value?.trim() || "";
  const leaderValue = readField("leader");
  const leader = employees.find((item) => (item.dbId || item.id) === leaderValue);
  const nextEmployee = {
    ...employee,
    name: readField("name") || employee.name,
    company: readField("company") || employee.company,
    department: readField("department") || employee.department,
    role: readField("role") || employee.role,
    manager: leader?.name || "Sem líder",
    status: document.querySelector(`[data-employee-status-select="${employeeId}"]`)?.value || employee.status,
  };

  employees = employees.map((item) => (item.id === employeeId ? nextEmployee : item));
  markRuntimeIndexesDirty();
  state.employeeEditId = "";
  state.formMessage = `${nextEmployee.name} foi atualizado na tabela de colaboradores.`;
  renderPage();

  if (!supabaseClient || !employee.dbId) return;
  try {
    const company = await getOrCreateCompany(nextEmployee.company);
    const department = await getOrCreateDepartment(company.id, nextEmployee.department);
    const position = await getOrCreatePosition(nextEmployee.role);
    const { error } = await supabaseClient
      .from("hr_employees")
      .update({
        full_name: nextEmployee.name,
        company_id: company.id,
        department_id: department.id,
        position_id: position.id,
        manager_employee_id: leader?.dbId || null,
        status: employeeStatusToDb(nextEmployee.status),
      })
      .eq("id", employee.dbId);

    if (error) throw error;
    await recordEmployeeTimeline({
      employee: nextEmployee,
      eventType: "colaborador",
      moduleName: "colaboradores",
      title: "Ficha funcional atualizada",
      description: "Dados cadastrais, empresa, setor, cargo ou liderança foram revisados.",
      relatedTable: "hr_employees",
      relatedRecordId: employee.dbId,
      status: nextEmployee.status,
      metadata: {
        previous_name: employee.name,
        previous_manager: employee.manager,
        manager: nextEmployee.manager,
      },
    });
    await loadSupabaseData();
  } catch (error) {
    state.formMessage = `Não foi possível gravar a alteração no Supabase: ${error.message}`;
    await loadSupabaseData();
  }
}

async function tryPersistRequest(form, fallbackProtocol, requestDraft = null) {
  if (!supabaseClient) return { ok: false, message: "cliente Supabase indisponível" };
  try {
    const selectedEmployeeId = form.get("employee_select") || form.get("employee");
    const selectedEmployee = employees.find((item) => item.id === selectedEmployeeId);
    const attachment = form.get("attachment");
    const requestType = await getRequestTypeByLabel(String(form.get("type")));
    const protocol = `RH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const company = await getOrCreateCompany(String(form.get("company") || selectedEmployee?.company || "Prodelar"));
    const { data, error } = await supabaseClient
      .from("hr_requests")
      .insert({
        protocol_number: protocol,
        request_type_id: requestType.id,
        company_id: company.id,
        employee_id: selectedEmployee?.dbId || null,
        status: requestDbStatus(requestDraft?.status || "Aberto"),
        title: String(form.get("title")),
        description: requestDraft?.description || String(form.get("description")),
        raw_data: {
          source: "app_form",
          local_employee_id: selectedEmployee?.id || null,
          fallback_protocol: fallbackProtocol,
          owner: requestDraft?.owner || form.get("owner"),
          workflow_owner: requestDraft?.owner || form.get("owner"),
          workflow_next: requestDraft?.next || "Gerência",
          workflow_status_label: requestDraft?.status || "Aberto",
          workflow_log: [
            {
              from: "Criação",
              to: requestDraft?.status || "Aberto",
              by: currentUser.name,
              at: new Date().toISOString(),
              action: "Abrir solicitação",
            },
          ],
          requester_name: currentUser.name,
          requester_profile: currentUser.profile,
          employee_name: selectedEmployee?.name || currentUser.name,
          company_name: company.name,
          attachment_name: attachment?.name || "",
          attachment_storage_provider: requestDraft?.attachmentStorage?.storage_provider || "google_drive",
          attachment_storage_mode: requestDraft?.attachmentStorage?.storage_mode || "test",
          drive_file_id: requestDraft?.attachmentStorage?.drive_file_id || "",
          drive_folder_id: requestDraft?.attachmentStorage?.drive_folder_id || "",
          drive_view_url: requestDraft?.attachmentStorage?.drive_view_url || "",
          sharing_mode: requestDraft?.attachmentStorage?.sharing_mode || "private",
        },
      })
      .select("id,protocol_number")
      .single();
    if (error) return { ok: false, message: error.message };

    await supabaseClient.from("hr_request_status_history").insert({
      request_id: data.id,
      new_status: requestDbStatus(requestDraft?.status || "Aberto"),
      notes: `Solicitação aberta pelo formulário do MVP RH. Dono inicial: ${requestDraft?.owner || form.get("owner") || "Supervisor"}.`,
    });

    await recordEmployeeTimeline({
      employee: selectedEmployee || currentEmployeeRecord(),
      eventType: "solicitacao",
      moduleName: "solicitacoes",
      title: `${data.protocol_number} - Solicitação criada`,
      description: requestDraft?.description || String(form.get("description") || ""),
      relatedTable: "hr_requests",
      relatedRecordId: data.id,
      status: requestDraft?.status || "Aberto",
      metadata: {
        request_type: String(form.get("type") || ""),
        owner: requestDraft?.owner || form.get("owner") || "",
        next: requestDraft?.next || "Gerência",
      },
    });

    return { ok: true, id: data.id, protocol: data.protocol_number };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

async function queueRhEmail(input) {
  return {
    ok: true,
    skipped: true,
    status: "google_workspace_pendente",
    message: "Fila de e-mail pausada até configurar Google Workspace.",
  };
}

async function getOrCreateCompany(name) {
  const code = name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]+/g, "_");
  const existingByCode = await supabaseClient.from("hr_companies").select("id,name,code").eq("code", code).maybeSingle();
  if (existingByCode.error) throw new Error(existingByCode.error.message);
  if (existingByCode.data) return existingByCode.data;
  const existingByName = await supabaseClient.from("hr_companies").select("id,name,code").eq("name", name).maybeSingle();
  if (existingByName.error) throw new Error(existingByName.error.message);
  if (existingByName.data) return existingByName.data;
  const created = await supabaseClient.from("hr_companies").upsert({ code, name, legal_name: name }, { onConflict: "code" }).select("id,name,code").single();
  if (created.error) throw new Error(created.error.message);
  return created.data;
}

async function getOrCreateDepartment(companyId, name) {
  const existing = await supabaseClient
    .from("hr_departments")
    .select("id,name")
    .eq("company_id", companyId)
    .eq("name", name)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;
  const created = await supabaseClient
    .from("hr_departments")
    .insert({ company_id: companyId, name, code: name.slice(0, 20).toUpperCase() })
    .select("id,name")
    .single();
  if (created.error) throw new Error(created.error.message);
  return created.data;
}

async function getOrCreatePosition(name) {
  const existing = await supabaseClient.from("hr_positions").select("id,name").eq("name", name).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;
  const created = await supabaseClient
    .from("hr_positions")
    .insert({ name, code: name.slice(0, 24).toUpperCase() })
    .select("id,name")
    .single();
  if (created.error) throw new Error(created.error.message);
  return created.data;
}

async function getRequestTypeByLabel(label) {
  const map = {
    Admissão: "admission",
    Demissão: "termination",
    Férias: "vacation_schedule",
    Ponto: "time_clock_adjustment",
    Documento: "document_request",
    "Movimentação funcional": "functional_movement",
    "Atualização cadastral": "employee_data_update",
    "Ajuste de ponto": "time_clock_adjustment",
    "Atestado / afastamento": "medical_certificate",
    Benefício: "benefit_request",
    "Contracheque / pagamento": "paystub_payment_question",
    Treinamento: "training_request",
    "Dúvida ao RH": "hr_question",
  };
  const code = map[label] || "document_request";
  const existing = await supabaseClient.from("hr_request_types").select("id,code").eq("code", code).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;
  const created = await supabaseClient
    .from("hr_request_types")
    .insert({ code, name: label, default_sla_business_days: 3, requires_approval: false })
    .select("id,code")
    .single();
  if (created.error) throw new Error(created.error.message);
  return created.data;
}

clearOldPointTestData();
clearOldRoutineTestData();
clearSampleDataForSupabaseBoot();
const bootedFromCache = hydrateRuntimeDataCache();
renderPage();
verificarSessao()
  .then(() => renderPage())
  .catch((error) => {
    console.error("Erro ao verificar sessao Supabase Auth", error);
    state.authChecked = true;
    state.authMessage = "Não foi possível verificar a sessão no Supabase.";
    renderPage();
  });
if (supabaseClient?.auth) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      state.authSession = null;
      state.authUser = null;
      state.authProfile = null;
      state.authChecked = true;
      state.page = "portal";
      renderPage();
      return;
    }
    if (session?.access_token !== state.authSession?.access_token) {
      state.authSession = session || null;
      state.authChecked = true;
      if (session) loadAuthProfile(session).then(renderPage);
      else renderPage();
    }
  });
}
scheduleFreshDataLoad(bootedFromCache ? 1500 : 0);
