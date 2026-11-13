import { useState, type FormEvent } from 'react'
import './App.css'

type Item = {
  id: number
  productCode: string
  description: string
  quantity: string
  unitCode: string
  unitSaleValue: string
  iscSystem: string
  iscAmount: string
}

type Installment = {
  id: number
  amount: string
  dueDate: string
}

const initialItems: Item[] = [
  {
    id: 1,
    productCode: 'ABR-001',
    description: 'Producto gravado de ejemplo',
    quantity: '2',
    unitCode: 'NIU',
    unitSaleValue: '50',
    iscSystem: '',
    iscAmount: '',
  },
]

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(value)

function App() {
  const [issuer, setIssuer] = useState({
    ruc: '20512345671',
    legalName: 'Emisor de ejemplo S.A.C.',
    tradeName: 'Comercial de ejemplo',
  })
  const [documentId, setDocumentId] = useState('F001-123')
  const [issueDate, setIssueDate] = useState('2026-11-12')
  const [issueTime, setIssueTime] = useState('13:25:51')
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN')
  const [customer, setCustomer] = useState({
    documentNumber: '20601234565',
    legalName: 'Cliente de ejemplo S.A.C.',
  })
  const [items, setItems] = useState(initialItems)
  const [paymentType, setPaymentType] = useState<'Contado' | 'Credito'>('Contado')
  const [installments, setInstallments] = useState<Installment[]>([])
  const [xml, setXml] = useState('')
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const saleValue = items.reduce(
    (total, item) => total + Number(item.quantity || 0) * Number(item.unitSaleValue || 0),
    0,
  )
  const iscAmount = items.reduce((total, item) => total + Number(item.iscAmount || 0), 0)
  const igvAmount = (saleValue + iscAmount) * 0.18
  const totalAmount = saleValue + iscAmount + igvAmount

  const updateIssuer = (field: keyof typeof issuer, value: string) =>
    setIssuer((current) => ({ ...current, [field]: value }))

  const updateCustomer = (field: keyof typeof customer, value: string) =>
    setCustomer((current) => ({ ...current, [field]: value }))

  const updateItem = (id: number, field: keyof Item, value: string) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )

  const addItem = () =>
    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        productCode: '',
        description: '',
        quantity: '1',
        unitCode: 'NIU',
        unitSaleValue: '0',
        iscSystem: '',
        iscAmount: '',
      },
    ])

  const addInstallment = () =>
    setInstallments((current) => [
      ...current,
      { id: Date.now(), amount: '', dueDate: '' },
    ])

  const updateInstallment = (id: number, field: 'amount' | 'dueDate', value: string) =>
    setInstallments((current) =>
      current.map((installment) =>
        installment.id === id ? { ...installment, [field]: value } : installment,
      ),
    )

  const generateXml = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setXml('')

    const [series, correlative] = documentId.trim().split('-')
    if (!series || !correlative || documentId.trim().split('-').length !== 2) {
      setError('Ingresa serie y correlativo en el formato F001-123.')
      return
    }

    const paymentForm =
      paymentType === 'Contado'
        ? { type: 'Contado' }
        : {
            type: 'Credito',
            installments: installments.map((installment) => ({
              amount: Number(installment.amount),
              dueDate: installment.dueDate,
            })),
          }

    const payload = {
      documentId: documentId.trim(),
      issueDate,
      // Los navegadores omiten los segundos cuando valen 00 ("13:25"); el backend exige hh:mm:ss.
      issueTime: /^\d{2}:\d{2}$/.test(issueTime) ? `${issueTime}:00` : issueTime,
      operationType: '0101',
      issuer,
      invoice: {
        customer: { documentType: '6', ...customer },
        series,
        correlative,
        currency,
        items: items.map((item) => ({
          productCode: item.productCode || undefined,
          description: item.description,
          quantity: Number(item.quantity),
          unitCode: item.unitCode || 'NIU',
          unitSaleValue: Number(item.unitSaleValue),
          igvAffectationCode: '10',
          iscSystem: item.iscSystem || undefined,
          // El monto ISC solo se envía si hay sistema ISC (el campo se oculta sin sistema).
          iscAmount: !item.iscSystem || item.iscAmount === '' ? undefined : Number(item.iscAmount),
        })),
        paymentForm,
      },
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/v1/comprobantes/facturas/xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        setError(body?.message ?? `No se pudo generar el XML (HTTP ${response.status}).`)
        return
      }

      const xmlBytes = await response.arrayBuffer()
      const generatedXml = new TextDecoder('iso-8859-1').decode(xmlBytes)
      setXml(generatedXml)

      const filename = response.headers
        .get('Content-Disposition')
        ?.match(/filename="?([^";]+)"?/i)?.[1] ?? 'factura.xml'
      const downloadUrl = URL.createObjectURL(
        new Blob([xmlBytes], { type: 'application/xml;charset=ISO-8859-1' }),
      )
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch {
      setError('No se pudo conectar con el backend. Verifica que esté iniciado.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">A</span>
          <div>
            <p className="eyebrow">ABC SOFTWARE CORP</p>
            <p className="brand-title">Emisión de comprobantes</p>
          </div>
        </div>
        <div className="connection-state"><span /> Generación UBL 2.1</div>
      </header>

      <div className="page-heading">
        <div>
          <p className="eyebrow">FACTURA ELECTRÓNICA</p>
          <h1>Nueva factura</h1>
        </div>
        <label className="document-number">
          <span>Serie-correlativo</span>
          <input
            aria-label="Serie-correlativo"
            value={documentId}
            onChange={(event) => setDocumentId(event.target.value)}
            required
          />
        </label>
      </div>

      <form onSubmit={generateXml}>
        <section className="form-section">
          <div className="section-heading">
            <span className="section-index">01</span>
            <div><h2>Emisor</h2><p>Datos fiscales de la empresa</p></div>
          </div>
          <div className="field-grid issuer-grid">
            <label>RUC<input value={issuer.ruc} onChange={(event) => updateIssuer('ruc', event.target.value)} inputMode="numeric" required /></label>
            <label>Razón social<input value={issuer.legalName} onChange={(event) => updateIssuer('legalName', event.target.value)} required /></label>
            <label>Nombre comercial<input value={issuer.tradeName} onChange={(event) => updateIssuer('tradeName', event.target.value)} /></label>
          </div>
        </section>

        <section className="form-section">
          <div className="section-heading">
            <span className="section-index">02</span>
            <div><h2>Datos de emisión</h2><p>Identificación, fecha y moneda</p></div>
          </div>
          <div className="field-grid emission-grid">
            <label>Fecha<input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required /></label>
            <label>Hora<input type="time" step="1" value={issueTime} onChange={(event) => setIssueTime(event.target.value)} required /></label>
            <label>Moneda<select value={currency} onChange={(event) => setCurrency(event.target.value as 'PEN' | 'USD')}><option value="PEN">PEN · Sol</option><option value="USD">USD · Dólar</option></select></label>
          </div>
        </section>

        <section className="form-section">
          <div className="section-heading">
            <span className="section-index">03</span>
            <div><h2>Cliente</h2><p>Adquirente con RUC</p></div>
          </div>
          <div className="field-grid customer-grid">
            <label>RUC<input value={customer.documentNumber} onChange={(event) => updateCustomer('documentNumber', event.target.value)} inputMode="numeric" required /></label>
            <label>Razón social<input value={customer.legalName} onChange={(event) => updateCustomer('legalName', event.target.value)} required /></label>
          </div>
        </section>

        <section className="form-section items-section">
          <div className="section-heading section-heading-row">
            <div className="section-heading-main">
              <span className="section-index">04</span>
              <div><h2>Detalle de venta</h2><p>IGV afectación 10 · Gravado - Operación onerosa</p></div>
            </div>
            <button type="button" className="secondary-button" onClick={addItem}>＋ Agregar ítem</button>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Código</th><th>Descripción</th><th>Cantidad</th><th>Unidad</th><th>Valor unitario</th><th>ISC</th><th aria-label="Acciones" /></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><input aria-label="Código de producto" value={item.productCode} onChange={(event) => updateItem(item.id, 'productCode', event.target.value)} /></td>
                    <td><input aria-label="Descripción" value={item.description} onChange={(event) => updateItem(item.id, 'description', event.target.value)} required /></td>
                    <td><input aria-label="Cantidad" type="number" min="0.000001" step="any" value={item.quantity} onChange={(event) => updateItem(item.id, 'quantity', event.target.value)} required /></td>
                    <td><input aria-label="Unidad de medida" value={item.unitCode} onChange={(event) => updateItem(item.id, 'unitCode', event.target.value)} /></td>
                    <td><input aria-label="Valor unitario sin IGV" type="number" min="0.01" step="any" value={item.unitSaleValue} onChange={(event) => updateItem(item.id, 'unitSaleValue', event.target.value)} required /></td>
                    <td className="isc-cell">
                      <select aria-label="Sistema ISC" value={item.iscSystem} onChange={(event) => updateItem(item.id, 'iscSystem', event.target.value)}>
                        <option value="">Sin ISC</option><option value="01">01 · Valor</option><option value="02">02 · Monto fijo</option><option value="03">03 · Precio público</option>
                      </select>
                      {item.iscSystem && <input aria-label="Monto ISC" type="number" min="0" step="any" placeholder="Monto ISC" value={item.iscAmount} onChange={(event) => updateItem(item.id, 'iscAmount', event.target.value)} />}
                    </td>
                    <td><button type="button" className="remove-button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} disabled={items.length === 1}>Quitar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="form-section payment-section">
          <div className="section-heading">
            <span className="section-index">05</span>
            <div><h2>Forma de pago</h2><p>Contado o crédito con vencimientos</p></div>
          </div>
          <div className="segmented-control" role="group" aria-label="Forma de pago">
            <button type="button" className={paymentType === 'Contado' ? 'selected' : ''} onClick={() => setPaymentType('Contado')}>Contado</button>
            <button type="button" className={paymentType === 'Credito' ? 'selected' : ''} onClick={() => setPaymentType('Credito')}>Crédito</button>
          </div>
          {paymentType === 'Credito' && (
            <div className="installment-list">
              {installments.map((installment, index) => (
                <div className="installment-row" key={installment.id}>
                  <span className="quota-label">Cuota {String(index + 1).padStart(3, '0')}</span>
                  <label>Monto<input type="number" min="0.01" step="0.01" value={installment.amount} onChange={(event) => updateInstallment(installment.id, 'amount', event.target.value)} required /></label>
                  <label>Vencimiento<input type="date" value={installment.dueDate} onChange={(event) => updateInstallment(installment.id, 'dueDate', event.target.value)} required /></label>
                  <button type="button" className="remove-button" onClick={() => setInstallments((current) => current.filter((entry) => entry.id !== installment.id))}>Quitar</button>
                </div>
              ))}
              <button type="button" className="secondary-button" onClick={addInstallment}>＋ Agregar cuota</button>
            </div>
          )}
        </section>

        <section className="summary-bar" aria-live="polite">
          <div><span>Valor de venta</span><strong>{money(saleValue, currency)}</strong></div>
          <div><span>ISC</span><strong>{money(iscAmount, currency)}</strong></div>
          <div><span>IGV 18 %</span><strong>{money(igvAmount, currency)}</strong></div>
          <div className="summary-total"><span>Total estimado</span><strong>{money(totalAmount, currency)}</strong></div>
          <p>Vista previa referencial. El backend calcula los importes del XML.</p>
        </section>

        {error && <p className="error-message" role="alert">{error}</p>}

        <div className="form-actions">
          <span>El XML se genera sin firma digital.</span>
          <button type="submit" className="primary-button" disabled={isGenerating}>
            {isGenerating ? 'Generando…' : 'Generar XML'}
          </button>
        </div>
      </form>

      {xml && (
        <section className="xml-output">
          <div className="output-heading"><div><p className="eyebrow">DOCUMENTO GENERADO</p><h2>XML UBL 2.1</h2></div><span className="success-state">Listo para descargar</span></div>
          <pre>{xml}</pre>
        </section>
      )}
    </main>
  )
}

export default App
