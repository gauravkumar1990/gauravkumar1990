import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const templateRoot = path.resolve(here, "../templates/basic");
const studioRoot = path.resolve(here, "../studio");

async function copyDir(src, dest) {
  await fs.mkdir(dest, {recursive:true});
  for (const ent of await fs.readdir(src, {withFileTypes:true})) {
    const s = path.join(src, ent.name), d = path.join(dest, ent.name);
    if (ent.isDirectory()) await copyDir(s,d); else await fs.copyFile(s,d);
  }
}

export async function create(name, cwd=process.cwd()) {
  if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(name)) throw new Error("Project name must be alphanumeric with - or _");
  const dest = path.resolve(cwd,name);
  if (fssync.existsSync(dest)) throw new Error(`Path already exists: ${dest}`);
  await copyDir(templateRoot,dest);
  const pkgPath = path.join(dest,"package.json");
  const pkg = JSON.parse(await fs.readFile(pkgPath,"utf8"));
  pkg.name = name.toLowerCase();
  await fs.writeFile(pkgPath, JSON.stringify(pkg,null,2)+"\n");
  return dest;
}

function mime(file) {
  if (file.endsWith(".js")) return "text/javascript";
  if (file.endsWith(".html")) return "text/html";
  if (file.endsWith(".css")) return "text/css";
  if (file.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

export async function buildWeb(projectDir, outDir="dist/web") {
  const root = path.resolve(projectDir);
  const out = path.resolve(root,outDir);
  await fs.rm(out,{recursive:true,force:true});
  await fs.mkdir(out,{recursive:true});
  const app = await fs.readFile(path.join(root,"src/app.js"),"utf8");
  const uiPath = path.resolve(here,"../../ui/src/index.js");
  const ui = await fs.readFile(uiPath,"utf8");
  await fs.writeFile(path.join(out,"zigui.js"), ui);
  await fs.writeFile(path.join(out,"app.js"), app.replaceAll('"@zigui/ui"','"./zigui.js"').replaceAll("'@zigui/ui'","'./zigui.js'"));
  await fs.writeFile(path.join(out,"web-host.js"), WEB_HOST);
  await fs.writeFile(path.join(out,"index.html"), HTML);
  return out;
}

export async function devWeb(projectDir, port=5179) {
  const root=path.resolve(projectDir);
  const out=await buildWeb(root,".zigui/dev-web");
  const clients=new Set();
  const server=http.createServer(async (req,res)=>{
    if(req.url==="/__zigui_events"){
      res.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive"});
      clients.add(res); req.on("close",()=>clients.delete(res)); return;
    }
    const rel=req.url==="/"?"index.html":req.url.slice(1).split("?")[0];
    const file=path.join(out,rel);
    try { const b=await fs.readFile(file); res.writeHead(200,{"Content-Type":mime(file),"Cache-Control":"no-store"}); res.end(b); }
    catch {res.writeHead(404);res.end("Not found");}
  });
  server.listen(port,"127.0.0.1",()=>console.log(`[zui] web dev http://127.0.0.1:${port}`));
  fssync.watch(path.join(root,"src"),{recursive:true}, async ()=>{
    try { await buildWeb(root,".zigui/dev-web"); clients.forEach(c=>c.write("data: reload\n\n")); console.log("[zui] hot reload"); } catch(e){console.error(e.message);}
  });
}

function jsValue(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "null";
  return JSON.stringify(value);
}

export function modelToSource(model) {
  const used = new Set();
  function emit(n) {
    used.add(n.type);
    const props = [];
    for (const [k,v] of Object.entries(n.props ?? {})) props.push(`${k}:${jsValue(v)}`);
    if ((n.children ?? []).length) props.push(`children:[${n.children.map(emit).join(",")}]`);
    return `${n.type}({${props.join(",")}})`;
  }
  const expr = emit(model.root);
  return `import { App, ${[...used].sort().join(", ")} } from "@zigui/ui";\n\nApp(() => ${expr});\n`;
}

function defaultStudioModel() {
  return {version:1,root:{id:"screen",type:"Screen",props:{background:"#f8fafc"},children:[{id:"column",type:"Column",props:{padding:24,gap:12},children:[{id:"title",type:"Text",props:{text:"Hello ZigUI",fontSize:30,color:"#111827"},children:[]},{id:"button",type:"Button",props:{text:"Get Started"},children:[]}]}]}};
}

export async function studio(projectDir, port=5180) {
  const root = path.resolve(projectDir);
  const studioFile = path.join(root,".zigui","studio.json");
  const appFile = path.join(root,"src","app.js");
  await fs.mkdir(path.dirname(studioFile),{recursive:true});
  if(!fssync.existsSync(studioFile)) await fs.writeFile(studioFile,JSON.stringify(defaultStudioModel(),null,2)+"\n");
  const server=http.createServer(async(req,res)=>{
    const url=new URL(req.url,`http://${req.headers.host||"localhost"}`);
    if(url.pathname==="/api/model" && req.method==="GET"){
      res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});res.end(await fs.readFile(studioFile));return;
    }
    if(url.pathname==="/api/model" && req.method==="POST"){
      let body="";for await(const chunk of req)body+=chunk;const model=JSON.parse(body);const source=modelToSource(model);
      await fs.writeFile(studioFile,JSON.stringify(model,null,2)+"\n");await fs.writeFile(appFile,source);
      res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:true,source}));return;
    }
    if(url.pathname==="/api/source" && req.method==="GET"){
      res.writeHead(200,{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"});res.end(await fs.readFile(appFile,"utf8"));return;
    }
    if(url.pathname==="/api/source" && req.method==="POST"){
      let body="";for await(const chunk of req)body+=chunk;await fs.writeFile(appFile,body);res.writeHead(200,{"Content-Type":"application/json"});res.end('{"ok":true}');return;
    }
    const rel=url.pathname==="/"?"index.html":url.pathname.slice(1);const file=path.resolve(studioRoot,rel);
    if(!file.startsWith(studioRoot)){res.writeHead(403);res.end("Forbidden");return;}
    try{const b=await fs.readFile(file);res.writeHead(200,{"Content-Type":mime(file),"Cache-Control":"no-store"});res.end(b)}catch{res.writeHead(404);res.end("Not found")}
  });
  server.listen(port,"127.0.0.1",()=>console.log(`[zui] Studio http://127.0.0.1:${port}`));
  return server;
}

function commandExists(cmd) {
  return new Promise(resolve=>{ const p=spawn(cmd,["--version"],{stdio:"ignore"}); p.on("error",()=>resolve(false)); p.on("exit",c=>resolve(c===0)); });
}

export async function doctor() {
  const checks = {};
  for (const cmd of ["node","npm","bun","zig","java","adb","gradle","xcodebuild"]) checks[cmd]=await commandExists(cmd);
  console.table(checks);
  return checks;
}

export async function buildAndroid(projectDir) {
  const checks=await doctor();
  if(!checks.zig) throw new Error("Zig compiler not found. Install Zig 0.14+ and run again.");
  if(!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) throw new Error("ANDROID_HOME/ANDROID_SDK_ROOT is not configured.");
  throw new Error("Android native packaging pipeline is scaffolded but not yet production-complete in v0.3 alpha. See docs/ANDROID.md.");
}

export async function main(args) {
  const [cmd,a,b,...rest]=args;
  if(!cmd || ["-h","--help","help"].includes(cmd)) return console.log(HELP);
  if(cmd==="create") { const d=await create(a); console.log(`[zui] created ${d}\nNext: cd ${a} && npm install && npm run dev`); return; }
  if(cmd==="doctor") { await doctor(); return; }
  if(cmd==="studio") { await studio(a ?? ".", Number(b ?? 5180)); return; }
  if(cmd==="dev" && a==="web") { await devWeb(b ?? ".", Number(rest[0]??5179)); return; }
  if(cmd==="build" && a==="web") { const out=await buildWeb(b??"."); console.log(`[zui] built ${out}`); return; }
  if(cmd==="build" && a==="android") { await buildAndroid(b??"."); return; }
  throw new Error(`Unknown command: ${args.join(" ")}`);
}

const HELP=`ZigUI CLI\n\n  zui create <name>\n  zui studio [project] [port]\n  zui doctor\n  zui dev web [project] [port]\n  zui build web [project]\n  zui build android [project]\n`;

const HTML=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZigUI</title><style>body{margin:0;font-family:system-ui;background:#f6f7f9}*{box-sizing:border-box}button,input{font:inherit}</style></head><body><div id="app"></div><script type="module" src="./web-host.js"></script></body></html>`;

const WEB_HOST=`
import { __dispatchNativeEvent } from './zigui.js';
globalThis.__ZIGUI_PLATFORM__='web';
const root=document.getElementById('app');
function style(el,p){if(p.padding!=null)el.style.padding=px(p.padding);if(p.gap!=null)el.style.gap=px(p.gap);if(p.fontSize!=null)el.style.fontSize=px(p.fontSize);if(p.width!=null)el.style.width=px(p.width);if(p.height!=null)el.style.height=px(p.height);if(p.background)el.style.background=p.background;if(p.color)el.style.color=p.color;if(p.borderRadius!=null)el.style.borderRadius=px(p.borderRadius);if(p.flex!=null)el.style.flex=String(p.flex);}
function px(v){return typeof v==='number'?v+'px':v}
function make(n){if(!n)return document.createComment('null');let e;
switch(n.type){case'Text':e=document.createElement('div');e.textContent=n.props.text??'';break;case'Button':e=document.createElement('button');e.textContent=n.props.text??'Button';break;case'TextInput':e=document.createElement('input');e.value=n.props.value??'';e.placeholder=n.props.placeholder??'';break;case'Image':e=document.createElement('img');e.src=n.props.src??'';break;case'Switch':e=document.createElement('input');e.type='checkbox';e.checked=!!n.props.value;break;default:e=document.createElement('div');}
if(n.type==='Column'){e.style.display='flex';e.style.flexDirection='column'} if(n.type==='Row'){e.style.display='flex';e.style.flexDirection='row'} if(n.type==='Screen'){e.style.minHeight='100vh'} if(n.type==='ScrollView'){e.style.overflow='auto'} style(e,n.props||{});
for(const [k,v] of Object.entries(n.props||{})){if(k.startsWith('on')&&v?.__callback){const ev=k==='onPress'?'click':k==='onChange'?'input':k.slice(2).toLowerCase();e.addEventListener(ev,x=>__dispatchNativeEvent(v.__callback,k==='onChange'?x.target.value:{type:ev}));}}
for(const c of n.children||[])e.appendChild(make(c));return e;}
globalThis.__ZIGUI_NATIVE__={commit(tree){root.replaceChildren(make(tree));},async invoke(module,method,args){return globalThis.__ZIGUI_WEB_NATIVE__?.[module]?.[method]?.(...args);}};
await import('./app.js?'+Date.now());
const es=new EventSource('/__zigui_events');es.onmessage=e=>{if(e.data==='reload')location.reload()};
`;
