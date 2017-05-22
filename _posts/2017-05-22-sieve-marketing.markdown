---
layout: post
title:  "Removing marketing links in e-mails with Sieve"
date:   2017-05-22 17:16:54 +0200
categories: sysadmin
excerpt: Using Sieve and python, this script removes marketing links from e-mails to always hover at the exact link you will be redirected to.
---

E-mail marketing companies track the link opened in the e-mails to offer a better vision of what worked and what did not to the client. The tracking method consist to rewrite every links in the e-mail with links to a server of the marketing company which then redirects the customer to the right page.

This leads to having some weird and unintellegible links in the e-mails we receive every day, like so :

<!---excerpt-break-->

```
http://xxxx.srvn.list-manage1.com/track/click?u=yyyyyyyy&id=zzzzzzzz&e=ppppppppp
```

This bothers me as I do not know where I will be redirected. So I used Sieve and python to rewrite the links back.

[Sieve](http://sieve.info/) is a language to filter e-mail messages. It can take several actions as classifying e-mails or sending them to third party programs. In this case it will allow us to filter the e-mails and depending on the sending address, rewrite the links or not.

My global sieve config file contains :

<div><pre class="language-bash line-numbers">
<code class="language-bash">plugin {
    ...
    sieve_plugins = sieve_extprograms
    sieve_filter_bin_dir = /folder/to/sieve/scripts
    sieve_extensions = +vnd.dovecot.filter
    sieve_filter_exec_timeout = 60s
    ...
}</code></pre></div>

My local sieve config file looks like this :

<div><pre class="language-bash line-numbers">
<code class="language-bash">require ["copy","fileinto","imap4flags", "vnd.dovecot.filter"];
# rule:[Marketing URL]
if header :contains "from" "marketing@campain.thx"
{
    filter "filter.py";
}</code></pre></div>

Then we need to create the python script at : `/folder/to/sieve/scripts/filter.py`. It reads the e-mail in MIME format from `stdin`, then parses for URLs. I chose the regex to catch links to other sites, link to the 1px image that indicates that I read the e-mail and link to unsuscribe (as I do not want my script to unsuscribe by mistake).

For each link to another website, it does a request and retrieves the `Location` header and replaces the link with this new URL. For the other links, it replaces them with a link to Google.

{% gist m-rousse/89a4128edaa52d6e227221d47e017d1e %}

The last thing to note is that the e-mail should be sent back to `stdout` in MIME format.

Enjoy your e-mails with comprehensible links :)
