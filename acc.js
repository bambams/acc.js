/*
 * A custom JS script to enhance http://www.allegro.cc forums.
 * Copyright © 2010 Brandon McCaig
 *
 * This script is used to "enhance" the user experience on the forums at
 * http://www.allegro.cc. You may hotlink it[1], copy it, modify it, or
 * distribute it; but I ask that if you do copy or modify it, you leave
 * this copyright notice intact.
 *
 * Original location: http://www.castopulence.org/js/acc.js
 * Minified: http://www.castopulence.org/js/acc.min.js
 *
 * It depends on jQuery and jQuery UI. Be sure to add both
 * to the list of external JavaScript scripts before this script. A
 * convenient way is by using the Google API servers, which Google
 * encourages you to do anyway[2].
 *
 * For example, add the following lines to your external JavaScript
 * script list:
 *
 * http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js
 * http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/jquery-ui.min.js
 * http://www.castoulence.org/js/acc.min.js
 *
 * As one might expect, it comes with NO WARRANTY, etc. USE AT OWN RISK.
 * Also note that it may periodically break as I develop live so you
 * might experience issues on http://www.allegro.cc if you're hotlinking
 * (or otherwise using a broken version). ^_^ I am not to be held liable
 * for this.
 *
 * [1] At least until I see how it affects my bandwidth, but I can't
 * imagine it will hurt it any. If you do hotlink, check this notice
 * periodically to see if I've changed my mind or risk me taking
 * advantage. ^_^
 *
 * [2] http://code.google.com/apis/ajaxlibs/documentation/
 */
jQuery.noConflict();

bam = {
    exceptionDialogCount: 0,

    cloneBr:
        function(e)
        {
            e.replaceWith(function() {
                return "\n";
            });
        },

    cloneCode:
        function(e)
        {
            e.replaceWith(function() {
                var e = jQuery(this);

                return "<code>" +
                        (e.hasClass("snippet") ? "\n" : "") +
                        e.text().trim() +
                        (e.hasClass("snippet") ? "\n" : "") +
                        "</code>";
            });
        },

    cloneCuss:
        function(e)
        {
            e.replaceWith(function() {
                return jQuery(this).text();
            });
        },

    cloneParagraph:
        function(e)
        {
            e.replaceWith(function() {
                return jQuery(this).html() + "\n\n";
            });
        },

    clonePost:
        function(post)
        {
            var mockup = post.mockup.clone();

            this.stripUrlDisclaimers(mockup);
            this.trimWhitespace(mockup);

            mockup.find("br").each(function() {
                bam.cloneBr(jQuery(this));
            });

            mockup.find("div.quote_container").each(function() {
                bam.cloneQuote(jQuery(this));
            });

            mockup.find(".source-code").each(function() {
                bam.cloneCode(jQuery(this));
            });

            mockup.find("div.youtube").each(function() {
                bam.cloneYouTube(jQuery(this));
            });

            mockup.find("img").each(function() {
                var e = jQuery(this);

                if(/^http:\/\/www\.allegro\.cc\/forums\/smileys\//.test(
                        e.attr("src")))
                {
                    bam.cloneSmiley(e);
                }
            });

            mockup.find("p").each(function() {
                bam.cloneParagraph(jQuery(this));
            });

            mockup.find("span.cuss").each(function() {
                bam.cloneCuss(jQuery(this));
            });

            mockup.find("span.ref").each(function() {
                bam.cloneReference(jQuery(this));
            });

            this.stripReferenceBlock(mockup);
            this.stripXhtmlXmlnsAttribute(mockup);

            return mockup.html();
        },

    cloneQuote:
        function(e)
        {
            e.replaceWith(function() {
                var fmt = "<quote{name}{src}>{body}</quote>\n";
                var quote = bam.getQuote(jQuery(this));

                return fmt
                        .replace("{name}", quote.name ?
                        " name=\"" + bam.htmlEncode(quote.name) +
                        "\"" : "").replace("{src}", quote.src ?
                        " src=\"" + bam.htmlEncode(quote.src) +
                        "\"" : "").replace("{body}", quote.body);
            });
        },

    cloneReference:
        function(e)
        {
            e.replaceWith(function() {
                var e = jQuery(this);
                var i = e.find("a").text() | 0;
                var ref = e.parents(".mockup").find(
                        ".ref-block li:nth-child(" + i + ")");

                //bam.stripUrlDisclaimers(ref);

                return "<ref>" + ref.html() + "</ref>";
            });
        },

    cloneSmiley:
        function(e)
        {
            e.replaceWith(function() {
                return jQuery(this).attr("alt");
            });
        },

    cloneYouTube:
        function(e)
        {
            //e.replaceWith(function() {
                //return "<object data=\"" +
                        //jQuery(this).find("a").attr("href") +
                        //"\"></object>";
            //});
            e.replaceWith(function() {
                return "\\[" + jQuery(this).find("a").attr("href") + "]";
            });
        },

    htmlDecode:
        function(s)
        {
            return s.replace(/&quot;/g, "\"")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&#39;/g, "'")
                .replace(/&amp;/g, "&");
        },

    htmlEncode:
        function(s)
        {
            return s.replace(/&/g, "&amp;").replace(/'/g, "&#39;")
                    .replace(/"/g, "&quot;").replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
        },

    getPost:
        function(e)
        {
            var p;

            if(e instanceof Number)
                e = jQuery("#post-" + id);
            else if(!(e instanceof jQuery))
                e = jQuery(e);

            p = {
                originator: e.find(".originator").text(),
                memberNumber: e.find(".member-number").text().replace(
                        "Member #", "") | 0,
                header: e.find(".header"),
                id: e.get(0).id.replace("post-", "") | 0,
                mockup: e.find("td.content > div > .mockup"),
                post: e,
                src: e.find(".posted-on > a").get(0).href
            };

            if(e.length != 1 || p.header.length != 1 ||
                    p.mockup.length != 1)
            {
                throw new Error("Invalid argument 'e'. Must be a " +
                        "Number (the post id) or a jQuery object with " +
                        "just the post element selected.");
            }

            return p;
        },

    getQuote:
        function(e)
        {
            var name;
            var p;
            var q;
            var src;

            if(!(e instanceof jQuery))
                e = jQuery(e);

            name = (name = (name = e.find(".title")) && name.text()) &&
                    name.replace(/ said:$/, "");
            src = e.find(".title > a").attr("href");

            if(/^#post-(\d+)/.test(src))
                src = jQuery(src + " .posted-on a").attr("href");

            q = {
                body: e.find(".quote").text().trim(),
                name: name && name.trim() || "",
                src: src && src.trim() || ""
            };

            return q;
        },

    quote:
        function(id)
        {
            var post = this.getPost(jQuery("#post-" + id));
            var body = jQuery("#mub-body");
            var quote = this.clonePost(post).trim();

            body.val(body.val() +
                    (body.val().length != 0 ? "\n" : "") +
                    "<quote name=\"" + post.originator +
                    "\" src=\"" + post.src + "\">\n" +
                    quote +
                    (quote[quote.length - 1] != "\n" ?
                    "\n" : "") +
                    "</quote>");
        },

    showException:
        function(ex)
        {
            var e = jQuery(document.body).append(
                    "<div class=\".bam-exception-dialog\" " +
                    "title=\"Unhandled Exception Caught\">" +
                    "<p>The following exception was thrown and not " +
                    "handled:</p><p>" +
                    ex.message +
                    "</p>" + (jQuery.isFunction(ex.toSource) ?
                    "<a href=\"javascript:bam.showExceptionVerbose(" +
                    this.exceptionDialogCount +
                    ");\">Show complete exception.</a><p " +
                    "class=\".bam-verbose\">" +
                    ex.toSource() +
                    "</p>" : "") +
                    "</div>");

            e.get(0).id = "bam-exception-dialog|" +
                    this.exceptionDialogCount;
            e.find(".bam-verbose").hide();

            this.exceptionDialogCount++;
        },

    showExeptionVerbose:
        function(id)
        {
            var e = jQuery("#bam-exception-dialog|" + id);

            if(e.length != 1)
            {
                throw new Error("Failed to find exception dialog '" +
                        id +
                        "'.");
            }

            e.find(".bam-verbose").fadeIn("slow");
        },

    stripReferenceBlock:
        function(e)
        {
            e.find(".ref-block").remove();
        },

    stripUrlDisclaimers:
        function(e)
        {
            /*
             * Remove those "[domain]" warnings that are automatically
             * added after hyperlinks on the backend.
             */
            e.find("span.url").remove();
        },

    stripXhtmlXmlnsAttribute:
        function(e)
        {
            e.find("*[xmlns='http://www.w3.org/1999/xhtml']").removeAttr(
                    "xmlns");
        },

    /*
     * It's very hard to get the quoting perfect so as an alternative,
     * this method just appends correct <quote> tags, with name and src,
     * without actually adding any quoted content. This leaves the
     * quoting up to you, but saves you the trouble of scrolling back and
     * forth on the page to copy the username/hyperlink.
     */
    stub:
        function(id)
        {
            var post = this.getPost(jQuery("#post-" + id));
            var body = jQuery("#mub-body");

            body.val(body.val() +
                    (body.val().length != 0 ? "\n" : "") +
                    "<quote name=\"" + post.originator +
                    "\" src=\"" + post.src + "\">\n" +
                    "\n" +
                    "</quote>");
        },

    trimWhitespace:
        function(e)
        {
            e.contents().filter(function() {
                var e = jQuery(this);

                if(this.nodeType == (Node && Node.TEXT_NODE || 3))
                    e.val(e.val().trim());
            });
        }
}

jQuery(function() {
    /*
     * Navigation menu width. Wider to avoid moving content down (it can
     * be annoying when you're trying to click and link and it suddently
     * jolts down as this JS runs in the background). Of course, on
     * smaller screens, this can be a problem. Maybe eventually support
     * can be added for a configuration menu to control this.
     */
    jQuery("table[summary='forum header'] td:nth-child(2)").width(650);

    // Navigation menu additions.
    jQuery("#forum-navigation").find("a:nth-child(5)").after(
            " | <a " +
            "href=\"/cc/theme-css\" " +
            "title=\"View/edit my custom CSS/JS.\">css/js</a> | " +
            "<a " +
            "href=\"https://www.allegro.cc/pm\" " +
            "id=\"my-inbox-link\" " +
            "title=\"Your private message inbox.\">inbox</a> | " +
            "<a " +
            "href=\"https://www.allegro.cc/pm/list/outbox\" " +
            "id=\"my-outbox-link\" " +
            "title=\"Your private message outbox.\">outbox</a> | " +
            "<a " +
            "href=\"http://www.allegro.cc/pm/compose/\" " +
            "id=\"my-compose-link\" " +
            "title=\"Compose a new private message.\">compose</a> | " +
            "<a " +
            "href=\"/cc/forums-settings\" " +
            "id=\"my-settings-link\" " +
            "title=\"View/edit your forum settings.\">settings</a>");

    // Last-read links.
    jQuery("#thread-list").find("span.topic a").each(function() {
        var e = jQuery(this);
        var clone = e.clone();

        clone.text("Top");
        clone.attr("style", clone.attr("style") + "; float: right; margin-right: 1em;");

        e.attr("href", e.attr("href") + "#last_read");
        e.after(clone);
    });

    // Post header additions.
    jQuery("#thread .post").each(function(E) {
        var o = bam.getPost(jQuery(this));

        o.header.append("<a href=\"#post_form\" " +
                "title=\"Jump to the mockup box.\">Mockup</a> " +
                "<a href=\"javascript:bam.quote(" +
                o.id +
                ");\" title=\"Quote this post.\">Quote</a> " +
                "<a href=\"javascript:bam.stub(" +
                o.id +
                ");\" title=\"Stub quote this post.\">Stub</a>");
    });
});

