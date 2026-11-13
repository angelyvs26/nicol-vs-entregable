import Decimal from 'decimal.js';
import { create } from 'xmlbuilder2';

/**
 * Genera la factura electrónica (Invoice UBL 2.1) según el formato vigente de SUNAT:
 *
 * - [A] "Anexo N.° 9-A: Estándar UBL 2.1", Anexo VII de la RS N.° 114-2019/SUNAT.
 *   Los números [A-N] son los numerales de la tabla "a) Factura Electrónica".
 * - [FP] Forma de pago: Anexo IV de la RS N.° 000193-2020/SUNAT (numerales 170 a 173).
 *
 * El XML se entrega SIN firmar ([A-9]): la firma la agrega el puerto FirmadorXml,
 * que inserta ext:UBLExtensions/ext:UBLExtension/ext:ExtensionContent/ds:Signature
 * con Id = SIGNATURE_ID como primer hijo de Invoice. El XSD exige que
 * ExtensionContent contenga un elemento, por eso no se genera un contenedor vacío.
 */

interface InvoiceCustomer {
  documentType: string;
  documentNumber: string;
  legalName: string;
}

interface InvoiceItem {
  productCode?: string;
  description: string;
  quantity: number;
  unitCode?: string;
  unitSaleValue: number;
  igvAffectationCode: string;
  iscSystem?: string;
  iscRate?: number;
  iscAmount?: number;
  icbperQuantity?: number;
}

export interface PaymentInstallment {
  amount: number;
  dueDate: string;
}

/** [FP] Forma de pago obligatoria: contado o crédito (con cuotas). */
export type PaymentForm =
  | { type: 'Contado' }
  | { type: 'Credito'; installments: PaymentInstallment[] };

interface InvoiceRequest {
  customer: InvoiceCustomer;
  series: string;
  correlative?: string;
  currency: 'PEN' | 'USD';
  items: InvoiceItem[];
  paymentForm?: PaymentForm;
}

export interface UblInvoiceXmlInput {
  invoice: InvoiceRequest;
  issuer: {
    ruc: string;
    legalName: string;
    tradeName?: string;
    addressTypeCode?: string;
  };
  documentId: string;
  issueDate: string;
  issueTime: string;
  operationType?: string;
}

interface TaxScheme {
  id: string;
  name: string;
  typeCode: string;
}

interface TaxSummary {
  scheme: TaxScheme;
  taxableAmount: Decimal;
  taxAmount: Decimal;
  percent?: Decimal;
  affectationCode?: string;
  iscSystem?: string;
}

interface CalculatedLine {
  lineExtensionAmount: Decimal;
  taxes: TaxSummary[];
  unitPriceWithTaxes: Decimal;
}

type XmlNode = ReturnType<ReturnType<typeof create>['ele']>;

export const SIGNATURE_ID = 'SignatureSP';

/** Catálogo 05 (RS 150-2019, Anexo VI): código, nombre y código internacional. */
const TAX_SCHEMES = {
  IGV: { id: '1000', name: 'IGV', typeCode: 'VAT' },
  ISC: { id: '2000', name: 'ISC', typeCode: 'EXC' },
} satisfies Record<string, TaxScheme>;

const IGV_RATE = new Decimal('18');

const namespaces = {
  invoice: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
  aggregate: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  basic: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
  extension: 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
  signature: 'http://www.w3.org/2000/09/xmldsig#',
};

const SUNAT_AGENCY = 'PE:SUNAT';
const UNECE_AGENCY = 'United Nations Economic Commission for Europe';
const catalogUri = (catalog: string) =>
  `urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo${catalog}`;

/** Cualquier carácter fuera de ISO-8859-1 (U+0100 en adelante, incluidos emojis). */
const NON_LATIN1 = /[Ā-\u{10FFFF}]/u;

/** n(12,2): importes con exactamente dos decimales. */
const amount = (value: Decimal) => value.toFixed(2, Decimal.ROUND_HALF_UP);
/** n(12,10): valores unitarios con al menos dos y hasta diez decimales. */
const unitAmount = (value: Decimal) => {
  const rounded = value.toDecimalPlaces(10, Decimal.ROUND_HALF_UP);
  return rounded.decimalPlaces() < 2 ? rounded.toFixed(2) : rounded.toString();
};

/**
 * Dígito verificador del RUC (módulo 11 con pesos 5,4,3,2,7,6,5,4,3,2).
 * Algoritmo de uso público; su cita oficial queda Pendiente de verificar.
 */
export function isValidRuc(ruc: string): boolean {
  if (!/^(10|15|16|17|20)\d{9}$/.test(ruc)) {
    return false;
  }
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + weight * Number(ruc[index]), 0);
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === Number(ruc[10]);
}

export class UblInvoiceXmlGenerator {
  generate(input: UblInvoiceXmlInput): Buffer {
    this.validateInput(input);
    const currency = input.invoice.currency;

    const calculatedLines = input.invoice.items.map((item) => this.calculateLine(item));
    const headerTaxes = this.summarizeTaxes(calculatedLines);
    const lineExtensionTotal = this.sum(calculatedLines.map((line) => line.lineExtensionAmount));
    const taxTotal = this.sum(headerTaxes.map((tax) => tax.taxAmount));
    const payableAmount = lineExtensionTotal.plus(taxTotal);
    const paymentForm = input.invoice.paymentForm ?? { type: 'Contado' };
    this.validatePaymentForm(paymentForm, payableAmount, input.issueDate);

    const invoice = create({ version: '1.0', encoding: 'ISO-8859-1', standalone: false }).ele(
      'Invoice',
      {
        xmlns: namespaces.invoice,
        'xmlns:cac': namespaces.aggregate,
        'xmlns:cbc': namespaces.basic,
        'xmlns:ext': namespaces.extension,
        'xmlns:ds': namespaces.signature,
      },
    );

    // [A-1] y [A-2] Versión del UBL y de la estructura del documento.
    invoice.ele('cbc:UBLVersionID').txt('2.1');
    invoice.ele('cbc:CustomizationID', { schemeAgencyName: SUNAT_AGENCY }).txt('2.0');
    // [A-3], [A-4] y [A-5] Serie-correlativo, fecha y hora de emisión.
    invoice.ele('cbc:ID').txt(input.documentId);
    invoice.ele('cbc:IssueDate').txt(input.issueDate);
    invoice.ele('cbc:IssueTime').txt(input.issueTime);
    // [A-6] Tipo de documento (Catálogo 01) y [A-58] tipo de operación (Catálogo 51) en @listID.
    invoice
      .ele('cbc:InvoiceTypeCode', {
        listID: input.operationType ?? '0101',
        listAgencyName: SUNAT_AGENCY,
        listName: 'Tipo de Documento',
        listURI: catalogUri('01'),
        name: 'Tipo de Operacion',
        listSchemeURI: catalogUri('51'),
      })
      .txt('01');
    // [A-7] Moneda (Catálogo 02, ISO 4217).
    invoice
      .ele('cbc:DocumentCurrencyCode', {
        listID: 'ISO 4217 Alpha',
        listName: 'Currency',
        listAgencyName: UNECE_AGENCY,
      })
      .txt(currency);

    // [A-9] Datos de la firma: referencia a ds:Signature (#SignatureSP).
    this.appendSignature(invoice, input.issuer);
    // [A-10] a [A-16] Emisor; [A-17] y [A-18] adquirente.
    this.appendSupplier(invoice, input.issuer);
    this.appendCustomer(invoice, input.invoice.customer);
    // [FP] Forma de pago.
    this.appendPaymentTerms(invoice, paymentForm, payableAmount, currency);

    // [A-40] a [A-48] Monto total de tributos y sumatorias por tributo.
    this.appendTaxTotal(invoice, headerTaxes, taxTotal, currency, false);
    // [A-53] a [A-55] Totales.
    const total = invoice.ele('cac:LegalMonetaryTotal');
    total.ele('cbc:LineExtensionAmount', { currencyID: currency }).txt(amount(lineExtensionTotal));
    total.ele('cbc:TaxInclusiveAmount', { currencyID: currency }).txt(amount(payableAmount));
    total.ele('cbc:PayableAmount', { currencyID: currency }).txt(amount(payableAmount));

    calculatedLines.forEach((line, index) =>
      this.appendInvoiceLine(invoice, input.invoice.items[index], line, index + 1, currency),
    );

    const xml = invoice.doc().end({ prettyPrint: true });
    // Un carácter fuera de ISO-8859-1 se corrompería al codificar: se rechaza.
    const invalidChar = xml.match(NON_LATIN1);
    if (invalidChar) {
      throw new Error(`El carácter "${invalidChar[0]}" no se puede representar en ISO-8859-1`);
    }

    return Buffer.from(xml, 'latin1');
  }

  private validateInput(input: UblInvoiceXmlInput): void {
    // [A-3] Serie F + 3 alfanuméricos; correlativo de hasta 8 dígitos que inicia en 1.
    if (!/^F[A-Z0-9]{3}-[1-9][0-9]{0,7}$/.test(input.documentId)) {
      throw new Error('documentId debe tener el formato F###-NNNNNNNN (correlativo desde 1)');
    }
    if (!this.isValidDate(input.issueDate)) {
      throw new Error('issueDate debe ser una fecha válida con formato YYYY-MM-DD');
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(input.issueTime)) {
      throw new Error('issueTime debe ser una hora válida con formato hh:mm:ss');
    }
    if (!isValidRuc(input.issuer.ruc)) {
      throw new Error('El RUC del emisor no es válido (11 dígitos con dígito verificador)');
    }
    if (!input.issuer.legalName.trim() || !input.invoice.customer.legalName.trim()) {
      throw new Error('La razón social del emisor y del cliente es obligatoria');
    }
    if (input.invoice.customer.documentType !== '6') {
      throw new Error('La factura requiere cliente con RUC Catálogo 06 código "6"');
    }
    if (!isValidRuc(input.invoice.customer.documentNumber)) {
      throw new Error('El RUC del cliente no es válido (11 dígitos con dígito verificador)');
    }
    if (input.invoice.items.length === 0) {
      throw new Error('La factura requiere al menos una línea');
    }
    input.invoice.items.forEach((item, index) => this.validateItem(item, index + 1));
  }

  private validateItem(item: InvoiceItem, lineNumber: number): void {
    const line = `Línea ${lineNumber}:`;
    // [A-31] Descripción obligatoria, hasta 500 caracteres.
    const description = item.description.trim();
    if (!description || description.length > 500) {
      throw new Error(`${line} la descripción es obligatoria y admite hasta 500 caracteres`);
    }
    // [A-26] Cantidad mayor que cero.
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error(`${line} la cantidad debe ser mayor que cero`);
    }
    // [A-32] Valor unitario mayor que cero (las operaciones gratuitas no están soportadas).
    if (!Number.isFinite(item.unitSaleValue) || item.unitSaleValue <= 0) {
      throw new Error(`${line} el valor unitario debe ser mayor que cero`);
    }
    if (item.iscAmount !== undefined && (!Number.isFinite(item.iscAmount) || item.iscAmount < 0)) {
      throw new Error(`${line} el monto de ISC no puede ser negativo`);
    }
  }

  private validatePaymentForm(form: PaymentForm, payableAmount: Decimal, issueDate: string): void {
    if (form.type === 'Contado') {
      return;
    }
    if (form.installments.length === 0) {
      throw new Error('La forma de pago al crédito requiere al menos una cuota');
    }
    if (form.installments.length > 999) {
      throw new Error('La forma de pago al crédito admite hasta 999 cuotas');
    }
    form.installments.forEach((installment, index) => {
      const label = `Cuota ${index + 1}:`;
      if (!Number.isFinite(installment.amount) || installment.amount <= 0) {
        throw new Error(`${label} el monto debe ser mayor que cero`);
      }
      if (!this.isValidDate(installment.dueDate) || installment.dueDate <= issueDate) {
        throw new Error(`${label} la fecha de vencimiento debe ser válida y posterior a la emisión`);
      }
    });
    const installmentsTotal = this.sum(form.installments.map((i) => new Decimal(i.amount)));
    if (installmentsTotal.greaterThan(payableAmount)) {
      throw new Error('La suma de las cuotas no puede superar el importe total de la factura');
    }
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }

  private calculateLine(item: InvoiceItem): CalculatedLine {
    if (item.igvAffectationCode !== '10') {
      throw new Error(
        `Afectación IGV "${item.igvAffectationCode}" no está soportada: mapeo tributario pendiente de verificar`,
      );
    }
    if (item.iscRate !== undefined) {
      throw new Error('iscRate no está soportado sin parámetros ISC verificados');
    }
    if (item.icbperQuantity !== undefined) {
      throw new Error('ICBPER requiere un monto unitario configurado');
    }

    // [A-38] Valor de venta del ítem = cantidad x valor unitario.
    const lineExtensionAmount = new Decimal(item.quantity)
      .mul(item.unitSaleValue)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const taxes: TaxSummary[] = [];
    const iscAmount = new Decimal(item.iscAmount ?? 0).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    // [A-37] ISC: Catálogo 08 en cbc:TierRange; tributo 2000 / ISC / EXC.
    if (iscAmount.greaterThan(0)) {
      if (!item.iscSystem) {
        throw new Error('iscSystem es obligatorio cuando se informa iscAmount');
      }
      taxes.push({
        scheme: TAX_SCHEMES.ISC,
        taxableAmount: lineExtensionAmount,
        taxAmount: iscAmount,
        iscSystem: item.iscSystem,
      });
    }

    // [A-36] IGV: base = valor de venta + ISC; Catálogo 07 en TaxExemptionReasonCode.
    const igvBase = lineExtensionAmount.plus(iscAmount);
    taxes.push({
      scheme: TAX_SCHEMES.IGV,
      taxableAmount: igvBase,
      taxAmount: igvBase.mul(IGV_RATE).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
      percent: IGV_RATE,
      affectationCode: item.igvAffectationCode,
    });

    // [A-33] Precio de venta unitario: incluye tributos (Catálogo 16 código 01).
    const lineTaxes = this.sum(taxes.map((tax) => tax.taxAmount));
    const unitPriceWithTaxes = lineExtensionAmount.plus(lineTaxes).div(item.quantity);

    return { lineExtensionAmount, taxes, unitPriceWithTaxes };
  }

  private summarizeTaxes(lines: CalculatedLine[]): TaxSummary[] {
    const summary = new Map<string, TaxSummary>();
    for (const tax of lines.flatMap((line) => line.taxes)) {
      const current = summary.get(tax.scheme.id);
      if (current) {
        current.taxableAmount = current.taxableAmount.plus(tax.taxableAmount);
        current.taxAmount = current.taxAmount.plus(tax.taxAmount);
      } else {
        // En la cabecera solo va el tributo, sin datos propios de la línea.
        summary.set(tax.scheme.id, {
          scheme: tax.scheme,
          taxableAmount: tax.taxableAmount,
          taxAmount: tax.taxAmount,
        });
      }
    }
    return [...summary.values()].sort((a, b) => a.scheme.id.localeCompare(b.scheme.id));
  }

  private sum(values: Decimal[]): Decimal {
    return values.reduce((total, value) => total.plus(value), new Decimal(0));
  }

  private appendSignature(invoice: XmlNode, issuer: UblInvoiceXmlInput['issuer']): void {
    const signature = invoice.ele('cac:Signature');
    signature.ele('cbc:ID').txt(`ID${SIGNATURE_ID}`);
    const party = signature.ele('cac:SignatoryParty');
    party.ele('cac:PartyIdentification').ele('cbc:ID').txt(issuer.ruc);
    party.ele('cac:PartyName').ele('cbc:Name').txt(issuer.legalName);
    signature
      .ele('cac:DigitalSignatureAttachment')
      .ele('cac:ExternalReference')
      .ele('cbc:URI')
      .txt(`#${SIGNATURE_ID}`);
  }

  private appendSupplier(invoice: XmlNode, issuer: UblInvoiceXmlInput['issuer']): void {
    const party = invoice.ele('cac:AccountingSupplierParty').ele('cac:Party');
    // [A-10] RUC del emisor (tipo de documento siempre 6).
    this.appendPartyIdentification(party, '6', issuer.ruc);
    // [A-11] Nombre comercial (opcional).
    if (issuer.tradeName) {
      party.ele('cac:PartyName').ele('cbc:Name').txt(issuer.tradeName);
    }
    // [A-12] Razón social y [A-16] código de establecimiento ("0000" = domicilio fiscal).
    const legalEntity = party.ele('cac:PartyLegalEntity');
    legalEntity.ele('cbc:RegistrationName').txt(issuer.legalName);
    legalEntity
      .ele('cac:RegistrationAddress')
      .ele('cbc:AddressTypeCode', {
        listAgencyName: SUNAT_AGENCY,
        listName: 'Establecimientos anexos',
      })
      .txt(issuer.addressTypeCode ?? '0000');
  }

  private appendCustomer(invoice: XmlNode, customer: InvoiceCustomer): void {
    const party = invoice.ele('cac:AccountingCustomerParty').ele('cac:Party');
    // [A-17] Tipo y número de documento y [A-18] razón social del adquirente.
    this.appendPartyIdentification(party, customer.documentType, customer.documentNumber);
    party.ele('cac:PartyLegalEntity').ele('cbc:RegistrationName').txt(customer.legalName);
  }

  private appendPartyIdentification(party: XmlNode, documentType: string, number: string): void {
    party
      .ele('cac:PartyIdentification')
      .ele('cbc:ID', {
        schemeID: documentType,
        schemeName: 'Documento de Identidad',
        schemeAgencyName: SUNAT_AGENCY,
        schemeURI: catalogUri('06'),
      })
      .txt(number);
  }

  private appendPaymentTerms(
    invoice: XmlNode,
    form: PaymentForm,
    payableAmount: Decimal,
    currency: string,
  ): void {
    // [FP-170] Contado / [FP-171] Crédito con monto neto pendiente de pago.
    const terms = invoice.ele('cac:PaymentTerms');
    terms.ele('cbc:ID').txt('FormaPago');
    terms.ele('cbc:PaymentMeansID').txt(form.type);
    if (form.type === 'Contado') {
      return;
    }
    terms.ele('cbc:Amount', { currencyID: currency }).txt(amount(payableAmount));
    // [FP-172] y [FP-173] Monto y fecha de vencimiento de cada cuota (Cuota001, Cuota002...).
    form.installments.forEach((installment, index) => {
      const quota = invoice.ele('cac:PaymentTerms');
      quota.ele('cbc:ID').txt('FormaPago');
      quota.ele('cbc:PaymentMeansID').txt(`Cuota${String(index + 1).padStart(3, '0')}`);
      quota
        .ele('cbc:Amount', { currencyID: currency })
        .txt(amount(new Decimal(installment.amount)));
      quota.ele('cbc:PaymentDueDate').txt(installment.dueDate);
    });
  }

  private appendTaxTotal(
    parent: XmlNode,
    taxes: TaxSummary[],
    totalAmount: Decimal,
    currency: string,
    isLine: boolean,
  ): void {
    const taxTotal = parent.ele('cac:TaxTotal');
    taxTotal.ele('cbc:TaxAmount', { currencyID: currency }).txt(amount(totalAmount));

    for (const tax of taxes) {
      const subtotal = taxTotal.ele('cac:TaxSubtotal');
      subtotal.ele('cbc:TaxableAmount', { currencyID: currency }).txt(amount(tax.taxableAmount));
      subtotal.ele('cbc:TaxAmount', { currencyID: currency }).txt(amount(tax.taxAmount));

      // Orden del XSD: Percent, TaxExemptionReasonCode, TierRange, TaxScheme.
      const category = subtotal.ele('cac:TaxCategory');
      if (isLine && tax.percent) {
        category.ele('cbc:Percent').txt(tax.percent.toFixed(2));
      }
      if (isLine && tax.affectationCode) {
        category
          .ele('cbc:TaxExemptionReasonCode', {
            listAgencyName: SUNAT_AGENCY,
            listName: 'Afectacion del IGV',
            listURI: catalogUri('07'),
          })
          .txt(tax.affectationCode);
      }
      if (isLine && tax.iscSystem) {
        category.ele('cbc:TierRange').txt(tax.iscSystem);
      }

      const scheme = category.ele('cac:TaxScheme');
      scheme
        .ele('cbc:ID', {
          schemeName: 'Codigo de tributos',
          schemeAgencyName: SUNAT_AGENCY,
          schemeURI: catalogUri('05'),
        })
        .txt(tax.scheme.id);
      scheme.ele('cbc:Name').txt(tax.scheme.name);
      scheme.ele('cbc:TaxTypeCode').txt(tax.scheme.typeCode);
    }
  }

  private appendInvoiceLine(
    invoice: XmlNode,
    item: InvoiceItem,
    calculated: CalculatedLine,
    lineNumber: number,
    currency: string,
  ): void {
    const line = invoice.ele('cac:InvoiceLine');
    // [A-24] Número de orden del ítem.
    line.ele('cbc:ID').txt(String(lineNumber));
    // [A-25] y [A-26] Unidad de medida (Catálogo 03) y cantidad.
    line
      .ele('cbc:InvoicedQuantity', {
        unitCode: item.unitCode ?? 'NIU',
        unitCodeListID: 'UN/ECE rec 20',
        unitCodeListAgencyName: UNECE_AGENCY,
      })
      .txt(String(item.quantity));
    // [A-38] Valor de venta del ítem.
    line
      .ele('cbc:LineExtensionAmount', { currencyID: currency })
      .txt(amount(calculated.lineExtensionAmount));

    // [A-33] Precio de venta unitario (incluye tributos), Catálogo 16 código 01.
    const price = line.ele('cac:PricingReference').ele('cac:AlternativeConditionPrice');
    price
      .ele('cbc:PriceAmount', { currencyID: currency })
      .txt(unitAmount(calculated.unitPriceWithTaxes));
    price
      .ele('cbc:PriceTypeCode', {
        listName: 'Tipo de Precio',
        listAgencyName: SUNAT_AGENCY,
        listURI: catalogUri('16'),
      })
      .txt('01');

    // [A-35] a [A-37] Tributos del ítem.
    const lineTaxAmount = this.sum(calculated.taxes.map((tax) => tax.taxAmount));
    this.appendTaxTotal(line, calculated.taxes, lineTaxAmount, currency, true);

    // [A-31] Descripción y [A-27] código de producto.
    const itemNode = line.ele('cac:Item');
    itemNode.ele('cbc:Description').txt(item.description);
    if (item.productCode) {
      itemNode.ele('cac:SellersItemIdentification').ele('cbc:ID').txt(item.productCode);
    }
    // [A-32] Valor unitario del ítem (sin tributos).
    line
      .ele('cac:Price')
      .ele('cbc:PriceAmount', { currencyID: currency })
      .txt(unitAmount(new Decimal(item.unitSaleValue)));
  }
}
