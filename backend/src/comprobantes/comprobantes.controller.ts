import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  UblInvoiceXmlGenerator,
  type UblInvoiceXmlInput,
} from '../ubl-invoice-xml-generator';

@Controller('api/v1/comprobantes/facturas')
export class ComprobantesController {
  constructor(private readonly generator: UblInvoiceXmlGenerator) {}

  @Post('xml')
  generateInvoiceXml(
    @Body() input: UblInvoiceXmlInput,
    @Res() response: Response,
  ): Response {
    try {
      const xml = this.generator.generate(input);
      const filename = `${input.issuer.ruc}-01-${input.documentId}.xml`;

      return response
        .status(200)
        .set({
          'Content-Type': 'application/xml; charset=ISO-8859-1',
          'Content-Disposition': `attachment; filename="${filename}"`,
        })
        .send(xml);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo generar el XML';
      return response.status(422).json({ message });
    }
  }
}