# Body Health Pro - Referência de Arquitetura & Padrões

## Visão Geral

Body Health Pro é um sistema monorepo para avaliação corporal com histórico e comparação evolutiva. Arquitetura:
- **3 apps Vite/React**: admin (gerenciador), client (clientes), site (marketing)
- **Supabase PostgreSQL**: autenticação RLS, dados de avaliações
- **PDF Reports**: geração dinâmica com jsPDF + Chart.js

---

## Estrutura do Projeto

```
bodyhealthpro/
├── apps/
│   ├── admin/           # Dashboard para profissionais
│   ├── client/          # App para clientes
│   └── site/            # Landing page
├── packages/
│   ├── core/            # Business logic (cálculos)
│   ├── database/        # SQL scripts + tipos
│   ├── auth/            # Autenticação
│   ├── validation/      # Schemas Zod
│   └── ui/              # Componentes compartilhados
└── package.json         # Monorepo root
```

---

## Padrões de Código

### 1. Tipos e Type Safety

**Evitar `any`:**
```typescript
// ❌ EVITAR
function renderPDF(doc: any): void {}

// ✅ PREFERIR
import type { jsPDF } from 'jspdf'
type PDFDocument = InstanceType<typeof jsPDF>
function renderPDF(doc: PDFDocument): void {}
```

**Chart.js Options:**
```typescript
// ✅ Use `as const` para Chart options
options: {
  scales: { y: { beginAtZero: true } }
} as const  // Evita any, mantém type safety
```

### 2. Async/Await & Promises

**Dynamic Imports com Cache:**
```typescript
// ✅ PADRÃO: Memoizar imports dinâmicos
let dependencyPromise: Promise<Deps> | null = null

async function loadDeps(): Promise<Deps> {
  if (!dependencyPromise) {
    dependencyPromise = Promise.all([
      import('module1'),
      import('module2')
    ]).then(([m1, m2]) => {
      // setup
      return { m1, m2 }
    })
  }
  return dependencyPromise
}
```

### 3. Memoização & Performance

**Cache para Computações Custosas:**
```typescript
// ✅ Usar Map com chave derivada
const computeCache = new Map<string, Result>()

function memoizedCompute(inputs: Input[]): Result {
  const key = createCacheKey(inputs)  // Sorted IDs
  
  if (computeCache.has(key)) {
    return computeCache.get(key)!
  }
  
  const result = expensiveOperation(inputs)
  computeCache.set(key, result)
  return result
}

// Cache key deve ser determinístico
function createCacheKey(ids: number[]): string {
  return [...ids].sort((a, b) => a - b).join(',')
}
```

**Quando usar memoização:**
- Computações de time-series (extracting data arrays)
- Transformações de dados reutilizadas
- Cálculos de gráficos repetidos

### 4. Componentização & Decomposição

**PDF Generation Pattern:**
```typescript
// ✅ Separar concerns:
// 1. Builderes (extraem dados)
// 2. Renderers (desenham)
// 3. Orchestrators (coordenam)

async function generatePDF(doc: PDFDocument, data: Data[]): Promise<void> {
  // 1. Build data
  const header = buildHeader(doc, data)
  
  // 2. Render sections
  const yAfter = await renderCharts(doc, header)
  renderTables(doc, yAfter)
  
  // 3. Save
  doc.save('report.pdf')
}
```

**Naming Convention:**
- `build*()` - extrai/prepara dados (puro, síncrono)
- `render*()` - desenha no documento (pode ser async)
- `generate*()` - orquestra fluxo completo

### 5. Tratamento de Erros

**RLS Errors (Supabase):**
```typescript
// ✅ Erro 42501 = violação de RLS
try {
  await createAvaliacao(data)
} catch (error: any) {
  if (error.code === '42501') {
    throw new Error(
      'Sem permissão. Verifique: ' +
      '1) role do profile (deve ser "admin") ' +
      '2) tenant_id alinhado com profile'
    )
  }
}
```

### 6. Vite Chunk Splitting

**Bundle Optimization:**
```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['chart.js'],
          'report-pdf': ['jspdf', 'jspdf-autotable'],
          'report-chart': ['canvas-related']
        }
      }
    }
  }
}
```

**Alvo:** chunks < 500KB, entry < 50KB

### 7. React Hooks Patterns

**useCallback para estabilidade:**
```typescript
// ✅ Memoizar callbacks passados como props
const handleEdit = useCallback((id: number) => {
  // ...
}, [])  // Deps array

// ✅ useState com inicializador para lógica complexa
const [state, setState] = useState(() => {
  return expensiveInitialization()
})
```

---

## Fluxos Principais

### PDF Generation (Single)

```
EvaluationHistory Component
  ↓
  handleGeneratePDF()
    ↓
    loadReportDeps() [memoized]
    ↓
    generateSingleEvaluationPdf()
      ├─ renderSingleOverviewPage()
      │  ├─ createChartImage() [doughnut]
      │  └─ createChartImage() [bar]
      └─ renderSingleSummaryPage()
         ├─ buildSingleMeasureTables()
         └─ renderSingleAnthropometricSection()
    ↓
    doc.save('avaliacoes-{timestamp}.pdf')
```

### PDF Generation (Comparative)

```
EvaluationHistory Component
  ↓
  handleGeneratePDF()
    ↓
    generateComparativePdf()
      ├─ buildComparativeHeaderAndSeries() [memoized]
      ├─ renderComparativeCharts()
      │  ├─ createChartImage() [line: fat%]
      │  ├─ createChartImage() [line: lean mass]
      │  ├─ createChartImage() [bar: weight]
      │  └─ createChartImage() [doughnut: final]
      └─ renderComparativeTablesAndSummary()
         ├─ comparison table
         ├─ skinfolds table
         └─ evolution summary
    ↓
    doc.save('avaliacoes-{timestamp}.pdf')
```

### RLS Query (Avaliacoes Access)

```
User Login (Supabase Auth)
  ↓
  Auth token + uid
  ↓
  SELECT * FROM avaliacoes
    ↓
    RLS Policy: admin_manage_avaliacoes
      ├─ auth.uid() IN (SELECT user_id FROM profiles WHERE role='admin')
      ├─ profiles.tenant_id = avaliacoes.tenant_id
      └─ RESULT: rows filtered by tenant
```

---

## Database Schema

### Core Tables

**profiles**
```sql
- user_id (uuid, PK)
- tenant_id (uuid)
- role ('admin' | 'client')
- email (string)
```

**avaliacoes**
```sql
- id (int, PK)
- cliente_id (int, FK)
- tenant_id (uuid)
- data_avaliacao (date)
- peso, altura (numeric)
- peitoral, abdominal, coxa, ... (numeric)
- percentualGordura, massaMagraKg, massaGorduraKg (computed)
- criado_em (timestamp)
```

**RLS Policy: admin_manage_avaliacoes**
```sql
CREATE POLICY admin_manage_avaliacoes ON avaliacoes
  AS PERMISSIVE
  FOR SELECT/INSERT/UPDATE/DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role = 'admin'
    )
    AND tenant_id = (
      SELECT tenant_id FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
```

---

## Performance Benchmarks

### Build Metrics

| Métrica | Target | Current |
|---------|--------|---------|
| Entry chunk | < 50KB | ~35KB |
| Charts chunk | < 400KB | ~379KB |
| Report chunk | < 400KB | ~380KB |
| Build time | < 500ms | ~470ms |
| PWA precache | < 50 entries | 31 entries |

### Runtime Optimizations

- ✅ Lazy load routes (React.lazy)
- ✅ Dynamic imports para jsPDF/Chart
- ✅ Memoizar deps (loadReportDeps)
- ✅ Cache time-series (memoizedBuildSeries)
- ✅ Destroy charts após render (chart.destroy())

---

## Troubleshooting

### RLS 42501 Error

**Causa:** User não tem role='admin' ou tenant_id não alinha

**Solução:**
```sql
-- Diagnostic SQL
SELECT user_id, tenant_id, role FROM profiles WHERE user_id = 'YOUR_UID';
SELECT * FROM avaliacoes LIMIT 1;

-- Usuário é admin?
UPDATE profiles SET role = 'admin' WHERE user_id = 'YOUR_UID';

-- Tenant alinha?
UPDATE profiles 
SET tenant_id = (SELECT tenant_id FROM profiles WHERE role='admin' LIMIT 1)
WHERE user_id = 'YOUR_UID';
```

### Build Errors (as any)

**Solução:**
```typescript
// ❌ ANTES
options: {} as any

// ✅ DEPOIS
options: {} as const  // Se literais
// OU
type ChartOptions = Parameters<typeof Chart>[2]
options: {} as ChartOptions  // Se type preciso
```

### Chart Memory Leaks

**Padrão correto:**
```typescript
const chartInstance = new Chart(canvas, config)
await wait(300)  // Render time
const image = canvas.toDataURL()
chartInstance.destroy()  // CRUCIAL: limpar resources
```

---

## Testing Strategy

### Unit Tests (Jest)
- Calculadores de body composition
- Formatters de data/moeda
- Builders de séries (sem side effects)

### Integration Tests
- Fluxo PDF: generate → download
- RLS policies: admin vs client access
- Supabase auth flow

### E2E Tests (Cypress)
- PDF generation completo
- Multi-selection de avaliações
- Comparativo before/after

---

## Deployment Checklist

- [ ] Build passes: `npm run build`
- [ ] No TypeScript errors: `npm run lint`
- [ ] Tests pass: `npm run test`
- [ ] Bundle < 1MB
- [ ] PWA cache validated
- [ ] RLS policies reviewed
- [ ] Error messages user-friendly
- [ ] Env vars documentados (.env.example)

---

## Referências Úteis

- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **jsPDF:** https://github.com/parallax/jsPDF
- **Chart.js:** https://www.chartjs.org/
- **Vite Guide:** https://vitejs.dev/guide/
- **React Best Practices:** https://react.dev/reference

