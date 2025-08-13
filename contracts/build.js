// build.js - compile FunC contracts using @ton-community/func-js
const { compileFunc, latestCompiler } = require('@ton-community/func-js');
const { writeFileSync, mkdirSync, readFileSync } = require('fs');
const { join } = require('path');

const MIN_STDLIB = `
(int) slice_bits(slice s) asm "SBITS";
(int) slice_refs(slice s) asm "SREFS";
(builder) begin_cell() asm "NEWC";
(cell) end_cell(builder b) asm "ENDC";
(slice) begin_parse(cell c) asm "CTOS";
(cell) get_data() asm "c4 PUSH";
() set_data(cell d) asm "c4 POP";
`;

async function compileOne(entry) {
  const dir = __dirname;
  const sources = {
    'stdlib.fc': MIN_STDLIB,
    'nft_item.fc': readFileSync(join(dir, 'nft_item.fc'), 'utf8'),
    'nft_collection.fc': readFileSync(join(dir, 'nft_collection.fc'), 'utf8'),
  };
  const res = await compileFunc({
    compiler: latestCompiler,
    sources,
    targets: [entry],
  });
  if (res.status !== 'ok') throw new Error(res.message);
  return res.codeBoc;
}

async function build() {
  const col = await compileOne('nft_collection.fc');
  const item = await compileOne('nft_item.fc');
  mkdirSync(join(__dirname, '..', 'build'), { recursive: true });
  writeFileSync(join(__dirname, '..', 'build', 'nft_item.cell'), Buffer.from(item, 'base64'));
  writeFileSync(join(__dirname, '..', 'build', 'nft_collection.cell'), Buffer.from(col, 'base64'));
  console.log('Compiled OK');
}

build().catch((e) => { console.error(e); process.exit(1); });