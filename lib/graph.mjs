export const schema = {
  type:'object',additionalProperties:false,
  properties:{
    readable:{type:'boolean'},message:{type:'string'},
    xLabel:{type:'string'},yLabel:{type:'string'},
    series:{type:'array',items:{type:'object',additionalProperties:false,properties:{name:{type:'string'},points:{type:'array',items:{type:'object',additionalProperties:false,properties:{x:{type:'number'},y:{type:'number'}},required:['x','y']}}},required:['name','points']}}
  },required:['readable','message','xLabel','yLabel','series']
};
export function validateGraph(graph){
  if(!graph || typeof graph.readable!=='boolean') throw Error('인식 결과 형식이 올바르지 않습니다.');
  if(!graph.readable) throw Error(String(graph.message || '축과 곡선을 읽지 못했습니다. 그래프를 크게 잘라 다시 올려주세요.').slice(0,500));
  if(!Array.isArray(graph.series)||graph.series.length<1||graph.series.length>8) throw Error('1–8개 곡선이 필요합니다.');
  for(const s of graph.series){
    if(!Array.isArray(s.points)||s.points.length<2||s.points.length>200) throw Error('곡선별 2–200개 좌표가 필요합니다.');
    if(s.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y))) throw Error('좌표가 숫자가 아닙니다.');
    s.points.sort((a,b)=>a.x-b.x);
    if(new Set(s.points.map(p=>p.x)).size!==s.points.length) throw Error('중복 X좌표가 있습니다. 다시 인식해주세요.');
    s.name=String(s.name).slice(0,120);
  }
  graph.xLabel=String(graph.xLabel).slice(0,120);graph.yLabel=String(graph.yLabel).slice(0,120);
  graph.message=String(graph.message).slice(0,1000);
  return graph;
}
