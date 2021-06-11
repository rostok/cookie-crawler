# cookie-crawler
A rudimental website crawler getting all the cookie files you forgot about. Uses Node/Apify/Puppeteer

# why
If you are tasked with creating cookie policy for GDPR compliance and have no idea what kind of cookies are on the website.

# how
* clone the repo `git clone https://github.com/rostok/cookie-crawler/`
* install packages with `npm install`
* run the crawler providing base URL `node index.js https://example.com/`
* once you are done clean the place `rm -rf apify_storage *cookies.all *cookies.json *visited.urls`
