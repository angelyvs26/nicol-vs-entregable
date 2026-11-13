import { SIGNATURE_ID, UblInvoiceXmlGenerator, isValidRuc } from './ubl-invoice-xml-generator';

describe('UblInvoiceXmlGenerator (Anexo 9-A Estándar UBL 2.1, RS 114-2019)', () => {
  const generator = new UblInvoiceXmlGenerator();
  const input = {
    documentId: 'F001-123',
    issueDate: '2026-11-12',
    issueTime: '13:25:51',
    issuer: {
      ruc: '20512345671',
      legalName: 'Emisor de prueba S.A.C.',
      tradeName: 'Abarrotes Prueba',
    },
    invoice: {
      customer: {
        documentType: '6',
        documentNumber: '20601234565',
        legalName: 'Cliente de prueba S.A.C.',
      },
      series: 'F001',
      correlative: '123',
      currency: 'PEN' as const,
      items: [
        {
          productCode: 'ABR-001',
          description: 'Café <especial> & producto',
          quantity: 1,
          unitSaleValue: 100,
          igvAffectationCode: '10',
        },
      ],
    },
  };
  type Input = Parameters<UblInvoiceXmlGenerator['generate']>[0];
  const generate = (overrides: Partial<Input> = {}) =>
    generator.generate({ ...input, ...overrides } as Input).toString('latin1');
  const withInvoice = (invoice: Partial<Input['invoice']>) => ({
    invoice: { ...input.invoice, ...invoice },
  });

  it('genera la cabecera con versión, hora, tipo de documento y tipo de operación', () => {
    const xml = generate();

    expect(xml).toContain('encoding="ISO-8859-1"');
    expect(xml).toContain('<cbc:UBLVersionID>2.1</cbc:UBLVersionID>');
    expect(xml).toContain('<cbc:CustomizationID schemeAgencyName="PE:SUNAT">2.0</cbc:CustomizationID>');
    expect(xml).toContain('<cbc:ID>F001-123</cbc:ID>');
    expect(xml).toContain('<cbc:IssueTime>13:25:51</cbc:IssueTime>');
    expect(xml).toMatch(/<cbc:InvoiceTypeCode listID="0101"[^>]*catalogo01"[^>]*catalogo51">01<\/cbc:InvoiceTypeCode>/);
    expect(xml).not.toContain('cbc:ProfileID');
    expect(xml).toMatch(/<cbc:DocumentCurrencyCode listID="ISO 4217 Alpha"[^>]*>PEN<\/cbc:DocumentCurrencyCode>/);
  });

  it('referencia la firma digital y declara los namespaces ext y ds', () => {
    const xml = generate();

    expect(xml).toContain('xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"');
    expect(xml).toContain('xmlns:ds="http://www.w3.org/2000/09/xmldsig#"');
    expect(xml).toContain(`<cbc:URI>#${SIGNATURE_ID}</cbc:URI>`);
  });

  it('identifica emisor y cliente con PartyIdentification y PartyLegalEntity', () => {
    const xml = generate();

    expect(xml).toMatch(/<cac:PartyIdentification>\s*<cbc:ID schemeID="6"[^>]*catalogo06">20512345671<\/cbc:ID>/);
    expect(xml).toMatch(/<cac:PartyIdentification>\s*<cbc:ID schemeID="6"[^>]*catalogo06">20601234565<\/cbc:ID>/);
    expect(xml).toContain('<cbc:Name>Abarrotes Prueba</cbc:Name>');
    expect(xml).toMatch(/<cac:PartyLegalEntity>\s*<cbc:RegistrationName>Emisor de prueba S.A.C.<\/cbc:RegistrationName>/);
    expect(xml).toMatch(/<cac:PartyLegalEntity>\s*<cbc:RegistrationName>Cliente de prueba S.A.C.<\/cbc:RegistrationName>/);
    expect(xml).toMatch(/<cbc:AddressTypeCode [^>]*>0000<\/cbc:AddressTypeCode>/);
    expect(xml).not.toContain('cac:PartyTaxScheme');
  });

  it('informa forma de pago al contado por defecto', () => {
    const xml = generate();

    expect(xml).toMatch(/<cac:PaymentTerms>\s*<cbc:ID>FormaPago<\/cbc:ID>\s*<cbc:PaymentMeansID>Contado<\/cbc:PaymentMeansID>\s*<\/cac:PaymentTerms>/);
  });

  it('informa forma de pago al crédito con monto pendiente y cuotas', () => {
    const xml = generate(
      withInvoice({
        paymentForm: {
          type: 'Credito',
          installments: [
            { amount: 59, dueDate: '2026-12-12' },
            { amount: 59, dueDate: '2027-01-12' },
          ],
        },
      }),
    );

    expect(xml).toMatch(/<cbc:PaymentMeansID>Credito<\/cbc:PaymentMeansID>\s*<cbc:Amount currencyID="PEN">118.00<\/cbc:Amount>/);
    expect(xml).toMatch(/<cbc:PaymentMeansID>Cuota001<\/cbc:PaymentMeansID>\s*<cbc:Amount currencyID="PEN">59.00<\/cbc:Amount>\s*<cbc:PaymentDueDate>2026-12-12<\/cbc:PaymentDueDate>/);
    expect(xml).toContain('<cbc:PaymentMeansID>Cuota002</cbc:PaymentMeansID>');
  });

  it.each([
    ['sin cuotas', [], 'al menos una cuota'],
    ['cuota con monto cero', [{ amount: 0, dueDate: '2026-12-12' }], 'Cuota 1: el monto'],
    ['cuota vencida antes de la emisión', [{ amount: 50, dueDate: '2026-11-01' }], 'Cuota 1: la fecha'],
    ['cuotas que superan el total', [{ amount: 200, dueDate: '2026-12-12' }], 'no puede superar'],
  ])('rechaza crédito %s', (_, installments, message) => {
    const paymentForm = { type: 'Credito' as const, installments };

    expect(() => generate(withInvoice({ paymentForm }))).toThrow(message);
  });

  it('informa tributos con código, nombre y código internacional del Catálogo 05', () => {
    const xml = generate();

    expect(xml).toMatch(/<cbc:ID schemeName="Codigo de tributos"[^>]*catalogo05">1000<\/cbc:ID>/);
    expect(xml).toContain('<cbc:Name>IGV</cbc:Name>');
    expect(xml).toContain('<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>');
    expect(xml).toContain('<cbc:Percent>18.00</cbc:Percent>');
    expect(xml).toMatch(/<cbc:TaxExemptionReasonCode [^>]*catalogo07">10<\/cbc:TaxExemptionReasonCode>/);
  });

  it('pone la afectación IGV solo en la línea y no en el total de la cabecera', () => {
    const xml = generate();
    const header = xml.slice(0, xml.indexOf('<cac:InvoiceLine>'));

    expect(header).not.toContain('TaxExemptionReasonCode');
    expect(header).not.toContain('<cbc:Percent>');
  });

  it('calcula importes con dos decimales y totales sin TaxExclusiveAmount', () => {
    const xml = generate();

    expect(xml).toContain('currencyID="PEN">18.00</cbc:TaxAmount>');
    expect(xml).toContain('<cbc:LineExtensionAmount currencyID="PEN">100.00</cbc:LineExtensionAmount>');
    expect(xml).toContain('<cbc:TaxInclusiveAmount currencyID="PEN">118.00</cbc:TaxInclusiveAmount>');
    expect(xml).toContain('<cbc:PayableAmount currencyID="PEN">118.00</cbc:PayableAmount>');
    expect(xml).not.toContain('TaxExclusiveAmount');
  });

  it('informa unidad de medida, precio de venta unitario (Catálogo 16) y valor unitario', () => {
    const xml = generate();

    expect(xml).toMatch(/<cbc:InvoicedQuantity unitCode="NIU" unitCodeListID="UN\/ECE rec 20"[^>]*>1<\/cbc:InvoicedQuantity>/);
    expect(xml).toMatch(/<cbc:PriceAmount currencyID="PEN">118.00<\/cbc:PriceAmount>\s*<cbc:PriceTypeCode [^>]*catalogo16">01<\/cbc:PriceTypeCode>/);
    expect(xml).toMatch(/<cac:Price>\s*<cbc:PriceAmount currencyID="PEN">100.00<\/cbc:PriceAmount>/);
    expect(xml).toContain('<cbc:ID>ABR-001</cbc:ID>');
    expect(xml).toContain('Café &lt;especial&gt; &amp; producto');
  });

  it('suma el ISC a la base del IGV e informa el sistema ISC (Catálogo 08) en la línea', () => {
    const xml = generate(
      withInvoice({
        items: [
          { ...input.invoice.items[0], quantity: 2, unitSaleValue: 50, iscSystem: '01', iscAmount: 10 },
        ],
      }),
    );

    expect(xml).toContain('<cbc:TierRange>01</cbc:TierRange>');
    expect(xml).toMatch(/>2000<\/cbc:ID>\s*<cbc:Name>ISC<\/cbc:Name>\s*<cbc:TaxTypeCode>EXC<\/cbc:TaxTypeCode>/);
    expect(xml).toContain('<cbc:TaxableAmount currencyID="PEN">110.00</cbc:TaxableAmount>');
    expect(xml).toContain('currencyID="PEN">19.80</cbc:TaxAmount>');
    expect(xml).toContain('<cbc:PayableAmount currencyID="PEN">129.80</cbc:PayableAmount>');
  });

  it('valida el dígito verificador del RUC', () => {
    expect(isValidRuc('20512345671')).toBe(true);
    expect(isValidRuc('20123456789')).toBe(false);
    expect(isValidRuc('2051234567')).toBe(false);
    expect(() => generate({ issuer: { ...input.issuer, ruc: '20123456789' } })).toThrow('RUC del emisor');
    expect(() =>
      generate(withInvoice({ customer: { ...input.invoice.customer, documentNumber: '20601234560' } })),
    ).toThrow('RUC del cliente');
  });

  it('rechaza una hora de emisión o una serie con formato inválido', () => {
    expect(() => generate({ issueTime: '1:25' })).toThrow('issueTime debe ser una hora válida');
    expect(() => generate({ documentId: 'B001-1' })).toThrow('F###-NNNNNNNN');
  });

  it('acepta tildes y eñes de ISO-8859-1', () => {
    const xml = generate({ issuer: { ...input.issuer, legalName: 'Panadería Muñoz E.I.R.L.' } });

    expect(xml).toContain('Panadería Muñoz E.I.R.L.');
  });

  it('rechaza caracteres fuera de ISO-8859-1, incluidos emojis, en vez de corromperlos', () => {
    const withDescription = (description: string) =>
      withInvoice({ items: [{ ...input.invoice.items[0], description }] });

    expect(() => generate(withDescription('Gaseosa 🥤'))).toThrow('ISO-8859-1');
    expect(() => generate(withDescription('Azúcar – 1 kg'))).toThrow('ISO-8859-1');
  });

  it('rechaza fechas, horas y correlativos imposibles', () => {
    expect(() => generate({ issueDate: '2026-13-45' })).toThrow('issueDate');
    expect(() => generate({ issueDate: '2026-02-30' })).toThrow('issueDate');
    expect(() => generate({ issueTime: '25:61:99' })).toThrow('issueTime');
    expect(() => generate({ documentId: 'F001-0' })).toThrow('correlativo desde 1');
    expect(() => generate({ documentId: 'F001-007' })).toThrow('correlativo desde 1');
  });

  it.each([
    ['cantidad cero', { quantity: 0 }, 'la cantidad debe ser mayor que cero'],
    ['cantidad negativa', { quantity: -2 }, 'la cantidad debe ser mayor que cero'],
    ['valor unitario negativo', { unitSaleValue: -3 }, 'el valor unitario debe ser mayor que cero'],
    ['descripción vacía', { description: '  ' }, 'la descripción es obligatoria'],
    ['ISC negativo', { iscSystem: '01', iscAmount: -1 }, 'el monto de ISC no puede ser negativo'],
  ])('rechaza una línea con %s', (_, change, message) => {
    const items = [{ ...input.invoice.items[0], ...change }];

    expect(() => generate(withInvoice({ items }))).toThrow(`Línea 1: ${message}`);
  });

  it('acepta cantidades decimales y otra unidad de medida', () => {
    const xml = generate(
      withInvoice({
        items: [{ ...input.invoice.items[0], quantity: 0.75, unitCode: 'KGM', unitSaleValue: 22.9 }],
      }),
    );

    expect(xml).toMatch(/unitCode="KGM"[^>]*>0.75<\/cbc:InvoicedQuantity>/);
    expect(xml).toContain('<cbc:LineExtensionAmount currencyID="PEN">17.18</cbc:LineExtensionAmount>');
    expect(xml).toContain('<cbc:PayableAmount currencyID="PEN">20.27</cbc:PayableAmount>');
  });

  it('rechaza códigos de afectación sin mapeo tributario verificado', () => {
    const items = [{ ...input.invoice.items[0], igvAffectationCode: '20' }];

    expect(() => generate(withInvoice({ items }))).toThrow('Afectación IGV "20" no está soportada');
  });
});
