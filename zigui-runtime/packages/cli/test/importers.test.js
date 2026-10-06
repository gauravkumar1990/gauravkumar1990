import test from 'node:test';
import assert from 'node:assert/strict';
import { importFigmaJson, importGenericJson } from '../src/importers.js';

test('imports Figma JSON into editable ZigUI frames',()=>{
  const model=importFigmaJson({name:'Demo',document:{id:'0:0',type:'DOCUMENT',name:'Doc',children:[{id:'1:1',type:'FRAME',name:'Login',absoluteBoundingBox:{x:0,y:0,width:390,height:844},layoutMode:'VERTICAL',itemSpacing:12,paddingTop:20,paddingLeft:16,children:[{id:'2:1',type:'TEXT',name:'Title',characters:'Welcome',style:{fontSize:28,fontWeight:700},fills:[{type:'SOLID',color:{r:0,g:0,b:0}}]}]}]}});
  assert.equal(model.root.type,'Screen');
  assert.equal(model.root.children[0].type,'Frame');
  assert.equal(model.root.children[0].props.layout,'column');
  assert.equal(model.root.children[0].children[0].props.text,'Welcome');
});

test('imports generic design JSON',()=>{
  const model=importGenericJson({name:'Generic',root:{type:'frame',name:'Card',children:[{type:'text',text:'Hello'}]}});
  assert.equal(model.root.type,'Screen');
  assert.equal(model.root.children[0].type,'Frame');
  assert.equal(model.root.children[0].children[0].type,'Text');
});
