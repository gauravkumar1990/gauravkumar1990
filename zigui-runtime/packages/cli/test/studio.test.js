import test from 'node:test';
import assert from 'node:assert/strict';
import { modelToSource } from '../src/cli.js';

test('studio model generates ZigUI JavaScript',()=>{
  const source=modelToSource({root:{id:'s',type:'Screen',props:{background:'#fff'},children:[{id:'t',type:'Text',props:{text:'Hello'},children:[]}]}});
  assert.match(source,/import \{ App, Screen, Text \} from "@zigui\/ui"/);
  assert.match(source,/Text\(\{text:"Hello"\}\)/);
});
