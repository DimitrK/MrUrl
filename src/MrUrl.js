function start() {

                //Not yet used. To track the most used/edited parameters and bubble them up for easier access.
                var cookie = (function() {
                    var cookies;

                    function writeCookie(c_name, value, exdays) {
                        var exdate = new Date();
                        exdate.setDate(exdate.getDate() + exdays);
                        var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
                        document.cookie = c_name + "=" + c_value;
                    }

                    function readCookie(name, c, C, i) {
                        if (cookies) {
                            return cookies[name];
                        }

                        c = document.cookie.split('; ');
                        cookies = {};

                        for (i = c.length - 1; i >= 0; i--) {
                            C = c[i].split('=');
                            cookies[C[0]] = C[1];
                        }

                        return cookies[name];
                    }
                    return { read: readCookie, write: writeCookie };
                })();


                /**
                 * This function takes a text that has wildcards `{!<integer>}` and returns a new
                 * function that based on its parameters, replaces the wildcard numbers with the
                 * corresponding index of the arguments collection. E.g:
                 * `template('Hello {!1} {!0}').render("world", "JS")` outputs: "Hello JS World"
                 * @param {string} text The text with the wildcards to be formatted
                 */

                var template = function(text) {
                    var regx = /\{\!(\d)\}/;
                    var match;
                    return {
                        render: function() {
                            var args = Array.prototype.slice.apply(arguments);
                            while ((match = regx.exec(text)) !== null) {
                                text = text.replace(match[0], args[(+match[1])]);
                            }
                            return text;
                        }
                    };
                };



                /**
                 * The main container holds the functionality about the main skeleton of the plugin
                 * and also the logic for the submit button which handles the URL processing with the
                 * new parameters.
                 * @param {string} seed The random generated seed for creating the CSS classes.
                 */

                function MainContainer(seed) {
                    this.children = []; // holds a collection of UrlParams objects
                    this.seed = seed;   // The random seed for the plugin
                    return this;
                }
                MainContainer.prototype.initialize = function(containerLogo, styles, urlhostname) {
                    this.el = document.createElement('div');
                    this.el.className = this.seed + 'url-main';
                    this.el.insertAdjacentHTML('afterbegin', styles);
                    this.el.insertAdjacentHTML('beforeend', containerLogo);
                    this.el.querySelector('button').onclick = this.submit.bind(this, urlhostname);
                };

                MainContainer.prototype.submit = function(urlhostname) {
                    var newUrl = [];
                    this.children.forEach(function(child, index, arr) {
                        if (!child.deleted) {
                            var finalvalue = (child.uservalue || child.value);
                            newUrl.push(child.name + '=' + finalvalue);
                            if (child.name === 'market') {
                                var marketdetect = /\/TAP(\w+)\//gi;
                                var currentmarket = marketdetect.exec(urlhostname);
                                urlhostname = urlhostname.replace(currentmarket[1], finalvalue);
                            }
                        }
                    });
                    location.href = urlhostname + '?' + newUrl.join('&');
                };

                MainContainer.prototype.add = function(child) {
                    this.children.push(child);
                    this.el.querySelector('.container').appendChild(child.el);
                };


                /**
                 * Each url param object corresponds to exactly one GET param and is responsible
                 * for rendering each input box with title and JavaScript logic for input
                 * events such as : `click` & `delete`. Also holds name , initial and edited values
                 * of the param and a status of if the param is deleted or not.
                 * @param {string} param The name of the parameter
                 * @param {type} seed The random generated seed that will used for CSS
                 */

                function UrlParam(param, seed) {
                    var destructed = param.split('=');
                    this.name = destructed[0];
                    this.value = destructed[1];
                    this.uservalue = undefined;
                    this.seed = seed;
                    this.deleted = false;
                    return this;
                };
                UrlParam.prototype.initialize = function($main, $text, $button) {
                    this.el = document.createElement('div');
                    this.el.className = this.seed + 'inline';
                    if (this.value.length < 13) {
                        $text = template($text).render(this.name, this.value, this.seed);
                    } else {
                        $text = template($button).render(this.name, this.value, this.seed);
                    }
                    this.el.insertAdjacentHTML('beforeend', template($main).render(this.name, $text));

                    $text = this.el.querySelector('input[type=\'text\']');
                    $button = this.el.querySelector('input[type=\'button\']');
                    $text && ($text.onclick = this.click.bind(this));
                    $text && ($text.onblur = this.click.bind(this));
                    $button && ($button.onclick = this.click.bind(this));
                    this.el.querySelector('input[type=\'checkbox\']').onclick = this.delete.bind(this);
                }

                UrlParam.prototype.click = function() {
                    var $input = this.el.querySelector('input[type=\'text\']'); // The editable input
                    var $button = this.el.querySelector('input[type=\'button\']'); // The show more button
                    if ($button) {
                        this.uservalue = window.prompt(this.uservalue || this.value) || this.uservalue || this.value;
                        $input.value = this.uservalue || this.value;
                        return;
                    }

                    if ($input.className.indexOf('disabled') !== -1) {
                        $input.className = $input.className.replace('disabled', '');
                        this.uservalue = $input.value || this.uservalue;
                        $input.value = this.uservalue || this.value;
                        $input.placeholder = this.uservalue || this.value;

                    } else {
                        $input.className += 'disabled';
                        this.uservalue = $input.value || this.uservalue || this.value;
                        $input.placeholder = this.uservalue;
                        $input.value = '';
                    }

                    if (this.uservalue && this.uservalue !== this.value && this.el.className.indexOf('edited') === -1) {
                        this.el.className += ' edited ';
                    }
                    if (this.value && this.uservalue === this.value) {
                        this.el.className = this.el.className.replace(' edited ', '');
                    }
                };


                UrlParam.prototype.delete = function() {
                    var $label = this.el.querySelector('label');
                    var $input = this.el.querySelector('input[type=\'text\']');
                    if ($label.className.indexOf('deleted') === -1) {
                        $label.className += ' deleted ';
                        $input.className += ' deleted ';
                        this.deleted = true;
                    } else {
                        $label.className = $label.className.replace(' deleted ', '');
                        $input.className = $input.className.replace(' deleted ', '');
                        this.deleted = false;
                    }
                };


                // The CSS styles required by the plugin.
                var styles = '<style type=\'text/css\'> .{!0}url-main {max-height: 690px; overflow-y: auto; position: fixed; background-color: rgba(255, 255, 255, 0.9); font-size: 14px; border: 7px lightsteelblue solid; padding: 1em 1em; border-radius: 1em; width: 230px; top: 1em; right:1em; z-index: 2147483647; } .{!0}url-main container{width: 100%;}  .{!0}inline { zoom: 1; /*IE*/ display: block; border-radius: 5px; background-color: rgb(241, 241, 241); border: 3px solid rgb(213, 213, 213); margin-bottom: 4px; } .{!0}inline.edited { border: 3px solid rgb(197, 231, 186); }  .{!0}inline:nth-of-type(2n) { background-color:rgb(226, 226, 236); } .{!0}inline>* { display:inline-block; } .{!0}inline>input {  margin:0; padding:0; float:right; border-radius:5px; height: 25px; font-size:14px; color:rgb(100, 10, 50);  box-shadow: inset 0px 0px 4px gray; border: 0px none; } .{!0}inline>input[type=\'button\']{background: linear-gradient(rgb(109, 109, 109), rgb(80, 73, 65)) repeat scroll 0% 0% rgb(80, 73, 73);} .{!0}inline>input[type=\'checkbox\'] { font-size:3px; position:absolute; width:9px; right:0; } .{!0}inline>input.disabled { background-color: rgb(248, 248, 248); } .{!0}inline>input.deleted { background-color: rgb(247, 209, 209); } .{!0}inline>label.deleted { color: rgb(190, 41, 41); text-decoration: line-through; } .{!0}inline>label { width: 75px; vertical-align:sub; vertical-align:-webkit-baseline-middle; word-wrap:break-word; } .{!0}inline:before, .{!0}inline:after { content:\'\'; display: table; clear: both; } .{!0}url-main button { width:100%; } .{!0}url-main logo { font-style: italic; font-size: .6em; color: gray; } .{!0}url-main a {font-size: 1em; text-decoration: none; color: inherit; text-transform: none; font-family: sans-serif;} button {position: relative; font: 700 13px/1em "Trebuchet MS",sans-serif; padding: 6px 10px 7px; text-align: center; text-decoration: none; color: rgb(255, 255, 255); cursor: pointer; background: linear-gradient(rgb(102, 155, 225), rgb(87, 132, 191)) repeat scroll 0% 0% rgb(87, 132, 191); text-shadow: 0px 1px 0px rgba(0, 0, 0, 0.5); border-radius: 6px 6px 6px 6px; box-shadow: 0px 1px rgba(0, 0, 0, 0.1), 0px -2px rgba(0, 0, 0, 0.1) inset; border: 0px none; } </style> ';

                // The HTML containers that will possibly needed.
                var $main = '<label for=\'{!0}\'>{!0}:</label> {!1}<input type=\'checkbox\' id=\'chk_{!0}\'/>';
                var $text = '<input type=\'text\' name=\'{!0}\' id=\'{!0}\' placeholder=\'{!1}\' class=\'disabled\' size=\'13\' />';
                var $button = '<input type=\'text\'  id=\'{!0}\'  style=\'display:none\' value=\'{!1}\'  />  <input type=\'button\' name=\'{!0}\' id=\'btn_{!0}\' value=\'more\' size=\'13\' /> ';
                var containerLogo = '<div class=\'container\'></div><button>Done</button><logo><a target="_blank" href=\'https://twitter.com/jimfeedback\'>Dimk </a> @ anixe</logo>'


                /**
                * In this function there is all the initialization done when it is called. See it as the Facade for the whole plugin
                *    - Checks the url and decomposes it to host and GET params,
                *    - Builds the styles with the random seed,
                *    - Initializes the main container of the plugin
                *    - Initializes a UrlParam Object for each GET param and adds it to the main container.
                */
                var container = function() {
                    var urlhostname, urlparams;
                    var url = location.href;
                    var seed = getSeed();
                    if (url.indexOf('?') > -1) {
                        url = url.split('?');
                        urlhostname = url[0];
                        urlparams = url[1].split('&'); // Deconstruct Url Paramaters
                    } else {
                        urlhostname = [url];
                        urlparams = [];
                    }
                    var formattedStyles = template(styles).render(seed);
                    var mainContainer = new MainContainer(seed);
                    mainContainer.initialize(containerLogo, formattedStyles, urlhostname);
                    urlparams.forEach(function(param) {
                        if (param.split('=').length > 1) {
                            var urlparam = new UrlParam(param, seed);
                            urlparam.initialize($main, $text, $button);
                            mainContainer.add(urlparam);
                        }
                    });

                    return mainContainer;
                };



                /**
                * Returns a random number. Is used to give to CSS classes unique presence so there won't be any
                * possibly name collision with other classes
                */
                function getSeed() {
                    var seed = '';
                    var num = Date.now().toString();
                    for (var i = 0; i < num.length; i++) {
                        seed += String.fromCharCode(50 + num[i]);
                    }
                    return seed;
                }


                /**
                * In this section there is the check if the plugin is present on the page or not so we ll toggle its presence
                */

                var shouldinit = true; // Flag to know if should start the plugin or should close it
                var pluginIdRegex = /(?=)url-main/; // The css class RegExp
                var candidateNodes = document.querySelectorAll('body>div'); // The nodes direct children of body since the plugin can be one of them

                // Search through the nodes to see if any of these has a class that matches the plugin main class name according to RegExp
                for (var i = 0; i < candidateNodes.length; i++) {
                    if (pluginIdRegex.test(candidateNodes[i].className)) {
                        document.body.removeChild(candidateNodes[i]);
                        shouldinit = false;
                    }
                }
                if (shouldinit) {
                    document.body.appendChild(container().el);
                }

            };
