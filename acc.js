/*
 * A custom JS script to enhance https://www.allegro.cc/ forums.
 * Copyright © 2010, 2012-2013, 2018, 2021 Brandon McCaig
 * 
 * This script is used to "enhance" the user experience on the forums at
 * https://www.allegro.cc/. You may hotlink it, copy it, modify it, or
 * distribute it; but I ask that if you do copy or modify it, you leave
 * this copyright notice intact and note your changes in a separate file
 * (e.g., README.forkname).
 * 
 *   Hosted version:    https://www.castopulence.org/js/acc.js
 *   Minfied (maybe):   https://www.castopulence.org/js/acc.min.js
 *   Bleeding edge:     https://www.castopulence.org/js/acc.dev.js
 * 
 * It depends on jQuery and jQuery UI. Be sure to add both to the list of
 * external JavaScript scripts before this script. A convenient way is by
 * using the Google API servers, which Google encourages you to do
 * anyway[1].
 * 
 * It also [optionally] depends on jszip, which is used to turn named
 * <code> blocks into a zip file with the file contents. You only need
 * jszip if you intend to use this (not too many people name their <code>
 * tags anyway, but I do :P).
 * 
 * For example, add the following lines to your external JavaScript script
 * list:
 * 
 * https://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js
 * https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.2/jquery-ui.min.js
 * https://www.castopulence.org/js/jszip.js
 * https://www.castopulence.org/js/acc.min.js
 * 
 * You must now invoke bam.install() in order for acc.js to actually be
 * executed now (perhaps it should be in a bam.accjs namespace..). This is
 * more or less just the "always run" stuff. You can still invoke
 * individual methods manually, of course.
 * 
 * As one might expect, it comes with NO WARRANTY, etc. USE AT OWN RISK.
 * Also note that it may periodically break as I develop live so you might
 * experience issues on https://www.allegro.cc/ if you're hotlinking (or
 * otherwise using a broken version). ^_^ I am not to be held liable for
 * this. Host your own copy to avoid such breakage.
 * 
 * [1] https://code.google.com/apis/ajaxlibs/documentation/
 */

// It appears that jQuery is currently conflicting with A.cc in some way.
// So I'll wrap the script so that it doesn't error without jQuery.
if (typeof jQuery != "undefined") {
  jQuery.noConflict();

  if (!window.hasOwnProperty("bam")) {
    bam = {};
  }

  bam.accjs = {
    "addStylesheets": function () {
      const stylesheets = `
          <link rel="stylesheet" type="text/css" "href="https://www.castopulence.org/js/acc.css" />
          <link rel="stylesheet" type="text/css" "href="https://www.castopulence.org/js/jquery-ui.css" />
          `;

      jQuery("head").append(stylesheets);
    },

    "baseTemplateUri": "https://castopulence.org/accjs/tmpl",
    "configHtml": null,
    "exceptionDialogCount": 0,

    "cloneBr": function (e) {
      e.replaceWith(function () {
        return "\n";
      });
    },

    "cloneCode": function (e) {
      e.replaceWith(function () {
        const e = jQuery(this),
              newline = e.hasClass("snippet") ? "\n" : "";

        return `<code>${newline}${e.text().trim()}${newline}</code>`;
      });
    },

    "cloneCuss": function (e) {
      e.replaceWith(function () {
        return jQuery(this).text();
      });
    },

    "cloneParagraph": function (e) {
      e.replaceWith(function () {
        return jQuery(this).html() + "\n\n";
      });
    },

    "clonePost": function (post) {
      const mockup = post.mockup.clone();

      this.stripUrlDisclaimers(mockup);
      this.trimWhitespace(mockup);

      mockup.find("br").each(function () {
        bam.accjs.cloneBr(jQuery(this));
      });

      mockup.find("div.quote_container").each(function () {
        bam.accjs.cloneQuote(jQuery(this));
      });

      mockup.find(".source-code").each(function () {
        bam.accjs.cloneCode(jQuery(this));
      });

      mockup.find("div.youtube").each(function () {
        bam.accjs.cloneYouTube(jQuery(this));
      });

      mockup.find("img").each(function () {
        const smiley_re = /^(https?:\/\/www\.allegro\.cc)?\/forums\/smileys\//,
              e = jQuery(this);

        if (smiley_re.test(e.attr("src"))) {
          bam.accjs.cloneSmiley(e);
        }
      });

      mockup.find("p").each(function () {
        bam.accjs.cloneParagraph(jQuery(this));
      });

      mockup.find("span.cuss").each(function () {
        bam.accjs.cloneCuss(jQuery(this));
      });

      mockup.find("span.ref").each(function () {
        bam.accjs.cloneReference(jQuery(this));
      });

      this.stripReferenceBlock(mockup);
      this.stripXhtmlXmlnsAttribute(mockup);

      return mockup.html();
    },

    "cloneQuote": function (e) {
      e.replaceWith(function () {
        const fmt = "<quote{name}{src}>{body}</quote>\n",
              name_attr = quote.name ? " name=\"" + bam.accjs.htmlEncode(quote.name) + "\"" : "",
              quote = bam.accjs.getQuote(jQuery(this));

        return fmt
            .replace("{name}", nameAttr)
            .replace("{src}", )
            .replace("{body}", quote.body);

        function attr (name, value) {
          if (!quote.src) {
            return "";
          }

          const encoded_value = bam.accjs.htmlEncode(value);

          return ` ${name}="${encoded_value}"`;
        };
      });
    },

    "cloneReference": function (e) {
      e.replaceWith(function () {
        const e = jQuery(this),
              i = e.find("a").text() | 0,
              ref = e.parents(".mockup")
                  .find(`.ref-block li:nth-child(${i})`);

        //bam.accjs.stripUrlDisclaimers(ref);

        return `<ref>${ref.html()}</ref>`;
      });
    },

    "cloneSmiley": function (e) {
      e.replaceWith(function () {
        return jQuery(this).attr("alt");
      });
    },

    "cloneYouTube": function (e) {
      const href = jQuery(this).find("a").attr("href");

      e.replaceWith(function () {
        return `\\[${href}]`;
      });
    },

    "closeDialog": function (dialog) {
      jQuery(dialog).dialog("destroy");
    },

    "downloadCodeZip": function (e) {
      if (!JSZip) {
        const msg = "You need to have JSZip loaded to download <code> blocks as a zip file.";
        throw new Error(msg);
      }

      e = this.getPostElement(e);

      const scs = e.find("div.source-code:has(div.toolbar > span.name)");

      if (scs.length < 1) {
        throw new Error("There are no code blocks to download.");
      }

      const zip = new JSZip();

      for (let i=0; i<scs.length; i++) {
        const sc = jQuery(scs.get(i)),
              path = sc.find("div.toolbar > span.name").text(),
              block = sc.find("div.inner").clone();

        block.find("span.number").remove();

        const code = block.text(),
            dirs = path.split(/[\\\/]/);
            folder = zip;
            name = dirs[dirs.length - 1] || path;

        dirs.length = dirs.length - 1;

        for (let j=0; j<dirs.length; j++) {
          folder = folder.folder(dirs[j]);
        }

        folder.add(name, code);
      }

      const content = zip.generate();

      window.location.href = `data:application/zip;base64,${content}`;
    },

    "embedTemplates": function () {
      const self = this;

      jQuery(function () {
        const templates = [
          "exception.tmpl",
          "ignoredMember.tmpl",
          "loading.tmpl",
          "navext.tmpl",
          "post-header.tmpl",
          "quote.tmpl",
          "styles.tmpl"
        ];

        for (let i=0, l=templates.length; i<l; i++) {
          const t = templates[i],
                u = `${self.baseTemplateUri}/${t}`,
                h = `<script id="${t}" type="text/plain" src="${u}"></script>`;

          jQuery(document.body).append(h);
        }
      });
    },

    "getConfigDialog": function (loadDialog, callback) {
      const self = this;

      if (this.configHtml)
      {
        if (typeof callback === "function") {
          callback(null, this.configHtml);
        }
      }
      else
      {
        const options = {
          "onError": function () {
            bam.accjs.closeDialog(loadDialog);
            bam.accjs.showException(new Error(
                "Failed to load config dialog."));
          },

          //"onException": function (req, ex) {
          //  bam.accjs.showException(ex);
          //},

          "onSuccess": function (req) {
            self.configHtml = req.responseText;

            if (typeof callback === "function") {
              callback(null, req);
            }
          }
        };

        if (window.Ajax && typeof Ajax.Request === "function") {
          new Ajax.Request("https://www.castopulence.org/js/config.txt", options);
        } else {
          const msg = "Cannot load config dialog because Ajax.Request is not defined.";
          bam.accjs.showExceptionDialog(new Error(msg));
        }
      }
    },

    "getPost": function (e) {
      e = this.getPostElement(e);

      const p = {
        originator: e.find(".originator").text(),
        memberNumber: e.find(".member-number")
          .text()
          .replace("Member #", "")
          .replace(",", "") | 0,
        header: e.find(".header"),
        id: e.get(0).id.replace("post-", "") | 0,
        mockup: e.find("td.content > div > .mockup"),
        post: e,
        src: e.find(".posted-on > a").get(0).href
      };

      if (e.length != 1 || p.header.length != 1 ||
          p.mockup.length != 1)
      {
        throw new Error(
"Invalid argument 'e'. Must be a Number (the post id) or a jQuery object with just the post element selected.");
      }

      return p;
    },

    "getPostElement": function (e) {
      const selector = this.isNumber(e) ? "#post-" + e : e;
      return jQuery(selector);
    },

    "getQuote": function (e) {
      e = jQuery(e);

      const title = e.find(".title"),
            text = title && title.text(),
            name = text.replace(/ said:$/, "");
            link = /^#post-(\d+)/.test(src) ?
                jQuery(src).find(".posted-on a") :
                e.find(".title > a");

      const src = link.attr("href");

      const q = {
        body: e.find(".quote").text().trim(),
        name: name && name.trim() || "",
        src: src && src.trim() || ""
      };

      return q;
    },

    "htmlDecode": function (s) {
      return s.replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");
    },

    "htmlEncode": function (s) {
      return s.replace(/&/g, "&amp;")
          .replace(/'/g, "&#39;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
    },

    "ignoreMember": function (id) {
      jQuery(function () {
        jQuery(".post.m" + id)
            .css("visibility", "hidden")
            .each(function () {
              const e = jQuery(this),
                    post = bam.accjs.getPost(e),
                    html = `
<div class="ignored ${post.id}" style="background-color: #e1c896;top: 0em;position: relative;text-align: center;">
  ${post.originator} is ignored. (<a href="javascript:bam.accjs.showPost(post.id);">Show post.</a>)
</div>`;

              e.before(html);
            });
      });
    },

    "install": function () {
      jQuery(function () {
        //bam.accjs.embedTemplates();

        /*
         * Stop the annoying vuvuzela sound (probably only
         * needed temporarily). ;)
         */
        bam.accjs.stopAudio("#vuvuzela");

        // Also stop the USA anthem. Gets old. ;)
        bam.accjs.stopAudio("#usa-anthem");

        // Add 'load' date/time.
        const date = jQuery("<span>");
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
        jQuery("table[summary='forum header'] td:nth-child(2)")
            .width(750);

        jQuery(document.body)
            .prepend("<div id=\"bam-top\"></div>");

        // Navigation menu additions.
        const extra_nav = `
| <a href="/cc/theme-css" title="View/edit my custom CSS/JS.">css/js</a>
| <a href="https://www.allegro.cc/pm" id="my-inbox-link" title="Your private message inbox.">inbox</a>
| <a href="https://www.allegro.cc/pm/list/outbox" id="my-outbox-link" title="Your private message outbox.">outbox</a>
| <a href="https://www.allegro.cc/pm/compose/" id="my-compose-link" title="Compose a new private message.">compose</a>
| <a href="/cc/forums-settings" id="my-settings-link" title="View/edit your forum settings.">settings</a>
| <a id="my-config-link" title="View/edit your acc.js configuration.">config</a>`

        jQuery("#forum-navigation").find("a:nth-child(5)")
          .after(extra_nav);

        jQuery("#my-config-link").click(function () {
          bam.accjs.showConfig();
        });

        // Last-read and Top links.
        jQuery("#thread-list").find("span.topic a").each(function () {
          const thread_link = jQuery(this),
                maybe_last_post = thread_link.parents("div.topic").find("> a:last-child"),
                last_post = maybe_last_post.length && maybe_last_post || thread_link,
                last_post_href = last_post.attr("href") + "#last_read",
                clone = thread_link.clone(),
                extra_styles = "; float: right; margin-right: 1em;",
                new_style = clone.attr("style") + extra_styles;

          clone.text("Top")
              .attr("style", new_style);

          thread_link.attr("href", last_post_href)
              .after(clone);
        });

        // Post header additions.
        jQuery("#thread .post").each(function (E) {
          const o = bam.accjs.getPost(jQuery(this)),
                html = `
<a href="#post_form" title="Jump to the mockup box.">Mockup</a>
<a href="javascript:bam.accjs.quote(${o.id});" title="Quote this post.">Quote</a>
<a href="/pm/compose/${o.memberNumber}" title="Send a private message to ${o.originator}.">PM</a>
<a href="javascript:bam.accjs.stub(${o.id});" title="Stub quote this post.">Stub</a>
<a href="#bam-top" title="Jump to the top of the page.">Top</a>
<a href="javascript:bam.accjs.downloadCodeZip(${o.id});" title="Download a zip file with all named code tags as its contents.">Zip</a>`;

          o.header.append(html);
        });

        // Add title attribute to cusses. ;)
        jQuery("span.cuss").each(function () {
          const e = jQuery(this);

          e.attr("title", e.text());
        });

        // Wrap terminal at 80 characters.
        jQuery("pre.terminal").each(function () {
          const e = jQuery(this);

          e.css("width", "80em !important")
              .css("white-space", "pre-wrap !important");
        });

        // Add h4x button to show spoilers in read private messages
        // because the A.cc UI doesn't seem to show up, rendering them
        // inaccessible short of scripting hacks.
        (function () {
          if (/\/pm\/read/.test(window.location))
          {
            const getNextId = (function () {
              let id = 0;

              return function () {
                return id++;
              };
            })();

            // h4x: Poll once a second, since A.cc seems to build the DOM
            // dynamically on-demand, and I don't know what, if anything,
            // I can hook into that.
            const interval = setInterval(function () {
              const spoilers = jQuery(".spoiler");

              spoilers.each(function () {
                const e = jQuery(this),
                      id = e.attr("id");

                if (id == null || id == "") {
                  e.attr("id", "spoiler" + getNextId());
                }

                if (jQuery("button#" + e.attr("id")).length === 0) {
                  const button = jQuery("<button type='button'>Show Spoiler</button>");

                  button.click(function () {
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

    "isNumber": function (n) {
      return typeof n === "number" || n instanceof Number;
    },

    "quote": function (id) {
      const post = this.getPost(jQuery("#post-" + id)),
            body = jQuery("#mub-body"),
            quote = this.clonePost(post).trim(),
            html = `
<quote name="${post.originator}" src="${post.src}">
${quote}
</quote>`;

      body.val(body.val() + html);
    },

    "saveConfig": function () {
      console.error(new Error("Error: bam.accjs.saveConfig() is not implemented yet!"));
      return undefined;
      //const profile = jQuery("#acc_js_profile").val();
      //const profileName = jQuery("#acc_js_profile_name");
    },

    "showConfig": function () {
      const loadDialog = bam.accjs.showLoading("dialog");

      bam.accjs.getConfigDialog(loadDialog, function (request, html) {
        jQuery(document.body).append(
            html || requeset.responseText);

        const configDialog = jQuery(document.body).find(
            "#acc_js_config_dialog");

        bam.accjs.closeDialog(loadDialog);

        jQuery("#acc_js_save_config_button").click(function (E) {
          if (bam.accjs.saveConfig())
            bam.accjs.closeDialog(configDialog);
        });

        jQuery("#acc_js_cancel_config_button").click(function (E) {
          bam.accjs.closeDialog(configDialog);
        });
      });
    },

    "showException": function (ex) {
      const source = `
<a href="javascript:bam.accjs.showExceptionVerbose(this.exceptionDialogCount);">Show complete exception.</a>
<p class=".bam-verbose">${jQuery.isFunction(ex.toSource) && ex.toSource()}</p>`;

      const html = `
<div class=".bam-exception-dialog" title="Unhandled Exception Caught">
<p>The following exception was thrown and not handled:</p>
<p>${ex.message}</p>
${source}
</div>`;

      const e = jQuery(document.body).append();

      e.get(0).id = `bam-exception-dialog_${this.exceptionDialogCount}`;
      e.find(".bam-verbose").hide();

      e.dialog({
        "close": function () {
          jQuery(this).remove();
        }
      });

      this.exceptionDialogCount++;
    },

    "showExeptionVerbose": function (id) {
      const e = jQuery($`#bam-exception-dialog_${id}`);

      if (e.length != 1) {
        throw new Error(`Failed to find exception dialog '${id}'.`);
      }

      e.find(".bam-verbose").fadeIn("slow");
    },

    "showLoading": function (what) {
      const html = `
<div id="acc_js_loading_dialog" title="acc.js - Loading...">
  Loading ${what || "something"} from server...
</div>`;

      jQuery(document.body).append(html);

      const loadDialog = jQuery(document.body)
          .find("> div:last-child");

      loadDialog.dialog();

      return loadDialog;
    },

    "showPost": function (e) {
      e = this.getPostElement(e);

      e.css("visibility", "");

      const post = this.getPost(e);

      jQuery(".ignored." + post.id).remove();
    },

    "stopAudio": function (e) {
      jQuery(e).each(function () {

        if (typeof this.pause === "function") {
          this.pause();
        }

        this.currentTime = 0;
      });
    },

    "stripReferenceBlock": function (e) {
      e.find(".ref-block").remove();
    },

    "stripUrlDisclaimers": function (e) {
      /*
       * Remove those "[domain]" warnings that are automatically
       * added after hyperlinks on the backend.
       */
      e.find("span.url").remove();
    },

    "stripXhtmlXmlnsAttribute": function (e) {
      e.find("*[xmlns='http://www.w3.org/1999/xhtml']")
          .removeAttr("xmlns");
    },

    /*
     * It's very hard to get the quoting perfect so as an alternative,
     * this method just appends correct <quote> tags, with name and src,
     * without actually adding any quoted content. This leaves the
     * quoting up to you, but saves you the trouble of scrolling back and
     * forth on the page to copy the username/hyperlink.
     */
    "stub": function (id) {
      const body = jQuery("#mub-body"),
            post = this.getPost("#post-" + id),
            stub = `
<quote name="${post.originator}" src="${post.src}">
</quote>
          `;

      body.val(body.val() + stub);
    },

    "trimWhitespace": function (e) {
      e.contents().filter(function () {
        let e = jQuery(this);

        if (this.nodeType == (Node && Node.TEXT_NODE || 3)) {
          e.val(e.val().trim());
        }
      });
    }
  };

  bam.accjs.addStylesheets();

  for (let name in bam.accjs) {
    if (bam.accjs.hasOwnProperty(name) &&
        !bam.hasOwnProperty(name)) {
      let method = bam.accjs[name];

      if (typeof method === "function") {
        bam[name] = method;
      }
    }
  }
}
