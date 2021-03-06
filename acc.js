/*
 * A custom JS script to enhance http://www.allegro.cc forums.
 * Copyright © 2010 Brandon McCaig
 *
 * This script is used to "enhance" the user experience on the forums at
 * http://www.allegro.cc. You may hotlink it[1], copy it, modify it, or
 * distribute it; but I ask that if you do copy or modify it, you leave
 * this copyright notice intact.
 *
 * Original location: https://www.castopulence.org/js/acc.js
 * Minified (lies): https://www.castopulence.org/js/acc.min.js
 *
 * It depends on jQuery and jQuery UI. Be sure to add both
 * to the list of external JavaScript scripts before this script. A
 * convenient way is by using the Google API servers, which Google
 * encourages you to do anyway[2].
 *
 * For example, add the following lines to your external JavaScript
 * script list:
 *
 * https://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js
 * https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.2/jquery-ui.min.js
 * https://www.castopulence.org/js/acc.min.js
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

// It appears that jQuery is currently conflicting with A.cc in some way.
// So I'll wrap the script so that it doesn't error without jQuery.
if(typeof jQuery != "undefined")
{
    jQuery.noConflict();

    /*
     * Add our stylesheets.
     */
    jQuery("head").append("<link rel=\"stylesheet\" type=\"text/css\" " +
            "href=\"http://www.castopulence.org/js/acc.css\" />" +
            "<link rel=\"stylesheet\" type=\"text/css\" " +
            "href=\"http://castopulence.org/js/jquery-ui.css\" />");

    bam = {
        configHtml: null,
        exceptionDialogCount: 0,
        baseTemplateUri: "http://castopulence.org/accjs/tmpl",

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

                    if(/^(https?:\/\/www\.allegro\.cc)?\/forums\/smileys\//.test(
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

        closeDialog:
            function(dialog)
            {
                jQuery(dialog).dialog("destroy");
            },

        downloadCodeZip:
            function(e)
            {
                if(!JSZip)
                {
                    throw new Error("You need to have JSZip loaded to " +
                            "download <code> blocks as a zip file.");
                }

                if(typeof e == "number" || e instanceof Number)
                    e = jQuery("#post-" + e);
                else
                    e = jQuery(e);

                var scs = e.find("div.source-code:has(" +
                        "div.toolbar > span.name)");

                if(scs.length < 1)
                {
                    throw new Error("There are no code blocks to " +
                            "download.");
                }

                var zip = new JSZip();

                for(var i=0; i<scs.length; i++)
                {
                    var sc = jQuery(scs.get(i)); 
                    var path = sc.find("div.toolbar > span.name").text();
                    var block = sc.find("div.inner").clone();
                    
                    block.find("span.number").remove();

                    var code = block.text();
                    var dirs = path.split(/[\\\/]/);
                    var folder = zip;
                    var name = dirs[dirs.length - 1] || path;

                    dirs.length = dirs.length - 1;

                    for(var j=0; j<dirs.length; j++)
                        folder = folder.folder(dirs[j]);

                    folder.add(name, code);
                }

                var content = zip.generate();

                window.location.href = "data:application/zip;base64," +
                        content;
            },

    embedTemplates:
            function()
            {
                var self = this;

                jQuery(function() {
                    var templates = [
                        "exception.tmpl",
                        "ignoredMember.tmpl",
                        "loading.tmpl",
                        "navext.tmpl",
                        "post-header.tmpl",
                        "quote.tmpl",
                        "styles.tmpl"
                    ];

                    for(var i=0, l=templates.length; i<l; i++)
                    {
                        var n = templates[i];

                        jQuery(document.body).append(
                                "<script id='" +
                                n +
                                "' type='text/plain' " +
                                "src='" +
                                self.baseTemplateUri +
                                "/" +
                                n +
                                "'></script>");
                    }
                });
            },

        getConfigDialog:
            function(loadDialog, callback)
            {
                var self = this;

                if(this.configHtml)
                {
                    if(typeof callback == "function")
                        callback(null, this.configHtml);
                }
                else
                {
                    new Ajax.Request("http://www.castopulence.org/js/config.txt",
                    {
                        onError:
                            function() {
                                bam.closeDialog(loadDialog);
                                bam.showException(new Error(
                                        "Failed to load config dialog."));
                            },

                        onException:
                            function(req, ex) {
                                bam.showException(ex);
                            },

                        onSuccess:
                            function(transport) {
                                self.configHtml = transport.responseText;

                                if(typeof callback == "function")
                                    callback(transport);
                            }
                    });
                }
            },

        getPost:
            function(e)
            {
                e = this.getPostElement(e);

                var p = {
                    originator: e.find(".originator").text(),
                    memberNumber: e.find(".member-number").text().replace(
                            "Member #", "").replace(",", "") | 0,
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

        getPostElement:
            function(e)
            {
                if(typeof e == "object" && e instanceof Number ||
                        typeof e == "number")
                {
                    e = jQuery("#post-" + e);
                }
                else
                {
                    e = jQuery(e);
                }

                return e;
            },

        getQuote:
            function(e)
            {
                var name;
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

        ignoreMember:
            function(id)
            {
                jQuery(function() {
                    jQuery(".post.m" + id)
                            .css("visibility", "hidden")
                            .each(function() {
                                var e = jQuery(this);
                                var post = bam.getPost(e);

                                e.before("<div class=\"ignored " +
                                        post.id +
                                        "\" style=\"" +
                                        "background-color: #e1c896;" +
                                        "top: 0em;" +
                                        "position: relative;" +
                                        "text-align: center;\">\n" +
                                        post.originator +
                                        " is ignored. " +
                                        "(<a href=\"javascript:" +
                                        "bam.showPost(" +
                                        post.id +
                                        ");\">Show post.</a>)</div>");
                            });
                });
            },

        install:
            function()
            {
                jQuery(function() {
                    //bam.embedTemplates();

                    /*
                     * Stop the annoying vuvuzela sound (probably only
                     * needed temporarily). ;)
                     */
                    bam.stopAudio("#vuvuzela");

                    // Also stop the USA anthem. Gets old. ;)
                    bam.stopAudio("#usa-anthem");

                    // Add 'load' date/time.
                    var date = jQuery("<span>");
                    date.text(new Date().toString());
                    jQuery(".forum-page-numbers").prepend(date);

                    /*
                     * Navigation menu width. Wider to avoid moving
                     * content down (it can be annoying when you're trying
                     * to click and link and it suddently jolts down as
                     * this JS runs in the background). Of course, on
                     * smaller screens, this can be a problem. Maybe
                     * eventually support can be added for a configuration
                     * menu to control this.
                     */
                    jQuery("table[summary='forum header'] " +
                            "td:nth-child(2)").width(750);

                    jQuery(document.body)
                            .prepend("<div id=\"bam-top\"></div>");

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
                            "title=\"View/edit your forum settings.\">settings</a> | " +
                            "<a " +
                            "id=\"my-config-link\" " +
                            "title=\"View/edit your acc.js configuration.\">config</a>");

                    jQuery("#my-config-link").click(function() {
                        bam.showConfig();
                    });

                    // Last-read and Top links.
                    jQuery("#thread-list").find("span.topic a").each(function() {
                        var e = jQuery(this);
                        var clone = e.clone();
                        var l = e.parents("div.topic").find("> a:last-child");

                        if(l.length == 0)
                            l = e;

                        clone.text("Top");
                        clone.attr("style", clone.attr("style") +
                                "; float: right; margin-right: 1em;");

                        e.attr("href", l.attr("href") + "#last_read");
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
                                "<a href=\"/pm/compose/" +
                                o.memberNumber +
                                "\" title=\"Send a private message to " +
                                o.originator +
                                ".\">PM</a> " +
                                "<a href=\"javascript:bam.stub(" +
                                o.id +
                                ");\" title=\"Stub quote this post.\">Stub</a> " +
                                "<a href=\"#bam-top\" " +
                                "title=\"Jump to the top of the page.\">Top</a> " +
                                "<a href=\"javascript:bam.downloadCodeZip(" +
                                o.id +
                                ");\" title=\"Download a zip file with all named " +
                                "code tags as its contents.\">Zip</a>");
                    });

                    // Add title attribute to cusses. ;)
                    jQuery("span.cuss").each(function() {
                        var e = jQuery(this);

                        e.attr("title", e.text());
                    });

                    // Wrap terminal at 80 characters.
                    jQuery("pre.terminal").each(function() {
                        var e = jQuery(this);

                        e.css("width", "80em !important")
                                .css("white-space", "pre-wrap !important");
                    });

                    // Add h4x button to show spoilers in read private messages
                    // because the A.cc UI doesn't seem to show up, rendering them
                    // inaccessible short of scripting hacks.
                    (function() {
                        if(/\/pm\/read/.test(window.location))
                        {
                            var getNextId = (function() {
                                var id = 0;

                                return function() {
                                    return id++;
                                };
                            })();

                            // h4x: Poll once a second, since A.cc seems to build the DOM
                            // dynamically on-demand, and I don't know what, if anything,
                            // I can hook into that.
                            var interval = setInterval(function() {
                                var spoilers = jQuery(".spoiler");

                                spoilers.each(function() {
                                    var e = jQuery(this);
                                    var id = e.attr("id");

                                    if(id == null || id == "")
                                    {
                                        e.attr("id", "spoiler" + getNextId());
                                    }

                                    if(jQuery("button#" + e.attr("id")).length == 0)
                                    {
                                        var button = jQuery("<button type='button'>Show Spoiler</button>");

                                        button.click(function() {
                                            e.show();
                                        });

                                        button.attr("id", e.attr("id"));

                                        e.before(button);
                                    }
                                });
                            }, 1000);
                        }
                    })();
                });
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

        saveConfig:
            function()
            {
                var profile = jQuery("#acc_js_profile").val();
                var profileName = jQuery("#acc_js_profile_name");
//              var

                return false;
            },

        showConfig:
            function()
            {
                var loadDialog = bam.showLoading("dialog");

                bam.getConfigDialog(loadDialog, function(transport, html) {
                    var configDialog;

                    jQuery(document.body).append(
                            html || transport.responseText);

                    configDialog = jQuery(document.body).find(
                            "#acc_js_config_dialog");

                    bam.closeDialog(loadDialog);

                    jQuery("#acc_js_save_config_button").click(function(E) {
                        if(bam.saveConfig())
                            bam.closeDialog(configDialog);
                    });

                    jQuery("#acc_js_cancel_config_button").click(function(E) {
                        bam.closeDialog(configDialog);
                    });
                });
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

                e.dialog({
                    close:
                        function() {
                            jQuery(this).remove();
                        }
                });

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

        showLoading:
            function(what)
            {
                var html = "<div id=\"acc_js_loading_dialog\" " +
                        "title=\"acc.js - Loading...\">" +
                        "Loading "
                        + (what || "something") +
                        " from server...</div>";
                var loadDialog;

                jQuery(document.body).append(html);

                loadDialog = jQuery(document.body).find(
                        "> div:last-child");

                loadDialog.dialog();

                return loadDialog;
            },

        showPost:
            function(e)
            {
                e = this.getPostElement(e);

                e.css("visibility", "");

                var post = this.getPost(e);

                jQuery(".ignored." + post.id).remove();
            },

        stopAudio:
            function(e)
            {
                jQuery(e).each(function() {
                    if(typeof this.pause == "function")
                        this.pause();
                    this.currentTime = 0;
                });
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
    };
}
