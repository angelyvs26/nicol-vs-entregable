import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import type { UblInvoiceXmlInput } from '../src/ubl-invoice-xml-generator';
import { AppModule } from './../src/app.module';

const validInvoice = JSON.parse(
  readFileSync(resolve(__dirname, '../../specs/examples/factura-generador-input.json'), 'utf8'),
) as UblInvoiceXmlInput;

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('genera XML UBL descargable para una factura válida', () => {
    return request(app.getHttpServer())
      .post('/api/v1/comprobantes/facturas/xml')
      .send(validInvoice)
      .expect(200)
      .expect('Content-Type', /application\/xml; charset=iso-8859-1/i)
      .expect('Content-Disposition', 'attachment; filename="20512345671-01-F001-123.xml"')
      .expect((response) => {
        expect(response.text).toContain('<Invoice');
        expect(response.text).toContain('<cbc:ID>F001-123</cbc:ID>');
      });
  });

  it('devuelve 422 y solo el mensaje al rechazar un RUC inválido', () => {
    const invalidInvoice = {
      ...validInvoice,
      issuer: { ...validInvoice.issuer, ruc: '20123456789' },
    };

    return request(app.getHttpServer())
      .post('/api/v1/comprobantes/facturas/xml')
      .send(invalidInvoice)
      .expect(422)
      .expect({ message: 'El RUC del emisor no es válido (11 dígitos con dígito verificador)' });
  });

  afterEach(async () => {
    await app.close();
  });
});
