import {SAMPLE,CATEGORIES,parseCSV,guessMapping,buildRecords,analyze,applyDecision,exportCSV,makeCSV} from '../engine.js';

export class ArchiveLedger {
  constructor(text, filename = 'orrin-practice.csv') {
    this.parsed = parseCSV(text); this.filename = filename; this.history = []; this.audit = [];
    const mapping = guessMapping(this.parsed.headers);
    if ([mapping.date, mapping.merchant, mapping.amount].some(i => i < 0)) throw Error('This ledger needs Date, Description (or Merchant), and Amount columns. Currency is optional; without it, amounts are labeled USD.');
    this.records = analyze(buildRecords(this.parsed, mapping, 'USD'));
  }
  static practice() { return new ArchiveLedger(SAMPLE); }
  get complete() { return this.records.every(r => r.reviewed && (!r.duplicateOf || r.duplicateDecision)); }
  next() { return this.records.find(r => !r.reviewed && !r.duplicateOf) || this.records.find(r => r.duplicateOf && !r.duplicateDecision) || this.records.find(r => !r.reviewed); }
  write(record, patch, action) {
    const change = applyDecision(this.records, record.id, patch); this.history.push(change); this.audit.push({ ...change, action, timestamp: new Date().toISOString() });
  }
  categorize(category) { if (!CATEGORIES.includes(category)) return; const r = this.next(); if (r) this.write(r, { category, reviewed: true }, 'category'); }
  duplicate(decision) { const r = this.next(); if (!r?.duplicateOf || !['keep','exclude'].includes(decision)) return; const first = this.records.find(x => x.id === r.duplicateOf); this.write(r, { category: r.category || first.category || 'Other', reviewed: true, duplicateDecision: decision }, decision); }
  undo() { const change = this.history.pop(); if (!change) return; const r = this.records.find(r => r.id === change.id); const before = { category: r.category, reviewed: r.reviewed, duplicateDecision: r.duplicateDecision }; Object.assign(r, change.before); this.audit.push({ id: r.id, before, after: change.before, action: 'undo', timestamp: new Date().toISOString() }); }
  export(excluded = false) { return exportCSV(this.parsed.headers, this.records, excluded, 'mosswake'); }
  exportLog() { return makeCSV(['time','source_row','action','before','after'],this.audit.map(a => [a.timestamp,a.id+1,a.action,JSON.stringify(a.before),JSON.stringify(a.after)])); }
  money(r) { try { return new Intl.NumberFormat('en-US',{style:'currency',currency:r.currency}).format(r.amount); } catch { return `${r.currency} ${r.amount}`; } }
}
