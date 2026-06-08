# Cadastros e permissões

## Cadastros principais

O app deve manter estes cadastros base:

- Empresas: Prodelar, Colmob e Servimec.
- Departamentos: vinculados à empresa, com status ativo/inativo.
- Cargos: nome, CBO e indicação se é cargo de liderança.
- Colaboradores: nome, CPF, matrícula, empresa, departamento, cargo, admissão, status e vínculos de liderança.
- Liderança: supervisor direto, gerente responsável e diretoria.

Nome e CPF são os campos que travam importação de ficha funcional. Os demais campos são opcionais para não bloquear leitura de PDF.

## Permissões

O sistema não deve descobrir liderança pelo texto do cargo. Deve usar vínculos explícitos:

- `supervisor_employee_id`: supervisor direto do colaborador.
- `manager_employee_id`: gerente responsável.
- `leadership_level`: employee, supervisor, manager, director ou hr.

Regras:

- Colaborador vê somente os próprios dados.
- Supervisor vê colaboradores onde `supervisor_employee_id` seja ele, incluindo férias, ponto, pendências operacionais e contracheques da equipe.
- Gerente vê colaboradores onde `manager_employee_id` seja ele, incluindo equipes abaixo dos supervisores, aprovações e contracheques do próprio escopo.
- RH vê todos.
- Diretoria vê todos e participa das aprovações estratégicas.

Contracheque continua sendo documento sensível, mas supervisor e gerente podem acessar os contracheques dos colaboradores sob sua gestão para apoio operacional, impressão e entrega. Esse acesso deve ser auditado. Salário consolidado, rescisão, advertências, ASO, dados médicos e documentos pessoais continuam restritos ao RH/diretoria.

## Solicitações e aprovações

O Kanban deve ser filtrado por escopo: cada usuário vê as próprias solicitações ou as solicitações sob sua responsabilidade.

Fluxo padrão:

- Colaborador -> Supervisor -> Gerente -> Diretoria.
- Supervisor -> Gerente -> Diretoria.
- Gerente -> Diretoria.
- RH executa/conclui quando a solicitação vira ação operacional.

Até orientação contrária, diretoria é aprovação final padrão.

Colaborador só pode abrir solicitações simples: atualização cadastral, ajuste de ponto, atestado/afastamento, férias, benefício, contracheque/pagamento, treinamento e dúvida ao RH. Admissão, demissão, movimentação funcional e pedidos sobre equipe ficam restritos a liderança, RH ou diretoria.

## Navegação

`Colaboradores` deve ficar no bloco de `Cadastros`, não na operação diária. `Documentos`, `Contracheques` e `Importações` devem ficar em bloco próprio abaixo de `Cadastros`, porque são áreas de consulta/manutenção eventual. A operação diária deve priorizar dashboard, solicitações, férias, admissão, demissão, ponto e portal.

## Atualizações mensais

Importações recorrentes devem atualizar os cadastros, não duplicar:

- Ficha funcional: atualiza colaborador por CPF.
- Contracheques: atualiza mapa de colaborador/empresa/departamento e documentos.
- Previsão de férias: substitui a base atual por competência, mas preserva histórico por período aquisitivo.
