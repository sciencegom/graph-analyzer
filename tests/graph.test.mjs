import test from 'node:test';import assert from 'node:assert/strict';
import {validateGraph} from '../lib/graph.mjs';import handler from '../api/analyze.js';
const fixture=()=>({readable:true,message:'추정 데이터',xLabel:'시간(s)',yLabel:'압력(kPa)',series:[{name:'조건 A',points:[{x:2,y:5},{x:0,y:1},{x:1,y:3}]}]});
test('valid samples are sorted',()=>assert.deepEqual(validateGraph(fixture()).series[0].points.map(p=>p.x),[0,1,2]));
test('ambiguous graphs rejected',()=>assert.throws(()=>validateGraph({readable:false,message:'축을 확인하세요'}),/축/));
test('duplicates rejected',()=>{const g=fixture();g.series[0].points[0].x=0;assert.throws(()=>validateGraph(g),/중복/)});
test('nonfinite samples rejected',()=>{const g=fixture();g.series[0].points[0].y=NaN;assert.throws(()=>validateGraph(g),/숫자/)});
test('missing server configuration fails closed',async()=>{const old=process.env.GEMINI_API_KEY;delete process.env.GEMINI_API_KEY;const res={setHeader(){},status(n){this.code=n;return this},json(v){this.body=v}};await handler({method:'POST'},res);assert.equal(res.code,503);if(old!==undefined)process.env.GEMINI_API_KEY=old;});

test('Gemini image request and JSON response adapter',async()=>{
  const names=['GEMINI_API_KEY','GEMINI_MODEL','ANALYZER_ACCESS_CODE'];
  const old=Object.fromEntries(names.map(n=>[n,process.env[n]]));const oldFetch=globalThis.fetch;
  Object.assign(process.env,{GEMINI_API_KEY:'test-key',GEMINI_MODEL:'test-model',ANALYZER_ACCESS_CODE:'test-code'});
  const res={setHeader(){},status(n){this.code=n;return this},json(v){this.body=v}};
  try{
    globalThis.fetch=async(url,options)=>{
      assert.match(url,/test-model:generateContent$/);
      assert.equal(options.headers['x-goog-api-key'],'test-key');
      const body=JSON.parse(options.body);
      assert.equal(body.contents[0].parts[1].inlineData.mimeType,'image/png');
      assert.equal(body.contents[0].parts[1].inlineData.data,'aGVsbG8=');
      assert.equal(body.generationConfig.responseFormat.text.mimeType,'application/json');
      return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(fixture())}]}}]})};
    };
    await handler({method:'POST',headers:{'x-analyzer-code':'test-code'},body:{image:'data:image/png;base64,aGVsbG8='}},res);
    assert.equal(res.code,200);assert.equal(res.body.series[0].points[0].x,0);
    await handler({method:'POST',headers:{'x-analyzer-code':'wrong'},body:{}},res);assert.equal(res.code,401);
  }finally{globalThis.fetch=oldFetch;for(const n of names){if(old[n]===undefined)delete process.env[n];else process.env[n]=old[n];}}
});
