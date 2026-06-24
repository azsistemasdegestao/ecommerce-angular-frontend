import { writeFileSync } from 'node:fs';

const url = process.env.API_OPENAPI_URL ?? 'http://localhost:8080/openapi/v1.json';

const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Failed to fetch OpenAPI spec from ${url}: ${response.status}`);
}

const spec = await response.text();
writeFileSync('openapi-spec.json', spec);
console.log(`OpenAPI spec written to openapi-spec.json (from ${url})`);
