const moment = require('moment');
const fs = require('fs');
const Apify = require('apify');

process.env.APIFY_HEADLESS = 1;
var allcookies = {};

var base = process.argv.slice(2).shift();
if (base==undefined) {
    console.log("provide URL in command line parameters");
	process.exit();
}
var basefile = base.replace("https://","").replace("http://","").replace(":","").replace("/","-")

fs.writeFileSync(basefile+'visited.urls', "", { flags: 'w+' });
fs.writeFileSync(basefile+'cookies.json', "", { flags: 'w+' });
fs.writeFileSync(basefile+'cookies.all', "", { flags: 'w+' });

Apify.main(async () => {
    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url: base });

    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,
//        launchPuppeteerOptions: { headless: true, stealth: true, useChrome: true },
//        launchContext: { useChrome: true, stealth: true, launchOptions: { headless: true, }, },
        handlePageFunction: async ({ request, page }) => {
            var ac = await page._client.send('Network.getAllCookies');
            if (ac.cookies) {
	            ac.cookies.forEach( c => { 
	                var dur = moment.duration(c.expires-moment().unix(), "seconds").humanize();
	                if (c.expires<0) dur = "Session";
    	            if (!allcookies.hasOwnProperty(c.name)) 
    	            allcookies[c.name] = {
    	            	name:c.name, 
    	            	domain:c.domain, 
    	            	path:c.path, 
    	            	duration:dur, 
    	            	session:c.session, 
    	            	secure: c.secure,
    	            	firstSeen: request.url
    	            };
	            } );
            }
            console.log(`${request.url}`);
			//console.log(JSON.stringify(allcookies));

            process.stdout.write('\u001b[s\u001b[1;1H\u001b[2K'); // save pos, goto top left corner, clear line
    		console.log("name\tdomain\tpath\tduration\tsession\tsecure\tfirstSeen\n");
		    Object.entries(allcookies).sort().map(c=>{
    			c=c[1];
    			process.stdout.write('\u001b[2K');
	    		console.log(`${c.name}\t${c.domain}\t${c.path}\t${c.duration}\t${c.session}\t${c.secure}\t${c.firstSeen}`);
    		});
   			process.stdout.write('\u001b[2K');
    		console.log('-----------------------------------------------------');
            process.stdout.write('\u001b[u'); // restore pos

            const cookies = await page.cookies();
            fs.appendFileSync(basefile+'cookies.json', JSON.stringify(cookies)+"\n");
            fs.appendFileSync(basefile+'visited.urls', JSON.stringify(cookies.map((c)=>c.name).sort())+"\t"+request.url+"\n");
            
            // Add URLs that match the provided pattern.
            await Apify.utils.enqueueLinks({
                page,
                requestQueue,
                pseudoUrls: [base+'[.*]'],
            });
        },
    });

    await crawler.run();

    fs.appendFileSync(basefile+'cookies.all', "name\tdomain\tpath\tduration\tsession\tsecure\tfirstSeen\n");
    Object.entries(allcookies).sort().map(c=>{
   		c=c[1];
	    fs.appendFileSync(basefile+'cookies.all', `${c.name}\t${c.domain}\t${c.path}\t${c.duration}\t${c.session}\t${c.secure}\t${c.firstSeen}\n`);
    });
    fs.appendFileSync(basefile+'cookies.all', "\n\n");
    fs.appendFileSync(basefile+'cookies.all', JSON.stringify(allcookies, null, 2) );
    console.log("bye bye");
});