import { useState, type FormEvent } from 'react'
import { Database, Search, ShieldCheck, AlertTriangle, KeyRound, CheckCircle2 } from 'lucide-react'

interface SqlInjectionSandboxProps {
  context?: {
    tableName: string
    initialRows: Array<Record<string, unknown>>
    schemaInfo: string
    vulnerableQueryTemplate: string
  }
}

export function SqlInjectionSandbox({ context }: SqlInjectionSandboxProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'login'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')

  // Search Results
  const [searchResults, setSearchResults] = useState<Array<Record<string, unknown>>>(
    context?.initialRows.filter((r) => r.is_released) || [
      { id: 1, title: 'Network Tap 10G', category: 'Hardware', price: 299 },
      { id: 2, title: 'Wireshark Field Guide', category: 'Books', price: 39 },
      { id: 3, title: 'Rubber Ducky USB', category: 'Hardware', price: 69 },
    ]
  )

  // Auth Status
  const [authStatus, setAuthStatus] = useState<{
    authenticated: boolean
    user?: string
    role?: string
    flag?: string
  } | null>(null)

  // Constructed SQL Query
  const constructedSearchQuery = searchQuery
    ? `SELECT * FROM products WHERE category = '${searchQuery}' AND is_released = 1;`
    : `SELECT * FROM products WHERE is_released = 1;`

  const constructedLoginQuery = `SELECT * FROM admin_users WHERE username = '${loginUser}' AND password_hash = '${loginPass ? 'HASH(...)' : ''}';`

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    const input = searchQuery.trim()

    // 1. Check for UNION based injection
    if (input.toLowerCase().includes('union') && input.toLowerCase().includes('confidential_inventory')) {
      setSearchResults([
        { id: 101, title: 'KW{un10n_b4s3d_d4t4_3xtr4ct}', category: 'Confidential Flag', price: 0 },
        { id: 102, title: 'Autonomous Red Team Implant Source Code', category: 'Confidential', price: 50000 },
        { id: 103, title: 'Defense Contractor Blueprint v3', category: 'Classified', price: 1000000 },
      ])
      return
    }

    // 2. Check for information_schema enumeration
    if (input.toLowerCase().includes('information_schema')) {
      setSearchResults([
        { id: 1, title: 'TABLE: products (id, title, category, price)', category: 'Schema', price: 0 },
        { id: 2, title: 'TABLE: confidential_inventory (id, secret_flag)', category: 'Schema', price: 0 },
        { id: 3, title: 'FLAG: KW{db_sch3m4_3num3r4t10n}', category: 'Database Metadata Flag', price: 0 },
      ])
      return
    }

    // 3. Check for tautology OR 1=1
    if (input.includes("' OR '1'='1") || input.includes("' OR 1=1") || input.includes("' OR true")) {
      // Return ALL products including unreleased prototypes
      setSearchResults([
        { id: 1, title: 'Network Tap 10G', category: 'Hardware', price: 299 },
        { id: 2, title: 'Wireshark Field Guide', category: 'Books', price: 39 },
        { id: 3, title: 'Rubber Ducky USB', category: 'Hardware', price: 69 },
        { id: 4, title: 'UNRELEASED PROTOTYPE: Quantum Cipher Cracker', category: 'Classified', price: 9999 },
      ])
      return
    }

    // Standard filter
    if (!input) {
      setSearchResults(context?.initialRows.filter((r) => r.is_released) || [])
      return
    }

    const filtered = (context?.initialRows || []).filter(
      (r) => r.is_released && String(r.category).toLowerCase().includes(input.toLowerCase())
    )
    setSearchResults(filtered)
  }

  function handleLoginSubmit(e: FormEvent) {
    e.preventDefault()
    const u = loginUser.trim()

    // Authentication bypass payloads
    if (
      u.includes("' OR '1'='1") ||
      u.includes("' OR 1=1") ||
      u.startsWith("admin' --") ||
      u.startsWith("admin' #") ||
      u.startsWith("admin'/*")
    ) {
      setAuthStatus({
        authenticated: true,
        user: 'admin',
        role: 'SUPERADMIN_ROOT',
        flag: 'KW{sql1_auth_byp4ss_succ3ss}',
      })
    } else {
      setAuthStatus({
        authenticated: false,
      })
    }
  }

  return (
    <div className="sqli-sandbox-container">
      {/* Mode Tabs */}
      <div className="sqli-mode-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`mode-tab ${activeTab === 'search' ? 'active' : ''}`}
        >
          <Search size={14} />
          <span>Product Catalog Search (UNION / Tautology)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('login')}
          className={`mode-tab ${activeTab === 'login' ? 'active' : ''}`}
        >
          <KeyRound size={14} />
          <span>Admin Portal Login (Auth Bypass)</span>
        </button>
      </div>

      {/* SQL Construction Visualizer */}
      <div className="sql-query-visualizer">
        <div className="visualizer-header">
          <Database size={13} className="text-amber-400" />
          <span>Constructed SQL Query (Simulated Backend Execution)</span>
        </div>
        <div className="visualizer-code">
          <code>{activeTab === 'search' ? constructedSearchQuery : constructedLoginQuery}</code>
        </div>
      </div>

      {activeTab === 'search' ? (
        <div className="sqli-search-section">
          {/* Search Bar & Quick Payloads */}
          <form onSubmit={handleSearchSubmit} className="sqli-search-form">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category or inject SQL (e.g. ' OR 1=1 --)"
                className="sqli-input"
              />
              <button type="submit" className="sqli-btn">
                Execute Query
              </button>
            </div>

            <div className="quick-payloads">
              <span className="text-xs text-zinc-400 font-mono">Quick Injections:</span>
              <button
                type="button"
                onClick={() => setSearchQuery("' OR 1=1 --")}
                className="payload-pill"
              >
                Tautology (' OR 1=1 --)
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery("' UNION SELECT id, security_flag, 0, 0 FROM confidential_inventory --")}
                className="payload-pill"
              >
                UNION Extraction
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery("' UNION SELECT 1, table_name, 0, 0 FROM information_schema.tables --")}
                className="payload-pill"
              >
                Schema Dump
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults(context?.initialRows.filter((r) => r.is_released) || [])
                }}
                className="payload-pill reset"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Results Table */}
          <div className="sqli-results-table">
            <div className="results-header">
              <span>Returned Database Rows ({searchResults.length})</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th className="w-16">ID</th>
                  <th>Title / Data</th>
                  <th>Category / Schema</th>
                  <th className="w-24">Price</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((row, idx) => (
                  <tr key={idx}>
                    <td className="font-mono text-zinc-400">{String(row.id)}</td>
                    <td className="font-mono text-zinc-200 font-medium">
                      {String(row.title)}
                      {String(row.title).includes('KW{') && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          CAPTURED FLAG
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-zinc-400">{String(row.category)}</td>
                    <td className="font-mono text-cyan-400">${String(row.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="sqli-login-section">
          {/* Login Simulation Form */}
          <div className="login-box-container">
            <form onSubmit={handleLoginSubmit} className="login-box">
              <h4 className="text-base font-semibold text-zinc-100 mb-1">Internal Administrative Portal</h4>
              <p className="text-xs text-zinc-400 mb-4">
                Test authentication bypass vulnerability with tautology input.
              </p>

              <div className="mb-3">
                <label className="block text-xs font-mono text-zinc-300 mb-1">Username / Identifier</label>
                <input
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="admin or admin' OR '1'='1"
                  className="sqli-input w-full"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-mono text-zinc-300 mb-1">Password</label>
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Enter password (or leave blank if bypassed)"
                  className="sqli-input w-full"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="sqli-btn w-full">
                  Attempt Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setLoginUser("admin' OR '1'='1")}
                  className="payload-pill"
                >
                  Fill Bypass
                </button>
              </div>

              {authStatus && (
                <div
                  className={`mt-4 p-3 rounded text-xs ${
                    authStatus.authenticated
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                      : 'bg-red-950/60 border border-red-500/40 text-red-200'
                  }`}
                >
                  {authStatus.authenticated ? (
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
                        <CheckCircle2 size={14} />
                        <span>Authentication Bypassed! Logged in as: {authStatus.user}</span>
                      </div>
                      <div>Role: <span className="font-mono text-emerald-300">{authStatus.role}</span></div>
                      <div className="mt-2 p-1.5 bg-black/40 rounded border border-emerald-800 font-mono text-emerald-400 select-all">
                        {authStatus.flag}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-red-400" />
                      <span>Invalid credentials. Authentication rejected.</span>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Educational Remediation Box */}
      <div className="sqli-educational-footer">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
          <ShieldCheck size={14} />
          <span>Vulnerability Remediation / Prepared Statements:</span>
        </div>
        <p className="text-xs text-zinc-400">
          SQL injection occurs when user input is concatenated directly into SQL command strings. To eliminate SQLi,
          always use <strong>Parameterized Queries (Prepared Statements)</strong> where input is passed as separate data
          parameters, never executed as code.
        </p>
      </div>
    </div>
  )
}
