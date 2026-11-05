import {test,expect,type Browser,type Page} from '@playwright/test';
async function createRoom(page:Page,timer='5s'){
 await page.goto('/lobby');
 await page.locator('.timer-picker label',{hasText:timer}).first().click();
 await page.getByRole('button',{name:/Create auction room/}).click();
 await page.waitForURL(/\/room\/[A-Z0-9]{6}$/);
 return page.url();
}
async function join(page:Page,name:string,team:string){
 await page.getByLabel('Your name').fill(name);
 await page.getByRole('radio',{name:new RegExp(team)}).click();
 await page.getByRole('button',{name:/Claim franchise/}).click();
 await expect(page.getByRole('heading',{name:/You’re in/})).toBeVisible();
}
async function friend(browser:Browser,url:string){const ctx=await browser.newContext();const page=await ctx.newPage();await page.goto(url);return {ctx,page};}

test('friends join via shared link, bid live and see purchases on the dashboard',async({page,browser})=>{
 await page.setViewportSize({width:1440,height:1100});
 const url=await createRoom(page);
 await expect(page.getByLabel('Invite link')).toHaveValue(url);
 await join(page,'Host','Mumbai Indians');
 const b=await friend(browser,url);
 await expect(b.page.getByRole('radio',{name:/Mumbai Indians/})).toBeDisabled();
 await join(b.page,'Guest','Chennai Super Kings');
 await expect(b.page.getByRole('button',{name:/Start auction/})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Start auction with 2 franchises'})).toBeEnabled();
 await page.getByRole('button',{name:/Start auction/}).click();
 const lot=page.locator('.player-identity h2');
 await expect(lot).toBeVisible();
 const name=(await lot.innerText()).replace(/\s+/g,' ').trim();
 await expect(b.page.locator('.player-identity h2')).toHaveText(name);
 await page.getByRole('button',{name:/Place bid/}).click();
 await expect(page.getByRole('button',{name:'You’re leading the auction'})).toBeDisabled();
 await expect(b.page.locator('.leader')).toContainText('Mumbai Indians');
 await expect(page.locator('.timer-track')).toHaveAttribute('aria-valuemax','5');
 await page.screenshot({path:'artifacts/auction-desktop.png',fullPage:true});
 await expect(page.locator('.sold-stamp.sold')).toBeVisible({timeout:10000});
 await page.getByRole('link',{name:/Squad dashboard/}).click();
 await expect(page.getByRole('region',{name:'Mumbai Indians squad'})).toContainText(name);
 await expect(page.getByRole('region',{name:'Mumbai Indians squad'})).toContainText('1/15');
 await page.getByRole('tab',{name:/CSK/}).click();
 await expect(page.getByRole('region',{name:'Chennai Super Kings squad'})).toContainText('No signings yet.');
 await page.screenshot({path:'artifacts/squad-dashboard.png',fullPage:true});
 await b.ctx.close();
});

test('server enforces ownership, host-only controls and command validation',async({playwright})=>{
 const host=await playwright.request.newContext({baseURL:'http://localhost:3000'}),guest=await playwright.request.newContext({baseURL:'http://localhost:3000'});
 const {code}=await(await host.post('/api/rooms',{data:{timer:10}})).json();
 expect((await host.post('/api/rooms',{data:{timer:7}})).status()).toBe(400);
 const k=()=>crypto.randomUUID();
 expect((await guest.post(`/api/rooms/${code}`,{data:{action:'bid',key:k()}})).status()).toBe(400);
 expect((await host.post(`/api/rooms/${code}`,{data:{action:'join',team:'rcb',name:'H',key:k()}})).ok()).toBeTruthy();
 const taken=await guest.post(`/api/rooms/${code}`,{data:{action:'join',team:'rcb',name:'G',key:k()}});
 expect((await taken.json()).error).toContain('already taken');
 await guest.post(`/api/rooms/${code}`,{data:{action:'join',team:'kkr',name:'G',key:k()}});
 expect((await(await guest.post(`/api/rooms/${code}`,{data:{action:'start',key:k()}})).json()).error).toContain('Only the host');
 expect((await guest.post(`/api/rooms/${code}`,{data:{action:'hack',key:k()}})).status()).toBe(400);
 expect((await host.post(`/api/rooms/${code}`,{data:{action:'start',key:k()}})).ok()).toBeTruthy();
 const key=k();await guest.post(`/api/rooms/${code}`,{data:{action:'bid',key}});await guest.post(`/api/rooms/${code}`,{data:{action:'bid',key}});
 const state=(await(await host.get(`/api/rooms/${code}`)).json()).state;
 expect(state.history).toHaveLength(1);expect(state.leader).toBe('kkr');
 expect((await host.get('/api/rooms/ZZZZZZ')).status()).toBe(404);
 await host.dispose();await guest.dispose();
});

test('OVR, career fallback and unavailable states in the scouting directory',async({page})=>{
 await page.goto('/lobby');await createRoom(page,'10s');
 const search=page.getByLabel('Find a player, role, country or IPL team');
 await search.fill('Virat Kohli');await page.locator('.directory-results button').first().click();
 const kohli=page.getByRole('region',{name:'Virat Kohli career statistics'});
 await expect(kohli).toContainText('9,336');await expect(kohli).toContainText('IPL 2026 season');await expect(kohli).toContainText('Estimated OVR');
 await search.fill('Jack Edwards');await page.locator('.directory-results button').click();
 const jack=page.getByRole('region',{name:'Jack Edwards career statistics'});
 await expect(jack).toContainText('T20 career fallback');await expect(jack).toContainText('CAREER RECORD · OBSERVED');await expect(jack).not.toContainText('IPL 2026 season');
 await search.fill('Aman Rao');await page.locator('.directory-results button').click();
 await expect(page.getByRole('region',{name:'Aman Rao career statistics'})).toContainText('Career stats unavailable');
 await search.fill('zzzzzz');await expect(page.getByText('No players match your search.')).toBeVisible();
});

test('layout stays within narrow and tablet viewports',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await createRoom(page,'10s');
 for(const width of [320,390,768,1024]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);}
 await page.setViewportSize({width:390,height:844});await page.goto('/');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 await page.goto('/lobby');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 await page.screenshot({path:'artifacts/lobby-mobile.png',fullPage:true});
});

test('legacy /auction redirects to the lobby',async({page})=>{await page.goto('/auction');await expect(page).toHaveURL(/\/lobby$/);await expect(page.getByRole('heading',{name:'Your league. Your legacy.'})).toBeVisible();});
