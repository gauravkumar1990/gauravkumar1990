import path from 'node:path';
import fs from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

const uid = (p='n') => `${p}_${Math.random().toString(36).slice(2,9)}`;
const clamp01 = n => Math.max(0, Math.min(1, Number(n ?? 1)));
const color = c => {
  if (!c) return undefined;
  if (typeof c === 'string') return c;
  const r=Math.round(clamp01(c.r)*255), g=Math.round(clamp01(c.g)*255), b=Math.round(clamp01(c.b)*255), a=clamp01(c.a ?? 1);
  return a < 1 ? `rgba(${r},${g},${b},${a.toFixed(3)})` : `#${[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('')}`;
};

function figmaPaint(paints){
  const p = Array.isArray(paints) ? paints.find(x => x?.visible !== false && ['SOLID','GRADIENT_LINEAR'].includes(x?.type)) : null;
  if (!p) return undefined;
  if (p.type === 'SOLID') return color({...p.color,a:(p.opacity ?? 1)*(p.color?.a ?? 1)});
  if (p.type === 'GRADIENT_LINEAR' && p.gradientStops?.length) {
    const stops=p.gradientStops.map(s=>`${color(s.color)} ${Math.round(s.position*100)}%`).join(',');
    return `linear-gradient(90deg,${stops})`;
  }
}
function shadows(effects){
  const e=Array.isArray(effects)?effects.find(x=>x?.visible!==false && x?.type==='DROP_SHADOW'):null;
  if(!e) return undefined;
  return `${e.offset?.x??0}px ${e.offset?.y??0}px ${e.radius??0}px ${e.spread??0}px ${color(e.color)}`;
}
function nodeType(n){
  switch(n?.type){
    case 'DOCUMENT': case 'CANVAS': case 'SECTION': case 'FRAME': case 'GROUP': case 'COMPONENT': case 'COMPONENT_SET': case 'INSTANCE': return 'Frame';
    case 'TEXT': return 'Text';
    case 'RECTANGLE': case 'ELLIPSE': case 'VECTOR': case 'STAR': case 'POLYGON': case 'LINE': return 'Shape';
    case 'BOOLEAN_OPERATION': return 'Shape';
    default: return n?.children ? 'Frame' : 'Shape';
  }
}
function figmaNode(n,parent=null){
  const type=nodeType(n), props={name:n.name??type,visible:n.visible!==false};
  const bb=n.absoluteBoundingBox;
  if(bb){props.width=Math.round(bb.width);props.height=Math.round(bb.height); if(parent?.absoluteBoundingBox){props.x=Math.round(bb.x-parent.absoluteBoundingBox.x);props.y=Math.round(bb.y-parent.absoluteBoundingBox.y);}}
  const bg=figmaPaint(n.fills); if(bg) props.background=bg;
  const stroke=figmaPaint(n.strokes); if(stroke){props.borderColor=stroke;props.borderWidth=Number(n.strokeWeight??1)}
  if(n.cornerRadius!=null) props.borderRadius=Number(n.cornerRadius);
  if(Array.isArray(n.rectangleCornerRadii)) props.cornerRadii=n.rectangleCornerRadii;
  const shadow=shadows(n.effects); if(shadow) props.boxShadow=shadow;
  if(n.opacity!=null) props.opacity=n.opacity;
  if(n.rotation) props.rotation=n.rotation;
  if(n.type==='TEXT'){
    props.text=n.characters??''; const s=n.style??{};
    if(s.fontSize) props.fontSize=s.fontSize; if(s.fontFamily) props.fontFamily=s.fontFamily; if(s.fontWeight) props.fontWeight=s.fontWeight;
    if(s.lineHeightPx) props.lineHeight=s.lineHeightPx; if(s.letterSpacing) props.letterSpacing=s.letterSpacing;
    if(s.textAlignHorizontal) props.textAlign=String(s.textAlignHorizontal).toLowerCase();
    const tc=figmaPaint(n.fills); if(tc) props.color=tc;
  }
  if(['FRAME','COMPONENT','COMPONENT_SET','INSTANCE'].includes(n.type)){
    if(n.layoutMode==='VERTICAL'){props.layout='column';props.gap=n.itemSpacing??0;} else if(n.layoutMode==='HORIZONTAL'){props.layout='row';props.gap=n.itemSpacing??0;} else props.layout='absolute';
    if(n.paddingTop!=null) props.paddingTop=n.paddingTop;if(n.paddingRight!=null)props.paddingRight=n.paddingRight;if(n.paddingBottom!=null)props.paddingBottom=n.paddingBottom;if(n.paddingLeft!=null)props.paddingLeft=n.paddingLeft;
    if(n.primaryAxisAlignItems) props.justify=String(n.primaryAxisAlignItems).toLowerCase().replace('_','-');
    if(n.counterAxisAlignItems) props.align=String(n.counterAxisAlignItems).toLowerCase().replace('_','-');
    if(n.layoutWrap==='WRAP') props.wrap=true;
  }
  if(type==='Shape') props.shape=(n.type??'RECTANGLE').toLowerCase();
  const out={id:`figma_${String(n.id??uid()).replace(/[^\w-]/g,'_')}`,type,props,children:[] ,meta:{source:'figma',sourceType:n.type,sourceId:n.id}};
  out.children=(n.children??[]).filter(c=>c.visible!==false).map(c=>figmaNode(c,n));
  return out;
}

export function importFigmaJson(data){
  const doc=data?.document ?? data;
  if(!doc?.type) throw new Error('Not a recognizable Figma document JSON.');
  const root=figmaNode(doc);
  root.type='Screen'; root.props.name=data?.name ?? root.props.name ?? 'Figma Import';
  return {version:2,root,components:data?.components??{},componentSets:data?.componentSets??{},styles:data?.styles??{},tokens:{},meta:{source:'figma',name:data?.name,lastModified:data?.lastModified}};
}

function genericNode(n){
  if(!n || typeof n!=='object') return null;
  const rawType=String(n.type??n.kind??n.component??'Frame');
  const map={container:'Frame',frame:'Frame',group:'Frame',div:'Frame',screen:'Screen',page:'Screen',text:'Text',label:'Text',button:'Button',input:'TextInput',textfield:'TextInput',image:'Image',img:'Image',icon:'Shape',rectangle:'Shape',shape:'Shape'};
  const type=map[rawType.toLowerCase()]??(rawType[0]?.toUpperCase()+rawType.slice(1));
  const props={...(n.props??n.properties??n.style??{})};
  for(const k of ['name','text','x','y','width','height']) if(n[k]!=null && props[k]==null) props[k]=n[k];
  if(n.label!=null && props.text==null) props.text=n.label;
  const children=(n.children??n.layers??n.items??[]).map(genericNode).filter(Boolean);
  return {id:String(n.id??uid('json')),type,props,children,meta:{source:'json',sourceType:rawType}};
}
export function importGenericJson(data){
  const source=data?.root??data?.document??data?.design??data;
  const root=genericNode(source);
  if(!root) throw new Error('JSON does not contain a recognizable design tree.');
  if(root.type!=='Screen') return {version:2,root:{id:uid('screen'),type:'Screen',props:{name:data?.name??'Imported Design'},children:[root]},tokens:data?.tokens??data?.variables??{},components:data?.components??{},styles:data?.styles??{},meta:{source:'json'}};
  return {version:2,root,tokens:data?.tokens??data?.variables??{},components:data?.components??{},styles:data?.styles??{},meta:{source:'json'}};
}

export function importStitchJson(data){
  const rootData=data?.design??data?.screen??data?.root??data;
  const model=importGenericJson({root:rootData,name:data?.name??data?.title??'Stitch Import',tokens:data?.theme??data?.tokens});
  model.meta={...(model.meta??{}),source:'google-stitch'};
  return model;
}

function htmlBundleModel(entries,name='Web Bundle'){
  const html=entries.find(e=>/\.html?$/i.test(e.name));
  const css=entries.filter(e=>/\.css$/i.test(e.name));
  const assets=entries.filter(e=>/\.(png|jpe?g|webp|svg|gif)$/i.test(e.name)).map(e=>({name:e.name,mime:e.mime,size:e.data.length}));
  return {version:2,root:{id:uid('screen'),type:'Screen',props:{name,background:'#ffffff'},children:[{id:uid('web'),type:'WebEmbed',props:{name:html?.name??'Imported HTML',html:html?.data.toString('utf8')??'',css:css.map(x=>x.data.toString('utf8')).join('\n')},children:[]}]},assets,tokens:{},meta:{source:'web-bundle',warning:'Imported HTML/CSS is kept as WebEmbed. Convert layers manually or with an adapter for full native ZigUI semantics.'}};
}

function readZipEntries(buffer){
  let eocd=-1; for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--){if(buffer.readUInt32LE(i)===0x06054b50){eocd=i;break}}
  if(eocd<0) throw new Error('Invalid ZIP: end-of-central-directory not found.');
  const count=buffer.readUInt16LE(eocd+10), cdOffset=buffer.readUInt32LE(eocd+16); let off=cdOffset; const out=[];
  for(let i=0;i<count;i++){
    if(buffer.readUInt32LE(off)!==0x02014b50) throw new Error('Invalid ZIP central directory.');
    const method=buffer.readUInt16LE(off+10), compSize=buffer.readUInt32LE(off+20), nameLen=buffer.readUInt16LE(off+28), extraLen=buffer.readUInt16LE(off+30), commentLen=buffer.readUInt16LE(off+32), localOff=buffer.readUInt32LE(off+42);
    const name=buffer.subarray(off+46,off+46+nameLen).toString('utf8');
    if(buffer.readUInt32LE(localOff)!==0x04034b50) throw new Error('Invalid ZIP local header.');
    const localNameLen=buffer.readUInt16LE(localOff+26), localExtraLen=buffer.readUInt16LE(localOff+28), dataOff=localOff+30+localNameLen+localExtraLen;
    const compressed=buffer.subarray(dataOff,dataOff+compSize); let data;
    if(method===0)data=Buffer.from(compressed); else if(method===8)data=inflateRawSync(compressed); else throw new Error(`ZIP compression method ${method} is not supported.`);
    if(!name.endsWith('/'))out.push({name,data,mime:''}); off+=46+nameLen+extraLen+commentLen;
  }
  return out;
}

export async function importDesignBuffer({filename,buffer,mime='application/octet-stream'}){
  const lower=filename.toLowerCase();
  if(lower.endsWith('.zip')){
    const entries=readZipEntries(buffer);
    const jsonEntries=entries.filter(e=>/\.json$/i.test(e.name));
    for(const e of jsonEntries){
      try{const data=JSON.parse(e.data.toString('utf8')); if(data?.document?.type==='DOCUMENT') return {...importFigmaJson(data),meta:{...importFigmaJson(data).meta,archive:filename}};}catch{}
    }
    for(const e of jsonEntries){try{const data=JSON.parse(e.data.toString('utf8')); if(/stitch/i.test(e.name)||data?.source==='stitch'||data?.generator==='stitch') return importStitchJson(data);}catch{}}
    for(const e of jsonEntries){try{return importGenericJson(JSON.parse(e.data.toString('utf8')))}catch{}}
    if(entries.some(e=>/\.html?$/i.test(e.name))) return htmlBundleModel(entries,path.basename(filename,'.zip'));
    throw new Error('ZIP contains no supported design JSON or HTML bundle.');
  }
  if(lower.endsWith('.json')){
    const data=JSON.parse(buffer.toString('utf8'));
    if(data?.document?.type==='DOCUMENT') return importFigmaJson(data);
    if(data?.source==='stitch'||data?.generator==='stitch'||/stitch/i.test(filename)) return importStitchJson(data);
    return importGenericJson(data);
  }
  if(/\.(svg)$/i.test(lower)) return {version:2,root:{id:uid('screen'),type:'Screen',props:{name:filename},children:[{id:uid('svg'),type:'Svg',props:{source:buffer.toString('utf8'),name:filename},children:[]}]},tokens:{},meta:{source:'svg'}};
  if(/\.(png|jpe?g|webp|gif)$/i.test(lower)) return {version:2,root:{id:uid('screen'),type:'Screen',props:{name:filename},children:[{id:uid('image'),type:'Image',props:{src:`data:${mime};base64,${buffer.toString('base64')}`,name:filename},children:[]}]},tokens:{},meta:{source:'image'}};
  if(/\.html?$/i.test(lower)) return htmlBundleModel([{name:filename,data:buffer,mime}],path.basename(filename));
  throw new Error(`Unsupported import format: ${filename}`);
}

export async function importFigmaUrl({url,token}){
  const m=String(url).match(/figma\.com\/(?:file|design|board|proto)\/([^/]+)/i);
  if(!m) throw new Error('Could not parse Figma file key from URL.');
  if(!token) throw new Error('Figma access token is required for direct URL import.');
  const key=m[1];
  const res=await fetch(`https://api.figma.com/v1/files/${encodeURIComponent(key)}?geometry=paths`,{headers:{'X-Figma-Token':token}});
  if(!res.ok) throw new Error(`Figma API ${res.status}: ${await res.text()}`);
  const data=await res.json();
  const model=importFigmaJson(data);
  try{
    const vr=await fetch(`https://api.figma.com/v1/files/${encodeURIComponent(key)}/variables/local`,{headers:{'X-Figma-Token':token}});
    if(vr.ok){const vars=await vr.json();model.tokens=vars?.meta?.variables??{};model.tokenCollections=vars?.meta?.variableCollections??{};}
  }catch{}
  return model;
}

export async function saveImportedAssets(projectDir,model){
  const dir=path.join(projectDir,'.zigui','imports');await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,'last-import.json'),JSON.stringify(model,null,2)+'\n');
}
