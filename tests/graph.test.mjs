import test from 'node:test';import assert from 'node:assert/strict';
import {validateGraph} from '../lib/graph.mjs';import handler from '../api/analyze.js';
const fixture=()=>({readable:true,message:'추정 데이터',xLabel:'시간(s)',yLabel:'압력(kPa)',series:[{name:'조건 A',points:[{x:2,y:5},{x:0,y:1},{x:1,y:3}]}]});
test('valid samples are sorted',()=>assert.deepEqual(validateGraph(fixture()).series[0].points.map(p=>p.x),[0,1,2]));
test('ambiguous graphs rejected',()=>assert.throws(()=>validateGraph({readable:false,message:'축을 확인하세요'}),/축/));
test('duplicates rejected',()=>{const g=fixture();g.series[0].points[0].x=0;assert.throws(()=>validateGraph(g),/중복/)});
test('nonfinite samples rejected',()=>{const g=fixture();g.series[0].points[0].y=NaN;assert.throws(()=>validateGraph(g),/숫자/)});
test('missing server configuration fails closed',async()=>{const old=process.env.OPENAI_API_KEY;delete process.env.OPENAI_API_KEY;const res={setHeader(){},status(n){this.code=n;return this},json(v){this.body=v}};await handler({method:'POST'},res);assert.equal(res.code,503);if(old!==undefined)process.env.OPENAI_API_KEY=old;});
