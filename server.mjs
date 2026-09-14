import http from 'node:http';
import {readFile} from 'node:fs/promises';
import handler from './api/analyze.js';
const server=http.createServer(async(req,res)=>{
  res.status=n=>{res.statusCode=n;return res};res.json=obj=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(obj));};
  if(req.url==='/api/analyze'){
    let size=0,chunks=[];
    for await(const chunk of req){size+=chunk.length;if(size>3600000){res.status(413).json({error:'이미지가 너무 큽니다.'});return;}chunks.push(chunk);}
    try{req.body=JSON.parse(Buffer.concat(chunks).toString());}catch{res.status(400).json({error:'요청 형식을 확인해주세요.'});return;}
    return handler(req,res);
  }
  if(req.url==='/'||req.url==='/index.html'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile(new URL('./public/index.html',import.meta.url)));return;}
  res.statusCode=404;res.end('Not found');
});
server.listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('ScienceGOM ready'));
