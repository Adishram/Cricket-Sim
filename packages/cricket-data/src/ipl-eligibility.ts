/** Confirmed IPL/all-Indian-cricket retirements only. International retirement is insufficient. */
export const retirementCheckedAt='2026-11-05';
export const iplRetirements:Record<string,{name:string;date:string;scope:string;source:string}>={
 'player-12685':{name:'Ajinkya Rahane',date:'2026-07-30',scope:'All cricket',source:'https://www.icc-cricket.com/news/india-great-calls-time-on-glittering-cricket-career'},
 'auction-433':{name:'Siddarth Kaul',date:'2024-11-28',scope:'Indian cricket including IPL',source:'https://www.indiatoday.in/sports/story/cricket-siddarth-kaul-retirement-virat-kohli-u19-world-cup-ipl-2641843-2024-11-28'},
 'auction-20':{name:'Ravichandran Ashwin',date:'2025-08-27',scope:'IPL',source:'https://www.cricbuzz.com/cricket-news/135418/ravichandran-ashwin-retires-from-ipl-cricbuzzcom'},
 'auction-72':{name:'Mohit Sharma',date:'2025-12-03',scope:'All cricket including IPL',source:'https://www.espn.co.uk/cricket/story/_/id/47189121/mohit-sharma-retires-ipl-all-forms-cricket'},
 'auction-77':{name:'Piyush Chawla',date:'2025-06-06',scope:'All cricket',source:'https://www.business-standard.com/cricket/news/veteran-indian-spinner-piyush-chawla-announces-retirement-from-all-formats-125060600599_1.html'},
 'auction-202':{name:'Rishi Dhawan',date:'2025-01-05',scope:'Indian white-ball cricket including IPL',source:'https://www.indiatoday.in/amp/sports/cricket/story/all-rounder-rishi-dhawan-announces-retirement-from-indian-white-ball-cricket-2660193-2025-01-06'},
};
export function isIplEligible(id:string,asOf=retirementCheckedAt){const retirement=iplRetirements[id];return !retirement||retirement.date>asOf;}
