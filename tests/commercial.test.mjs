import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCommercialConfig, parseCommercial, commercialTotals, commercialSchedule, validateCommercial } from '../src/lib/commercial.ts';
const item = (extra = {}) => ({ name: 'Serviço', quantity: 1, unitPrice: 10000, billingType: 'once', ...extra });
const config = (model = 'fixed', extra = {}) => ({ ...newCommercialConfig(model), firstDueDate: '2026-01-31', ...extra });
test('parcelamento preserva cada centavo e limita o dia ao fim do mês', () => {
  const plan = commercialSchedule([item()], config('fixed', { installments: 3 }));
  assert.deepEqual(plan.map(p => p.amount), [3334,3333,3333]);
  assert.deepEqual(plan.map(p => p.dueDate.toISOString().slice(0,10)), ['2026-01-31','2026-02-28','2026-03-31']);
});
test('implantação e mensalidade geram cobranças distintas com total igual ao contrato', () => {
  const items = [item({ unitPrice: 180000 }), item({ name: 'Acompanhamento', unitPrice: 220000, billingType: 'monthly' })];
  const c = config('hybrid', { months: 3, installments: 2 });
  assert.deepEqual(commercialTotals(items,c), { once:180000, monthly:220000,total:840000 });
  const plan= commercialSchedule(items,c);
  assert.equal(plan.length,5); assert.equal(plan.reduce((s,p)=>s+p.amount,0),840000);
});
test('pacote escolhido e adicionais não selecionados nunca somam os outros planos', () => {
  const items = [item({packageId:'essential'}),item({packageId:'professional',unitPrice:20000}),item({packageId:'complete',unitPrice:30000}),item({id:'addon',optional:true,selected:false,unitPrice:5000})];
  const c=config('packages',{selectedPackage:'professional'});
  validateCommercial(items,c,true); assert.equal(commercialTotals(items,c).total,20000);
  items[3].selected=true; assert.equal(commercialTotals(items,c).total,25000);
});
test('mensalidade não é confundida com parcelamento', () => {
  const plan=commercialSchedule([item({billingType:'monthly'})],config('monthly',{months:12,installments:3}));
  assert.equal(plan.length,12); assert.ok(plan.every(p=>p.amount===10000));
});
test('validação rejeita datas impossíveis, limites e ausência de pacote', () => {
  assert.equal(parseCommercial(null),null);
  assert.throws(()=>parseCommercial(config('fixed',{firstDueDate:'2026-02-31'})));
  assert.throws(()=>parseCommercial(config('monthly',{months:0})));
  assert.throws(()=>parseCommercial(config('monthly',{months:3,commitmentMonths:4})));
  assert.throws(()=>validateCommercial([item()],config('packages'),true));
  assert.throws(()=>validateCommercial([item({unitPrice:-1})],config(),true));
  assert.throws(()=>validateCommercial([item({billingType:'monthly'})],config(),true));
  assert.throws(()=>commercialSchedule([item()],config('fixed',{firstDueDate:''})));
});
test('quantidades fracionárias e ano bissexto',()=>{
  const plan=commercialSchedule([item({quantity:1.5})],config('fixed',{firstDueDate:'2028-01-31',installments:2}));
  assert.equal(plan[1].dueDate.toISOString().slice(0,10),'2028-02-29');
  assert.equal(plan.reduce((s,p)=>s+p.amount,0),15000);
});

test('fim do mês preserva a âncora e acompanha meses de durações diferentes',()=>{
  const plan=commercialSchedule([item()],config('fixed',{dueDateMode:'month_end',firstDueDate:'2026-09-30',installments:3}));
  assert.deepEqual(plan.map(p=>p.dueDate.toISOString().slice(0,10)),['2026-09-30','2026-10-31','2026-11-30']);
});
test('data escolhida pelo cliente é validada e valores opcionais respeitam limites',()=>{
  const c=config('fixed',{dueDateMode:'client',installments:2});
  assert.throws(()=>commercialSchedule([item()],c,{clientDueDate:'2026-02-31'}));
  const plan=commercialSchedule([item()],c,{clientDueDate:'2026-09-15'});
  assert.deepEqual(plan.map(p=>p.dueDate.toISOString().slice(0,10)),['2026-09-15','2026-10-15']);
  assert.throws(()=>validateCommercial([item(),item({optional:true,selected:false,unitPrice:2000000000,quantity:2})],config(),true));
});