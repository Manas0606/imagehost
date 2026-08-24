import type {Chart} from './astrology';
import {askMiniAI as coreAsk,type MiniAnswer,type MiniContext} from './mini-ai';
import type {GuidanceLanguage} from './guidance';

export type {MiniAnswer,MiniContext} from './mini-ai';

const explicitReconciliation=(q:string)=>/(^|\s)(ex|एक्स)(\s|$)|reconcil|patch\s*up|come\s+back|return\s+to\s+me|वापस\s+आ|पैच\s*अप|ପୁଣି\s+ଫେର|ପୁନଃମିଳନ/i.test(q.normalize('NFKC'));

/**
 * Public local Mini-AI entry point.  The core classifier intentionally accepts
 * fuzzy text, while this wrapper prevents short tokens such as "ex" from
 * accidentally matching inside unrelated words like "exactly" or "next".
 */
export function askMiniAI(chart:Chart,question:string,lang:GuidanceLanguage='en',previous?:MiniContext):MiniAnswer{
  let answer=coreAsk(chart,question,lang,previous);
  if(answer.focus==='reconciliation'&&!explicitReconciliation(question)){
    const cleaned=question.replace(/ex/gi,'e x');
    const contextHint=previous?.topic&&previous.topic!=='general'?` ${previous.topic}`:'';
    answer=coreAsk(chart,`${cleaned}${contextHint}`,lang,previous);
  }
  return answer;
}
