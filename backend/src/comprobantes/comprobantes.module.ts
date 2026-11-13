import { Module } from '@nestjs/common';
import { ComprobantesController } from './comprobantes.controller';
import { UblInvoiceXmlGenerator } from '../ubl-invoice-xml-generator';

@Module({
  controllers: [ComprobantesController],
  providers: [UblInvoiceXmlGenerator],
})
export class ComprobantesModule {}