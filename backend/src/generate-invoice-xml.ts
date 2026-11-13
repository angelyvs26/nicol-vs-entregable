import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { UblInvoiceXmlGenerator, type UblInvoiceXmlInput } from './ubl-invoice-xml-generator';

const [inputArgument, outputArgument] = process.argv.slice(2);

if (!inputArgument) {
  console.error(
    'Uso: npm run generate:invoice-xml -- <input.json> [output.xml]',
  );
  process.exitCode = 1;
} else {
  const inputPath = resolve(inputArgument);
  const outputPath = resolve(
    outputArgument ?? '../specs/examples/factura-generada-F001-123.xml',
  );
  const input = JSON.parse(readFileSync(inputPath, 'utf8')) as UblInvoiceXmlInput;
  const xml = new UblInvoiceXmlGenerator().generate(input);

  writeFileSync(outputPath, xml);
  console.log(`XML UBL generado: ${outputPath}`);
}
